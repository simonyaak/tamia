<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\Listing;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DealController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $deals = Deal::with(['buyer', 'seller', 'listing.primaryImage'])
            ->where(function ($q) use ($user) {
                $q->where('buyer_id', $user->id)
                  ->orWhere('seller_id', $user->id);
            })
            ->latest()
            ->paginate(15);

        return response()->json([
            'deals' => $deals
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'duration_hours' => 'required|integer|in:24,48,72,168',
        ]);

        $user = $request->user();
        $listing = Listing::findOrFail($request->listing_id);
        
        if ($listing->user_id === $user->id) {
            return response()->json(['message' => 'You cannot reserve your own listing.'], 422);
        }

        // Rule of One: A user can only have ONE active reservation platform-wide
        $activeReservation = Deal::where('buyer_id', $user->id)
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if ($activeReservation) {
            return response()->json([
                'message' => 'Rule of One: You already have an active reservation. Please complete or cancel it before starting a new one.',
                'deal' => $activeReservation
            ], 422);
        }

        // Prevent double booking: Is the item already reserved by someone else?
        $itemAlreadyReserved = Deal::where('listing_id', $listing->id)
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if ($itemAlreadyReserved) {
            return response()->json([
                'message' => 'Sorry, this item is currently reserved by another buyer.',
            ], 422);
        }

        // The try-catch block begins here

        try {
            DB::beginTransaction();

            $deal = Deal::create([
                'buyer_id' => $user->id,
                'seller_id' => $listing->user_id,
                'listing_id' => $listing->id,
                'amount' => 0, // No money required
                'duration_hours' => $request->duration_hours,
                'status' => 'active',
                'meeting_pin' => (string) rand(1000, 9999),
                'expires_at' => Carbon::now()->addHours($request->duration_hours),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Item reserved successfully!',
                'deal' => $deal->load(['seller', 'listing'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to reserve item: ' . $e->getMessage()], 500);
        }
    }

    public function updateLocation(Request $request, Deal $deal)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $user = $request->user();
        
        if ($deal->buyer_id === $user->id) {
            $deal->update(['buyer_lat' => $request->lat, 'buyer_lng' => $request->lng]);
        } elseif ($deal->seller_id === $user->id) {
            $deal->update(['seller_lat' => $request->lat, 'seller_lng' => $request->lng]);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['success' => true]);
    }

    public function verifyProximity(Request $request, Deal $deal)
    {
        if (!$deal->buyer_lat || !$deal->seller_lat) {
            return response()->json(['message' => 'Waiting for both users to share location...'], 422);
        }

        $distance = $this->calculateDistance(
            $deal->buyer_lat, $deal->buyer_lng,
            $deal->seller_lat, $deal->seller_lng
        );

        if ($distance <= 100) { // 100 meters
            $deal->update(['meeting_verified' => true]);
            return response()->json([
                'message' => 'Meeting verified via proximity! 🎉',
                'verified' => true
            ]);
        }

        return response()->json([
            'message' => 'Devices are not near each other yet. Distance: ' . round($distance) . 'm',
            'verified' => false
        ], 422);
    }

    public function verifyPin(Request $request, Deal $deal)
    {
        $request->validate(['pin' => 'required|string|size:4']);

        if ($deal->buyer_id !== $request->user()->id) {
            return response()->json(['message' => 'Only the buyer can verify the PIN.'], 403);
        }

        if ($deal->meeting_pin === $request->pin) {
            $deal->update(['meeting_verified' => true]);
            return response()->json([
                'message' => 'Meeting verified successfully! ✅',
                'verified' => true
            ]);
        }

        return response()->json(['message' => 'Incorrect PIN. Please check the seller\'s phone.'], 422);
    }

    public function confirm(Request $request, Deal $deal)
    {
        if ($deal->buyer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $deal->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
            'meeting_verified' => true, // Confirming automatically verifies the meeting
        ]);

        return response()->json([
            'message' => 'Deal completed! Thank you for being a reliable buyer.',
            'deal' => $deal
        ]);
    }

    public function cancel(Request $request, Deal $deal)
    {
        $user = $request->user();
        if ($deal->buyer_id !== $user->id && $deal->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($deal->status !== 'active') {
            return response()->json(['message' => 'Deal is already closed.'], 422);
        }

        $deal->update(['status' => 'cancelled']);

        $message = 'Deal cancelled.';
        if ($deal->meeting_verified) {
            $message .= ' Meeting was verified, so your reputation is protected.';
        } else {
            $message .= ' No-show recorded. Please communicate with the other party next time.';
        }

        return response()->json([
            'message' => $message,
            'deal' => $deal
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
