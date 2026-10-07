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
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name'); // Custom name provided by user
            $table->string('file_path'); // Path to uploaded file (or reference to media table)
            $table->string('file_name'); // Original filename
            $table->string('file_type')->nullable(); // MIME type
            $table->unsignedBigInteger('file_size')->nullable(); // Size in bytes
            $table->string('document_type')->nullable(); // e.g., 'prescription', 'lab_report', 'xray', 'other'
            $table->text('description')->nullable(); // Optional description
            $table->date('record_date')->nullable(); // Date of the medical record
            $table->foreignId('clinic_id')->nullable()->constrained('clinics')->onDelete('set null'); // If associated with a clinic
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->onDelete('set null'); // If uploaded during booking
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'document_type']);
            $table->index('clinic_id');
            $table->index('booking_id');
            $table->index('record_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};

