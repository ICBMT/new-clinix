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
        // Check if banners table exists
        if (!Schema::hasTable('banners')) {
            return;
        }

        // Check if link_url column doesn't exist, then add it
        if (!Schema::hasColumn('banners', 'link_url')) {
            Schema::table('banners', function (Blueprint $table) {
                $table->string('link_url', 500)->nullable()->after('mobile_image_url');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if banners table exists
        if (!Schema::hasTable('banners')) {
            return;
        }

        // Check if link_url column exists, then drop it
        if (Schema::hasColumn('banners', 'link_url')) {
            Schema::table('banners', function (Blueprint $table) {
                $table->dropColumn('link_url');
            });
        }
    }
};
