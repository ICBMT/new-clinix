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
            // Add reschedule policy fields (if they don't exist)
            if (!Schema::hasColumn('clinics', 'reschedule_policy_en')) {
                $table->longText('reschedule_policy_en')->nullable()->after('refund_policy_ar');
            }
            if (!Schema::hasColumn('clinics', 'reschedule_policy_ar')) {
                $table->longText('reschedule_policy_ar')->nullable()->after('reschedule_policy_en');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['reschedule_policy_en', 'reschedule_policy_ar']);
        });
    }
};
