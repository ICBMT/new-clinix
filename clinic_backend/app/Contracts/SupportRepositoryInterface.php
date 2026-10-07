<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface SupportRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Create contact request
     */
    public function createContact(array $data): \App\Models\Contact;

    /**
     * Create vendor report
     */
    public function createVendorReport(array $data): \App\Models\VendorReport;
}
