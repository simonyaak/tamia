@component('mail::message')
# Verification Approved

Hello {{ $user->name }},

Great news! Your verification request has been approved by our admin team. Your profile is now verified and buyers will see your trust badge on listings.

@component('mail::button', ['url' => config('app.url') . '/account'])
View Account
@endcomponent

Thanks,
{{ config('app.name') }} Team
@endcomponent
