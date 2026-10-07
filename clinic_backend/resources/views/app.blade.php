<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark', 'rtl' => app()->getLocale() === 'ar']) dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Firebase Configuration for Service Worker --}}
        {{-- Read from site settings (firebase_web_config_json) --}}
        <script>
            @php
                // First try to get from config (may be cached)
                $firebaseWebConfig = config('services.firebase.web_config', []);
                
                // If config is empty, try to get directly from database
                // This handles cases where config cache hasn't been cleared
                if (empty($firebaseWebConfig) || !isset($firebaseWebConfig['apiKey']) || !isset($firebaseWebConfig['projectId'])) {
                    try {
                        if (app()->bound('db') && \Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                            $value = \App\Services\SiteSettingsService::get('firebase_web_config_json');
                            
                            // If already decoded (type=json), use it
                            if (is_array($value) && !empty($value)) {
                                $firebaseWebConfig = $value;
                            }
                            // If it's a string, decode it
                            elseif (is_string($value)) {
                                $clean = trim($value);
                                if ($clean !== '') {
                                    $decoded = json_decode($clean, true);
                                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded) && !empty($decoded)) {
                                        $firebaseWebConfig = $decoded;
                                    }
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                        // Silently fail if database isn't available
                    }
                }
            @endphp
            window.FIREBASE_CONFIG = @json($firebaseWebConfig);
        </script>

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Initialize RTL support immediately on page load --}}
        <script>
            (function() {
                const locale = '{{ app()->getLocale() }}';
                const isRTL = locale === 'ar';
                const htmlElement = document.documentElement;
                
                // Set HTML direction and language attributes
                if (htmlElement) {
                    htmlElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
                    htmlElement.setAttribute('lang', isRTL ? 'ar' : 'en');
                }
                
                // Function to update body class - will be called when body is available
                function updateBodyRTL() {
                    const bodyElement = document.body;
                    if (bodyElement && bodyElement.classList) {
                        try {
                            if (isRTL) {
                                bodyElement.classList.add('rtl');
                            } else {
                                bodyElement.classList.remove('rtl');
                            }
                        } catch (error) {
                            // Silently fail if there's any error
                            console.warn('Failed to update RTL class on body:', error);
                        }
                    }
                }
                
                // Try to update immediately if body exists
                updateBodyRTL();
                
                // Also update when DOM is ready (in case body wasn't ready yet)
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', updateBodyRTL);
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @php
            $favicon = \App\Services\SiteSettingsService::get('app_favicon');
            $hasCustomFavicon = $favicon && trim($favicon) !== '';
        @endphp
        
        @if($hasCustomFavicon)
            <link rel="icon" href="{{ $favicon }}" sizes="any">
            <link rel="icon" href="{{ $favicon }}" type="image/svg+xml">
            <link rel="apple-touch-icon" href="{{ $favicon }}">
        @else
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @endif
        
        {{-- Dynamic favicon for light/dark mode --}}
        <script>
            (function() {
                const favicon = '{{ $hasCustomFavicon ? $favicon : "/favicon.ico" }}';
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = favicon;
                document.head.appendChild(link);
                
                // Update favicon based on theme
                function updateFavicon() {
                    const isDark = document.documentElement.classList.contains('dark');
                    link.href = isDark ? favicon : favicon;
                }
                
                // Listen for theme changes
                const observer = new MutationObserver(updateFavicon);
                observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            })();
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @if(app()->getLocale() === 'ar')
            @vite(['resources/css/rtl.css'])
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
