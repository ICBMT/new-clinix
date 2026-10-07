<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\UserRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use App\Contracts\BookingRepositoryInterface;
use App\Contracts\FavoriteRepositoryInterface;
use App\Contracts\MediaRepositoryInterface;
use App\Contracts\TransactionRepositoryInterface;
use App\Contracts\ActivityLogRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UserStoreRequest;
use App\Http\Requests\Dashboard\UserUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly MachineRepositoryInterface $machineRepository,
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly FavoriteRepositoryInterface $favoriteRepository,
        private readonly MediaRepositoryInterface $mediaRepository,
        private readonly TransactionRepositoryInterface $transactionRepository,
        private readonly ActivityLogRepositoryInterface $activityLogRepository
    ) {}

    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        Gate::authorize('users.view');
        
        $perPage = $request->get('per_page', 15);
        $users = $this->userRepository->getByRolePaginated('user', $request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/users/index', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new user
     */
    public function create(): Response
    {
        Gate::authorize('users.create');
        
        // Get all available machines (try ready first, fallback to all if none found)
        $machines = $this->machineRepository->getByStatus('ready');
        if ($machines->isEmpty()) {
            // If no ready machines, get all machines
            $machines = $this->machineRepository->all();
        }
        $machines = $machines->map(function ($machine) {
            return [
                'id' => $machine->id,
                'name_en' => $machine->model_en ?? "Machine #{$machine->id}",
                'name_ar' => $machine->model_ar ?? $machine->model_en ?? "Machine #{$machine->id}",
            ];
        });
        
        return Inertia::render('dashboard/users/create', [
            'machines' => $machines,
        ]);
    }

    /**
     * Store a newly created user in storage
     */
    public function store(UserStoreRequest $request)
    {
        Gate::authorize('users.create');
        
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Convert empty age string to null
            if (isset($data['age']) && $data['age'] === '') {
                $data['age'] = null;
            }
            
            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $data['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
            }
            
            // Map medications to current_medications (store as array since model casts to array)
            if (isset($data['medications'])) {
                $data['current_medications'] = !empty($data['medications']) ? [$data['medications']] : null;
                unset($data['medications']);
            }
            
            // Create user
            $user = $this->userRepository->create($data);
            
            // Assign user role
            $user->assignRole('user');

            return $user;
        });

        return redirect()->route('dashboard.users.index')
            ->with('success', __('common.user_created_successfully'));
    }

    /**
     * Display the specified user
     */
    public function show(int $id): Response
    {
        Gate::authorize('users.show');
        
        $user = $this->userRepository->findOrFail($id);
        
        // Map allergies array to display string for frontend
        $userData = $user->toArray();
        if (isset($userData['allergies']) && is_array($userData['allergies'])) {
            $userData['allergies'] = !empty($userData['allergies'])
                ? implode(', ', array_filter($userData['allergies']))
                : '';
        } else {
            $userData['allergies'] = $userData['allergies'] ?? '';
        }

        // Map current_medications to medications for frontend display
        if (isset($userData['current_medications']) && is_array($userData['current_medications'])) {
            $userData['medications'] = !empty($userData['current_medications']) 
                ? implode(', ', array_filter($userData['current_medications'])) 
                : '';
        } else {
            $userData['medications'] = $userData['current_medications'] ?? '';
        }
        
        // Ensure date_of_birth is included in the response
        if (!isset($userData['date_of_birth']) && $user->date_of_birth) {
            $userData['date_of_birth'] = $user->date_of_birth->format('Y-m-d');
        }
        
        // Calculate age from date_of_birth if not already set
        if (!isset($userData['age']) || !$userData['age']) {
            if (isset($userData['date_of_birth']) && $userData['date_of_birth']) {
                $birthDate = new \DateTime($userData['date_of_birth']);
                $today = new \DateTime();
                $userData['age'] = $today->diff($birthDate)->y;
            }
        }
        
        // Ensure last_machine_used and restricted_machines are properly formatted as arrays
        if (!isset($userData['last_machine_used']) || !is_array($userData['last_machine_used'])) {
            $userData['last_machine_used'] = [];
        }
        if (!isset($userData['restricted_machines']) || !is_array($userData['restricted_machines'])) {
            $userData['restricted_machines'] = [];
        }
        
        // Filter out null/empty values and ensure they're integers, then re-index
        $userData['last_machine_used'] = array_values(array_filter(
            array_map('intval', $userData['last_machine_used']),
            fn($id) => $id > 0
        ));
        $userData['restricted_machines'] = array_values(array_filter(
            array_map('intval', $userData['restricted_machines']),
            fn($id) => $id > 0
        ));
        
        // Get machines that are actually used by the user (from last_machine_used and restricted_machines)
        $machineIds = collect([]);
        if (!empty($userData['last_machine_used'])) {
            $machineIds = $machineIds->merge($userData['last_machine_used']);
        }
        if (!empty($userData['restricted_machines'])) {
            $machineIds = $machineIds->merge($userData['restricted_machines']);
        }
        $machineIds = $machineIds->unique()->filter()->values()->toArray();
        
        // Get only the machines that the user actually has
        if (!empty($machineIds)) {
            $machines = $this->machineRepository->getByIds($machineIds)
                ->map(function ($machine) {
                    return [
                        'id' => $machine->id,
                        'name_en' => $machine->model_en ?? "Machine #{$machine->id}",
                        'name_ar' => $machine->model_ar ?? $machine->model_en ?? "Machine #{$machine->id}",
                    ];
                });
        } else {
            $machines = collect([]);
        }

        // Fetch bookings for the user
        $bookings = $this->bookingRepository->getUserBookings($id, null, 10);

        // Fetch favorites for the user (all types combined)
        $favorites = [];
        foreach (['clinic', 'treatment', 'machine'] as $type) {
            try {
                $typeFavorites = $this->favoriteRepository->getUserFavorites($id, $type, 10);
                $favorites[$type] = $typeFavorites;
            } catch (\Exception $e) {
                $favorites[$type] = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
            }
        }

        // Fetch medical records for the user
        $medicalRecords = $this->mediaRepository->getMedicalRecords($id, [], 10);
        
        // Transform medical records to include file_size from size field
        $medicalRecords->getCollection()->transform(function ($record) {
            $record->file_size = $record->size ?? 0;
            $record->file_path = $record->file_path ?? $record->file_name;
            return $record;
        });

        // Fetch transactions for the user
        // Get booking IDs for this user first
        $userBookingIds = $this->bookingRepository->getBookingIdsForUser($id);
        
        // Fetch actual Transaction records where transactionable is a Booking belonging to the user
        // OR where transactionable is the User itself
        $actualTransactions = $this->transactionRepository->getTransactionsForUser($id, $userBookingIds);
        
        // Get paid bookings that don't have Transaction records yet
        $transactionableIds = $actualTransactions->pluck('transactionable_id')->filter(function($transactionableId) {
            return $transactionableId !== null;
        })->toArray();
        $paidBookingsWithoutTransactions = $this->bookingRepository->getPaidBookingsWithoutTransactions($id, $transactionableIds);
        
        // Convert paid bookings to transaction-like format (as arrays for proper serialization)
        $bookingTransactions = $paidBookingsWithoutTransactions->map(function($booking) {
            return [
                'id' => 'booking_' . $booking->id,
                'transaction_id' => $booking->booking_reference,
                'type' => 'booking_payment',
                'amount' => (string) $booking->total_amount,
                'currency' => $booking->currency ?? 'KWD',
                'status' => 'completed',
                'payment_method' => $booking->payment_gateway ?? 'unknown',
                'created_at' => $booking->created_at->toISOString(),
                'processed_at' => ($booking->confirmed_at ?? $booking->created_at)->toISOString(),
                'transactionable_type' => \App\Models\Booking::class,
                'transactionable_id' => $booking->id,
                'transactionable' => $booking->toArray(),
            ];
        });
        
        // Convert actual transactions to arrays
        $actualTransactionsArray = $actualTransactions->map(function($transaction) {
            return [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'type' => $transaction->type,
                'amount' => (string) $transaction->amount,
                'currency' => $transaction->currency ?? 'KWD',
                'status' => $transaction->status,
                'payment_method' => $transaction->payment_method ?? 'unknown',
                'created_at' => $transaction->created_at->toISOString(),
                'processed_at' => $transaction->processed_at ? $transaction->processed_at->toISOString() : null,
                'transactionable_type' => $transaction->transactionable_type,
                'transactionable_id' => $transaction->transactionable_id,
                'transactionable' => $transaction->transactionable ? $transaction->transactionable->toArray() : null,
            ];
        });
        
        // Merge actual transactions with booking transactions
        $allTransactions = $actualTransactionsArray->concat($bookingTransactions)
            ->sortByDesc(function($item) {
                return $item['created_at'];
            })
            ->values();
        
        // Paginate manually
        $perPage = 10;
        $currentPage = request()->get('transaction_page', 1);
        $total = $allTransactions->count();
        $items = $allTransactions->slice(($currentPage - 1) * $perPage, $perPage)->values();
        
        $transactions = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => 'transaction_page']
        );

        // Fetch activity logs for the user (where user is the causer)
        $activityLogs = $this->activityLogRepository->getByCauser(\App\Models\User::class, $id, 10);

        return Inertia::render('dashboard/users/show', [
            'user' => $userData,
            'machines' => $machines,
            'bookings' => $bookings,
            'favorites' => $favorites,
            'medicalRecords' => $medicalRecords,
            'transactions' => $transactions,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified user
     */
    public function edit(int $id): Response
    {
        Gate::authorize('users.edit');
        
        $user = $this->userRepository->findOrFail($id);
        
        // Map current_medications to medications for frontend
        $userData = $user->toArray();
        if (isset($userData['current_medications']) && is_array($userData['current_medications'])) {
            // Convert array to string (join array elements)
            $userData['medications'] = !empty($userData['current_medications']) 
                ? implode(', ', array_filter($userData['current_medications'])) 
                : '';
        } else {
            $userData['medications'] = $userData['current_medications'] ?? '';
        }
        
        // Ensure date_of_birth is included in the response
        if (!isset($userData['date_of_birth']) && $user->date_of_birth) {
            $userData['date_of_birth'] = $user->date_of_birth->format('Y-m-d');
        }
        
        // Calculate age from date_of_birth if not already set
        if (!isset($userData['age']) || !$userData['age']) {
            if (isset($userData['date_of_birth']) && $userData['date_of_birth']) {
                $birthDate = new \DateTime($userData['date_of_birth']);
                $today = new \DateTime();
                $userData['age'] = $today->diff($birthDate)->y;
            }
        }
        
        // Ensure last_machine_used and restricted_machines are properly formatted as arrays
        if (!isset($userData['last_machine_used']) || !is_array($userData['last_machine_used'])) {
            $userData['last_machine_used'] = [];
        }
        if (!isset($userData['restricted_machines']) || !is_array($userData['restricted_machines'])) {
            $userData['restricted_machines'] = [];
        }
        
        // Filter out null/empty values and ensure they're integers, then re-index
        $userData['last_machine_used'] = array_values(array_filter(
            array_map('intval', $userData['last_machine_used']),
            fn($id) => $id > 0
        ));
        $userData['restricted_machines'] = array_values(array_filter(
            array_map('intval', $userData['restricted_machines']),
            fn($id) => $id > 0
        ));
        
        // Get all available machines (try ready first, fallback to all if none found)
        $machines = $this->machineRepository->getByStatus('ready');
        if ($machines->isEmpty()) {
            // If no ready machines, get all machines
            $machines = $this->machineRepository->all();
        }
        $machines = $machines->map(function ($machine) {
            return [
                'id' => $machine->id,
                'name_en' => $machine->model_en ?? "Machine #{$machine->id}",
                'name_ar' => $machine->model_ar ?? $machine->model_en ?? "Machine #{$machine->id}",
            ];
        });

        return Inertia::render('dashboard/users/edit', [
            'user' => $userData,
            'machines' => $machines,
        ]);
    }

    /**
     * Update the specified user in storage
     */
    public function update(UserUpdateRequest $request, $user)
    {
        Gate::authorize('users.edit');
        
        // Get user ID - handle both model instance and ID
        $userId = is_object($user) ? $user->id : (int) $user;
        
        // Debug: Log all request data BEFORE validation
        \Illuminate\Support\Facades\Log::info('User update - ALL REQUEST DATA BEFORE VALIDATION', [
            'user_id' => $userId,
            'all_input' => $request->all(),
            'has_file' => $request->hasFile('avatar'),
            'input_keys' => array_keys($request->all()),
            'method' => $request->method(),
        ]);
        
        $user = $this->withTransaction(function () use ($request, $userId) {
            $data = $request->validated();
            
            // If phone number is being updated, unverify email
            if (isset($data['phone'])) {
                $currentUser = $this->userRepository->findOrFail($userId);
                if ($data['phone'] !== $currentUser->phone) {
                    $data['email_verified_at'] = null;
                }
            }
            
            // Remove password if not provided
            if (empty($data['password'])) {
                unset($data['password']);
                unset($data['password_confirmation']);
            }
            
            // Calculate age from date_of_birth if provided
            if (isset($data['date_of_birth']) && $data['date_of_birth']) {
                $birthDate = new \DateTime($data['date_of_birth']);
                $today = new \DateTime();
                $age = $today->diff($birthDate)->y;
                $data['age'] = $age;
            } elseif (isset($data['age']) && $data['age'] === '') {
            // Convert empty age string to null
                $data['age'] = null;
            }
            
            // Handle allergies - convert string to array if model expects array
            if (isset($data['allergies'])) {
                if (is_string($data['allergies']) && $data['allergies'] !== '') {
                    // If it's a non-empty string, convert to array
                    $data['allergies'] = [$data['allergies']];
                } elseif ($data['allergies'] === '' || $data['allergies'] === null) {
                    // If empty string or null, set to null
                    $data['allergies'] = null;
                }
            }
            
            // Handle avatar removal
            if ($request->has('remove_avatar') && $request->input('remove_avatar')) {
                $user = $this->userRepository->findOrFail($userId);
                
                // Delete old avatar if exists
                if ($user->avatar) {
                    $oldPath = str_replace('/storage/', '', parse_url($user->avatar, PHP_URL_PATH));
                    $fullPath = 'public/' . $oldPath;
                    if (\Illuminate\Support\Facades\Storage::exists($fullPath)) {
                        \Illuminate\Support\Facades\Storage::delete($fullPath);
                    }
                }
                
                $data['avatar'] = null;
            }
            // Handle avatar upload
            elseif ($request->hasFile('avatar')) {
                $user = $this->userRepository->findOrFail($userId);
                
                // Delete old avatar if exists
                if ($user->avatar) {
                    $oldPath = str_replace('/storage/', '', parse_url($user->avatar, PHP_URL_PATH));
                    $fullPath = 'public/' . $oldPath;
                    if (\Illuminate\Support\Facades\Storage::exists($fullPath)) {
                        \Illuminate\Support\Facades\Storage::delete($fullPath);
                    }
                }
                
                // Store new avatar
                $path = $request->file('avatar')->store('avatars', 'public');
                $data['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
            }
            
            // Map medications to current_medications (store as string in JSON, but model casts to array)
            if (isset($data['medications'])) {
                // Since model casts to array, we need to store as array with single string element
                // or just store the string and let Laravel handle the cast
                $data['current_medications'] = !empty($data['medications']) ? [$data['medications']] : null;
                unset($data['medications']);
            }
            
            $user = $this->userRepository->update($userId, $data);

            return $user;
        });

        return redirect()->route('dashboard.users.edit', $userId)
            ->with('success', __('common.user_updated_successfully'));
    }

    /**
     * Remove the specified user from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('users.destroy');
        
        $this->withTransaction(function () use ($request, $id) {
            $user = $this->userRepository->findOrFail($id);

            $this->userRepository->delete($id);
        });

        return redirect()->route('dashboard.users.index')
            ->with('success', __('common.user_deleted_successfully'));
    }

    /**
     * Toggle email verification status
     */
    public function toggleEmailVerification(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('users.toggle-email-verification');
        
        $request->validate([
            'verified' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $verified = $request->input('verified');
            
            $this->userRepository->update($id, [
                'email_verified_at' => $verified ? now() : null,
            ]);
        });

        return back()->with('success', __('common.user_updated_successfully'));
    }

    /**
     * Toggle phone verification status
     */
    public function togglePhoneVerification(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('users.toggle-phone-verification');
        $request->validate([
            'verified' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $verified = $request->input('verified');
            
            $this->userRepository->update($id, [
                'phone_verified_at' => $verified ? now() : null,
            ]);
        });

        return back()->with('success', __('common.user_updated_successfully'));
    }

    /**
     * Toggle user status (active/inactive)
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('users.toggle-status');
        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $status = $request->input('status');
            
            $this->userRepository->update($id, [
                'status' => $status,
            ]);
        });

        return back()->with('success', __('common.user_updated_successfully'));
    }
}

