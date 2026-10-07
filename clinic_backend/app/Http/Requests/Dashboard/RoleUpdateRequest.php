<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('roles.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->route('id');

        return [
            'alias' => ['required', 'string', 'max:255'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($roleId),
                'regex:/^[a-z0-9-]+$/'
            ],
            'guard_name' => ['required', 'string', 'in:web'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'alias' => __('common.role_alias'),
            'name' => __('common.role_name'),
            'guard_name' => __('common.guard_name'),
            'permissions' => __('common.permissions'),
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.regex' => __('common.role_name_format'),
            'name.unique' => __('common.role_name_exists'),
        ];
    }

    /**
     * Prepare the data for validation.
     * Ensure dashboard.view is always included in permissions.
     */
    protected function prepareForValidation(): void
    {
        $permissions = $this->input('permissions', []);
        
        // Ensure dashboard.view is always included
        if (!in_array('dashboard.view', $permissions)) {
            $permissions[] = 'dashboard.view';
            $this->merge(['permissions' => array_unique($permissions)]);
        }
    }
}
