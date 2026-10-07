<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging;

class FirebaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Use deferred singleton to ensure database is ready when service is resolved
        $this->app->singleton('firebase.messaging', function ($app) {
            $credentials = $this->getFirebaseCredentials($app);
            
            if (empty($credentials)) {
                throw new \RuntimeException(
                    __('common.firebase_credentials_not_configured')
                );
            }
            
            return (new Factory)
                ->withServiceAccount($credentials)
                ->createMessaging();
        });

        $this->app->bind(Messaging::class, function ($app) {
            return $app->make('firebase.messaging');
        });
    }

    /**
     * Get Firebase credentials from config or database
     * This method is called lazily when the service is first resolved
     * 
     * @param \Illuminate\Contracts\Foundation\Application $app
     * @return array|null
     */
    protected function getFirebaseCredentials($app): ?array
    {
        // First try to get from config (may be cached)
        $credentials = config('services.firebase.credentials');
        
        if (!empty($credentials) && is_array($credentials)) {
            return $credentials;
        }
        
        // If config returns null/empty, try to get directly from database
        // This handles cases where config cache hasn't been cleared
        // We check multiple conditions to ensure database is ready
        try {
            // Check if database service is bound and connection is available
            if (!$app->bound('db')) {
                return null;
            }
            
            // Try to get a database connection to ensure it's ready
            try {
                $app->make('db')->connection()->getPdo();
            } catch (\Throwable $e) {
                // Database connection not ready
                return null;
            }
            
            // Check if site_settings table exists
            if (!\Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                return null;
            }
            
            // Now safely try to get the value from database
            $value = \App\Services\SiteSettingsService::get('firebase_credentials_json');
            
            // If already decoded (type=json), return as-is
            if (is_array($value)) {
                return $value;
            }
            
            // If it's a string, trim whitespace from start/end before decoding
            if (is_string($value)) {
                $clean = trim($value);
                
                if ($clean !== '') {
                    $decoded = json_decode($clean, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        return $decoded;
                    }
                }
            }
        } catch (\PDOException $e) {
            // Database connection issues - silently fail
            return null;
        } catch (\Throwable $e) {
            // Any other error - silently fail
            return null;
        }
        
        return null;
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
