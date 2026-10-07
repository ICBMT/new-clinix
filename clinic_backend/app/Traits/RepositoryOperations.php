<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * RepositoryOperations Trait
 * 
 * Common CRUD and advanced operations for all repositories
 * Use this trait in BaseRepository to provide all common functionality
 */
trait RepositoryOperations
{
    /**
     * Execute a callback within a database transaction
     */
    protected function withTransaction(callable $function)
    {
        try {
            DB::beginTransaction();
            
            $result = $function();
            
            DB::commit();
            
            return $result;
        } catch (Throwable $th) {
            DB::rollBack();
            
            $data = [
                'repository' => class_basename($this),
                'model' => class_basename($this->model),
                'error_message' => $th->getMessage(),
                'error_code' => $th->getCode(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'trace' => $th->getTraceAsString(),
            ];
            
            Log::error('Repository transaction failed', $data);
            
            throw $th;
        }
    }

    /**
     * Create a new record
     */
    public function create(array $data): Model
    {
        return $this->withTransaction(function () use ($data) {
            $data = $this->beforeCreate($data);
            $record = $this->model->create($data);
            $this->afterCreate($record, $data);

            $this->logOperation(__('common.repository_created_successfully'), ['id' => $record->id]);

            return $record->fresh();
        });
    }

    /**
     * Update an existing record
     */
    public function update(int $id, array $data): Model
    {
        return $this->withTransaction(function () use ($id, $data) {
            $record = $this->findOrFail($id);
            $data = $this->beforeUpdate($record, $data);
            $record->update($data);
            $this->afterUpdate($record, $data);

            $this->logOperation(__('common.repository_updated_successfully'), ['id' => $record->id]);

            return $record->fresh();
        });
    }

    /**
     * Delete a record (soft delete if available)
     */
    public function delete(int $id): bool
    {
        return $this->withTransaction(function () use ($id) {
            $record = $this->findOrFail($id);
            $this->beforeDelete($record);
            $deleted = $record->delete();
            $this->afterDelete($record);

            $this->logOperation(__('common.repository_deleted_successfully'), ['id' => $id]);

            return $deleted;
        });
    }

    /**
     * Find record by ID
     */
    public function find(int $id): ?Model
    {
        return $this->model->find($id);
    }

    /**
     * Find record by ID or fail
     */
    public function findOrFail(int $id): Model
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Find record(s) by criteria
     * 
     * @param array $criteria Search criteria
     * @param int|null $limit Optional limit. If null, returns single model or null. If set, returns collection.
     * @return \Illuminate\Database\Eloquent\Model|\Illuminate\Database\Eloquent\Collection|null
     */
    public function findBy(array $criteria, ?int $limit = null)
    {
        if ($limit === null) {
            return $this->model->where($criteria)->first();
        }
        
        return $this->model->where($criteria)->limit($limit)->get();
    }

    /**
     * Get paginated records with filters and search (optimized for large datasets)
     */
    public function paginate(Request $request, int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        $query = $this->model->newQuery();
        
        // Select only needed columns to reduce memory usage
        if ($columns !== ['*']) {
            $query->select($columns);
        }
        
        // Load default relationships first
        if (!empty($this->relationships)) {
            $query->with($this->relationships);
        }
        
        $query = $this->applyFilters($query, $request);
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        // Use simple pagination for better performance on large datasets
        if ($this->shouldUseSimplePagination($request)) {
            return $query->simplePaginate($perPage, $columns);
        }

        return $query->paginate($perPage, $columns);
    }

    /**
     * Check if simple pagination should be used (faster for large datasets)
     */
    protected function shouldUseSimplePagination(Request $request): bool
    {
        // Use simple pagination if explicitly requested or for very large page numbers
        return $request->get('simple_pagination', false) || 
               ($request->get('page', 1) > 100);
    }

    /**
     * Count records with filters
     */
    public function count(Request $request = null): int
    {
        $query = $this->model->newQuery();

        if ($request) {
            $query = $this->applyFilters($query, $request);
            $query = $this->applySearch($query, $request);
        }

        return $query->count();
    }

    /**
     * Check if record exists
     */
    public function exists(array $criteria): bool
    {
        return $this->model->where($criteria)->exists();
    }

    /**
     * Apply filters to query
     */
    protected function applyFilters(Builder $query, Request $request): Builder
    {
        $filters = $request->get('filters', []);

        foreach ($filters as $field => $value) {
            if (empty($value) && $value !== 0 && $value !== false) {
                continue;
            }

            if (!in_array($field, $this->filterableFields)) {
                continue;
            }

            $this->applyFilter($query, $field, $value);
        }

        // Apply custom filters (override in child repositories)
        if (method_exists($this, 'applyCustomFilters')) {
            $query = $this->applyCustomFilters($query, $request);
        }

        return $query;
    }

    /**
     * Apply individual filter
     */
    protected function applyFilter(Builder $query, string $field, $value): void
    {
        if (is_array($value)) {
            if (isset($value['from']) && isset($value['to'])) {
                $query->whereBetween($field, [$value['from'], $value['to']]);
            } elseif (isset($value['min']) && isset($value['max'])) {
                $query->whereBetween($field, [$value['min'], $value['max']]);
            } elseif (isset($value['from'])) {
                $query->where($field, '>=', $value['from']);
            } elseif (isset($value['to'])) {
                $query->where($field, '<=', $value['to']);
            } else {
                $query->whereIn($field, $value);
            }
        } else {
            $query->where($field, $value);
        }
    }

    /**
     * Apply search to query (optimized with full-text search support)
     */
    protected function applySearch(Builder $query, Request $request): Builder
    {
        $search = $request->get('search');

        if (empty($search) || empty($this->searchableFields)) {
            return $query;
        }

        try {
            // Use full-text search if enabled (much faster for large datasets)
            if ($this->useFullTextSearch() && config('database.default') === 'mysql') {
                $searchFields = implode(',', $this->searchableFields);
                
                // Check if search contains special characters that break FULLTEXT boolean mode
                // For emails, phone numbers, and other special cases, use NATURAL LANGUAGE MODE
                if ($this->containsSpecialCharacters($search)) {
                    // Use NATURAL LANGUAGE MODE which handles special characters better
                    return $query->whereRaw("MATCH({$searchFields}) AGAINST(? IN NATURAL LANGUAGE MODE)", [$search]);
                }
                
                // For simple text searches, use BOOLEAN MODE for better control
                return $query->whereRaw("MATCH({$searchFields}) AGAINST(? IN BOOLEAN MODE)", [$search . '*']);
            }

            // Optimized LIKE search - use prefix search (uses indexes better)
            // Escape special LIKE characters to prevent SQL injection and errors
            $escapedSearch = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $search);
            $query->where(function ($q) use ($escapedSearch) {
                foreach ($this->searchableFields as $field) {
                    // Use LIKE with escaped search term to prevent crashes
                    $q->orWhere($field, 'LIKE', "%{$escapedSearch}%");
                }
            });
        } catch (\Exception $e) {
            // Log error and fall back to simple search
            \Illuminate\Support\Facades\Log::warning('Search error in RepositoryOperations::applySearch', [
                'error' => $e->getMessage(),
                'search' => $search,
                'searchable_fields' => $this->searchableFields,
            ]);
            
            // Fallback to simple LIKE search if full-text search fails
            $escapedSearch = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $search);
            $query->where(function ($q) use ($escapedSearch) {
                foreach ($this->searchableFields as $field) {
                    $q->orWhere($field, 'LIKE', "%{$escapedSearch}%");
                }
            });
        }

