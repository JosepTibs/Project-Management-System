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
        Schema::create('dependencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('predecessor_id');
            $table->unsignedBigInteger('successor_id');
            $table->enum('type', ['finish_to_start', 'start_to_start', 'start_to_finish', 'finish_to_finish'])->default('finish_to_start');
            $table->integer('lag')->default(0);
            $table->timestamps();

            $table->foreign('predecessor_id')->references('id')->on('work_items')->onDelete('cascade');
            $table->foreign('successor_id')->references('id')->on('work_items')->onDelete('cascade');

            $table->unique(['predecessor_id','successor_id','type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dependencies');
    }
};
