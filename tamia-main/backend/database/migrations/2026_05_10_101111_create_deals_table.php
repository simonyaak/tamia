<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('buyer_id')->constrained('users')->onDelete('cascade');
            $blueprint->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $blueprint->foreignId('listing_id')->constrained('listings')->onDelete('cascade');
            $blueprint->decimal('amount', 10, 2)->default(2000.00);
            $blueprint->integer('duration_hours')->default(48);
            $blueprint->string('status')->default('pending'); // pending, active, completed, cancelled, expired
            $blueprint->string('payment_reference')->nullable();
            $blueprint->timestamp('expires_at')->nullable();
            $blueprint->timestamp('completed_at')->nullable();
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
