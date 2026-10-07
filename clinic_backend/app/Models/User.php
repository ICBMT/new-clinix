<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\LogsActivity;
use App\Traits\CascadesDeletes;
use App\Models\Clinic;
use App\Models\Review;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, SoftDeletes, Notifiable, TwoFactorAuthenticatable, HasRoles, LogsActivity, CascadesDeletes, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'default_language',
        'name',
        'email',
        'email_verified_at',
        'phone',
        'phone_verified_at',
        'password',
        'avatar',
        'description_en',
        'description_ar',
        'social_id',
        'social_type',
        'last_login_at',
        'status',
        // Medical profile fields
        'date_of_birth',
        'gender',
        'blood_type',
        'medical_history',
        'allergies',
        'current_medications',
        'skin_type',
        'medical_conditions',
        'last_machine_used',
        'last_machine_used_name',
        'restricted_machines',
        'restricted_machines_name',
        'age',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'medical_profile_completed',
        'medical_profile_completed_at',
        'admin_commission',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'notification_settings',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'medical_history' => 'array',
            'allergies' => 'array',
            'current_medications' => 'array',
            'medical_conditions' => 'array',
            'last_machine_used' => 'array',
            'restricted_machines' => 'array',
            'medical_profile_completed' => 'boolean',
            'medical_profile_completed_at' => 'datetime',
            'admin_commission' => 'decimal:2',
            'two_factor_confirmed_at' => 'datetime',
            'notification_settings' => 'array',
        ];
    }
    
    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        /**
         * Handle soft deletion with data anonymization for privacy compliance.
         * This anonymizes personal data before soft deleting the user.
         */
        static::deleting(function ($model) {
            // Create unique identifier with microtime and random element
            $uniqueId = now()->format('YmdHis') . '_' . substr(microtime(), 2, 6) . '_' . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
            
            // Anonymize personal data with unique timestamp for audit trail
            if ($model->name) {
                $model->name = $model->name . "_" . $uniqueId . "_Del";
            }
            
            if ($model->email) {
                $model->email = $model->email . "_" . $uniqueId . "_Del";
            }
            
            if ($model->phone) {
                $model->phone = $model->phone . "_" . $uniqueId . "_Del";
            }
            
            if ($model->social_id) {
                $model->social_id = $model->social_id . "_" . $uniqueId . "_Del";
            }
            
            // Save the anonymized data before soft deletion
            $model->save();
            
            // Cascade delete related data
            $model->cascadeDelete();
        });
    }

    /**
     * Get the user's profile (first owned clinic - backward compatibility).
     */
    public function profile()
    {
        return $this->hasOne(Clinic::class, 'owner_id');
    }

    /**
     * Get the device tokens for the user.
     */
    public function deviceTokens()
    {
        return $this->hasMany(DeviceToken::class);
    }

    /**
     * Get the notifications for the user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'recipient_id');
    }

    /**
     * Get the password reset tokens for the user (by email).
     */
    public function passwordResetTokensByEmail()
    {
        return $this->hasMany(PasswordResetToken::class, 'email', 'email');
    }

    /**
     * Get the password reset tokens for the user (by phone).
     */
    public function passwordResetTokensByPhone()
    {
        return $this->hasMany(PasswordResetToken::class, 'phone', 'phone');
    }

    /**
     * Get user's default language
     */
    public function getDefaultLanguage(): string
    {
        return $this->default_language ?? config('app.locale', 'en');
    }

    // Clinic Relationships
    /**
     * Get clinics owned by this user
     */
    public function ownedClinics()
    {
        return $this->hasMany(Clinic::class, 'owner_id');
    }

    /**
     * Get all clinics this user is associated with (owned or member)
     */
    public function clinics()
    {
        return $this->belongsToMany(Clinic::class, 'clinic_users', 'user_id', 'clinic_id')
            ->withTimestamps();
    }

    /**
     * Get all clinics (owned + member)
     */
    public function allClinics()
    {
        $owned = $this->ownedClinics;
        $member = $this->clinics;
        return $owned->merge($member)->unique('id');
    }


    /**
     * Backward compatibility - get vendor profile (first owned clinic)
     */
    public function vendorProfile()
    {
        return $this->profile();
    }

    /**
     * Get the bookings for the vendor.
     */
    public function vendorBookings()
    {
        return $this->hasMany(Booking::class, 'vendor_id');
    }

    /**
     * Get the bookings for the user.
     */
    public function userBookings()
    {
        return $this->hasMany(Booking::class, 'user_id');
    }

    /**
     * Get the bookings for the user (alias for userBookings).
     */
    public function bookings()
    {
        return $this->userBookings();
    }

    /**
     * Get the reviews for the vendor (through owned clinics).
     */
    public function vendorReviews()
    {
        $clinicIds = $this->ownedClinics()->pluck('id');
        return Review::whereIn('clinic_id', $clinicIds);
    }

    /**
     * Get the reviews for the user.
     */
    public function userReviews()
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    /**
     * Get the coupons for the vendor.
     */
    public function coupons()
    {
        return $this->hasMany(Coupon::class, 'vendor_id');
    }

    /**
     * Get the vendor subscriptions for the user.
     */
    public function vendorSubscriptions()
    {
        return $this->hasMany(VendorSubscription::class, 'vendor_id');
    }

    /**
     * Get the vendor documents for the user.
     */
    // public function vendorDocuments()
    // {
    //     return $this->hasMany(VendorDocument::class, 'vendor_id');
    // }

    /**
     * Get the vendor reports for the user.
     */
    public function vendorReports()
    {
        return $this->hasMany(VendorReport::class, 'vendor_id');
    }

    /**
     * Get the user reports for the user.
     */
    public function userReports()
    {
        return $this->hasMany(VendorReport::class, 'user_id');
    }


    /**
     * Get the favorites for the user.
     */
    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * Get the service packages for the user.
     */
    public function servicePackages()
    {
        return $this->hasMany(ServicePackage::class);
    }

    /**
     * Get the loyalty points for the user.
     */
    public function loyaltyPoints()
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    /**
     * Get the loyalty tracker for the user.
     */
    public function loyaltyTracker()
    {
        return $this->hasOne(LoyaltyTracker::class);
    }

    /**
     * Get the coupon usages for the user.
     */
    public function couponUsages()
    {
        return $this->hasMany(CouponUsage::class);
    }

    /**
     * Get the transactions for the user.
     */
    public function userTransactions()
    {
        return $this->hasMany(Transaction::class, 'user_id');
    }

    /**
     * Get the transactions for the vendor.
     */
    public function vendorTransactions()
    {
        return $this->hasMany(Transaction::class, 'vendor_id');
    }

    /**
     * Get the booking cancellation policies for the vendor.
     */
    public function bookingCancellationPolicies()
    {
        return $this->hasMany(BookingCancellationPolicy::class, 'vendor_id');
    }

    /**
     * Get the area for the user
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the media for the user.
     */
    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get the user images.
     */
    public function images()
    {
        return $this->morphMany(Media::class, 'mediable')->where('collection_name', 'images');
    }

    /**
     * Get the user documents.
     */
    public function documents()
    {
        return $this->morphMany(Media::class, 'mediable')->where('collection_name', 'documents');
    }

    /**
     * Get the addresses for the user.
     */
    public function addresses()
    {
        return $this->hasMany(Address::class);
    }


    // Vendor Scopes
    /**
     * Scope to get vendors.
     */
    public function scopeVendors($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('name', 'vendor');
        });
    }

    /**
     * Scope to get active vendors.
     */
    public function scopeActiveVendors($query)
    {
        return $query->vendors()->where('status', 'active');
    }

    /**
     * Scope to get inactive vendors.
     */
    public function scopeInactiveVendors($query)
    {
        return $query->vendors()->where('status', 'inactive');
    }

    /**
     * Scope to get featured vendors.
     */
    public function scopeFeaturedVendors($query)
    {
        return $query->vendors()->whereHas('profile', function ($q) {
            $q->where('is_featured', true);
        });
    }

    /**
     * Scope to get vendors by city.
     */
    public function scopeVendorsByCity($query, $city)
    {
        return $query->vendors()->whereHas('profile', function ($q) use ($city) {
            $q->where('city', $city);
        });
    }

    /**
     * Scope to order vendors by rating.
     */
    public function scopeVendorsByRating($query)
    {
        return $query->vendors()->whereHas('profile')->orderBy('clinics.average_rating', 'desc');
    }

    // Vendor Helper Methods
    /**
     * Check if user is a vendor.
     */
    public function isVendor(): bool
    {
        return $this->hasRole('vendor');
    }

    /**
     * Check if vendor is active.
     */
    public function isVendorActive(): bool
    {
        return $this->isVendor() && $this->status === 'active';
    }

    /**
     * Check if vendor is inactive.
     */
    public function isVendorInactive(): bool
    {
        return $this->isVendor() && $this->status === 'inactive';
    }

    /**
     * Check if vendor is featured.
     */
    public function isVendorFeatured(): bool
    {
        return $this->isVendor() && $this->profile?->is_featured;
    }

    /**
     * Get vendor's current subscription.
     */
    public function getCurrentSubscription()
    {
        return $this->vendorSubscriptions()
            ->where('status', 'active')
            ->where('end_date', '>=', now())
            ->orderBy('end_date', 'desc')
            ->first();
    }

    /**
     * Check if vendor has active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->getCurrentSubscription() !== null;
    }

    /**
     * Get assigned clinic IDs for clinic manager
     * Returns array of clinic IDs the user is assigned to (via clinic_users pivot table)
     */
    public function getAssignedClinicIds(): array
    {
        return $this->clinics()->pluck('clinics.id')->toArray();
    }

    /**
     * Get owned clinic IDs for clinic owner
     * Returns array of clinic IDs owned by the user
     */
    public function getOwnedClinicIds(): array
    {
        return $this->ownedClinics()->pluck('id')->toArray();
    }

    /**
     * Get all accessible clinic IDs (owned + assigned)
     * For clinic role: returns owned clinic IDs
     * For clinic_manager role: returns assigned clinic IDs
     * For super-admin: returns empty array (can access all)
     */
    public function getAccessibleClinicIds(): array
    {
        if ($this->hasRole('super-admin')) {
            return []; // Empty means no filter (access all)
        }

        if ($this->hasRole('clinic')) {
            return $this->getOwnedClinicIds();
        }

        if ($this->hasRole('clinic_manager')) {
            return $this->getAssignedClinicIds();
        }

        return [];
    }

    /**
     * Check if user can access a specific clinic
     */
    public function canAccessClinic(int $clinicId): bool
    {
        if ($this->hasRole('super-admin')) {
            return true;
        }

        $accessibleIds = $this->getAccessibleClinicIds();
        return in_array($clinicId, $accessibleIds);
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    /**
     * Check if user is clinic owner
     */
    public function isClinicOwner(): bool
    {
        return $this->hasRole('clinic');
    }

    /**
     * Check if user is clinic manager
     */
    public function isClinicManager(): bool
    {
        return $this->hasRole('clinic_manager');
    }
}
