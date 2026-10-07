<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

trait AuthorizesActions
{
    /**
     * Authorize a specific action for the current user
     *
     * @param string $permission
     * @param mixed $model
     * @return void
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function authorizeAction(string $permission, $model = null): void
    {
        if (!Gate::allows($permission, $model)) {
            abort(403, __('common.unauthorized_action'));
        }
    }

    /**
     * Check if user can perform an action
     *
     * @param string $permission
     * @param mixed $model
     * @return bool
     */
    protected function canPerformAction(string $permission, $model = null): bool
    {
        return Gate::allows($permission, $model);
    }

    /**
     * Authorize multiple actions at once
     *
     * @param array $permissions
     * @param mixed $model
     * @return void
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function authorizeActions(array $permissions, $model = null): void
    {
        foreach ($permissions as $permission) {
            $this->authorizeAction($permission, $model);
        }
    }

    /**
     * Authorize site settings category access
     *
     * @param string $category
     * @param string $action
     * @return void
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function authorizeSiteSettings(string $category, string $action): void
    {
        $permission = "site-settings.{$category}.{$action}";
        if (!Gate::allows($permission)) {
            abort(403, __('common.unauthorized_action'));
        }
    }

    /**
     * Check if user can access site settings category
     *
     * @param string $category
     * @param string $action
     * @return bool
     */
    protected function canAccessSiteSettings(string $category, string $action): bool
    {
        $permission = "site-settings.{$category}.{$action}";
        return Gate::allows($permission);
    }

    /**
     * Get user permissions for a specific resource
     *
     * @param string $resource
     * @return array
     */
    protected function getUserPermissions(string $resource): array
    {
        $user = auth()->user();
        $permissions = [];
        
        $actions = ['view', 'create', 'store', 'show', 'edit', 'delete', 'destroy'];
        
        foreach ($actions as $action) {
            $permission = "{$resource}.{$action}";
            if ($user->can($permission)) {
                $permissions[] = $action;
            }
        }
        
        return $permissions;
    }

    /**
     * Get site settings permissions for user
     *
     * @param string $category
     * @return array
     */
    protected function getSiteSettingsPermissions(string $category): array
    {
        $user = auth()->user();
        $permissions = [];
        
        $actions = ['view', 'edit', 'reset', 'export', 'import'];
        
        foreach ($actions as $action) {
            $permission = "site-settings.{$category}.{$action}";
            if ($user->can($permission)) {
                $permissions[] = $action;
            }
        }
        
        return $permissions;
    }
}
