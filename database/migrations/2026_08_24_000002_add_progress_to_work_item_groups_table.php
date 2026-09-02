<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a progress field to work item groups.
     *
     * A group's progress is normally derived from the average progress of its
     * work items. However, when a group has no work items (fully optional
     * planning), the progress can be set manually so the staff assigned to the
     * group can track how much of the group's work has been done.
     */
    public function up(): void
    {
        Schema::table('work_item_groups', function (Blueprint $table) {
            $table->unsignedTinyInteger('progress')->default(0)->after('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_item_groups', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};