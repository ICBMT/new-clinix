<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\AreaRepositoryInterface;
use App\Contracts\GovernorateRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AreaStoreRequest;
use App\Http\Requests\Dashboard\AreaUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AreaManagementController extends Controller
{
    public function __construct(
        private readonly AreaRepositoryInterface $areaRepository,
        private readonly GovernorateRepositoryInterface $governorateRepository
    ) {}

    /**
     * Display a listing of areas
     */
    public function index(Request $request): Response
    {
        Gate::authorize('areas.view');

        $perPage = $request->get('per_page', 15);
        
        // Load governorate relationship
        $request->merge(['with' => ['governorate']]);
        
        $areas = $this->areaRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/areas/index', [
            'areas' => $areas,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new area
     */
    public function create(): Response
    {
        Gate::authorize('areas.create');

        $governorates = $this->governorateRepository->getActiveGovernoratesWithAreas();

        return Inertia::render('dashboard/areas/create', [
            'governorates' => $governorates->toArray(),
        ]);
    }

    /**
     * Store a newly created area in storage
     */
    public function store(AreaStoreRequest $request)
    {
        Gate::authorize('areas.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $data['created_by'] = $request->user()->id;
            
            return $this->areaRepository->create($data);
        });

        return redirect()->route('dashboard.areas.index')
            ->with('success', __('common.area_created_successfully'));
    }

    /**
     * Display the specified area
     */
    public function show(int $id): Response
    {
        Gate::authorize('areas.show');

        $area = $this->areaRepository->findOrFail($id);
        $area->load('governorate', 'creator');

        return Inertia::render('dashboard/areas/show', [
            'area' => $area,
        ]);
    }

    /**
     * Show the form for editing the specified area
     */
    public function edit(int $id): Response
    {
        Gate::authorize('areas.edit');

        $area = $this->areaRepository->findOrFail($id);
        $governorates = $this->governorateRepository->getActiveGovernoratesWithAreas();

        return Inertia::render('dashboard/areas/edit', [
            'area' => $area,
            'governorates' => $governorates->toArray(),
        ]);
    }

    /**
     * Update the specified area in storage
     */
    public function update(AreaUpdateRequest $request, int $id)
    {
        Gate::authorize('areas.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            return $this->areaRepository->update($id, $data);
        });

        return redirect()->route('dashboard.areas.edit', $id)
            ->with('success', __('common.area_updated_successfully'));
    }

    /**
     * Remove the specified area from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('areas.destroy');

        $this->withTransaction(function () use ($request, $id) {
            $this->areaRepository->delete($id);
        });

        return redirect()->route('dashboard.areas.index')
            ->with('success', __('common.area_deleted_successfully'));
    }

    /**
     * Toggle is_active status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('areas.toggle-status');

        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->areaRepository->update($id, [
                'is_active' => $request->input('is_active'),
            ]);
        });

        return back()->with('success', __('common.area_updated_successfully'));
    }
}

