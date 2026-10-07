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
        Schema::table('treatments', function (Blueprint $table) {
            // Discount fields
            if (!Schema::hasColumn('treatments', 'has_discount')) {
                $table->boolean('has_discount')->default(false)->after('final_price');
            }
            if (!Schema::hasColumn('treatments', 'discount_type')) {
                $table->enum('discount_type', ['percentage', 'fixed'])->nullable()->after('has_discount');
            }
            if (!Schema::hasColumn('treatments', 'discount_value')) {
                $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            }
            
            
            // Booking timing fields
            if (!Schema::hasColumn('treatments', 'buffer_time_minutes')) {
                $table->integer('buffer_time_minutes')->nullable()->after('service_duration_minutes');
            }
            if (!Schema::hasColumn('treatments', 'min_advance_booking_hours')) {
                $table->integer('min_advance_booking_hours')->nullable()->after('buffer_time_minutes');
            }
            if (!Schema::hasColumn('treatments', 'max_advance_booking_days')) {
                $table->integer('max_advance_booking_days')->nullable()->after('min_advance_booking_hours');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $columnsToDrop = [];
            
            if (Schema::hasColumn('treatments', 'has_discount')) {
                $columnsToDrop[] = 'has_discount';
            }
            if (Schema::hasColumn('treatments', 'discount_type')) {
                $columnsToDrop[] = 'discount_type';
            }
            if (Schema::hasColumn('treatments', 'discount_value')) {
                $columnsToDrop[] = 'discount_value';
            }
            if (Schema::hasColumn('treatments', 'buffer_time_minutes')) {
                $columnsToDrop[] = 'buffer_time_minutes';
            }
            if (Schema::hasColumn('treatments', 'min_advance_booking_hours')) {
                $columnsToDrop[] = 'min_advance_booking_hours';
            }
            if (Schema::hasColumn('treatments', 'max_advance_booking_days')) {
                $columnsToDrop[] = 'max_advance_booking_days';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
