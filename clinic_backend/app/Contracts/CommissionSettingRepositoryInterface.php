<?php

namespace App\Contracts;

interface CommissionSettingRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get default commission setting
     */
    public function getDefault(): ?\App\Models\CommissionSetting;

    /**
     * Set as default and unset others
     */
    public function setAsDefault(int $id): bool;

    /**
     * Get commission settings by clinic
     */
    public function getByClinic(int $clinicId): \Illuminate\Database\Eloquent\Collection;
}

