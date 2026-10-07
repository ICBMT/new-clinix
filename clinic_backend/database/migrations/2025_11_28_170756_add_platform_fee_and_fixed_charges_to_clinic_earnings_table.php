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
        Schema::table('clinic_earnings', function (Blueprint $table) {
            $table->decimal('platform_fee', 18, 2)->default(0);
            $table->decimal('fixed_charges', 18, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinic_earnings', function (Blueprint $table) {
            $table->dropColumn('platform_fee');
            $table->dropColumn('fixed_charges');
        });
    }
};
