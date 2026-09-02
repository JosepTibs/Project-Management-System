<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the pivot table linking groups to their assigned members.
     *
     * A work item group may have several people assigned to work on it. This is
     * especially useful when the group has no work items, so the assignees are
     * tracked directly on the group itself rather than on individual items.
     */
    public function up(): void
    {
        Schema::create('work_item_group_assignees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('group_id')->references('id')->on('work_item_groups')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_item_group_assignees');
    }
};