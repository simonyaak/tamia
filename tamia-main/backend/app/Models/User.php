<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'whatsapp_number', 'bio', 'location', 'is_business', 'phone_verified_at', 'google_id', 'facebook_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasPushSubscriptions;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'is_business' => 'boolean',
            'verification_requested_at' => 'datetime',
            'phone_verified_at' => 'datetime',
        ];
    }

    public function listings()
    {
        return $this->hasMany(Listing::class);
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Listing::class, 'favorites')->withTimestamps();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'seller_id', 'user_id')->withTimestamps();
    }

    public function followingSellers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'user_id', 'seller_id')->withTimestamps();
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'buyer_id')->orWhere('seller_id', $this->id);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function userFollows()
    {
        return $this->hasMany(UserFollow::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->latest();
    }

    // Reviews given by this user
    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    // Reviews received by this user (as a seller)
    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'seller_id');
    }

    // Helpful votes given by this user
    public function helpfulVotes()
    {
        return $this->hasMany(ReviewHelpfulVote::class);
    }
}
