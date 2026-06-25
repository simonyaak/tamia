@component('mail::message')
# Verification Request Rejected

Hello {{ $user->name }},

Your verification request was reviewed by our admin team and was not approved at this time.

@if($reason)
**Reason:** {{ $reason }}
@endif

If you believe this was a mistake, please update your account information and request verification again.

@component('mail::button', ['url' => config('app.url') . '/account'])
View Account
@endcomponent

Thanks,
{{ config('app.name') }} Team
@endcomponent
