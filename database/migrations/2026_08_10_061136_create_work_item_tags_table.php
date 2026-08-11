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
        Schema::create('work_item_tags', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('work_item_id');
            $table->unsignedBigInteger('tag_id');
            $table->timestamps();

            $table->foreign('work_item_id')->references('id')->on('work_items')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
            $table->unique(['work_item_id','tag_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_item_tags');
    }
};
