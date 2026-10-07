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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique(); // Unique booking reference
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();
            $table->foreignId('machine_id')->nullable()->constrained('machines')->onDelete('set null');
            $table->integer('total_sessions')->default(1); // Number of sessions in this booking (as per SRS - can be up to 5
            $table->decimal('base_price', 18, 2)->nullable();
            $table->decimal('subtotal', 18, 2)->nullable();
            $table->decimal('tax_amount', 18, 2)->nullable();
            $table->decimal('total_amount', 18, 2)->nullable();
            $table->string('currency')->default('KWD');
            $table->enum('payment_type', ['full', 'partial'])->default('full');
            $table->decimal('deposit_amount', 18, 2)->nullable();
            $table->decimal('balance_amount', 18, 2)->nullable();
            $table->date('balance_due_date')->nullable();
            $table->enum('status', ['upcoming', 'accepted', 'cancelled', 'completed', 'past'])->default('upcoming');
            $table->enum('payment_status', ['pending', 'paid', 'refunded'])->default('pending');
            $table->text('special_instructions')->nullable();
            $table->text('notes')->nullable(); // Additional notes from user
            $table->text('cancellation_reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            // Medical information
            $table->text('medical_notes')->nullable();
            $table->json('medical_questionnaire')->nullable(); // Answers to pre-booking questions
            $table->json('medical_record_ids')->nullable();

            // Patient data - uses authenticated user's info if not provided
            $table->string('patient_name')->nullable();
            $table->string('patient_phone')->nullable();
            $table->integer('patient_age')->nullable();
            $table->enum('patient_gender', ['male', 'female', 'other'])->nullable();

            // Follow-up and rescheduling
            $table->foreignId('follow_up_booking_id')->nullable()->constrained('bookings')->onDelete('set null');
            $table->integer('reschedule_count')->default(0);
            $table->unsignedBigInteger('reschedule_reason_id')->nullable();
            $table->text('reschedule_reason')->nullable();
            $table->integer('cancellation_count')->default(0);
            $table->unsignedBigInteger('cancellation_reason_id')->nullable();

            // Documents
            $table->integer('documents_count')->default(0);

            // Payment
            $table->string('payment_transaction_id')->nullable();
            $table->string('payment_gateway')->nullable(); // 'myfatoorah', 'knet', 'wallet', 'cash'

            // Refund information
            $table->decimal('refund_amount', 18, 2)->nullable();
            $table->text('refund_reason')->nullable();
            $table->timestamp('refunded_at')->nullable();

            // Booking metadata
            $table->string('booking_source')->nullable(); // 'app', 'web', 'admin', 'walk_in'
            $table->text('internal_notes')->nullable(); // Notes visible only to admin/clinic
            $table->boolean('is_reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();

            // Rating and review
            $table->boolean('is_review_provided')->default(false);
            $table->timestamp('review_provided_at')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index('machine_id');
            $table->index('follow_up_booking_id');
            $table->index('payment_transaction_id');
            $table->index('booking_source');
            $table->index('cancellation_reason_id');
            $table->index('reschedule_reason_id');
            $table->index(['user_id', 'status']);
            $table->index(['clinic_id', 'status']);
            $table->index(['treatment_id', 'status']);
            $table->index(['status', 'payment_status']);
            $table->index('booking_reference');
        });

        // Create booking_sessions table for multiple sessions per booking (as per SRS - multiple dates/times)
        Schema::create('booking_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('treatment_slot_id')->nullable()->constrained('treatment_slots')->cascadeOnDelete();
            $table->date('slot_date')->nullable();
            $table->time('slot_time')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->timestamps();
            
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_sessions');
        Schema::dropIfExists('bookings');
    }
};
