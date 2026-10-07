<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\FavoriteRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FavoriteManagementController extends Controller
{
    public function __construct(
        private readonly FavoriteRepositoryInterface $favoriteRepository
    ) {}

    /**
     * Display a listing of favorites
     */
    public function index(Request $request): Response
    {
        Gate::authorize('users.view'); // Use users permission as favorites belong to users

        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['user_id', 'favoritable_type', 'favoritable_id']);

        $favorites = $this->favoriteRepository->paginate($request, $perPage);

        return Inertia::render('dashboard/favorites/index', [
            'favorites' => $favorites,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified favorite
     */
    public function show(int $id): Response
    {
        Gate::authorize('users.view');

        $favorite = $this->favoriteRepository->findOrFail($id);

        return Inertia::render('dashboard/favorites/show', [
            'favorite' => $favorite,
        ]);
    }

    /**
     * Remove the specified favorite from storage
     */
    public function destroy(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('users.view');

        $this->withTransaction(function () use ($id) {
            $this->favoriteRepository->delete($id);
        });

        return redirect()->route('dashboard.favorites.index')
            ->with('success', __('common.favorite_deleted_successfully'));
    }
}

