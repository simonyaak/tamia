<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deal extends Model
{
    protected $fillable = [
        'buyer_id',
        'seller_id',
        'listing_id',
        'amount',
        'duration_hours',
        'status',
        'payment_reference',
        'expires_at',
        'completed_at',
        'meeting_pin',
        'meeting_verified',
        'seller_lat',
        'seller_lng',
        'buyer_lat',
        'buyer_lng',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'amount' => 'decimal:2',
        'meeting_verified' => 'boolean',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
