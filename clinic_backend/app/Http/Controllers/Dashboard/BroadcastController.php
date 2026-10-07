<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\BroadcastRepositoryInterface;
use App\Contracts\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\BroadcastStoreRequest;
use App\Http\Requests\Dashboard\BroadcastUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastController extends Controller
{
    public function __construct(
        private readonly BroadcastRepositoryInterface $broadcastRepository,
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * Display a listing of broadcasts
     */
    public function index(Request $request): Response
    {
        Gate::authorize('broadcasts.view');
        
        $perPage = $request->get('per_page', 15);
        $broadcasts = $this->broadcastRepository->getPaginated($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/broadcasts/index', [
            'broadcasts' => $broadcasts,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new broadcast
     */
    public function create(): Response
    {
        Gate::authorize('broadcasts.create');
        
        // Get active users for broadcast recipients - exclude guests and super-admin
        $users = $this->userRepository->findBy(['status' => 'active'], 1000);
        $users = $users->filter(function ($user) {
            // Exclude users with guest or super-admin roles
            return !$user->hasRole('guest') && !$user->hasRole('super-admin');
        })->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        })->values();

        // Get all roles except super-admin only (guest is already excluded from users)
        $roles = \Spatie\Permission\Models\Role::where('name', '!=', 'super-admin')
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'alias' => $role->alias ?? $role->name,
                ];
            });

        return Inertia::render('dashboard/broadcasts/create', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created broadcast in storage
     */
    public function store(BroadcastStoreRequest $request)
    {
        Gate::authorize('broadcasts.create');
        
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Process recipient data based on recipient_type
            if ($data['recipient_type'] === 'roles') {
                $data['target_roles'] = $data['target_roles'] ?? [];
                $data['recipients'] = null;
            } else {
                $data['recipients'] = array_map('intval', $data['selected_users'] ?? []);
                $data['target_roles'] = null;
            }
            
            // Handle send type (scheduled or draft)
            $sendType = $data['send_type'] ?? 'draft';
            
            if ($sendType === 'scheduled' && isset($data['scheduled_at'])) {
                $data['scheduled_at'] = $data['scheduled_at'];
                $data['status'] = 'scheduled';
            } else {
                // Always save as draft when creating - user can send from index page
                $data['scheduled_at'] = null;
                $data['status'] = 'draft';
            }
            
            // Remove fields that shouldn't be saved
            unset($data['recipient_type'], $data['selected_users'], $data['send_type']);
            
            // Map message_en/message_ar to description_en/description_ar
            $data['description_en'] = $data['message_en'] ?? '';
            $data['description_ar'] = $data['message_ar'] ?? '';
            unset($data['message_en'], $data['message_ar']);
            
            $broadcast = $this->broadcastRepository->create($data);
            
            // No automatic sending - user must send from index page
        });

        return redirect()->route('dashboard.broadcasts.index')
            ->with('success', __('common.broadcast_created_successfully'));
    }

    /**
     * Display the specified broadcast
     */
    public function show(int $id): Response
    {
        Gate::authorize('broadcasts.show');
        
        $broadcast = $this->broadcastRepository->findOrFail($id);
        
        // Map description fields to message fields for frontend compatibility
        $broadcastData = $broadcast->toArray();
        $broadcastData['message_en'] = $broadcast->description_en ?? '';
        $broadcastData['message_ar'] = $broadcast->description_ar ?? '';
        
        // Format recipients data for frontend
        $formattedRecipients = null;
        
        if (!empty($broadcast->recipients) && is_array($broadcast->recipients)) {
            // Specific users selected
            $userIds = array_map('intval', $broadcast->recipients);
            $users = $this->userRepository->findBy(['id' => $userIds], 1000)
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ];
                });
            
            $formattedRecipients = [
                'type' => 'specific',
                'users' => $users->toArray(),
                'users_count' => $users->count(),
            ];
        } elseif (!empty($broadcast->target_roles) && is_array($broadcast->target_roles)) {
            // Roles selected
            $roles = \Spatie\Permission\Models\Role::whereIn('name', $broadcast->target_roles)
                ->get()
                ->map(function ($role) {
                    return [
                        'name' => $role->name,
                        'alias' => $role->alias ?? $role->name,
                    ];
                });
            
            $formattedRecipients = [
                'type' => 'all',
                'roles' => $roles->toArray(),
            ];
        }
        
        $broadcastData['formattedRecipients'] = $formattedRecipients;

        return Inertia::render('dashboard/broadcasts/show', [
            'broadcast' => $broadcastData,
        ]);
    }

    /**
     * Show the form for editing the specified broadcast
     */
    public function edit(int $id): Response
    {
        Gate::authorize('broadcasts.edit');
        
        $broadcast = $this->broadcastRepository->findOrFail($id);
        
        // Get active users for broadcast recipients - exclude guests and super-admin
        $users = $this->userRepository->findBy(['status' => 'active'], 1000);
        $users = $users->filter(function ($user) {
            // Exclude users with guest or super-admin roles
            return !$user->hasRole('guest') && !$user->hasRole('super-admin');
        })->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        })->values();

        // Get all roles except super-admin only (guest is already excluded from users)
        $roles = \Spatie\Permission\Models\Role::where('name', '!=', 'super-admin')
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'alias' => $role->alias ?? $role->name,
                ];
            });

        return Inertia::render('dashboard/broadcasts/edit', [
            'broadcast' => $broadcast,
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified broadcast in storage
     */
    public function update(BroadcastUpdateRequest $request, int $id)
    {
        Gate::authorize('broadcasts.edit');
        
        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // Process recipient data based on recipient_type
            if ($data['recipient_type'] === 'roles') {
                $data['target_roles'] = $data['target_roles'] ?? [];
                $data['recipients'] = null;
            } else {
                $data['recipients'] = array_map('intval', $data['selected_users'] ?? []);
                $data['target_roles'] = null;
            }
            
            // Handle send type (now or scheduled)
            $sendType = $data['send_type'] ?? null;
            $shouldSendNow = false;
            
            if ($sendType === 'scheduled' && isset($data['scheduled_at'])) {
                $data['scheduled_at'] = $data['scheduled_at'];
                $data['status'] = 'scheduled';
            } elseif ($sendType === 'now') {
                $data['scheduled_at'] = null;
                // Don't change status if already sent
                $broadcast = $this->broadcastRepository->findOrFail($id);
                if ($broadcast->status !== 'sent') {
                    $data['status'] = 'draft';
                    $shouldSendNow = true;
                }
            }
            
            // Remove fields that shouldn't be saved
            unset($data['recipient_type'], $data['selected_users'], $data['send_type']);
            
            // Map message_en/message_ar to description_en/description_ar
            $data['description_en'] = $data['message_en'] ?? '';
            $data['description_ar'] = $data['message_ar'] ?? '';
            unset($data['message_en'], $data['message_ar']);
            
            $broadcast = $this->broadcastRepository->update($id, $data);
            
            // If send_type is 'now', automatically dispatch the job
            if ($shouldSendNow) {
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->createAndSendBroadcast($broadcast);
            }
        });

        return redirect()->route('dashboard.broadcasts.edit', $id)
            ->with('success', __('common.broadcast_updated_successfully'));
    }

    /**
     * Send broadcast
     */
    public function send(int $id)
    {
        Gate::authorize('broadcasts.send');
        
        $this->withTransaction(function () use ($id) {
            $this->broadcastRepository->sendBroadcast($id);
        });

        return redirect()->back()->with('success', __('common.broadcast_sent_successfully'));
    }

    /**
     * Schedule broadcast
     */
    public function schedule(Request $request, int $id)
    {
        Gate::authorize('broadcasts.edit');
        
        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            $this->broadcastRepository->update($id, [
                'scheduled_at' => $validated['scheduled_at'],
                'status' => 'scheduled',
            ]);
        });

        return redirect()->back()->with('success', __('common.broadcast_scheduled_successfully'));
    }

    /**
     * Remove the specified broadcast from storage
     */
    public function destroy(int $id)
    {
        Gate::authorize('broadcasts.destroy');
        
        $this->withTransaction(function () use ($id) {
            $this->broadcastRepository->delete($id);
        });

        return redirect()->back()->with('success', __('common.broadcast_deleted_successfully'));
    }
}