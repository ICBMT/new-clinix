<?php

namespace App\Repositories;

use App\Contracts\ReviewRepositoryInterface;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ReviewRepository extends BaseRepository implements ReviewRepositoryInterface
{
    public function __construct(Review $model)
    {
        parent::__construct($model);
    }

    /**
     * Get paginated reviews with role-based filtering
     */
    public function getPaginatedWithRoleFilter(Request $request, int $perPage = 15, ?array $accessibleClinicIds = null, ?int $userId = null): LengthAwarePaginator
    {
        $query = $this->model->with([
            'user:id,name,email',
            'booking' => function($q) {
                $q->select('id', 'booking_reference', 'clinic_id', 'treatment_id');
            },
            'booking.clinic:id,name_en,name_ar',
            'booking.treatment:id,name_en,name_ar',
            'clinic' => function ($query) {
                $query->select('id', 'name_en', 'name_ar', 'email', 'phone', 'logo')
                    ->with(['owner:id,name,email,phone']);
            }
        ]);

        // Apply role-based clinic filtering
        if ($accessibleClinicIds !== null && $userId !== null) {
            if (!empty($accessibleClinicIds)) {
                $query->where(function ($q) use ($accessibleClinicIds, $userId) {
                    $q->whereHas('booking', function ($bookingQuery) use ($accessibleClinicIds) {
                        $bookingQuery->whereIn('clinic_id', $accessibleClinicIds);
                    })
                    ->orWhereIn('clinic_id', $accessibleClinicIds)
                    ->orWhere('user_id', $userId);
                });
            } else {
                $query->where('user_id', $userId);
            }
        }

        $query->latest();

        // Apply filters
        $filters = $request->get('filters', []);
        
        if (isset($filters['rating']) && $filters['rating'] !== 'all') {
            $query->where('rating', $filters['rating']);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('booking.clinic', function ($q) use ($search) {
                        $q->where('name_en', 'like', "%{$search}%")
                            ->orWhere('name_ar', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage);
    }
}

