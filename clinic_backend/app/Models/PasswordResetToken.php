<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class PasswordResetToken extends Model
{
    use HasFactory, LogsActivity;

    /**
     * The table associated with the model.
     */
    protected $table = 'password_reset_tokens';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'id',
        'phone',
        'email',
        'token',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns the password reset token.
     */
    public function user(): BelongsTo
    {
        // Try to find user by phone first, then by email
        if ($this->phone) {
            return $this->belongsTo(User::class, 'phone', 'phone');
        }
        
        return $this->belongsTo(User::class, 'email', 'email');
    }

    /**
     * Check if the token is expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at) {
            return $this->expires_at->isPast();
        }
        
        // Fallback to 1 hour from created_at if expires_at is null
        return $this->created_at->addHour()->isPast();
    }

    /**
     * Scope to get valid (non-expired) tokens.
     */
    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->where('expires_at', '>', now())
              ->orWhere(function ($subQ) {
                  $subQ->whereNull('expires_at')
                       ->where('created_at', '>', now()->subHour());
              });
        });
    }

    /**
     * Create or update a password reset token for a phone number.
     */
    public static function createForPhone(string $phone, string $token, int $expirationMinutes = 60): self
    {
        return self::updateOrCreate(
            ['phone' => $phone],
            [
                'id' => uniqid('phone_', true),
                'token' => $token,
                'expires_at' => now()->addMinutes($expirationMinutes),
                'created_at' => now(),
            ]
        );
    }

    /**
     * Create or update a password reset token for an email address.
     */
    public static function createForEmail(string $email, string $token, int $expirationMinutes = 60): self
    {
        return self::updateOrCreate(
            ['email' => $email],
            [
                'id' => uniqid('email_', true),
                'token' => $token,
                'expires_at' => now()->addMinutes($expirationMinutes),
                'created_at' => now(),
            ]
        );
    }

    /**
     * Find a valid token for a phone number.
     */
    public static function findValidForPhone(string $phone): ?self
    {
        return self::where('phone', $phone)
            ->valid()
            ->first();
    }

    /**
     * Find a valid token for an email address.
     */
    public static function findValidForEmail(string $email): ?self
    {
        return self::where('email', $email)
            ->valid()
            ->first();
    }

    /**
     * Delete token for a phone number.
     */
    public static function deleteForPhone(string $phone): bool
    {
        return self::where('phone', $phone)->delete() > 0;
    }

    /**
     * Delete token for an email address.
     */
    public static function deleteForEmail(string $email): bool
    {
        return self::where('email', $email)->delete() > 0;
    }

    /**
     * Clean up expired tokens.
     */
    public static function cleanupExpired(): int
    {
        return self::where(function ($q) {
            $q->where('expires_at', '<', now())
              ->orWhere(function ($subQ) {
                  $subQ->whereNull('expires_at')
                       ->where('created_at', '<', now()->subHour());
              });
        })->delete();
    }
}