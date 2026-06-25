<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\MarketplaceController;
use App\Models\Conversation;
use App\Models\Listing;
use App\Models\Message;
use App\Models\Report;
use App\Models\Review;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewMessageNotification;
use App\Notifications\NewMessagePushNotification;

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/api/notifications/subscribe', [App\Http\Controllers\PushSubscriptionController::class, 'store']);
    Route::post('/api/notifications/unsubscribe', [App\Http\Controllers\PushSubscriptionController::class, 'destroy']);
});

Route::get('/', function () {
    return redirect(env('FRONTEND_URL', 'https://tamia.vercel.app'));
});

// Share route for Open Graph metadata
Route::get('/s/{slug}', function ($slug) {
    $listing = \App\Models\Listing::with('primaryImage')->where('slug', $slug)->firstOrFail();
    
    $title = $listing->title . ' - Tamia Marketplace';
    $description = \Illuminate\Support\Str::limit(strip_tags($listing->description), 150);
    
    $imageUrl = null;
    if ($listing->primaryImage) {
        $imageUrl = str_starts_with($listing->primaryImage->path, 'http') 
            ? $listing->primaryImage->path 
            : url('/storage/' . $listing->primaryImage->path);
    } else {
        $imageUrl = env('FRONTEND_URL', 'https://tamia.vercel.app') . '/logo.png'; // Fallback
    }

    $frontendUrl = env('FRONTEND_URL', 'https://tamia.vercel.app') . '/listing/' . $slug;

    return view('share', [
        'title' => $title,
        'description' => $description,
        'image' => $imageUrl,
        'url' => $frontendUrl
    ]);
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'throttle:api'])->group(function () {
    Route::post('/api/user/request-verification', [ProfileController::class, 'requestVerification']);
    
    // Mock phone verification route
    Route::post('/api/user/verify-phone', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        if (!$user->phone) {
            return response()->json(['message' => 'Please set a phone number first.'], 400);
        }
        $user->phone_verified_at = now();
        $user->save();
        return response()->json(['message' => 'Phone number verified successfully.']);
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Listings
    Route::resource('listings', ListingController::class);
});

// Google OAuth Routes
Route::get('/auth/google', function (Request $request) {
    $next = $request->query('next', '/account');
    try {
        return Laravel\Socialite\Facades\Socialite::driver('google')
            ->redirectUrl('https://tamia.onrender.com/auth/google/callback')
            ->with(['state' => 'next=' . $next])
            ->stateless()
            ->redirect();
    } catch (\Exception $e) {
        return response('Google Auth Error: ' . $e->getMessage() . ' | Please check Render Environment Variables (GOOGLE_CLIENT_ID, etc.)', 500);
    }
});

Route::get('/auth/google/callback', function (Request $request) {
    try {
        $googleUser = Laravel\Socialite\Facades\Socialite::driver('google')
            ->redirectUrl('https://tamia.onrender.com/auth/google/callback')
            ->stateless()
            ->user();
        
        $state = $request->query('state');
        parse_str($state, $stateData);
        $next = $stateData['next'] ?? '/account';
        if (!str_starts_with($next, '/')) {
            $next = '/' . $next;
        }

        $user = User::where('google_id', $googleUser->id)
                    ->orWhere('email', $googleUser->email)
                    ->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'password' => Hash::make(Str::random(24)),
                'role' => 'buyer',
            ]);
            
            try {
                if (method_exists($user, 'assignRole')) {
                    $user->assignRole('buyer');
                }
            } catch (\Exception $e) {
                // Role might not exist, ignore
            }
        } else {
            $user->update(['google_id' => $googleUser->id]);
        }

        // Generate one-time token for cross-domain login
        $token = Str::random(64);
        \App\Models\GoogleAuthToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'redirect_to' => $next,
            'expires_at' => now()->addMinutes(5),
        ]);

        // Redirect to frontend's processing page
        return redirect(env('FRONTEND_URL', 'https://tamia.vercel.app') . '/google-auth?token=' . $token);
    } catch (\Exception $e) {
        return redirect(env('FRONTEND_URL', 'https://tamia.vercel.app') . '/login?error=google_failed&msg=' . urlencode($e->getMessage()));
    }
});

