<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/** Add only staff-leave permissions on existing installations, without resetting roles. */
class StaffLeavePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['view', 'create', 'show', 'edit', 'destroy'] as $action) {
            $permission = Permission::firstOrCreate(['name' => "staff-leaves.{$action}", 'guard_name' => 'web']);
            foreach (Role::where('guard_name', 'web')->whereIn('name', ['super-admin', 'clinic', 'clinic_manager'])->get() as $role) {
                $role->givePermissionTo($permission);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
