<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\MobileMoneyService;
use Illuminate\Http\Request;

class MobileMoneyCallbackController extends Controller
{
    public function handle(Request $request, MobileMoneyService $mobileMoneyService)
    {
        if (! $mobileMoneyService->validateWebhook($request)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 403);
        }

        $reference = $request->input('reference') ?: $request->input('transaction_ref');

        if (! $reference) {
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        $payment = Payment::where('reference', $reference)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        $status = $mobileMoneyService->normalizeStatus($request->input('status', 'pending'));

        if ($payment->status === $status) {
            return response()->json(['message' => 'No status change required.', 'status' => $status]);
        }

        $payment->status = $status;
        $payment->save();

        if ($status === 'completed') {
            $listing = $payment->listing;

            if ($listing) {
                if ($payment->type === 'featured') {
                    $listing->is_featured = true;
                } elseif ($payment->type === 'urgent') {
                    $listing->is_urgent = true;
                }

                $listing->save();
            }
        }

        return response()->json(['message' => 'Payment status updated.', 'status' => $status]);
    }
}
