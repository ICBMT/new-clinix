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
            if (!Schema::hasColumn('clinics', 'privacy_policy_en')) {
                $table->longText('privacy_policy_en')->nullable()->after('reschedule_policy_ar');
            }
            if (!Schema::hasColumn('clinics', 'privacy_policy_ar')) {
                $table->longText('privacy_policy_ar')->nullable()->after('privacy_policy_en');
            }
            if (!Schema::hasColumn('clinics', 'terms_and_conditions_en')) {
                $table->longText('terms_and_conditions_en')->nullable()->after('privacy_policy_ar');
            }
            if (!Schema::hasColumn('clinics', 'terms_and_conditions_ar')) {
                $table->longText('terms_and_conditions_ar')->nullable()->after('terms_and_conditions_en');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $columns = [
                'privacy_policy_en',
                'privacy_policy_ar',
                'terms_and_conditions_en',
                'terms_and_conditions_ar',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('clinics', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
