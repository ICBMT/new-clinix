<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Contracts\ClinicPayoutRepositoryInterface;
use App\Models\ClinicPayout;
use App\Models\ClinicEarning;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class PayoutManagementController extends Controller
{
    public function __construct(
        private readonly ClinicPayoutRepositoryInterface $payoutRepository
    ) {}

    /**
     * Display a listing of payouts
     */
    public function index(Request $request): Response
    {
        Gate::authorize('payouts.view');
        
        $perPage = $request->get('per_page', 15);
        $status = $request->get('status', 'all');
        $frequency = $request->get('frequency', 'all');
        
        $query = ClinicPayout::with(['clinic.owner', 'processedBy', 'earnings']);
        
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
        
        if ($frequency !== 'all') {
            $query->where('frequency', $frequency);
        }
        
        $payouts = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Get summary statistics
        $stats = [
            'total_pending' => (float) (ClinicPayout::where('status', 'pending')->sum('net_amount') ?? 0),
            'total_approved' => (float) (ClinicPayout::where('status', 'approved')->sum('net_amount') ?? 0),
            'total_commission' => (float) (ClinicEarning::sum('commission_amount') ?? 0),
            'pending_count' => (int) (ClinicPayout::where('status', 'pending')->count() ?? 0),
        ];

        return Inertia::render('dashboard/payouts/index', [
            'payouts' => $payouts,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
                'frequency' => $frequency,
            ],
        ]);
    }

    /**
     * Show payout details
     */
    public function show(int $id): Response
    {
        Gate::authorize('payouts.show');
        
        $payout = ClinicPayout::with(['clinic.owner', 'clinic.category', 'earnings.booking.user', 'processedBy'])
            ->findOrFail($id);

        return Inertia::render('dashboard/payouts/show', [
            'payout' => $payout,
        ]);
    }

    /**
     * Process pending payouts
     */
    public function processPayouts(Request $request): RedirectResponse
    {
        Gate::authorize('payouts.process');
        
        return $this->withTransaction(function () use ($request) {
            $frequency = $request->input('frequency', 'monthly');
            
            // Get clinics with pending earnings
            $clinicsWithEarnings = ClinicEarning::whereNull('payout_id')
                ->where('status', 'pending')
                ->with('clinic')
                ->get()
                ->groupBy('clinic_id');

            $processedCount = 0;

            foreach ($clinicsWithEarnings as $clinicId => $earnings) {
                $totalAmount = $earnings->sum('net_amount');
                $totalCommission = $earnings->sum('commission_amount');
                
                if ($totalAmount > 0) {
                    // Create payout record
                    $payout = ClinicPayout::create([
                        'clinic_id' => $clinicId,
                        'payout_reference' => $this->generateReference(),
                        'total_amount' => $totalAmount + $totalCommission,
                        'commission_deducted' => $totalCommission,
                        'net_amount' => $totalAmount,
                        'currency' => 'KWD',
                        'status' => 'pending',
                        'frequency' => $frequency,
                        'payout_date' => $this->getNextPayoutDate($frequency),
                    ]);

                    // Associate earnings with payout
                    $earnings->each(function ($earning) use ($payout) {
                        $earning->update(['payout_id' => $payout->id]);
                    });

                    $processedCount++;
                }
            }

            return back()->with('success', __('common.payouts_processed_successfully', ['count' => $processedCount]));
        });
    }

    /**
     * Mark payout as completed/approved
     */
    public function markCompleted(Request $request, int $id): RedirectResponse
    {
        Gate::authorize('payouts.mark-completed');
        
        $payout = ClinicPayout::findOrFail($id);
        
        if ($payout->status !== 'pending') {
            return back()->with('error', __('common.payout_already_processed'));
        }
        
        return $this->withTransaction(function () use ($request, $payout) {
            $request->validate([
                'bank_reference' => ['required', 'string', 'max:255'],
                'bank_reference_id' => ['nullable', 'string', 'max:255'],
                'admin_notes' => ['nullable', 'string'],
            ]);

            $payout->update([
                'status' => 'approved',
                'bank_reference' => $request->input('bank_reference'),
                'bank_reference_id' => $request->input('bank_reference_id'),
                'admin_notes' => $request->input('admin_notes'),
                'date_approved' => now(),
                'processed_at' => now(),
                'processed_by' => $request->user()->id,
            ]);

            // Mark associated earnings as paid
            $payout->earnings()->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            return back()->with('success', __('common.payout_completed_successfully'));
        });
    }

    /**
     * Mark payout as failed
     */
    public function markFailed(Request $request, int $id): RedirectResponse
    {
        Gate::authorize('payouts.mark-failed');
        
        $payout = ClinicPayout::findOrFail($id);
        
        if ($payout->status !== 'pending') {
            return back()->with('error', __('common.payout_already_processed'));
        }
        
        return $this->withTransaction(function () use ($request, $payout) {
            $request->validate([
                'failure_reason' => ['required', 'string'],
            ]);

            $payout->update([
                'status' => 'failed',
                'failure_reason' => $request->input('failure_reason'),
                'processed_at' => now(),
                'processed_by' => $request->user()->id,
            ]);

            return back()->with('success', __('common.payout_marked_as_failed'));
        });
    }

    /**
     * Export payouts as CSV
     */
    public function export(Request $request)
    {
        Gate::authorize('payouts.export');
        
        $status = $request->get('status', 'all');
        $frequency = $request->get('frequency', 'all');
        
        $query = ClinicPayout::with(['clinic.owner']);
        
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        if ($frequency !== 'all') {
            $query->where('frequency', $frequency);
        }
        
        $payouts = $query->orderBy('created_at', 'desc')->get();

        $filename = 'payouts_' . now()->format('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($payouts) {
            $file = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($file, [
                'Payout Reference',
                'Clinic Name',
                'Clinic Email',
                'Total Amount',
                'Commission Deducted',
                'Net Amount',
                'Status',
                'Frequency',
                'Payout Date',
                'Processed At',
                'Bank Reference',
            ]);

            // CSV data
            foreach ($payouts as $payout) {
                fputcsv($file, [
                    $payout->payout_reference,
                    $payout->clinic->name_en ?? 'N/A',
                    $payout->clinic->email ?? 'N/A',
                    $payout->total_amount,
                    $payout->commission_deducted,
                    $payout->net_amount,
                    $payout->status,
                    $payout->frequency,
                    $payout->payout_date->format('Y-m-d'),
                    $payout->processed_at ? $payout->processed_at->format('Y-m-d H:i:s') : '',
                    $payout->bank_reference ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate unique payout reference
     */
    private function generateReference(): string
    {
        do {
            $reference = 'PO-' . strtoupper(uniqid());
        } while (ClinicPayout::where('payout_reference', $reference)->exists());

        return $reference;
    }

    /**
     * Get next payout date based on frequency
     */
    private function getNextPayoutDate(string $frequency): string
    {
        return match($frequency) {
            'daily' => now()->addDay()->format('Y-m-d'),
            'weekly' => now()->addWeek()->format('Y-m-d'),
            'bi_weekly' => now()->addWeeks(2)->format('Y-m-d'),
            'monthly' => now()->addMonth()->format('Y-m-d'),
            default => now()->addMonth()->format('Y-m-d'),
        };
    }
}
