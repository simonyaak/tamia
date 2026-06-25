<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewHelpfulVote extends Model
{
    protected $fillable = [
        'review_id',
        'user_id',
    ];

    /**
     * The review being voted on
     */
    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    /**
     * The user who voted
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
