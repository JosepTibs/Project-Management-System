<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow work items to exist without a group.
     *
     * Previously every work item was required to belong to a group. Making the
     * group relationship optional keeps groups as an organizing layer without
     * forcing every task into one (an item may live in the "ungrouped" bucket).
     */
    public function up(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->unsignedBigInteger('group_id')->nullable()->change();
            $table->foreign('group_id')->references('id')->on('work_item_groups')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->unsignedBigInteger('group_id')->nullable(false)->change();
            $table->foreign('group_id')->references('id')->on('work_item_groups')->onDelete('cascade');
        });
    }
};