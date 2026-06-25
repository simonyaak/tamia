<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    protected $fillable = [
        'user_id', 'category_id', 'title', 'slug', 'description', 
        'price', 'location', 'city', 'condition', 'status', 
        'is_featured', 'is_urgent', 'views_count', 'phone_clicks_count'
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_urgent' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ListingImage::class)->orderBy('order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ListingImage::class)->where('is_primary', true)->latest();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
