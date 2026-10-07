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
        Schema::create('booking_reasons', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['cancellation', 'rescheduling'])->index();
            $table->string('title_en');
            $table->string('title_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add foreign key constraints to bookings table
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign('cancellation_reason_id')->references('id')->on('booking_reasons')->nullOnDelete();
            $table->foreign('reschedule_reason_id')->references('id')->on('booking_reasons')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key constraints from bookings table
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['cancellation_reason_id']);
            $table->dropForeign(['reschedule_reason_id']);
        });

        Schema::dropIfExists('booking_reasons');
    }
};
