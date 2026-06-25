import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data?.json() ?? {};
    const title = data.title || 'New Notification';
    const message = data.body || 'You have a new update from Tamia.';
    const icon = data.icon || '/logo.png';
    const url = data.link || '/';

    const options = {
        body: message,
        icon: icon,
        badge: '/favicon.svg',
        data: {
            url: url
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
