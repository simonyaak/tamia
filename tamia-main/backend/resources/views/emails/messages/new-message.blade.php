<x-mail::message>
# New Message Received

Hello {{ $msg->receiver->name }},

You have received a new message regarding a listing on **Tamia Marketplace**.

**From:** {{ $msg->sender->name }}
**Message:**
> {{ $msg->body }}

<x-mail::button :url="config('app.frontend_url', 'http://localhost:5173') . '/conversations/' . $msg->conversation_id">
Reply to Message
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
