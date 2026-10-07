<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\StaffLeaveRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StaffLeaveRequest;
use App\Models\StaffLeave;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffLeaveController extends Controller
{
    public function __construct(private readonly StaffLeaveRepositoryInterface $leaves) {}

    public function index(Request $request): Response
    {
        Gate::authorize('staff-leaves.view');
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'clinic_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(StaffLeave::STATUSES)],
        ]);

        return Inertia::render('dashboard/staff-leaves/index', [
            'leaves' => $this->leaves->paginateForUser($request->user(), $filters),
            'clinics' => $this->leaves->clinicsForUser($request->user())->map->only(['id', 'name_en', 'name_ar']),
            'filters' => $filters,
            'statuses' => StaffLeave::STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('staff-leaves.create');

        return Inertia::render('dashboard/staff-leaves/form', $this->formOptions($request));
    }

    public function store(StaffLeaveRequest $request): RedirectResponse
    {
        $this->leaves->save($request->validated());

        return to_route('dashboard.staff-leaves.index')->with('success', __('common.staff_leave_created'));
    }

    public function show(Request $request, int $staffLeave): Response
    {
        Gate::authorize('staff-leaves.show');

        return Inertia::render('dashboard/staff-leaves/show', [
            'leave' => $this->leaves->findForUser($request->user(), $staffLeave),
        ]);
    }

    public function edit(Request $request, int $staffLeave): Response
    {
        Gate::authorize('staff-leaves.edit');

        return Inertia::render('dashboard/staff-leaves/form', [
            ...$this->formOptions($request),
            'leave' => $this->leaves->findForUser($request->user(), $staffLeave),
        ]);
    }

    public function update(StaffLeaveRequest $request, int $staffLeave): RedirectResponse
    {
        $leave = $this->leaves->findForUser($request->user(), $staffLeave);
        $this->leaves->save($request->validated(), $leave);

        return to_route('dashboard.staff-leaves.index')->with('success', __('common.staff_leave_updated'));
    }

    public function destroy(Request $request, int $staffLeave): RedirectResponse
    {
        Gate::authorize('staff-leaves.destroy');
        $this->leaves->delete($this->leaves->findForUser($request->user(), $staffLeave));

        return to_route('dashboard.staff-leaves.index')->with('success', __('common.staff_leave_deleted'));
    }

    private function formOptions(Request $request): array
    {
        return [
            'clinics' => $this->leaves->clinicsForUser($request->user())->map(fn ($clinic) => [
                'id' => $clinic->id,
                'name_en' => $clinic->name_en,
                'name_ar' => $clinic->name_ar,
                'staff' => $clinic->users->map->only(['id', 'name']),
            ]),
            'types' => StaffLeave::TYPES,
            'statuses' => StaffLeave::STATUSES,
        ];
    }
}
