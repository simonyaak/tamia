@component('mail::message')
# Verification Request Received

Hello {{ $user->name }},

We have received your verification request. Our admin team will review it shortly and let you know once it has been approved or rejected.

@component('mail::button', ['url' => config('app.url') . '/account'])
View Account
@endcomponent

Thanks,
{{ config('app.name') }} Team
@endcomponent
