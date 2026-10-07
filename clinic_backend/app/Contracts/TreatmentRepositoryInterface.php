<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface TreatmentRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get treatments by clinic
     */
    public function getByClinic(int $clinicId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get treatments by vendor (backward compatibility)
     */
    public function getByVendor(int $vendorId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get featured treatments
     */
    public function getFeaturedTreatments(int $limit = 10): Collection;

    /**
     * Search treatments
     */
    public function search(string $query, ?int $categoryId = null, ?float $latitude = null, ?float $longitude = null, int $radius = 10): Collection;

    /**
     * Get treatment availability
     * @param int $treatmentId
     * @param string $date
     * @param array|null $machineIds Optional array of machine IDs to filter by
     */
    public function getAvailability(int $treatmentId, string $date, ?array $machineIds = null): array;

    /**
     * Filter treatments with advanced filters
     */
    public function filter(array $filters, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get latest treatments
     */
    public function getLatestTreatments(int $limit = 10): Collection;

    /**
     * Get treatments with discount
     */
    public function getDiscountedTreatments(int $limit = 10): Collection;

    /**
     * Get treatment with full details (vendor, category, add-ons, slots, reviews, media)
     */
    public function getTreatmentWithFullDetails(int $id): ?\App\Models\Treatment;

    /**
     * Get packages that include this treatment
     */
    public function getPackagesByTreatmentId(int $treatmentId, int $limit = 10): Collection;

    /**
     * Get relevant treatments (same category or vendor, excluding current treatment)
     */
    public function getRelevantTreatments(int $treatmentId, int $limit = 6): Collection;

    /**
     * Get paginated treatments with role-based filtering for dashboard
     */
    public function getPaginatedWithRoleFilter(Request $request, int $perPage = 15, ?array $accessibleClinicIds = null): LengthAwarePaginator;
}
