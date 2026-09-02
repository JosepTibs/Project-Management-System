<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow work items without an assignee.
     *
     * The store/update validation already treats assignee_id as optional
     * ("Unassigned"), but the column itself was still NOT NULL, so unassigned
     * items failed at the database level.
     */
    public function up(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropForeign(['assignee_id']);
            $table->unsignedBigInteger('assignee_id')->nullable()->change();
            $table->foreign('assignee_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropForeign(['assignee_id']);
            $table->unsignedBigInteger('assignee_id')->nullable(false)->change();
            $table->foreign('assignee_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};