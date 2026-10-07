<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SiteSettingUpdateRequest;
use App\Models\SiteSetting;
use App\Traits\AuthorizesActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingController extends Controller
{
    use AuthorizesActions;

    public function show(Request $request, string $category): Response
    {
        try {
            $this->authorizeSiteSettings($category, 'view');
        } catch (\Exception $e) {
            Log::error('Site settings authorization failed', [
                'category' => $category,
                'error' => $e->getMessage(),
            ]);
            abort(403, __('common.unauthorized_to_view_category'));
        }
        
        $settings = SiteSetting::getByCategory($category);
        $categories = SiteSetting::getCategories();

        if (!isset($categories[$category])) {
            abort(404, __('common.category_not_found'));
        }

        // Filter booking settings to only show allowed ones
        if ($category === 'booking') {
            $allowedBookingKeys = [
                'booking_rescheduling_buffer_hours',
                'booking_cancellation_buffer_hours',
                'booking_user_cancellation_penalty_type',
                'booking_user_cancellation_penalty_value',
                'booking_vendor_refund_policy_type',
                'booking_vendor_refund_policy_value',
            ];
            $settings = $settings->filter(function ($setting) use ($allowedBookingKeys) {
                return in_array($setting->key, $allowedBookingKeys);
            });
        }

        // Convert settings to array and process image URLs
        $settingsArray = $settings->map(function ($setting) {
            if (!$setting) {
                return null;
            }
            
            try {
                $settingArray = [
                    'id' => $setting->id ?? null,
                    'key' => $setting->key ?? '',
                    'value' => $setting->value ?? '',
                    'type' => $setting->type ?? 'text',
                    'description' => $setting->description ?? '',
                    'category' => SiteSetting::getCategoryFromKey($setting->key ?? ''),
                ];
                
                // For image fields, ensure proper URL
                $imageFields = [
                    'app_logo', 
                    'app_favicon',
                    'contact_email_image',
                    'contact_phone_image',
                    'contact_address_image',
                    'contact_instagram_image',
                    'contact_facebook_image',
                    'contact_twitter_image',
                    'contact_linkedin_image',
                    'contact_whatsapp_image',
                ];
                
                if (in_array($setting->key ?? '', $imageFields) && !empty($settingArray['value'])) {
                    $value = $settingArray['value'];
                    // If it's already a full URL, keep it
                    if (filter_var($value, FILTER_VALIDATE_URL)) {
                        // Already a URL, keep as is
                        $settingArray['value'] = $value;
                    } elseif (str_starts_with($value, '/')) {
                        // Already a path starting with /, keep as is
                        $settingArray['value'] = $value;
                    } else {
                        // Convert storage path to URL
                        $value = ltrim($value, '/');
                        if (str_starts_with($value, 'storage/')) {
                            $value = substr($value, 8); // Remove 'storage/' prefix
                        }
                        // Only add storage/ if it doesn't already exist
                        if ($value && !str_starts_with($value, 'storage/')) {
                            $settingArray['value'] = asset('storage/' . $value);
                        } else {
                            $settingArray['value'] = asset($value);
                        }
                    }
                }
                return $settingArray;
            } catch (\Exception $e) {
                Log::error('Error processing setting', [
                    'setting_id' => $setting->id ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        })->filter()->values()->all();

        return Inertia::render('dashboard/site-settings/show', [
            'settings' => $settingsArray,
            'categories' => $categories,
            'currentCategory' => $category,
            'categoryLabel' => $categories[$category],
            'permissions' => $this->getSiteSettingsPermissions($category),
        ]);
    }

    /**
     * Show the form for editing site settings
     */
    public function edit(Request $request, string $category): Response
    {
        Log::info('Site settings edit request received', [
            'category' => $category,
            'user_id' => auth()->id(),
        ]);
        
        $this->authorizeSiteSettings($category, 'edit');
        
        $settings = SiteSetting::getByCategory($category);
        $categories = SiteSetting::getCategories();

        // Filter booking settings to only show allowed ones
        if ($category === 'booking') {
            $allowedBookingKeys = [
                'booking_rescheduling_buffer_hours',
                'booking_cancellation_buffer_hours',
                'booking_user_cancellation_penalty_type',
                'booking_user_cancellation_penalty_value',
                'booking_vendor_refund_policy_type',
                'booking_vendor_refund_policy_value',
            ];
            $settings = $settings->filter(function ($setting) use ($allowedBookingKeys) {
                return in_array($setting->key, $allowedBookingKeys);
            });
        }

        Log::info('Site settings edit data prepared', [
            'category' => $category,
            'settings_count' => $settings->count(),
            'categories' => array_keys($categories),
        ]);

        if (!isset($categories[$category])) {
            Log::error('Site settings category not found', [
                'category' => $category,
                'available_categories' => array_keys($categories),
            ]);
            abort(404, __('common.category_not_found'));
        }

        Log::info('Rendering site settings edit page', [
            'category' => $category,
            'category_label' => $categories[$category],
        ]);

        // Convert settings to array and process image URLs
        $settingsArray = $settings->map(function ($setting) {
            $settingArray = $setting->toArray();
            // For image fields, ensure proper URL
            $imageFields = [
                'app_logo', 
                'app_favicon',
                'contact_email_image',
                'contact_phone_image',
                'contact_address_image',
                'contact_instagram_image',
                'contact_facebook_image',
                'contact_twitter_image',
                'contact_linkedin_image',
                'contact_whatsapp_image',
            ];
            
            if (in_array($setting->key, $imageFields) && $settingArray['value']) {
                $value = $settingArray['value'];
                // If it's already a full URL, keep it
                if (filter_var($value, FILTER_VALIDATE_URL)) {
                    // Already a URL, keep as is
                    $settingArray['value'] = $value;
                } elseif (str_starts_with($value, '/')) {
                    // Already a path starting with /, keep as is
                    $settingArray['value'] = $value;
                } else {
                    // Convert storage path to URL
                    $value = ltrim($value, '/');
                    if (str_starts_with($value, 'storage/')) {
                        $value = substr($value, 8); // Remove 'storage/' prefix
                    }
                    // Only add storage/ if it doesn't already exist
                    if ($value && !str_starts_with($value, 'storage/')) {
                        $settingArray['value'] = asset('storage/' . $value);
                    } else {
                        $settingArray['value'] = asset($value);
                    }
                }
            }
            return $settingArray;
        })->values()->all();

        return Inertia::render('dashboard/site-settings/edit', [
            'settings' => $settingsArray,
            'categories' => $categories,
            'currentCategory' => $category,
            'categoryLabel' => $categories[$category],
            'permissions' => $this->getSiteSettingsPermissions($category),
        ]);
    }

    /**
     * Update site settings
     */
    public function update(SiteSettingUpdateRequest $request, string $category)
    {
        Log::info('Site settings update request received', [
            'category' => $category,
            'user_id' => auth()->id(),
            'data' => $request->all()
        ]);
        
        $this->authorizeSiteSettings($category, 'edit');
        
        $this->withTransaction(function () use ($request, $category) {
            $data = $request->validated();
            
            Log::info('Processing settings update', [
                'settings_count' => count($data['settings']),
                'settings_data' => $data['settings']
            ]);
            
            // Handle settings array structure
            foreach ($data['settings'] as $index => $settingData) {
                $setting = SiteSetting::findOrFail($settingData['id']);
                
                Log::info('Updating setting', [
                    'setting_id' => $setting->id,
                    'setting_key' => $setting->key,
                    'old_value' => $setting->value,
                    'new_value' => $settingData['value'] ?? null,
                    'setting_type' => $setting->type,
                    'index' => $index
                ]);
                
                // Handle file uploads for logo, favicon, and contact images
                // Files need to be accessed directly from request, not from validated data
                $imageFields = [
                    'app_logo', 
                    'app_favicon',
                    'contact_email_image',
                    'contact_phone_image',
                    'contact_address_image',
                    'contact_instagram_image',
                    'contact_facebook_image',
                    'contact_twitter_image',
                    'contact_linkedin_image',
                    'contact_whatsapp_image',
                ];
                
                if (in_array($setting->key, $imageFields)) {
                    // Try multiple ways to access the file (Laravel handles FormData nested arrays differently)
                    $file = null;
                    
                    // Method 1: Direct dot notation
                    $fileKey1 = "settings.{$index}.file";
                    if ($request->hasFile($fileKey1)) {
                        $file = $request->file($fileKey1);
                        Log::info('File found using method 1', ['key' => $fileKey1]);
                    }
                    
                    // Method 2: Array notation
                    if (!$file && $request->hasFile("settings")) {
                        $settingsFiles = $request->file("settings");
                        if (isset($settingsFiles[$index]) && is_array($settingsFiles[$index])) {
                            if (isset($settingsFiles[$index]['file'])) {
                                $file = $settingsFiles[$index]['file'];
                                Log::info('File found using method 2', ['index' => $index]);
                            }
                        }
                    }
                    
                    // Method 3: Check all files in request and match by setting ID
                    if (!$file) {
                        $allFiles = $request->allFiles();
                        Log::info('All files in request', [
                            'files' => array_keys($allFiles),
                            'setting_id' => $setting->id,
                            'setting_key' => $setting->key,
                        ]);
                        
                        // Look for files that might match our pattern
                        // Try to find file by matching the index in the settings array
                        foreach ($allFiles as $key => $value) {
                            // Check if this key matches our pattern: settings[X][file]
                            if (preg_match('/^settings\[(\d+)\]\[file\]$/', $key, $matches)) {
                                $fileIndex = (int)$matches[1];
                                // Check if this index matches our current setting's position
                                if ($fileIndex === $index) {
                                    Log::info('Found file by index match', [
                                        'key' => $key,
                                        'index' => $fileIndex,
                                        'current_index' => $index,
                                    ]);
                                    if ($request->hasFile($key)) {
                                        $file = $request->file($key);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Method 4: Try accessing via array directly
                    if (!$file && $request->has("settings")) {
                        $settingsInput = $request->input("settings");
                        if (isset($settingsInput[$index]) && is_array($settingsInput[$index])) {
                            // Files might be in a separate files array
                            $settingsFiles = $request->file("settings");
                            if (isset($settingsFiles[$index]) && isset($settingsFiles[$index]['file'])) {
                                $file = $settingsFiles[$index]['file'];
                                Log::info('File found using method 4 (array access)', ['index' => $index]);
                            }
                        }
                    }
                    
                    // Method 5: Try to find file by matching setting ID in the data structure
                    if (!$file) {
                        $allFiles = $request->allFiles();
                        $settingsData = $request->input('settings', []);
                        
                        // Look through all files and match by setting ID
                        foreach ($allFiles as $fileKey => $fileValue) {
                            // Extract index from file key if it matches pattern
                            if (preg_match('/settings\[(\d+)\]\[file\]/', $fileKey, $matches)) {
                                $fileIndex = (int)$matches[1];
                                // Check if this index corresponds to our setting
                                if (isset($settingsData[$fileIndex]) && 
                                    isset($settingsData[$fileIndex]['id']) && 
                                    $settingsData[$fileIndex]['id'] == $setting->id) {
                                    Log::info('Found file by setting ID match', [
                                        'file_key' => $fileKey,
                                        'setting_id' => $setting->id,
                                        'index' => $fileIndex,
                                    ]);
                                    if ($request->hasFile($fileKey)) {
                                        $file = $request->file($fileKey);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    if ($file && $file->isValid()) {
                        try {
                            // Delete old file if it exists
                            $oldValue = $setting->value;
                            if ($oldValue) {
                                // Handle both full URLs and path formats
                                $oldPath = $oldValue;
                                
                                // If it's a full URL, extract the path
                                if (filter_var($oldPath, FILTER_VALIDATE_URL)) {
                                    $parsedUrl = parse_url($oldPath);
                                    if (isset($parsedUrl['path'])) {
                                        $oldPath = ltrim($parsedUrl['path'], '/');
                                        // Remove 'storage/' prefix if present in URL path
                                        if (str_starts_with($oldPath, 'storage/')) {
                                            $oldPath = substr($oldPath, 8);
                                        }
                                    } else {
                                        $oldPath = null;
                                    }
                                } elseif (str_starts_with($oldPath, 'storage/')) {
                                    // Remove storage/ prefix
                                    $oldPath = substr($oldPath, 8);
                                } elseif (str_starts_with($oldPath, '/')) {
                                    // Remove leading slash
                                    $oldPath = ltrim($oldPath, '/');
                                    if (str_starts_with($oldPath, 'storage/')) {
                                        $oldPath = substr($oldPath, 8);
                                    }
                                }
                                
                                // Try to delete the file if path exists
                                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                                    Storage::disk('public')->delete($oldPath);
                                    Log::info('Old file deleted', [
                                        'setting_key' => $setting->key,
                                        'old_path' => $oldPath,
                                        'original_value' => $oldValue,
                                    ]);
                                } else {
                                    Log::info('Old file not found or already deleted', [
                                        'setting_key' => $setting->key,
                                        'old_path' => $oldPath,
                                        'original_value' => $oldValue,
                                    ]);
                                }
                            }
                            
                            // Store the new file
                            $path = $file->store('settings', 'public');
                            // Convert path to full URL for storage
                            // The path from store() is relative to storage/app/public
                            // Convert to full URL using asset()
                            $settingData['value'] = asset('storage/' . $path);
                            
                            Log::info('File stored', [
                                'original_path' => $path,
                                'stored_value' => $settingData['value'],
                                'full_url' => $settingData['value'],
                            ]);
                            
                            Log::info('File uploaded successfully', [
                                'setting_key' => $setting->key,
                                'file_path' => $settingData['value'],
                                'original_name' => $file->getClientOriginalName(),
                                'file_size' => $file->getSize(),
                                'mime_type' => $file->getMimeType(),
                            ]);
                        } catch (\Exception $e) {
                            Log::error('File upload failed', [
                                'setting_key' => $setting->key,
                                'error' => $e->getMessage(),
                                'trace' => $e->getTraceAsString(),
                            ]);
                            throw $e;
                        }
                    } else {
                        // No file uploaded, use value from request or keep existing value
                        if (!isset($settingData['value']) || empty($settingData['value'])) {
                            $settingData['value'] = $setting->value;
                        }
                        Log::info('No file uploaded for setting', [
                            'setting_key' => $setting->key,
                            'setting_id' => $setting->id,
                            'index' => $index,
                            'value_from_request' => $settingData['value'] ?? null,
                            'preserving_value' => $setting->value,
                        ]);
                    }
                } else {
                    // Not an image field, ensure value is set from request
                    if (!isset($settingData['value']) || (is_string($settingData['value']) && trim($settingData['value']) === '')) {
                        // If value is empty string, check if we should preserve existing value or set to empty
                        // For now, preserve existing value if new value is empty
                        if (empty($settingData['value'])) {
                            $settingData['value'] = $setting->value;
                        }
                    }
                }
                
                // Convert boolean values to string for storage
                if ($setting->type === 'boolean') {
                    $settingData['value'] = $settingData['value'] ? 'true' : 'false';
                }
                
                // Handle array/json type conversion
                if ($setting->type === 'array' && isset($settingData['value']) && is_array($settingData['value'])) {
                    // Convert array to comma-separated string or JSON
                    $settingData['value'] = json_encode($settingData['value']);
                } elseif ($setting->type === 'json' && isset($settingData['value']) && !is_string($settingData['value'])) {
                    // Ensure JSON is stored as string
                    $settingData['value'] = json_encode($settingData['value']);
                }
                
                // Update the setting
                $setting->update([
                    'value' => $settingData['value'] ?? $setting->value,
                ]);
                
                // If default language is changed, clear locale session/cookie to force re-evaluation
                if ($setting->key === 'app_default_language') {
                    session()->forget('locale');
                    // Clear locale cookie by setting it to expire
                    cookie()->queue(cookie('locale', '', -1));
                }
                
                // If Firebase credentials are updated, clear config cache
                if (in_array($setting->key, ['firebase_credentials_json', 'firebase_web_config_json'])) {
                    Artisan::call('config:clear');
                }
            }
        });

        Log::info('Site settings update completed successfully', [
            'category' => $category,
            'user_id' => auth()->id()
        ]);

        return redirect()->route('dashboard.site-settings.show', ['category' => $category])
            ->with('success', __('common.site_settings_updated_successfully'));
    }

    /**
     * Reset settings to default values
     */
    public function reset(Request $request, string $category)
    {
        $this->authorizeSiteSettings($category, 'reset');
        
        $this->withTransaction(function () use ($category) {
            $settings = SiteSetting::getByCategory($category);
            
            foreach ($settings as $setting) {
                $originalValue = $setting->value;
                
                // Reset to default values based on key
                $defaultValue = $this->getDefaultValue($setting->key);
                $setting->update(['value' => $defaultValue]);
            }
        });

        return redirect()->route('dashboard.site-settings.show', ['category' => $category])
            ->with('success', __('common.site_settings_reset_successfully'));
    }

    /**
     * Get default value for a setting key
     */
    private function getDefaultValue($key)
    {
        $defaults = [
            'activity_logger_enabled' => 'true',
            'otp_test_mode' => 'true',
            'otp_provider' => 'smsbox',
            'otp_digits' => '4',
            'otp_expiry_minutes' => '5',
            'twilio_sid' => '',
            'twilio_auth_token' => '',
            'twilio_whatsapp_from' => 'whatsapp:+14155238886',
            'whatsapp_otp_template_sid' => '',
            'smsbox_username' => '',
            'smsbox_password' => '',
            'smsbox_customerid' => '',
            'smsbox_sendertext' => '',
            'smsbox_endpoint' => 'http://smsbox.com/smsgateway/services/messaging.asmx/Http_SendSMS',
            'myfatoorah_api_key' => '',
            'myfatoorah_test_mode' => 'true',
            'myfatoorah_country_iso' => 'KWT',
            'myfatoorah_save_card' => 'true',
            'myfatoorah_webhook_secret_key' => '',
            'myfatoorah_register_apple_pay' => 'true',
            'support_email' => '',
            'support_phone' => '',
            'support_whatsapp' => '',
            'support_address_en' => '',
            'support_address_ar' => '',
        ];

        return $defaults[$key] ?? '';
    }

    /**
     * Export settings as JSON
     */
    public function export(Request $request)
    {
        $category = $request->get('category');
        
        if ($category) {
            $settings = SiteSetting::getByCategory($category);
        } else {
            $settings = SiteSetting::all();
        }

        $exportData = $settings->map(function ($setting) {
            return [
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
                'description' => $setting->description,
            ];
        });

        return response()->json([
            'settings' => $exportData,
            'exported_at' => now()->toISOString(),
            'category' => $category,
        ]);
    }

    /**
     * Get permissions for site settings category
     */
    protected function getSiteSettingsPermissions(string $category): array
    {
        return [
            'view' => $this->canAccessSiteSettings($category, 'view'),
            'edit' => $this->canAccessSiteSettings($category, 'edit'),
            'reset' => $this->canAccessSiteSettings($category, 'reset'),
            'export' => $this->canAccessSiteSettings($category, 'export'),
            'import' => $this->canAccessSiteSettings($category, 'import'),
        ];
    }

    /**
     * Import settings from JSON
     */
    public function import(Request $request)
    {
        $category = $request->get('category', 'general');
        $this->authorizeSiteSettings($category, 'import');
        
        $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
            'settings.*.type' => ['required', 'string'],
        ]);

        $this->withTransaction(function () use ($request) {
            foreach ($request->input('settings') as $settingData) {
                $setting = SiteSetting::updateOrCreate(
                    ['key' => $settingData['key']],
                    [
                        'value' => $settingData['value'],
                        'type' => $settingData['type'],
                        'description' => $settingData['description'] ?? '',
                    ]
                );
            }
        });

        return redirect()->route('dashboard.site-settings.index')
            ->with('success', __('common.site_settings_imported_successfully'));
    }
}
