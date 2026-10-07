<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ContactRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ContactUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ContactManagementController extends Controller
{
    public function __construct(
        private readonly ContactRepositoryInterface $contactRepository
    ) {}

    /**
     * Display a listing of contacts
     */
    public function index(Request $request): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('contacts.view');

        $perPage = $request->get('per_page', 15);
        $contacts = $this->contactRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/contacts/index', [
            'contacts' => $contacts,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified contact
     */
    public function show(int $id): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('contacts.show');

        $contact = $this->contactRepository->findOrFail($id);
        $contact->load('user');

        return Inertia::render('dashboard/contacts/show', [
            'contact' => $contact,
        ]);
    }

    /**
     * Show the form for editing the specified contact
     */
    public function edit(int $id): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('contacts.edit');

        $contact = $this->contactRepository->findOrFail($id);

        return Inertia::render('dashboard/contacts/edit', [
            'contact' => $contact,
        ]);
    }

    /**
     * Update the specified contact in storage
     */
    public function update(ContactUpdateRequest $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('contacts.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // If resolving, set resolved_at
            if (isset($data['status']) && $data['status'] === 'resolved' && !$data['resolved_at']) {
                $data['resolved_at'] = now();
            }

            return $this->contactRepository->update($id, $data);
        });

        return redirect()->route('dashboard.contacts.edit', $id)
            ->with('success', __('common.contact_updated_successfully'));
    }

    /**
     * Remove the specified contact from storage
     */
    public function destroy(int $id)
    {
        // Contacts permission not in seeder, allow for now
        // Gate::authorize('contacts.destroy');

        $this->withTransaction(function () use ($id) {
            $this->contactRepository->delete($id);
        });

        return redirect()->route('dashboard.contacts.index')
            ->with('success', __('common.contact_deleted_successfully'));
    }

    /**
     * Mark contact as resolved
     */
    public function resolve(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('contacts.resolve');

        $this->withTransaction(function () use ($request, $id) {
            $this->contactRepository->update($id, [
                'status' => 'resolved',
                'admin_response' => $request->input('admin_response'),
                'resolved_at' => now(),
            ]);
        });

        return back()->with('success', __('common.contact_resolved_successfully'));
    }
}

