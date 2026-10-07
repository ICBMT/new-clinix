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
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->nullable()->constrained('clinics')->cascadeOnDelete(); // Nullable for global catalog
            $table->foreignId('category_id')->nullable()->constrained('categories')->cascadeOnDelete();
            $table->string('serial_number')->unique();
            $table->string('model_en')->nullable();
            $table->string('model_ar')->nullable();
            $table->string('manufacturer_en')->nullable();
            $table->string('manufacturer_ar')->nullable();
            $table->string('image')->nullable();
            $table->enum('status', ['ready', 'maintenance', 'busy'])->default('ready');
            $table->enum('request_status', ['pending', 'approved', 'rejected'])->nullable(); // For clinic machine requests
            $table->foreignId('requested_by_clinic_id')->nullable()->constrained('clinics')->cascadeOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['clinic_id', 'status']);
            $table->index(['request_status', 'requested_by_clinic_id']);
            $table->index('requested_by_clinic_id');
            $table->index('status');
            $table->index('serial_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machines');
    }
};
