<?php

namespace App\Repositories;

use App\Contracts\FAQRepositoryInterface;
use App\Models\Faq;
use Illuminate\Support\Str;

class FAQRepository extends BaseRepository implements FAQRepositoryInterface
{
    protected array $searchableFields = [
        'question_en',
        'question_ar',
        'answer_en',
        'answer_ar',
    ];

    protected array $filterableFields = [];

    /**
     * Get filterable fields
     */
    protected function getFilterableFields(): array
    {
        // Exclude is_active because we handle it in applyCustomFilters
        $fields = $this->model->getFillable() ?? [];
        return array_diff($fields, ['is_active']);
    }

    /**
     * Apply custom filters for FAQs
     */
    protected function applyCustomFilters(\Illuminate\Database\Eloquent\Builder $query, \Illuminate\Http\Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $filters = $request->get('filters', []);
        
        // Handle is_active filter - convert string to boolean
        if (isset($filters['is_active'])) {
            $isActive = $filters['is_active'];
            if (is_string($isActive)) {
                $isActive = $isActive === 'true' || $isActive === '1' || $isActive === true;
            }
            $query->where('is_active', (bool) $isActive);
        }
        
        return $query;
    }

    /**
     * Get FAQs
     */
    public function getFAQs(?string $category = null): array
    {
        $query = $this->model->where('is_active', true);
        
        if ($category) {
            $query->where('category', $category);
        }
        
        return $query->orderBy('sort_order', 'asc')->get()->toArray();
    }

    /**
     * Get FAQs as collection (for resources)
     */
    public function getFAQsCollection(?string $category = null)
    {
        $query = $this->model->where('is_active', true);
        
        if ($category) {
            $query->where('category', $category);
        }
        
        return $query->orderBy('sort_order', 'asc')->get();
    }

    /**
     * Get FAQ categories
     */
    public function getCategories(): array
    {
        return $this->model
            ->where('is_active', true)
            ->distinct()
            ->pluck('category')
            ->toArray();
    }

    /**
     * Get featured articles
     */
    public function getFeaturedArticles(): array
    {
        return $this->model
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get featured articles as collection (for resources)
     */
    public function getFeaturedArticlesCollection()
    {
        return $this->model
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    /**
     * Get article by ID
     */
    public function getArticleById(int $id): ?\App\Models\Faq
    {
        return $this->model->where('id', $id)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Get article by slug
     * Note: FAQs don't have slug field, so we search by converting question to slug format
     */
    public function getArticleBySlug(string $slug): ?\App\Models\Faq
    {
        // Since FAQs don't have a slug field, we search by matching slug against generated slugs from questions
        $locale = app()->getLocale();
        $isArabic = $locale === 'ar';
        
        $faqs = $this->model->where('is_active', true)->get();
        
        foreach ($faqs as $faq) {
            $question = $isArabic ? $faq->question_ar : $faq->question_en;
            $generatedSlug = \Illuminate\Support\Str::slug($question);
            
            if ($generatedSlug === $slug) {
                return $faq;
            }
        }
        
        return null;
    }
}

