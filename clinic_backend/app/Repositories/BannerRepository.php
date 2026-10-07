<?php

namespace App\Repositories;

use App\Contracts\BannerRepositoryInterface;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerRepository extends BaseRepository implements BannerRepositoryInterface
{
    protected array $searchableFields = [
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
    ];

    protected array $filterableFields = [
        'status',
        'type',
        'position',
        'category_id',
        'service_id',
    ];

    protected array $relationships = [
        'media',
    ];

    public function __construct(Banner $model)
    {
        parent::__construct($model);
    }

    /**
     * Override paginate to ensure media is loaded and image_url is set from media
     */
    public function paginate(\Illuminate\Http\Request $request, int $perPage = 15, array $columns = ['*']): \Illuminate\Pagination\LengthAwarePaginator
    {
        // Get paginated results
        $results = parent::paginate($request, $perPage, $columns);
        
        // Ensure media is loaded for all items
        $results->getCollection()->loadMissing('media');
        
        // Transform collection to set image_url from media if not already set
        $results->getCollection()->transform(function ($banner) {
            // If image_url is not set, try to get it from media
            if (!$banner->image_url && $banner->relationLoaded('media') && $banner->media->isNotEmpty()) {
                $imageMedia = $banner->media->where('collection_name', 'images')->first();
                if ($imageMedia) {
                    $banner->setAttribute('image_url', $imageMedia->file_name ?? $imageMedia->url ?? null);
                }
            }
            
            // If mobile_image_url is not set, try to get it from media
            if (!$banner->mobile_image_url && $banner->relationLoaded('media') && $banner->media->isNotEmpty()) {
                $mobileImageMedia = $banner->media->where('collection_name', 'mobile_images')->first();
                if ($mobileImageMedia) {
                    $banner->setAttribute('mobile_image_url', $mobileImageMedia->file_name ?? $mobileImageMedia->url ?? null);
                }
            }
            
            return $banner;
        });
        
        return $results;
    }

    /**
     * Get active banners
     */
    public function getActiveBanners(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->with('media')
            ->active()
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    /**
     * Get banners by position
     */
    public function getBannersByPosition(string $position): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->with('media')
            ->active()
            ->byPosition($position)
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    /**
     * Override findBy to include media relationship
     */
    public function findBy(array $criteria, ?int $limit = null)
    {
        $query = $this->model->with('media')->where($criteria);
        
        if ($limit === null) {
            return $query->first();
        }
        
        return $query->limit($limit)->get();
    }
}

