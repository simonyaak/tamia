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
        // Reviews table - stores buyer reviews for sellers
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('listing_id')->nullable()->constrained('listings')->cascadeOnDelete();
            $table->integer('rating'); // 1-5 stars
            $table->text('comment')->nullable();
            $table->integer('helpful_count')->default(0);
            $table->timestamps();
            
            // Prevent duplicate reviews from same reviewer to same seller on same listing
            $table->unique(['reviewer_id', 'seller_id', 'listing_id']);
        });

        // Review helpful votes table
        Schema::create('review_helpful_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('reviews')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            // One user can only vote once per review
            $table->unique(['review_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_helpful_votes');
        Schema::dropIfExists('reviews');
    }
};
