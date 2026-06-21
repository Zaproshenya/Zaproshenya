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

    // Fetch the recipient's FCM token from the database
    const userSnap = await admin.database().ref(`users/${uid}`).once('value');
    if (!userSnap.exists()) return null;
    const user = userSnap.val();
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token registered for user ${uid}. Skipping push notification.`);
      return null;
    }

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
      token: fcmToken,
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
      const response = await admin.messaging().send(payload);
      console.log(`Push notification sent successfully to user ${uid}:`, response);
      return response;
    } catch (error) {
      console.error(`Error sending push notification to user ${uid}:`, error);
      // If the token is invalid or inactive, clean it up from the database
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.log(`Cleaning up invalid FCM token for user ${uid}`);
        await admin.database().ref(`users/${uid}/fcmToken`).remove();
      }
      return null;
    }
  });
