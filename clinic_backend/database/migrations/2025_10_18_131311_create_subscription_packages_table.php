<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name_en');
            $table->string('name_ar');
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('price')->nullable(); // Use text for large amounts
            $table->string('currency', 3)->default('KWD');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->integer('duration_days')->default(30); // Duration in days
            $table->json('features')->nullable(); // Array of features
            $table->integer('max_services')->nullable(); // Maximum services allowed
            $table->integer('max_bookings_per_month')->nullable(); // Maximum bookings per month
            $table->integer('max_machines')->nullable();
            $table->integer('max_treatments')->nullable();
            
            // Storage & File Uploads
            $table->integer('document_storage_gb')->nullable();
            $table->integer('file_size_limit_mb')->nullable();
            
            $table->boolean('featured_listing')->default(false); // Featured listing included
            $table->boolean('priority_support')->default(false); // Priority support
            $table->boolean('analytics_access')->default(false); // Analytics access
            $table->boolean('basic_reports')->default(true);
            $table->boolean('advanced_reports')->default(false);
            $table->boolean('custom_branding')->default(false); // Custom branding
            
            // Promotional Banner Allowance
            $table->integer('banner_slots_per_month')->default(0);
            $table->integer('featured_clinic_listings')->default(0);
            $table->integer('featured_treatment_slots')->default(0);
            $table->integer('featured_machine_slots')->default(0);
            
            // Support & SLA
            $table->enum('support_tier', ['basic', 'premium'])->default('basic');
            $table->integer('training_sessions')->default(0);
            
            // Custom Domain
            $table->string('custom_domain')->nullable();
            
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['status', 'sort_order']);
            $table->index('billing_cycle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_packages');
    }
};