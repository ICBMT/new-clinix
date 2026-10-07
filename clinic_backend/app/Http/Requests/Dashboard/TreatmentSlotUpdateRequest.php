<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class TreatmentSlotUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('treatment-slots.edit');
    }

    protected function prepareForValidation(): void
    {
        // Normalize time values in weekly_schedule to ensure they're in H:i format
        if ($this->has('weekly_schedule') && is_array($this->input('weekly_schedule'))) {
            $normalizedSchedule = [];
            
            foreach ($this->input('weekly_schedule', []) as $daySchedule) {
                $normalizedDay = $daySchedule;
                
                // Normalize opening_time
                if (isset($daySchedule['opening_time'])) {
                    $openingTime = $daySchedule['opening_time'];
                    if (empty($openingTime) || $openingTime === '' || $openingTime === null) {
                        $normalizedDay['opening_time'] = null;
                    } elseif (is_string($openingTime)) {
                        // Remove any whitespace
                        $openingTime = trim($openingTime);
                        // Extract HH:mm from strings like "09:00:00" or "09:00"
                        if (strlen($openingTime) >= 5) {
                            $normalizedDay['opening_time'] = substr($openingTime, 0, 5);
                        } else {
                            $normalizedDay['opening_time'] = null;
                        }
                    } else {
                        $normalizedDay['opening_time'] = null;
                    }
                } else {
                    $normalizedDay['opening_time'] = null;
                }
                
                // Normalize closing_time
                if (isset($daySchedule['closing_time'])) {
                    $closingTime = $daySchedule['closing_time'];
                    if (empty($closingTime) || $closingTime === '' || $closingTime === null) {
                        $normalizedDay['closing_time'] = null;
                    } elseif (is_string($closingTime)) {
                        // Remove any whitespace
                        $closingTime = trim($closingTime);
                        // Extract HH:mm from strings like "17:00:00" or "17:00"
                        if (strlen($closingTime) >= 5) {
                            $normalizedDay['closing_time'] = substr($closingTime, 0, 5);
                        } else {
                            $normalizedDay['closing_time'] = null;
                        }
                    } else {
                        $normalizedDay['closing_time'] = null;
                    }
                } else {
                    $normalizedDay['closing_time'] = null;
                }
                
                $normalizedSchedule[] = $normalizedDay;
            }
            
            $this->merge(['weekly_schedule' => $normalizedSchedule]);
        }
    }

    public function rules(): array
    {
        // Check if weekly schedule is provided (for treatment weekly hours)
        $hasWeeklySchedule = $this->has('weekly_schedule') && is_array($this->input('weekly_schedule')) && !empty($this->input('weekly_schedule'));
        
        $rules = [
            'buffer_time_minutes' => ['nullable', 'integer', 'min:0'],
            'max_bookings_per_slot' => ['nullable', 'integer', 'min:1'],
            'slot_duration' => ['nullable', 'integer', 'min:1'],
            'notes_en' => ['nullable', 'string', 'max:1000', new EnglishOnly()],
            'notes_ar' => ['nullable', 'string', 'max:1000', new ArabicOnly()],
        ];

        if ($hasWeeklySchedule) {
            // Weekly schedule mode (for treatment weekly hours)
            $rules['clinic_id'] = ['required', 'integer', 'exists:clinics,id'];
            $rules['treatment_id'] = ['required', 'integer', 'exists:treatments,id'];
            $rules['weekly_schedule'] = ['required', 'array', 'min:1'];
            $rules['weekly_schedule.*.day_of_week'] = ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'];
            $rules['weekly_schedule.*.is_open'] = ['required', 'boolean'];
            $rules['weekly_schedule.*.opening_time'] = [
                'nullable', 
                function ($attribute, $value, $fail) {
                    // Only validate format if value is not null/empty
                    if ($value !== null && $value !== '') {
                        if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                            $fail(__('common.opening_time_invalid_format') ?: 'Opening time must be in HH:mm format');
                        }
                    }
                },
                'required_if:weekly_schedule.*.is_open,1'
            ];
            $rules['weekly_schedule.*.closing_time'] = [
                'nullable', 
                function ($attribute, $value, $fail) {
                    // Only validate format if value is not null/empty
                    if ($value !== null && $value !== '') {
                        if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                            $fail(__('common.closing_time_invalid_format') ?: 'Closing time must be in HH:mm format');
                        }
                    }
                },
                'required_if:weekly_schedule.*.is_open,1'
            ];
            $rules['weekly_schedule.*.notes_en'] = ['nullable', 'string', 'max:1000', new EnglishOnly()];
            $rules['weekly_schedule.*.notes_ar'] = ['nullable', 'string', 'max:1000', new ArabicOnly()];
        } else {
            // Single date mode (for individual treatment slots)
            $rules['treatment_id'] = ['required', 'integer', 'exists:treatments,id'];
            $rules['slot_date'] = ['required', 'date'];
            $rules['start_time'] = ['required', 'date_format:H:i'];
            $rules['end_time'] = ['required', 'date_format:H:i', 'after:start_time'];
            $rules['status'] = ['required', 'in:available,booked,blocked,maintenance'];
            $rules['price'] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }

    public function attributes(): array
    {
        return [
            'treatment_id' => __('common.treatment'),
            'slot_date' => __('common.slot_date'),
            'start_time' => __('common.start_time'),
            'end_time' => __('common.end_time'),
            'status' => __('common.status'),
            'clinic_id' => __('common.clinic'),
            'weekly_schedule' => __('common.weekly_schedule') ?: 'Weekly Schedule',
            'weekly_schedule.*.opening_time' => __('common.opening_time') ?: 'Opening Time',
            'weekly_schedule.*.closing_time' => __('common.closing_time') ?: 'Closing Time',
        ];
    }

    public function messages(): array
    {
        return [
            'weekly_schedule.*.opening_time.required_if' => __('common.opening_time_required_when_open'),
            'weekly_schedule.*.closing_time.required_if' => __('common.closing_time_required_when_open'),
            'weekly_schedule.*.opening_time.date_format' => __('common.opening_time_invalid_format'),
            'weekly_schedule.*.closing_time.date_format' => __('common.closing_time_invalid_format'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $weeklySchedule = $this->input('weekly_schedule', []);
            
            // Get clinic_id from request or route parameter
            $clinicId = $this->input('clinic_id') ?? $this->route('clinic');
            
            if (!is_array($weeklySchedule) || empty($weeklySchedule) || !$clinicId) {
                return;
            }
            
            // Load clinic operating hours
            $clinicOperatingHours = \App\Models\ClinicOperatingHour::where('clinic_id', $clinicId)
                ->get()
                ->keyBy('day_of_week');
            
            foreach ($weeklySchedule as $index => $daySchedule) {
                $dayOfWeek = $daySchedule['day_of_week'] ?? null;
                $dayName = ucfirst($dayOfWeek ?? 'day');
                $isOpen = $daySchedule['is_open'] ?? false;
                
                // Get clinic operating hours for this day
                $clinicHours = $clinicOperatingHours->get($dayOfWeek);
                
                // If clinic is closed on this day, treatment must also be closed
                if ($clinicHours && ($clinicHours->closed_all_day || !$clinicHours->is_open)) {
                    if ($isOpen) {
                        $validator->errors()->add(
                            "weekly_schedule.{$index}.is_open",
                            __('validation.treatment_cannot_be_open_when_clinic_closed', ['day' => $dayName]) ?: 
                            "Treatment cannot be open on {$dayName} because the clinic is closed on this day."
                        );
                    }
                    continue;
                }
                
                // If treatment is not open, skip time validation
                if (!$isOpen) {
                    continue;
                }
                
                // If clinic doesn't have operating hours for this day, skip validation
                if (!$clinicHours || !$clinicHours->is_open || $clinicHours->closed_all_day) {
                    continue;
                }
                
                $openingTime = $daySchedule['opening_time'] ?? null;
                $closingTime = $daySchedule['closing_time'] ?? null;
                
                if (!$openingTime || !$closingTime) {
                    continue; // Let required_if validation handle missing times
                }
                
                // Validate opening_time < closing_time
                $openingTimestamp = strtotime($openingTime);
                $closingTimestamp = strtotime($closingTime);
                
                if ($openingTimestamp === false || $closingTimestamp === false) {
                    continue; // Let date_format validation handle invalid formats
                }
                
                if ($openingTimestamp >= $closingTimestamp) {
                    $validator->errors()->add(
                        "weekly_schedule.{$index}.opening_time",
                        __('validation.opening_time_must_be_before_closing_time', ['day' => $dayName]) ?: 
                        "For {$dayName}, opening time must be before closing time."
                    );
                    $validator->errors()->add(
                        "weekly_schedule.{$index}.closing_time",
                        __('validation.closing_time_must_be_after_opening_time', ['day' => $dayName]) ?: 
                        "For {$dayName}, closing time must be after opening time."
                    );
                    continue;
                }
                
                // Validate treatment times are within clinic operating hours
                $clinicOpeningTime = $clinicHours->opening_time ? strtotime($clinicHours->opening_time->format('H:i')) : null;
                $clinicClosingTime = $clinicHours->closing_time ? strtotime($clinicHours->closing_time->format('H:i')) : null;
                
                if ($clinicOpeningTime !== false && $clinicClosingTime !== false) {
                    // Check if treatment opening time is before clinic opening time
                    if ($openingTimestamp < $clinicOpeningTime) {
                        $clinicOpeningFormatted = $clinicHours->opening_time->format('H:i');
                        $validator->errors()->add(
                            "weekly_schedule.{$index}.opening_time",
                            __('validation.treatment_opening_time_before_clinic', [
                                'day' => $dayName,
                                'clinic_time' => $clinicOpeningFormatted
                            ]) ?: 
                            "For {$dayName}, treatment opening time must be at or after clinic opening time ({$clinicOpeningFormatted})."
                        );
                    }
                    
                    // Check if treatment closing time is after clinic closing time
                    if ($closingTimestamp > $clinicClosingTime) {
                        $clinicClosingFormatted = $clinicHours->closing_time->format('H:i');
                        $validator->errors()->add(
                            "weekly_schedule.{$index}.closing_time",
                            __('validation.treatment_closing_time_after_clinic', [
                                'day' => $dayName,
                                'clinic_time' => $clinicClosingFormatted
                            ]) ?: 
                            "For {$dayName}, treatment closing time must be at or before clinic closing time ({$clinicClosingFormatted})."
                        );
                    }
                }
            }
        });
    }
}

