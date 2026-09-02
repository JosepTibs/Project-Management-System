<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow a work item to be attached to a milestone without a group.
     *
     * Every work item still belongs to a project. Grouped items belong to a
     * milestone through their group; ungrouped items set group_id to null and
     * use this direct milestone_id instead, so a small task can sit under a
     * milestone without requiring a group.
     */
    public function up(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->unsignedBigInteger('milestone_id')->nullable()->after('group_id');

            $table->foreign('milestone_id')->references('id')->on('milestones')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropForeign(['milestone_id']);
            $table->dropColumn('milestone_id');
        });
    }
};