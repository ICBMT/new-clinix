<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

abstract class Controller
{
    /**
     * Parse user agent and extract device information
     * 
     * @param string|null $userAgent User agent string
     * @return array Device information (device_name, browser, browser_version, os, os_version, device_type)
     */
    protected function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return [
                'device_name' => 'Unknown',
                'browser' => 'Unknown',
                'browser_version' => null,
                'os' => 'Unknown',
                'os_version' => null,
                'device_type' => 'Unknown',
            ];
        }

        $deviceName = 'Unknown';
        $browser = 'Unknown';
        $browserVersion = null;
        $os = 'Unknown';
        $osVersion = null;
        $deviceType = 'Desktop';

        // Detect Operating System
        if (preg_match('/windows nt 10.0/i', $userAgent)) {
            $os = 'Windows';
            $osVersion = '10';
        } elseif (preg_match('/windows nt 6.3/i', $userAgent)) {
            $os = 'Windows';
            $osVersion = '8.1';
        } elseif (preg_match('/windows nt 6.2/i', $userAgent)) {
            $os = 'Windows';
            $osVersion = '8';
        } elseif (preg_match('/windows nt 6.1/i', $userAgent)) {
            $os = 'Windows';
            $osVersion = '7';
        } elseif (preg_match('/macintosh|mac os x|macos/i', $userAgent)) {
            $os = 'macOS';
            // Try multiple patterns for macOS version detection
            if (preg_match('/mac os x (\d+[._]\d+)/i', $userAgent, $matches)) {
                // Old format: Mac OS X 10.15
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/mac os x (\d+)/i', $userAgent, $matches)) {
                // Format: Mac OS X 10
                $osVersion = $matches[1];
            } elseif (preg_match('/macos[\/\s](\d+[._]\d+)/i', $userAgent, $matches)) {
                // Modern format: macOS/12.0
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/macos[\/\s](\d+)/i', $userAgent, $matches)) {
                // Modern format: macOS/12
                $osVersion = $matches[1];
            } elseif (preg_match('/intel mac os x (\d+[._]\d+)/i', $userAgent, $matches)) {
                // Intel Mac format
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/arm64.*mac os x (\d+[._]\d+)/i', $userAgent, $matches)) {
                // Apple Silicon format
                $osVersion = str_replace('_', '.', $matches[1]);
            }
            // Note: Modern browsers (Chrome 89+, Safari 14+) don't include macOS version in user agent for privacy
            // If no version found, we'll just show "macOS" without version
        } elseif (preg_match('/linux/i', $userAgent)) {
            $os = 'Linux';
            if (preg_match('/(ubuntu|debian|fedora|centos|arch)/i', $userAgent, $matches)) {
                $osVersion = $matches[1];
            }
        } elseif (preg_match('/android (\d+(?:\.\d+)?)/i', $userAgent, $matches)) {
            $os = 'Android';
            $osVersion = $matches[1];
            $deviceType = 'Mobile';
        } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
            $os = 'iOS';
            if (preg_match('/os (\d+[._]\d+)/i', $userAgent, $matches)) {
                $osVersion = str_replace('_', '.', $matches[1]);
            }
            $deviceType = preg_match('/ipad/i', $userAgent) ? 'Tablet' : 'Mobile';
            if (preg_match('/iphone/i', $userAgent)) {
                $deviceName = 'iPhone';
            } elseif (preg_match('/ipad/i', $userAgent)) {
                $deviceName = 'iPad';
            }
        }

        // Detect Browser
        if (preg_match('/edg\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Edge';
            $browserVersion = $matches[1];
        } elseif (preg_match('/chrome\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Chrome';
            $browserVersion = $matches[1];
        } elseif (preg_match('/safari\/(\d+)/i', $userAgent, $matches) && !preg_match('/chrome/i', $userAgent)) {
            $browser = 'Safari';
            if (preg_match('/version\/(\d+)/i', $userAgent, $versionMatches)) {
                $browserVersion = $versionMatches[1];
            }
        } elseif (preg_match('/firefox\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Firefox';
            $browserVersion = $matches[1];
        } elseif (preg_match('/opera|opr\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Opera';
            if (preg_match('/version\/(\d+)/i', $userAgent, $versionMatches)) {
                $browserVersion = $versionMatches[1];
            }
        }

        // Build device name
        if ($deviceName === 'Unknown') {
            if ($deviceType === 'Mobile' || $deviceType === 'Tablet') {
                $deviceName = "{$os} {$deviceType}";
            } else {
                $deviceName = "{$os}" . ($osVersion ? " {$osVersion}" : '');
            }
            if ($deviceName === 'Unknown') {
                $deviceName = $os;
            }
        }

        return [
            'device_name' => $deviceName,
            'browser' => $browser,
            'browser_version' => $browserVersion,
            'os' => $os,
            'os_version' => $osVersion,
            'device_type' => $deviceType,
        ];
    }

    /**
     * Log user activity using Spatie Activity Log with detailed information
     * 
     * @param string $logName Log name/category
     * @param string $description Activity description
     * @param array $properties Additional properties to log
     * @param mixed $subject Subject model (optional)
     * @param mixed $causer Causer model (optional, defaults to authenticated user)
     * @param string|null $event Event name (optional, will try to extract from description if not provided)
     * @return void
     */
    public function logActivity($logName, $description, $properties = [], $subject = null, $causer = null, $event = null)
    {
        try {
            if (!$causer && Auth::check()) {
                $causer = Auth::user();
            }

            if (!$event && $description) {
                $descLower = strtolower($description);
                if (strpos($descLower, 'created') !== false || strpos($descLower, 'إنشاء') !== false) {
                    $event = 'created';
                } elseif (strpos($descLower, 'updated') !== false || strpos($descLower, 'تحديث') !== false) {
                    $event = 'updated';
                } elseif (strpos($descLower, 'deleted') !== false || strpos($descLower, 'حذف') !== false) {
                    $event = 'deleted';
                } elseif (strpos($descLower, 'approved') !== false || strpos($descLower, 'موافقة') !== false) {
                    $event = 'approved';
                } elseif (strpos($descLower, 'rejected') !== false || strpos($descLower, 'رفض') !== false) {
                    $event = 'rejected';
                } elseif (strpos($descLower, 'logged in') !== false || strpos($descLower, 'تسجيل دخول') !== false) {
                    $event = 'login';
                } elseif (strpos($descLower, 'logged out') !== false || strpos($descLower, 'تسجيل خروج') !== false) {
                    $event = 'logout';
                }
            }

            // Get request information
            $request = request();
            $userAgent = $request->userAgent();
            $deviceInfo = \App\Services\DeviceInfoService::parseUserAgent($userAgent);
            
            // Get current timestamp in application timezone (not UTC)
            $timestamp = now(config('app.timezone'))->toDateTimeString();
            $timestampIso = now(config('app.timezone'))->toIso8601String();
            $timestampUnix = now(config('app.timezone'))->timestamp;

            // Build comprehensive properties
            $commonProperties = [
                // IP Address Information
                'ip_address' => $request->ip(),
                'ip_address_all' => $request->ips(), // All IPs from proxies
                
                // Device Information
                'device_name' => $deviceInfo['device_name'],
                'device_type' => $deviceInfo['device_type'],
                'os' => $deviceInfo['os'],
                'os_version' => $deviceInfo['os_version'],
                'browser' => $deviceInfo['browser'],
                'browser_version' => $deviceInfo['browser_version'],
                
                // User Agent
                'user_agent' => $userAgent,
                'user_agent_parsed' => $deviceInfo,
                
                // Request Information
                'url' => $request->fullUrl(),
                'path' => $request->path(),
                'method' => $request->method(),
                'referer' => $request->header('referer'),
                'host' => $request->getHost(),
                'scheme' => $request->getScheme(),
                'port' => $request->getPort(),
                
                // Timestamp Information (in application timezone)
                'timestamp' => $timestamp,
                'timestamp_iso8601' => $timestampIso,
                'timestamp_unix' => $timestampUnix,
                'timezone' => config('app.timezone'),
                
                // User Information (if available)
                'user_id' => $causer?->id,
                'user_email' => $causer?->email,
                'user_name' => $causer?->name,
                
                // Session Information
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'csrf_token' => $request->header('X-CSRF-TOKEN') ?? $request->input('_token'),
            ];

            $allProperties = array_merge($commonProperties, $properties);
            $activity = activity($logName)->withProperties($allProperties);

            if ($event) {
                $activity->event($event);
            }

            if ($causer) {
                $activity->causedBy($causer);
            }

            if ($subject) {
                $activity->performedOn($subject);
            }

            $activity->log($description);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Activity logging failed: ' . $e->getMessage(), [
                'log_name' => $logName,
                'description' => $description,
                'properties' => $properties,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Execute a callback within a database transaction
     * 
     * @param callable $function The callback function to execute
     * @return mixed The result from the callback function
     * @throws Throwable
     */
    public function withTransaction(callable $function)
    {
        return DB::transaction(function () use ($function) {
            return $function();
        });
    }
    public function isRoleAllowedForApiLogin($user): bool
    {
        $allowedRoles = ['user'];
        
        foreach ($allowedRoles as $role) {
            if ($user->hasRole($role)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get all clinic IDs that a user has access to (owned or managed)
     * Uses User model's getAccessibleClinicIds() method which uses relationships
     * 
     * @param \App\Models\User $user
     * @return array Array of clinic IDs
     */
    protected function getUserAccessibleClinicIds($user): array
    {
        return $user->getAccessibleClinicIds();
    }

    /**
     * Calculate percentage change between two values
     * 
     * @param float|int $current Current value
     * @param float|int $previous Previous value
     * @return array ['value' => float, 'type' => 'increase'|'decrease'|'neutral']
     */
    protected function calculatePercentageChange($current, $previous): array
    {
        if ($previous == 0) {
            return [
                'value' => 0,
                'type' => 'neutral'
            ];
        }
        
        $change = round((($current - $previous) / $previous) * 100, 1);
        
        return [
            'value' => abs($change),
            'type' => $change >= 0 ? 'increase' : 'decrease'
        ];
    }

    /**
     * Format pagination response for API
     * 
     * @param \Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator
     * @return array
     */
    protected function formatPaginationResponse($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Get statistics for a period with change calculation
     * 
     * @param callable $currentQuery Query builder for current period
     * @param callable $previousQuery Query builder for previous period
     * @param string $aggregateMethod 'count', 'sum', 'avg' (default: 'count')
     * @param string|null $column Column name for sum/avg operations
     * @return array ['current' => mixed, 'previous' => mixed, 'change' => float, 'change_type' => string]
     */
    protected function getPeriodStatistics(callable $currentQuery, callable $previousQuery, string $aggregateMethod = 'count', ?string $column = null): array
    {
        $current = $aggregateMethod === 'count' 
            ? $currentQuery()->count()
            : ($aggregateMethod === 'sum' 
                ? $currentQuery()->sum($column) 
                : $currentQuery()->avg($column));
        
        $previous = $aggregateMethod === 'count'
            ? $previousQuery()->count()
            : ($aggregateMethod === 'sum'
                ? $previousQuery()->sum($column)
                : $previousQuery()->avg($column));
        
        $change = $this->calculatePercentageChange($current, $previous);
        
        return [
            'current' => $current,
            'previous' => $previous,
            'change' => $change['value'],
            'change_type' => $change['type']
        ];
    }
}
