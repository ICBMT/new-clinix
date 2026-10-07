<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ApiExceptionHandler
{
    /**
     * Render exception for API requests
     */
    public static function render(\Throwable $e, Request $request): ?\Illuminate\Http\JsonResponse
    {
        // Only handle API requests
        if (!$request->expectsJson() && !$request->is('api/*')) {
            return null;
        }

        $status = 500;
        $message = __('common.something_went_wrong');
        $errors = [];

        // Handle specific exceptions
        if ($e instanceof AuthenticationException) {
            $status = 401;
            $message = __('common.api_unauthenticated');
        } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
            $status = 422;
            $message = __('common.validation_failed');
            $errors = $e->errors();
        } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            $status = 404;
            $message = __('common.resource_not_found');
        } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
            $status = $e->getStatusCode();
        }

        // Add debug info if enabled (only for server errors)
        if (config('app.debug') && $status >= 500) {
            $errors = array_merge($errors, [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    /**
     * Report exception via email
     */
    public static function report(\Throwable $e): void
    {
        // Skip reporting if running in console (e.g., during wayfinder generation)
        // or if Laravel isn't fully bootstrapped
        try {
            if (app()->runningInConsole() || !app()->bound('log')) {
                return;
            }
        } catch (\Throwable $bootstrapCheck) {
            // If we can't even check the app state, skip reporting
            return;
        }

        try {
            Log::info('Exception report handler called', [
                'environment' => config('app.env'),
                'exception' => get_class($e),
            ]);

            $sendEmails = in_array(config('app.env'), ['production', 'staging', 'local']);
            
            Log::info('Email sending check', [
                'should_send' => $sendEmails,
                'environment' => config('app.env'),
            ]);

            if (!$sendEmails) {
                Log::info('Email sending skipped - environment not in allowed list');
                return;
            }

            $requestData = [
                'url' => request()->url(),
                'method' => request()->method(),
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'route_name' => request()->route()?->getName() ?? 'N/A',
                'route_action' => request()->route()?->getActionName() ?? 'N/A',
                'user' => Auth::check() ? [
                    'id' => Auth::id(),
                    'name' => Auth::user()->name ?? 'N/A',
                    'email' => Auth::user()->email ?? 'N/A',
                ] : null,
            ];

            $recipient = config('mail.exception_recipient') ?: config('mail.from.address');
            
            Log::info('Preparing to send exception email', [
                'recipient' => $recipient,
                'exception' => get_class($e),
                'environment' => config('app.env'),
                'mail_config' => [
                    'from' => config('mail.from'),
                    'exception_recipient' => config('mail.exception_recipient'),
                ],
            ]);

            if ($recipient) {
                Log::info('Sending email to recipient', ['recipient' => $recipient]);
                
                try {
                    Mail::to($recipient)->send(new \App\Mail\ExceptionReportMail($e, $requestData));
                    Log::info('Exception email sent successfully', [
                        'recipient' => $recipient,
                        'exception' => get_class($e),
                    ]);
                } catch (\Exception $transportException) {
                    Log::error('Mail transport failed', [
                        'error' => $transportException->getMessage(),
                        'error_class' => get_class($transportException),
                        'recipient' => $recipient,
                    ]);
                }
            } else {
                Log::warning('No email recipient configured', [
                    'exception_recipient' => config('mail.exception_recipient'),
                    'mail_from_address' => config('mail.from.address'),
                ]);
            }
        } catch (\Throwable $mailException) {
            // Silently fail if facades aren't available or any other error occurs
            // This prevents errors during console commands or early bootstrap
        }
    }
}

