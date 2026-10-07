<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ClinicRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get top clinics
     */
    public function getTopClinics(int $limit = 6): Collection;

    /**
     * Search clinics
     */
    public function search(string $query, ?float $latitude = null, ?float $longitude = null, int $radius = 10): Collection;

    /**
     * Get clinics by location
     */
    public function getByLocation(float $latitude, float $longitude, int $radius = 10): array;

    /**
     * Get clinic statistics
     */
    public function getClinicStats(int $clinicId): array;

    /**
     * Find clinic with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?\App\Models\Clinic;

    /**
     * Get clinics owned by user
     */
    public function getByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get clinics where user is a member
     */
    public function getByUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get nearby clinics based on latitude/longitude
     * @param float $latitude
     * @param float $longitude
     * @param float $radius
     * @param int $limit
     * @param int|null $categoryId Optional category ID to filter by
     * @return Collection
     */
    public function getNearbyClinics(float $latitude, float $longitude, float $radius = 10, int $limit = 10, ?int $categoryId = null): Collection;

    /**
     * Get featured clinics
     */
    public function getFeaturedClinics(int $limit = 10): Collection;

    /**
     * Get active clinics
     */
    public function getActiveClinics(): Collection;

    /**
     * Filter clinics with advanced filters
     */
    public function filter(array $filters, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all clinic IDs
     */
    public function getAllClinicIds(): array;

    /**
     * Get approved clinics for dropdown
     * Returns clinics that are approved, optionally filtered by accessible clinic IDs
     */
    public function getApprovedClinicsForDropdown(?array $accessibleClinicIds = null): Collection;
}
