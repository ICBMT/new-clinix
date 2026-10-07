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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('payment_method_id')->nullable();
            $table->string('payment_method_ar')->nullable();
            $table->string('payment_method_en')->nullable();
            $table->string('payment_method_code')->nullable();
            $table->boolean('is_direct_payment')->default(false);
            $table->decimal('service_charge', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->string('currency_iso')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_embedded_supported')->default(false);
            $table->string('payment_currency_iso')->nullable();
            $table->string('status')->default('active');
            
            // Platform-specific support
            $table->boolean('is_ios_supported')->default(true);
            $table->boolean('is_android_supported')->default(true);
            $table->boolean('is_web_supported')->default(true);
            
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};