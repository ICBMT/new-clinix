<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Contracts\ClinicEarningRepositoryInterface;
use App\Models\ClinicEarning;
use App\Models\ClinicPayout;
use App\Models\EarningHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class EarningsManagementController extends Controller
{
    public function __construct(
        private readonly ClinicEarningRepositoryInterface $earningRepository
    ) {}

    /**
     * Display a listing of clinic earnings
     */
    public function index(Request $request): Response
    {
        Gate::authorize('earnings.view');
        
        $perPage = $request->get('per_page', 15);
        $status = $request->get('status', 'all');
        $clinicId = $request->get('clinic_id');
        $search = $request->get('search');
        $createdFrom = $request->get('created_from');
        $createdTo = $request->get('created_to');
        
        $query = ClinicEarning::with([
            'clinic.owner', 
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'user_id', 'total_amount');
            }, 
            'booking.user'
        ]);
        
        // Filter by clinic for clinic/clinic_manager roles
        $user = $request->user();
        if ($user->hasRole(['clinic', 'clinic_manager'])) {
            $clinicIds = $user->clinics()->pluck('clinics.id')->toArray();
            if ($user->hasRole('clinic')) {
                $ownedClinicIds = \App\Models\Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
                $clinicIds = array_unique(array_merge($clinicIds, $ownedClinicIds));
            }
            if (!empty($clinicIds)) {
                $query->whereIn('clinic_id', $clinicIds);
            } else {
                // User has no associated clinics, return empty result
                $query->whereRaw('1 = 0');
            }
        }
        
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        if ($clinicId) {
            $query->where('clinic_id', $clinicId);
        }
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('clinic', function($clinicQuery) use ($search) {
                    $clinicQuery->where('name_en', 'LIKE', "%{$search}%")
                                ->orWhere('name_ar', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('booking', function($bookingQuery) use ($search) {
                    $bookingQuery->where('booking_reference', 'LIKE', "%{$search}%");
                });
            });
        }
        
        if ($createdFrom) {
            $query->whereDate('created_at', '>=', $createdFrom);
        }
        
        if ($createdTo) {
            $query->whereDate('created_at', '<=', $createdTo);
        }
        
        $earnings = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform earnings to include booking_reference and calculated values
        $earnings->getCollection()->transform(function ($earning) {
            $earning->booking_reference = $earning->booking?->booking_reference;
            
            // Ensure gross_amount is properly set - use booking total_amount as fallback if gross_amount is missing or 0
            $grossAmount = (float) ($earning->gross_amount ?? 0);
            if ($grossAmount <= 0 && $earning->booking?->total_amount) {
                $grossAmount = (float) $earning->booking->total_amount;
            }
            $earning->gross_amount = (string) round($grossAmount, 2);
            
        // Calculate current values based on site settings and clinic owner commission
        // Wrap in try-catch to prevent crashes if calculation fails
        try {
            $calculated = $earning->calculateCurrentValues();
            
            // Add calculated values as attributes (these will be included in JSON response)
            // Round all values to 2 decimal places to avoid floating point precision issues
            $earning->calculated_commission_rate = round($calculated['commission_rate'], 2);
            $earning->calculated_commission_amount = round($calculated['commission_amount'], 2);
            $earning->calculated_platform_fee = round($calculated['platform_fee'], 2);
            $earning->calculated_fixed_charges = 0; // Fixed charges removed
            $earning->calculated_net_amount = round($calculated['net_amount'], 2);
            
            // Calculate remaining amount (net_amount - paid_amount) - can be negative
            $paidAmount = round((float) ($earning->paid_amount ?? 0), 2);
            $netAmount = round($calculated['net_amount'], 2);
            $earning->remaining_amount = round($netAmount - $paidAmount, 2);
        } catch (\Exception $e) {
            // Log error and use stored values as fallback
            \Illuminate\Support\Facades\Log::error('Error calculating earning values', [
                'earning_id' => $earning->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Use stored values as fallback
            $earning->calculated_commission_rate = round((float) ($earning->commission_rate ?? 0), 2);
            $earning->calculated_commission_amount = round((float) ($earning->commission_amount ?? 0), 2);
            $earning->calculated_platform_fee = round((float) ($earning->platform_fee ?? 0), 2);
            $earning->calculated_fixed_charges = 0; // Fixed charges removed
            $earning->calculated_net_amount = round((float) ($earning->net_amount ?? 0), 2);
            
            $paidAmount = round((float) ($earning->paid_amount ?? 0), 2);
            $netAmount = round((float) ($earning->net_amount ?? 0), 2);
            $earning->remaining_amount = round(max(0, $netAmount - $paidAmount), 2);
        }
            
            // Ensure all amount fields are properly formatted as strings for JSON consistency
            $earning->commission_amount = (string) round((float) ($earning->commission_amount ?? 0), 2);
            $earning->platform_fee = (string) round((float) ($earning->platform_fee ?? 0), 2);
            $earning->fixed_charges = '0'; // Fixed charges removed
            $earning->net_amount = (string) round((float) ($earning->net_amount ?? 0), 2);
            $earning->paid_amount = (string) round((float) ($earning->paid_amount ?? 0), 2);
            $earning->commission_rate = (string) round((float) ($earning->commission_rate ?? 0), 2);
            
            return $earning;
        });

        // Get summary statistics using calculated values
        // Use the same query base to respect role-based filtering
        $statsQuery = ClinicEarning::query();
        
        // Apply same role-based filtering as main query
        if ($user->hasRole(['clinic', 'clinic_manager'])) {
            $clinicIds = $user->clinics()->pluck('clinics.id')->toArray();
            if ($user->hasRole('clinic')) {
                $ownedClinicIds = \App\Models\Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
                $clinicIds = array_unique(array_merge($clinicIds, $ownedClinicIds));
            }
            if (!empty($clinicIds)) {
                $statsQuery->whereIn('clinic_id', $clinicIds);
            } else {
                $statsQuery->whereRaw('1 = 0');
            }
        }
        
        // Apply same clinic filter if provided
        if ($clinicId) {
            $statsQuery->where('clinic_id', $clinicId);
        }
        
        // Apply same search filter if provided
        if ($search) {
            $statsQuery->where(function($q) use ($search) {
                $q->whereHas('clinic', function($clinicQuery) use ($search) {
                    $clinicQuery->where('name_en', 'LIKE', "%{$search}%")
                                ->orWhere('name_ar', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('booking', function($bookingQuery) use ($search) {
                    $bookingQuery->where('booking_reference', 'LIKE', "%{$search}%");
                });
            });
        }
        
        // Apply same date filters if provided
        if ($createdFrom) {
            $statsQuery->whereDate('created_at', '>=', $createdFrom);
        }
        if ($createdTo) {
            $statsQuery->whereDate('created_at', '<=', $createdTo);
        }
        
        // Get all earnings for stats calculation (respecting filters)
        $allEarnings = $statsQuery->get();
        
        $totalPending = 0;
        $totalPaid = 0;
        $totalCommission = 0;
        $totalPlatformFee = 0;
        $totalFixedCharges = 0;
        $totalGross = 0;
        $pendingCount = 0;
        $paidCount = 0;
        $allCount = $allEarnings->count();
        
        foreach ($allEarnings as $earning) {
            $calculated = $earning->calculateCurrentValues();
            
            $totalGross += (float) $earning->gross_amount;
            $totalCommission += $calculated['commission_amount'];
            $totalPlatformFee += $calculated['platform_fee'];
            // Fixed charges removed - no longer calculated
            
            if ($earning->status === 'pending') {
                // For pending earnings, calculate remaining amount (net_amount - paid_amount)
                $netAmount = $calculated['net_amount'];
                $paidAmount = (float) ($earning->paid_amount ?? 0);
                $remainingAmount = max(0, $netAmount - $paidAmount);
                $totalPending += $remainingAmount;
                $pendingCount++;
            } else {
                $totalPaid += $calculated['net_amount'];
                $paidCount++;
            }
        }
        
        // Round all stats to 2 decimal places to avoid floating point precision issues
        $stats = [
            'total_pending' => round($totalPending, 2),
            'total_paid' => round($totalPaid, 2),
            'total_commission' => round($totalCommission, 2),
            'total_platform_fee' => round($totalPlatformFee, 2),
            'total_fixed_charges' => 0, // Fixed charges removed
            'pending_count' => $pendingCount,
            'paid_count' => $paidCount,
            'all_count' => $allCount,
            'total_gross' => round($totalGross, 2),
        ];

        // Get clinics for filter
        $clinics = \App\Models\Clinic::select('id', 'name_en', 'name_ar')
            ->orderBy('name_en')
            ->get();

        return Inertia::render('dashboard/earnings/index', [
            'earnings' => $earnings,
            'stats' => $stats,
            'clinics' => $clinics,
            'filters' => [
                'status' => $status,
                'clinic_id' => $clinicId,
                'search' => $search,
                'created_from' => $createdFrom,
                'created_to' => $createdTo,
            ],
        ]);
    }

    /**
     * Show earning details
     */
    public function show(int $id): Response
    {
        Gate::authorize('earnings.show');
        
        $earning = ClinicEarning::with([
            'clinic.owner',
            'clinic.category',
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'user_id', 'total_amount', 'payment_status');
            },
            'booking.user',
            'payout',
            'history.processedBy' => function($q) {
                $q->select('id', 'name', 'email');
            }
        ])->findOrFail($id);

        // Add booking_reference to earning for easy access
        $earning->booking_reference = $earning->booking?->booking_reference;
        
        // Calculate current values based on site settings and clinic owner commission
        // Wrap in try-catch to prevent crashes if calculation fails
        try {
            $calculated = $earning->calculateCurrentValues();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error calculating earning values', [
                'earning_id' => $earning->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Fallback to stored values if calculation fails
            $calculated = [
                'commission_rate' => (float) ($earning->commission_rate ?? 0),
                'commission_amount' => (float) ($earning->commission_amount ?? 0),
                'platform_fee' => (float) ($earning->platform_fee ?? 0),
                'fixed_charges' => 0, // Fixed charges removed
                'net_amount' => (float) ($earning->net_amount ?? 0),
            ];
        }
        
        // Add calculated values as attributes (these will be included in JSON response)
        // Round all values to 2 decimal places to avoid floating point precision issues
        $earning->calculated_commission_rate = round($calculated['commission_rate'], 2);
        $earning->calculated_commission_amount = round($calculated['commission_amount'], 2);
        $earning->calculated_platform_fee = round($calculated['platform_fee'], 2);
        $earning->calculated_fixed_charges = round($calculated['fixed_charges'], 2);
        $earning->calculated_net_amount = round($calculated['net_amount'], 2);
        
        // Calculate remaining amount (net_amount - paid_amount)
        $paidAmount = round((float) ($earning->paid_amount ?? 0), 2);
        $netAmount = round($calculated['net_amount'], 2);
        $earning->remaining_amount = round(max(0, $netAmount - $paidAmount), 2);

        return Inertia::render('dashboard/earnings/show', [
            'earning' => $earning,
        ]);
    }

    /**
     * Get clinics with pending earnings for payout processing
     */
    public function getClinicsWithPendingEarnings(): JsonResponse
    {
        Gate::authorize('earnings.process');
        
        $clinicsWithEarnings = ClinicEarning::where(function($q) {
                // Include fully pending earnings or partially paid earnings
                $q->where(function($subQ) {
                    $subQ->whereNull('payout_id')
                         ->where('status', 'pending');
                })
                ->orWhere(function($subQ) {
                    // Include earnings that are partially paid (paid_amount < net_amount)
                    $subQ->whereColumn('paid_amount', '<', 'net_amount')
                         ->where('status', 'pending');
                });
            })
            ->with(['clinic.owner', 'booking'])
            ->get()
            ->groupBy('clinic_id');

        $result = [];
        foreach ($clinicsWithEarnings as $clinicId => $earnings) {
            $clinic = $earnings->first()->clinic;
            if (!$clinic) continue;
            
            // Calculate totals using current values (from site settings and clinic owner commission)
            $totalNetAmount = 0;
            $totalRemainingAmount = 0;
            $totalCommission = 0;
            $totalPlatformFee = 0;
            $totalFixedCharges = 0;
            $totalGross = 0;
            
            $earningsData = [];
            foreach ($earnings as $earning) {
                // Calculate current values based on site settings and clinic owner commission
                $calculated = $earning->calculateCurrentValues();
                
                $netAmount = $calculated['net_amount'];
                $paidAmount = (float) ($earning->paid_amount ?? 0);
                $remainingAmount = $netAmount - $paidAmount; // Can be negative
                
                $totalNetAmount += $netAmount;
                $totalRemainingAmount += max(0, $remainingAmount); // Only count positive for total available
                $totalCommission += $calculated['commission_amount'];
                $totalPlatformFee += $calculated['platform_fee'];
                // Fixed charges removed - no longer calculated
                $totalGross += (float) $earning->gross_amount;
                
                // Round individual earning values to 2 decimal places
                $earningsData[] = [
                    'id' => $earning->id,
                    'booking_reference' => $earning->booking?->booking_reference,
                    'gross_amount' => round((float) $earning->gross_amount, 2),
                    'net_amount' => round($netAmount, 2), // Use calculated value, rounded
                    'paid_amount' => round($paidAmount, 2),
                    'remaining_amount' => round($remainingAmount, 2),
                    'commission_amount' => round($calculated['commission_amount'], 2), // Use calculated value, rounded
                    'platform_fee' => round($calculated['platform_fee'], 2), // Use calculated value, rounded
                    'fixed_charges' => 0, // Fixed charges removed
                    'currency' => $earning->currency,
                    'created_at' => $earning->created_at->toISOString(),
                ];
            }
            
            // Round all totals to 2 decimal places to avoid floating point precision issues
            $result[] = [
                'clinic_id' => $clinicId,
                'clinic_name_en' => $clinic->name_en,
                'clinic_name_ar' => $clinic->name_ar,
                'owner_name' => $clinic->owner?->name,
                'total_net_amount' => round($totalNetAmount, 2),
                'total_remaining_amount' => round($totalRemainingAmount, 2),
                'total_commission' => round($totalCommission, 2),
                'total_platform_fee' => round($totalPlatformFee, 2),
                'total_fixed_charges' => 0, // Fixed charges removed
                'total_gross' => round($totalGross, 2),
                'earnings_count' => $earnings->count(),
                'earnings' => $earningsData,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Generate payout for a clinic from earnings
     */
    public function generatePayout(Request $request, int $clinicId): RedirectResponse
    {
        Gate::authorize('earnings.process');
        
        $request->validate([
            'payout_reference' => ['required', 'string', 'max:255', 'unique:clinic_payouts,payout_reference'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'earning_ids' => ['nullable', 'array'],
            'earning_ids.*' => ['required', 'integer', 'exists:clinic_earnings,id'],
        ]);

        try {
            return DB::transaction(function () use ($request, $clinicId) {
                // Get pending earnings for this clinic (including partially paid)
                $query = ClinicEarning::where('clinic_id', $clinicId)
                    ->where(function($q) {
                        // Include fully pending earnings or partially paid earnings
                        $q->where(function($subQ) {
                            $subQ->whereNull('payout_id')
                                 ->where('status', 'pending');
                        })
                        ->orWhere(function($subQ) {
                            // Include earnings that are partially paid (paid_amount < net_amount)
                            $subQ->whereColumn('paid_amount', '<', 'net_amount')
                    ->where('status', 'pending');
                        });
                    });

                // If specific earnings are selected, filter by them
                if ($request->has('earning_ids') && !empty($request->earning_ids)) {
                    $query->whereIn('id', $request->earning_ids);
                }

                $earnings = $query->with(['clinic.owner'])->get();

                if ($earnings->isEmpty()) {
                    return redirect()->route('dashboard.earnings.index')
                        ->with('error', __('common.no_pending_earnings'));
                }

                // Calculate totals using current values (from site settings and clinic owner commission)
                $totalNetAmount = 0;
                $totalRemainingAmount = 0;
                $totalCommission = 0;
                $totalPlatformFee = 0;
                $totalFixedCharges = 0;
                
                foreach ($earnings as $earning) {
                    $calculated = $earning->calculateCurrentValues();
                    $netAmount = $calculated['net_amount'];
                    $paidAmount = (float) ($earning->paid_amount ?? 0);
                    $remainingAmount = $netAmount - $paidAmount;
                    
                    $totalNetAmount += $netAmount;
                    $totalRemainingAmount += max(0, $remainingAmount); // Only count positive remaining
                    $totalCommission += $calculated['commission_amount'];
                    $totalPlatformFee += $calculated['platform_fee'];
                    // Fixed charges removed - no longer calculated
                }
                
                // Round all totals to 2 decimal places to avoid floating point precision issues
                $totalNetAmount = round($totalNetAmount, 2);
                $totalRemainingAmount = round($totalRemainingAmount, 2);
                $totalCommission = round($totalCommission, 2);
                $totalPlatformFee = round($totalPlatformFee, 2);
                $totalFixedCharges = round($totalFixedCharges, 2);
                $totalDeductions = round($totalCommission + $totalPlatformFee + $totalFixedCharges, 2);

                // Validate payout amount doesn't exceed remaining available
                // Round both values to 2 decimal places to avoid floating point precision issues
                $requestedAmount = round((float) $request->amount, 2);
                $roundedTotalRemaining = $totalRemainingAmount; // Already rounded above
                if ($requestedAmount > $roundedTotalRemaining) {
                    return redirect()->route('dashboard.earnings.index')
                        ->with('error', __('common.payout_amount_exceeds_available', [
                            'available' => number_format($roundedTotalRemaining, 2),
                            'requested' => number_format($requestedAmount, 2),
                        ]));
                }

                // Calculate actual gross amount
                $actualGrossAmount = $requestedAmount + $totalDeductions;

                // Create payout record
                $payout = ClinicPayout::create([
                    'clinic_id' => $clinicId,
                    'payout_reference' => $request->payout_reference,
                    'total_amount' => $actualGrossAmount,
                    'commission_deducted' => $totalCommission,
                    'net_amount' => $requestedAmount,
                    'currency' => 'KWD',
                    'status' => 'approved',
                    'frequency' => 'manual',
                    'payout_date' => now()->format('Y-m-d'),
                    'admin_notes' => $request->notes,
                    'processed_by' => $request->user()->id,
                    'processed_at' => now(),
                    'date_approved' => now(),
                ]);

                // Distribute payout amount across earnings proportionally
                // Calculate remaining amount for each earning and distribute proportionally
                $earningsWithRemaining = [];
                $totalRemaining = 0;
                
                foreach ($earnings as $earning) {
                    $calculated = $earning->calculateCurrentValues();
                    $netAmount = $calculated['net_amount'];
                    $paidAmount = (float) ($earning->paid_amount ?? 0);
                    $remainingAmount = max(0, $netAmount - $paidAmount);
                    
                    if ($remainingAmount > 0) {
                        $earningsWithRemaining[] = [
                            'earning' => $earning,
                            'remaining' => $remainingAmount,
                            'net_amount' => $netAmount,
                        ];
                        $totalRemaining += $remainingAmount;
                    }
                }
                
                // Distribute the payout amount across earnings and save to earning_history
                $distributedAmount = 0;
                foreach ($earningsWithRemaining as $index => $item) {
                    $earning = $item['earning'];
                    $remaining = $item['remaining'];
                    $netAmount = $item['net_amount'];
                    
                    // Calculate proportional amount for this earning
                    if ($index === count($earningsWithRemaining) - 1) {
                        // Last earning gets the remainder to avoid rounding issues
                        $amountForThisEarning = $requestedAmount - $distributedAmount;
                    } else {
                        $amountForThisEarning = ($remaining / $totalRemaining) * $requestedAmount;
                    }
                    
                    $distributedAmount += $amountForThisEarning;
                    
                    // Round to 2 decimal places
                    $amountForThisEarning = round($amountForThisEarning, 2);
                    
                    // Get current paid amount and remaining amounts
                    $currentPaidAmount = (float) ($earning->paid_amount ?? 0);
                    $remainingBefore = $netAmount - $currentPaidAmount;
                    $newPaidAmount = $currentPaidAmount + $amountForThisEarning;
                    $remainingAfter = max(0, $netAmount - $newPaidAmount);
                    
                    // Determine status: paid if fully paid, otherwise pending
                    $isFullyPaid = $newPaidAmount >= $netAmount;
                    
                    // Save to earning_history
                    EarningHistory::create([
                        'earning_id' => $earning->id,
                        'payout_id' => $payout->id,
                        'payout_reference' => $request->payout_reference,
                        'amount_paid' => $amountForThisEarning,
                        'remaining_amount_before' => round($remainingBefore, 2),
                        'remaining_amount_after' => round($remainingAfter, 2),
                        'currency' => $earning->currency,
                        'notes' => $request->notes,
                        'processed_by' => $request->user()->id,
                        'processed_at' => now(),
                    ]);
                    
                    // Update earning's paid_amount
                    $updateData = [
                        'paid_amount' => min($newPaidAmount, $netAmount), // Don't exceed net_amount
                    ];
                    
                    // Only update payout_id and paid_at if fully paid
                    if ($isFullyPaid) {
                        $updateData['payout_id'] = $payout->id;
                        $updateData['status'] = 'paid';
                        $updateData['paid_at'] = now();
                    } else {
                        // For partial payments, keep status as pending and don't set payout_id
                        $updateData['status'] = 'pending';
                    }
                    
                    $earning->update($updateData);
                }

                return redirect()->route('dashboard.earnings.index')
                    ->with('success', __('common.payout_generated_successfully'));
            });
        } catch (\Exception $e) {
            return redirect()->route('dashboard.earnings.index')
                ->with('error', __('common.error_generating_payout') . (config('app.debug') ? ': ' . $e->getMessage() : ''));
        }
    }

    /**
     * Recalculate earnings based on current site settings and clinic owner's commission
     */
    public function recalculate(Request $request): RedirectResponse
    {
        Gate::authorize('earnings.process');
        
        $earningId = $request->input('earning_id');
        
        try {
            return DB::transaction(function () use ($earningId) {
                if ($earningId) {
                    // Recalculate single earning
                    $earning = ClinicEarning::with(['clinic.owner', 'booking'])->findOrFail($earningId);
                    $earning->recalculate();
                    
                    return redirect()->route('dashboard.earnings.index')
                        ->with('success', __('common.earning_recalculated_successfully'));
                } else {
                    // Recalculate all pending earnings
                    $earnings = ClinicEarning::with(['clinic.owner', 'booking'])
                        ->where('status', 'pending')
                        ->get();
                    
                    $count = 0;
                    foreach ($earnings as $earning) {
                        $earning->recalculate();
                        $count++;
                    }
                    
                    return redirect()->route('dashboard.earnings.index')
                        ->with('success', __('common.earnings_recalculated_successfully', ['count' => $count]));
                }
            });
        } catch (\Exception $e) {
            return redirect()->route('dashboard.earnings.index')
                ->with('error', __('common.error_recalculating_earnings') . (config('app.debug') ? ': ' . $e->getMessage() : ''));
        }
    }
}
