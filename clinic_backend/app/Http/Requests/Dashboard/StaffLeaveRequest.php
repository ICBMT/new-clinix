<?php

namespace App\Http\Requests\Dashboard;

use App\Models\StaffLeave;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $id = $this->route('staffLeave');
        if (!$user || !$user->can($id ? 'staff-leaves.edit' : 'staff-leaves.create')) {
            return false;
        }

        if ($id) {
            StaffLeave::accessibleTo($user)->findOrFail($id);
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'clinic_id' => [
                'bail', 'required', 'integer',
                Rule::exists('clinics', 'id')->whereNull('deleted_at'),
                function ($attribute, $value, $fail) {
                    if (!$this->user()->canAccessClinic((int) $value)) {
                        $fail(__('common.staff_leave_invalid_clinic'));
                    }
                },
            ],
            'staff_id' => [
                'bail', 'required', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at'),
                Rule::exists('clinic_users', 'user_id')->where('clinic_id', (int) $this->input('clinic_id')),
            ],
            'leave_type' => ['required', Rule::in(StaffLeave::TYPES)],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:2000'],
            'status' => ['required', Rule::in(StaffLeave::STATUSES)],
        ];
    }

    public function messages(): array
    {
        return [
            'staff_id.exists' => __('common.staff_leave_invalid_staff'),
            'end_date.after_or_equal' => __('common.staff_leave_invalid_dates'),
        ];
    }
}
