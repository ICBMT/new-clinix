<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\BookingDocumentRepositoryInterface;
use App\Contracts\BookingRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\BookingDocumentStoreRequest;
use App\Http\Requests\Dashboard\BookingDocumentUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BookingDocumentManagementController extends Controller
{
    public function __construct(
        private readonly BookingDocumentRepositoryInterface $bookingDocumentRepository,
        private readonly BookingRepositoryInterface $bookingRepository
    ) {}

    /**
     * Display a listing of booking documents
     */
    public function index(Request $request): Response
    {
        Gate::authorize('bookings.view');

        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['booking_id', 'file_type']);

        $documents = $this->bookingDocumentRepository->paginate($request, $perPage);

        return Inertia::render('dashboard/booking-documents/index', [
            'documents' => $documents,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new booking document
     */
    public function create(Request $request): Response
    {
        Gate::authorize('bookings.view');

        $bookingId = $request->get('booking_id');
        $booking = $bookingId ? $this->bookingRepository->findOrFail($bookingId) : null;

        return Inertia::render('dashboard/booking-documents/create', [
            'booking' => $booking,
        ]);
    }

    /**
     * Store a newly created booking document in storage
     */
    public function store(BookingDocumentStoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('bookings.view');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $path = $file->store('booking-documents', 'public');
                
                $data['file_path'] = $path;
                $data['file_name'] = $file->getClientOriginalName();
                $data['file_type'] = $file->getMimeType();
                $data['file_size'] = $file->getSize();
            }

            return $this->bookingDocumentRepository->create($data);
        });

        return redirect()->route('dashboard.booking-documents.index')
            ->with('success', __('common.booking_document_created_successfully'));
    }

    /**
     * Display the specified booking document
     */
    public function show(int $id): Response
    {
        Gate::authorize('bookings.view');

        $document = $this->bookingDocumentRepository->findOrFail($id, ['booking']);

        return Inertia::render('dashboard/booking-documents/show', [
            'document' => $document,
        ]);
    }

    /**
     * Show the form for editing the specified booking document
     */
    public function edit(int $id): Response
    {
        Gate::authorize('bookings.view');

        $document = $this->bookingDocumentRepository->findOrFail($id, ['booking']);

        return Inertia::render('dashboard/booking-documents/edit', [
            'document' => $document,
        ]);
    }

    /**
     * Update the specified booking document in storage
     */
    public function update(BookingDocumentUpdateRequest $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('bookings.view');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();

            // Handle file upload if new file is provided
            if ($request->hasFile('file')) {
                $document = $this->bookingDocumentRepository->findOrFail($id);
                
                // Delete old file
                if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                    Storage::disk('public')->delete($document->file_path);
                }

                $file = $request->file('file');
                $path = $file->store('booking-documents', 'public');
                
                $data['file_path'] = $path;
                $data['file_name'] = $file->getClientOriginalName();
                $data['file_type'] = $file->getMimeType();
                $data['file_size'] = $file->getSize();
            }

            return $this->bookingDocumentRepository->update($id, $data);
        });

        return redirect()->route('dashboard.booking-documents.edit', $id)
            ->with('success', __('common.booking_document_updated_successfully'));
    }

    /**
     * Remove the specified booking document from storage
     */
    public function destroy(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('bookings.view');

        $this->withTransaction(function () use ($id) {
            $document = $this->bookingDocumentRepository->findOrFail($id);
            
            // Delete file from storage
            if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $this->bookingDocumentRepository->delete($id);
        });

        return redirect()->route('dashboard.booking-documents.index')
            ->with('success', __('common.booking_document_deleted_successfully'));
    }

    /**
     * Download the document file
     */
    public function download(int $id): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        Gate::authorize('bookings.view');

        $document = $this->bookingDocumentRepository->findOrFail($id);

        if (!Storage::disk('public')->exists($document->file_path)) {
            abort(404, __('common.file_not_found'));
        }

        return Storage::disk('public')->download($document->file_path, $document->file_name);
    }
}

