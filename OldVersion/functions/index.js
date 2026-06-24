const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered when a new notification is written to `/notifications/{uid}/{notifId}`.
 * Sends a push notification via FCM if the user has a registered FCM token.
 */
exports.sendPushNotification = functions.region('europe-west1').database.ref('/notifications/{uid}/{notifId}')
  .onCreate(async (snapshot, context) => {
    const uid = context.params.uid;
    const notif = snapshot.val();

    if (!notif) return null;

    // Fetch the recipient's FCM tokens from the database
    const userSnap = await admin.database().ref(`users/${uid}`).once('value');
    if (!userSnap.exists()) return null;
    const user = userSnap.val();
    const fcmTokensObj = user.fcmTokens;

    if (!fcmTokensObj || Object.keys(fcmTokensObj).length === 0) {
      console.log(`No FCM tokens registered for user ${uid}. Skipping push notification.`);
      return null;
    }

    const tokens = Object.values(fcmTokensObj);

    // Determine target URL for notification click
    let clickUrl = '/';
    if (notif.type === 'friend-request' || notif.type === 'friend-accepted') {
      clickUrl = '/friends';
    } else if (notif.type === 'invite' && notif.inviteId) {
      clickUrl = `/i/${notif.inviteId}`;
    } else if (notif.type === 'group-invite' && notif.inviteId) {
      clickUrl = `/g/${notif.inviteId}`;
    } else if (notif.type === 'invite-response' || notif.type === 'invite-reschedule') {
      clickUrl = '/home';
    }

    const payload = {
      tokens: tokens,
      notification: {
        title: notif.title || 'Запрошення ✦',
        body: notif.body || '',
      },
      data: {
        url: clickUrl,
      },
      webpush: {
        notification: {
          icon: 'https://files.catbox.moe/0m8wur.png',
          badge: 'https://files.catbox.moe/0m8wur.png',
        }
      }
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`Multicast push notifications sent to user ${uid}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          const updates = {};
          tokensToRemove.forEach(tok => {
            const safeTokenKey = Buffer.from(tok).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
            updates[safeTokenKey] = null;
          });
          await admin.database().ref(`users/${uid}/fcmTokens`).update(updates);
          console.log(`Cleaned up ${tokensToRemove.length} invalid tokens for user ${uid}`);
        }
      }
      return response;
    } catch (error) {
      console.error(`Error sending multicast push notifications to user ${uid}:`, error);
      return null;
    }
  });
