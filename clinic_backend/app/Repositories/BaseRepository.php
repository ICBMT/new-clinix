<?php

namespace App\Repositories;

use App\Contracts\BaseRepositoryInterface;
use App\Traits\RepositoryOperations;
use Illuminate\Database\Eloquent\Model;

/**
 * BaseRepository
 * 
 * Base repository class that uses RepositoryOperations trait
 * All specific repositories should extend this class
 */
abstract class BaseRepository implements BaseRepositoryInterface
{
    use RepositoryOperations;

    protected Model $model;
    protected array $searchableFields = [];
    protected array $filterableFields = [];
    protected array $relationships = [];

    /**
     * BaseRepository constructor
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
        
        // Use custom searchable/filterable fields (child repositories can override these methods)
        $this->searchableFields = $this->getSearchableFields();
        $this->filterableFields = $this->getFilterableFields();
    }

    /**
     * Get searchable fields - override in child repositories if needed
     */
    protected function getSearchableFields(): array
    {
        return $this->model->getFillable() ?? [];
    }

    /**
     * Get filterable fields - override in child repositories if needed
     */
    protected function getFilterableFields(): array
    {
        return $this->model->getFillable() ?? [];
    }

}
