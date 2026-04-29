const CACHE_NAME = 'safescan-v1';

self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// استقبال الإشعارات الفورية (Push Notifications)
self.addEventListener('push', event => {
  console.log('Service Worker: Push Received');
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || 'لديك رسالة جديدة في SafeScan',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      data: {
        url: '/dashboard.html'
      }
    };
    event.waitUntil(self.registration.showNotification('📩 SafeScan', options));
  }
});

// عند النقر على الإشعار، يفتح لوحة التحكم
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard.html')
  );
});
