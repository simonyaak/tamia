<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('listing_id')->nullable()->constrained()->onDelete('set null');
            $table->string('type'); // featured_listing, urgent_badge, subscription
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('pending'); // pending, completed, failed
            $table->string('payment_method')->nullable();
            $table->string('reference')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
