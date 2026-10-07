<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Log;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Safely get user data
        $user = null;
        try {
            $user = $request->user();
        } catch (\Exception $e) {
            // If user retrieval fails (e.g., session expired), user will be null
            $user = null;
        }

        // Safely get session flash messages
        $flash = ['success' => null, 'error' => null];
        try {
            $flash = [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ];
        } catch (\Exception $e) {
            // If session access fails, use empty flash messages
            $flash = ['success' => null, 'error' => null];
        }

        // Get unread notification count if user is authenticated and has permission
        $unreadNotificationCount = 0;
        if ($user) {
            try {
                // Check if user has the can method (from Spatie Permission package)
                if (method_exists($user, 'can') && $user->can('notifications.view')) {
                    $notificationRepository = app(\App\Contracts\NotificationRepositoryInterface::class);
                    if ($notificationRepository && method_exists($notificationRepository, 'getUnreadCountForUser')) {
                        $unreadNotificationCount = $notificationRepository->getUnreadCountForUser($user->id) ?? 0;
                    }
                }
            } catch (\Exception $e) {
                // If notification count retrieval fails, default to 0
                // Log error in debug mode only
                if (config('app.debug')) {
                    Log::warning('Failed to get unread notification count in middleware', [
                        'user_id' => $user->id ?? null,
                        'error' => $e->getMessage(),
                    ]);
                }
                $unreadNotificationCount = 0;
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => app()->getLocale(),
            'rtl' => app()->getLocale() === 'ar',
            'translations' => __('common'),
            'siteSettings' => $this->getSiteSettings(),
            'flash' => $flash,
            'unreadNotificationCount' => $unreadNotificationCount,
        ];
    }

    /**
     * Get site settings for the frontend
     */
    private function getSiteSettings(): array
    {
        try {
            $settings = SiteSetting::whereIn('key', [
                'app_logo',
                'app_favicon', 
                'app_name_en',
                'app_name_ar',
                'privacy_policy_en',
                'privacy_policy_ar',
                'terms_conditions_en',
                'terms_conditions_ar',
                // Contact Us Settings
                'contact_email',
                'contact_phone',
                'contact_address_en',
                'contact_address_ar',
                // Support Settings (fallback)
                'support_email',
                'support_phone',
                'support_whatsapp',
                'support_address_en',
                'support_address_ar',
                // Google Maps
                'google_maps_api_key',
            ])->pluck('value', 'key')->toArray();
            
            // Ensure all values are strings and trim whitespace
            $settings = array_map(function($value) {
                return $value !== null ? trim((string) $value) : '';
            }, $settings);
            
            return $settings;
        } catch (\Exception $e) {
            // Return empty array if database is not available (e.g., during migrations)
            return [];
        }
    }
}
