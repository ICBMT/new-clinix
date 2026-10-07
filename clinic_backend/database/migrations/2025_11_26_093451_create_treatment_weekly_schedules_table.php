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
        Schema::create('treatment_weekly_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->boolean('is_open')->default(true);
            $table->boolean('closed_all_day')->default(false);
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->integer('slot_duration')->nullable(); // Duration in minutes for each slot
            $table->integer('buffer_time_minutes')->nullable(); // Buffer time between slots
            $table->integer('max_bookings_per_slot')->nullable(); // Max bookings per time slot
            $table->decimal('price_override', 18, 2)->nullable(); // Override price for this day
            $table->text('notes_en')->nullable();
            $table->text('notes_ar')->nullable();
            $table->timestamps();

            $table->unique(['clinic_id', 'treatment_id', 'day_of_week'], 'tws_clinic_treatment_day_unique');
            $table->index(['clinic_id', 'treatment_id']);
            $table->index('clinic_id');
            $table->index('treatment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatment_weekly_schedules');
    }
};
