<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface BannerRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active banners
     */
    public function getActiveBanners(): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get banners by position
     */
    public function getBannersByPosition(string $position): \Illuminate\Database\Eloquent\Collection;
}
