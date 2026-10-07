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
        Schema::table('users', function (Blueprint $table) {
            // Change skin_type from ENUM to VARCHAR(255) (String)
            // Note: In Laravel/Doctrine, changing enum to string usually involves drop/recreate or raw statement
            // or just change() if doctrine/dbal is installed and supports it.
            // Since we want to support new values, string is safest.
            $table->string('skin_type')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert back to ENUM if needed, but be careful of data loss if new values exist
            // For now, we attempt to revert to the old enum definition
            // $table->enum('skin_type', ['normal', 'oily', 'dry', 'combination', 'sensitive', 'fair', 'medium', 'dark'])->nullable()->change();
            
             // Reverting from string to enum can be tricky if data doesn't match. 
             // We will leave it as string in down or define it explicitly if strict revert is needed.
             // Ideally we should check data before reverting.
             // For safety in this specific task context, we might just leave it or try best effort.
             
             // To be safe and since this is a forward-moving change, we can try to revert but 
             // in reality we probably won't revert this often.
             // Let's implement the specific revert to original state
             $table->enum('skin_type', ['normal', 'oily', 'dry', 'combination', 'sensitive', 'fair', 'medium', 'dark'])->nullable()->change();
        });
    }
};
