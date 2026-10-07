<?php

namespace App\Repositories;

use App\Contracts\BookingRepositoryInterface;
use App\Models\Booking;
use App\Models\BookingAddOn;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class BookingRepository extends BaseRepository implements BookingRepositoryInterface
{
    protected array $searchableFields = [
        'booking_reference',
    ];

    protected array $filterableFields = [
        'user_id',
        'vendor_id',
        'service_id',
        'status',
        'payment_status',
    ];

    public function __construct(Booking $model)
    {
        parent::__construct($model);
    }

    /**
     * Get user bookings
     */
    public function getUserBookings(int $userId, ?string $status = null, int $perPage = 15, ?bool $isReviewed = null, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator
    {
        $relations = [
            'clinic' => function($q) {
                $q->select([
                    'id', 'name_en', 'name_ar', 'email', 'phone', 'address', 
                    'governorate_id', 'area_id', 'block', 'street', 'avenue', 
                    'house', 'floor', 'apt', 'city', 'state', 'country', 
                    'postal_code', 'latitude', 'longitude', 'logo',
                    'cancellation_policy_en', 'cancellation_policy_ar',
                    'refund_policy_en', 'refund_policy_ar',
                    'rescheduling_policy_en', 'rescheduling_policy_ar',
                ])->with(['media']);
            },
            'treatment' => function($q) {
                $q->with(['media']);
            },
            'machine' => function($q) {
                $q->with(['media']);
            },
            'user' => function($q) {
                $q->with(['addresses:id,user_id,address_line_1,address_line_2,city,state,country']);
            },
            'patientSkinType',
            'patientBodyPart',
            'transactions' => function($q) {
                $q->whereNotNull('payment_method')->limit(1);
            },
        ];

        // Only eager load addOns if the table exists
        if (\Illuminate\Support\Facades\Schema::hasTable('booking_add_ons')) {
            $relations['addOns.treatmentAddOn'] = function($q) {
                $q->with(['media']);
            };
        }

        // Filter sessions by date range if provided
        if ($startDate && $endDate) {
            $relations['sessions'] = function($q) use ($startDate, $endDate) {
                $q->whereBetween('slot_date', [$startDate, $endDate])
                  ->orderBy('slot_date', 'asc')
                  ->orderBy('slot_time', 'asc');
            };
        } else {
            // If no date filter, load all sessions ordered
            $relations['sessions'] = function($q) {
                $q->orderBy('slot_date', 'asc')
                  ->orderBy('slot_time', 'asc');
            };
        }

        $query = $this->model->with($relations);

        $query->where('user_id', $userId);

        // Handle status filter with support for tab-like filtering (upcoming, past, etc.)
        if ($status) {
            $today = now()->toDateString();
            
            if ($status === 'upcoming') {
                // Show all bookings with status "upcoming" AND payment status "pending" or "paid"
                $query->where('status', 'upcoming')
                    ->whereIn('payment_status', ['pending', 'paid']);
            } elseif ($status === 'accepted') {
                // Show all bookings with status "accepted" AND payment status "paid"
                $query->where('status', 'accepted')
                    ->where('payment_status', 'paid');
            } elseif ($status === 'cancelled') {
                // Show all bookings with status "cancelled" AND payment status "pending" or "paid"
                $query->where('status', 'cancelled')
                    ->whereIn('payment_status', ['pending', 'paid']);
            } elseif ($status === 'past') {
                // Show all bookings with status "upcoming" AND payment status "paid" or "pending" 
                // AND all sessions are in the past
                $query->where('status', 'upcoming')
                    ->whereIn('payment_status', ['paid', 'pending'])
                    ->whereHas('sessions')
                    ->whereDoesntHave('sessions', function($sessionQ) use ($today) {
                        $sessionQ->where('slot_date', '>=', $today);
                    });
            } else {
                // Direct status match for other statuses
                $query->where('status', $status);
            }
        }

        // Filter by review provided status
        if ($isReviewed !== null) {
            if ($isReviewed) {
                // Booking has review if flag is true OR if review exists
                $query->where(function($q) {
                    $q->where('is_review_provided', true)
                      ->orWhereHas('reviews');
                });
            } else {
                // Booking doesn't have review if flag is false AND no review exists
                $query->where('is_review_provided', false)
                    ->whereDoesntHave('reviews');
            }
        }

        // Filter bookings by date range - only return bookings that have sessions in the date range
        if ($startDate && $endDate) {
            $query->whereHas('sessions', function($q) use ($startDate, $endDate) {
                $q->whereBetween('slot_date', [$startDate, $endDate]);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get unreviewed bookings for a user and clinic
     */
    public function getUnreviewedBookingsForClinic(int $userId, int $clinicId, int $limit = 10): \Illuminate\Support\Collection
    {
        return $this->model->where('user_id', $userId)
            ->where('clinic_id', $clinicId)
            ->where('status', 'completed')
            ->where('is_review_provided', false) // Using existing column name for now
            ->whereDoesntHave('reviews') // Check if review doesn't exist
            ->with(['treatment'])
            ->orderBy('completed_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Cancel booking
     */
    public function cancel(int $bookingId, ?string $reason = null, ?int $reasonId = null): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        $updateData = [
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ];
        
        // If reason_id is provided, get the reason text from repository
        if ($reasonId !== null) {
            $reasonRepository = app(\App\Contracts\BookingReasonRepositoryInterface::class);
            $reasonModel = $reasonRepository->find($reasonId);
            
            if ($reasonModel && $reasonModel->type === \App\Enums\BookingReasonType::Cancellation) {
                $updateData['cancellation_reason_id'] = $reasonId;
                // Get localized reason text
                $locale = app()->getLocale();
                $updateData['cancellation_reason'] = $locale === 'ar' && $reasonModel->title_ar 
                    ? $reasonModel->title_ar 
                    : $reasonModel->title_en;
            }
        } elseif ($reason !== null) {
            // Use provided reason text directly
            $updateData['cancellation_reason'] = $reason;
        }
        
        $booking->update($updateData);

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name', 'cancellationReason']);
    }

    /**
     * Reschedule booking
     */
    public function reschedule(int $bookingId, string $bookingDate, string $bookingTime, ?int $reasonId = null): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        $updateData = [
            'booking_date' => $bookingDate,
            'start_time' => $bookingTime,
        ];
        
        // If reason_id is provided, get the reason text from repository
        if ($reasonId !== null) {
            $reasonRepository = app(\App\Contracts\BookingReasonRepositoryInterface::class);
            $reasonModel = $reasonRepository->find($reasonId);
            
            if ($reasonModel && $reasonModel->type === \App\Enums\BookingReasonType::Rescheduling) {
                $updateData['reschedule_reason_id'] = $reasonId;
                // Get localized reason text
                $locale = app()->getLocale();
                $updateData['reschedule_reason'] = $locale === 'ar' && $reasonModel->title_ar 
                    ? $reasonModel->title_ar 
                    : $reasonModel->title_en;
            }
        }
        
        $booking->update($updateData);

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name', 'rescheduleReason']);
    }

    /**
     * Update booking status
     */
    public function updateStatus(int $bookingId, string $status): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        // Don't allow status update if payment is not paid (except for cancelled status)
        if ($status !== 'cancelled' && $booking->payment_status !== 'paid') {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                ['payment_status' => [__('common.booking_payment_required')]]
            );
        }
        
        $oldStatus = $booking->status;
        
        // Update status and completed_at if status is completed
        $updateData = ['status' => $status];
        if ($status === 'completed' && !$booking->completed_at) {
            $updateData['completed_at'] = now();
        }
        
        $booking->update($updateData);
        
        // Refresh to ensure we have the latest data
        $booking->refresh();
        
        // Explicitly generate clinic earning if status changed to completed and payment is paid
        // This ensures earning is generated even if model event doesn't fire properly
        if ($status === 'completed' && $oldStatus !== 'completed' && $booking->payment_status === 'paid') {
            try {
                $booking->generateClinicEarning();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to generate clinic earning for booking {$bookingId}: " . $e->getMessage());
            }
        }

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name']);
    }

    /**
     * Confirm booking
     */
    public function confirm(int $bookingId): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        $booking->update([
            'status' => 'accepted', // Use 'accepted' to match enum values
            'confirmed_at' => now(),
        ]);

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name']);
    }

    /**
     * Create booking
     */
    public function createBooking(array $data): Booking
    {
        return $this->create($data);
    }


    /**
     * Create booking add-on
     */
    public function createBookingAddOn(array $data): BookingAddOn
    {
        return BookingAddOn::create($data);
    }

    /**
     * Find booking with relations
     */
    public function findWithRelations(int $id, array $relations = []): Booking
    {
        $defaultRelations = [
            'clinic' => function($q) {
                $q->select([
                    'id', 'name_en', 'name_ar', 'email', 'phone', 'address', 
                    'governorate_id', 'area_id', 'block', 'street', 'avenue', 
                    'house', 'floor', 'apt', 'city', 'state', 'country', 
                    'postal_code', 'latitude', 'longitude', 'logo',
                    'cancellation_policy_en', 'cancellation_policy_ar',
                    'refund_policy_en', 'refund_policy_ar',
                    'rescheduling_policy_en', 'rescheduling_policy_ar',
                ])->with(['media']);
            },
            'treatment' => function($q) {
                $q->with(['media']);
            },
            'machine' => function($q) {
                $q->with(['media']);
            },
            'user' => function($q) {
                $q->with(['addresses:id,user_id,address_line_1,address_line_2,city,state,country']);
            },
            'patientSkinType',
            'patientBodyPart',
        ];

        // Only eager load addOns if the table exists
        if (\Illuminate\Support\Facades\Schema::hasTable('booking_add_ons')) {
            $defaultRelations['addOns'] = function($q) {
                $q->with(['treatmentAddOn.media']);
            };
        }

        $allRelations = array_merge($defaultRelations, $relations);

        return $this->model->with($allRelations)->findOrFail($id);
    }

    /**
     * Complete booking
     * Note: Loyalty tracker is automatically updated via Booking model boot method
     */
    public function complete(int $bookingId): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        $booking->markAsCompleted();

        // Loyalty tracker is automatically updated via Booking model boot method when status changes to 'completed'

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name']);
    }

    /**
     * Mark booking as no-show
     */
    public function noShow(int $bookingId): Booking
    {
        $booking = $this->model->with(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name'])->findOrFail($bookingId);
        
        $booking->update(['status' => 'no_show']);

        return $booking->load(['service:id,name_en,name_ar,base_price', 'vendor:id,name,email,phone', 'user:id,name']);
    }

    /**
     * Get bookings accessible to a user based on their role
     */
    public function getBookingsForUser(\App\Models\User $user, ?array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Apply role-based clinic filtering using User helper methods
        $accessibleClinicIds = $user->getAccessibleClinicIds();
        
        if (empty($accessibleClinicIds)) {
            // Super admin: empty array means no filter (access all)
            if (!$user->isSuperAdmin()) {
                // Other roles with no accessible clinics: return empty result
                $query->whereRaw('1 = 0');
            }
        } else {
            // Filter by accessible clinic IDs
            $query->whereIn('clinic_id', $accessibleClinicIds);
        }

        // Apply clinic filter (for clinic owner dropdown selection)
        if (isset($filters['clinic_id']) && !empty($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        // Apply search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('booking_reference', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('treatment', function($treatmentQuery) use ($search) {
                      $treatmentQuery->where('name_en', 'like', "%{$search}%")
                                     ->orWhere('name_ar', 'like', "%{$search}%");
                  });
            });
        }

        // Apply tab filters first (tabs have priority and their own logic)
        $tab = $filters['tab'] ?? null;
        $hasTabFilter = !empty($tab) && $tab !== 'all';
        
        if ($hasTabFilter) {
            $today = now()->toDateString();
            
            if ($tab === 'upcoming') {
                // Show all bookings with status "upcoming" AND payment status "pending" or "paid"
                $query->where('status', 'upcoming')
                    ->whereIn('payment_status', ['pending', 'paid']);
            } elseif ($tab === 'accepted') {
                // Show all bookings with status "accepted" AND payment status "paid"
                $query->where('status', 'accepted')
                    ->where('payment_status', 'paid');
            } elseif ($tab === 'cancelled') {
                // Show all bookings with status "cancelled" AND payment status "pending" or "paid"
                $query->where('status', 'cancelled')
                    ->whereIn('payment_status', ['pending', 'paid']);
            } elseif ($tab === 'past') {
                // Show all bookings with status "upcoming" AND payment status "paid" or "pending" 
                // AND all sessions are in the past
                $query->where('status', 'upcoming')
                    ->whereIn('payment_status', ['paid', 'pending'])
                    ->whereHas('sessions') // Must have at least one session
                    ->whereDoesntHave('sessions', function($sessionQ) use ($today) {
                        // No sessions should be today or in the future - all must be in the past
                        $sessionQ->where('slot_date', '>=', $today);
                    });
            }
        } else {
            // Apply status filter only when no tab filter is set
            if (isset($filters['status']) && !empty($filters['status']) && $filters['status'] !== 'all') {
                $status = $filters['status'];
                $today = now()->toDateString();
                
                if ($status === 'upcoming') {
                    // Show all bookings with status "upcoming" AND payment status "pending" or "paid"
                    $query->where('status', 'upcoming')
                        ->whereIn('payment_status', ['pending', 'paid']);
                } elseif ($status === 'accepted') {
                    // Show all bookings with status "accepted" AND payment status "paid"
                    $query->where('status', 'accepted')
                        ->where('payment_status', 'paid');
                } elseif ($status === 'cancelled') {
                    // Show all bookings with status "cancelled" AND payment status "pending" or "paid"
                    $query->where('status', 'cancelled')
                        ->whereIn('payment_status', ['pending', 'paid']);
                } elseif ($status === 'past') {
                    // Show all bookings with status "upcoming" AND payment status "paid" or "pending" 
                    // AND all sessions are in the past
                    $query->where('status', 'upcoming')
                        ->whereIn('payment_status', ['paid', 'pending'])
                        ->whereHas('sessions')
                        ->whereDoesntHave('sessions', function($sessionQ) use ($today) {
                            $sessionQ->where('slot_date', '>=', $today);
                        });
                } else {
                    // Direct status match for other statuses
                    $query->where('status', $status);
                }
            }
        }

        // Apply date range filter (created_from and created_to)
        if (isset($filters['created_from']) && !empty($filters['created_from'])) {
            $createdFrom = $filters['created_from'];
            // Start of day
            $query->whereDate('created_at', '>=', $createdFrom);
        }

        if (isset($filters['created_to']) && !empty($filters['created_to'])) {
            $createdTo = $filters['created_to'];
            // End of day
            $query->whereDate('created_at', '<=', $createdTo);
        }

        // Load relationships
        $query->with([
            'user', 
            'treatment', 
            'clinic' => function($q) {
                $q->select(['id', 'name_en', 'name_ar', 'email', 'phone', 'logo']);
            },
            'sessions', 
            'machine', 
            'patientSkinType', 
            'patientBodyPart'
        ]);

        // Order by
        $query->orderBy('created_at', 'desc');

        return $query->paginate($perPage);
    }

    /**
     * Get booking IDs for a user
     */
    public function getBookingIdsForUser(int $userId): array
    {
        return $this->model->where('user_id', $userId)->pluck('id')->toArray();
    }

    /**
     * Get paid bookings without transactions for a user
     */
    public function getPaidBookingsWithoutTransactions(int $userId, array $transactionableIds = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->model->where('user_id', $userId)
            ->where('payment_status', 'paid');

        if (!empty($transactionableIds)) {
            $query->whereNotIn('id', $transactionableIds);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}

