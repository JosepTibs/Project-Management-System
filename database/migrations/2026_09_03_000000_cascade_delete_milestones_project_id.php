<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('milestones', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('milestones', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->foreign('project_id')->references('id')->on('projects');
        });
    }
};
