<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Category;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    /**
     * Get categories and trending listings.
     */
    public function getInitialData()
    {
        $categories = Category::orderBy('order')->get();
        $trending = Listing::with(['category', 'primaryImage', 'user:id,name,is_verified,avatar,cover_photo'])
            ->withCount(['reviews', 'images'])
            ->withAvg('reviews', 'rating')
            ->where('status', 'active')
            ->orderBy('is_featured', 'desc')
            ->latest()
            ->take(40)
            ->get();

        return response()->json([
            'categories' => $categories,
            'trending' => $trending
        ]);
    }

    /**
     * Search listings.
     */
    public function search(Request $request)
    {
        $query = Listing::with(['category', 'primaryImage', 'user:id,name,is_verified,avatar,cover_photo'])
            ->withCount(['reviews', 'images'])
            ->withAvg('reviews', 'rating')
            ->where('status', 'active');

        if ($request->has('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->q . '%')
                  ->orWhere('description', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->filled('category')) {
            if (is_numeric($request->category)) {
                $query->where('category_id', $request->category);
            } else {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('slug', $request->category);
                });
            }
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        if ($request->filled('price_min')) {
            $query->where('price', '>=', $request->price_min);
        }

        if ($request->filled('price_max')) {
            $query->where('price', '<=', $request->price_max);
        }

        if ($request->filled('sort')) {
            switch ($request->sort) {
                case 'price_low':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price_high':
                    $query->orderBy('price', 'desc');
                    break;
                default:
                    $query->latest();
            }
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Get listings by category.
     */
    public function category($slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        $listings = Listing::with(['category', 'primaryImage', 'user:id,name,is_verified,avatar,cover_photo'])
            ->withCount(['reviews', 'images'])
            ->withAvg('reviews', 'rating')
            ->where('category_id', $category->id)
            ->where('status', 'active')
            ->latest()
            ->paginate(20);

        return response()->json([
            'category' => $category,
            'listings' => $listings
        ]);
    }

    /**
     * Show a single listing.
     */
    public function show($slug)
    {
        $listing = Listing::with(['category', 'primaryImage', 'images', 'user'])
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $listing->increment('views_count');
        $listing->is_favorited = auth()->check() && auth()->user()->favorites()->where('listing_id', $listing->id)->exists();

        if ($listing->user) {
            $listing->user->followers_count = $listing->user->followers()->count();
            $listing->user->is_following = auth()->check() && auth()->user()->followingSellers()->where('seller_id', $listing->user->id)->exists();
        }

        return response()->json($listing);
    }

    /**
     * Increment phone click count.
     */
    public function clickPhone($id)
    {
        $listing = Listing::findOrFail($id);
        $listing->increment('phone_clicks_count');

        // Notify the seller
        \App\Models\Notification::create([
            'user_id' => $listing->user_id,
            'type' => 'insight',
            'title' => 'Phone Number Viewed',
            'body' => 'Someone viewed the phone number on your listing: ' . $listing->title,
            'link' => '/listing/' . $listing->slug,
            'icon' => 'phone',
        ]);

        return response()->json(['success' => true]);
    }
}
