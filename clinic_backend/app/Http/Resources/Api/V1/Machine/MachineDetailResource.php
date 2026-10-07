<?php

namespace App\Http\Resources\Api\V1\Machine;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use App\Http\Resources\Api\V1\Clinic\ClinicOperatingHourResource;
use Illuminate\Http\Request;

class MachineDetailResource extends BaseResource
{
    public function toArray(Request $request): array
    {

        // Build full address for clinic - ensure clinic name never appears
        $clinicFullAddress = null;
        $clinicAddress = null;
        if ($this->relationLoaded('clinic') && $this->clinic) {
            // Get clinic names for comparison
            $nameEnTrimmed = $this->clinic->name_en ? trim($this->clinic->name_en) : '';
            $nameArTrimmed = $this->clinic->name_ar ? trim($this->clinic->name_ar) : '';
            $nameEnLower = strtolower($nameEnTrimmed);
            $nameArLower = strtolower($nameArTrimmed);
            
            $addressParts = array_filter([
                $this->clinic->block ? __('common.address_block') . $this->clinic->block : null,
                $this->clinic->street ? __('common.address_street') . $this->clinic->street : null,
                $this->clinic->house ? __('common.address_building') . $this->clinic->house : null,
                $this->clinic->area ? $this->localized('name', $this->clinic->area) : null,
                $this->clinic->city ?: null,
            ]);
            $clinicFullAddress = !empty($addressParts) ? implode(', ', $addressParts) : null;
            
            // Safety check: Never use $this->clinic->address if it contains the clinic name
            if ($clinicFullAddress === null && $this->clinic->address) {
                $addressTrimmed = trim($this->clinic->address);
                $addressLower = strtolower($addressTrimmed);
                
                // Check if address equals clinic name or contains clinic name
                $isClinicName = false;
                if ($addressTrimmed !== '') {
                    if ($nameEnTrimmed && strcasecmp($addressTrimmed, $nameEnTrimmed) === 0) {
                        $isClinicName = true;
                    } elseif ($nameArTrimmed && strcasecmp($addressTrimmed, $nameArTrimmed) === 0) {
                        $isClinicName = true;
                    } elseif ($nameEnLower && str_contains($addressLower, $nameEnLower)) {
                        $isClinicName = true;
                    } elseif ($nameArLower && str_contains($addressLower, $nameArLower)) {
                        $isClinicName = true;
                    }
                }
                
                // Only use address if it's not the clinic name and doesn't contain it
                if (!$isClinicName) {
                    $clinicFullAddress = $addressTrimmed;
                }
            }
            
            // Final safety check: Ensure fullAddress doesn't contain clinic name
            if ($clinicFullAddress) {
                $fullAddressLower = strtolower($clinicFullAddress);
                if (($nameEnLower && str_contains($fullAddressLower, $nameEnLower)) || 
                    ($nameArLower && str_contains($fullAddressLower, $nameArLower))) {
                    $clinicFullAddress = null;
                }
            }
            
            // Set clinicAddress (for backward compatibility) - same as fullAddress but with safety check
            $clinicAddress = $clinicFullAddress;
        }

        return [
            'id' => $this->id,
            'model' => $this->localized('model'),
            'manufacturer' => $this->localized('manufacturer'),
            'serial_number' => $this->serial_number,
            'image' => $this->getImageFromMedia(),
            'status' => $this->status,
            'request_status' => $this->request_status,
            'description' => $this->localized('description'),
            'category_id' => $this->category_id, // Keep for backward compatibility
            'clinic_id' => $this->clinic_id,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'clinic' => $this->whenLoaded('clinic', function () use ($clinicFullAddress, $clinicAddress) {
                if (!$this->clinic) {
                    return null;
                }
                
                return [
                    'id' => $this->clinic->id,
                    'name' => $this->localized('name', null, $this->clinic),
                    'logo' => $this->clinic->logo,
                    'address' => $clinicAddress,
                    'full_address' => $clinicFullAddress,
                    'phone' => $this->clinic->phone,
                    'email' => $this->clinic->email,
                    'latitude' => $this->clinic->latitude ? (float) $this->clinic->latitude : null,
                    'longitude' => $this->clinic->longitude ? (float) $this->clinic->longitude : null,
                    'rating' => $this->clinic->average_rating ? (float) $this->clinic->average_rating : 0.0,
                    'total_reviews' => $this->clinic->total_reviews ?? 0,
                    'total_bookings' => $this->clinic->total_bookings ?? 0,
                    'is_featured' => $this->clinic->is_featured ?? false,
                    'status' => $this->clinic->status,
                    'area' => $this->clinic->relationLoaded('area') && $this->clinic->area ? [
                        'id' => $this->clinic->area->id,
                        'name' => $this->localized('name', null, $this->clinic->area),
                    ] : null,
                    'governorate' => $this->clinic->relationLoaded('governorate') && $this->clinic->governorate ? [
                        'id' => $this->clinic->governorate->id,
                        'name' => $this->localized('name', null, $this->clinic->governorate),
                    ] : null,
                    'operating_hours' => $this->clinic->relationLoaded('operatingHours') && $this->clinic->operatingHours 
                        ? ClinicOperatingHourResource::collection($this->clinic->operatingHours)
                        : [],
                    'cancellation_policy' => $this->localized('cancellation_policy', $this->clinic),
                    'refund_policy' => $this->localized('refund_policy', $this->clinic),
                    'reschedule_policy' => $this->localized('reschedule_policy', $this->clinic),
                ];
            }),

            'category' => $this->whenLoaded('category', function () {
                return $this->category ? new CategoryResource($this->category) : null;
            }), // Keep for backward compatibility

            'categories' => $this->whenLoaded('categories', function () {
                if ($this->categories && $this->categories->isNotEmpty()) {
                return CategoryResource::collection($this->categories);
                }
                return [];
            }, []),

            'treatments' => $this->whenLoaded('treatments', function () {
                return TreatmentResource::collection($this->treatments);
            }),

            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }),
        ];
    }

    /**
     * Get image URL from media relationship
     */
    private function getImageFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $imageMedia = $this->media->where('collection_name', 'images')->first() ?? $this->media->first();
            if ($imageMedia) {
                return $imageMedia->file_name ?? $imageMedia->url ?? null;
            }
        }
        // Fallback to image field if media not loaded
        return $this->image;
    }
}

