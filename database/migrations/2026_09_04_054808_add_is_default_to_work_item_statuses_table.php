<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('work_item_statuses', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('color');
            // Make project_id nullable to allow global default statuses
            $table->unsignedBigInteger('project_id')->nullable()->change();
        });

        // Seed default statuses
        DB::table('work_item_statuses')->insert([
            ['name' => 'To Do', 'color' => '#6b7280', 'order' => 1, 'is_default' => true, 'project_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'In Progress', 'color' => '#3b82f6', 'order' => 2, 'is_default' => true, 'project_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Under Review', 'color' => '#f59e0b', 'order' => 3, 'is_default' => true, 'project_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Done', 'color' => '#22c55e', 'order' => 3, 'is_default' => true, 'project_id' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_item_statuses', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });

        // Remove default statuses
        DB::table('work_item_statuses')->where('is_default', true)->delete();
    }
};
