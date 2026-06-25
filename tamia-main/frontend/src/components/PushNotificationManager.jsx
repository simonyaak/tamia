import React, { useState, useEffect } from 'react';
import { Bell, BellRinging, BellSlash } from '@phosphor-icons/react';

const VAPID_PUBLIC_KEY = 'BCdkNbr-MENy62-RoYcf_H6Eb8FWF7lhSS85jlX2k2loRUHRz0gnJwiIBuZLk2T-FGcWhAwINQGhHJNbY15ef4M';

function PushNotificationManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                setRegistration(reg);
                reg.pushManager.getSubscription().then(sub => {
                    setSubscription(sub);
                    setIsSubscribed(!!sub);
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, []);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribe = async () => {
        try {
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify(sub),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setSubscription(sub);
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Failed to subscribe to push notifications', error);
        }
    };

    const unsubscribe = async () => {
        try {
            await subscription.unsubscribe();
            
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                body: JSON.stringify({ endpoint: subscription.endpoint }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            setSubscription(null);
            setIsSubscribed(false);
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications', error);
        }
    };

    if (loading || !registration) return null;

    return (
        <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isSubscribed 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-jiji-orange text-white hover:bg-[#E65A00] shadow-sm'
            }`}
            title={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
        >
            {isSubscribed ? (
                <>
                    <BellSlash weight="bold" size={18} />
                    <span>Disable Push</span>
                </>
            ) : (
                <>
                    <BellRinging weight="bold" size={18} />
                    <span>Enable Push Notifications</span>
                </>
            )}
        </button>
    );
}

export default PushNotificationManager;
