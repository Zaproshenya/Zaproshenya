/**
 * Cloud Functions for Запрошення
 *
 * These functions handle operations that CANNOT be done securely from the client
 * under the strict Security Rules (where notifications/$uid is owner-write-only
 * and friends/$uid is owner-write-only).
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();

// ═══════════════════════════════════════════════════════
// 1. onFriendRequestCreate — send friend-request notification
//    Triggered when friend-requests/$toUid/$fromUid is written.
// ═══════════════════════════════════════════════════════
exports.onFriendRequestCreate = functions.database
  .ref('friend-requests/{toUid}/{fromUid}')
  .onCreate(async (snap, ctx) => {
    // Skip echo markers (we use *_accepted / *_removed markers for state propagation)
    if (ctx.params.fromUid.endsWith('_accepted') || ctx.params.fromUid.endsWith('_removed')) {
      return null;
    }
    const req = snap.val();
    if (!req || !req.fromUid || !req.fromName) return null;

    const notifRef = db.ref('notifications/' + ctx.params.toUid).push();
    return notifRef.set({
      id: notifRef.key,
      type: 'friend-request',
      title: 'Запит на дружбу',
      body: `${req.fromName} хоче додати вас у друзі`,
      fromUid: req.fromUid,
      fromName: req.fromName,
      read: false,
      createdAt: Date.now(),
    });
  });

// ═══════════════════════════════════════════════════════
// 2. onFriendAccepted — send friend-accepted notification
//    Triggered when friend-requests/$uid/<fromUid>_accepted marker is written.
// ═══════════════════════════════════════════════════════
exports.onFriendAccepted = functions.database
  .ref('friend-requests/{toUid}/{fromUid}_accepted')
  .onCreate(async (snap, ctx) => {
    const data = snap.val();
    if (!data || !data.fromUid) return null;

    const notifRef = db.ref('notifications/' + ctx.params.toUid).push();
    return notifRef.set({
      id: notifRef.key,
      type: 'friend-accepted',
      title: '✓ Запит прийнято',
      body: `${data.fromName || 'Хтось'} прийняв вашу пропозицію дружби`,
      fromUid: data.fromUid,
      fromName: data.fromName || '',
      read: false,
      createdAt: Date.now(),
    });
  });

// ═══════════════════════════════════════════════════════
// 3. onFriendRemoved — send friend-removed notification
// ═══════════════════════════════════════════════════════
exports.onFriendRemoved = functions.database
  .ref('friend-requests/{toUid}/{fromUid}_removed')
  .onCreate(async (snap, ctx) => {
    const data = snap.val();
    if (!data || !data.fromUid) return null;

    const notifRef = db.ref('notifications/' + ctx.params.toUid).push();
    return notifRef.set({
      id: notifRef.key,
      type: 'friend-removed',
      title: 'Друга видалено',
      body: `${data.fromName || 'Хтось'} видалив вас з друзів`,
      fromUid: data.fromUid,
      fromName: data.fromName || '',
      read: false,
      createdAt: Date.now(),
    });
  });

// ═══════════════════════════════════════════════════════
// 4. onInviteCreate — send invite notification to recipientUid
// ═══════════════════════════════════════════════════════
exports.onInviteCreate = functions.database
  .ref('invites/{invId}')
  .onCreate(async (snap, ctx) => {
    const inv = snap.val();
    if (!inv || !inv.recipientUid) return null;

    const notifRef = db.ref('notifications/' + inv.recipientUid).push();
    return notifRef.set({
      id: notifRef.key,
      type: 'invite',
      title: 'Нове запрошення',
      body: `${inv.from || 'Хтось'} запрошує вас: ${inv.to || 'Зустріч'}`,
      inviteId: ctx.params.invId,
      fromUid: inv.creatorUid || null,
      fromName: inv.from || '',
      read: false,
      createdAt: Date.now(),
    });
  });

// ═══════════════════════════════════════════════════════
// 5. onInviteResponse — notify invite creator about status change
//    Triggered when statuses/$invId changes.
// ═══════════════════════════════════════════════════════
exports.onInviteResponse = functions.database
  .ref('statuses/{invId}')
  .onUpdate(async (change, ctx) => {
    const before = change.before.val();
    const after = change.after.val();
    if (before === after) return null;
    if (!['accepted', 'declined', 'reschedule'].includes(after)) return null;

    // Find the invite (personal or group)
    const invSnap = await db.ref('invites/' + ctx.params.invId).get();
    if (!invSnap.exists()) return null;
    const inv = invSnap.val();
    if (!inv.creatorUid) return null;

    // Try to identify responder — for personal invites with recipientUid it's clear.
    // For public invites we don't know who responded; skip notification in that case.
    if (!inv.recipientUid) return null;

    const responderProfileSnap = await db.ref('users/' + inv.recipientUid).get();
    const responderName = responderProfileSnap.exists()
      ? responderProfileSnap.val().name
      : (inv.to || 'Хтось');

    const titles = {
      accepted: 'Запрошення прийнято!',
      declined: 'Запрошення відхилено',
      reschedule: 'Запит на перенесення',
    };
    const bodies = {
      accepted: `${responderName} погодився прийти!`,
      declined: `${responderName} не зможе прийти`,
      reschedule: `${responderName} хоче перенести зустріч`,
    };

    const notifRef = db.ref('notifications/' + inv.creatorUid).push();
    return notifRef.set({
      id: notifRef.key,
      type: after === 'reschedule' ? 'invite-reschedule' : 'invite-response',
      title: titles[after] || 'Відповідь на запрошення',
      body: bodies[after] || '',
      inviteId: ctx.params.invId,
      read: false,
      createdAt: Date.now(),
    });
  });

// ═══════════════════════════════════════════════════════
// 6. maintainStats — keep aggregate counters fresh on writes
//    Triggered on writes to top-level collections.
// ═══════════════════════════════════════════════════════
async function recomputeStats() {
  const [users, invites, groupInvites, statuses, reports, friends] = await Promise.all([
    db.ref('users').get(),
    db.ref('invites').get(),
    db.ref('group-invites').get(),
    db.ref('statuses').get(),
    db.ref('reports').get(),
    db.ref('friends').get(),
  ]);

  let accepted = 0, declined = 0, reschedule = 0;
  if (statuses.exists()) {
    statuses.forEach(c => {
      const v = c.val();
      if (v === 'accepted') accepted++;
      else if (v === 'declined') declined++;
      else if (v === 'reschedule' || v === 'rescheduled') reschedule++;
    });
  }

  let pending = 0, resolved = 0, dismissed = 0;
  if (reports.exists()) {
    reports.forEach(c => {
      const v = c.val();
      if (v.status === 'pending') pending++;
      else if (v.status === 'resolved') resolved++;
      else if (v.status === 'dismissed') dismissed++;
    });
  }

  let totalFriendsConnections = 0;
  if (friends.exists()) {
    friends.forEach(userNode => {
      const v = userNode.val();
      if (v) totalFriendsConnections += Object.keys(v).length;
    });
    totalFriendsConnections = Math.floor(totalFriendsConnections / 2);
  }

  return db.ref('stats').set({
    totalUsers: users.exists() ? users.numChildren() : 0,
    totalInvites: (invites.exists() ? invites.numChildren() : 0)
                + (groupInvites.exists() ? groupInvites.numChildren() : 0),
    acceptedInvites: accepted,
    declinedInvites: declined,
    rescheduleInvites: reschedule,
    personalInvitesCount: invites.exists() ? invites.numChildren() : 0,
    groupInvitesCount: groupInvites.exists() ? groupInvites.numChildren() : 0,
    reportsCount: { pending, resolved, dismissed, total: pending + resolved + dismissed },
    totalFriendsConnections,
    updatedAt: Date.now(),
  });
}

exports.recomputeStatsOnUser = functions.database
  .ref('users/{uid}').onWrite(async () => recomputeStats());

exports.recomputeStatsOnInvite = functions.database
  .ref('invites/{invId}').onWrite(async () => recomputeStats());

exports.recomputeStatsOnGroupInvite = functions.database
  .ref('group-invites/{invId}').onWrite(async () => recomputeStats());

exports.recomputeStatsOnStatus = functions.database
  .ref('statuses/{invId}').onWrite(async () => recomputeStats());

exports.recomputeStatsOnReport = functions.database
  .ref('reports/{reportId}').onWrite(async () => recomputeStats());

exports.recomputeStatsOnFriend = functions.database
  .ref('friends/{uid}').onWrite(async () => recomputeStats());

// ═══════════════════════════════════════════════════════
// 7. onUserDelete — clean up orphan data when auth user is deleted
//    Triggered by Firebase Auth user deletion.
// ═══════════════════════════════════════════════════════
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  // Read the user's profile to find login & uniqueId
  const profileSnap = await db.ref('users/' + uid).get();
  const updates = {};

  updates['users/' + uid] = null;
  updates['profiles-public/' + uid] = null;
  updates['notifications/' + uid] = null;
  updates['friends/' + uid] = null;
  updates['friend-requests/' + uid] = null;
  updates['user-invites/' + uid] = null;
  updates['fcmTokens/' + uid] = null;

  if (profileSnap.exists()) {
    const p = profileSnap.val();
    if (p.login)    updates['logins/' + p.login] = null;
    if (p.uniqueId) updates['ids/' + p.uniqueId] = null;

    // Remove this user's invites
    if (p.invites) {
      for (const invId of Object.keys(p.invites)) {
        updates['invites/' + invId] = null;
        updates['statuses/' + invId] = null;
        updates['reschedule/' + invId] = null;
      }
    }
  }

  // Remove user from others' friends lists (scan)
  const friendsSnap = await db.ref('friends').get();
  if (friendsSnap.exists()) {
    friendsSnap.forEach(userNode => {
      if (userNode.key !== uid && userNode.val() && userNode.val()[uid]) {
        updates['friends/' + userNode.key + '/' + uid] = null;
      }
    });
  }

  await db.ref().update(updates);
  return null;
});
