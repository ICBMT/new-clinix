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
        Schema::table('clinics', function (Blueprint $table) {
            // Rescheduling buffer time in hours (can override site default)
            $table->integer('rescheduling_buffer_hours')->nullable()->after('reschedule_policy_ar');
            
            // Refund policy settings (can override site defaults)
            $table->enum('refund_policy_type', ['full', 'partial', 'fixed'])->nullable()->after('rescheduling_buffer_hours');
            $table->decimal('refund_policy_percentage', 5, 2)->nullable()->after('refund_policy_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn([
                'rescheduling_buffer_hours',
                'refund_policy_type',
                'refund_policy_percentage',
            ]);
        });
    }
};
