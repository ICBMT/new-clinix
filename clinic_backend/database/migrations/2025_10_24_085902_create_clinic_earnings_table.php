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
        Schema::create('clinic_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->decimal('gross_amount', 18, 2); // Total booking amount
            $table->decimal('commission_rate', 5, 2); // Commission percentage (e.g., 10.00 for 10%)
            $table->decimal('commission_amount', 18, 2); // Amount deducted as commission
            $table->decimal('net_amount', 18, 2); // Amount clinic receives (gross - commission)
            $table->string('currency', 3)->default('KWD');
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->foreignId('payout_id')->nullable()->constrained('clinic_payouts')->onDelete('set null');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['clinic_id', 'status']);
            $table->index(['booking_id']);
            $table->index(['payout_id']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_earnings');
    }
};

