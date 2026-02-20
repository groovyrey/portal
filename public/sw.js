importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Messaging is disabled for now
const firebaseConfig = {
  apiKey: "DISABLED",
  authDomain: "DISABLED",
  projectId: "DISABLED",
  storageBucket: "DISABLED",
  messagingSenderId: "DISABLED",
  appId: "DISABLED"
};

if (false && firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Post';
    const notificationOptions = {
      body: payload.notification?.body || 'Check the community for updates!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        link: payload.fcmOptions?.link || payload.data?.link || '/community'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Fallback push listener for non-FCM or raw pushes
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      // If the message is already handled by FCM background handler, we might skip here
      // but usually raw push doesn't have the same format
      if (data.notification || data.data) {
        const title = data.notification?.title || data.title || 'New Notification';
        const message = data.notification?.body || data.message || 'You have a new message.';
        const link = data.fcm_options?.link || data.data?.link || data.link || '/';

        const options = {
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [100, 50, 100],
          data: {
            link: link
          }
        };

        event.waitUntil(
          self.registration.showNotification(title, options)
        );
      }
    } catch (e) {
      console.error('Push event error:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data.link || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
