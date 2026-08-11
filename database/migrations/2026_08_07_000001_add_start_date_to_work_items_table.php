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
        // The base create_work_items migration already defines start_date, so
        // guard against a duplicate when both are present in a fresh install.
        if (Schema::hasColumn('work_items', 'start_date')) {
            return;
        }

        Schema::table('work_items', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_items', function (Blueprint $table) {
            $table->dropColumn('start_date');
        });
    }
};