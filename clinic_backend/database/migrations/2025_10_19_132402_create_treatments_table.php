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
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('preparation_instructions_en')->nullable();
            $table->text('preparation_instructions_ar')->nullable();
            $table->text('aftercare_instructions_en')->nullable();
            $table->text('aftercare_instructions_ar')->nullable();
            $table->text('side_effects_en')->nullable();
            $table->text('side_effects_ar')->nullable();
            $table->text('warnings_en')->nullable();
            $table->text('warnings_ar')->nullable();
            $table->decimal('base_price', 18, 2)->nullable();
            $table->decimal('final_price', 18, 2)->nullable();
            $table->string('currency', 3)->default('KWD');
            // Note: working_days, daily_start_time, daily_end_time, min_advance_booking_hours, 
            // max_advance_booking_days, buffer_time_minutes moved to clinics table
            $table->integer('service_duration_minutes')->nullable(); // Duration in minutes
            $table->boolean('is_featured')->default(false); // Featured service
            $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->softDeletes();
            $table->timestamps();
            
            // Treatment specifications
            $table->json('suitable_for_skin_types')->nullable(); // ['oily', 'dry', 'combination', 'sensitive']
            $table->json('suitable_for_conditions')->nullable(); // ['acne', 'wrinkles', 'scars', etc.]
            $table->integer('min_age')->nullable();
            $table->integer('max_age')->nullable();
            $table->enum('gender_restriction', ['male', 'female', 'both'])->default('both');
            
            // Treatment process
            $table->json('treatment_steps_en')->nullable(); // Array of step descriptions
            $table->json('treatment_steps_ar')->nullable();
            $table->integer('estimated_recovery_days')->nullable();
            $table->integer('sessions_required')->default(1);
            $table->integer('max_sessions')->nullable()->comment('Maximum number of sessions allowed for this treatment');
            $table->integer('sessions_interval_days')->nullable(); // Days between sessions
            
            // Media and content
            $table->string('video_url')->nullable();
            $table->json('faq')->nullable(); // [{"question_en": "...", "question_ar": "...", "answer_en": "...", "answer_ar": "..."}]
            
            // Additional metadata
            $table->boolean('requires_consultation')->default(false);
            $table->boolean('requires_medical_clearance')->default(false);
            $table->integer('popularity_score')->default(0);
            $table->timestamp('featured_until')->nullable();
            
            // SEO and display
            $table->string('slug_en')->nullable();
            $table->string('slug_ar')->nullable();
            $table->text('meta_description_en')->nullable();
            $table->text('meta_description_ar')->nullable();
            $table->string('meta_keywords_en')->nullable();
            $table->string('meta_keywords_ar')->nullable();
            
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('total_reviews')->default(0);
            $table->integer('total_bookings')->default(0);
            
            // Indexes for performance
            $table->index(['clinic_id', 'status']);
            $table->index(['category_id', 'status']);
            $table->index(['status', 'is_featured']);
            $table->index('average_rating');
            $table->index('base_price');
            $table->index(['status', 'average_rating']);
        });

        // Create machine_treatment pivot table (many-to-many relationship)
        Schema::create('machine_treatment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['machine_id', 'treatment_id']);
            $table->index('machine_id');
            $table->index('treatment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machine_treatment');
        Schema::dropIfExists('treatments');
    }
};