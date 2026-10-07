<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Contracts\FAQRepositoryInterface;
use App\Contracts\SupportRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private readonly FAQRepositoryInterface $faqRepository,
        private readonly SupportRepositoryInterface $supportRepository
    ) {}

    /**
     * FAQs list
     */
    public function faqs(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $category = $request->get('category');
            $faqs = $this->faqRepository->getFAQs($category);

            return response()->json([
                'success' => true,
                'data' => [
                    'faqs' => $faqs,
                ]
            ]);
        });
    }

    /**
     * Get contact support information from site settings
     */
    public function getContactInfo(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Get locale from Accept-Language header or default to app locale
            $locale = $request->header('Accept-Language');
            
            // Get contact information - prioritize contact_* keys, fallback to support_* keys
            $email = \App\Services\SiteSettingsService::get('contact_email') ?: \App\Services\SiteSettingsService::get('support_email');
            $phone = \App\Services\SiteSettingsService::get('contact_phone') ?: \App\Services\SiteSettingsService::get('support_phone');
            $whatsapp = \App\Services\SiteSettingsService::get('contact_whatsapp') ?: \App\Services\SiteSettingsService::get('support_whatsapp');
            $instagram = \App\Services\SiteSettingsService::get('contact_instagram') ?: \App\Services\SiteSettingsService::get('support_instagram');
            $facebook = \App\Services\SiteSettingsService::get('contact_facebook');
            $twitter = \App\Services\SiteSettingsService::get('contact_twitter');
            $linkedin = \App\Services\SiteSettingsService::get('contact_linkedin');
            
            // Get contact images
            $whatsappImage = \App\Services\SiteSettingsService::get('contact_whatsapp_image');
            $instagramImage = \App\Services\SiteSettingsService::get('contact_instagram_image');
            $facebookImage = \App\Services\SiteSettingsService::get('contact_facebook_image');
            $twitterImage = \App\Services\SiteSettingsService::get('contact_twitter_image');
            $linkedinImage = \App\Services\SiteSettingsService::get('contact_linkedin_image');
            
            // Helper function to get image URL or fallback to default icon
            $getIconUrl = function($image, $defaultIcon) {
                if ($image && trim($image) !== '') {
                    // If it's already a full URL, return as is
                    if (filter_var($image, FILTER_VALIDATE_URL)) {
                        return $image;
                    }
                    // Convert storage path to full URL
                    $path = ltrim($image, '/');
                    // Handle different path formats
                    if (str_starts_with($path, 'storage/')) {
                        return asset($path);
                    }
                    // If path doesn't start with storage/, add it
                    if ($path && !str_starts_with($path, 'http')) {
                        return asset('storage/' . $path);
                    }
                    return $image;
                }
                return asset('images/icons/' . $defaultIcon);
            };
            
            // Build contact list with icon URLs - only include contacts that have actual values
            $contacts = [];
            
            if ($email && trim($email) !== '') {
                $contacts[] = [
                    'type' => 'email',
                    'value' => trim($email),
                    'icon_url' => asset('images/icons/email.svg'),
                ];
            }
            
            if ($phone && trim($phone) !== '') {
                $contacts[] = [
                    'type' => 'phone',
                    'value' => trim($phone),
                    'icon_url' => asset('images/icons/phone.svg'),
                ];
            }
            
            // Include WhatsApp only if value has value
            if ($whatsapp && trim($whatsapp) !== '') {
                $contacts[] = [
                    'type' => 'whatsapp',
                    'value' => trim($whatsapp),
                    'icon_url' => $getIconUrl($whatsappImage, 'whatsapp.svg'),
                ];
            }
            
            // Include Instagram only if URL has value (image alone is not enough)
            if ($instagram && trim($instagram) !== '') {
                $contacts[] = [
                    'type' => 'instagram',
                    'value' => trim($instagram),
                    'icon_url' => $getIconUrl($instagramImage, 'instagram.svg'),
                ];
            }
            
            // Include Facebook only if URL has value (image alone is not enough)
            if ($facebook && trim($facebook) !== '') {
                $contacts[] = [
                    'type' => 'facebook',
                    'value' => trim($facebook),
                    'icon_url' => $getIconUrl($facebookImage, 'facebook.svg'),
                ];
            }
            
            // Include Twitter only if URL has value (image alone is not enough)
            if ($twitter && trim($twitter) !== '') {
                $contacts[] = [
                    'type' => 'twitter',
                    'value' => trim($twitter),
                    'icon_url' => $getIconUrl($twitterImage, 'twitter.svg'),
                ];
            }
            
            // Include LinkedIn only if URL has value (image alone is not enough)
            if ($linkedin && trim($linkedin) !== '') {
                $contacts[] = [
                    'type' => 'linkedin',
                    'value' => trim($linkedin),
                    'icon_url' => $getIconUrl($linkedinImage, 'linkedin.svg'),
                ];
            }
            
            // Get address
            $address = \App\Services\SiteSettingsService::getLocalized('contact_address', null, $locale) 
                ?: \App\Services\SiteSettingsService::getLocalized('support_address', null, $locale);
            
            // Build contact info object, only including fields that have values
            $contactInfo = [];
            
            if ($email && trim($email) !== '') {
                $contactInfo['email'] = $email;
            }
            
            if ($phone && trim($phone) !== '') {
                $contactInfo['phone'] = $phone;
            }
            
            if ($whatsapp && trim($whatsapp) !== '') {
                $contactInfo['whatsapp'] = $whatsapp;
            }
            
            if ($instagram && trim($instagram) !== '') {
                $contactInfo['instagram'] = $instagram;
            }
            
            if ($facebook && trim($facebook) !== '') {
                $contactInfo['facebook'] = $facebook;
            }
            
            if ($twitter && trim($twitter) !== '') {
                $contactInfo['twitter'] = $twitter;
            }
            
            if ($linkedin && trim($linkedin) !== '') {
                $contactInfo['linkedin'] = $linkedin;
            }
            
            if ($address && trim($address) !== '') {
                $contactInfo['address'] = $address;
            }
            
            // Always include contacts array (already filtered to only include contacts with values or images)
            $contactInfo['contacts'] = $contacts;

            return response()->json([
                'success' => true,
                'data' => $contactInfo,
            ]);
        });
    }
}
