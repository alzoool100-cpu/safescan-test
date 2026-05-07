// service-worker.js
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(clients.claim());
});

// استقبال الإشعارات الفورية
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push Received');
    
    let data = { title: 'SafeScan', body: 'لديك رسالة جديدة' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/dashboard.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // إذا كانت هناك علامة تبويب مفتوحة، ركز عليها
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // وإلا افتح علامة تبويب جديدة
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
