<?php

namespace App\Contracts;

interface ContactRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get pending contacts
     */
    public function getPendingContacts(): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get resolved contacts
     */
    public function getResolvedContacts(): \Illuminate\Database\Eloquent\Collection;
}

