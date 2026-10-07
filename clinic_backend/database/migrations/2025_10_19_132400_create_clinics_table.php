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
        Schema::create('clinics', function (Blueprint $table) {
            $table->id();

            // Foreign key to users table (owner/clinic manager)
            $table->unsignedBigInteger('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            
            // Foreign key to categories table
            $table->unsignedBigInteger('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();

            // Clinic Profile Fields (as per SRS 4.2.9, 4.2.12)
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->text('address')->nullable(); // Address with map lookup
            $table->string('phone')->nullable();
            $table->string('email')->nullable(); // Clinic email
            $table->string('logo')->nullable();

            // Address fields (removed duplicate address field above)
            $table->foreignId('governorate_id')->nullable()->constrained('governorates')->onDelete('set null');
            $table->foreignId('area_id')->nullable()->constrained('areas')->onDelete('set null');
            $table->string('block')->nullable();
            $table->string('street')->nullable();
            $table->string('avenue')->nullable();
            $table->string('house')->nullable();
            $table->string('floor')->nullable();
            $table->string('apt')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('Kuwait');
            $table->string('postal_code')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            // Clinic description/bio
            $table->text('bio_en')->nullable();
            $table->text('bio_ar')->nullable();

            // Status (as per SRS 4.3.2: Pending, Active, Suspended)
            $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
            $table->text('rejection_reason')->nullable(); // If rejected during KYC
            $table->timestamp('approved_at')->nullable();

            // Ratings and stats
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('total_reviews')->default(0);
            $table->integer('total_bookings')->default(0);
            $table->boolean('is_featured')->default(false);

            // Booking settings
            $table->boolean('auto_confirm_bookings')->default(false);
            $table->integer('slot_duration_minutes')->default(30); // Dynamic slot durations per clinic (SRS 2.5)

            // Notification preferences (as per SRS 4.2.9)
            $table->boolean('new_booking_alerts')->default(true);
            $table->boolean('cancellation_alerts')->default(true);
            $table->boolean('review_alerts')->default(true);
            $table->boolean('email_notifications_enabled')->default(false);
            $table->string('notification_email')->nullable();

            // Cancellation Policy (as per SRS)
            $table->longText('cancellation_policy_en')->nullable();
            $table->longText('cancellation_policy_ar')->nullable();

            // Refund Policy (as per SRS)
            $table->longText('refund_policy_en')->nullable();
            $table->longText('refund_policy_ar')->nullable();

            // Rescheduling Policy
            $table->longText('rescheduling_policy_en')->nullable();
            $table->longText('rescheduling_policy_ar')->nullable();

            // Subscription reference (foreign key will be added in clinic_subscriptions migration)
            $table->unsignedBigInteger('subscription_id')->nullable();

            $table->softDeletes();
            $table->timestamps();

            // Indexes for performance
            $table->index(['owner_id', 'status']);
            $table->index(['status', 'approved_at']);
            $table->index(['is_featured', 'average_rating']);
            $table->index(['average_rating', 'total_reviews']);
            $table->index(['total_bookings', 'average_rating']);
            $table->index('subscription_id');
            $table->index('status');
        });

        // Create clinic_operating_hours table (as per SRS 4.2.9)
        Schema::create('clinic_operating_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->boolean('is_open')->default(true);
            $table->boolean('closed_all_day')->default(false);
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->timestamps();

            $table->unique(['clinic_id', 'day_of_week']);
            $table->index('clinic_id');
        });

        // Create clinic_users pivot table for clinic managers and sub-admins (as per SRS 4.2.13)
        // Roles are managed by Spatie Permission, this table links users to clinics
        Schema::create('clinic_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['clinic_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_users');
        Schema::dropIfExists('clinic_operating_hours');
        Schema::dropIfExists('clinics');
    }
};
