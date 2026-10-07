<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\BannerRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\BannerStoreRequest;
use App\Http\Requests\Dashboard\BannerUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BannerManagementController extends Controller
{
    public function __construct(
        private readonly BannerRepositoryInterface $bannerRepository,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository
    ) {}

    /**
     * Display a listing of banners
     */
    public function index(Request $request): Response
    {
        Gate::authorize('banners.view');

        $perPage = $request->get('per_page', 15);
        $banners = $this->bannerRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/banners/index', [
            'banners' => $banners,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new banner
     */
    public function create(): Response
    {
        Gate::authorize('banners.create');

        $categories = $this->categoryRepository->getActiveCategories();
        $treatments = $this->treatmentRepository->filter(['status' => 'approved'], 100);

        // Handle both Collection and Paginator
        $services = [];
        if ($treatments instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            $services = $treatments->items();
        } elseif ($treatments instanceof \Illuminate\Database\Eloquent\Collection) {
            $services = $treatments->toArray();
        } elseif (is_array($treatments)) {
            $services = $treatments;
        }

        return Inertia::render('dashboard/banners/create', [
            'categories' => $categories ? $categories->toArray() : [],
            'services' => $services, // Frontend expects 'services' not 'treatments'
        ]);
    }

    /**
     * Store a newly created banner in storage
     */
    public function store(BannerStoreRequest $request)
    {
        Gate::authorize('banners.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Set default type to 'homepage' if not provided
            if (empty($data['type'])) {
                $data['type'] = 'homepage';
            }
            
            // Convert category_id/service_id to linkable relationship
            if (isset($data['category_id']) && !empty($data['category_id'])) {
                $data['linkable_type'] = \App\Models\Category::class;
                $data['linkable_id'] = $data['category_id'];
                unset($data['category_id']);
            } elseif (isset($data['service_id']) && !empty($data['service_id'])) {
                $data['linkable_type'] = \App\Models\Treatment::class;
                $data['linkable_id'] = $data['service_id'];
                unset($data['service_id']);
            } else {
                $data['linkable_type'] = null;
                $data['linkable_id'] = null;
            }
            
            // Remove image fields from data as they will be handled via media
            $image = $request->file('image');
            $mobileImage = $request->file('mobile_image');
            unset($data['image'], $data['mobile_image']);

            $banner = $this->bannerRepository->create($data);
            
            // Handle image uploads using MediaService
            $mediaService = app(\App\Services\MediaService::class);
            
            if ($image) {
                $mediaService->uploadAndCreateMedia($image, 'banners', [
                    'mediable_type' => \App\Models\Banner::class,
                    'mediable_id' => $banner->id,
                    'collection' => 'images',
                ]);
            }
            
            if ($mobileImage) {
                $mediaService->uploadAndCreateMedia($mobileImage, 'banners', [
                    'mediable_type' => \App\Models\Banner::class,
                    'mediable_id' => $banner->id,
                    'collection' => 'mobile_images',
                ]);
            }

            return $banner;
        });

        return redirect()->route('dashboard.banners.index')
            ->with('success', __('common.banner_created_successfully'));
    }

    /**
     * Display the specified banner
     */
    public function show(int $id): Response
    {
        Gate::authorize('banners.show');

        $banner = $this->bannerRepository->findOrFail($id);
        $banner->load('linkable', 'media');

        return Inertia::render('dashboard/banners/show', [
            'banner' => $banner,
        ]);
    }

    /**
     * Show the form for editing the specified banner
     */
    public function edit(int $id): Response
    {
        Gate::authorize('banners.edit');

        $banner = $this->bannerRepository->findOrFail($id);
        $banner->load('linkable', 'media');
        
        $categories = $this->categoryRepository->getActiveCategories();
        $treatments = $this->treatmentRepository->filter(['status' => 'approved'], 100);

        return Inertia::render('dashboard/banners/edit', [
            'banner' => $banner,
            'categories' => $categories->toArray(),
            'services' => $treatments->items(), // Frontend expects 'services' not 'treatments'
        ]);
    }

    /**
     * Update the specified banner in storage
     */
    public function update(BannerUpdateRequest $request, int $id)
    {
        Gate::authorize('banners.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // Get banner first for media operations
            $banner = $this->bannerRepository->findOrFail($id);
            
            // Convert category_id/service_id to linkable relationship
            if (isset($data['category_id']) && !empty($data['category_id'])) {
                $data['linkable_type'] = \App\Models\Category::class;
                $data['linkable_id'] = $data['category_id'];
                unset($data['category_id']);
            } elseif (isset($data['service_id']) && !empty($data['service_id'])) {
                $data['linkable_type'] = \App\Models\Treatment::class;
                $data['linkable_id'] = $data['service_id'];
                unset($data['service_id']);
            } else {
                // If neither is provided, clear the linkable relationship
                $data['linkable_type'] = null;
                $data['linkable_id'] = null;
            }
            
            // Handle image uploads - if file is uploaded, use MediaService, otherwise use URL
            $image = $request->file('image');
            $mobileImage = $request->file('mobile_image');
            
            // If image file is uploaded, use MediaService and get URL
            if ($image) {
                // Delete old image media
                $banner->media()->where('collection_name', 'images')->delete();
                
                $mediaService = app(\App\Services\MediaService::class);
                $media = $mediaService->uploadAndCreateMedia($image, 'banners', [
                    'mediable_type' => \App\Models\Banner::class,
                    'mediable_id' => $banner->id,
                    'collection' => 'images',
                ]);
                
                // Get the URL from media and set it in data
                if ($media) {
                    $media->refresh();
                    $data['image_url'] = $media->url ?? $media->file_name;
                    // Ensure it's a full URL
                    if ($data['image_url'] && !str_starts_with($data['image_url'], 'http')) {
                        $data['image_url'] = asset('storage/' . ltrim($data['image_url'], '/'));
                    }
                }
            } elseif ($request->has('image_url') && !empty($request->input('image_url'))) {
                // If URL is provided, use it directly
                $data['image_url'] = $request->input('image_url');
            }
            // If neither file nor URL is provided, keep existing image_url (don't unset it)
            
            // If mobile image file is uploaded, use MediaService and get URL
            if ($mobileImage) {
                // Delete old mobile image media
                $banner->media()->where('collection_name', 'mobile_images')->delete();
                
                $mediaService = app(\App\Services\MediaService::class);
                $media = $mediaService->uploadAndCreateMedia($mobileImage, 'banners', [
                    'mediable_type' => \App\Models\Banner::class,
                    'mediable_id' => $banner->id,
                    'collection' => 'mobile_images',
                ]);
                
                // Get the URL from media and set it in data
                if ($media) {
                    $media->refresh();
                    $data['mobile_image_url'] = $media->url ?? $media->file_name;
                    // Ensure it's a full URL
                    if ($data['mobile_image_url'] && !str_starts_with($data['mobile_image_url'], 'http')) {
                        $data['mobile_image_url'] = asset('storage/' . ltrim($data['mobile_image_url'], '/'));
                    }
                }
            } elseif ($request->has('mobile_image_url') && !empty($request->input('mobile_image_url'))) {
                // If URL is provided, use it directly
                $data['mobile_image_url'] = $request->input('mobile_image_url');
            }
            // If neither file nor URL is provided, keep existing mobile_image_url (don't unset it)
            
            // Remove file fields from data as they're handled above
            unset($data['image'], $data['mobile_image']);

            $banner = $this->bannerRepository->update($id, $data);

            return $banner;
        });

        return redirect()->route('dashboard.banners.edit', $id)
            ->with('success', __('common.banner_updated_successfully'));
    }

    /**
     * Remove the specified banner from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('banners.destroy');

        $this->withTransaction(function () use ($request, $id) {
            $this->bannerRepository->delete($id);
        });

        return redirect()->route('dashboard.banners.index')
            ->with('success', __('common.banner_deleted_successfully'));
    }

    /**
     * Toggle status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('banners.toggle-status');

        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->bannerRepository->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.banner_updated_successfully'));
    }

    // Note: Banner model doesn't have is_featured field, remove this if not needed
    // Keeping it here in case it's added later
}

