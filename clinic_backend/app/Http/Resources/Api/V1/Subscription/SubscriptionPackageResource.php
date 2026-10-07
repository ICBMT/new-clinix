<?php

namespace App\Http\Resources\Api\V1\Subscription;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use Illuminate\Http\Request;

class SubscriptionPackageResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'price' => $this->price,
            'currency' => $this->currency,
            'billing_cycle' => $this->billing_cycle,
            'duration_days' => $this->duration_days,
            'features' => $this->features ?? [],
            'max_services' => $this->max_services,
            'max_bookings_per_month' => $this->max_bookings_per_month,
            'max_machines' => $this->max_machines,
            'max_treatments' => $this->max_treatments,
            'document_storage_gb' => $this->document_storage_gb,
            'file_size_limit_mb' => $this->file_size_limit_mb,
            'featured_listing' => $this->featured_listing ?? false,
            'priority_support' => $this->priority_support ?? false,
            'analytics_access' => $this->analytics_access ?? false,
            'basic_reports' => $this->basic_reports ?? true,
            'advanced_reports' => $this->advanced_reports ?? false,
            'custom_branding' => $this->custom_branding ?? false,
            'banner_slots_per_month' => $this->banner_slots_per_month ?? 0,
            'featured_clinic_listings' => $this->featured_clinic_listings ?? 0,
            'featured_treatment_slots' => $this->featured_treatment_slots ?? 0,
            'featured_machine_slots' => $this->featured_machine_slots ?? 0,
            'support_tier' => $this->support_tier,
            'training_sessions' => $this->training_sessions ?? 0,
            'custom_domain' => $this->custom_domain,
            'status' => $this->status,
            'sort_order' => $this->sort_order ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'clinic_subscriptions' => $this->whenLoaded('clinicSubscriptions', function () {
                return \App\Http\Resources\Api\V1\Clinic\ClinicSubscriptionResource::collection($this->clinicSubscriptions);
            }, []),
            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }, []),
        ];
    }
}

