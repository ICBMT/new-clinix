<?php

namespace Tests\Feature\Dashboard;

use App\Models\Clinic;
use App\Models\StaffLeave;
use App\Models\User;
use Database\Seeders\StaffLeavePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StaffLeaveTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $staff;
    private Clinic $clinic;
    private Clinic $otherClinic;
    private User $otherStaff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Queue::fake();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach (['super-admin', 'clinic', 'clinic_manager', 'user'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
        $this->seed(StaffLeavePermissionSeeder::class);

        $this->owner = User::withoutEvents(fn () => User::factory()->create());
        $this->owner->assignRole('clinic');
        $this->staff = User::withoutEvents(fn () => User::factory()->create(['name' => 'Clinic Staff']));
        $this->staff->assignRole('clinic_manager');
        $otherOwner = User::withoutEvents(fn () => User::factory()->create());
        $this->otherStaff = User::withoutEvents(fn () => User::factory()->create());
        $this->clinic = Clinic::withoutEvents(fn () => Clinic::create([
            'owner_id' => $this->owner->id, 'name_en' => 'My Clinic', 'status' => 'approved',
        ]));
        $this->otherClinic = Clinic::withoutEvents(fn () => Clinic::create([
            'owner_id' => $otherOwner->id, 'name_en' => 'Other Clinic', 'status' => 'approved',
        ]));
        $this->clinic->users()->attach($this->staff);
        $this->otherClinic->users()->attach($this->otherStaff);
    }

    private function payload(array $overrides = []): array
    {
        return array_replace([
            'clinic_id' => $this->clinic->id,
            'staff_id' => $this->staff->id,
            'leave_type' => 'annual',
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-12',
            'reason' => 'Family holiday',
            'status' => 'pending',
        ], $overrides);
    }

    public function test_owner_can_create_read_update_and_delete_leave(): void
    {
        $this->actingAs($this->owner)->get('/dashboard/staff-leaves/create')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/staff-leaves/form')->has('clinics', 1)
                ->where('clinics.0.staff.0.id', $this->staff->id));

        $this->post('/dashboard/staff-leaves', $this->payload())->assertSessionHasNoErrors()
            ->assertRedirect('/dashboard/staff-leaves');
        $leave = StaffLeave::sole();
        $this->assertDatabaseHas('staff_leaves', $this->payload());
        $this->get("/dashboard/staff-leaves/{$leave->id}")->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/staff-leaves/show')
                ->where('leave.staff.name', 'Clinic Staff')->where('leave.start_date', '2026-11-10'));
        $this->get("/dashboard/staff-leaves/{$leave->id}/edit")->assertOk();

        // Updating the same range excludes the current record from overlap detection.
        $this->put("/dashboard/staff-leaves/{$leave->id}", $this->payload(['status' => 'approved']))
            ->assertSessionHasNoErrors()->assertRedirect('/dashboard/staff-leaves');
        $this->assertDatabaseHas('staff_leaves', ['id' => $leave->id, 'status' => 'approved']);
        $this->delete("/dashboard/staff-leaves/{$leave->id}")->assertRedirect('/dashboard/staff-leaves');
        $this->assertDatabaseMissing('staff_leaves', ['id' => $leave->id]);
        $this->assertDatabaseHas('activity_log', ['subject_type' => StaffLeave::class, 'subject_id' => $leave->id, 'event' => 'created']);
        $this->assertDatabaseHas('activity_log', ['subject_type' => StaffLeave::class, 'subject_id' => $leave->id, 'event' => 'updated']);
        $this->assertDatabaseHas('activity_log', ['subject_type' => StaffLeave::class, 'subject_id' => $leave->id, 'event' => 'deleted']);
    }

    public function test_other_clinic_records_are_hidden_and_cannot_be_modified(): void
    {
        StaffLeave::create($this->payload());
        $foreign = StaffLeave::create($this->payload(['clinic_id' => $this->otherClinic->id, 'staff_id' => $this->otherStaff->id]));
        $this->actingAs($this->owner)->get('/dashboard/staff-leaves')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('leaves.data', 1)->has('clinics', 1));
        $this->get("/dashboard/staff-leaves/{$foreign->id}")->assertNotFound();
        $this->get("/dashboard/staff-leaves/{$foreign->id}/edit")->assertNotFound();
        $this->put("/dashboard/staff-leaves/{$foreign->id}", $this->payload())->assertNotFound();
        $this->delete("/dashboard/staff-leaves/{$foreign->id}")->assertNotFound();
        $this->assertDatabaseHas('staff_leaves', ['id' => $foreign->id, 'clinic_id' => $this->otherClinic->id]);
    }

    public function test_clinic_manager_is_scoped_to_assigned_clinics(): void
    {
        StaffLeave::create($this->payload());
        StaffLeave::create($this->payload(['clinic_id' => $this->otherClinic->id, 'staff_id' => $this->otherStaff->id]));
        $this->actingAs($this->staff)->get('/dashboard/staff-leaves')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('leaves.data', 1)->has('clinics', 1));
        $this->post('/dashboard/staff-leaves', $this->payload(['start_date' => '2026-12-01', 'end_date' => '2026-12-01']))
            ->assertSessionHasNoErrors()->assertRedirect('/dashboard/staff-leaves');
    }

    public function test_super_admin_can_access_all_clinics(): void
    {
        $admin = User::withoutEvents(fn () => User::factory()->create());
        $admin->assignRole('super-admin');
        StaffLeave::create($this->payload());
        $foreign = StaffLeave::create($this->payload(['clinic_id' => $this->otherClinic->id, 'staff_id' => $this->otherStaff->id]));
        $this->actingAs($admin)->get('/dashboard/staff-leaves')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('leaves.data', 2)->has('clinics', 2));
        $this->get("/dashboard/staff-leaves/{$foreign->id}")->assertOk();
    }

    public function test_forged_clinic_and_staff_assignments_are_rejected_on_create_and_update(): void
    {
        $this->actingAs($this->owner);
        $this->post('/dashboard/staff-leaves', $this->payload(['clinic_id' => $this->otherClinic->id, 'staff_id' => $this->otherStaff->id]))
            ->assertSessionHasErrors('clinic_id');
        $this->post('/dashboard/staff-leaves', $this->payload(['staff_id' => $this->otherStaff->id]))
            ->assertSessionHasErrors('staff_id');
        $this->assertDatabaseCount('staff_leaves', 0);

        $leave = StaffLeave::create($this->payload());
        $this->put("/dashboard/staff-leaves/{$leave->id}", $this->payload(['clinic_id' => $this->otherClinic->id, 'staff_id' => $this->otherStaff->id]))
            ->assertSessionHasErrors('clinic_id');
        $this->assertDatabaseHas('staff_leaves', ['id' => $leave->id, 'clinic_id' => $this->clinic->id]);
    }

    public function test_invalid_dates_types_status_and_reason_are_rejected(): void
    {
        $this->actingAs($this->owner)->post('/dashboard/staff-leaves', $this->payload([
            'end_date' => '2026-11-09', 'leave_type' => 'invalid', 'status' => 'invalid', 'reason' => '',
        ]))->assertSessionHasErrors(['end_date', 'leave_type', 'status', 'reason']);
        $this->post('/dashboard/staff-leaves', $this->payload(['reason' => str_repeat('x', 2001)]))
            ->assertSessionHasErrors('reason');
        $this->assertDatabaseCount('staff_leaves', 0);
    }

    public function test_inclusive_overlaps_are_blocked_but_cancelled_and_rejected_leave_does_not_block_dates(): void
    {
        StaffLeave::create($this->payload(['status' => 'approved']));
        $this->actingAs($this->owner)->post('/dashboard/staff-leaves', $this->payload(['start_date' => '2026-11-12', 'end_date' => '2026-11-14']))
            ->assertSessionHasErrors('start_date');
        $this->post('/dashboard/staff-leaves', $this->payload(['start_date' => '2026-11-13', 'end_date' => '2026-11-13']))
            ->assertSessionHasNoErrors();
        $this->post('/dashboard/staff-leaves', $this->payload(['status' => 'cancelled']))->assertSessionHasNoErrors();
        $cancelled = StaffLeave::where('status', 'cancelled')->sole();
        $this->put("/dashboard/staff-leaves/{$cancelled->id}", $this->payload(['status' => 'approved']))->assertSessionHasErrors('start_date');

        StaffLeave::query()->delete();
        StaffLeave::create($this->payload(['status' => 'rejected']));
        StaffLeave::create($this->payload(['status' => 'cancelled']));
        $this->post('/dashboard/staff-leaves', $this->payload())->assertSessionHasNoErrors();
    }

    public function test_search_filters_and_pagination_preserve_clinic_scope(): void
    {
        for ($i = 0; $i < 16; $i++) {
            StaffLeave::create($this->payload(['status' => 'rejected']));
        }
        StaffLeave::create($this->payload(['status' => 'approved']));
        $this->actingAs($this->owner)->get('/dashboard/staff-leaves?status=rejected&search=Clinic')
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('leaves.data', 15)
                ->where('leaves.total', 16)->where('leaves.last_page', 2));
        $this->get('/dashboard/staff-leaves?status=rejected&search=Clinic&page=2')
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('leaves.data', 1));
        $this->get('/dashboard/staff-leaves?clinic_id='.$this->otherClinic->id)
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('leaves.data', 0));
    }

    public function test_permissions_are_enforced_for_every_action(): void
    {
        $leave = StaffLeave::create($this->payload());
        Role::findByName('clinic')->syncPermissions([]);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->actingAs($this->owner->fresh());
        foreach (['', '/create', "/{$leave->id}", "/{$leave->id}/edit"] as $path) {
            $this->get('/dashboard/staff-leaves'.$path)->assertForbidden();
        }
        $this->post('/dashboard/staff-leaves', $this->payload())->assertForbidden();
        $this->put("/dashboard/staff-leaves/{$leave->id}", $this->payload())->assertForbidden();
        $this->delete("/dashboard/staff-leaves/{$leave->id}")->assertForbidden();
    }

    public function test_guest_and_mobile_user_cannot_access_leave_dashboard(): void
    {
        $this->get('/dashboard/staff-leaves')->assertRedirect('/login');
        $mobile = User::withoutEvents(fn () => User::factory()->create());
        $mobile->assignRole('user');
        $this->actingAs($mobile)->get('/dashboard/staff-leaves')->assertRedirect('/login');
    }

    public function test_unassigned_staff_cannot_be_selected_after_form_load(): void
    {
        $this->clinic->users()->detach($this->staff);
        $this->actingAs($this->owner)->post('/dashboard/staff-leaves', $this->payload())->assertSessionHasErrors('staff_id');
    }

    public function test_permissions_alone_do_not_grant_access_to_unassigned_clinics(): void
    {
        $operator = User::withoutEvents(fn () => User::factory()->create());
        $role = Role::create(['name' => 'leave-operator', 'guard_name' => 'web']);
        $role->givePermissionTo(Permission::where('name', 'like', 'staff-leaves.%')->get());
        $operator->assignRole($role);
        $leave = StaffLeave::create($this->payload());

        $this->actingAs($operator)->get('/dashboard/staff-leaves')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('leaves.data', 0)->has('clinics', 0));
        $this->get("/dashboard/staff-leaves/{$leave->id}")->assertNotFound();
        $this->post('/dashboard/staff-leaves', $this->payload())->assertSessionHasErrors('clinic_id');
    }

    public function test_upgrade_permission_seeder_is_additive_and_idempotent(): void
    {
        $permission = Permission::firstOrCreate(['name' => 'custom.existing', 'guard_name' => 'web']);
        Role::findByName('clinic')->givePermissionTo($permission);
        $this->seed(StaffLeavePermissionSeeder::class);
        $this->seed(StaffLeavePermissionSeeder::class);
        $this->assertTrue(Role::findByName('clinic')->hasPermissionTo('custom.existing'));
        $this->assertSame(5, Permission::where('name', 'like', 'staff-leaves.%')->count());
    }
}
