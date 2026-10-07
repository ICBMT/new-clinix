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
        Schema::create('clinic_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('subscription_package_id')->constrained('subscription_packages')->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->cascadeOnDelete();
            $table->decimal('amount_paid', 18, 2)->default(0);
            $table->string('currency', 3)->default('KWD');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status')->default('active');
            $table->boolean('auto_renew')->default(false);
            $table->string('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['clinic_id', 'status']);
            $table->index(['subscription_package_id', 'status']);
            $table->index(['status', 'end_date']);
            $table->index(['clinic_id', 'end_date']);
            $table->index(['clinic_id', 'status', 'end_date']); // For finding active subscriptions
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_subscriptions');
    }
};
