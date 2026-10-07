<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CrudController Trait
 * 
 * Provides standard CRUD operations that can be used by any controller.
 * Requires the controller to inject a repository implementing BaseRepositoryInterface
 */
trait CrudController
{
    /**
     * Get the repository interface (must be injected in controller constructor)
     * 
     * @return \App\Contracts\BaseRepositoryInterface
     */
    abstract protected function getRepository(): \App\Contracts\BaseRepositoryInterface;

    /**
     * Get the resource name (singular) - override in controller if different from model name
     * 
     * @return string
     */
    protected function getResourceName(): string
    {
        // Default: extract from controller name (e.g., UserManagementController -> user)
        $className = class_basename(static::class);
        $name = str_replace(['ManagementController', 'Controller'], '', $className);
        return strtolower($name);
    }

    /**
     * Get the view path prefix (e.g., 'dashboard/users')
     * Override in controller if different
     * 
     * @return string
     */
    protected function getViewPath(): string
    {
        $resourceName = $this->getResourceName();
        return "dashboard/{$resourceName}s";
    }

    /**
     * Get the base route name (e.g., 'dashboard.users')
     * Override in controller if different
     * 
     * @return string
     */
    protected function getBaseRoute(): string
    {
        $resourceName = $this->getResourceName();
        return "dashboard.{$resourceName}s";
    }

    /**
     * Display a listing of the resource.
     * 
     * @param Request $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 15);
        $repository = $this->getRepository();

        // Build filters from request
        $filters = $this->buildFilters($request);

        // Get paginated data using paginate method
        // Note: Repositories should use paginate() method that accepts Request
        $data = $repository->paginate($request, $perPage);

        // Transform data if needed
        $data = $this->transformIndexData($data);

        return Inertia::render($this->getViewPath() . '/index', [
            $this->getDataKey() => $data,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     * 
     * @param Request $request
     * @return Response
     */
    public function create(Request $request): Response
    {
        $additionalData = $this->getCreateData($request);
        
        return Inertia::render($this->getViewPath() . '/create', $additionalData);
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $this->validateStore($request);
        
        $model = $this->withTransaction(function () use ($validated) {
            return $this->getRepository()->create($validated);
        });

        $this->afterStore($model, $request);

        return redirect()->route($this->getBaseRoute() . '.index')
            ->with('success', __('common.' . $this->getResourceName() . '_created_successfully'));
    }

    /**
     * Display the specified resource.
     * 
     * @param int $id
     * @return Response
     */
    public function show(int $id): Response
    {
        $repository = $this->getRepository();
        $model = $repository->findOrFail($id, $this->getRelationships());

        $additionalData = $this->getShowData($model);

        return Inertia::render($this->getViewPath() . '/show', array_merge([
            $this->getResourceName() => $model,
        ], $additionalData));
    }

    /**
     * Show the form for editing the specified resource.
     * 
     * @param int $id
     * @return Response
     */
    public function edit(int $id): Response
    {
        $repository = $this->getRepository();
        $model = $repository->findOrFail($id);

        $additionalData = $this->getEditData($model);

        return Inertia::render($this->getViewPath() . '/edit', array_merge([
            $this->getResourceName() => $model,
        ], $additionalData));
    }

    /**
     * Update the specified resource in storage.
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, int $id)
    {
        $validated = $this->validateUpdate($request, $id);
        
        $model = $this->withTransaction(function () use ($validated, $id) {
            return $this->getRepository()->update($id, $validated);
        });

        $this->afterUpdate($model, $request);

        return redirect()->route($this->getBaseRoute() . '.edit', $id)
            ->with('success', __('common.' . $this->getResourceName() . '_updated_successfully'));
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(int $id)
    {
        $this->withTransaction(function () use ($id) {
            $this->getRepository()->delete($id);
        });

        $this->afterDestroy($id);

        return redirect()->route($this->getBaseRoute() . '.index')
            ->with('success', __('common.' . $this->getResourceName() . '_deleted_successfully'));
    }

    /**
     * Toggle status of a resource
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function toggleStatus(Request $request, int $id)
    {
        $request->validate([
            'status' => ['required', 'string'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->getRepository()->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.' . $this->getResourceName() . '_updated_successfully'));
    }

    // ============================================
    // Override methods in child controllers
    // ============================================

    /**
     * Build filters array from request
     * Override to customize filter building
     * 
     * @param Request $request
     * @return array
     */
    protected function buildFilters(Request $request): array
    {
        $filters = [];
        
        // Add search
        if ($request->has('search') && $request->get('search')) {
            $filters['search'] = $request->get('search');
        }

        // Add filters from request
        $requestFilters = $request->get('filters', []);
        $filters = array_merge($filters, $requestFilters);

        return $filters;
    }

    /**
     * Get relationships to eager load
     * Override in controller to add relationships
     * 
     * @return array
     */
    protected function getRelationships(): array
    {
        return [];
    }

    /**
     * Get data key for Inertia response (e.g., 'users', 'vendors')
     * Override if different from resource name plural
     * 
     * @return string
     */
    protected function getDataKey(): string
    {
        return $this->getResourceName() . 's';
    }

    /**
     * Transform data for index page
     * Override to customize data transformation
     * 
     * @param LengthAwarePaginator $data
     * @return LengthAwarePaginator
     */
    protected function transformIndexData(LengthAwarePaginator $data): LengthAwarePaginator
    {
        return $data;
    }

    /**
     * Get additional data for create page
     * Override to add extra data (e.g., dropdown options)
     * 
     * @param Request|null $request
     * @return array
     */
    protected function getCreateData(?Request $request): array
    {
        return [];
    }

    /**
     * Get additional data for show page
     * Override to add extra data
     * 
     * @param Model $model
     * @return array
     */
    protected function getShowData(Model $model): array
    {
        return [];
    }

    /**
     * Get additional data for edit page
     * Override to add extra data
     * 
     * @param Model $model
     * @return array
     */
    protected function getEditData(Model $model): array
    {
        return [];
    }

    /**
     * Validate store request
     * Override in controller to use specific Form Request
     * 
     * @param Request $request
     * @return array
     */
    protected function validateStore(Request $request): array
    {
        // Default: return all validated data
        // Child controllers should use Form Requests
        return $request->validate([]);
    }

    /**
     * Validate update request
     * Override in controller to use specific Form Request
     * 
     * @param Request $request
     * @param int $id
     * @return array
     */
    protected function validateUpdate(Request $request, int $id): array
    {
        // Default: return all validated data
        // Child controllers should use Form Requests
        return $request->validate([]);
    }

    /**
     * Hook called after store
     * Override to perform additional actions
     * 
     * @param Model $model
     * @param Request $request
     * @return void
     */
    protected function afterStore(Model $model, Request $request): void
    {
        // Override in child controllers
    }

    /**
     * Hook called after update
     * Override to perform additional actions
     * 
     * @param Model $model
     * @param Request $request
     * @return void
     */
    protected function afterUpdate(Model $model, Request $request): void
    {
        // Override in child controllers
    }

    /**
     * Hook called after destroy
     * Override to perform additional actions
     * 
     * @param int $id
     * @return void
     */
    protected function afterDestroy(int $id): void
    {
        // Override in child controllers
    }
}

