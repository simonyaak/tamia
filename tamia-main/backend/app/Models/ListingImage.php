<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ListingImage extends Model
{
    protected $fillable = ['listing_id', 'path', 'is_primary', 'order'];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute(): ?string
    {
        if (! $this->path) {
            return null;
        }

        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return 
            Storage::disk('public')->exists($this->path)
                ? Storage::disk('public')->url($this->path)
                : asset('storage/' . ltrim($this->path, '/'));
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
