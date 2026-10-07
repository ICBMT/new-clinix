<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactFormRequest;
use App\Contracts\SupportRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly SupportRepositoryInterface $supportRepository
    ) {}


    /**
     * Show welcome page
     */
    public function welcome(): Response
    {
        return Inertia::render('welcome');
    }

    /**
     * Show terms page
     */
    public function terms(): Response
    {
        return Inertia::render('terms');
    }

    /**
     * Show privacy page
     */
    public function privacy(): Response
    {
        return Inertia::render('privacy');
    }

    /**
     * Show contact page
     */
    public function contact(): Response
    {
        return Inertia::render('contact');
    }

    /**
     * Handle contact form submission
     */
    public function submitContact(ContactFormRequest $request)
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $data['user_id'] = optional($request->user())->id;
            $data['name'] = $data['full_name']; // Map full_name to name for Contact model
            $data['subject'] = __('common.contact_form_submission'); // Default subject since form doesn't have it
            unset($data['full_name']); // Remove full_name from data array

            $contact = $this->supportRepository->createContact($data);

            // Log activity
            $this->logActivity(
                'contact',
                "Contact form submitted by: {$data['email']}",
                [
                    'contact_id' => $contact->id,
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                ],
                $contact,
                $request->user()
            );

            return redirect()->back()->with('success', __('common.contact_request_received'));
        });
    }

    /**
     * Show coming soon page
     */
    public function comingSoon(): Response
    {
        return Inertia::render('ComingSoon');
    }

    /**
     * Show maintenance page
     */
    public function maintenance(): Response
    {
        return Inertia::render('maintenance');
    }

    /**
     * Switch language
     */
    public function switchLanguage(Request $request, string $locale)
    {
        if (in_array($locale, ['en', 'ar'])) {
            try {
                // Try to set session, but handle gracefully if session table doesn't exist or session expired
                if (config('session.driver') === 'database') {
                    // Check if sessions table exists
                    try {
                        \Illuminate\Support\Facades\DB::table('sessions')->limit(1)->get();
                        session(['locale' => $locale]);
                    } catch (\Illuminate\Database\QueryException $e) {
                        // Sessions table doesn't exist, use cookie instead
                        cookie()->queue(cookie('locale', $locale, 60 * 24 * 365)); // 1 year
                    }
                } else {
                    // For file/cookie sessions, just set it
                    session(['locale' => $locale]);
                }
            } catch (\Exception $e) {
                // Fallback to cookie if session fails
                cookie()->queue(cookie('locale', $locale, 60 * 24 * 365)); // 1 year
            }
        }
        return redirect()->back();
    }

    /**
     * Payment success page
     */
    public function paymentSuccess(): Response
    {
        return Inertia::render('payment-success');
    }

    /**
     * Payment error page
     */
    public function paymentError(): Response
    {
        return Inertia::render('payment-error');
    }

    /**
     * Payment callback handler
     */
    public function paymentCallback(Request $request)
    {
        try {
            \Illuminate\Support\Facades\Log::info('Payment callback route accessed', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'paymentId' => $request->get('paymentId'),
                'Id' => $request->get('Id'),
                'all_params' => $request->all(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            
            $callbackController = app(\App\Http\Controllers\PaymentCallbackController::class);
            $response = $callbackController->callback($request);
            
            \Illuminate\Support\Facades\Log::info('Payment callback response generated', [
                'response_type' => get_class($response),
                'status_code' => method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 'N/A',
            ]);
            
            return $response;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Payment callback route error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'url' => $request->fullUrl(),
            ]);
            
            try {
                $errorUrl = route('payment.error.page') . '?' . http_build_query([
                    'status' => 'error',
                    'message' => __('common.payment_processing_error'),
                ]);
                return redirect($errorUrl);
            } catch (\Exception $redirectException) {
                // If redirect fails, return a simple error response
                \Illuminate\Support\Facades\Log::error('Payment callback redirect failed', [
                    'error' => $redirectException->getMessage(),
                ]);
                return response('Payment processing error. Please contact support.', 500);
            }
        }
    }

    /**
     * Payment error callback handler
     */
    public function paymentErrorCallback(Request $request)
    {
        return app(\App\Http\Controllers\PaymentCallbackController::class)->error($request);
    }

    /**
     * Payment webhook handler
     */
    public function paymentWebhook(Request $request)
    {
        return app(\App\Http\Controllers\PaymentCallbackController::class)->webhook($request);
    }
}

