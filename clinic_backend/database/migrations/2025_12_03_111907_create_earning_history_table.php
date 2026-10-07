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
        Schema::create('earning_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('earning_id')->constrained('clinic_earnings')->cascadeOnDelete();
            $table->foreignId('payout_id')->nullable()->constrained('clinic_payouts')->onDelete('set null');
            $table->string('payout_reference', 255); // Reference for this specific payout transaction
            $table->decimal('amount_paid', 18, 2); // Amount paid in this transaction
            $table->decimal('remaining_amount_before', 18, 2)->nullable(); // Remaining amount before this payment
            $table->decimal('remaining_amount_after', 18, 2)->nullable(); // Remaining amount after this payment
            $table->string('currency', 3)->default('KWD');
            $table->text('notes')->nullable(); // Notes for this specific payout
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at');
            $table->timestamps();
            
            // Indexes for performance
            $table->index('earning_id');
            $table->index('payout_id');
            $table->index('payout_reference');
            $table->index('processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earning_history');
    }
};
