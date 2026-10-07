<?php

namespace App\Repositories;

use App\Contracts\StaffLeaveRepositoryInterface;
use App\Models\Clinic;
use App\Models\StaffLeave;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StaffLeaveRepository implements StaffLeaveRepositoryInterface
{
    public function paginateForUser(User $user, array $filters): LengthAwarePaginator
    {
        return StaffLeave::accessibleTo($user)
            ->with(['clinic:id,name_en,name_ar', 'staff:id,name'])
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->whereHas(
                'staff', fn ($staff) => $staff->where('name', 'like', '%'.$search.'%')
            ))
            ->when($filters['clinic_id'] ?? null, fn ($q, $id) => $q->where('clinic_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('start_date')->orderByDesc('id')
            ->paginate(15)->withQueryString();
    }

    public function findForUser(User $user, int $id): StaffLeave
    {
        return StaffLeave::accessibleTo($user)
            ->with(['clinic:id,name_en,name_ar', 'staff:id,name'])
            ->findOrFail($id);
    }

    public function clinicsForUser(User $user): Collection
    {
        return Clinic::query()
            ->when(!$user->hasRole('super-admin'), fn ($q) => $q->whereIn('id', $user->getAccessibleClinicIds()))
            ->with(['users' => fn ($q) => $q->select('users.id', 'users.name')->orderBy('name')])
            ->orderBy('name_en')->get(['id', 'name_en', 'name_ar']);
    }

    public function save(array $data, ?StaffLeave $leave = null): StaffLeave
    {
        return DB::transaction(function () use ($data, $leave) {
            // Serialize leave writes for this staff member, including overlap checks.
            $staff = User::whereKey($data['staff_id'])->lockForUpdate()->firstOrFail();
            if (!$staff->clinics()->where('clinics.id', $data['clinic_id'])->exists()) {
                throw ValidationException::withMessages(['staff_id' => __('common.staff_leave_invalid_staff')]);
            }

            // Inclusive full-day ranges: rejected/cancelled leave does not reserve dates.
            if (in_array($data['status'], ['pending', 'approved'], true)) {
                $overlap = StaffLeave::where('clinic_id', $data['clinic_id'])
                    ->where('staff_id', $data['staff_id'])
                    ->whereIn('status', ['pending', 'approved'])
                    ->when($leave, fn ($q) => $q->where('id', '!=', $leave->id))
                    ->whereDate('start_date', '<=', $data['end_date'])
                    ->whereDate('end_date', '>=', $data['start_date'])
                    ->exists();
                if ($overlap) {
                    throw ValidationException::withMessages(['start_date' => __('common.staff_leave_overlap')]);
                }
            }

            $leave ??= new StaffLeave();
            $leave->fill($data)->save();

            return $leave;
        });
    }

    public function delete(StaffLeave $leave): void
    {
        DB::transaction(fn () => $leave->delete());
    }
}
