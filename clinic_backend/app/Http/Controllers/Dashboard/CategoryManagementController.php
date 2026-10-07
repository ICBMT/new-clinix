<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\CategoryRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\CategoryStoreRequest;
use App\Http\Requests\Dashboard\CategoryUpdateRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryManagementController extends Controller
{
    public function __construct(
        private readonly CategoryRepositoryInterface $categoryRepository
    ) {}

    /**
     * Display a listing of categories
     */
    public function index(Request $request): Response
    {
        Gate::authorize('categories.view');

        $perPage = $request->get('per_page', 15);
        $categories = $this->categoryRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/categories/index', [
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new category
     */
    public function create(): Response
    {
        Gate::authorize('categories.create');

        // Get parent categories for dropdown
        $parentCategories = $this->categoryRepository->getActiveCategories();

        return Inertia::render('dashboard/categories/create', [
            'parentCategories' => $parentCategories->toArray(),
        ]);
    }

    /**
     * Store a newly created category in storage
     */
    public function store(CategoryStoreRequest $request)
    {
        Gate::authorize('categories.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Handle parent_id - convert empty string to null
            if (isset($data['parent_id']) && $data['parent_id'] === '') {
                $data['parent_id'] = null;
            }
            
            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);

            $category = $this->categoryRepository->create($data);
            
            // Attach image if provided using MediaService
            if ($image) {
                $mediaService = app(\App\Services\MediaService::class);
                $mediaService->uploadAndCreateMedia($image, 'categories', [
                    'mediable_type' => \App\Models\Category::class,
                    'mediable_id' => $category->id,
                    'collection' => 'category_images',
                ]);
            }
            
            return $category;
        });

        return redirect()->route('dashboard.categories.index')
            ->with('success', __('common.category_created_successfully'));
    }

    /**
     * Display the specified category
     */
    public function show(int $id): Response
    {
        Gate::authorize('categories.show');

        $category = $this->categoryRepository->findOrFail($id);
        $category->load('parent', 'children', 'services');

        return Inertia::render('dashboard/categories/show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit(int $id): Response
    {
        // ✅ If user can edit, they can update (common pattern)
        Gate::authorize('categories.edit');

        $category = $this->categoryRepository->findOrFail($id);
        $category->load('media', 'parent'); // Load media and parent relationships
        $parentCategories = $this->categoryRepository->getActiveCategories()
            ->filter(function ($cat) use ($id) {
                return $cat->id != $id; // Exclude self from parent options
            })
            ->values();

        return Inertia::render('dashboard/categories/edit', [
            'category' => $category,
            'parentCategories' => $parentCategories->toArray(),
        ]);
    }

    /**
     * Update the specified category in storage
     */
    public function update(CategoryUpdateRequest $request, int $id)
    {
        // ✅ If user can edit, they can update (common pattern)
        Gate::authorize('categories.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // Handle parent_id - convert empty string to null
            if (isset($data['parent_id']) && $data['parent_id'] === '') {
                $data['parent_id'] = null;
            }
            
            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);

            $category = $this->categoryRepository->update($id, $data);
            
            // Handle image upload/replacement
            if ($image) {
                // Delete existing category images
                $category->load('media');
                $category->media()
                    ->where('collection_name', 'category_images')
                    ->orWhere('collection_name', 'images')
                    ->delete();
                
                // Upload new image using MediaService
                $mediaService = app(\App\Services\MediaService::class);
                $mediaService->uploadAndCreateMedia($image, 'categories', [
                    'mediable_type' => \App\Models\Category::class,
                    'mediable_id' => $category->id,
                    'collection' => 'category_images',
                ]);
            }
            
            return $category;
        });

        return redirect()->route('dashboard.categories.edit', $id)
            ->with('success', __('common.category_updated_successfully'));
    }

    /**
     * Remove the specified category from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('categories.destroy');

        $category = $this->categoryRepository->findOrFail($id);
        $category->load('children');
        
        // Check if category has children
        if ($category->children && $category->children->count() > 0) {
            return redirect()->route('dashboard.categories.index')
                ->with('error', __('common.category_has_children_cannot_delete'));
        }

        $this->withTransaction(function () use ($request, $id) {
            $this->categoryRepository->delete($id);
        });

        return redirect()->route('dashboard.categories.index')
            ->with('success', __('common.category_deleted_successfully'));
    }

    /**
     * Toggle status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('categories.toggle-status');

        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->categoryRepository->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.category_updated_successfully'));
    }
}

