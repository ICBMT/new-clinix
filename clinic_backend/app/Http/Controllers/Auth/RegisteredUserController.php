<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\ClinicSubscriptionRepositoryInterface;
use App\Contracts\ClinicOperatingHourRepositoryInterface;
use App\Contracts\GovernorateRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\MediaRepositoryInterface;
use App\Contracts\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\Clinic;
use App\Models\ClinicOperatingHour;
use App\Models\SubscriptionPackage;
use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use App\Rules\KuwaitPhone;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        private readonly ClinicSubscriptionRepositoryInterface $clinicSubscriptionRepository,
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly ClinicOperatingHourRepositoryInterface $clinicOperatingHourRepository,
        private readonly GovernorateRepositoryInterface $governorateRepository,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly MediaRepositoryInterface $mediaRepository,
        private readonly UserRepositoryInterface $userRepository
    ) {}
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        // Get active governorates for dropdowns using repository
        // Use findBy with a high limit to get all active governorates
        // Note: Governorate uses 'is_active' (boolean), not 'status'
        $governoratesCollection = $this->governorateRepository->findBy(['is_active' => true], 1000);
        $governorates = collect($governoratesCollection)
            ->sortBy('name_en')
            ->values()
            ->map(fn($item) => [
                'id' => $item->id,
                'name_en' => $item->name_en,
                'name_ar' => $item->name_ar,
            ]);
        
        // Get active categories for dropdowns using repository
        $categoriesCollection = $this->categoryRepository->findBy(['status' => 'active'], 1000);
        $categories = collect($categoriesCollection)
            ->sortBy('name_en')
            ->values()
            ->map(fn($item) => [
                'id' => $item->id,
                'name_en' => $item->name_en,
                'name_ar' => $item->name_ar,
            ]);

        // Get active subscription packages (using model relationship - no repository exists)
        $subscriptionPackages = SubscriptionPackage::active()
            ->ordered()
            ->get(['id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'currency', 'billing_cycle', 'duration_days', 'features']);

        return Inertia::render('auth/register', [
            'governorates' => $governorates,
            'categories' => $categories,
            'subscriptionPackages' => $subscriptionPackages,
        ]);
    }


    /**
     * Check if clinic email is unique (legacy endpoint for backward compatibility)
     */
    public function checkClinicEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $exists = $this->clinicRepository->exists(['email' => $request->email]);

        return response()->json([
            'available' => !$exists,
            'message' => $exists ? __('common.clinic_email_already_taken') : __('common.email_available'),
        ]);
    }

    /**
     * Check if user email is available
     */
    public function checkUserEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $exists = $this->userRepository->exists(['email' => $request->email]);

        return response()->json([
            'available' => !$exists,
            'message' => $exists ? __('common.email_already_taken') : __('common.email_available'),
        ]);
    }

    /**
     * Check if user phone is available
     */
    public function checkUserPhone(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $exists = $this->userRepository->exists(['phone' => $request->phone]);

        return response()->json([
            'available' => !$exists,
            'message' => $exists ? __('common.phone_already_taken') : __('common.phone_available'),
        ]);
    }

    /**
     * Validate a specific step of registration
     * This is called from store() when 'step' parameter is present
     */
    protected function validateStep(Request $request)
    {
        // Transform nested clinic fields to flat structure for RegisterRequest
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
        
        // Get the step first
        $step = (int) $validationRequest->input('step', 1);
        
        // Use RegisterRequest to get validation rules and messages
        $registerRequest = RegisterRequest::createFrom($validationRequest);
        $registerRequest->setContainer(app());
        
        // Get validation rules and messages for this step
        $rules = $registerRequest->rules();
        $messages = $registerRequest->messages();
        
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
                // Check if user email exists (only if email passed basic validation and format checks)
                $email = $registerRequest->input('email');
                if ($email && !isset($errors['email'])) {
                    $emailExists = $this->userRepository->exists(['email' => $email]);
                    if ($emailExists) {
                        $errors['email'] = [__('common.email_already_taken')];
                    }
                }

                // Check if user phone exists (only if phone passed basic validation and format checks)
                $phone = $registerRequest->input('phone');
                if ($phone && !isset($errors['phone'])) {
                    $phoneExists = $this->userRepository->exists(['phone' => $phone]);
                    if ($phoneExists) {
                        $errors['phone'] = [__('common.phone_already_taken')];
                    }
                }
                break;

            case 2:
                // Check if clinic name_en exists
                if ($registerRequest->filled('name_en')) {
                    $nameEnExists = $this->clinicRepository->exists(['name_en' => $registerRequest->name_en]);
                    if ($nameEnExists) {
                        $errors['name_en'] = [__('common.clinic_name_en_already_taken')];
                    }
                }

                // Check if clinic name_ar exists
                if ($registerRequest->filled('name_ar')) {
                    $nameArExists = $this->clinicRepository->exists(['name_ar' => $registerRequest->name_ar]);
                    if ($nameArExists) {
                        $errors['name_ar'] = [__('common.clinic_name_ar_already_taken')];
                    }
                }
                
                // Check if clinic email exists (if provided)
                if ($registerRequest->filled('email')) {
                    $emailExists = $this->clinicRepository->exists(['email' => $registerRequest->email]);
                    if ($emailExists) {
                        $errors['email'] = [__('common.clinic_email_already_taken')];
                    }
                }

                // Check if clinic phone exists
                if ($registerRequest->filled('phone')) {
                    $phoneExists = $this->clinicRepository->exists(['phone' => $registerRequest->phone]);
                    if ($phoneExists) {
                        $errors['phone'] = [__('common.clinic_phone_already_taken')];
                    }
                }
                break;

            case 5:
                // Validate that closing_time is after opening_time for each day
                if ($registerRequest->has('operating_hours') && is_array($registerRequest->operating_hours)) {
                    foreach ($registerRequest->operating_hours as $index => $hours) {
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
     * Handle an incoming clinic registration request.
     * User can create only ONE clinic during registration.
     * Also handles step-by-step validation when 'step' parameter is provided.
     *
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        // Check if this is a validation-only request
        if ($request->has('step')) {
            return $this->validateStep($request);
        }

        // Proceed with full registration
        $validated = $request->validate([
            // User fields
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'phone' => ['required', 'string', new KuwaitPhone(), 'unique:users,phone'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            
            // Clinic basic information
            'clinic.name_en' => ['required', 'string', 'max:255', new EnglishOnly(), 'unique:clinics,name_en'],
            'clinic.name_ar' => ['required', 'string', 'max:255', new ArabicOnly(), 'unique:clinics,name_ar'],
            'clinic.bio_en' => ['nullable', 'string', 'max:5000', new EnglishOnly()],
            'clinic.bio_ar' => ['nullable', 'string', 'max:5000', new ArabicOnly()],
            'clinic.phone' => ['required', 'string', new KuwaitPhone(), 'unique:clinics,phone'],
            'clinic.email' => ['nullable', 'email', 'max:255', 'unique:clinics,email'],
            'clinic.category_id' => ['nullable', 'integer', 'exists:categories,id'],
            
            // Clinic address fields
            'clinic.governorate_id' => ['nullable', 'integer', 'exists:governorates,id'],
            'clinic.area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'clinic.address' => ['nullable', 'string', 'min:3', 'max:500'],
            'clinic.block' => ['nullable', 'string', 'max:50'],
            'clinic.street' => ['nullable', 'string', 'max:100'],
            'clinic.avenue' => ['nullable', 'string', 'max:100'],
            'clinic.house' => ['nullable', 'string', 'max:50'],
            'clinic.floor' => ['nullable', 'string', 'max:50'],
            'clinic.apt' => ['nullable', 'string', 'max:50'],
            'clinic.city' => ['nullable', 'string', 'max:100'],
            'clinic.state' => ['nullable', 'string', 'max:100'],
            'clinic.country' => ['nullable', 'string', 'max:100'],
            'clinic.postal_code' => ['nullable', 'string', 'max:20'],
            'clinic.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'clinic.longitude' => ['nullable', 'numeric', 'between:-180,180'],
            
            // Clinic settings
            'clinic.auto_confirm_bookings' => ['nullable', 'boolean'],
            'clinic.new_booking_alerts' => ['nullable', 'boolean'],
            'clinic.cancellation_alerts' => ['nullable', 'boolean'],
            'clinic.review_alerts' => ['nullable', 'boolean'],
            'clinic.email_notifications_enabled' => ['nullable', 'boolean'],
            'clinic.notification_email' => ['nullable', 'email', 'max:255'],
            'clinic.cancellation_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'clinic.cancellation_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'clinic.privacy_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'clinic.privacy_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'clinic.terms_and_conditions_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'clinic.terms_and_conditions_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'clinic.refund_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'clinic.refund_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'clinic.reschedule_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'clinic.reschedule_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            
            // Documents (10MB = 10240KB to match UI message)
            'clinic.logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:10240'],
            'clinic.business_license' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'clinic.id_document_front' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'clinic.id_document_back' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            
            // Operating hours
            'clinic.operating_hours' => ['required', 'array', 'size:7'],
            'clinic.operating_hours.*.day_of_week' => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'clinic.operating_hours.*.is_open' => ['nullable', 'boolean'],
            'clinic.operating_hours.*.closed_all_day' => ['nullable', 'boolean'],
            'clinic.operating_hours.*.opening_time' => ['nullable', 'date_format:H:i'],
            'clinic.operating_hours.*.closing_time' => ['nullable', 'date_format:H:i', 'after:clinic.operating_hours.*.opening_time'],
            
            // Subscription package
            'clinic.subscription_package_id' => ['nullable', 'integer', 'exists:subscription_packages,id'],
        ], [
            // User field messages
            'name.required' => __('common.name_required'),
            'name.max' => __('common.name_too_long'),
            'email.required' => __('common.auth_email_required'),
            'email.email' => __('common.auth_email_invalid'),
            'email.unique' => __('common.email_already_taken'),
            'email.max' => __('common.email_too_long'),
            'phone.required' => __('common.auth_phone_required'),
            'phone.unique' => __('common.phone_already_taken'),
            'password.required' => __('common.auth_password_required'),
            'password.confirmed' => __('common.passwords_do_not_match'),
            // Clinic field messages
            'clinic.name_en.required' => __('common.clinic_name_en_required'),
            'clinic.name_en.max' => __('common.clinic_name_en_max'),
            'clinic.name_en.unique' => __('common.clinic_name_en_already_taken'),
            'clinic.name_en.english_only' => __('common.clinic_name_en_must_be_english'),
            'clinic.name_ar.required' => __('common.clinic_name_ar_required'),
            'clinic.name_ar.max' => __('common.clinic_name_ar_max'),
            'clinic.name_ar.unique' => __('common.clinic_name_ar_already_taken'),
            'clinic.name_ar.arabic_only' => __('common.clinic_name_ar_must_be_arabic'),
            'clinic.phone.required' => __('common.clinic_phone_invalid_format'),
            'clinic.phone.unique' => __('common.clinic_phone_already_taken'),
            'clinic.email.email' => __('common.auth_email_invalid'),
            'clinic.email.max' => __('common.email_too_long'),
            'clinic.email.unique' => __('common.clinic_email_already_taken'),
            'clinic.category_id.exists' => __('common.category_not_found'),
            'clinic.governorate_id.exists' => __('common.governorate_not_found'),
            'clinic.area_id.exists' => __('common.area_not_found'),
            'clinic.business_license.required' => __('common.business_license_required'),
            'clinic.business_license.file' => __('common.file_must_be_file'),
            'clinic.business_license.mimes' => __('common.file_invalid_format'),
            'clinic.business_license.max' => __('common.file_size_exceeds_max'),
            'clinic.id_document_front.required' => __('common.id_document_front_required'),
            'clinic.id_document_front.file' => __('common.file_must_be_file'),
            'clinic.id_document_front.mimes' => __('common.file_invalid_format'),
            'clinic.id_document_front.max' => __('common.file_size_exceeds_max'),
            'clinic.id_document_back.file' => __('common.file_must_be_file'),
            'clinic.id_document_back.mimes' => __('common.file_invalid_format'),
            'clinic.id_document_back.max' => __('common.file_size_exceeds_max'),
            'clinic.logo.image' => __('common.logo_must_be_image'),
            'clinic.logo.mimes' => __('common.logo_invalid_format'),
            'clinic.logo.max' => __('common.logo_size_exceeded'),
            'clinic.operating_hours.required' => __('common.operating_hours_required'),
            'clinic.operating_hours.array' => __('common.operating_hours_must_be_array'),
            'clinic.operating_hours.size' => __('common.operating_hours_must_have_7_days'),
            // Address field validation messages
            'clinic.address.min' => __('common.address_must_be_at_least_3_characters'),
            'clinic.address.max' => __('common.address_must_not_exceed_500_characters'),
            'clinic.block.max' => __('common.clinic_block_max_length', ['max' => 50]),
            'clinic.street.max' => __('common.clinic_street_max_length', ['max' => 100]),
            'clinic.avenue.max' => __('common.clinic_avenue_max_length', ['max' => 100]),
            'clinic.house.max' => __('common.clinic_house_max_length', ['max' => 50]),
            'clinic.floor.max' => __('common.clinic_floor_max_length', ['max' => 50]),
            'clinic.apt.max' => __('common.clinic_apt_max_length', ['max' => 50]),
            'clinic.city.max' => __('common.clinic_city_max_length', ['max' => 100]),
            'clinic.state.max' => __('common.clinic_state_max_length', ['max' => 100]),
            'clinic.postal_code.max' => __('common.clinic_postal_code_max_length', ['max' => 20]),
            'clinic.latitude.between' => __('common.latitude_invalid'),
            'clinic.longitude.between' => __('common.longitude_invalid'),
        ], [
            // Custom attributes for better error messages
            'name' => __('common.full_name'),
            'email' => __('common.email'),
            'phone' => __('common.phone_number'),
            'password' => __('common.password'),
            'clinic.name_en' => __('common.clinic_name_en'),
            'clinic.name_ar' => __('common.clinic_name_ar'),
            'clinic.phone' => __('common.clinic_phone'),
            'clinic.email' => __('common.clinic_email'),
            'clinic.bio_en' => __('common.bio_en'),
            'clinic.bio_ar' => __('common.bio_ar'),
            'clinic.category_id' => __('common.category'),
            'clinic.governorate_id' => __('common.governorate'),
            'clinic.area_id' => __('common.area'),
            'clinic.address' => __('common.address'),
            'clinic.block' => __('common.block'),
            'clinic.street' => __('common.street'),
            'clinic.avenue' => __('common.avenue'),
            'clinic.house' => __('common.house'),
            'clinic.floor' => __('common.floor'),
            'clinic.apt' => __('common.apartment'),
            'clinic.city' => __('common.city'),
            'clinic.state' => __('common.state'),
            'clinic.country' => __('common.country'),
            'clinic.postal_code' => __('common.postal_code'),
            'clinic.latitude' => __('common.latitude'),
            'clinic.longitude' => __('common.longitude'),
            'clinic.business_license' => __('common.business_license'),
            'clinic.id_document_front' => __('common.id_document_front'),
            'clinic.id_document_back' => __('common.id_document_back'),
            'clinic.logo' => __('common.logo'),
            'clinic.operating_hours' => __('common.operating_hours'),
        ]);

        return $this->withTransaction(function () use ($request, $validated) {
            // Check if user with this email already exists (double-check before creation)
            $existingUser = $this->userRepository->findBy(['email' => $validated['email']]);
            if ($existingUser) {
                return back()->withErrors([
                    'email' => __('common.auth_email_unique')
                ])->withInput();
            }
            
            // Check if user with this phone already exists
            if (!empty($validated['phone'])) {
                $existingUserByPhone = $this->userRepository->findBy(['phone' => $validated['phone']]);
                if ($existingUserByPhone) {
                    return back()->withErrors([
                        'phone' => __('common.auth_phone_unique')
                    ])->withInput();
                }
            }
            
            // Create user using repository
            try {
                $user = $this->userRepository->create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'password' => $validated['password'],
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
                            return back()->withErrors([
                                'email' => __('common.auth_email_unique')
                            ])->withInput();
                        } elseif (str_contains($errorMessage, 'phone')) {
                            return back()->withErrors([
                                'phone' => __('common.auth_phone_unique')
                            ])->withInput();
                        }
                    }
                }
                // Re-throw if not a duplicate entry error
                throw $e;
            }

            // Assign clinic role
            $user->assignRole('clinic');

            // Prepare clinic data
            $clinicData = $validated['clinic'];
            
            // Handle file uploads
            $logoPath = null;
            $businessLicensePath = null;
            $idDocumentFrontPath = null;
            $idDocumentBackPath = null;
            
            if ($request->hasFile('clinic.logo')) {
                $logoPath = $request->file('clinic.logo')->store('clinics/logos', 'public');
                // Convert path to full URL
                $clinicData['logo'] = asset('storage/' . $logoPath);
            }
            
            if ($request->hasFile('clinic.business_license')) {
                $businessLicensePath = $request->file('clinic.business_license')->store('clinics/documents', 'public');
                // Convert path to full URL
                $businessLicensePath = asset('storage/' . $businessLicensePath);
            }
            
            if ($request->hasFile('clinic.id_document_front')) {
                $idDocumentFrontPath = $request->file('clinic.id_document_front')->store('clinics/documents', 'public');
                // Convert path to full URL
                $idDocumentFrontPath = asset('storage/' . $idDocumentFrontPath);
            }
            
            if ($request->hasFile('clinic.id_document_back')) {
                $idDocumentBackPath = $request->file('clinic.id_document_back')->store('clinics/documents', 'public');
                // Convert path to full URL
                $idDocumentBackPath = asset('storage/' . $idDocumentBackPath);
            }

            // Set default values
            $clinicData['owner_id'] = $user->id;
            $clinicData['status'] = 'pending';
            $clinicData['country'] = $clinicData['country'] ?? 'Kuwait';
            $clinicData['auto_confirm_bookings'] = $clinicData['auto_confirm_bookings'] ?? false;
            $clinicData['new_booking_alerts'] = $clinicData['new_booking_alerts'] ?? true;
            $clinicData['cancellation_alerts'] = $clinicData['cancellation_alerts'] ?? true;
            $clinicData['review_alerts'] = $clinicData['review_alerts'] ?? true;
            $clinicData['email_notifications_enabled'] = $clinicData['email_notifications_enabled'] ?? false;

            // Remove nested keys and file uploads from clinic data
            $clinicFields = [
                'owner_id', 'name_en', 'name_ar', 'bio_en', 'bio_ar', 'phone', 'email', 'logo',
                'category_id', 'governorate_id', 'area_id', 'address', 'block', 'street', 'avenue',
                'house', 'floor', 'apt', 'city', 'state', 'country', 'postal_code', 'latitude', 'longitude',
                'status', 'auto_confirm_bookings', 'new_booking_alerts',
                'cancellation_alerts', 'review_alerts', 'email_notifications_enabled', 'notification_email',
                'cancellation_policy_en', 'cancellation_policy_ar',
                'privacy_policy_en', 'privacy_policy_ar',
                'terms_and_conditions_en', 'terms_and_conditions_ar',
                'refund_policy_en', 'refund_policy_ar',
                'reschedule_policy_en', 'reschedule_policy_ar',
            ];

            // Extract subscription_package_id before filtering (it's not a clinic field)
            $subscriptionPackageId = !empty($clinicData['subscription_package_id']) ? $clinicData['subscription_package_id'] : null;
            
            $clinicCreateData = array_intersect_key($clinicData, array_flip($clinicFields));
            $clinicCreateData = array_filter($clinicCreateData, function($value) {
                return $value !== null && $value !== '';
            });

            // Create clinic using repository
            $clinic = $this->clinicRepository->create($clinicCreateData);

            // Store documents using media repository
            if ($businessLicensePath) {
                $this->mediaRepository->create([
                    'file_name' => $businessLicensePath, // Store the full URL
                    'mediable_type' => Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection_name' => 'business_license',
                    'disk' => 'public',
                    'size' => $request->file('clinic.business_license')->getSize(),
                ]);
            }
            
            if ($idDocumentFrontPath) {
                $this->mediaRepository->create([
                    'file_name' => $idDocumentFrontPath, // Store the full URL
                    'mediable_type' => Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection_name' => 'id_document_front',
                    'disk' => 'public',
                    'size' => $request->file('clinic.id_document_front')->getSize(),
                ]);
            }
            
            if ($idDocumentBackPath) {
                $this->mediaRepository->create([
                    'file_name' => $idDocumentBackPath, // Store the full URL
                    'mediable_type' => Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection_name' => 'id_document_back',
                    'disk' => 'public',
                    'size' => $request->file('clinic.id_document_back')->getSize(),
                ]);
            }

            // Create operating hours using repository
            $operatingHours = $clinicData['operating_hours'] ?? [];
            foreach ($operatingHours as $hourData) {
                $this->clinicOperatingHourRepository->create([
                    'clinic_id' => $clinic->id,
                    'day_of_week' => $hourData['day_of_week'],
                    'is_open' => $hourData['is_open'] ?? true,
                    'closed_all_day' => $hourData['closed_all_day'] ?? false,
                    'opening_time' => $hourData['opening_time'] ?? null,
                    'closing_time' => $hourData['closing_time'] ?? null,
                ]);
            }

            // Create subscription if subscription_package_id is provided
            if (!empty($subscriptionPackageId)) {
                $packageId = (int) $subscriptionPackageId;
                // Use model relationship to find package (no repository exists)
                $package = SubscriptionPackage::find($packageId);
                
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
                    
                    // Link subscription to clinic using repository
                    $this->clinicRepository->update($clinic->id, [
                        'subscription_id' => $subscription->id,
                    ]);
                    $clinic->refresh();
                }
            }

            event(new Registered($user));

            // Don't auto-login, they need approval first
            $request->session()->regenerate();

            return redirect()->route('login')
                ->with('success', __('common.registration_successful_pending_approval'));
        });
    }
}
