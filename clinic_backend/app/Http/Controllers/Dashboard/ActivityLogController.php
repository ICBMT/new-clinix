<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ActivityLogRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(
        private readonly ActivityLogRepositoryInterface $activityLogRepository
    ) {}

    /**
     * Display a listing of activity logs
     */
    public function index(Request $request): Response
    {
        Gate::authorize('activity-logs.view');
        
        $perPage = $request->get('per_page', 15);

        // Get activity logs with filters
        $activityLogs = $this->activityLogRepository->getPaginated($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/activity-logs/index', [
            'activityLogs' => $activityLogs,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified activity log
     */
    public function show(int $id): Response
    {
        Gate::authorize('activity-logs.show');
        
        $activityLog = $this->activityLogRepository->findOrFail($id);
        
        // Load relationships for the show page
        $activityLog->load(['causer.roles', 'subject']);

        return Inertia::render('dashboard/activity-logs/show', [
            'activityLog' => $activityLog,
        ]);
    }

    /**
     * Remove all activity logs
     */
    public function destroyAll(Request $request)
    {
        Gate::authorize('activity-logs.destroy');

        /** @var User $user */
        $user = $request->user();

        // Only super-admin can delete all activity logs
        if (!$user->hasRole('super-admin')) {
            abort(403, __('common.only_super_admin_can_delete_activity_logs'));
        }

        $this->withTransaction(function () use ($user) {
            $this->activityLogRepository->deleteAll($user);
        });

        return redirect()->route('dashboard.activity-logs.index')
            ->with('success', __('common.activity_logs_deleted_successfully'));
    }
}
