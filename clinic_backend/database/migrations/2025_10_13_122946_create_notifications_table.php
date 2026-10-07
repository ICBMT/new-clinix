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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title_en')->nullable();
            $table->string('title_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->enum('recipient_type', ['admins', 'clinics', 'users', 'guests', 'system'])->default('system');
            $table->foreignId('recipient_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->boolean('is_read')->default(false);
            
            $table->string('type')->default('info');
            $table->enum('audience', ['users', 'clinics', 'sub_admins'])->default('users');
            $table->enum('delivery_method', ['push', 'push_email'])->default('push');
            $table->dateTime('scheduled_at')->nullable();
            $table->enum('status', ['draft', 'read', 'unread'])->default('unread');
            $table->string('image_url')->nullable();
            $table->morphs('notifiable');
            $table->json('data')->nullable();
            $table->unsignedBigInteger('broadcast_id')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['recipient_type', 'recipient_id']);
            $table->index('is_read');
            $table->index('created_at');
            $table->index(['recipient_id', 'is_read']);
            $table->index('broadcast_id');
            $table->index(['audience', 'status']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
