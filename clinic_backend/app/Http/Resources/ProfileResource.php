<?php

namespace App\Http\Resources;

use App\Http\Resources\Api\V1\Auth\UserResource;
use Illuminate\Http\Request;

class ProfileResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'verification_status' => $this->verification_status,
            'rejection_reason' => $this->rejection_reason,
            'approved_at' => $this->approved_at,
            'business_license_path' => $this->business_license_path,
            'id_document_front_path' => $this->id_document_front_path,
            'id_document_back_path' => $this->id_document_back_path,
            'address' => $this->address,
            'area_id' => $this->area_id,
            'block' => $this->block,
            'street' => $this->street,
            'avenue' => $this->avenue,
            'house' => $this->house,
            'floor' => $this->floor,
            'apt' => $this->apt,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'company_name' => $this->localized('name'),
            'bio' => $this->localized('bio'),
            'logo' => $this->logo,
            'website' => $this->website,
            'social_links' => $this->social_links,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'years_in_business' => $this->years_in_business,
            'average_rating' => $this->average_rating,
            'total_reviews' => $this->total_reviews,
            'total_bookings' => $this->total_bookings,
            'is_featured' => $this->is_featured,
            'auto_confirm_bookings' => $this->auto_confirm_bookings,
            'cancellation_policy' => $this->cancellation_policy,
            'refund_policy' => $this->refund_policy,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'area' => $this->whenLoaded('area', function () {
                return [
                    'id' => $this->area->id,
                    'name' => $this->localized('name', null, $this->area),
                ];
            }),
            'media' => $this->whenLoaded('media', function () {
                return \App\Http\Resources\Api\V1\Media\MediaResource::collection($this->media);
            }, []),
        ];
    }
}
