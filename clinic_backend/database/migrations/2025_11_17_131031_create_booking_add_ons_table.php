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
        Schema::create('booking_add_ons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('treatment_add_on_id')->constrained('treatment_add_ons')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 18, 2);
            $table->timestamps();

            // Indexes
            $table->index('booking_id');
            $table->index('treatment_add_on_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_add_ons');
    }
};
