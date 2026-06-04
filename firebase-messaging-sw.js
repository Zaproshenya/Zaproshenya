/* ═══════════════════════════════════════════════════════
   Firebase Messaging Service Worker
   Handles background push notifications
   ═══════════════════════════════════════════════════════ */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCesCx1QMSuvKZe8trbJANIiikm3ncASnI",
  authDomain:        "zaproshennya-a1ea7.firebaseapp.com",
  databaseURL:       "https://zaproshennya-a1ea7-default-rtdb.firebaseio.com",
  projectId:         "zaproshennya-a1ea7",
  storageBucket:     "zaproshennya-a1ea7.firebasestorage.app",
  messagingSenderId: "474356200698",
  appId:             "1:474356200698:web:5a2d9c83240dfd44070543"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Запрошення ✦';
  const body = payload.notification?.body || '';
  const url = payload.data?.url || '/';

  self.registration.showNotification(title, {
    body,
    icon: 'https://files.catbox.moe/0m8wur.png',
    badge: 'https://files.catbox.moe/0m8wur.png',
    data: { url },
  });
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
