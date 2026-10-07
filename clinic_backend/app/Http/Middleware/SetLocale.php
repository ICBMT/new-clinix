<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->get('lang');
        
        // Try to get locale from session, fallback to cookie, then default
        if (!$locale) {
            try {
                $locale = Session::get('locale');
            } catch (\Exception $e) {
                // Session might be expired or table doesn't exist
                $locale = null;
            }
        }
        
        // Fallback to cookie if session failed
        if (!$locale) {
            $locale = $request->cookie('locale');
        }
        
        // For admin panel routes, check SiteSetting for default language
        if (!$locale && $this->isAdminPanelRoute($request)) {
            try {
                // Try app_default_language first (correct key), then fallback to default_language for backward compatibility
                $defaultLanguage = SiteSetting::getValue('app_default_language') ?? SiteSetting::getValue('default_language');
                if ($defaultLanguage && in_array($defaultLanguage, ['en', 'ar'])) {
                    $locale = $defaultLanguage;
                }
            } catch (\Exception $e) {
                // If SiteSetting fails, continue to next fallback
            }
        }
        
        // Also check for frontend routes
        if (!$locale && !$this->isAdminPanelRoute($request)) {
            try {
                $defaultLanguage = SiteSetting::getValue('app_default_language') ?? SiteSetting::getValue('default_language');
                if ($defaultLanguage && in_array($defaultLanguage, ['en', 'ar'])) {
                    $locale = $defaultLanguage;
                }
            } catch (\Exception $e) {
                // If SiteSetting fails, continue to next fallback
            }
        }
        
        // Final fallback to config
        if (!$locale) {
            $locale = config('app.locale');
        }
        
        // Validate locale
        if (in_array($locale, ['en', 'ar'])) {
            App::setLocale($locale);
            
            // Try to save to session, but don't fail if it doesn't work
            try {
                Session::put('locale', $locale);
            } catch (\Exception $e) {
                // If session fails, set cookie as fallback
                cookie()->queue(cookie('locale', $locale, 60 * 24 * 365)); // 1 year
            }
        } else {
            // If locale is invalid, set to default
            $locale = config('app.locale');
            App::setLocale($locale);
        }

        return $next($request);
    }

    /**
     * Check if the request is for admin panel routes
     */
    private function isAdminPanelRoute(Request $request): bool
    {
        $path = $request->path();
        return str_starts_with($path, 'dashboard');
    }
}
