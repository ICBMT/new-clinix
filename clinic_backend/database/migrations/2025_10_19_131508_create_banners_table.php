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
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->string('title_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('image_url')->nullable();
            $table->string('mobile_image_url')->nullable();
            $table->nullableMorphs('linkable');
            $table->enum('type', ['homepage', 'category', 'treatment', 'machine', 'other'])->default('homepage');
            $table->enum('position', ['top', 'middle', 'bottom', 'sidebar'])->default('top');
            $table->integer('sort_order')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('click_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
            // Indexes for performance
            $table->index(['type', 'status']);
            $table->index(['position', 'status']);
            $table->index(['sort_order', 'status']);
            $table->index(['start_date', 'end_date', 'status']);
            $table->index(['start_time', 'end_time', 'status']);
            // Note: morphs('linkable') already creates an index on ['linkable_type', 'linkable_id']
            $table->index(['linkable_type', 'linkable_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
