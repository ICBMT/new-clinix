<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicPayoutRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Traits\HandlesRoleBasedQueries;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClinicPayoutManagementController extends Controller
{
    use HandlesRoleBasedQueries, ScopesClinicData;
    public function __construct(
        private readonly ClinicPayoutRepositoryInterface $payoutRepository,
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of clinic payouts
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-payouts.view');

        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['clinic_id', 'status', 'date_from', 'date_to']);

        // Apply role-based filtering to payouts
        $query = \App\Models\ClinicPayout::query();
        $query = $this->applyRoleBasedClinicFilter($query, 'clinic_id');
        
        // Apply filters
        if (isset($filters['clinic_id']) && !empty($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['date_from']) && !empty($filters['date_from'])) {
            $query->whereDate('payout_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to']) && !empty($filters['date_to'])) {
            $query->whereDate('payout_date', '<=', $filters['date_to']);
        }
        
        $payouts = $query->with(['clinic:id,name_en,name_ar'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Get approved clinics for filter dropdown based on user role
        $clinics = $this->getApprovedClinicsForDropdown();

        // Get stats with role-based filtering
        $statsQuery = \App\Models\ClinicPayout::query();
        $statsQuery = $this->applyRoleBasedClinicFilter($statsQuery, 'clinic_id');
        
        $stats = [
            'total_pending' => (float) (clone $statsQuery)->where('status', 'pending')->sum('net_amount') ?? 0,
            'total_approved' => (float) (clone $statsQuery)->where('status', 'approved')->sum('net_amount') ?? 0,
            'total_commission' => (float) (clone $statsQuery)->sum('commission_deducted') ?? 0,
            'pending_count' => (int) (clone $statsQuery)->where('status', 'pending')->count() ?? 0,
        ];

        return Inertia::render('dashboard/clinics-payouts/index', [
            'payouts' => $payouts,
            'filters' => $filters,
            'clinics' => $clinics,
            'stats' => $stats,
        ]);
    }

    /**
     * Display the specified clinic payout
     */
    public function show(Request $request, int $id): Response
    {
        Gate::authorize('clinics-payouts.show');

        $payout = $this->payoutRepository->findOrFail($id, [
            'clinic:id,name_en,name_ar,email',
            'clinic.owner:id,name,email',
            'earnings',
            'processedBy:id,name,email',
        ]);

        // Check if user can access this payout's clinic
        $user = $request->user();
        if (!$user->hasRole('super-admin')) {
            $accessibleClinicIds = [];
            
            if ($user->hasRole('clinic')) {
                $accessibleClinicIds = $user->getOwnedClinicIds();
            } elseif ($user->hasRole('clinic_manager')) {
                $accessibleClinicIds = $user->getAssignedClinicIds();
            }
            
            if (!in_array($payout->clinic_id, $accessibleClinicIds)) {
                abort(403, __('common.no_access_to_payout'));
            }
        }

        return Inertia::render('dashboard/clinics-payouts/show', [
            'payout' => $payout,
        ]);
    }

    /**
     * Process clinic payouts
     */
    public function process(Request $request)
    {
        Gate::authorize('clinics-payouts.process');

        $validated = $request->validate([
            'clinic_ids' => ['required', 'array'],
            'clinic_ids.*' => ['exists:clinics,id'],
            'payment_method' => ['required', 'string'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // Process payouts logic here
        // This would typically call a service to process payouts

        return redirect()->route('dashboard.clinics-payouts.index')
            ->with('success', __('common.payouts_processed_successfully'));
    }

    /**
     * Mark payout as completed
     */
    public function complete(Request $request, int $id)
    {
        Gate::authorize('clinics-payouts.complete');

        $payout = $this->payoutRepository->findOrFail($id);
        
        // Check if user can access this payout's clinic
        $user = $request->user();
        if (!$user->hasRole('super-admin')) {
            $accessibleClinicIds = [];
            
            if ($user->hasRole('clinic')) {
                $accessibleClinicIds = $user->getOwnedClinicIds();
            } elseif ($user->hasRole('clinic_manager')) {
                $accessibleClinicIds = $user->getAssignedClinicIds();
            }
            
            if (!in_array($payout->clinic_id, $accessibleClinicIds)) {
                abort(403, __('common.no_access_to_payout'));
            }
        }

        $validated = $request->validate([
            'bank_reference' => ['required', 'string', 'max:255'],
            'bank_reference_id' => ['nullable', 'string', 'max:255'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payout = $this->payoutRepository->update($id, [
            'status' => 'approved',
            'bank_reference' => $validated['bank_reference'],
            'bank_reference_id' => $validated['bank_reference_id'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'date_approved' => now(),
            'processed_at' => now(),
            'processed_by' => auth()->id(),
        ]);

        return redirect()->route('dashboard.clinics-payouts.show', $id)
            ->with('success', __('common.payout_marked_completed'));
    }

    /**
     * Mark payout as failed
     */
    public function fail(Request $request, int $id)
    {
        Gate::authorize('clinics-payouts.fail');

        $payout = $this->payoutRepository->findOrFail($id);
        
        // Check if user can access this payout's clinic
        $user = $request->user();
        if (!$user->hasRole('super-admin')) {
            $accessibleClinicIds = [];
            
            if ($user->hasRole('clinic')) {
                $accessibleClinicIds = $user->getOwnedClinicIds();
            } elseif ($user->hasRole('clinic_manager')) {
                $accessibleClinicIds = $user->getAssignedClinicIds();
            }
            
            if (!in_array($payout->clinic_id, $accessibleClinicIds)) {
                abort(403, __('common.no_access_to_payout'));
            }
        }

        $validated = $request->validate([
            'failure_reason' => ['required', 'string', 'max:500'],
        ]);

        $payout = $this->payoutRepository->update($id, [
            'status' => 'failed',
            'failure_reason' => $validated['failure_reason'],
            'failed_at' => now(),
        ]);

        return redirect()->route('dashboard.clinics-payouts.show', $id)
            ->with('success', __('common.payout_marked_failed'));
    }

    /**
     * Export payouts to CSV
     */
    public function export(Request $request)
    {
        Gate::authorize('clinics-payouts.view');

        // Apply role-based filtering to export
        $query = \App\Models\ClinicPayout::query();
        $query = $this->applyRoleBasedClinicFilter($query, 'clinic_id');
        
        // Apply any additional filters from request
        $filters = $request->only(['clinic_id', 'status', 'date_from', 'date_to']);
        if (isset($filters['clinic_id']) && !empty($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['date_from']) && !empty($filters['date_from'])) {
            $query->whereDate('payout_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to']) && !empty($filters['date_to'])) {
            $query->whereDate('payout_date', '<=', $filters['date_to']);
        }
        
        $payouts = $query->with(['clinic:id,name_en,name_ar'])
            ->orderBy('created_at', 'desc')
            ->paginate(1000);

        $filename = 'payouts_' . date('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($payouts) {
            $file = fopen('php://output', 'w');
            
            // Add CSV headers
            fputcsv($file, [
                'Payout Reference',
                'Clinic Name',
                'Total Amount',
                'Commission',
                'Net Amount',
                'Currency',
                'Status',
                'Frequency',
                'Payout Date',
                'Bank Reference',
                'Created At'
            ]);

            // Add data rows
            foreach ($payouts->data as $payout) {
                fputcsv($file, [
                    $payout->payout_reference ?? '',
                    $payout->clinic ? ($payout->clinic->name_en ?? $payout->clinic->name_ar ?? '') : '',
                    $payout->total_amount ?? '0.00',
                    $payout->commission_deducted ?? '0.00',
                    $payout->net_amount ?? '0.00',
                    $payout->currency ?? 'KWD',
                    $payout->status ?? '',
                    $payout->frequency ?? '',
                    $payout->payout_date ?? '',
                    $payout->bank_reference ?? '',
                    $payout->created_at ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

