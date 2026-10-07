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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_id')->nullable()->constrained('treatments')->cascadeOnDelete();
            $table->integer('rating')->default(1);
            $table->text('comment')->nullable();
            $table->boolean('would_recommend')->default(false);
            $table->json('additional_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['booking_id', 'user_id']);
            $table->index(['clinic_id', 'rating']);
            $table->index('treatment_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};

