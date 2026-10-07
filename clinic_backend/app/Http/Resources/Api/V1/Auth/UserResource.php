<?php

namespace App\Http\Resources\Api\V1\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar && !str_starts_with($this->avatar, 'http') ? url($this->avatar) : $this->avatar,
            'default_language' => $this->default_language,
            'status' => $this->status,
            'is_email_verified' => (bool) $this->email_verified_at,
            'is_phone_verified' => (bool) $this->phone_verified_at,
            
            // Medical profile fields
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'blood_type' => $this->blood_type,
            'skin_type' => $this->skin_type,
            'age' => $this->date_of_birth ? now()->diffInYears($this->date_of_birth) : ($this->age ?? null),
            'age_formatted' => $this->date_of_birth ? now()->diffInYears($this->date_of_birth) . ' ' . __('common.years_old') : null,
            'medical_history' => $this->medical_history ?? [],
            'allergies' => $this->allergies ?? [],
            'current_medications' => $this->current_medications ?? [],
            'medical_conditions' => $this->medical_conditions ?? [],
            'last_machine_used' => $this->last_machine_used ?? [],
            'last_machine_used_name' => $this->last_machine_used_name,
            'restricted_machines' => $this->restricted_machines ?? [],
            'restricted_machines_name' => $this->restricted_machines_name,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'emergency_contact_relationship' => $this->emergency_contact_relationship,
            'medical_profile_completed' => $this->medical_profile_completed,
            'medical_profile_completed_at' => $this->medical_profile_completed_at?->toISOString(),
            
            // Role
            'role' => $this->roles->first()?->name,
        ];
    }
}
