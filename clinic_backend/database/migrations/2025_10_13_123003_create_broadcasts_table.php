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
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('title_en')->nullable();
            $table->string('title_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->json('recipients')->nullable(); // user ids
            $table->json('target_roles')->nullable(); // user roles
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable(); // timestamp when broadcast was sent
            $table->foreignId('sent_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['draft', 'scheduled', 'sent'])->default('draft');
            $table->timestamps();

            // Indexes for performance
            $table->index('scheduled_at');
            $table->index('sent_at');
            $table->index('sent_by');
            $table->index('status');
            $table->index('created_at');
            $table->index('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
    }
};
