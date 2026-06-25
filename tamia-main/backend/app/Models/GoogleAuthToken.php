<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAuthToken extends Model
{
    protected $fillable = ['user_id', 'token', 'redirect_to', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