// API Route for exchanging the Google Auth Token
Route::middleware('throttle:api')->post('/api/auth/google/exchange', function (Request $request) {
    $request->validate(['token' => 'required|string']);
    
    $authToken = \App\Models\GoogleAuthToken::where('token', $request->token)
        ->where('expires_at', '>', now())
        ->first();
        
    if (!$authToken) {
        return response()->json(['success' => false, 'message' => 'Invalid or expired token.'], 401);
    }
    
    Auth::login($authToken->user);
    $request->session()->regenerate();
    
    $redirectTo = $authToken->redirect_to;
    $authToken->delete();
    
    return response()->json([
        'success' => true,
        'user' => $authToken->user,
        'redirect_to' => $redirectTo
    ]);
});

// Public Marketplace API Routes
Route::prefix('api')->middleware('throttle:api')->group(function () {
    Route::get('/marketplace/initial', [MarketplaceController::class, 'getInitialData']);
    Route::get('/search', [MarketplaceController::class, 'search'])->name('search');
    Route::get('/category/{slug}', [MarketplaceController::class, 'category'])->name('category');
    Route::get('/listing/{slug}', [MarketplaceController::class, 'show'])->name('listings.show.public');
    Route::post('/listings/{id}/click-phone', [MarketplaceController::class, 'clickPhone']);

    Route::get('/user', function () {
        $user = auth()->user();

        return response()->json([
            'user' => $user ? $user->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business']) : null,
        ]);
    });

    Route::middleware('auth')->put('/user', function (Request $request) {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone,' . $user->id],
            'bio' => ['nullable', 'string', 'max:1000'],
            'location' => ['nullable', 'string', 'max:255'],
            'whatsapp_number' => ['nullable', 'string', 'max:20'],
            'is_business' => ['required', 'boolean'],
        ]);

        $user->update($validated);
        return response()->json([
            'message' => 'Profile updated successfully.', 
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business'])
        ]);
    });

    Route::middleware('auth')->post('/user/avatar', function (Request $request) {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'], // 2MB Max
        ]);

        $user = auth()->user();
        $image = $request->file('avatar');
        $cloudinaryUrl = env('CLOUDINARY_URL');
        $path = null;

        if ($cloudinaryUrl) {
            try {
                \Cloudinary\Configuration\Configuration::instance($cloudinaryUrl);
                $uploadApi = new \Cloudinary\Api\Upload\UploadApi();
                $upload = $uploadApi->upload($image->getRealPath(), [
                    'folder' => 'tamia/avatars'
                ]);
                $path = $upload['secure_url'];
            } catch (\Exception $e) {
                // Fallback to local if Cloudinary fails
            }
        }

        if (!$path) {
            if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);
            }
            $path = $image->store('avatars', 'public');
        }

        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar updated successfully.',
            'avatar_url' => str_starts_with($path, 'http') ? $path : '/storage/' . $path,
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business'])
        ]);
    });

    Route::middleware('auth')->post('/user/cover-photo', function (Request $request) {
        $request->validate([
            'cover_photo' => ['required', 'image', 'max:5120'], // 5MB Max
        ]);

        $user = auth()->user();
        $image = $request->file('cover_photo');
        $cloudinaryUrl = env('CLOUDINARY_URL');
        $path = null;

        if ($cloudinaryUrl) {
            try {
                \Cloudinary\Configuration\Configuration::instance($cloudinaryUrl);
                $uploadApi = new \Cloudinary\Api\Upload\UploadApi();
                $upload = $uploadApi->upload($image->getRealPath(), [
                    'folder' => 'tamia/covers'
                ]);
                $path = $upload['secure_url'];
            } catch (\Exception $e) {
                // Fallback to local if Cloudinary fails
            }
        }

        if (!$path) {
            if ($user->cover_photo && !str_starts_with($user->cover_photo, 'http')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->cover_photo);
            }
            $path = $image->store('covers', 'public');
        }

        $user->update(['cover_photo' => $path]);

        return response()->json([
            'message' => 'Cover photo updated successfully.',
            'cover_url' => str_starts_with($path, 'http') ? $path : '/storage/' . $path,
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business'])
        ]);
    });

    Route::middleware('auth')->post('/user/request-verification', function (Request $request) {
        $user = auth()->user();
        if ($user->is_verified) {
            return response()->json(['message' => 'User is already verified.'], 422);
        }
        $user->update(['verification_requested_at' => now()]);
        return response()->json(['message' => 'Verification request submitted.']);
    });

    Route::post('/login', function (Request $request) {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($request->only('email', 'password'), false)) {
            return response()->json([
                'message' => trans('auth.failed'),
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => auth()->user()->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business']),
        ]);
    });

    Route::post('/register', function (Request $request) {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'phone' => ['required', 'string', 'max:20', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'buyer',
        ]);

        if (method_exists($user, 'assignRole')) {
            $user->assignRole('buyer');
        }

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_verified', 'verification_requested_at', 'avatar', 'cover_photo', 'bio', 'location', 'whatsapp_number', 'is_business']),
        ]);
    });

    Route::post('/logout', function (Request $request) {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    });


    Route::middleware('auth')->group(function () {
        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markOneAsRead']);

        Route::post('/listings', [\App\Http\Controllers\ListingController::class, 'store']);

        Route::get('/user/listings', function (Request $request) {
            $listings = $request->user()->listings()->with(['category', 'primaryImage'])->latest()->get();
            return response()->json(['listings' => $listings]);
        });

        Route::delete('/listings/{listing}', function (Request $request, Listing $listing) {
            if ($listing->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            foreach ($listing->images as $image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($image->path);
            }

            $listing->delete();

            return response()->json(['message' => 'Listing deleted successfully.']);
        });

        Route::get('/favorites', function (Request $request) {
            $favorites = $request->user()->favorites()->with(['category', 'primaryImage'])->latest('favorites.created_at')->get();
            return response()->json(['favorites' => $favorites]);
        });

        Route::post('/favorites/{listing}', function (Request $request, Listing $listing) {
            $user = $request->user();
            $alreadyFavorite = $user->favorites()->where('listing_id', $listing->id)->exists();

            if ($alreadyFavorite) {
                $user->favorites()->detach($listing->id);
                return response()->json(['favorited' => false]);
            }

            $user->favorites()->attach($listing->id);
            return response()->json(['favorited' => true]);
        });

        Route::get('/conversations', function (Request $request) {
            $userId = $request->user()->id;
            $conversations = Conversation::with(['listing.primaryImage', 'buyer', 'seller', 'messages' => function ($query) {
                $query->latest();
            }])
                ->where(function ($query) use ($userId) {
                    $query->where('buyer_id', $userId)->orWhere('seller_id', $userId);
                })
                ->orderBy('last_message_at', 'desc')
                ->get();

            return response()->json(['conversations' => $conversations]);
        });

        Route::get('/conversations/{conversation}', function (Request $request, Conversation $conversation) {
            if (! in_array($request->user()->id, [$conversation->buyer_id, $conversation->seller_id], true)) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $conversation->load(['listing.primaryImage', 'buyer', 'seller', 'messages.sender']);
            return response()->json(['conversation' => $conversation]);
        });

        Route::post('/conversations/{conversation}/messages', function (Request $request, Conversation $conversation) {
            if (! in_array($request->user()->id, [$conversation->buyer_id, $conversation->seller_id], true)) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $validated = $request->validate([
                'body' => ['required', 'string', 'max:2000'],
            ]);

            $receiverId = $conversation->buyer_id === $request->user()->id ? $conversation->seller_id : $conversation->buyer_id;
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'receiver_id' => $receiverId,
                'body' => $validated['body'],
            ]);

            $conversation->update(['last_message_at' => now()]);

            // Send Email Notification
            try {
                Mail::to($message->receiver->email)->send(new NewMessageNotification($message->load(['sender', 'receiver'])));
            } catch (\Exception $e) {
                // Log error or ignore if mail fails
            }

            // In-app Notification
            \App\Models\Notification::create([
                'user_id' => $receiverId,
                'type' => 'message',
                'title' => 'New Message',
                'body' => $request->user()->name . ' sent you a message.',
                'link' => '/messages/' . $conversation->id,
                'icon' => 'chat',
            ]);

            // Web Push Notification (works even when app is closed)
            try {
                $receiver = User::find($receiverId);
                if ($receiver && $receiver->pushSubscriptions()->exists()) {
                    $receiver->notify(new NewMessagePushNotification($message->load('sender')));
                }
            } catch (\Exception $e) {
                // Ignore push errors
            }

            $message->load('sender');
            return response()->json(['message' => $message]);
        });

        Route::post('/listings/{listing}/conversation', function (Request $request, Listing $listing) {
            if ($listing->user_id === $request->user()->id) {
                return response()->json(['message' => 'You cannot message your own listing.'], 422);
            }

            $validated = $request->validate([
                'body' => ['required', 'string', 'max:2000'],
            ]);

            $buyerId = $request->user()->id;
            $sellerId = $listing->user_id;
            $conversation = Conversation::firstOrCreate(
                ['listing_id' => $listing->id, 'buyer_id' => $buyerId, 'seller_id' => $sellerId],
                ['last_message_at' => now()]
            );

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $buyerId,
                'receiver_id' => $sellerId,
                'body' => $validated['body'],
            ]);

            $conversation->update(['last_message_at' => now()]);

            // Send Email Notification
            try {
                Mail::to($message->receiver->email)->send(new NewMessageNotification($message->load(['sender', 'receiver'])));
            } catch (\Exception $e) {
                // Log error or ignore if mail fails
            }

            // In-app Notification
            \App\Models\Notification::create([
                'user_id' => $sellerId,
                'type' => 'message',
                'title' => 'New Message',
                'body' => $request->user()->name . ' sent you a message about ' . $listing->title,
                'link' => '/messages/' . $conversation->id,
                'icon' => 'chat',
            ]);

            // Web Push Notification (works even when app is closed)
            try {
                $seller = User::find($sellerId);
                if ($seller && $seller->pushSubscriptions()->exists()) {
                    $seller->notify(new NewMessagePushNotification($message->load('sender')));
                }
            } catch (\Exception $e) {
                // Ignore push errors
            }

            $message->load('sender');

            return response()->json(['conversation' => $conversation->load(['listing.primaryImage', 'buyer', 'seller', 'messages.sender']), 'message' => $message]);
        });

        // Listing Promotions
        Route::post('/listings/{id}/promote', [\App\Http\Controllers\PromotionController::class, 'promote']);
    });

    // Mobile money callback (provider webhook)
    Route::post('/mobile-money/callback', [\App\Http\Controllers\MobileMoneyCallbackController::class, 'handle'])
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

    Route::get('/csrf-token', function () {
        return response()->json(['csrf_token' => csrf_token()]);
    });

    Route::get('/categories', function () {
        return \App\Models\Category::whereNull('parent_id')->with('children')->get();
    });

    // User Profiles - Public endpoint
    Route::get('/users/{id}', function ($id) {
        $user = User::findOrFail($id);
        $listingCount = $user->listings()->count();
        $totalViews = $user->listings()->sum('views_count');
        $avgRating = Review::where('seller_id', $id)->avg('rating');
        $reviewCount = Review::where('seller_id', $id)->count();
        $followerCount = $user->followers()->count();
        $followingCount = $user->followingSellers()->count();
        $isFollowing = auth()->check() && auth()->id() !== $user->id && auth()->user()->followingSellers()->where('seller_id', $user->id)->exists();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'location' => $user->location,
                'avatar' => $user->avatar,
                'whatsapp_number' => $user->whatsapp_number,
                'is_business' => $user->is_business,
                'is_verified' => $user->is_verified,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
            'stats' => [
                'listing_count' => $listingCount,
                'followers_count' => $followerCount,
                'following_count' => $followingCount,
                'total_views' => $totalViews,
                'member_since' => $user->created_at->format('M Y'),
                'average_rating' => round($avgRating, 1),
                'review_count' => $reviewCount,
            ],
            'is_following' => $isFollowing,
            'recent_listings' => $user->listings()->with(['category', 'primaryImage'])->latest()->take(6)->get(),
        ]);
    });

    Route::middleware('auth')->post('/users/{id}/follow', function (Request $request, $id) {
        $user = $request->user();
        $seller = User::findOrFail($id);

        if ($user->id === $seller->id) {
            return response()->json(['message' => 'You cannot follow yourself.'], 422);
        }

        $alreadyFollowing = $user->followingSellers()->where('seller_id', $seller->id)->exists();

        if ($alreadyFollowing) {
            $user->followingSellers()->detach($seller->id);
            $following = false;
        } else {
            $user->followingSellers()->attach($seller->id);
            $following = true;
        }

        return response()->json([
            'following' => $following,
            'follower_count' => $seller->followers()->count(),
        ]);
    });

    // Reviews endpoints
    Route::get('/users/{id}/reviews', function ($id) {
        $reviews = \App\Models\Review::where('seller_id', $id)
            ->with(['reviewer', 'listing'])
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = \App\Models\Review::where('seller_id', $id)->avg('rating');
        $totalReviews = $reviews->count();

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => round($avgRating, 1),
            'total_reviews' => $totalReviews,
        ]);
    });

    Route::get('/listings/{id}/reviews', function ($id) {
        $reviews = \App\Models\Review::where('listing_id', $id)
            ->with(['reviewer'])
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = \App\Models\Review::where('listing_id', $id)->avg('rating');

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => round($avgRating, 1),
        ]);
    });

    Route::middleware('auth')->group(function () {
        // Create a review
        Route::post('/reviews', function (Request $request) {
            $request->validate([
                'seller_id' => ['required', 'integer', 'exists:users,id'],
                'listing_id' => ['nullable', 'integer', 'exists:listings,id'],
                'rating' => ['required', 'integer', 'min:1', 'max:5'],
                'comment' => ['nullable', 'string', 'max:1000'],
            ]);

            $existingReview = \App\Models\Review::where('reviewer_id', $request->user()->id)
                ->where('seller_id', $request->input('seller_id'))
                ->where('listing_id', $request->input('listing_id'))
                ->first();

            if ($existingReview) {
                return response()->json(['message' => 'You have already reviewed this seller for this listing.'], 422);
            }

            $review = \App\Models\Review::create([
                'reviewer_id' => $request->user()->id,
                'seller_id' => $request->input('seller_id'),
                'listing_id' => $request->input('listing_id'),
                'rating' => $request->input('rating'),
                'comment' => $request->input('comment'),
            ]);

            return response()->json(['message' => 'Review created successfully.', 'review' => $review], 201);
        });

        // Vote on helpful review
        Route::post('/reviews/{review}/helpful', function (Request $request, \App\Models\Review $review) {
            $existingVote = \App\Models\ReviewHelpfulVote::where('review_id', $review->id)
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existingVote) {
                $existingVote->delete();
                $review->decrement('helpful_count');
                return response()->json(['voted' => false]);
            }

            \App\Models\ReviewHelpfulVote::create([
                'review_id' => $review->id,
                'user_id' => $request->user()->id,
            ]);

            $review->increment('helpful_count');
            return response()->json(['voted' => true]);
        });

        // Smart Deal Routes
        Route::get('/deals', [\App\Http\Controllers\DealController::class, 'index']);
        Route::post('/deals', [\App\Http\Controllers\DealController::class, 'store']);
        Route::post('/deals/{deal}/confirm', [\App\Http\Controllers\DealController::class, 'confirm']);
        Route::post('/deals/{deal}/cancel', [\App\Http\Controllers\DealController::class, 'cancel']);
        Route::post('/deals/{deal}/update-location', [\App\Http\Controllers\DealController::class, 'updateLocation']);
        Route::post('/deals/{deal}/verify-proximity', [\App\Http\Controllers\DealController::class, 'verifyProximity']);
        Route::post('/deals/{deal}/verify-pin', [\App\Http\Controllers\DealController::class, 'verifyPin']);

        // Admin Routes
        Route::middleware('admin')->group(function () {
            // Dashboard Stats
            Route::get('/admin/dashboard', function () {
                return response()->json([
                    'stats' => [
                        'total_users' => User::count(),
                        'total_listings' => Listing::count(),
                        'active_listings' => Listing::where('status', 'active')->count(),
                        'total_reviews' => Review::count(),
                        'avg_rating' => Review::avg('rating'),
                        'total_reports' => \App\Models\Report::count(),
                        'pending_reports' => \App\Models\Report::where('status', 'pending')->count(),
                        'pending_verifications' => User::where('is_verified', false)->whereNotNull('verification_requested_at')->count(),
                    ],
                ]);
            });

            // User Management
            Route::get('/admin/users', function (Request $request) {
                $query = User::query();

                if ($request->input('search')) {
                    $search = $request->input('search');
                    $query->where('name', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%");
                }

                if ($request->input('role')) {
                    $query->where('role', $request->input('role'));
                }

                return response()->json([
                    'users' => $query->with('roles')->paginate(20),
                ]);
            });

            Route::get('/admin/verification-requests', function (Request $request) {
                $query = User::where('is_verified', false)
                    ->whereNotNull('verification_requested_at');

                if ($request->input('search')) {
                    $search = $request->input('search');
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%$search%")
                          ->orWhere('email', 'like', "%$search%");
                    });
                }

                return response()->json([
                    'requests' => $query->with('roles')->latest('verification_requested_at')->paginate(20),
                ]);
            });

            Route::patch('/admin/users/{user}/verify', function (User $user) {
                $user->update(['is_verified' => true, 'verification_requested_at' => null]);
                \App\Services\AdminLogService::log('Verified User', 'User', $user->id);
                return response()->json(['message' => 'User verified.', 'user' => $user]);
            });

            Route::patch('/admin/users/{user}/reject-verification', function (User $user, Request $request) {
                $request->validate(['reason' => ['nullable', 'string']]);
                $user->update(['verification_requested_at' => null]);
                \App\Services\AdminLogService::log('Rejected User Verification', 'User', $user->id, ['reason' => $request->reason]);
                return response()->json(['message' => 'Verification request rejected.', 'user' => $user]);
            });

            Route::patch('/admin/users/{user}/suspend', function (User $user, Request $request) {
                $request->validate(['reason' => ['required', 'string']]);
                $user->update(['status' => 'suspended']);
                \App\Services\AdminLogService::log('Suspended User', 'User', $user->id, ['reason' => $request->reason]);
                return response()->json(['message' => 'User suspended.', 'user' => $user]);
            });

            Route::patch('/admin/users/{user}/activate', function (User $user) {
                $user->update(['status' => 'active']);
                \App\Services\AdminLogService::log('Activated User', 'User', $user->id);
                return response()->json(['message' => 'User activated.', 'user' => $user]);
            });

            // Listing Moderation
            Route::get('/admin/listings', function (Request $request) {
                $query = Listing::with(['user', 'category']);

                if ($request->input('status')) {
                    $query->where('status', $request->input('status'));
                }

                if ($request->input('search')) {
                    $search = $request->input('search');
                    $query->where('title', 'like', "%$search%");
                }

                return response()->json([
                    'listings' => $query->latest()->paginate(20),
                ]);
            });

            Route::patch('/admin/listings/{listing}/approve', function (Listing $listing) {
                $listing->update(['status' => 'active']);
                \App\Services\AdminLogService::log('Approved Listing', 'Listing', $listing->id);
                return response()->json(['message' => 'Listing approved.', 'listing' => $listing]);
            });

            Route::patch('/admin/listings/{listing}/reject', function (Listing $listing, Request $request) {
                $request->validate(['reason' => ['required', 'string']]);
                $listing->update(['status' => 'rejected']);
                \App\Services\AdminLogService::log('Rejected Listing', 'Listing', $listing->id, ['reason' => $request->reason]);
                return response()->json(['message' => 'Listing rejected.', 'listing' => $listing]);
            });

            Route::patch('/admin/listings/{listing}/suspend', function (Listing $listing, Request $request) {
                $request->validate(['reason' => ['required', 'string']]);
                $listing->update(['status' => 'suspended']);
                \App\Services\AdminLogService::log('Suspended Listing', 'Listing', $listing->id, ['reason' => $request->reason]);
                return response()->json(['message' => 'Listing suspended.', 'listing' => $listing]);
            });

            Route::put('/admin/listings/{listing}', function (Listing $listing, Request $request) {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'required|string',
                    'price' => 'required|numeric|min:0',
                    'category_id' => 'required|exists:categories,id',
                ]);
                
                $listing->update($validated);
                \App\Services\AdminLogService::log('Updated Listing', 'Listing', $listing->id, $validated);
                return response()->json(['message' => 'Listing updated successfully.', 'listing' => $listing->fresh(['user', 'category'])]);
            });

            Route::post('/admin/users/{user}/warn', function (User $user, Request $request) {
                $request->validate(['reason' => ['required', 'string']]);
                \App\Services\AdminLogService::log('Warned User', 'User', $user->id, ['reason' => $request->reason]);
                return response()->json(['message' => 'Warning sent to user.']);
            });

            // Category Management
            Route::post('/admin/categories', function (Request $request) {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'slug' => 'required|string|max:255|unique:categories',
                    'icon' => 'nullable|string|max:255',
                    'parent_id' => 'nullable|exists:categories,id',
                ]);
                $category = \App\Models\Category::create($validated);
                \App\Services\AdminLogService::log('Created Category', 'Category', $category->id, ['name' => $category->name]);
                return response()->json(['message' => 'Category created successfully.', 'category' => $category]);
            });

            Route::put('/admin/categories/{category}', function (\App\Models\Category $category, Request $request) {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
                    'icon' => 'nullable|string|max:255',
                    'parent_id' => 'nullable|exists:categories,id',
                ]);
                $category->update($validated);
                \App\Services\AdminLogService::log('Updated Category', 'Category', $category->id, ['name' => $category->name]);
                return response()->json(['message' => 'Category updated successfully.', 'category' => $category]);
            });

            Route::delete('/admin/categories/{category}', function (\App\Models\Category $category) {
                if ($category->children()->count() > 0) {
                    return response()->json(['message' => 'Cannot delete category with subcategories.'], 422);
                }
                if ($category->listings()->count() > 0) {
                    return response()->json(['message' => 'Cannot delete category that contains listings.'], 422);
                }
                $category->delete();
                \App\Services\AdminLogService::log('Deleted Category', 'Category', $category->id, ['name' => $category->name]);
                return response()->json(['message' => 'Category deleted successfully.']);
            });

            Route::get('/admin/logs', function () {
                return response()->json([
                    'logs' => \App\Models\AdminLog::with('admin')->latest()->paginate(20),
                ]);
            });

            // Monetization Management
            Route::get('/admin/monetization', function () {
                $totalRevenue = \App\Models\Payment::where('status', 'completed')->sum('amount');
                $recentPayments = \App\Models\Payment::with(['user', 'listing'])
                    ->latest()
                    ->take(20)
                    ->get();
                $promotedListingsCount = \App\Models\Listing::where('is_featured', true)
                    ->orWhere('is_urgent', true)
                    ->count();

                return response()->json([
                    'total_revenue' => $totalRevenue,
                    'promoted_listings_count' => $promotedListingsCount,
                    'recent_payments' => $recentPayments,
                ]);
            });

            // Report Management
            Route::get('/admin/reports', function (Request $request) {
                $query = \App\Models\Report::with(['reporter', 'listing', 'user']);

                if ($request->input('status')) {
                    $query->where('status', $request->input('status'));
                }

                if ($request->input('search')) {
                    $search = $request->input('search');
                    $query->whereHas('listing', function ($q) use ($search) {
                        $q->where('title', 'like', "%$search%");
                    });
                }

                return response()->json([
                    'reports' => $query->latest()->paginate(20),
                ]);
            });

            Route::patch('/admin/reports/{report}/resolve', function (Request $request, \App\Models\Report $report) {
                $request->validate([
                    'action' => ['required', 'in:dismiss,suspend_listing,suspend_user'],
                    'notes' => ['nullable', 'string'],
                ]);

                $action = $request->input('action');

                if ($action === 'suspend_listing') {
                    $report->listing->update(['status' => 'suspended']);
                } elseif ($action === 'suspend_user') {
                    $report->user->update(['status' => 'suspended']);
                }

                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => auth()->id(),
                    'resolution_notes' => $request->input('notes'),
                ]);

                return response()->json(['message' => 'Report resolved.', 'report' => $report]);
            });
        });
    });
});

require __DIR__.'/auth.php';

// Catch-all route for React SPA - excluding API and standard auth routes
Route::get('/{any}', function () {
    return redirect(env('FRONTEND_URL', 'https://tamia.vercel.app'));
})->where('any', '^(?!api|login|register|logout|up).*$');

