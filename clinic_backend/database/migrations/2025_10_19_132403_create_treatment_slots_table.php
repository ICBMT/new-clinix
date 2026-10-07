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
        // Create treatment_slots table (as per SRS 4.1.7)
        Schema::create('treatment_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();
            $table->date('slot_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('buffer_time_minutes')->nullable();
            $table->integer('max_bookings_per_slot')->nullable();
            $table->integer('slot_duration')->nullable();
            $table->enum('status', ['available', 'booked', 'blocked', 'maintenance'])->default('available');
            $table->decimal('price', 18, 2)->nullable(); // Override price for this slot
            $table->text('notes_en')->nullable();
            $table->text('notes_ar')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['treatment_id', 'slot_date']);
            $table->index('slot_date');
            $table->index('start_time');
            $table->index('end_time');
            $table->index('status');
            $table->index('price');
            $table->index(['treatment_id', 'slot_date', 'status']);
            $table->unique(['treatment_id', 'slot_date', 'start_time']);
            $table->unique(['treatment_id', 'slot_date', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatment_slots');
    }
};

