<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\PaymentMethodRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodManagementController extends Controller
{
    public function __construct(
        private readonly PaymentMethodRepositoryInterface $paymentMethodRepository
    ) {}

    /**
     * Display a listing of payment methods
     */
    public function index(Request $request): Response
    {
        Gate::authorize('payment-methods.view');

        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['status']);

        $paymentMethods = $this->paymentMethodRepository->paginate($request, $perPage);

        return Inertia::render('dashboard/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'filters' => $filters,
        ]);
    }


    /**
     * Display the specified payment method
     */
    public function show(int $id): Response
    {
        Gate::authorize('payment-methods.show');

        $paymentMethod = $this->paymentMethodRepository->findOrFail($id);

        return Inertia::render('dashboard/payment-methods/show', [
            'paymentMethod' => $paymentMethod,
        ]);
    }


    /**
     * Toggle status
     */
    public function toggleStatus(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('payment-methods.toggle-status');

        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->paymentMethodRepository->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.payment_method_updated_successfully'));
    }
}

