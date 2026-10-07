<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface MachineRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get machines by clinic
     */
    public function getByClinic(int $clinicId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get machines by vendor (backward compatibility)
     */
    public function getByVendor(int $vendorId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get machine with full details
     */
    public function getMachineWithFullDetails(int $id): ?\App\Models\Machine;

    /**
     * Get treatments for a machine
     */
    public function getMachineTreatments(int $machineId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Search machines
     */
    public function search(string $query, ?int $vendorId = null): Collection;

    /**
     * Get machines by status
     */
    public function getByStatus(string $status, ?int $vendorId = null): Collection;

    /**
     * Get ready machines by vendor
     */
    public function getReadyByVendor(int $vendorId): Collection;

    /**
     * Get ready machines for home page
     */
    public function getReadyMachines(int $limit = 10): Collection;

    /**
     * Filter machines with pagination
     */
    public function filter(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get clinics that have a specific machine
     * 
     * Returns all clinics that have the same machine model (same model_en/model_ar)
     * This is useful when admin adds a machine and multiple clinics add that machine to their clinic
     */
    public function getMachineClinics(int $machineId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get available machines for a treatment on a specific date
     * 
     * Returns machines that:
     * - Are associated with the treatment
     * - Have status 'ready' (not busy or maintenance)
     * - Belong to the same clinic as the treatment
     * - Are not booked on the specified date
     */
    public function getAvailableMachinesForTreatment(int $treatmentId, string $date): Collection;

    /**
     * Get machines visible to a specific clinic
     * 
     * Returns global machines (clinic_id = null) and clinic-specific machines
     */
    public function getMachinesForClinic(int $clinicId): Collection;

    /**
     * Get machines by IDs
     */
    public function getByIds(array $ids): Collection;

    /**
     * Get machines accessible to a user based on their role
     * 
     * - Super admin sees all machines
     * - Clinic owner sees their clinics' machines + global machines
     * - Clinic manager sees their assigned clinics' machines + global machines
     * - Other roles with permissions see all machines (like super admin)
     */
    public function getMachinesForUser(\App\Models\User $user, ?array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all machines
     */
    public function all(): Collection;

    /**
     * Get accessible machines for treatment creation
     * Returns ready machines that are either global (clinic_id = null) or from approved accessible clinics
     */
    public function getAccessibleMachinesForTreatmentCreation(?array $accessibleClinicIds = null): Collection;
}

