<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\FAQRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\FaqStoreRequest;
use App\Http\Requests\Dashboard\FaqUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FaqManagementController extends Controller
{
    public function __construct(
        private readonly FAQRepositoryInterface $faqRepository
    ) {}

    /**
     * Display a listing of FAQs
     */
    public function index(Request $request): Response
    {
        Gate::authorize('faqs.view');

        $perPage = $request->get('per_page', 15);
        
        $faqs = $this->faqRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/faqs/index', [
            'faqs' => $faqs,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new FAQ
     */
    public function create(): Response
    {
        Gate::authorize('faqs.create');

        return Inertia::render('dashboard/faqs/create');
    }

    /**
     * Store a newly created FAQ in storage
     */
    public function store(FaqStoreRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            return $this->faqRepository->create($data);
        });

        return redirect()->route('dashboard.faqs.index')
            ->with('success', __('common.faq_created_successfully'));
    }

    /**
     * Display the specified FAQ
     */
    public function show(int $id): Response
    {
        Gate::authorize('faqs.show');

        $faq = $this->faqRepository->findOrFail($id);

        return Inertia::render('dashboard/faqs/show', [
            'faq' => $faq,
        ]);
    }

    /**
     * Show the form for editing the specified FAQ
     */
    public function edit(int $id): Response
    {
        Gate::authorize('faqs.edit');

        $faq = $this->faqRepository->findOrFail($id);

        return Inertia::render('dashboard/faqs/edit', [
            'faq' => $faq,
        ]);
    }

    /**
     * Update the specified FAQ in storage
     */
    public function update(FaqUpdateRequest $request, int $id)
    {
        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();

            return $this->faqRepository->update($id, $data);
        });

        return redirect()->route('dashboard.faqs.edit', $id)
            ->with('success', __('common.faq_updated_successfully'));
    }

    /**
     * Remove the specified FAQ from storage
     */
    public function destroy(int $id)
    {
        Gate::authorize('faqs.destroy');

        $this->withTransaction(function () use ($id) {
            $this->faqRepository->delete($id);
        });

        return redirect()->route('dashboard.faqs.index')
            ->with('success', __('common.faq_deleted_successfully'));
    }

    /**
     * Toggle FAQ status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('faqs.toggle-status');

        $faq = $this->faqRepository->findOrFail($id);
        
        // Toggle the status
        $newStatus = !$faq->is_active;

        $this->withTransaction(function () use ($id, $newStatus) {
            $this->faqRepository->update($id, [
                'is_active' => $newStatus,
            ]);
        });

        return back()->with('success', __('common.faq_updated_successfully'));
    }
}

