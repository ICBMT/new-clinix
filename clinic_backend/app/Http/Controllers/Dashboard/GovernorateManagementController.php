<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\GovernorateRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\GovernorateStoreRequest;
use App\Http\Requests\Dashboard\GovernorateUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GovernorateManagementController extends Controller
{
    public function __construct(
        private readonly GovernorateRepositoryInterface $governorateRepository
    ) {}

    /**
     * Display a listing of governorates
     */
    public function index(Request $request): Response
    {
        Gate::authorize('governorates.view');

        $perPage = $request->get('per_page', 15);
        $governorates = $this->governorateRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/governorates/index', [
            'governorates' => $governorates,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new governorate
     */
    public function create(): Response
    {
        Gate::authorize('governorates.create');

        return Inertia::render('dashboard/governorates/create');
    }

    /**
     * Store a newly created governorate in storage
     */
    public function store(GovernorateStoreRequest $request)
    {
        Gate::authorize('governorates.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $data['created_by'] = $request->user()->id;
            
            return $this->governorateRepository->create($data);
        });

        return redirect()->route('dashboard.governorates.index')
            ->with('success', __('common.governorate_created_successfully'));
    }

    /**
     * Display the specified governorate
     */
    public function show(int $id): Response
    {
        Gate::authorize('governorates.show');

        $governorate = $this->governorateRepository->findOrFail($id);
        $governorate->load('areas', 'creator');

        return Inertia::render('dashboard/governorates/show', [
            'governorate' => $governorate,
        ]);
    }

    /**
     * Show the form for editing the specified governorate
     */
    public function edit(int $id): Response
    {
        Gate::authorize('governorates.edit');

        $governorate = $this->governorateRepository->findOrFail($id);

        return Inertia::render('dashboard/governorates/edit', [
            'governorate' => $governorate,
        ]);
    }

    /**
     * Update the specified governorate in storage
     */
    public function update(GovernorateUpdateRequest $request, int $id)
    {
        Gate::authorize('governorates.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            return $this->governorateRepository->update($id, $data);
        });

        return redirect()->route('dashboard.governorates.edit', $id)
            ->with('success', __('common.governorate_updated_successfully'));
    }

    /**
     * Remove the specified governorate from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('governorates.destroy');

        $this->withTransaction(function () use ($request, $id) {
            $this->governorateRepository->delete($id);
        });

        return redirect()->route('dashboard.governorates.index')
            ->with('success', __('common.governorate_deleted_successfully'));
    }

    /**
     * Toggle is_active status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('governorates.toggle-status');

        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->governorateRepository->update($id, [
                'is_active' => $request->input('is_active'),
            ]);
        });

        return back()->with('success', __('common.governorate_updated_successfully'));
    }
}

