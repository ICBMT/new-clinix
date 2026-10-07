<?php

namespace App\Contracts;

use App\Models\StaffLeave;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface StaffLeaveRepositoryInterface
{
    public function paginateForUser(User $user, array $filters): LengthAwarePaginator;
    public function findForUser(User $user, int $id): StaffLeave;
    public function clinicsForUser(User $user): Collection;
    public function save(array $data, ?StaffLeave $leave = null): StaffLeave;
    public function delete(StaffLeave $leave): void;
}
