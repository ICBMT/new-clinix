<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SetUserLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['en', 'ar'];

        $locale = $this->localeFromHeaders($request, $supportedLocales)
            ?? $this->localeFromAcceptLanguage($request, $supportedLocales)
            ?? 'en';

        app()->setLocale($locale);

        if (config('app.debug')) {
            Log::debug('Resolved locale', [
                'locale' => $locale,
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
        }

        return $next($request);
    }

    private function localeFromHeaders(Request $request, array $supportedLocales): ?string
    {
        $headerKeys = ['X-Locale', 'X-Language', 'Lang', 'Locale', 'Accept-Language'];

        foreach ($headerKeys as $key) {
            if (!$request->hasHeader($key)) {
                continue;
            }

            $raw = $request->header($key);
            $locale = $this->normalizeLocale($raw);

            if ($locale && in_array($locale, $supportedLocales, true)) {
                return $locale;
            }
        }

        return null;
    }

    private function localeFromAcceptLanguage(Request $request, array $supportedLocales): ?string
    {
        if (!$request->hasHeader('Accept-Language')) {
            return null;
        }

        $locale = $this->normalizeLocale($request->header('Accept-Language'));

        return $locale && in_array($locale, $supportedLocales, true)
            ? $locale
            : null;
    }

    private function normalizeLocale(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $locale = strtolower(trim($value));
        $locale = explode(',', $locale)[0];
        $locale = explode(';', $locale)[0];
        $locale = explode('-', $locale)[0];

        return $locale ?: null;
    }
}
