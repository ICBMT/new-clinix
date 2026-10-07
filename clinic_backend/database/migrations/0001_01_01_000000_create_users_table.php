<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('default_language')->default('en');
            $table->string('name');
            $table->string('email')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('phone')->unique()->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password');
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->string('avatar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('social_id')->nullable();
            $table->string('social_type')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            // Note: Roles are managed by Spatie Permission package via model_has_roles table
            // This field is kept for backward compatibility and quick filtering only
            
            // Medical Profile Fields
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('blood_type', 5)->nullable(); // A+, B-, O+, AB+, etc.
            $table->json('medical_history')->nullable(); // Array of medical conditions
            $table->json('allergies')->nullable(); // Array of allergies
            $table->json('current_medications')->nullable(); // Array of medications
            $table->enum('skin_type', ['normal', 'oily', 'dry', 'combination', 'sensitive', 'fair', 'medium', 'dark'])->nullable();
            $table->json('medical_conditions')->nullable(); // Array of conditions
            $table->json('last_machine_used')->nullable(); // Array of machine IDs
            $table->string('last_machine_used_name')->nullable(); // Name for "other" option
            $table->json('restricted_machines')->nullable(); // Array of restricted machine IDs
            $table->string('restricted_machines_name')->nullable(); // Name for "other" option
            $table->integer('age')->nullable();
            
            // Emergency contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable(); // 'spouse', 'parent', 'sibling', etc.
            
            // Medical profile completion
            $table->boolean('medical_profile_completed')->default(false);
            $table->timestamp('medical_profile_completed_at')->nullable();
            
            // Admin commission percentage (default 10%)
            $table->decimal('admin_commission', 5, 2)->default(10.00)->nullable();
            
            $table->softDeletes();
            $table->rememberToken();
            $table->timestamps();

            // Performance indexes for search, filter, and sort operations
            // Single column indexes
            $table->index('name', 'idx_users_name');
            $table->index('status', 'idx_users_status');
            $table->index('phone_verified_at', 'idx_users_phone_verified_at');
            $table->index('email_verified_at', 'idx_users_email_verified_at');
            $table->index('last_login_at', 'idx_users_last_login_at');
            $table->index('created_at', 'idx_users_created_at');
            $table->index('updated_at', 'idx_users_updated_at');
            $table->index('deleted_at', 'idx_users_deleted_at');
            $table->index('social_id', 'idx_users_social_id');
            $table->index('social_type', 'idx_users_social_type');

            // Composite indexes for common query patterns
            $table->index(['status', 'created_at'], 'idx_users_status_created');
            $table->index(['created_at', 'status'], 'idx_users_created_status');
            $table->index(['deleted_at', 'status'], 'idx_users_deleted_status');
            $table->index(['social_type', 'social_id'], 'idx_users_social_lookup');
            // Note: Role indexes are handled by Spatie Permission's model_has_roles table
        });

        // Add full-text search index for text fields (MySQL 5.6+)
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE users ADD FULLTEXT INDEX idx_users_fulltext (name, email, phone, description_en, description_ar)');
        }

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('token', 512);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
