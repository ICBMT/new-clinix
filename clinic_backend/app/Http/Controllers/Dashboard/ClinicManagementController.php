<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\ClinicPayoutRepositoryInterface;
use App\Contracts\ClinicSubscriptionRepositoryInterface;
use App\Contracts\ClinicOperatingHourRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ClinicCreateRequest;
use App\Http\Requests\Dashboard\ClinicUpdateRequest;
use App\Models\Clinic;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\SiteSettingsService;
use App\Traits\ScopesClinicData;
use App\Traits\HandlesRoleBasedQueries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ClinicManagementController extends Controller
{
    use ScopesClinicData, HandlesRoleBasedQueries;
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly ClinicPayoutRepositoryInterface $clinicPayoutRepository,
        private readonly ClinicSubscriptionRepositoryInterface $clinicSubscriptionRepository,
        private readonly ClinicOperatingHourRepositoryInterface $clinicOperatingHourRepository
    ) {}

    /**
     * Display a listing of clinics
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics.view');
        
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $status = $request->get('status');
        $verificationStatus = $request->input('filters.verification_status') ?? $request->get('verification_status');
        $isFeatured = $request->get('is_featured');
        $createdFrom = $request->input('filters.created_from') ?? $request->get('created_from');
        $createdTo = $request->input('filters.created_to') ?? $request->get('created_to');
        
        $query = Clinic::with([
            'owner:id,name,email,phone,status', 
            'operatingHours',
            'media' => function($q) {
                $q->where('collection_name', 'logos');
            }
        ]);
        
        // Scope clinics based on user role
        $query = $this->scopeClinicsForUser($query);
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('name_ar', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereHas('owner', function ($ownerQuery) use ($search) {
                      $ownerQuery->where('name', 'LIKE', "%{$search}%")
                                  ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }
        
        // Handle verification status filter (map verification_status to status)
        if ($verificationStatus && $verificationStatus !== 'all') {
            $query->where('status', $verificationStatus);
        } elseif ($status) {
            $query->where('status', $status);
        }
        
        if ($createdFrom) {
            $query->whereDate('created_at', '>=', $createdFrom);
        }
        
        if ($createdTo) {
            $query->whereDate('created_at', '<=', $createdTo);
        }
        
        if ($isFeatured !== null) {
            $query->where('is_featured', $isFeatured);
        }
        
        $clinics = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Transform clinics to include verification_status for frontend
        $clinics->getCollection()->transform(function ($clinic) {
            $clinic->verification_status = $clinic->status;
            $clinic->company_name_en = $clinic->name_en;
            $clinic->company_name_ar = $clinic->name_ar;
            
            // Get logo URL - check media relationship first, then fallback to logo field
            $logoUrl = null;
            
            // Try to get from media relationship first
            if ($clinic->relationLoaded('media') && $clinic->media->isNotEmpty()) {
                $logoMedia = $clinic->media->where('collection_name', 'logos')->first();
                if ($logoMedia) {
                    $logoUrl = $logoMedia->url ?? $logoMedia->file_name ?? null;
                }
            }
            
            // Fallback to logo field
            if (!$logoUrl && $clinic->logo) {
                $logoUrl = $clinic->logo;
            }
            
            // Ensure logo URL is properly formatted
            if ($logoUrl && !str_starts_with($logoUrl, 'http')) {
                // If logo is a storage path, convert to full URL
                $logoPath = str_replace('storage/', '', $logoUrl);
                $logoPath = str_replace('clinics/logos/', '', $logoPath);
                $logoUrl = asset('storage/clinics/logos/' . $logoPath);
            }
            
            // Set the formatted logo URL
            $clinic->logo = $logoUrl;
            
            // Transform operating hours to office_hours format for frontend
            if ($clinic->operatingHours && $clinic->operatingHours->count() > 0) {
                // day_of_week is already a string (ENUM), no mapping needed
                $clinic->office_hours = $clinic->operatingHours->map(function ($oh) {
                    return [
                        'id' => $oh->id,
                        'day_of_week' => $oh->day_of_week, // Already a string like 'monday', 'tuesday', etc.
                        'opening_time' => $oh->opening_time,
                        'closing_time' => $oh->closing_time,
                        'is_closed' => !$oh->is_open || $oh->closed_all_day,
                    ];
                })->toArray();
            } else {
                $clinic->office_hours = [];
            }
            
            // Make sure email and phone are visible
            $clinic->makeVisible(['email', 'phone']);
            
            return $clinic;
        });

        $filters = [
            'search' => $search,
            'verification_status' => $verificationStatus,
            'created_from' => $createdFrom,
            'created_to' => $createdTo,
        ];

        // Check if user can approve/reject clinics (checks permissions)
        $canApproveReject = $this->canApproveRejectClinics();
        
        // Check if user can toggle owner status
        $canToggleOwnerStatus = $this->canToggleOwnerStatus();

        return Inertia::render('dashboard/clinics/index', [
            'clinics' => $clinics,
            'filters' => $filters,
            'canApproveReject' => $canApproveReject,
            'canToggleOwnerStatus' => $canToggleOwnerStatus,
        ]);
    }

    /**
     * Show the form for creating a new clinic
     */
    public function create(): Response
    {
        Gate::authorize('clinics.create');
        
        // Get approved clinic owners for dropdown (only approved clinics)
        $users = $this->getApprovedClinicOwnersForDropdown();
        
        // Get active governorates for dropdowns
        $governorates = \App\Models\Governorate::active()
            ->orderBy('name_en')
            ->get(['id', 'name_en', 'name_ar']);
        
        // Get active categories for dropdowns
        $categories = \App\Models\Category::active()
            ->orderBy('name_en')
            ->get(['id', 'name_en', 'name_ar']);

        // Get active subscription packages
        $subscriptionPackages = \App\Models\SubscriptionPackage::active()
            ->ordered()
            ->get(['id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'currency', 'billing_cycle', 'duration_days', 'features']);
        
        // Get current user for role-based access control
        $authUser = Auth::user();
        $clinicOwnerId = null;
        
        if ($authUser && $authUser instanceof \App\Models\User) {
            /** @var \App\Models\User $user */
            $user = $authUser;
            
            // For clinic role: use current user as owner
            if ($user->hasRole('clinic') && !$user->hasRole('super-admin')) {
                $clinicOwnerId = $user->id;
            }
            
            // For clinic_manager role: get owner from their assigned clinics
            if ($user->hasRole('clinic_manager') && !$user->hasRole('super-admin')) {
                $assignedClinicIds = $user->getAssignedClinicIds();
                if (!empty($assignedClinicIds)) {
                    // Get the first assigned clinic's owner
                    $firstClinic = Clinic::whereIn('id', $assignedClinicIds)->first();
                    if ($firstClinic && $firstClinic->owner_id) {
                        $clinicOwnerId = $firstClinic->owner_id;
                    }
                }
            }
        }
        
        return Inertia::render('dashboard/clinics/create', [
            'users' => $users,
            'governorates' => $governorates,
            'categories' => $categories,
            'subscriptionPackages' => $subscriptionPackages,
            'currentUser' => $authUser ? [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'email' => $authUser->email,
                'roles' => $authUser->roles->pluck('name')->toArray(),
            ] : null,
            'clinicOwnerId' => $clinicOwnerId, // For clinic_manager role
        ]);
    }

    /**
     * Validate a step of the clinic creation form
     */
    protected function validateStep(Request $request)
    {
        // Transform nested clinic fields to flat structure for ClinicCreateRequest
        $transformedData = $request->all();
        
        // If clinic data is nested, flatten it for the validation request
        if ($request->has('clinic')) {
            $clinicData = $request->input('clinic', []);
            foreach ($clinicData as $key => $value) {
                $transformedData[$key] = $value;
            }
            // Remove nested clinic data
            unset($transformedData['clinic']);
        }

        // Create a new request with transformed data
        $validationRequest = Request::create($request->url(), $request->method(), $transformedData);
        $validationRequest->files->add($request->allFiles());
        $validationRequest->headers->add($request->headers->all());
        $validationRequest->setUserResolver($request->getUserResolver());
        
        // Get the step first
        $step = (int) $validationRequest->input('step', 1);
        
        // Use ClinicCreateRequest to get validation rules and messages
        $createRequest = ClinicCreateRequest::createFrom($validationRequest);
        $createRequest->setContainer(app());
        
        // Get validation rules and messages for this step
        $rules = $createRequest->rules();
        $messages = $createRequest->messages();
        
        // Validate using Validator facade to get errors without throwing exception
        $validator = Validator::make($validationRequest->all(), $rules, $messages);
        $errors = $validator->errors()->toArray();
        
        // Convert error messages from arrays to arrays of strings (if needed)
        foreach ($errors as $key => $value) {
            if (!is_array($value)) {
                $errors[$key] = [$value];
            }
        }

        // Step-specific additional validations (database uniqueness checks, etc.)
        switch ($step) {
            case 1:
                $createNewUser = $validationRequest->input('create_new_user', false);
                
                if ($createNewUser) {
                    // Check if user email exists (only if email passed basic validation and format checks)
                    $email = $validationRequest->input('email');
                    if ($email && !isset($errors['email'])) {
                        $emailExists = User::where('email', $email)->exists();
                        if ($emailExists) {
                            $errors['email'] = [__('common.email_already_taken')];
                        }
                    }

                    // Check if user phone exists (only if phone passed basic validation and format checks)
                    $phone = $validationRequest->input('phone');
                    if ($phone && !isset($errors['phone'])) {
                        $phoneExists = User::where('phone', $phone)->exists();
                        if ($phoneExists) {
                            $errors['phone'] = [__('common.phone_already_taken')];
                        }
                    }
                }
                break;

            case 2:
                // Check if clinic name_en exists
                if ($validationRequest->filled('name_en')) {
                    $nameEnExists = Clinic::where('name_en', $validationRequest->name_en)->exists();
                    if ($nameEnExists) {
                        $errors['name_en'] = [__('common.clinic_name_en_already_taken')];
                    }
                }

                // Check if clinic name_ar exists
                if ($validationRequest->filled('name_ar')) {
                    $nameArExists = Clinic::where('name_ar', $validationRequest->name_ar)->exists();
                    if ($nameArExists) {
                        $errors['name_ar'] = [__('common.clinic_name_ar_already_taken')];
                    }
                }
                
                // Check if clinic email exists (if provided)
                if ($validationRequest->filled('email')) {
                    $emailExists = Clinic::where('email', $validationRequest->email)->exists();
                    if ($emailExists) {
                        $errors['email'] = [__('common.clinic_email_already_taken')];
                    }
                }

                // Check if clinic phone exists
                if ($validationRequest->filled('phone')) {
                    $phoneExists = Clinic::where('phone', $validationRequest->phone)->exists();
                    if ($phoneExists) {
                        $errors['phone'] = [__('common.clinic_phone_already_taken')];
                    }
                }
                break;

            case 5:
                // Validate that closing_time is after opening_time for each day
                if ($validationRequest->has('operating_hours') && is_array($validationRequest->operating_hours)) {
                    foreach ($validationRequest->operating_hours as $index => $hours) {
                        if (!empty($hours['opening_time']) && !empty($hours['closing_time'])) {
                            try {
                                $opening = \Carbon\Carbon::createFromFormat('H:i', $hours['opening_time']);
                                $closing = \Carbon\Carbon::createFromFormat('H:i', $hours['closing_time']);
                                
                                if ($closing->lte($opening)) {
                                    $errors["operating_hours.{$index}.closing_time"] = [__('common.start_time_must_not_be_greater_than_end_time')];
                                }
                            } catch (\Exception $e) {
                                // Invalid time format - already handled by validation rules
                            }
                        }
                    }
                }
                break;
        }

        if (!empty($errors)) {
            return response()->json([
                'valid' => false,
                'errors' => $errors,
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => __('common.validation_passed'),
        ]);
    }

    /**
     * Store a newly created clinic in storage
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        Gate::authorize('clinics.create');
        
        // Check if this is a validation-only request
        if ($request->has('step')) {
            return $this->validateStep($request);
        }
        
        // Transform nested clinic fields to flat structure for ClinicCreateRequest
        $transformedData = $request->all();
        
        // If clinic data is nested, flatten it for the validation request
        if ($request->has('clinic')) {
            $clinicData = $request->input('clinic', []);
            foreach ($clinicData as $key => $value) {
                // Skip files - they're already in the request
                if (!($value instanceof \Illuminate\Http\UploadedFile)) {
                    $transformedData[$key] = $value;
                }
            }
            // Remove nested clinic data
            unset($transformedData['clinic']);
        }
        
        // Merge transformed data back into request for validation
        $request->merge($transformedData);
        
        // Use ClinicCreateRequest for final validation (validates all steps)
        // Files are already in the original request, so they'll be validated
        $createRequest = ClinicCreateRequest::createFrom($request);
        $createRequest->setContainer(app());
        
        // Validate using ClinicCreateRequest
        // Merge files into validation data so they can be validated
        $validationData = array_merge($request->all(), $request->allFiles());
        $validator = Validator::make($validationData, $createRequest->rules(), $createRequest->messages());
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        $data = $validator->validated();
        
        try {
            $this->withTransaction(function () use ($data, $request) {
                
                // Handle new user creation if requested
                if ($request->input('create_new_user', false)) {
                    // Check if user with this email already exists
                    $existingUser = User::where('email', $data['email'])->first();
                    if ($existingUser) {
                        throw new \Illuminate\Validation\ValidationException(
                            \Illuminate\Support\Facades\Validator::make([], []),
                            ['email' => [__('common.auth_email_unique')]]
                        );
                    }
                    
                    // Check if user with this phone already exists
                    if (!empty($data['phone'])) {
                        $existingUserByPhone = User::where('phone', $data['phone'])->first();
                        if ($existingUserByPhone) {
                            throw new \Illuminate\Validation\ValidationException(
                                \Illuminate\Support\Facades\Validator::make([], []),
                                ['phone' => [__('common.auth_phone_unique')]]
                            );
                        }
                    }
                    
                    try {
                    $user = User::create([
                        'name' => $data['name'],
                        'email' => $data['email'],
                        'phone' => $data['phone'],
                        'password' => Hash::make($data['password']),
                        'status' => 'active',
                    ]);
                    } catch (\Illuminate\Database\QueryException $e) {
                        // Handle duplicate entry errors
                        if ($e->getCode() === '23000') {
                            $errorCode = $e->errorInfo[1] ?? null;
                            if ($errorCode === 1062) {
                                // Duplicate entry
                                $errorMessage = $e->getMessage();
                                if (str_contains($errorMessage, 'email')) {
                                    throw new \Illuminate\Validation\ValidationException(
                                        \Illuminate\Support\Facades\Validator::make([], []),
                                        ['email' => [__('common.auth_email_unique')]]
                                    );
                                } elseif (str_contains($errorMessage, 'phone')) {
                                    throw new \Illuminate\Validation\ValidationException(
                                        \Illuminate\Support\Facades\Validator::make([], []),
                                        ['phone' => [__('common.auth_phone_unique')]]
                                    );
                                }
                            }
                        }
                        // Re-throw if not a duplicate entry error
                        throw $e;
                    }
                    
                    // Assign clinic role to the new user
                    $user->assignRole('clinic');
                    
                    $data['owner_id'] = $user->id;
                    
                    // Store clinic email and phone before unsetting user fields
                    // The clinic has its own email and phone fields separate from the user
                    $clinicEmail = $data['email'] ?? null;
                    $clinicPhone = $data['phone'] ?? null;
                    
                    // Remove user creation fields from data (these are for the user, not the clinic)
                    unset($data['name'], $data['password'], $data['password_confirmation'], $data['create_new_user']);
                    
                    // Restore clinic email and phone if they were set (clinic has its own email/phone)
                    // Only restore if they're different from user email/phone or if user email/phone weren't set
                    if ($clinicEmail !== null) {
                        $data['email'] = $clinicEmail;
                    }
                    if ($clinicPhone !== null) {
                        $data['phone'] = $clinicPhone;
                    }
                } elseif (isset($data['user_id']) && !empty($data['user_id'])) {
                    // Selecting existing user - set owner_id from user_id
                    $data['owner_id'] = $data['user_id'];
                    unset($data['user_id']);
                }
                
                // For clinic role, automatically set owner_id to current user (only if not already set)
                if (!isset($data['owner_id'])) {
                    $authUser = Auth::user();
                    if ($authUser && $authUser instanceof \App\Models\User) {
                        /** @var \App\Models\User $user */
                        $user = $authUser;
                        if ($user->hasRole('clinic') && !$user->hasRole('super-admin')) {
                            $data['owner_id'] = $user->id;
                        }
                    }
                }
                
                // Ensure owner_id is set - if not, throw error
                if (!isset($data['owner_id']) || empty($data['owner_id'])) {
                    throw new \Exception('Owner ID is required. Please select an existing user or create a new user.');
                }
                
                // Handle clinics array (for admin creating multiple clinics)
                if (isset($data['clinics']) && is_array($data['clinics'])) {
                    $ownerId = $data['owner_id'] ?? null;
                    if (!$ownerId) {
                        throw new \Exception('Owner ID is required when creating clinics');
                    }
                    
                    foreach ($data['clinics'] as $clinicData) {
                        $clinicData['owner_id'] = $ownerId;
                        $clinicData['status'] = $data['verification_status'] ?? 'pending';
                        
                        // Map company_name to name for backward compatibility
                        if (isset($clinicData['company_name_en']) && !isset($clinicData['name_en'])) {
                            $clinicData['name_en'] = $clinicData['company_name_en'];
                        }
                        if (isset($clinicData['company_name_ar']) && !isset($clinicData['name_ar'])) {
                            $clinicData['name_ar'] = $clinicData['company_name_ar'];
                        }
                        
                        // Map bio to description if needed
                        if (isset($clinicData['bio_en']) && !isset($clinicData['description_en'])) {
                            $clinicData['description_en'] = $clinicData['bio_en'];
                        }
                        if (isset($clinicData['bio_ar']) && !isset($clinicData['description_ar'])) {
                            $clinicData['description_ar'] = $clinicData['bio_ar'];
                        }
                        
                        // Handle file uploads for each clinic
                        if (isset($clinicData['business_license']) && $clinicData['business_license'] instanceof \Illuminate\Http\UploadedFile) {
                            $clinicData['business_license_path'] = $clinicData['business_license']->store('uploads', 'public');
                        }
                        
                        if (isset($clinicData['id_document_front']) && $clinicData['id_document_front'] instanceof \Illuminate\Http\UploadedFile) {
                            $clinicData['id_document_front_path'] = $clinicData['id_document_front']->store('uploads', 'public');
                        }
                        
                        if (isset($clinicData['id_document_back']) && $clinicData['id_document_back'] instanceof \Illuminate\Http\UploadedFile) {
                            $clinicData['id_document_back_path'] = $clinicData['id_document_back']->store('uploads', 'public');
                        }
                        
                        // Handle office hours
                        if (isset($clinicData['office_hours']) && is_array($clinicData['office_hours'])) {
                            $officeHours = $clinicData['office_hours'];
                            unset($clinicData['office_hours']);
                        }
                        
                        // Create clinic
                        $clinic = $this->clinicRepository->create($clinicData);
                        
                        // Create subscription if subscription_package_id is provided
                        if (isset($clinicData['subscription_package_id']) && !empty($clinicData['subscription_package_id'])) {
                            $packageId = (int) $clinicData['subscription_package_id'];
                            $package = \App\Models\SubscriptionPackage::find($packageId);
                            
                            if ($package) {
                                $subscription = $this->clinicSubscriptionRepository->create([
                                    'clinic_id' => $clinic->id,
                                    'subscription_package_id' => $packageId,
                                    'amount_paid' => $package->price ?? 0,
                                    'currency' => $package->currency ?? 'KWD',
                                    'start_date' => now(),
                                    'end_date' => now()->addDays($package->duration_days ?? 30),
                                    'status' => 'active',
                                    'auto_renew' => false,
                                ]);
                                
                                // Link subscription to clinic and refresh the model
                                $clinic->subscription_id = $subscription->id;
                                $clinic->save();
                                $clinic->refresh();
                            }
                        }
                        
                        // Create operating hours if provided
                        if (isset($officeHours) && $clinic) {
                            $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            foreach ($officeHours as $hour) {
                                if (isset($hour['day_of_week']) && in_array($hour['day_of_week'], $validDays)) {
                                    $clinic->operatingHours()->create([
                                        'day_of_week' => $hour['day_of_week'],
                                        'is_open' => !($hour['is_closed'] ?? false),
                                        'closed_all_day' => $hour['is_closed'] ?? false,
                                        'opening_time' => $hour['opening_time'] ?? null,
                                        'closing_time' => $hour['closing_time'] ?? null,
                                    ]);
                                }
                            }
                        }
                    }
                } else {
                    // Single clinic creation
                    // Handle logo upload using MediaService
                    $logo = $request->file('logo');
                    unset($data['logo']);
                    
                    // Set default verification status
                    $data['status'] = $data['status'] ?? 'pending';
                    
                    // Set default working days if not provided
                    if (!isset($data['working_days'])) {
                        $data['working_days'] = [1, 2, 3, 4, 5, 6, 7]; // Monday to Sunday
                    }
                    
                    // Set default office hours if not provided
                    if (!isset($data['opening_time'])) {
                        $data['opening_time'] = '09:00:00';
                    }
                    if (!isset($data['closing_time'])) {
                        $data['closing_time'] = '18:00:00';
                    }
                    
                    // Create clinic
                    $clinic = $this->clinicRepository->create($data);
                    
                    // Handle logo upload using MediaService
                    if ($logo) {
                        $mediaService = app(\App\Services\MediaService::class);
                        $media = $mediaService->uploadAndCreateMedia($logo, 'clinics/logos', [
                            'mediable_type' => \App\Models\Clinic::class,
                            'mediable_id' => $clinic->id,
                            'collection' => 'logos',
                        ]);
                        
                        // Save full URL to clinic's logo column
                        if ($media) {
                            // Refresh media to ensure we have the latest data
                            $media->refresh();
                            
                            // Use url accessor or file_name, ensuring it's a full URL
                            $logoUrl = $media->url ?? $media->file_name;
                            
                            // If it's not a full URL, convert it using Storage or asset
                            if ($logoUrl && !str_starts_with($logoUrl, 'http')) {
                                // If it's a storage path, convert to full URL
                                if (str_contains($logoUrl, 'clinics/logos/')) {
                                    $logoUrl = asset('storage/' . ltrim($logoUrl, '/'));
                                } else {
                                    // Try using asset() as fallback
                                    if (!empty($logoUrl)) {
                                        $logoUrl = asset('storage/' . ltrim($logoUrl, '/'));
                                    }
                                }
                            }
                            
                            if ($logoUrl) {
                                $clinic->update(['logo' => $logoUrl]);
                            }
                        }
                    }
                    
                    // Store documents using MediaService AFTER clinic is created
                    $mediaService = app(\App\Services\MediaService::class);
                    
                    if ($request->hasFile('business_license')) {
                        $mediaService->uploadAndCreateMedia($request->file('business_license'), 'clinics/documents', [
                            'mediable_type' => \App\Models\Clinic::class,
                            'mediable_id' => $clinic->id,
                            'collection' => 'business_license',
                        ]);
                    }
                    
                    if ($request->hasFile('id_document_front')) {
                        $mediaService->uploadAndCreateMedia($request->file('id_document_front'), 'clinics/documents', [
                            'mediable_type' => \App\Models\Clinic::class,
                            'mediable_id' => $clinic->id,
                            'collection' => 'id_document_front',
                        ]);
                    }
                    
                    if ($request->hasFile('id_document_back')) {
                        $mediaService->uploadAndCreateMedia($request->file('id_document_back'), 'clinics/documents', [
                            'mediable_type' => \App\Models\Clinic::class,
                            'mediable_id' => $clinic->id,
                            'collection' => 'id_document_back',
                        ]);
                    }
                    
                    // Create operating hours if provided
                    if (isset($data['operating_hours']) && is_array($data['operating_hours'])) {
                        $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        foreach ($data['operating_hours'] as $hour) {
                            if (isset($hour['day_of_week']) && in_array($hour['day_of_week'], $validDays)) {
                                $clinic->operatingHours()->create([
                                    'day_of_week' => $hour['day_of_week'],
                                    'is_open' => $hour['is_open'] ?? false,
                                    'closed_all_day' => $hour['closed_all_day'] ?? false,
                                    'opening_time' => $hour['opening_time'] ?? null,
                                    'closing_time' => $hour['closing_time'] ?? null,
                                ]);
                            }
                        }
                    }
                    
                    // Create subscription if subscription_package_id is provided
                    if (isset($data['subscription_package_id']) && !empty($data['subscription_package_id'])) {
                        $packageId = (int) $data['subscription_package_id'];
                        $package = \App\Models\SubscriptionPackage::find($packageId);
                        
                        if ($package) {
                            $subscription = $this->clinicSubscriptionRepository->create([
                                'clinic_id' => $clinic->id,
                                'subscription_package_id' => $packageId,
                                'amount_paid' => $package->price ?? 0,
                                'currency' => $package->currency ?? 'KWD',
                                'start_date' => now(),
                                'end_date' => now()->addDays($package->duration_days ?? 30),
                                'status' => 'active',
                                'auto_renew' => false,
                            ]);
                            
                            // Link subscription to clinic and refresh the model
                            $clinic->subscription_id = $subscription->id;
                            $clinic->save();
                            $clinic->refresh();
                        }
                    }
                }
            });

            return redirect()->route('dashboard.clinics.index')
                ->with('success', __('common.clinic_created_successfully'));
        } catch (\Exception $e) {
            Log::error('Clinic creation error: ' . $e->getMessage());
            return back()->withErrors(['error' => __('common.failed_to_create_clinic') . ': ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified clinic
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics.show');
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $clinic = Clinic::with([
            'owner:id,name,email,phone,avatar',
            'category:id,name_en,name_ar',
            'governorate:id,name_en,name_ar',
            'area:id,name_en,name_ar',
            'users:id,name,email,phone,avatar',
            'operatingHours',
            'treatments' => function($query) {
                $query->with(['category:id,name_en,name_ar', 'media'])->latest();
            },
            'machines' => function($query) {
                $query->with('media')->latest();
            },
            'bookings' => function($query) {
                $query->with(['user:id,name,email', 'treatment:id,name_en,name_ar'])->latest()->limit(10);
            },
            'subscriptions' => function($query) {
                $query->with(['subscriptionPackage:id,name_en,name_ar'])->latest();
            },
            'activeSubscription.subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days',
            'payouts' => function($query) {
                $query->latest()->limit(10);
            },
            'reviews' => function($query) {
                $query->with(['user:id,name,avatar'])->latest()->limit(10);
            },
            'favorites' => function($query) {
                $query->with(['user:id,name'])->latest()->limit(10);
            },
            'media',
        ])->findOrFail($id);
        
        // Refresh clinic to ensure we have the latest subscription_id
        $clinic->refresh();
        
        // Get documents separately using media relationship
        $documents = [];
        if ($clinic->media) {
            foreach ($clinic->media as $media) {
                if (in_array($media->collection_name, ['business_license', 'id_document_front', 'id_document_back'])) {
                    // Convert file path to full URL
                    $filePath = $media->file_name;
                    if (!str_starts_with($filePath, 'http')) {
                        // Remove 'storage/' prefix if present
                        $filePath = str_replace('storage/', '', $filePath);
                        // Convert to full asset URL
                        $filePath = asset('storage/' . $filePath);
                    }
                    
                    $documents[] = [
                        'id' => $media->id,
                        'file_name' => $media->file_name,
                        'file_url' => $filePath,
                        'collection_name' => $media->collection_name,
                        'disk' => $media->disk,
                        'size' => $media->size,
                        'created_at' => $media->created_at->toISOString(),
                    ];
                }
            }
        }
        
        // Add documents to clinic object for frontend
        $clinic->documents = $documents;
        
        // Ensure logo URL is properly formatted
        if ($clinic->logo && !str_starts_with($clinic->logo, 'http')) {
            // If logo is a storage path, convert to full URL
            $logoPath = str_replace('storage/', '', $clinic->logo);
            $logoPath = str_replace('clinics/logos/', '', $logoPath);
            $clinic->logo = asset('storage/clinics/logos/' . $logoPath);
        }
        
        // Ensure email and phone are explicitly included (they should be, but make sure)
        // Refresh to ensure we have the latest data including email and phone
        $clinic->makeVisible(['email', 'phone']);

        // Get statistics
        $stats = [
            'total_treatments' => $clinic->treatments()->count(),
            'active_treatments' => $clinic->treatments()->where('status', 'approved')->count(),
            'total_machines' => $clinic->machines()->count(),
            'active_machines' => $clinic->machines()->where('status', 'ready')->count(),
            'total_bookings' => $clinic->bookings()->count(),
            'pending_bookings' => $clinic->bookings()->where('status', 'pending')->count(),
            'confirmed_bookings' => $clinic->bookings()->where('status', 'accepted')->count(), // Use 'accepted' to match enum
            'completed_bookings' => $clinic->bookings()->where('status', 'completed')->count(),
            'total_reviews' => $clinic->reviews()->count(),
            'average_rating' => $clinic->reviews()->avg('rating') ?? 0,
            'total_payouts' => (float) ($clinic->payouts()->sum('net_amount') ?? 0),
            'total_staff' => $clinic->users()->count(),
            'active_subscription' => $clinic->activeSubscription ? $clinic->activeSubscription->subscriptionPackage->name_en : null,
        ];

        // Get related data for the view
        $categories = \App\Models\Category::select('id', 'name_en', 'name_ar')->where('status', 'active')->get();
        $governorates = \App\Models\Governorate::select('id', 'name_en', 'name_ar')->where('is_active', true)->get();
        $areas = \App\Models\Area::select('id', 'name_en', 'name_ar', 'governorate_id')->where('is_active', true)->get();
        
        // Get all tab data using repositories
        $operatingHours = $this->clinicOperatingHourRepository->getOperatingHoursByClinic($id);
        $payouts = $this->clinicPayoutRepository->getPayoutsByClinic($id, ['per_page' => 15]);
        // Get all subscriptions (not just active ones) for the clinic view
        $subscriptions = \App\Models\ClinicSubscription::where('clinic_id', $id)
            ->with(['subscriptionPackage:id,name_en,name_ar', 'transaction:id,transaction_id,amount'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Get clinic users (staff/managers)
        $clinicUsers = $clinic->users()->with('roles')->get();
        
        // Get subscription packages for the form
        $subscriptionPackages = \App\Models\SubscriptionPackage::select('id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'currency', 'billing_cycle', 'duration_days', 'features')
            ->where('status', 'active')
            ->get();

        // Ensure activeSubscription is properly loaded and serialized
        // First, try to get the subscription linked via subscription_id
        $activeSubscription = null;
        
        if ($clinic->subscription_id) {
            // Try to load via relationship first
            $clinic->load('activeSubscription.subscriptionPackage');
            
            // If relationship loaded successfully, use it
            if ($clinic->activeSubscription) {
                $activeSubscription = $clinic->activeSubscription;
            } else {
                // Manually fetch the subscription by ID
                // Don't filter by status/end_date when loading via subscription_id since it's the explicit link
                $activeSubscription = \App\Models\ClinicSubscription::with('subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days')
                    ->where('id', $clinic->subscription_id)
                    ->first();
            }
        }
        
        // If not found via subscription_id, get the most recent active subscription
        if (!$activeSubscription) {
            $activeSubscription = \App\Models\ClinicSubscription::where('clinic_id', $id)
                ->where('status', 'active')
                ->where(function($q) {
                    $q->whereNull('end_date')
                      ->orWhere('end_date', '>=', now());
                })
                ->with(['subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days'])
                ->orderBy('end_date', 'desc')
                ->latest()
                ->first();
        }
        
        // Set the activeSubscription on the clinic object
        if ($activeSubscription) {
            // Ensure subscriptionPackage is loaded
            if (!$activeSubscription->relationLoaded('subscriptionPackage')) {
                $activeSubscription->load('subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days');
            }
            $clinic->setRelation('activeSubscription', $activeSubscription);
        } else {
            // Ensure the relationship is cleared if no active subscription exists
            $clinic->setRelation('activeSubscription', null);
        }

        // Get site settings defaults for rescheduling and refund policies
        $siteSettings = [
            'rescheduling_buffer_hours' => SiteSettingsService::getReschedulingBufferHours(),
            'cancellation_buffer_hours' => SiteSettingsService::getCancellationBufferHours(),
            'user_cancellation_penalty_type' => SiteSettingsService::getUserCancellationPenaltyType(),
            'user_cancellation_penalty_value' => SiteSettingsService::getUserCancellationPenaltyValue(),
            'clinic_refund_policy_type' => SiteSettingsService::getClinicRefundPolicyType(),
            'clinic_refund_policy_value' => SiteSettingsService::getClinicRefundPolicyValue(),
            'clinic_refund_policy_percentage' => SiteSettingsService::getClinicRefundPolicyPercentage(),
        ];

        return Inertia::render('dashboard/clinics/show', [
            'clinic' => $clinic,
            'stats' => $stats,
            'categories' => $categories,
            'governorates' => $governorates,
            'areas' => $areas,
            'operatingHours' => $operatingHours,
            'payouts' => $payouts,
            'subscriptions' => $subscriptions,
            'clinicUsers' => $clinicUsers,
            'documents' => $documents,
            'subscriptionPackages' => $subscriptionPackages,
            'siteSettings' => $siteSettings,
        ]);
    }

    /**
     * Show the form for editing the specified clinic
     */
    public function edit(int $id): Response
    {
        Gate::authorize('clinics.edit');
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $clinic = Clinic::with([
            'owner', // Load all owner fields
            'category:id,name_en,name_ar',
            'governorate:id,name_en,name_ar',
            'area:id,name_en,name_ar',
            'users:id,name,email,phone,avatar',
            'operatingHours',
            'treatments' => function($query) {
                $query->with(['category:id,name_en,name_ar'])->latest();
            },
            'machines' => function($query) {
                $query->latest();
            },
            'subscriptions' => function($query) {
                $query->with(['subscriptionPackage:id,name_en,name_ar'])->latest();
            },
            'activeSubscription.subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days',
            'media',
        ])->findOrFail($id);
        
        // Refresh clinic to ensure we have the latest subscription_id
        $clinic->refresh();
        
        // Get documents separately using media relationship
        $documents = [];
        if ($clinic->media) {
            foreach ($clinic->media as $media) {
                if (in_array($media->collection_name, ['business_license', 'id_document_front', 'id_document_back'])) {
                    // Convert file path to full URL
                    $filePath = $media->file_name;
                    if (!str_starts_with($filePath, 'http')) {
                        // Remove 'storage/' prefix if present
                        $filePath = str_replace('storage/', '', $filePath);
                        // Convert to full asset URL
                        $filePath = asset('storage/' . $filePath);
                    }
                    
                    $documents[] = [
                        'id' => $media->id,
                        'file_name' => $media->file_name,
                        'file_url' => $filePath,
                        'collection_name' => $media->collection_name,
                        'disk' => $media->disk,
                        'size' => $media->size,
                        'created_at' => $media->created_at->toISOString(),
                    ];
                }
            }
        }

        // Get related data for dropdowns
        $categories = \App\Models\Category::select('id', 'name_en', 'name_ar')->where('status', 'active')->get();
        $governorates = \App\Models\Governorate::select('id', 'name_en', 'name_ar')->where('is_active', true)->get();
        $areas = \App\Models\Area::select('id', 'name_en', 'name_ar', 'governorate_id')->where('is_active', true)->get();
        $subscriptionPackages = \App\Models\SubscriptionPackage::select('id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'currency', 'billing_cycle', 'duration_days', 'features')
            ->where('status', 'active')
            ->get();
        // Get approved clinic owners for dropdown (only approved clinics)
        $users = $this->getApprovedClinicOwnersForDropdown();
        
        // For clinic managers: Filter to only show the owner of the current clinic
        $authUser = Auth::user();
        if ($authUser && $authUser instanceof \App\Models\User) {
            if ($authUser->hasRole('clinic_manager') && !$authUser->hasRole('super-admin')) {
                // Only show the owner of the current clinic
                if ($clinic->owner_id) {
                    $users = $users->filter(function ($user) use ($clinic) {
                        return $user->id == $clinic->owner_id;
                    })->values();
                } else {
                    $users = collect([]);
                }
            }
        }

        // Get all tab data using repositories
        $operatingHours = $this->clinicOperatingHourRepository->getOperatingHoursByClinic($id);
        $payouts = $this->clinicPayoutRepository->getPayoutsByClinic($id, ['per_page' => 15]);
        $subscriptions = $this->clinicSubscriptionRepository->getActiveSubscriptions($id);
        
        // Ensure activeSubscription is properly loaded - prioritize subscription_id
        $activeSubscription = null;
        
        // First, try to get the subscription linked via subscription_id (this is the definitive link)
        // Don't filter by status/end_date when loading via subscription_id since it's the explicit link
        if ($clinic->subscription_id) {
            $activeSubscription = \App\Models\ClinicSubscription::with(['subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days'])
                ->where('id', $clinic->subscription_id)
                ->first();
        }
        
        // If not found via subscription_id, get the most recent active subscription
        if (!$activeSubscription) {
            $activeSubscription = $subscriptions->first();
        }
        
        // Set the activeSubscription on the clinic object
        if ($activeSubscription) {
            // Ensure subscriptionPackage is loaded with all needed fields if not already loaded
            if (!$activeSubscription->relationLoaded('subscriptionPackage')) {
                $activeSubscription->load(['subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days']);
            }
            // Set the activeSubscription on the clinic object so frontend can access it
            // Use setRelation to ensure it's properly serialized
            $clinic->setRelation('activeSubscription', $activeSubscription);
        } else {
            // Ensure the relationship is cleared if no active subscription exists
            $clinic->setRelation('activeSubscription', null);
        }
        
        // Get clinic users (staff/managers)
        $clinicUsers = $clinic->users()->with('roles')->get();
        
        // Get all users for staff management (excluding the clinic owner to prevent removing them)
        $allUsers = \App\Models\User::select('id', 'name', 'email', 'phone')
            ->where('id', '!=', $clinic->owner_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
        
        // Ensure the owner is included in the users list for the dropdown if they're not already there
        if ($clinic->owner && $clinic->owner_id && !$users->pluck('id')->contains($clinic->owner_id)) {
            // Get owner as a User model instance with only the needed fields
            $ownerUser = \App\Models\User::select('id', 'name', 'email', 'phone')
                ->where('id', $clinic->owner_id)
                ->first();
            
            if ($ownerUser) {
                $users->push($ownerUser);
                // Re-sort after adding owner
                $users = $users->sortBy('name')->values();
            }
        }

        // Get current user for role-based access control
        $authUser = Auth::user();
        $canChangeOwner = false;
        $canChangeStatus = false;
        $isReadOnlyOwner = false;
        
        if ($authUser && $authUser instanceof \App\Models\User) {
            /** @var \App\Models\User $user */
            $user = $authUser;
            // Super admin can change owner and status
            if ($user->hasRole('super-admin')) {
                $canChangeOwner = true;
                $canChangeStatus = true;
            }
            // Clinic role: cannot change owner, readonly
            if ($user->hasRole('clinic') && !$user->hasRole('super-admin')) {
                $isReadOnlyOwner = true;
            }
            // Clinic manager: cannot change owner, readonly
            if ($user->hasRole('clinic_manager') && !$user->hasRole('super-admin')) {
                $isReadOnlyOwner = true;
            }
        }
        
        // Ensure logo URL is properly formatted for edit page
        if ($clinic->logo && !str_starts_with($clinic->logo, 'http')) {
            // If logo is a storage path, convert to full URL
            $logoPath = str_replace('storage/', '', $clinic->logo);
            $logoPath = str_replace('clinics/logos/', '', $logoPath);
            $clinic->logo = asset('storage/clinics/logos/' . $logoPath);
        }
        
        // Ensure email and phone are explicitly included (they should be, but make sure)
        $clinic->makeVisible(['email', 'phone']);

        // Ensure activeSubscription is available on the clinic object for frontend
        // If the relationship didn't load, manually set it from the subscriptions collection
        if (!$clinic->relationLoaded('activeSubscription') || !$clinic->activeSubscription) {
            if ($activeSubscription) {
                $clinic->setRelation('activeSubscription', $activeSubscription);
            }
        }

        // Get site settings defaults for rescheduling and refund policies
        // Also include Google Maps API key for address autocomplete
        $siteSettings = [
            'rescheduling_buffer_hours' => SiteSettingsService::getReschedulingBufferHours(),
            'cancellation_buffer_hours' => SiteSettingsService::getCancellationBufferHours(),
            'user_cancellation_penalty_type' => SiteSettingsService::getUserCancellationPenaltyType(),
            'user_cancellation_penalty_value' => SiteSettingsService::getUserCancellationPenaltyValue(),
            'user_cancellation_platform_charge_percentage' => SiteSettingsService::getUserCancellationPlatformChargePercentage(),
            'clinic_refund_policy_type' => SiteSettingsService::getClinicRefundPolicyType(),
            'clinic_refund_policy_value' => SiteSettingsService::getClinicRefundPolicyValue(),
            'clinic_refund_policy_percentage' => SiteSettingsService::getClinicRefundPolicyPercentage(),
            'google_maps_api_key' => SiteSettingsService::getGoogleMapsApiKey(),
        ];

        return Inertia::render('dashboard/clinics/edit', [
            'clinic' => $clinic,
            'categories' => $categories,
            'governorates' => $governorates,
            'areas' => $areas,
            'subscriptionPackages' => $subscriptionPackages,
            'users' => $users,
            'operatingHours' => $operatingHours,
            'payouts' => $payouts,
            'subscriptions' => $subscriptions,
            'clinicUsers' => $clinicUsers,
            'allUsers' => $allUsers,
            'canChangeOwner' => $canChangeOwner,
            'canChangeStatus' => $canChangeStatus,
            'isReadOnlyOwner' => $isReadOnlyOwner,
            'currentUser' => $authUser ? [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'email' => $authUser->email,
                'roles' => $authUser->roles->pluck('name')->toArray(),
            ] : null,
            'clinicOwnerId' => $clinic->owner_id, // For clinic_manager role to know the owner
            'documents' => $documents,
            'siteSettings' => $siteSettings,
        ]);
    }

    /**
     * Update the specified clinic in storage
     */
    public function update(ClinicUpdateRequest $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.edit');
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $clinic = $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // Get the clinic first
            $clinic = $this->clinicRepository->findOrFail($id);
            
            // Map company_name to name for backward compatibility
            if (isset($data['company_name_en']) && !isset($data['name_en'])) {
                $data['name_en'] = $data['company_name_en'];
            }
            if (isset($data['company_name_ar']) && !isset($data['name_ar'])) {
                $data['name_ar'] = $data['company_name_ar'];
            }
            
            // Check if status is being changed
            $oldStatus = $clinic->status;
            $newStatus = $data['status'] ?? $oldStatus;
            $statusChanged = $oldStatus !== $newStatus && in_array($newStatus, ['approved', 'rejected', 'suspended']);
            
            // Handle owner_id and restricted fields based on user role
            $authUser = Auth::user();
            if ($authUser && $authUser instanceof \App\Models\User) {
                /** @var \App\Models\User $user */
                $user = $authUser;
                // For clinic role, don't allow changing owner or featured status
                if ($user->hasRole('clinic') && !$user->hasRole('super-admin')) {
                    unset($data['owner_id']);
                    unset($data['is_featured']);
                }
                // For clinic manager, don't allow changing owner or featured status
                if ($user->hasRole('clinic_manager') && !$user->hasRole('super-admin')) {
                    unset($data['owner_id']);
                    unset($data['is_featured']);
                }
            }
            
            // Handle user information update
            // Check if current user is clinic or clinic_manager role (cannot edit owner info or admin_commission)
            $canEditOwnerInfo = true;
            if ($authUser && $authUser instanceof \App\Models\User) {
                /** @var \App\Models\User $user */
                $user = $authUser;
                $isClinicRole = $user->hasRole('clinic') && !$user->hasRole('super-admin');
                $isClinicManagerRole = $user->hasRole('clinic_manager') && !$user->hasRole('super-admin');
                $canEditOwnerInfo = !$isClinicRole && !$isClinicManagerRole;
            }
            
            $ownerId = $data['owner_id'] ?? $clinic->owner_id;
            if ($ownerId && $canEditOwnerInfo) {
                $owner = User::find($ownerId);
                if ($owner) {
                    $userUpdateData = [];
                    if ($request->has('user_name')) {
                        $userUpdateData['name'] = $request->input('user_name');
                    }
                    if ($request->has('user_email')) {
                        $userUpdateData['email'] = $request->input('user_email');
                    }
                    if ($request->has('user_phone')) {
                        $userUpdateData['phone'] = $request->input('user_phone');
                    }
                    if ($request->filled('password')) {
                        $userUpdateData['password'] = Hash::make($request->input('password'));
                        // Revoke existing tokens if password changed (security)
                        $owner->tokens()->delete();
                    }
                    // Only update admin_commission if user has permission (not clinic or clinic_manager)
                    if ($request->exists('admin_commission')) {
                        $adminCommission = $request->input('admin_commission');
                        // Handle empty string as null, otherwise convert to float
                        $userUpdateData['admin_commission'] = ($adminCommission === '' || $adminCommission === null) ? null : (float) $adminCommission;
                    }
                    if (!empty($userUpdateData)) {
                        $owner->update($userUpdateData);
                        // Refresh the owner relationship on the clinic
                        $clinic->load('owner');
                    }
                }
            }
            
            // Handle file uploads using MediaService
            $logo = $request->file('logo');
            $businessLicense = $request->file('business_license');
            $idDocumentFront = $request->file('id_document_front');
            $idDocumentBack = $request->file('id_document_back');
            unset($data['logo'], $data['business_license'], $data['id_document_front'], $data['id_document_back'], $data['business_license_path'], $data['id_document_front_path'], $data['id_document_back_path']);
            
            // Handle operating hours before updating clinic
            if ($request->has('operating_hours')) {
                $clinic = Clinic::findOrFail($id);
                $clinic->operatingHours()->delete();
                
                // Valid day names for ENUM column
                $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                
                foreach ($request->input('operating_hours', []) as $hour) {
                    // Use day name directly (ENUM expects string, not number)
                    $dayOfWeek = in_array($hour['day_of_week'], $validDays) 
                        ? $hour['day_of_week'] 
                        : 'monday'; // Default fallback
                    
                    $clinic->operatingHours()->create([
                        'day_of_week' => $dayOfWeek,
                        'is_open' => $hour['is_open'] ?? false,
                        'closed_all_day' => $hour['closed_all_day'] ?? false,
                        'opening_time' => $hour['opening_time'] ?? null,
                        'closing_time' => $hour['closing_time'] ?? null,
                    ]);
                }
            }
            
            // Handle subscription package update
            if ($request->has('subscription_package_id') && $request->input('subscription_package_id')) {
                $newPackageId = (int) $request->input('subscription_package_id');
                
                // Get the active subscription for this clinic
                $activeSubscription = $this->clinicSubscriptionRepository
                    ->getActiveSubscriptions($id)
                    ->first();
                
                if ($activeSubscription) {
                    // Only update if the package is different
                    if ($activeSubscription->subscription_package_id != $newPackageId) {
                        $activeSubscription->update([
                            'subscription_package_id' => $newPackageId
                        ]);
                    }
                } else {
                    // If no active subscription exists, create a new one
                    // Get the package to determine duration and pricing
                    $package = \App\Models\SubscriptionPackage::find($newPackageId);
                    if ($package) {
                        $startDate = now();
                        $endDate = $startDate->copy()->addDays($package->duration_days ?? 30);
                        
                        $subscription = $this->clinicSubscriptionRepository->create([
                            'clinic_id' => $id,
                            'subscription_package_id' => $newPackageId,
                            'status' => 'active',
                            'start_date' => $startDate,
                            'end_date' => $endDate,
                            'currency' => $package->currency ?? 'KWD',
                            'amount_paid' => $package->price ?? 0,
                        ]);
                        
                        // Link the new subscription to the clinic
                        $clinic = $this->clinicRepository->find($id);
                        if ($clinic && $subscription) {
                            $clinic->subscription_id = $subscription->id;
                            $clinic->save();
                        }
                    }
                }
                
                // Remove subscription_package_id from $data so it doesn't try to save it on the clinic model
                unset($data['subscription_package_id']);
            }
            
            $clinic = $this->clinicRepository->update($id, $data);
            
            $mediaService = app(\App\Services\MediaService::class);
            
            if ($logo) {
                // Delete old logo media
                $clinic->media()->where('collection_name', 'logos')->delete();
                
                $media = $mediaService->uploadAndCreateMedia($logo, 'clinics/logos', [
                    'mediable_type' => \App\Models\Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection' => 'logos',
                ]);
                
                // Save full URL to clinic's logo column
                if ($media) {
                    // Refresh media to ensure we have the latest data
                    $media->refresh();
                    
                    // Use url accessor or file_name, ensuring it's a full URL
                    $logoUrl = $media->url ?? $media->file_name;
                    
                    // If it's not a full URL, convert it using Storage or asset
                    if ($logoUrl && !str_starts_with($logoUrl, 'http')) {
                        // If it's a storage path, convert to full URL
                        if (str_contains($logoUrl, 'clinics/logos/')) {
                            $logoUrl = asset('storage/' . ltrim($logoUrl, '/'));
                        } else {
                            // Try using asset() as fallback
                            if (!empty($logoUrl)) {
                                $logoUrl = asset('storage/' . ltrim($logoUrl, '/'));
                            }
                        }
                    }
                    
                    if ($logoUrl) {
                        $clinic->update(['logo' => $logoUrl]);
                    }
                }
            }
            
            if ($businessLicense) {
                // Delete old business license media
                $clinic->media()->where('collection_name', 'business_license')->delete();
                
                $mediaService->uploadAndCreateMedia($businessLicense, 'clinics/documents', [
                    'mediable_type' => \App\Models\Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection' => 'business_license',
                ]);
            }
            
            if ($idDocumentFront) {
                // Delete old ID document front media
                $clinic->media()->where('collection_name', 'id_document_front')->delete();
                
                $mediaService->uploadAndCreateMedia($idDocumentFront, 'clinics/documents', [
                    'mediable_type' => \App\Models\Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection' => 'id_document_front',
                ]);
            }
            
            if ($idDocumentBack) {
                // Delete old ID document back media
                $clinic->media()->where('collection_name', 'id_document_back')->delete();
                
                $mediaService->uploadAndCreateMedia($idDocumentBack, 'clinics/documents', [
                    'mediable_type' => \App\Models\Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection' => 'id_document_back',
                ]);
            }
            
            // Send notification if status changed
            if ($statusChanged && $clinic->owner) {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyClinicStatusChanged($clinic, $oldStatus, $newStatus);
            }

            return $clinic;
        });

        return redirect()->route('dashboard.clinics.edit', $id)
            ->with('success', __('common.clinic_updated_successfully'));
    }

    /**
     * Remove the specified clinic from storage
     */
    public function destroy(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.destroy');
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $this->withTransaction(function () use ($request, $id) {
            $this->clinicRepository->delete($id);
        });

        return redirect()->route('dashboard.clinics.index')
            ->with('success', __('common.clinic_deleted_successfully'));
    }

    /**
     * Approve clinic
     * Only users with clinics.approve permission can approve clinics
     */
    public function approve(Request $request, Clinic $clinic): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.approve');
        
        try {
            $this->withTransaction(function () use ($request, $clinic) {
                $clinic->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'rejection_reason' => null,
                ]);
                // Notification is handled by Clinic model event
            });

            return redirect()->route('dashboard.clinics.index', [
                'tab' => 'approved'
            ])->with('success', __('common.clinic_approved_successfully'));
        } catch (\Exception $e) {
            Log::error('Approve clinic error: ' . $e->getMessage());
            return back()->with('error', __('common.failed_to_approve_clinic'));
        }
    }

    /**
     * Reject clinic
     * Only users with clinics.reject permission can reject clinics
     */
    public function reject(Request $request, Clinic $clinic): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.reject');
        
        try {
            $request->validate([
                'rejection_reason' => ['required', 'string', 'max:500'],
            ]);

            $this->withTransaction(function () use ($request, $clinic) {
                $reason = $request->input('rejection_reason');
                $clinic->update([
                    'status' => 'rejected',
                    'rejection_reason' => $reason,
                ]);
                // Notification is handled by Clinic model event
            });

            return redirect()->route('dashboard.clinics.index', [
                'tab' => 'rejected'
            ])->with('success', __('common.clinic_rejected_successfully'));
        } catch (\Exception $e) {
            Log::error('Reject clinic error: ' . $e->getMessage());
            return back()->with('error', __('common.failed_to_reject_clinic'));
        }
    }

    /**
     * Toggle featured status
     */
    public function toggleFeatured(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.toggle-featured');
        
        // Check if user can access this clinic (for clinic/clinic_manager roles)
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $request->validate([
            'is_featured' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $isFeatured = $request->input('is_featured');
            
            $this->clinicRepository->update($id, [
                'is_featured' => $isFeatured,
            ]);
        });

        return back()->with('success', __('common.clinic_updated_successfully'));
    }

    /**
     * Toggle auto confirm bookings
     */
    public function toggleAutoConfirm(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.toggle-auto-confirm');
        
        // Check if user can access this clinic (for clinic/clinic_manager roles)
        if (!$this->canAccessClinic($id)) {
            abort(403, __('common.no_access_to_clinic'));
        }
        
        $request->validate([
            'auto_confirm_bookings' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $autoConfirm = $request->input('auto_confirm_bookings');
            
            $this->clinicRepository->update($id, [
                'auto_confirm_bookings' => $autoConfirm,
            ]);
        });

        return back()->with('success', __('common.clinic_updated_successfully'));
    }

    /**
     * Update clinic office hours
     */
    public function updateOfficeHours(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.update-office-hours');
        
        $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        $request->validate([
            'operating_hours' => ['required', 'array'],
            'operating_hours.*.day_of_week' => ['required', 'string', 'in:' . implode(',', $validDays)],
            'operating_hours.*.is_open' => ['required', 'boolean'],
            'operating_hours.*.closed_all_day' => ['nullable', 'boolean'],
            'operating_hours.*.opening_time' => ['nullable', 'date_format:H:i', 'required_if:operating_hours.*.is_open,1'],
            'operating_hours.*.closing_time' => ['nullable', 'date_format:H:i', 'after:operating_hours.*.opening_time', 'required_if:operating_hours.*.is_open,1'],
        ]);

        $this->withTransaction(function () use ($request, $id, $validDays) {
            $clinic = Clinic::findOrFail($id);
            
            // Delete existing operating hours
            $clinic->operatingHours()->delete();
            
            // Create new operating hours
            foreach ($request->input('operating_hours', []) as $hour) {
                // Ensure day_of_week is a valid ENUM value
                $dayOfWeek = in_array($hour['day_of_week'], $validDays) 
                    ? $hour['day_of_week'] 
                    : 'monday'; // Default fallback
                
                $clinic->operatingHours()->create([
                    'day_of_week' => $dayOfWeek,
                    'is_open' => $hour['is_open'] ?? false,
                    'closed_all_day' => $hour['closed_all_day'] ?? false,
                    'opening_time' => $hour['opening_time'] ?? null,
                    'closing_time' => $hour['closing_time'] ?? null,
                ]);
            }
        });

        return back()->with('success', __('common.clinic_office_hours_updated_successfully'));
    }

    /**
     * Update clinic users (staff/managers)
     */
    public function updateUsers(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('clinics.edit');
        
        $request->validate([
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $clinic = Clinic::findOrFail($id);
            
            // Sync clinic users
            $clinic->users()->sync($request->input('user_ids', []));
        });

        return back()->with('success', __('common.clinic_users_updated_successfully'));
    }

    /**
     * Get clinic bookings
     */
    public function bookings(Request $request, int $id): Response
    {
        Gate::authorize('clinics.show');
        
        $perPage = $request->get('per_page', 15);
        $clinic = Clinic::findOrFail($id);
        
        $bookings = $clinic->bookings()
            ->with(['user:id,name,email', 'treatment:id,name_en,name_ar', 'machine:id,serial_number'])
            ->latest()
            ->paginate($perPage);

        return Inertia::render('dashboard/clinics/bookings', [
            'clinic' => $clinic->load('owner:id,name,email'),
            'bookings' => $bookings,
        ]);
    }

    /**
     * Get clinic payouts
     */
    public function payouts(Request $request, int $id): Response
    {
        Gate::authorize('clinics.show');
        
        $perPage = $request->get('per_page', 15);
        $clinic = Clinic::findOrFail($id);
        
        $payouts = $clinic->payouts()
            ->with(['earnings', 'processor:id,name,email'])
            ->latest()
            ->paginate($perPage);

        return Inertia::render('dashboard/clinics/payouts', [
            'clinic' => $clinic->load('owner:id,name,email'),
            'payouts' => $payouts,
        ]);
    }

    /**
     * Get clinic subscriptions
     */
    public function subscriptions(Request $request, int $id): Response
    {
        Gate::authorize('clinics.show');
        
        $perPage = $request->get('per_page', 15);
        $clinic = Clinic::findOrFail($id);
        
        $subscriptions = $clinic->subscriptions()
            ->with(['subscriptionPackage:id,name_en,name_ar', 'transaction:id,transaction_id,amount'])
            ->latest()
            ->paginate($perPage);

        return Inertia::render('dashboard/clinics/subscriptions', [
            'clinic' => $clinic->load('owner:id,name,email'),
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Check if current user can approve/reject clinics
     * Only super-admin or users with clinics.approve/reject permissions
     */
    private function canApproveRejectClinics(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !($user instanceof \App\Models\User)) {
            return false;
        }
        
        // Check if user has either approve or reject permission
        return $user->can('clinics.approve') || $user->can('clinics.reject');
    }

    /**
     * Check if current user can toggle owner status
     * Only users with clinics.toggle-owner-status permission
     */
    private function canToggleOwnerStatus(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !($user instanceof \App\Models\User)) {
            return false;
        }
        
        return $user->can('clinics.toggle-owner-status');
    }
}
