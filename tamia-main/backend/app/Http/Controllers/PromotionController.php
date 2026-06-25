<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Payment;
use App\Services\MobileMoneyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller
{
    /**
     * Promote a listing.
     * In a real app, this would redirect to a payment gateway.
     * Here we simulate a successful payment.
     */
    public function promote(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $request->validate([
            'type' => 'required|in:featured,urgent',
            'amount' => 'required|numeric',
            'days' => 'required|integer|min:1',
            'payment_method' => 'required|in:mock_wallet,mobile_money',
        ]);

        $phone = auth()->user()->phone;

        if ($request->payment_method === 'mobile_money' && ! $phone) {
            return response()->json(['success' => false, 'message' => 'A phone number is required for mobile money payments. Please update your profile and try again.'], 422);
        }

        try {
            DB::beginTransaction();

            $payment = Payment::create([
                'user_id' => auth()->id(),
                'listing_id' => $listing->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'status' => $request->payment_method === 'mobile_money' ? 'pending' : 'completed',
                'payment_method' => $request->payment_method,
                'reference' => strtoupper($request->payment_method === 'mobile_money' ? 'MM-' . uniqid() : 'MOCK-' . uniqid()),
            ]);

            if ($request->payment_method === 'mock_wallet') {
                if ($request->type === 'featured') {
                    $listing->is_featured = true;
                } else if ($request->type === 'urgent') {
                    $listing->is_urgent = true;
                }

                $listing->save();
            }

            DB::commit();

            $responseData = [
                'success' => true,
                'message' => $request->payment_method === 'mobile_money'
                    ? 'Mobile money payment started. Use the instructions below to complete your payment.'
                    : 'Listing promoted successfully!',
            ];

            if ($request->payment_method === 'mobile_money') {
                $mobileMoneyService = app(MobileMoneyService::class);
                $providerResponse = $mobileMoneyService->initiatePayment($payment, $phone);
                $responseData = array_merge($responseData, $providerResponse);
            } else {
                $responseData['listing'] = $listing;
            }

            return response()->json($responseData);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to promote listing: ' . $e->getMessage()
            ], 500);
        }
    }
}
