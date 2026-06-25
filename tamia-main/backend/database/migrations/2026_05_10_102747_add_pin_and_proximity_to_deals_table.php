<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->string('meeting_pin', 4)->nullable();
            $table->boolean('meeting_verified')->default(false);
            $table->decimal('seller_lat', 10, 8)->nullable();
            $table->decimal('seller_lng', 11, 8)->nullable();
            $table->decimal('buyer_lat', 10, 8)->nullable();
            $table->decimal('buyer_lng', 11, 8)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn(['meeting_pin', 'meeting_verified', 'seller_lat', 'seller_lng', 'buyer_lat', 'buyer_lng']);
        });
    }
};
