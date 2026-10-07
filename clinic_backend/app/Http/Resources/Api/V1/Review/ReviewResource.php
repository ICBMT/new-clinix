<?php

namespace App\Http\Resources\Api\V1\Review;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class ReviewResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'treatment_id' => $this->treatment_id,
            'clinic_id' => $this->clinic_id,
            'user_id' => $this->user_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'would_recommend' => $this->would_recommend,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'avatar' => $this->user->avatar && !str_starts_with($this->user->avatar, 'http') 
                        ? url($this->user->avatar) 
                        : $this->user->avatar,
                ];
            }),
            'clinic' => $this->whenLoaded('clinic', function () {
                // Get clinic logo
                $logo = null;
                if ($this->clinic->logo) {
                    $logo = str_starts_with($this->clinic->logo, 'http://') || str_starts_with($this->clinic->logo, 'https://') 
                        ? $this->clinic->logo 
                        : asset('storage/' . ltrim($this->clinic->logo, '/'));
                }
                
                // Get localized clinic name
                $name = $this->localized('name', null, $this->clinic);
                
                // Get governorate and area names
                $governorateName = null;
                $areaName = null;
                
                if ($this->clinic->relationLoaded('governorate') && $this->clinic->governorate) {
                    $governorateName = $this->localized('name', null, $this->clinic->governorate);
                }
                
                if ($this->clinic->relationLoaded('area') && $this->clinic->area) {
                    $areaName = $this->localized('name', null, $this->clinic->area);
                }
                
                // Build full address from all components
                $addressParts = [];
                
                // Start with main address if available
                if ($this->clinic->address) {
                    $addressParts[] = $this->clinic->address;
                }
                
                // Add block, street, avenue
                if ($this->clinic->block) {
                    $addressParts[] = __('common.address_block') . $this->clinic->block;
                }
                if ($this->clinic->street) {
                    $addressParts[] = $this->clinic->street . ' ' . __('common.street');
                }
                if ($this->clinic->avenue) {
                    $addressParts[] = $this->clinic->avenue . ' ' . __('common.avenue');
                }
                
                // Add house, floor, apt
                if ($this->clinic->house) {
                    $houseInfo = __('common.address_house') . $this->clinic->house;
                    if ($this->clinic->floor) {
                        $houseInfo .= __('common.address_floor_comma') . $this->clinic->floor;
                    }
                    if ($this->clinic->apt) {
                        $houseInfo .= __('common.address_apt') . $this->clinic->apt;
                    }
                    $addressParts[] = $houseInfo;
                } elseif ($this->clinic->floor) {
                    $addressParts[] = __('common.address_floor') . $this->clinic->floor;
                }
                
                // Add area and governorate
                if ($areaName) {
                    $addressParts[] = $areaName;
                }
                if ($governorateName) {
                    $addressParts[] = $governorateName;
                }
                
                // Add city, state, country
                if ($this->clinic->city) {
                    $addressParts[] = $this->clinic->city;
                }
                if ($this->clinic->state) {
                    $addressParts[] = $this->clinic->state;
                }
                if ($this->clinic->country) {
                    $addressParts[] = $this->clinic->country;
                }
                
                // Add postal code
                if ($this->clinic->postal_code) {
                    $addressParts[] = $this->clinic->postal_code;
                }
                
                // Join all parts with comma and space, or use the main address if no parts
                $fullAddress = !empty($addressParts) ? implode(', ', $addressParts) : ($this->clinic->address ?? '');
                
                return [
                    'id' => $this->clinic->id,
                    'name' => $name,
                    'logo' => $logo,
                    'phone' => $this->clinic->phone,
                    'email' => $this->clinic->email,
                    'address' => [
                        'full_address' => $fullAddress,
                        'latitude' => $this->clinic->latitude ? (float) $this->clinic->latitude : null,
                        'longitude' => $this->clinic->longitude ? (float) $this->clinic->longitude : null,
                    ],
                ];
            }),
            'treatment' => $this->whenLoaded('treatment', function () {
                return [
                    'id' => $this->treatment->id,
                    'name' => $this->localized('name', null, $this->treatment),
                ];
            }),
            'booking' => $this->whenLoaded('booking', function () {
                return [
                    'id' => $this->booking->id,
                    'booking_reference' => $this->booking->booking_reference,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

