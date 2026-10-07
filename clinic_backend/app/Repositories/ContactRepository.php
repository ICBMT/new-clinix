<?php

namespace App\Repositories;

use App\Contracts\ContactRepositoryInterface;
use App\Models\Contact;

class ContactRepository extends BaseRepository implements ContactRepositoryInterface
{
    protected array $searchableFields = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
    ];

    protected array $filterableFields = [
        'status',
        'user_id',
    ];

    public function __construct(Contact $model)
    {
        parent::__construct($model);
    }

    /**
     * Get pending contacts
     */
    public function getPendingContacts(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('status', 'pending')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get resolved contacts
     */
    public function getResolvedContacts(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('status', 'resolved')
            ->with('user')
            ->orderBy('resolved_at', 'desc')
            ->get();
    }
}

