<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->decimal('price', 15, 2);
            $table->string('location'); // General location string
            $table->string('city'); // Specific city (Kampala, Entebbe, etc.)
            $table->string('condition')->default('used'); // new, used, refurbished
            $table->string('status')->default('pending'); // active, sold, pending, rejected
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_urgent')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
