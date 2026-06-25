<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewMessagePushNotification extends Notification
{
    use Queueable;

    public function __construct(public Message $message) {}

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        $senderName = $this->message->sender->name ?? 'Someone';
        $body       = strlen($this->message->body) > 80
            ? substr($this->message->body, 0, 80) . '…'
            : $this->message->body;

        return (new WebPushMessage)
            ->title("💬 New message from {$senderName}")
            ->body($body)
            ->icon('/logo.png')
            ->badge('/favicon.svg')
            ->data(['link' => '/messages/' . $this->message->conversation_id])
            ->action('Open Message', 'open');
    }
}
