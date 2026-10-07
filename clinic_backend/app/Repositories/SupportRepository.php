<?php

namespace App\Repositories;

use App\Contracts\SupportRepositoryInterface;
use App\Models\Contact;
use App\Models\VendorReport;

class SupportRepository extends BaseRepository implements SupportRepositoryInterface
{
    protected array $searchableFields = [];
    protected array $filterableFields = [];

    public function createContact(array $data): Contact
    {
        return Contact::create($data);
    }

    public function createVendorReport(array $data): VendorReport
    {
        return VendorReport::create($data);
    }

    // getAppInfo removed as per current scope
}

