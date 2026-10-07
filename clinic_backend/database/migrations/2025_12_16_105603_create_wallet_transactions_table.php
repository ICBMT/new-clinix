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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'penalty', 'topup']);
            $table->decimal('amount', 18, 2);
            $table->decimal('balance_before', 18, 2);
            $table->decimal('balance_after', 18, 2);
            $table->string('currency', 3)->default('KWD');
            $table->text('description')->nullable();
            $table->string('reference')->nullable();
            $table->nullableMorphs('reference'); // reference_id and reference_type for polymorphic relations
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->softDeletes();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['wallet_id', 'type']);
            $table->index(['user_id', 'status']);
            $table->index('created_at'); // For date filtering
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
