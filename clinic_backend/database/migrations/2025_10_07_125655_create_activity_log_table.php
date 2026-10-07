<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateActivityLogTable extends Migration
{
    public function up()
    {
        Schema::connection(config('activitylog.database_connection'))->create(config('activitylog.table_name'), function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer', 'causer');
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Add soft deletes for activity log archiving

            // Performance indexes for filtering and querying large activity logs
            $table->index('log_name', 'idx_activity_log_name');
            $table->index('event', 'idx_activity_event');
            $table->index('batch_uuid', 'idx_activity_batch_uuid');
            $table->index('created_at', 'idx_activity_created_at');
            $table->index('updated_at', 'idx_activity_updated_at');
            $table->index('deleted_at', 'idx_activity_deleted_at');
            
            // Composite indexes for common query patterns
            $table->index(['log_name', 'created_at'], 'idx_activity_log_created');
            $table->index(['causer_type', 'causer_id', 'created_at'], 'idx_activity_causer_created');
            $table->index(['subject_type', 'subject_id', 'created_at'], 'idx_activity_subject_created');
            $table->index(['created_at', 'log_name'], 'idx_activity_created_log');
        });
    }

    public function down()
    {
        Schema::connection(config('activitylog.database_connection'))->dropIfExists(config('activitylog.table_name'));
    }
}
