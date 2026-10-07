<?php

namespace App\Repositories;

use App\Contracts\CommissionSettingRepositoryInterface;
use App\Models\CommissionSetting;
use Illuminate\Database\Eloquent\Collection;

class CommissionSettingRepository extends BaseRepository implements CommissionSettingRepositoryInterface
{
    protected array $searchableFields = [
        'description',
    ];

    protected array $filterableFields = [
        'clinic_id',
        'is_default',
        'is_active',
        'frequency',
    ];

    public function __construct(CommissionSetting $model)
    {
        parent::__construct($model);
    }

    /**
     * Get default commission setting
     */
    public function getDefault(): ?CommissionSetting
    {
        return $this->model->where('is_default', true)->first();
    }

    /**
     * Set as default and unset others
     */
    public function setAsDefault(int $id): bool
    {
        return $this->withTransaction(function () use ($id) {
            // Unset all defaults
            $this->model->where('is_default', true)->update(['is_default' => false]);
            
            // Set this one as default
            return $this->model->where('id', $id)->update(['is_default' => true]);
        });
    }

    /**
     * Get commission settings by clinic
     */
    public function getByClinic(int $clinicId): Collection
    {
        return $this->model
            ->where('clinic_id', $clinicId)
            ->with('clinic:id,name_en,name_ar')
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

