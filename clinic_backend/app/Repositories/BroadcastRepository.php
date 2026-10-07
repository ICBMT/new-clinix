<?php

namespace App\Repositories;

use App\Contracts\BroadcastRepositoryInterface;
use App\Models\Broadcast;
use Illuminate\Http\Request;

class BroadcastRepository extends BaseRepository implements BroadcastRepositoryInterface
{
    /**
     * BroadcastRepository constructor
     */
    public function __construct(Broadcast $model)
    {
        parent::__construct($model);
    }

    /**
     * Get searchable fields for broadcasts
     */
    protected function getSearchableFields(): array
    {
        return [
            'title_en',
            'title_ar',
            'description_en',
            'description_ar',
        ];
    }

    /**
     * Get filterable fields for broadcasts
     */
    protected function getFilterableFields(): array
    {
        return [
            'status',
            'sent_at',
            'created_at',
            'updated_at',
        ];
    }

    /**
     * Get paginated broadcasts (alias for paginate method)
     */
    public function getPaginated(Request $request, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->paginate($request, $perPage);
    }

    /**
     * Send broadcast
     */
    public function sendBroadcast(int $id): bool
    {
        $broadcast = $this->findOrFail($id);
        
        // Use NotificationService to send the broadcast
        $notificationService = app(\App\Services\NotificationService::class);
        $result = $notificationService->createAndSendBroadcast($broadcast);
        
        if ($result['success']) {
            // Update broadcast status to sent after job is dispatched
            // Note: The actual sending happens in the job queue
            $broadcast->update([
                'status' => 'sent',
            ]);
            return true;
        }
        
        return false;
    }

    /**
     * Get pending broadcasts
     */
    public function getPendingBroadcasts(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->pending()->get();
    }

    /**
     * Get sent broadcasts
     */
    public function getSentBroadcasts(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->sent()->get();
    }

    /**
     * Apply custom filters for broadcasts
     */
    protected function applyCustomFilters($query, Request $request)
    {
        $filters = $request->get('filters', []);

        // Status filter
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
