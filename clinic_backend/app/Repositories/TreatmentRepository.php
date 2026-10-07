<?php

namespace App\Repositories;

use App\Contracts\TreatmentRepositoryInterface;
use App\Models\Treatment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TreatmentRepository extends BaseRepository implements TreatmentRepositoryInterface
{
    protected array $searchableFields = [
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
    ];

    protected array $filterableFields = [
        'vendor_id', // Backward compatibility
        'clinic_id',
        'category_id',
        'status',
        'is_featured',
        'is_fast_booking',
        'base_price',
    ];

    protected array $relationships = [
        'clinic:id,name_en,name_ar,email,phone,logo',
        'category:id,name_en,name_ar',
    ];

    public function __construct(Treatment $model)
    {
        parent::__construct($model);
    }

    /**
     * Create a new treatment with machine assignments
     */
    public function create(array $data): Treatment
    {
        $machineIds = $data['machine_ids'] ?? [];
        unset($data['machine_ids']);

        $treatment = parent::create($data);

        if (!empty($machineIds)) {
            $treatment->machines()->sync($machineIds);
        }

        return $treatment->fresh();
    }

    /**
     * Update treatment with machine assignments
     */
    public function update(int $id, array $data): Treatment
    {
        $machineIds = $data['machine_ids'] ?? null;
        unset($data['machine_ids']);

        $treatment = parent::update($id, $data);

        if ($machineIds !== null) {
            $treatment->machines()->sync($machineIds);
        }

        return $treatment->fresh();
    }

    /**
     * Get treatments by clinic
     */
    public function getByClinic(int $clinicId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['clinic:id,name_en,name_ar', 'category:id,name_en,name_ar', 'media'])
            ->where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Alias for backward compatibility
     */
    public function getByVendor(int $vendorId, int $perPage = 15): LengthAwarePaginator
    {
        // Find clinic by owner_id
        $clinic = \App\Models\Clinic::where('owner_id', $vendorId)->first();
        if (!$clinic) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
        }
        return $this->getByClinic($clinic->id, $perPage);
    }

    /**
     * Get featured services
     */
    public function getFeaturedTreatments(int $limit = 10): Collection
    {
        return $this->model
            ->with(['vendor:id,name,email,phone', 'category:id,name_en,name_ar'])
            ->where('status', 'approved')
            ->where('is_featured', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Search services
     */
    public function search(string $query, ?int $categoryId = null, ?float $latitude = null, ?float $longitude = null, int $radius = 10): Collection
    {
        $query_builder = $this->model->query()
            ->with(['vendor:id,name', 'category:id,name_en,name_ar', 'media'])
            ->where('status', 'approved');

        // Apply category filter
        if ($categoryId) {
            $query_builder->where('category_id', $categoryId);
        }

        // Apply text search
        if ($query) {
            $query_builder->where(function ($q) use ($query) {
                $q->where('name_en', 'LIKE', "%{$query}%")
                  ->orWhere('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('description_en', 'LIKE', "%{$query}%")
                  ->orWhere('description_ar', 'LIKE', "%{$query}%");
            });
        }

        // Apply location-based search if latitude/longitude provided
        if ($latitude && $longitude) {
            // TODO: Implement location-based search
            // For now, just return all services
        }

        return $query_builder->get();
    }

    /**
     * Get service availability - generates dynamic slots based on service working hours and checks bookings
     * Supports filtering by machine (per SRS Section 4.1.7)
     */
    public function getAvailability(int $treatmentId, string $date, ?array $machineIds = null): array
    {
        // Normalize the date to ensure consistent format (Y-m-d)
        try {
            $normalizedDate = \Carbon\Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            // If date parsing fails, return empty array
            return [];
        }
        
        $treatment = $this->model->with(['clinic', 'weeklySchedules'])->findOrFail($treatmentId);
        $availableSlots = [];

        // Get clinic
        $clinic = $treatment->clinic;
        if (!$clinic) {
            return []; // Treatment has no clinic
        }
        
        // First, check if there are specific treatment slots for this date
        $treatmentSlots = \App\Models\TreatmentSlot::where('treatment_id', $treatmentId)
            ->whereDate('slot_date', $normalizedDate)
            ->where('status', 'available')
            ->orderBy('start_time')
            ->get();
        
        // If treatment slots exist for this date, use them
        if ($treatmentSlots->isNotEmpty()) {
            // Get existing booking sessions for this SPECIFIC date only, filtered by machine if provided
            // Use explicit date comparison to ensure we only get bookings for the requested date
            $sessionsQuery = \App\Models\BookingSession::query()
                ->join('bookings', 'booking_sessions.booking_id', '=', 'bookings.id')
                ->where('bookings.treatment_id', $treatment->id)
                ->whereIn('bookings.status', ['upcoming', 'accepted'])
                ->whereDate('booking_sessions.slot_date', $normalizedDate)
                ->whereNotNull('booking_sessions.slot_time');
            
            // Filter by machine if provided
            if ($machineIds && !empty($machineIds)) {
                $sessionsQuery->whereIn('bookings.machine_id', $machineIds);
            }
            
            // Execute query and get booked slots for THIS date only
            $bookedSlots = $sessionsQuery->select('booking_sessions.slot_time', 'booking_sessions.treatment_slot_id')
                ->get()
                ->map(function ($session) {
                    if ($session->slot_time) {
                        return [
                            'time' => $session->slot_time->format('H:i:00'),
                            'slot_id' => $session->treatment_slot_id,
                        ];
                    }
                    return null;
                })
                ->filter()
                ->groupBy('slot_id')
                ->map(function ($group) {
                    return $group->pluck('time')->toArray();
                })
                ->toArray();
            
            // Process each treatment slot
            foreach ($treatmentSlots as $slot) {
                $slotTime = $slot->start_time ? \Carbon\Carbon::parse($slot->start_time)->format('H:i') : null;
                $slotEndTime = $slot->end_time ? \Carbon\Carbon::parse($slot->end_time)->format('H:i') : null;
                
                if (!$slotTime || !$slotEndTime) {
                    continue;
                }
                
                // Check if this slot is booked
                $slotBookings = $bookedSlots[$slot->id] ?? [];
                $slotTimeWithSeconds = \Carbon\Carbon::parse($slot->start_time)->format('H:i:00');
                $isBooked = in_array($slotTimeWithSeconds, $slotBookings);
                
                // Check max bookings per slot
                $currentBookings = count($slotBookings);
                $maxBookings = $slot->max_bookings_per_slot ?? 1;
                $isAvailable = !$isBooked && $currentBookings < $maxBookings;
                
            $availableSlots[] = [
                'start_time' => $slotTime,
                'end_time' => $slotEndTime,
                'date' => $normalizedDate,
                'available' => $isAvailable,
                'treatment_slot_id' => $slot->id,
                'price' => $slot->price ? (float) $slot->price : null,
            ];
            }
            
            // Check if all slots for the requested date are booked
            $hasAvailableSlots = collect($availableSlots)->contains('available', true);
            
            // If all slots are booked, find next occurrence of the same weekday
            if (!$hasAvailableSlots && !empty($availableSlots)) {
                $requestedDate = \Carbon\Carbon::parse($normalizedDate);
                $dayOfWeek = $requestedDate->dayOfWeek; // 0 (Sunday) to 6 (Saturday)
                
                // Find next occurrence of this weekday (start from tomorrow to avoid same day)
                $nextWeekdayDate = $requestedDate->copy()->addDay();
                while ($nextWeekdayDate->dayOfWeek !== $dayOfWeek) {
                    $nextWeekdayDate->addDay();
                }
                
                $nextWeekdayNormalizedDate = $nextWeekdayDate->format('Y-m-d');
                
                // Get treatment slots for next weekday
                $nextWeekdayTreatmentSlots = \App\Models\TreatmentSlot::where('treatment_id', $treatmentId)
                    ->whereDate('slot_date', $nextWeekdayNormalizedDate)
                    ->where('status', 'available')
                    ->orderBy('start_time')
                    ->get();
                
                if ($nextWeekdayTreatmentSlots->isNotEmpty()) {
                    // Get booked slots for next weekday from booking records
                    $nextWeekdaySessionsQuery = \App\Models\BookingSession::query()
                        ->join('bookings', 'booking_sessions.booking_id', '=', 'bookings.id')
                        ->where('bookings.treatment_id', $treatment->id)
                        ->whereIn('bookings.status', ['upcoming', 'accepted'])
                        ->whereDate('booking_sessions.slot_date', $nextWeekdayNormalizedDate)
                        ->whereNotNull('booking_sessions.slot_time');
                    
                    if ($machineIds && !empty($machineIds)) {
                        $nextWeekdaySessionsQuery->whereIn('bookings.machine_id', $machineIds);
                    }
                    
                    $nextWeekdayBookedSlots = $nextWeekdaySessionsQuery->select('booking_sessions.slot_time', 'booking_sessions.treatment_slot_id')
                        ->get()
                        ->map(function ($session) {
                            if ($session->slot_time) {
                                return [
                                    'time' => $session->slot_time->format('H:i:00'),
                                    'slot_id' => $session->treatment_slot_id,
                                ];
                            }
                            return null;
                        })
                        ->filter()
                        ->groupBy('slot_id')
                        ->map(function ($group) {
                            return $group->pluck('time')->toArray();
                        })
                        ->toArray();
                    
                    // Process next weekday's slots
                    $nextWeekdaySlots = [];
                    foreach ($nextWeekdayTreatmentSlots as $slot) {
                        $slotTime = $slot->start_time ? \Carbon\Carbon::parse($slot->start_time)->format('H:i') : null;
                        $slotEndTime = $slot->end_time ? \Carbon\Carbon::parse($slot->end_time)->format('H:i') : null;
                        
                        if (!$slotTime || !$slotEndTime) {
                            continue;
                        }
                        
                        $slotBookings = $nextWeekdayBookedSlots[$slot->id] ?? [];
                        $slotTimeWithSeconds = \Carbon\Carbon::parse($slot->start_time)->format('H:i:00');
                        $isBooked = in_array($slotTimeWithSeconds, $slotBookings);
                        $currentBookings = count($slotBookings);
                        $maxBookings = $slot->max_bookings_per_slot ?? 1;
                        $isAvailable = !$isBooked && $currentBookings < $maxBookings;
                        
                        $nextWeekdaySlots[] = [
                            'start_time' => $slotTime,
                            'end_time' => $slotEndTime,
                            'date' => $nextWeekdayNormalizedDate,
                            'available' => $isAvailable,
                            'treatment_slot_id' => $slot->id,
                            'price' => $slot->price ? (float) $slot->price : null,
                        ];
                    }
                    
                    // Return next weekday's slots ONLY if they have available slots
                    // Don't return next weekday slots if they're also all booked
                    $nextWeekdayHasAvailableSlots = collect($nextWeekdaySlots)->contains('available', true);
                    if (!empty($nextWeekdaySlots) && $nextWeekdayHasAvailableSlots) {
                        return $nextWeekdaySlots;
                    }
                }
            }
            
            return $availableSlots;
        }
        
        // If no treatment slots, check treatment weekly schedule
        $requestedDate = \Carbon\Carbon::parse($normalizedDate);
        $dayOfWeek = $requestedDate->dayOfWeek; // 0 (Sunday) to 6 (Saturday)
        
        // Map day numbers to names: Laravel's dayOfWeek is 0=Sunday, 1=Monday, etc.
        $dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $dayName = $dayNames[$dayOfWeek];
        
        // Check if treatment has a weekly schedule for this day
        $treatmentSchedule = $treatment->weeklySchedules()
            ->where('clinic_id', $clinic->id)
            ->where('day_of_week', $dayName)
            ->first();
        
        // If no treatment weekly schedule exists, return empty (don't fallback to operating hours)
        if (!$treatmentSchedule) {
            return []; // No treatment weekly schedule for this day
        }
        
            // Use treatment-specific weekly schedule
            if (!$treatmentSchedule->is_open || $treatmentSchedule->closed_all_day || !$treatmentSchedule->opening_time || !$treatmentSchedule->closing_time) {
                return []; // Treatment is closed on this day
            }
            
            $startTime = \Carbon\Carbon::parse($treatmentSchedule->opening_time);
            $endTime = \Carbon\Carbon::parse($treatmentSchedule->closing_time);
        // Get duration: priority is slot_duration from weekly schedule, then treatment's service_duration_minutes, then default 60
        $duration = $treatmentSchedule->slot_duration 
            ?? ($treatment->service_duration_minutes > 0 ? $treatment->service_duration_minutes : null)
            ?? 60;
        
        // Ensure duration is a positive integer
        $duration = max(1, (int) $duration);
            $buffer = $treatmentSchedule->buffer_time_minutes ?? 0;
        
        // Get existing booking sessions for this SPECIFIC date only, filtered by machine if provided
        // IMPORTANT: Use normalizedDate to ensure we only get bookings for the specific date requested
        // This prevents booked slots from one date affecting availability for another date
        $sessionsQuery = \App\Models\BookingSession::query()
            ->join('bookings', 'booking_sessions.booking_id', '=', 'bookings.id')
            ->where('bookings.treatment_id', $treatment->id)
            ->whereIn('bookings.status', ['upcoming', 'accepted'])
            ->whereDate('booking_sessions.slot_date', $normalizedDate)
            ->whereNotNull('booking_sessions.slot_time');
        
        // Filter by machine if provided
        if ($machineIds && !empty($machineIds)) {
            $sessionsQuery->whereIn('bookings.machine_id', $machineIds);
        }
        
        // Execute query and get booked slots for THIS date only
        $bookedSlots = $sessionsQuery->select('booking_sessions.slot_time')
            ->get()
            ->map(function ($session) {
                if ($session->slot_time) {
                    return $session->slot_time->format('H:i:00');
                }
                return null;
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // Generate time slots from weekly schedule
        $currentSlot = $startTime->copy();
        while ($currentSlot->copy()->addMinutes($duration)->lte($endTime)) {
            $slotTime = $currentSlot->format('H:i');
            $slotEndTime = $currentSlot->copy()->addMinutes($duration)->format('H:i');
            
            // Check if this slot is already booked (compare with seconds format)
            $slotTimeWithSeconds = $currentSlot->format('H:i:00');
            $isBooked = in_array($slotTimeWithSeconds, $bookedSlots);
            
            $availableSlots[] = [
                'start_time' => $slotTime,
                'end_time' => $slotEndTime,
                'date' => $normalizedDate,
                'available' => !$isBooked,
            ];

            // Move to next slot (duration + buffer)
            $currentSlot->addMinutes($duration + $buffer);
        }

        // Check if all slots for the requested date are booked
        $hasAvailableSlots = collect($availableSlots)->contains('available', true);
        
        // If all slots are booked, find next occurrence of the same weekday
        if (!$hasAvailableSlots && !empty($availableSlots)) {
            // Find next occurrence of this weekday (start from tomorrow to avoid same day)
            $nextWeekdayDate = $requestedDate->copy()->addDay();
            while ($nextWeekdayDate->dayOfWeek !== $dayOfWeek) {
                $nextWeekdayDate->addDay();
            }
            
            $nextWeekdayNormalizedDate = $nextWeekdayDate->format('Y-m-d');
            
            // Get booked slots for next weekday from booking records
            $nextWeekdaySessionsQuery = \App\Models\BookingSession::query()
                ->join('bookings', 'booking_sessions.booking_id', '=', 'bookings.id')
                ->where('bookings.treatment_id', $treatment->id)
                ->whereIn('bookings.status', ['upcoming', 'accepted'])
                ->whereDate('booking_sessions.slot_date', $nextWeekdayNormalizedDate)
                ->whereNotNull('booking_sessions.slot_time');
            
            // Filter by machine if provided
            if ($machineIds && !empty($machineIds)) {
                $nextWeekdaySessionsQuery->whereIn('bookings.machine_id', $machineIds);
            }
            
            $nextWeekdayBookedSlots = $nextWeekdaySessionsQuery->select('booking_sessions.slot_time')
                ->get()
                ->map(function ($session) {
                    if ($session->slot_time) {
                        return $session->slot_time->format('H:i:00');
                    }
                    return null;
                })
                ->filter()
                ->unique()
                ->values()
                ->toArray();
            
            // Generate time slots for next weekday based on weekly schedule
            $nextWeekdaySlots = [];
            $nextWeekdayCurrentSlot = $startTime->copy();
            while ($nextWeekdayCurrentSlot->copy()->addMinutes($duration)->lte($endTime)) {
                $slotTime = $nextWeekdayCurrentSlot->format('H:i');
                $slotEndTime = $nextWeekdayCurrentSlot->copy()->addMinutes($duration)->format('H:i');
                
                // Check if this slot is already booked (compare with seconds format)
                $slotTimeWithSeconds = $nextWeekdayCurrentSlot->format('H:i:00');
                $isBooked = in_array($slotTimeWithSeconds, $nextWeekdayBookedSlots);
                
                $nextWeekdaySlots[] = [
                    'start_time' => $slotTime,
                    'end_time' => $slotEndTime,
                    'date' => $nextWeekdayNormalizedDate,
                    'available' => !$isBooked,
                ];

                // Move to next slot (duration + buffer)
                $nextWeekdayCurrentSlot->addMinutes($duration + $buffer);
            }
            
            // Return next weekday's slots ONLY if they have available slots
            // Don't return next weekday slots if they're also all booked
            $nextWeekdayHasAvailableSlots = collect($nextWeekdaySlots)->contains('available', true);
            if (!empty($nextWeekdaySlots) && $nextWeekdayHasAvailableSlots) {
                return $nextWeekdaySlots;
            }
        }

        return $availableSlots;
    }

    /**
     * Filter services with advanced filters
     */
    public function filter(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model
            ->with([
                'clinic' => function($q) {
                    $q->where('status', 'approved')
                      ->with([
                          'owner:id,name,email',
                          'area:id,name_en,name_ar',
                          'governorate:id,name_en,name_ar',
                          'media' => function($mediaQuery) {
                              $mediaQuery->where('collection_name', 'logos');
                          }
                      ]);
                },
                'category' => function($q) {
                    $q->select('id', 'name_en', 'name_ar')
                      ->with('media');
                },
                'media',
                'machines' => function($q) {
                    $q->where('status', 'ready');
                }
            ]);

        // Only show treatments from active clinics with active owners
        $query->whereHas('clinic', function($q) {
            $q->where('status', 'approved')
              ->whereHas('owner', function($ownerQuery) {
                  $ownerQuery->where('status', 'active');
              });
        });

        // Search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('name_ar', 'LIKE', "%{$search}%")
                  ->orWhere('description_en', 'LIKE', "%{$search}%")
                  ->orWhere('description_ar', 'LIKE', "%{$search}%");
            });
        }

        // Status filter (default to approved if not specified)
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', 'approved');
        }

        // Treatment IDs filter
        if (isset($filters['treatment_ids']) && !empty($filters['treatment_ids'])) {
            $query->whereIn('id', $filters['treatment_ids']);
        }

        // Machine IDs filter - filter treatments that use these machines
        if (isset($filters['machine_ids']) && !empty($filters['machine_ids'])) {
            $query->whereHas('machines', function($q) use ($filters) {
                $q->whereIn('machines.id', $filters['machine_ids'])
                  ->where('machines.status', 'ready');
            });
        }

        // Category filter
        if (isset($filters['category_id']) && $filters['category_id'] !== null && $filters['category_id'] !== '') {
            $query->where('category_id', $filters['category_id']);
        }
        if (isset($filters['category_ids']) && !empty($filters['category_ids'])) {
            $categoryIds = is_array($filters['category_ids']) 
                ? array_map('intval', array_filter($filters['category_ids'], fn($id) => $id !== null && $id !== ''))
                : [(int)$filters['category_ids']];
            if (!empty($categoryIds)) {
                $query->whereIn('category_id', $categoryIds);
            }
        }

        // Vendor filter
        if (isset($filters['vendor_id'])) {
            // Backward compatibility: support both vendor_id and clinic_id
            $query->where(function($q) use ($filters) {
                $q->where('vendor_id', $filters['vendor_id'])
                  ->orWhere('clinic_id', $filters['vendor_id']);
            });
        }
        if (isset($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        // Fast booking filter
        if (isset($filters['is_fast_booking']) && $filters['is_fast_booking']) {
            $query->where('is_fast_booking', true);
        }

        // Featured filter
        if (isset($filters['is_featured'])) {
            $query->where('is_featured', $filters['is_featured']);
        }

        // Price range filter
        if (isset($filters['min_price'])) {
            $query->where('base_price', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $query->where('base_price', '<=', $filters['max_price']);
        }

        // Location filter - support area_id, governorate_id, or text search
        if (isset($filters['area_id']) && !empty($filters['area_id'])) {
            $query->whereHas('clinic', function ($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->where('area_id', $filters['area_id']);
            });
        }
        
        if (isset($filters['governorate_id']) && !empty($filters['governorate_id'])) {
            $query->whereHas('clinic', function ($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->whereHas('area', function($areaQuery) use ($filters) {
                      $areaQuery->where('governorate_id', $filters['governorate_id']);
                  });
            });
        }
        
        // Text-based location search (only if area_id and governorate_id are not set)
        $hasAreaId = isset($filters['area_id']) && !empty($filters['area_id']);
        $hasGovernorateId = isset($filters['governorate_id']) && !empty($filters['governorate_id']);
        
        if (isset($filters['location']) && !empty($filters['location']) && !$hasAreaId && !$hasGovernorateId) {
            $location = trim($filters['location']);
            
            // Normalize the location string: replace hyphens with spaces
            $normalizedLocation = str_replace(['-', '_'], ' ', $location);
            $normalizedLocation = preg_replace('/\s+/', ' ', $normalizedLocation); // Multiple spaces to single
            $normalizedLocation = trim($normalizedLocation);
            
            // Create search terms: original, normalized, and individual words
            $searchTerms = [$location, $normalizedLocation];
            
            // Split into words and add significant words to search terms
            $words = preg_split('/[\s,]+/', $normalizedLocation);
            foreach ($words as $word) {
                $word = trim($word);
                if (!empty($word) && strlen($word) >= 3) {
                    // Filter out common location words
                    $commonWords = ['street', 'st', 'kuwait', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'lane', 'ln'];
                    if (!in_array(strtolower($word), $commonWords)) {
                        $searchTerms[] = $word;
                    }
                }
            }
            
            // Remove duplicates and empty values
            $searchTerms = array_unique(array_filter($searchTerms));
            
            if (!empty($searchTerms)) {
                $query->whereHas('clinic', function ($q) use ($searchTerms) {
                    $q->where('status', 'approved')
                      ->whereHas('owner', function($ownerQuery) {
                          $ownerQuery->where('status', 'active');
                      })
                      ->where(function($locationQuery) use ($searchTerms) {
                          // Search in all location-related fields for any of the search terms
                          foreach ($searchTerms as $index => $term) {
                              if ($index === 0) {
                                  $locationQuery->where(function($termQuery) use ($term) {
                                      $termQuery->where('city', 'LIKE', "%{$term}%")
                                        ->orWhere('state', 'LIKE', "%{$term}%")
                                        ->orWhere('address', 'LIKE', "%{$term}%")
                                        ->orWhere('street', 'LIKE', "%{$term}%")
                                        ->orWhere('block', 'LIKE', "%{$term}%")
                                        ->orWhere('avenue', 'LIKE', "%{$term}%");
                                  });
                              } else {
                                  $locationQuery->orWhere(function($termQuery) use ($term) {
                                      $termQuery->where('city', 'LIKE', "%{$term}%")
                                        ->orWhere('state', 'LIKE', "%{$term}%")
                                        ->orWhere('address', 'LIKE', "%{$term}%")
                                        ->orWhere('street', 'LIKE', "%{$term}%")
                                        ->orWhere('block', 'LIKE', "%{$term}%")
                                        ->orWhere('avenue', 'LIKE', "%{$term}%");
                                  });
                              }
                          }
                          
                          // Also search in area and governorate names
                          $locationQuery->orWhereHas('area', function($areaQuery) use ($searchTerms) {
                              $areaQuery->where(function($areaSubQuery) use ($searchTerms) {
                                  foreach ($searchTerms as $index => $term) {
                                      if ($index === 0) {
                                          $areaSubQuery->where('name_en', 'LIKE', "%{$term}%")
                                                      ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      } else {
                                          $areaSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                                      ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      }
                                  }
                              });
                          })
                          ->orWhereHas('area.governorate', function($govQuery) use ($searchTerms) {
                              $govQuery->where(function($govSubQuery) use ($searchTerms) {
                                  foreach ($searchTerms as $index => $term) {
                                      if ($index === 0) {
                                          $govSubQuery->where('name_en', 'LIKE', "%{$term}%")
                                                     ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      } else {
                                          $govSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                                     ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      }
                                  }
                              });
                          });
                      });
                });
            }
        }

        // Location filter (if latitude/longitude provided)
        if (isset($filters['latitude']) && isset($filters['longitude'])) {
            $latitude = $filters['latitude'];
            $longitude = $filters['longitude'];
            $radius = $filters['radius'] ?? 10; // Default 10km
            
            // Haversine formula for distance calculation
            $query->selectRaw("
                treatments.*,
                (6371 * acos(cos(radians(?)) 
                * cos(radians(clinics.latitude)) 
                * cos(radians(clinics.longitude) - radians(?)) 
                + sin(radians(?)) 
                * sin(radians(clinics.latitude)))) AS distance
            ", [$latitude, $longitude, $latitude])
            ->join('clinics', 'treatments.clinic_id', '=', 'clinics.id')
            ->join('users', 'clinics.owner_id', '=', 'users.id')
            ->where('clinics.status', 'approved')
            ->where('users.status', 'active')
            ->having('distance', '<=', $radius)
            ->orderBy('distance', 'asc');
        }

        // Rating filter - filter by clinic's average_rating, not treatment's
        $ratingFilter = null;
        if (isset($filters['ratings']) && is_array($filters['ratings']) && !empty($filters['ratings'])) {
            $ratingFilter = $filters['ratings'];
        } elseif (isset($filters['rating']) && is_array($filters['rating']) && !empty($filters['rating'])) {
            $ratingFilter = $filters['rating'];
        } elseif (isset($filters['star_rating']) && is_array($filters['star_rating']) && !empty($filters['star_rating'])) {
            $ratingFilter = $filters['star_rating'];
        } elseif (isset($filters['rating']) && !is_array($filters['rating']) && $filters['rating'] !== null) {
            // Single integer (backward compatibility)
            $ratingFilter = [(int)$filters['rating']];
        } elseif (isset($filters['star_rating']) && !is_array($filters['star_rating']) && $filters['star_rating'] !== null) {
            // Single integer (backward compatibility)
            $ratingFilter = [(int)$filters['star_rating']];
        }
        
        if ($ratingFilter && is_array($ratingFilter) && !empty($ratingFilter)) {
            // Filter by clinic's average_rating - match clinics where FLOOR(average_rating) is in the array
            $validRatings = array_filter(array_map('intval', $ratingFilter), fn($r) => $r >= 1 && $r <= 5);
            if (!empty($validRatings)) {
                $query->whereHas('clinic', function($q) use ($validRatings) {
                    $q->where('status', 'approved')
                      ->whereHas('owner', function($ownerQuery) {
                          $ownerQuery->where('status', 'active');
                      })
                      ->whereIn(DB::raw('FLOOR(COALESCE(average_rating, 0))'), $validRatings);
                });
            }
        }
        
        // Min rating filter - filter by clinic's average_rating
        if (isset($filters['min_rating'])) {
            $query->whereHas('clinic', function($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->where('average_rating', '>=', $filters['min_rating']);
            });
        }

        // Experience filter - filter by clinic years in operation
        if (isset($filters['experience']) && !empty($filters['experience'])) {
            $experience = strtolower(trim($filters['experience']));
            $query->whereHas('clinic', function($q) use ($experience) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  });
                // Handle different formats: "1-3", "1-3 Years", "1 -3 Years", etc.
                if (str_contains($experience, '1') && str_contains($experience, '3')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) BETWEEN 1 AND 3');
                } elseif (str_contains($experience, '15') || str_contains($experience, '15+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 15');
                } elseif (str_contains($experience, '10') || str_contains($experience, '10+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 10');
                } elseif (str_contains($experience, '4') || str_contains($experience, '4+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 4');
                }
            });
        }

        // Top doctor filter - filter by highest rated clinics/doctors
        if (isset($filters['top_doctor']) && $filters['top_doctor']) {
            $query->whereHas('clinic', function($q) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->where('average_rating', '>=', 4.5)
                  ->where('total_reviews', '>=', 10);
            });
        }

        // Discount filter
        if (isset($filters['is_discounted']) && $filters['is_discounted']) {
            $query->where('has_discount', true);
        }

        // Sort by
        $sortBy = $filters['sort_by'] ?? 'newest';
        
        // Check if distance was calculated (location filter with lat/lng)
        $hasDistance = isset($filters['latitude']) && isset($filters['longitude']);
        
        switch ($sortBy) {
            case 'newest':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('created_at', 'desc');
                } else {
                $query->orderBy('created_at', 'desc');
                }
                break;
            case 'popularity':
            case 'most_popular':
            case 'best_selling':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('total_bookings', 'desc')
                          ->orderBy('average_rating', 'desc');
                } else {
                $query->orderBy('total_bookings', 'desc')
                      ->orderBy('average_rating', 'desc');
                }
                break;
            case 'price_asc':
            case 'lowest_price':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('base_price', 'asc');
                } else {
                $query->orderBy('base_price', 'asc');
                }
                break;
            case 'price_desc':
            case 'highest_price':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('base_price', 'desc');
                } else {
                $query->orderBy('base_price', 'desc');
                }
                break;
            case 'rating':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('average_rating', 'desc')
                          ->orderBy('total_reviews', 'desc');
                } else {
                $query->orderBy('average_rating', 'desc')
                      ->orderBy('total_reviews', 'desc');
                }
                break;
            default:
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('created_at', 'desc');
                } else {
                $query->orderBy('created_at', 'desc');
                }
                break;
        }

        return $query->paginate($perPage);
    }

    /**
     * Get latest services
     */
    public function getLatestTreatments(int $limit = 10): Collection
    {
        return $this->model
            ->with(['vendor:id,name,email,phone', 'category:id,name_en,name_ar'])
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get services with discount
     */
    public function getDiscountedTreatments(int $limit = 10): Collection
    {
        return $this->model
            ->with(['vendor:id,name,email,phone', 'category:id,name_en,name_ar', 'media'])
            ->where('status', 'approved')
            ->where('has_discount', true)
            ->orderBy('discount_value', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get service with full details (clinic, category, reviews, media, machines)
     * If date is provided, only machines available on that date will be returned
     */
    public function getTreatmentWithFullDetails(int $id, ?string $date = null): ?Treatment
    {
        $treatment = $this->model->with([
            'clinic' => function ($query) {
                $query->select('id', 'name_en', 'name_ar', 'email', 'phone', 'logo', 'status', 'owner_id')
                    ->with([
                    'operatingHours',
                    'area:id,name_en,name_ar',
                    'governorate:id,name_en,name_ar',
                    'owner:id,name,email,status',
                    'media' => function ($mediaQuery) {
                        $mediaQuery->where('collection_name', 'logos');
                    }
                ]);
            },
            'category:id,name_en,name_ar',
            'reviews' => function ($query) {
                $query->with(['user:id,name,avatar'])
                      ->orderBy('created_at', 'desc')
                      ->limit(5);
            },
            'media' => function ($query) {
                $query->orderBy('id', 'asc')->limit(10);
            },
            'addOns' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }
        ])->find($id);

        if (!$treatment) {
            return null;
        }

        // Load machines - if date is provided, filter to only machines with available slots on that date
        if ($date) {
            // First, check if there are any available slots for this treatment on this date
            $allSlots = $this->getAvailability($id, $date, null);
            
            if (empty($allSlots) || !collect($allSlots)->contains('available', true)) {
                // No available slots, don't show any machines
                $treatment->setRelation('machines', collect([]));
            } else {
                // Get available machines for this treatment on the specified date
                $machineRepo = app(\App\Contracts\MachineRepositoryInterface::class);
                $availableMachines = $machineRepo->getAvailableMachinesForTreatment($id, $date);
                
                // Get all machine IDs that have available slots
                $machineIdsWithSlots = [];
                foreach ($availableMachines as $machine) {
                    $slots = $this->getAvailability($id, $date, [$machine->id]);
                    if (!empty($slots) && collect($slots)->contains('available', true)) {
                        $machineIdsWithSlots[] = $machine->id;
                    }
                }
                
                // Filter machines to only those that have available slots
                $machinesWithSlots = $availableMachines->whereIn('id', $machineIdsWithSlots);
                
                $treatment->setRelation('machines', $machinesWithSlots);
            }
        } else {
            // Load all machines (no date filter) - for dashboard, show all machines
            $treatment->load([
                'machines' => function ($query) {
                    $query->with(['media', 'clinic:id,name_en,name_ar'])
                          ->orderByRaw("CASE WHEN status = 'ready' THEN 1 WHEN status = 'busy' THEN 2 WHEN status = 'maintenance' THEN 3 ELSE 4 END")
                          ->orderBy('model_en', 'asc');
                }
            ]);
        }
        
        // Also load addOns if not already loaded
        if (!$treatment->relationLoaded('addOns')) {
            $treatment->load('addOns');
        }

        return $treatment;
    }

    /**
     * Get packages that include this treatment
     */
    public function getPackagesByTreatmentId(int $treatmentId, int $limit = 10): Collection
    {
        // TODO: Implement when SubscriptionPackage model supports treatments
        // For now, return empty collection
        return new Collection();
    }

    /**
     * Get relevant services (same category or vendor, excluding current service)
     */
    public function getRelevantTreatments(int $treatmentId, int $limit = 6): Collection
    {
        $treatment = $this->model->find($treatmentId);
        
        if (!$treatment) {
            return collect([]);
        }

        return $this->model->with(['clinic:id,name_en,name_ar', 'category:id,name_en,name_ar', 'media'])
            ->where('status', 'approved')
            ->where('id', '!=', $treatmentId)
            ->where(function ($query) use ($treatment) {
                $query->where('category_id', $treatment->category_id)
                      ->orWhere('clinic_id', $treatment->clinic_id);
            })
            ->orderByRaw('
                CASE 
                    WHEN category_id = ? THEN 1 
                    WHEN clinic_id = ? THEN 2 
                    ELSE 3 
                END
            ', [$treatment->category_id, $treatment->clinic_id])
            ->limit($limit)
            ->get();
    }

    /**
     * Get paginated treatments with role-based filtering for dashboard
     */
    public function getPaginatedWithRoleFilter(Request $request, int $perPage = 15, ?array $accessibleClinicIds = null): LengthAwarePaginator
    {
        $query = $this->model->with([
            'clinic' => function ($query) {
                $query->select('id', 'name_en', 'name_ar', 'email', 'phone', 'logo', 'status')
                    ->with(['owner:id,name,email,phone']);
            },
            'category:id,name_en,name_ar',
            'machines:id,model_en,model_ar,manufacturer_en,manufacturer_ar,status',
            'addOns:id,treatment_id,name_en,name_ar,price',
            'media' => function($q) {
                $q->where('collection_name', 'images')->orderBy('created_at', 'desc')->limit(1);
            }
        ])->withCount(['bookings', 'reviews']);

        // Apply role-based clinic filtering
        if ($accessibleClinicIds !== null) {
            if (empty($accessibleClinicIds)) {
                // Super admin: no filtering (access all treatments)
            } else {
                // Clinic role: show global treatments + their own treatments
                $approvedClinicIds = \App\Models\Clinic::whereIn('id', $accessibleClinicIds)
                    ->where('status', 'approved')
                    ->pluck('id')
                    ->toArray();
                
                $query->where(function($q) use ($approvedClinicIds) {
                    $q->whereNull('clinic_id') // Global treatments (no clinic assigned, created by admin)
                      ->orWhereIn('clinic_id', $approvedClinicIds); // Treatments from approved accessible clinics
                });
            }
        }

        // Apply search
        $search = $request->get('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('name_ar', 'LIKE', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->has('filters.clinic_id')) {
            $query->where('clinic_id', $request->input('filters.clinic_id'));
        }
        if ($request->has('filters.category_id')) {
            $query->where('category_id', $request->input('filters.category_id'));
        }
        if ($request->has('filters.status')) {
            $query->where('status', $request->input('filters.status'));
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}

