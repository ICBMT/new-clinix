<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the ENUM column to include 'quarterly'
        // MySQL requires using raw SQL to alter ENUM columns
        DB::statement("ALTER TABLE `subscription_packages` MODIFY COLUMN `billing_cycle` ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original ENUM values (monthly, yearly)
        DB::statement("ALTER TABLE `subscription_packages` MODIFY COLUMN `billing_cycle` ENUM('monthly', 'yearly') DEFAULT 'monthly'");
    }
};
