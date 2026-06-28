/* ═══════════════════════════════════════════════════════
   Firebase Messaging Service Worker
   Handles background push notifications
   ═══════════════════════════════════════════════════════ */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyBfhpU5VCYLqs2M_N6ozEh5ZqJL8XlZMM8",
  authDomain:        "zaproshenya-82751.firebaseapp.com",
  databaseURL:       "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "zaproshenya-82751",
  storageBucket:    "zaproshenya-82751.firebasestorage.app",
  messagingSenderId: "912178652602",
  appId:             "1:912178652602:web:ade20cdf841e2194e02983"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background message ', payload);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
