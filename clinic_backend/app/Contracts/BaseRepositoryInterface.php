<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * BaseRepositoryInterface
 * 
 * Base contract for all repositories with common CRUD operations
 * All specific repository interfaces should extend this interface
 */
interface BaseRepositoryInterface
{
    /**
     * Create a new record
     */
    public function create(array $data): Model;

    /**
     * Update an existing record
     */
    public function update(int $id, array $data): Model;

    /**
     * Delete a record (soft delete if available)
     */
    public function delete(int $id): bool;

    /**
     * Find record by ID
     */
    public function find(int $id): ?Model;

    /**
     * Find record by ID or fail
     */
    public function findOrFail(int $id): Model;

    /**
     * Find record(s) by criteria
     * 
     * @param array $criteria Search criteria
     * @param int|null $limit Optional limit. If null, returns single model or null. If set, returns collection.
     * @return \Illuminate\Database\Eloquent\Model|\Illuminate\Database\Eloquent\Collection|null
     */
    public function findBy(array $criteria, ?int $limit = null);

    /**
     * Get paginated records with filters and search
     */
    public function paginate(
        Request $request,
        int $perPage = 15,
        array $columns = ['*']
    ): LengthAwarePaginator;

    /**
     * Count records with filters
     */
    public function count(Request $request = null): int;

    /**
     * Check if record exists
     */
    public function exists(array $criteria): bool;
}
