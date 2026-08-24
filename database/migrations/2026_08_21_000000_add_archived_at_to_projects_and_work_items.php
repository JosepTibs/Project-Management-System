<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a nullable archived_at timestamp to projects and work_items.
     *
     * Archiving is a reversible, non-destructive state: records retain their
     * activity logs, comments, and attachments while being excluded from the
     * active views and metrics.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('status_id');
        });

        Schema::table('work_items', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};