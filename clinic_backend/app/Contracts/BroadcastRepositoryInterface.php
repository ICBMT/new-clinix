<?php

namespace App\Contracts;

use App\Models\Broadcast;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface BroadcastRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Send broadcast
     */
    public function sendBroadcast(int $id): bool;

    /**
     * Get pending broadcasts
     */
    public function getPendingBroadcasts(): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get sent broadcasts
     */
    public function getSentBroadcasts(): \Illuminate\Database\Eloquent\Collection;
}
