<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make name_ar nullable using raw SQL (Doctrine DBAL not required)
        DB::statement("ALTER TABLE `subscription_packages` MODIFY COLUMN `name_ar` VARCHAR(255) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert name_ar to NOT NULL
        // First, set any NULL values to empty string to avoid constraint violation
        DB::statement("UPDATE `subscription_packages` SET `name_ar` = '' WHERE `name_ar` IS NULL");
        DB::statement("ALTER TABLE `subscription_packages` MODIFY COLUMN `name_ar` VARCHAR(255) NOT NULL");
    }
};
