<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ReviewRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Traits\HandlesRoleBasedQueries;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReviewManagementController extends Controller
{
    use HandlesRoleBasedQueries, ScopesClinicData;

    public function __construct(
        private readonly ReviewRepositoryInterface $reviewRepository
    ) {}
    /**
     * Display a listing of reviews
     */
    public function index(Request $request): Response
    {
        Gate::authorize('reviews.view');

        $perPage = $request->get('per_page', 15);
        
        // Get reviews with role-based filtering using repository
        $user = $request->user();
        $accessibleClinicIds = null;
        $userId = null;
        
        if ($user) {
            if ($user->isSuperAdmin()) {
                // Super admin: show all reviews, no filtering needed
            } elseif ($user->hasRole('clinic') || $user->hasRole('clinic_manager')) {
                // Clinic role: show reviews assigned to their clinic AND all their own reviews
                $accessibleClinicIds = $user->getAccessibleClinicIds();
                $userId = $user->id;
            } else {
                // Other roles: return empty by passing impossible filter
                $accessibleClinicIds = [];
                $userId = -1; // Non-existent user ID
            }
        }
        
        $reviews = $this->reviewRepository->getPaginatedWithRoleFilter($request, $perPage, $accessibleClinicIds, $userId);

        // Load relationships for reviews
        $reviews->load([
            'user:id,name,email,phone,avatar,email_verified_at,phone_verified_at',
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'clinic_id', 'treatment_id');
            },
            'booking.clinic:id,name_en,name_ar,email,phone,logo',
            'booking.treatment:id,name_en,name_ar',
            'clinic:id,name_en,name_ar,email,phone,logo'
        ]);

        // Transform reviews to match frontend expectations
        $reviews->getCollection()->transform(function ($review) {
            // Set default status if not set
            if (!$review->status) {
                $review->status = 'approved';
            }
            
            // Add treatment directly if booking.treatment exists
            if ($review->booking && $review->booking->treatment) {
                $review->treatment = $review->booking->treatment;
            }
            
            // Use direct clinic relationship if available, otherwise use booking.clinic
            if (!$review->clinic && $review->booking && $review->booking->clinic) {
                $review->clinic = $review->booking->clinic;
            }
            
            return $review;
        });

        $filters = $request->get('filters', []);
        $allFilters = $request->only(['search']);
        $allFilters = array_merge($allFilters, $filters);

        // Get user role for frontend
        $isSuperAdmin = $user && $user->isSuperAdmin();

        return Inertia::render('dashboard/reviews/index', [
            'reviews' => $reviews,
            'filters' => $allFilters,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Display the specified review
     */
    public function show(int $id): Response
    {
        Gate::authorize('reviews.show');

        $review = $this->reviewRepository->findOrFail($id);
        $review->load([
            'user:id,name,email,phone,avatar,email_verified_at,phone_verified_at',
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'clinic_id', 'treatment_id');
            },
            'booking.clinic:id,name_en,name_ar,email,phone,logo',
            'booking.treatment:id,name_en,name_ar',
            'clinic:id,name_en,name_ar,email,phone,logo'
        ]);

        // Set default status if not set
        if (!$review->status) {
            $review->status = 'approved';
        }
        
        if ($review->booking && $review->booking->treatment) {
            $review->treatment = $review->booking->treatment;
        }

        return Inertia::render('dashboard/reviews/show', [
            'review' => $review,
        ]);
    }

    /**
     * Show the form for editing the specified review
     */
    public function edit(int $id): Response
    {
        Gate::authorize('reviews.edit');

        $review = $this->reviewRepository->findOrFail($id);
        $review->load([
            'user:id,name,email,phone,avatar,email_verified_at,phone_verified_at',
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'clinic_id', 'treatment_id');
            },
            'booking.clinic:id,name_en,name_ar,email,phone,logo',
            'booking.treatment:id,name_en,name_ar',
            'clinic:id,name_en,name_ar,email,phone,logo'
        ]);

        // Set default status if not set
        if (!$review->status) {
            $review->status = 'approved';
        }
        
        if ($review->booking && $review->booking->treatment) {
            $review->treatment = $review->booking->treatment;
        }

        // Get clinics for dropdown based on user role
        $user = request()->user();
        $clinics = $this->getApprovedClinicsForDropdown()
            ->map(fn($clinic) => [
                'id' => $clinic->id,
                'name' => $clinic->name_en ?? $clinic->name_ar,
            ])
            ->toArray();

        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        return Inertia::render('dashboard/reviews/edit', [
            'review' => $review,
            'clinics' => $clinics,
            'isClinicRole' => $isClinicRole,
        ]);
    }

    /**
     * Update the specified review in storage
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('reviews.edit');

        $user = $request->user();
        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        $validationRules = [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:pending,approved,rejected'],
        ];

        // For clinic role, clinic_id is required and must be from their accessible clinics
        if ($isClinicRole) {
            $accessibleClinicIds = $user->getAccessibleClinicIds();
            $validationRules['clinic_id'] = [
                'required',
                'exists:clinics,id',
                function ($attribute, $value, $fail) use ($accessibleClinicIds) {
                    if (!in_array((int)$value, $accessibleClinicIds)) {
                        $fail(__('common.clinic_not_accessible'));
                    }
                },
            ];
        } else {
            $validationRules['clinic_id'] = ['nullable', 'exists:clinics,id'];
        }

        $request->validate($validationRules);

        $this->withTransaction(function () use ($request, $id, $isClinicRole) {
            $review = $this->reviewRepository->findOrFail($id);
            
            $updateData = [
                'rating' => $request->input('rating'),
                'comment' => $request->input('comment'),
            ];

            // Update clinic_id if provided
            if ($request->has('clinic_id')) {
                $updateData['clinic_id'] = $request->input('clinic_id');
            } elseif ($isClinicRole) {
                // For clinic role, ensure clinic_id is set
                $accessibleClinicIds = $request->user()->getAccessibleClinicIds();
                if (!empty($accessibleClinicIds) && !in_array($review->clinic_id, $accessibleClinicIds)) {
                    // If current clinic is not accessible, set to first accessible clinic
                    $updateData['clinic_id'] = $accessibleClinicIds[0];
                }
            }
            
            if ($request->has('status')) {
                $updateData['status'] = $request->input('status');
                if ($request->input('status') === 'rejected' && $request->has('rejection_reason')) {
                    $updateData['rejection_reason'] = $request->input('rejection_reason');
                } elseif ($request->input('status') !== 'rejected') {
                    $updateData['rejection_reason'] = null;
                }
            }
            
            $this->reviewRepository->update($id, $updateData);
        });

        return redirect()->route('dashboard.reviews.edit', $id)
            ->with('success', __('common.review_updated_successfully'));
    }

    /**
     * Remove the specified review from storage
     */
    public function destroy(int $id)
    {
        Gate::authorize('reviews.destroy');

        $this->withTransaction(function () use ($id) {
            $this->reviewRepository->delete($id);
        });

        return redirect()->route('dashboard.reviews.index')
            ->with('success', __('common.review_deleted_successfully'));
    }

    /**
     * Approve the specified review (reviews are auto-approved, this is for backward compatibility)
     */
    public function approve(Request $request, int $id)
    {
        Gate::authorize('reviews.approve');

        // Reviews are automatically approved when created
        return back()->with('success', __('common.review_approved_successfully'));
    }

    /**
     * Reject the specified review (reviews cannot be rejected, only deleted)
     */
    public function reject(Request $request, int $id)
    {
        Gate::authorize('reviews.reject');

        // Reviews cannot be rejected, only deleted
        return back()->with('error', __('common.review_cannot_be_rejected'));
    }

    /**
     * Toggle review status between approved and rejected
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('reviews.toggle-status');

        $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $updateData = [
                'status' => $request->input('status'),
                'rejection_reason' => $request->input('status') === 'rejected' 
                    ? ($request->input('rejection_reason') ?? __('common.review_rejected_by_admin'))
                    : null,
            ];
            
            $this->reviewRepository->update($id, $updateData);
        });

        return back()->with('success', __('common.review_status_updated_successfully'));
    }
}

