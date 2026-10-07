<?php

namespace App\Repositories;

use App\Contracts\MediaRepositoryInterface;
use App\Models\Media;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class MediaRepository extends BaseRepository implements MediaRepositoryInterface
{
    public function __construct(Media $model)
    {
        parent::__construct($model);
    }

    /**
     * Get medical records for a user
     */
    public function getMedicalRecords(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->where('mediable_type', User::class)
            ->where('mediable_id', $userId)
            ->where('collection_name', 'medical-records');

        // Apply filters
        if (isset($filters['search'])) {
            $query->where('file_name', 'like', "%{$filters['search']}%");
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Find medical record by ID and user ID
     */
    public function findMedicalRecord(int $id, int $userId)
    {
        return $this->model->where('id', $id)
            ->where('mediable_type', User::class)
            ->where('mediable_id', $userId)
            ->where('collection_name', 'medical-records')
            ->first();
    }
}


