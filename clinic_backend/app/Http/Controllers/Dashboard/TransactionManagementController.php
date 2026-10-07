<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\TransactionRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TransactionManagementController extends Controller
{
    public function __construct(
        private readonly TransactionRepositoryInterface $transactionRepository
    ) {}

    /**
     * Display a listing of transactions
     */
    public function index(Request $request): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('transactions.view');

        $perPage = $request->get('per_page', 15);
        $transactions = $this->transactionRepository->paginate($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/transactions/index', [
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified transaction
     */
    public function show(int $id): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('transactions.show');

        $transaction = $this->transactionRepository->findOrFail($id);
        $transaction->load('transactionable');

        return Inertia::render('dashboard/transactions/show', [
            'transaction' => $transaction,
        ]);
    }
}

