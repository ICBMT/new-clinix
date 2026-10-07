<?php

namespace App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface MediaRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get medical records for a user
     */
    public function getMedicalRecords(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find medical record by ID and user ID
     */
    public function findMedicalRecord(int $id, int $userId);
}