        return $query;
    }

    /**
     * Check if search term contains special characters that break FULLTEXT BOOLEAN MODE
     */
    protected function containsSpecialCharacters(string $search): bool
    {
        // Characters that have special meaning in MySQL FULLTEXT BOOLEAN MODE
        $specialChars = ['@', '+', '-', '>', '<', '(', ')', '~', '*', '"', '\\'];
        
        foreach ($specialChars as $char) {
            if (str_contains($search, $char)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if full-text search should be used
     * Override in child repositories to enable
     */
    protected function useFullTextSearch(): bool
    {
        return false;
    }

    /**
     * Apply sorting to query
     */
    protected function applySorting(Builder $query, Request $request): Builder
    {
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = array_merge(
            $this->model->getFillable(),
            ['id', 'created_at', 'updated_at']
        );

        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        return $query;
    }

    /**
     * Apply relationships to query (on-demand loading)
     * 
     * This method handles:
     * 1. Eager loading from request (?with[]=relation)
     * 2. Relationship filters (?has[relation]=value or ?whereHas[relation][field]=value)
     * 
     * Examples:
     * - ?with[]=permissions - Eager load permissions
     * - ?has[roles]=admin - Filter users that have 'admin' role
     * - ?whereHas[roles][name]=vendor - Filter users where role name is vendor
     * 
     * Note: Relationships are loaded on-demand to prevent unnecessary eager loading.
     * This prevents N+1 queries only when relationships are actually needed.
     */
    protected function applyRelationships(Builder $query, Request $request): Builder
    {
        // 1. Handle eager loading from request
        $with = $request->get('with', []);
        if (!empty($with) && is_array($with)) {
            $query->with($with);
        }

        // 2. Handle relationship existence filters (?has[relation]=value)
        $has = $request->get('has', []);
        if (!empty($has) && is_array($has)) {
            foreach ($has as $relation => $value) {
                if (!empty($value)) {
                    $query->whereHas($relation, function ($q) use ($value) {
                        // Simple string match - supports relation name match
                        $q->where('name', $value);
                    });
                }
            }
        }

        // 3. Handle advanced relationship filters (?whereHas[relation][field]=value)
        $whereHas = $request->get('whereHas', []);
        if (!empty($whereHas) && is_array($whereHas)) {
            foreach ($whereHas as $relation => $conditions) {
                if (!empty($conditions) && is_array($conditions)) {
                    $query->whereHas($relation, function ($q) use ($conditions) {
                        foreach ($conditions as $field => $value) {
                            if (!empty($value)) {
                                $q->where($field, $value);
                            }
                        }
                    });
                }
            }
        }

        return $query;
    }

    /**
     * Hook: Before create
     */
    protected function beforeCreate(array $data): array
    {
        return $data;
    }

    /**
     * Hook: After create
     */
    protected function afterCreate(Model $record, array $data): void
    {
        //
    }

    /**
     * Hook: Before update
     */
    protected function beforeUpdate(Model $record, array $data): array
    {
        return $data;
    }

    /**
     * Hook: After update
     */
    protected function afterUpdate(Model $record, array $data): void
    {
        //
    }

    /**
     * Hook: Before delete
     */
    protected function beforeDelete(Model $record): void
    {
        //
    }

    /**
     * Hook: After delete
     */
    protected function afterDelete(Model $record): void
    {
        //
    }

    /**
     * Helper: Log repository operation
     */
    protected function logOperation(string $operation, array $context = []): void
    {
        Log::info(class_basename($this->model) . ' ' . $operation, array_merge([
            'repository' => class_basename($this),
            'model' => class_basename($this->model),
        ], $context));
    }
}
