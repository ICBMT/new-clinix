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
        Schema::create('clinic_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('payout_reference')->unique(); // Unique payout reference
            $table->decimal('total_amount', 18, 2); // Total amount to be paid
            $table->decimal('commission_deducted', 18, 2); // Total commission deducted
            $table->decimal('net_amount', 18, 2); // Net amount after commission
            $table->string('currency', 3)->default('KWD');
            $table->enum('status', ['pending', 'approved'])->default('pending');
            $table->enum('frequency', ['daily', 'weekly', 'bi_weekly', 'monthly', 'manual'])->default('monthly');
            $table->date('payout_date'); // Scheduled payout date
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('date_approved')->nullable();
            $table->string('bank_reference')->nullable(); // Bank transaction reference
            $table->string('bank_reference_id')->nullable(); // Bank reference ID (required when approved)
            $table->text('admin_notes')->nullable();
            $table->text('failure_reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['clinic_id', 'status']);
            $table->index(['payout_date', 'status']);
            $table->index(['frequency', 'status']);
            $table->index('payout_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_payouts');
    }
};

