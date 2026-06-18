/* ═══════════════════════════════════════════════════════
   Notifications — Push + In-App
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let _fcmToken = null;
  let _notifListener = null;
  let _banListener = null;
  let _lastSeenInterval = null;
  let _unreadInterval = null;
  let _lastNotifTs = 0;

  // ── FCM initialization ──
  async function initFCM(uid) {
    if (!ZAP.messaging || !uid) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Use VAPID key from config (must be set by user in firebase-config.js)
      const vapidKey = ZAP.VAPID_KEY;
      if (!vapidKey || vapidKey === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') {
        console.warn('FCM: VAPID key not configured. Set ZAP.VAPID_KEY in firebase-config.js');
        return;
      }

      const token = await ZAP.messaging.getToken({ vapidKey });

      if (token) {
        _fcmToken = token;
        await ZAP.dbRef.ref('users/' + uid + '/fcmToken').set(token);
        console.log('✦ FCM token registered');
      }

      // Listen for foreground messages
      ZAP.messaging.onMessage((payload) => {
        const title = payload.notification?.title || 'Сповіщення';
        const body = payload.notification?.body || '';
        sendPush(title, body);
      });
    } catch (e) {
      console.warn('FCM init error:', e.message);
    }
  }

  async function deleteFCMToken(uid) {
    if (!ZAP.messaging || !uid) return;
    try {
      if (_fcmToken) {
        await ZAP.dbRef.ref('users/' + uid + '/fcmToken').remove();
        _fcmToken = null;
      }
      await ZAP.messaging.deleteToken();
    } catch (e) {
      console.warn('FCM delete token:', e.message);
    }
  }

  // ── Push permissions (legacy browser Notification API) ──
  function requestPushPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function sendPush(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://files.catbox.moe/0m8wur.png',
          badge: 'https://files.catbox.moe/0m8wur.png',
        });
      } catch (e) { console.warn('Push:', e); }
    }
  }

  // ── In-app notifications (stored in Firebase, owner-writable only) ──
  // NOTE: With new Security Rules, only the owner can write to notifications/$uid.
  // Cross-user notifications (friend requests, invite responses, etc.) should be
  // delivered via Cloud Functions. The functions below manage the owner's own
  // notifications (read, mark-read, delete).

  async function addNotification(toUid, data) {
    // Now only works if toUid === current user's uid (owner-only write).
    // For cross-user delivery, deploy Cloud Functions (see /firebase-functions/README.md).
    if (!ZAP.dbRef || !toUid) return;
    try {
      const ref = ZAP.dbRef.ref('notifications/' + toUid).push();
      await ref.set({
        id: ref.key,
        ...data,
        read: false,
        createdAt: Date.now(),
      });
    } catch (e) {
      // Expected to fail for cross-user writes — that's OK,
      // Cloud Function should handle delivery.
      console.debug('addNotification (cross-user expected to fail with new rules):', e.message);
    }
  }

  async function getNotifications(uid) {
    if (!ZAP.dbRef || !uid) return [];
    try {
      const snap = await ZAP.dbRef.ref('notifications/' + uid)
        .orderByChild('createdAt').limitToLast(50).get();
      if (!snap.exists()) return [];
      const list = [];
      snap.forEach(c => {
        const val = c.val();
        if (val.title) val.title = val.title.replace(/<[^>]*>/g, '');
        if (val.body)  val.body  = val.body.replace(/<[^>]*>/g, '');
        list.push(val);
      });
      return list.reverse();
    } catch (e) { console.warn('getNotifications:', e); return []; }
  }

  async function markNotifRead(uid, notifId) {
    if (!ZAP.dbRef) return;
    try {
      await ZAP.dbRef.ref('notifications/' + uid + '/' + notifId + '/read').set(true);
    } catch (e) { console.warn('markNotifRead:', e); }
  }

  async function markAllNotifsRead(uid) {
    if (!ZAP.dbRef || !uid) return;
    try {
      const snap = await ZAP.dbRef.ref('notifications/' + uid).get();
      if (!snap.exists()) return;
      const updates = {};
      snap.forEach(c => {
        updates[c.key + '/read'] = true;
      });
      if (Object.keys(updates).length > 0) {
        await ZAP.dbRef.ref('notifications/' + uid).update(updates);
      }
    } catch (e) { console.warn('markAllNotifsRead:', e); }
  }

  async function deleteNotification(uid, notifId) {
    if (!ZAP.dbRef || !uid || !notifId) return;
    try {
      await ZAP.dbRef.ref('notifications/' + uid + '/' + notifId).remove();
    } catch (e) { console.warn('deleteNotification:', e); }
  }

  async function deleteNotificationsByPayload(uid, type, payloadKey, payloadVal) {
    if (!ZAP.dbRef || !uid) return;
    try {
      const snap = await ZAP.dbRef.ref('notifications/' + uid).orderByChild('type').equalTo(type).get();
      if (!snap.exists()) return;
      const updates = {};
      snap.forEach(c => {
        if (c.val()[payloadKey] === payloadVal) {
          updates[c.key] = null;
        }
      });
      await ZAP.dbRef.ref('notifications/' + uid).update(updates);
    } catch (e) { console.warn('deleteNotificationsByPayload:', e); }
  }

  function getUnreadCount(uid) {
    return new Promise(resolve => {
      if (!ZAP.dbRef || !uid) return resolve(0);
      ZAP.dbRef.ref('notifications/' + uid).orderByChild('read').equalTo(false)
        .once('value', snap => resolve(snap.numChildren()))
        .catch(() => resolve(0));
    });
  }

  // ── Listen for new notifications in real-time ──
  // Removes the 10-second filter — uses lastSeenNotifAt marker instead
  function listenNotifications(uid, callback) {
    if (!ZAP.dbRef || !uid) return;
    stopListeningNotifications();

    // Read the last-seen timestamp from localStorage (per-user)
    const lsKey = 'zap_lastNotifTs_' + uid;
    _lastNotifTs = parseInt(localStorage.getItem(lsKey) || '0', 10);

    _notifListener = ZAP.dbRef.ref('notifications/' + uid)
      .orderByChild('createdAt').startAt(_lastNotifTs + 1).limitToLast(20);

    _notifListener.on('child_added', snap => {
      const n = snap.val();
      if (!n) return;
      // Update last-seen marker
      const ts = n.createdAt || Date.now();
      if (ts > _lastNotifTs) {
        _lastNotifTs = ts;
        try { localStorage.setItem(lsKey, String(ts)); } catch (_) {}
      }
      // Show popup + push
      sendPush(n.title || 'Сповіщення', n.body || '');
      if (callback) callback(n);
    });
  }

  function stopListeningNotifications() {
    if (_notifListener) {
      _notifListener.off();
      _notifListener = null;
    }
  }

  // ── Ban status listener (separate lifecycle) ──
  function listenBanStatus(uid, onBan, onUnban) {
    if (!ZAP.dbRef || !uid) return;
    stopBanListener();
    _banListener = ZAP.dbRef.ref('users/' + uid + '/banned');
    _banListener.on('value', snap => {
      const newBanned = snap.val();
      if (newBanned === true && onBan) onBan();
      else if (newBanned === false && onUnban) onUnban();
    });
  }

  function stopBanListener() {
    if (_banListener) {
      _banListener.off();
      _banListener = null;
    }
  }

  // ── Timer management (allows cleanup on logout) ──
  function setTimers(lastSeenFn, unreadFn) {
    clearTimers();
    _lastSeenInterval = setInterval(lastSeenFn, 45000);
    _unreadInterval   = setInterval(unreadFn, 30000);
  }

  function clearTimers() {
    if (_lastSeenInterval) { clearInterval(_lastSeenInterval); _lastSeenInterval = null; }
    if (_unreadInterval)   { clearInterval(_unreadInterval);   _unreadInterval = null; }
  }

  ZAP.notifications = {
    requestPushPermission, sendPush,
    initFCM, deleteFCMToken,
    addNotification, getNotifications, deleteNotification, deleteNotificationsByPayload,
    markNotifRead, markAllNotifsRead, getUnreadCount,
    listenNotifications, stopListeningNotifications,
    listenBanStatus, stopBanListener,
    setTimers, clearTimers,
  };
})();
