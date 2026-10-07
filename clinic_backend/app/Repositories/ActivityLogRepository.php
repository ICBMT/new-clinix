<?php

namespace App\Repositories;

use App\Contracts\ActivityLogRepositoryInterface;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ActivityLogRepository extends BaseRepository implements ActivityLogRepositoryInterface
{
    /**
     * ActivityLogRepository constructor
     */
    public function __construct(Activity $model)
    {
        parent::__construct($model);
    }

    /**
     * Get paginated activity logs with filters
     */
    public function getPaginated(Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = Activity::query();

        // Load default relationships first
        $query->with($this->getDefaultRelationships());

        // Apply role-based scoping
        $query = $this->applyRoleBasedScoping($query);

        // Apply filters (this will call applyCustomFilters which calls applyEntityTypeFilter)
        $query = $this->applyFilters($query, $request);
        
        // Apply search
        $query = $this->applySearch($query, $request);
        
        // Apply sorting
        $query = $this->applySorting($query, $request);
        
        // Apply additional relationships from request
        $query = $this->applyRelationships($query, $request);

        return $query->paginate($perPage);
    }

    /**
     * Apply role-based scoping for activity logs
     */
    protected function applyRoleBasedScoping($query)
    {
        $user = Auth::user();
        
        if (!$user || !($user instanceof User)) {
            // No user authenticated, return empty query
            return $query->whereRaw('1 = 0');
        }

        // Super Admin: Show all activity logs
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        // Clinic Role: Show clinic-related activity logs
        if ($user->hasRole('clinic')) {
            // Get all clinics owned by this user
            $ownedClinicIds = \App\Models\Clinic::where('owner_id', $user->id)->pluck('id');
            
            // Get all clinic manager user IDs from clinics owned by this user
            $clinicManagerIds = \App\Models\User::role('clinic_manager')
                ->whereHas('clinics', function ($q) use ($ownedClinicIds) {
                    $q->whereIn('clinics.id', $ownedClinicIds);
                })
                ->pluck('id');

            return $query->where(function ($q) use ($user, $ownedClinicIds, $clinicManagerIds) {
                // Activities where causer is the clinic owner (themselves)
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('causer_type', User::class)
                        ->where('causer_id', $user->id);
                })
                // Activities where subject is a Clinic owned by the user
                ->orWhere(function ($subQ) use ($ownedClinicIds) {
                    $subQ->where('subject_type', \App\Models\Clinic::class)
                        ->whereIn('subject_id', $ownedClinicIds);
                })
                // Activities where causer is a clinic manager from clinics owned by the user
                ->orWhere(function ($subQ) use ($clinicManagerIds) {
                    if ($clinicManagerIds->isNotEmpty()) {
                        $subQ->where('causer_type', User::class)
                            ->whereIn('causer_id', $clinicManagerIds);
                    } else {
                        $subQ->whereRaw('1 = 0'); // No clinic managers, no results
                    }
                });
            });
        }

        // Other roles: No activity logs access
        return $query->whereRaw('1 = 0');
    }

    /**
     * Apply custom filters (override base repository method)
     */
    protected function applyCustomFilters($query, Request $request)
    {
        // Apply entity type filter
        $query = $this->applyEntityTypeFilter($query, $request);
        
        return $query;
    }

    /**
     * Apply entity type filter based on tabs
     */
    protected function applyEntityTypeFilter($query, Request $request)
    {
        $filters = $request->get('filters', []);
        $entityType = $filters['entity_type'] ?? 'all';
        
        switch ($entityType) {
            case 'admin':
                $query->whereHas('causer.roles', function ($q) {
                    $q->whereIn('name', ['admin', 'manager', 'super-admin']);
                });
                break;
                
            case 'user':
                $query->whereHas('causer.roles', function ($q) {
                    $q->where('name', 'user');
                });
                break;
                
            case 'vendor':
                $query->whereHas('causer.roles', function ($q) {
                    $q->where('name', 'vendor');
                });
                break;
                
            case 'guest':
                $query->whereHas('causer.roles', function ($q) {
                    $q->where('name', 'guest');
                });
                break;
                
            case 'system':
                $query->whereNull('causer_id');
                break;
                
            case 'all':
            default:
                // No additional filtering for 'all'
                break;
        }

        return $query;
    }

    /**
     * Get searchable fields for activity logs
     */
    protected function getSearchableFields(): array
    {
        return ['description', 'log_name', 'event'];
    }

    /**
     * Apply search to query (override base repository method for Activity model)
     */
    protected function applySearch(\Illuminate\Database\Eloquent\Builder $query, Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $search = $request->get('search');

        if (empty($search)) {
            return $query;
        }

        // Use LIKE search for activity logs (more reliable than full-text for this model)
        $query->where(function ($q) use ($search) {
            $q->where('description', 'LIKE', "%{$search}%")
              ->orWhere('log_name', 'LIKE', "%{$search}%")
              ->orWhere('event', 'LIKE', "%{$search}%");
        });

        return $query;
    }

    /**
     * Get default sort field
     */
    protected function getDefaultSortField(): string
    {
        return 'created_at';
    }

    /**
     * Get default sort direction
     */
    protected function getDefaultSortDirection(): string
    {
        return 'desc';
    }

    /**
     * Get default relationships to load
     */
    protected function getDefaultRelationships(): array
    {
        return ['causer.roles', 'subject'];
    }

    /**
     * Get filterable fields
     */
    protected function getFilterableFields(): array
    {
        return ['log_name', 'event', 'created_at'];
    }

    /**
     * Get sortable fields
     */
    protected function getSortableFields(): array
    {
        return ['created_at', 'log_name', 'event', 'description'];
    }

    /**
     * Find record by ID or fail (with role-based scoping)
     */
    public function findOrFail(int $id): \Spatie\Activitylog\Models\Activity
    {
        $query = Activity::query();
        
        // Apply role-based scoping
        $query = $this->applyRoleBasedScoping($query);
        
        // Find the activity log within the scoped query
        $activityLog = $query->find($id);
        
        if (!$activityLog) {
            abort(404, __('common.activity_log_not_found'));
        }
        
        return $activityLog;
    }

    /**
     * Get activity logs by causer
     */
    public function getByCauser(string $causerType, int $causerId, int $perPage = 10): \Illuminate\Pagination\LengthAwarePaginator
    {
        return Activity::where('causer_type', $causerType)
            ->where('causer_id', $causerId)
            ->with(['causer', 'subject'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Delete all activity logs
     */
    public function deleteAll(?\App\Models\User $causer = null): bool
    {
        try {
            // Count logs before deletion for logging
            $count = Activity::count();
            
            // Truncate (no transaction needed as it's DDL)
            Activity::truncate();
            
            // Log the deletion action
                $activity = activity('activity_log_management')
                    ->event('deleted')
                    ->withProperties([
                        'deleted_count' => $count,
                        'action' => 'delete_all',
                        'deleted_at' => now()->toDateTimeString(),
                    ]);

                if ($causer) {
                    $activity->causedBy($causer);
                }

                $activity->log('Deleted activity log');
            
            return true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to delete all activity logs: ' . $e->getMessage());
            return false;
        }
    }
}