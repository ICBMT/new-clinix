<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait CascadesDeletes
{
    /**
     * Delete all relationships listed in $cascadeDeletes property of the model.
     * 
     * Usage: In your model, define protected $cascadeDeletes = ['relation1', 'relation2'];
     * Call this in the deleting event of your model.
     * 
     * @return void
     */
    public function cascadeDelete(): void
    {
        $cascadeDeletes = $this->getCascadeDeletes();
        
        if (empty($cascadeDeletes)) {
            return;
        }

        foreach ($cascadeDeletes as $relation) {
            $this->deleteRelation($relation);
        }
    }

    /**
     * Get the cascade deletes configuration.
     * 
     * @return array
     */
    protected function getCascadeDeletes(): array
    {
        if (!property_exists($this, 'cascadeDeletes') || !is_array($this->cascadeDeletes)) {
            return [];
        }

        return $this->cascadeDeletes;
    }

    /**
     * Delete a specific relation.
     * 
     * @param string $relation
     * @return void
     */
    protected function deleteRelation(string $relation): void
    {
        if (!method_exists($this, $relation)) {
            $this->logCascadeError($relation, "Relation method '{$relation}' does not exist");
            return;
        }

        try {
            $relationInstance = $this->$relation();
            
            if (!$relationInstance instanceof Relation) {
                $this->logCascadeError($relation, "Method '{$relation}' does not return a valid relation");
                return;
            }

            $this->handleRelationDeletion($relationInstance, $relation);
            
        } catch (\Throwable $e) {
            $this->logCascadeError($relation, $e->getMessage(), $e);
        }
    }

    /**
     * Handle deletion based on relation type.
     * 
     * @param Relation $relation
     * @param string $relationName
     * @return void
     */
    protected function handleRelationDeletion(Relation $relation, string $relationName): void
    {
        switch (true) {
            case $relation instanceof HasMany:
            case $relation instanceof MorphMany:
                $this->deleteHasManyRelation($relation, $relationName);
                break;
                
            case $relation instanceof HasOne:
            case $relation instanceof MorphOne:
                $this->deleteHasOneRelation($relation, $relationName);
                break;
                
            case $relation instanceof BelongsToMany:
            case $relation instanceof MorphToMany:
                $this->deleteBelongsToManyRelation($relation, $relationName);
                break;
                
            default:
                $this->logCascadeError($relationName, "Unsupported relation type: " . get_class($relation));
        }
    }

    /**
     * Delete HasMany/MorphMany relations efficiently.
     * 
     * @param Relation $relation
     * @param string $relationName
     * @return void
     */
    protected function deleteHasManyRelation(Relation $relation, string $relationName): void
    {
        $count = $relation->count();
        
        if ($count === 0) {
            return;
        }

        // Use bulk delete for better performance
        $relation->delete();
        
        Log::info("Cascade deleted {$count} records from relation '{$relationName}' on " . static::class);
    }

    /**
     * Delete HasOne/MorphOne relations.
     * 
     * @param Relation $relation
     * @param string $relationName
     * @return void
     */
    protected function deleteHasOneRelation(Relation $relation, string $relationName): void
    {
        $related = $relation->first();
        
        if ($related instanceof Model) {
            $related->delete();
            Log::info("Cascade deleted record from relation '{$relationName}' on " . static::class);
        }
    }

    /**
     * Delete BelongsToMany/MorphToMany relations (pivot table cleanup).
     * 
     * @param Relation $relation
     * @param string $relationName
     * @return void
     */
    protected function deleteBelongsToManyRelation(Relation $relation, string $relationName): void
    {
        $count = $relation->count();
        
        if ($count === 0) {
            return;
        }

        // Detach all related records (removes pivot table entries)
        $relation->detach();
        
        Log::info("Cascade detached {$count} records from relation '{$relationName}' on " . static::class);
    }

    /**
     * Log cascade delete errors with context.
     * 
     * @param string $relation
     * @param string $message
     * @param \Throwable|null $exception
     * @return void
     */
    protected function logCascadeError(string $relation, string $message, ?\Throwable $exception = null): void
    {
        $context = [
            'model' => static::class,
            'model_id' => $this->getKey(),
            'relation' => $relation,
            'exception' => $exception ? $exception->getTraceAsString() : null,
        ];

        Log::warning("Cascade delete failed for relation '{$relation}' on " . static::class . ": {$message}", $context);
    }

    /**
     * Get cascade delete statistics.
     * 
     * @return array
     */
    public function getCascadeDeleteStats(): array
    {
        $stats = [];
        $cascadeDeletes = $this->getCascadeDeletes();
        
        foreach ($cascadeDeletes as $relation) {
            if (!method_exists($this, $relation)) {
                continue;
            }
            
            try {
                $relationInstance = $this->$relation();
                $stats[$relation] = [
                    'type' => get_class($relationInstance),
                    'count' => $relationInstance->count(),
                ];
            } catch (\Throwable $e) {
                $stats[$relation] = [
                    'type' => 'error',
                    'count' => 0,
                    'error' => $e->getMessage(),
                ];
            }
        }
        
        return $stats;
    }
}
