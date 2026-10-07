<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface FAQRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get FAQs
     */
    public function getFAQs(?string $category = null): array;

    /**
     * Get FAQ categories
     */
    public function getCategories(): array;

    /**
     * Get featured articles
     */
    public function getFeaturedArticles(): array;

    /**
     * Get article by slug
     */
    public function getArticleBySlug(string $slug): ?\App\Models\Faq;
}
