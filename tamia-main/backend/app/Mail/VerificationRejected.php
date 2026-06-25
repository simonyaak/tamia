<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationRejected extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public ?string $reason;

    public function __construct(User $user, ?string $reason = null)
    {
        $this->user = $user;
        $this->reason = $reason;
    }

    public function build()
    {
        return $this->subject('Your Verification Request Was Rejected')
                    ->markdown('emails.verification_rejected', [
                        'user' => $this->user,
                        'reason' => $this->reason,
                    ]);
    }
}
