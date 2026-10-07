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
        Schema::create('cms_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_key')->unique(); // e.g., 'terms_conditions', 'privacy_policy'
            $table->string('title_en');
            $table->string('title_ar');
            $table->longText('content_en'); // Rich text HTML
            $table->longText('content_ar'); // Rich text HTML
            $table->timestamps();
            
            $table->index('page_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_pages');
    }
};

