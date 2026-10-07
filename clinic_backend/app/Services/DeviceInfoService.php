<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class DeviceInfoService
{
    /**
     * Get device information from request
     * Results are cached per user agent to avoid repeated parsing
     *
     * @param Request|null $request
     * @return array
     */
    public static function getDeviceInfo(?Request $request = null): array
    {
        if (!$request) {
            $request = request();
        }

        if (!$request) {
            return self::getDefaultDeviceInfo();
        }

        $userAgent = $request->userAgent();
        
        // Cache parsed results per user agent (cache for 1 hour)
        // This significantly improves performance for repeated requests
        $cacheKey = 'device_info:' . md5($userAgent);
        
        return Cache::remember($cacheKey, 3600, function () use ($request, $userAgent) {
            $deviceInfo = self::parseUserAgent($userAgent);
            
            // Get current timestamp in application timezone
            $timestamp = now(config('app.timezone'))->toDateTimeString();
            $timestampIso = now(config('app.timezone'))->toIso8601String();
            $timestampUnix = now(config('app.timezone'))->timestamp;

            // Build comprehensive properties
            $properties = [
                // IP Address Information
                'ip_address' => $request->ip(),
                'ip_address_all' => $request->ips(),
                
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
                
                // Session Information
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                'csrf_token' => $request->header('X-CSRF-TOKEN') ?? $request->input('_token'),
            ];

            $user = Auth::user();
            if ($user) {
                $properties['user_id'] = $user->id;
                $properties['user_email'] = $user->email;
                $properties['user_name'] = $user->name;
            }

            return $properties;
        });
    }

    /**
     * Parse user agent and extract device information
     *
     * @param string|null $userAgent
     * @return array
     */
    public static function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return self::getDefaultDeviceInfo();
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
            // Try multiple patterns for macOS version detection (order matters - most specific first)
            // Pattern for Intel Mac OS X 10_15_7 or similar (three-part version)
            if (preg_match('/intel mac os x (\d+[._]\d+[._]\d+)/i', $userAgent, $matches)) {
                // Intel Mac format with full version: Mac OS X 10_15_7
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/arm64.*mac os x (\d+[._]\d+[._]\d+)/i', $userAgent, $matches)) {
                // Apple Silicon format with full version
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/mac os x (\d+[._]\d+[._]\d+)/i', $userAgent, $matches)) {
                // Full version format: Mac OS X 10_15_7 or 10.15.7
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/mac os x (\d+[._]\d+)/i', $userAgent, $matches)) {
                // Two-part version: Mac OS X 10.15
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/mac os x (\d+)/i', $userAgent, $matches)) {
                // Single version: Mac OS X 10
                $osVersion = $matches[1];
            } elseif (preg_match('/macos[\/\s](\d+[._]\d+[._]\d+)/i', $userAgent, $matches)) {
                // Modern format: macOS/12.0.1
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/macos[\/\s](\d+[._]\d+)/i', $userAgent, $matches)) {
                // Modern format: macOS/12.0
                $osVersion = str_replace('_', '.', $matches[1]);
            } elseif (preg_match('/macos[\/\s](\d+)/i', $userAgent, $matches)) {
                // Modern format: macOS/12
                $osVersion = $matches[1];
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
                // For macOS, if no version found (modern browsers), just show "macOS" without version
                // Don't show incorrect/guessed versions
                if ($os === 'macOS' && !$osVersion) {
                    $deviceName = $os;
                } else {
                    $deviceName = "{$os}" . ($osVersion ? " {$osVersion}" : '');
                }
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
     * Get default device info when request is not available
     *
     * @return array
     */
    protected static function getDefaultDeviceInfo(): array
    {
        return [
            'device_name' => 'Unknown',
            'browser' => 'Unknown',
            'browser_version' => null,
            'os' => 'Unknown',
            'os_version' => null,
            'device_type' => 'Unknown',
        ];
    }
}

