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
        Schema::create('work_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('status_id');
            $table->unsignedBigInteger('group_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('assignee_id');
            $table->enum('priority',['low','medium','high','critical']);
            
            $table->date('due_date');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('status_id')->references('id')->on('work_item_statuses')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('work_item_groups')->onDelete('cascade');
            $table->foreign('assignee_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_items');
    }
};
