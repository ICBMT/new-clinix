<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ClinicSubscriptionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('clinics-subscriptions.create');
    }

    public function rules(): array
    {
        return [
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
            'subscription_package_id' => ['required', 'integer', 'exists:subscription_packages,id'],
            'transaction_id' => ['nullable', 'integer', 'exists:transactions,id'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', 'in:active,expired,cancelled,suspended'],
            'auto_renew' => ['nullable', 'boolean'],
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function attributes(): array
    {
        return [
            'clinic_id' => __('common.clinic'),
            'subscription_package_id' => __('common.subscription_package'),
            'start_date' => __('common.start_date'),
            'end_date' => __('common.end_date'),
            'status' => __('common.status'),
        ];
    }
}

