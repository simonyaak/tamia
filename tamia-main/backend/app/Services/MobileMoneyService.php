<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MobileMoneyService
{
    public function isConfigured(): bool
    {
        return (bool) env('MOBILE_MONEY_API_URL') && (bool) env('MOBILE_MONEY_API_KEY');
    }

    public function getCallbackUrl(): string
    {
        return env('MOBILE_MONEY_CALLBACK_URL', config('app.url') . '/api/mobile-money/callback');
    }

    public function initiatePayment(Payment $payment, string $phone): array
    {
        if (! $this->isConfigured()) {
            return [
                'payment_pending' => true,
                'instructions' => sprintf(
                    "Send %s %s to %s using Mobile Money and include reference %s in the payment description.",
                    env('MOBILE_MONEY_CURRENCY', 'UGX'),
                    number_format($payment->amount, 0, '.', ','),
                    env('MOBILE_MONEY_RECEIVER_NUMBER', '0777 123 456'),
                    $payment->reference
                ),
            ];
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('MOBILE_MONEY_API_KEY'),
            'Accept' => 'application/json',
        ])->timeout(20)->post(env('MOBILE_MONEY_API_URL'), [
            'merchant_id' => env('MOBILE_MONEY_MERCHANT_ID'),
            'amount' => $payment->amount,
            'currency' => env('MOBILE_MONEY_CURRENCY', 'UGX'),
            'reference' => $payment->reference,
            'payer_phone' => $phone,
            'callback_url' => $this->getCallbackUrl(),
            'description' => sprintf('Promotion payment for listing %s', $payment->listing_id),
        ]);

        if (! $response->successful()) {
            return [
                'payment_pending' => true,
                'instructions' => sprintf(
                    "Unable to contact mobile money provider. Please pay %s %s to %s manually and include reference %s.",
                    env('MOBILE_MONEY_CURRENCY', 'UGX'),
                    number_format($payment->amount, 0, '.', ','),
                    env('MOBILE_MONEY_RECEIVER_NUMBER', '0777 123 456'),
                    $payment->reference
                ),
                'provider_error' => $response->body(),
            ];
        }

        $body = $response->json();

        return [
            'payment_pending' => true,
            'instructions' => $body['instructions'] ?? sprintf(
                "Please complete the mobile money payment for reference %s.",
                $payment->reference
            ),
            'provider_response' => $body,
        ];
    }

    public function validateWebhook(Request $request): bool
    {
        $secret = env('MOBILE_MONEY_WEBHOOK_SECRET');

        if (! $secret) {
            return true;
        }

        $signature = $request->header('X-MOBILE-MONEY-SIGNATURE') ?: $request->header('X-SIGNATURE');

        if (! $signature) {
            return false;
        }

        return hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $signature);
    }

    public function normalizeStatus(string $status): string
    {
        $status = strtolower(trim($status));

        return match ($status) {
            'success', 'completed', 'paid', 'ok', 'payment_success', 'payment_completed' => 'completed',
            'failed', 'declined', 'cancelled', 'canceled', 'error', 'payment_failed' => 'failed',
            default => 'pending',
        };
    }
}
