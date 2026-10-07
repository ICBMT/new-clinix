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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique()->nullable();
            $table->nullableMorphs('transactionable');
            $table->string('type')->nullable(); // booking refund payout subscription commission
            $table->decimal('amount', 18, 2)->default(0);
            $table->string('currency', 3)->default('KWD');
            $table->string('payment_method')->nullable();
            $table->string('status')->nullable(); // pending processing completed failed cancelled refunded
            $table->longText('failure_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
