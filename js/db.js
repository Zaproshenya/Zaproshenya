/* ═══════════════════════════════════════════════════════
   DB — CRUD operations for all entities
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const db = () => ZAP.dbRef;

  // ═══════════════════════════════════════════════════════
  // Users
  // ═══════════════════════════════════════════════════════

  async function getUserByUid(uid) {
    if (!db()) return null;
    const snap = await db().ref('users/' + uid).get();
    return snap.exists() ? snap.val() : null;
  }

  async function getPublicProfile(uid) {
    if (!db()) return null;
    const snap = await db().ref('profiles-public/' + uid).get();
    return snap.exists() ? snap.val() : null;
  }

  async function getUserByLogin(login) {
    if (!db()) return null;
    const uidSnap = await db().ref('logins/' + login.toLowerCase()).get();
    if (!uidSnap.exists()) return null;
    return getUserByUid(uidSnap.val());
  }

  async function getUserById(uniqueId) {
    if (!db()) return null;
    const uidSnap = await db().ref('ids/' + uniqueId).get();
    if (!uidSnap.exists()) return null;
    return getUserByUid(uidSnap.val());
  }

  async function getAllUsers(limit = 100) {
    if (!db()) return [];
    const snap = await db().ref('users').orderByChild('createdAt').limitToLast(limit).get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach(c => { list.push(c.val()); });
    return list.reverse();
  }

  async function updateUserRole(uid, newRole) {
    if (!db()) return;
    const updates = {};
    updates['users/' + uid + '/role'] = newRole;
    await db().ref().update(updates);
  }

  async function banUser(uid, banned, until = null) {
    if (!db()) return;
    const updates = {};
    updates['users/' + uid + '/banned'] = banned;
    if (banned) {
      updates['users/' + uid + '/bannedAt'] = Date.now();
      if (until) {
        updates['users/' + uid + '/bannedUntil'] = until;
      } else {
        updates['users/' + uid + '/bannedUntil'] = null;
      }
    } else {
      updates['users/' + uid + '/bannedAt'] = null;
      updates['users/' + uid + '/bannedUntil'] = null;
    }
    await db().ref().update(updates);
  }

  // ═══════════════════════════════════════════════════════
  // Invitations (personal)
  // ═══════════════════════════════════════════════════════

  async function createInvite(inv) {
    if (!db()) return;
    // Atomic multi-location write
    const updates = {};
    updates['invites/' + inv.id] = inv;
    updates['statuses/' + inv.id] = 'pending';
    if (inv.creatorUid) {
      updates['user-invites/' + inv.creatorUid + '/' + inv.id] = {
        id: inv.id, to: inv.to, type: inv.type,
        date: inv.date, time: inv.time, status: 'pending',
        created: inv.created,
        recipientUid: inv.recipientUid || null,
      };
    }
    await db().ref().update(updates);
  }

  async function getInvite(invId) {
    if (!db()) return null;
    const snap = await db().ref('invites/' + invId).get();
    return snap.exists() ? snap.val() : null;
  }

  async function getUserInvites(uid) {
    if (!db()) return [];
    const snap = await db().ref('user-invites/' + uid).get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach(c => { list.push(c.val()); });
    return list.sort((a, b) => (b.created || 0) - (a.created || 0));
  }

  async function updateInviteStatus(invId, status, uid) {
    if (!db()) return;
    const updates = {};
    updates['statuses/' + invId] = status;
    if (uid) {
      updates['user-invites/' + uid + '/' + invId + '/status'] = status;
    }
    await db().ref().update(updates);
  }

  async function deleteInvite(invId, uid) {
    if (!db()) return;
    const updates = {};
    updates['invites/' + invId] = null;
    updates['statuses/' + invId] = null;
    updates['reschedule/' + invId] = null;
    if (uid) {
      updates['user-invites/' + uid + '/' + invId] = null;
    }
    await db().ref().update(updates);
  }

  // ── Reschedule ──
  async function saveReschedule(invId, data, creatorUid) {
    if (!db()) return;
    const updates = {};
    updates['reschedule/' + invId] = { ...data, ts: Date.now() };
    updates['statuses/' + invId] = 'reschedule';
    if (creatorUid) {
      updates['user-invites/' + creatorUid + '/' + invId + '/status'] = 'reschedule';
    }
    await db().ref().update(updates);
  }

  async function getReschedule(invId) {
    if (!db()) return null;
    const snap = await db().ref('reschedule/' + invId).get();
    return snap.exists() ? snap.val() : null;
  }

  // ═══════════════════════════════════════════════════════
  // Group Invitations
  // ═══════════════════════════════════════════════════════

  async function createGroupInvite(inv) {
    if (!db()) return;
    const updates = {};
    updates['group-invites/' + inv.id] = inv;
    if (inv.creatorUid) {
      updates['user-invites/' + inv.creatorUid + '/' + inv.id] = {
        id: inv.id, type: inv.type, date: inv.date, time: inv.time,
        status: 'pending', created: inv.created, isGroup: true,
        title: inv.title || '',
      };
    }
    await db().ref().update(updates);
  }

  async function getGroupInvite(invId) {
    if (!db()) return null;
    const snap = await db().ref('group-invites/' + invId).get();
    return snap.exists() ? snap.val() : null;
  }

  async function joinGroupInvite(invId, participant) {
    if (!db()) return;
    const key = participant.uid || participant.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
    await db().ref('group-invites/' + invId + '/members/' + key).set({
      name: participant.name,
      uid: participant.uid || null,
      status: participant.status || 'accepted',
      joinedAt: Date.now(),
    });
  }

  async function updateGroupMemberStatus(invId, memberKey, status) {
    if (!db()) return;
    await db().ref('group-invites/' + invId + '/members/' + memberKey + '/status').set(status);
  }

  // Send group invite to friends via notifications
  async function sendGroupInviteToFriends(invId, friendUids, invData) {
    if (!db()) return;
    const updates = {};
    for (const fuid of friendUids) {
      updates['group-invites/' + invId + '/invited/' + fuid] = {
        status: 'pending', sentAt: Date.now(),
      };
    }
    await db().ref().update(updates);

    // Send notifications (one per friend)
    for (const fuid of friendUids) {
      await ZAP.notifications.addNotification(fuid, {
        type: 'group-invite',
        title: 'Групове запрошення',
        body: `${invData.creatorName} запрошує вас: ${invData.title || ZAP.utils.TYPE_MAP[invData.type]?.l || 'Зустріч'}`,
        inviteId: invId,
        fromUid: invData.creatorUid,
        fromName: invData.creatorName,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // Friends — corrected to use friend-requests node + atomic operations
  // ═══════════════════════════════════════════════════════

  async function sendFriendRequest(fromUid, toUid, fromName) {
    if (!db()) return;
    // Check if already friends
    const existing = await db().ref('friends/' + fromUid + '/' + toUid).get();
    if (existing.exists()) throw new Error('Вже у друзях');

    // Check if request already sent
    const existingReq = await db().ref('friend-requests/' + toUid + '/' + fromUid).get();
    if (existingReq.exists()) throw new Error('Запит вже надіслано');

    // Atomic write: create friend-request entry
    const updates = {};
    updates['friend-requests/' + toUid + '/' + fromUid] = {
      fromUid, fromName, sentAt: Date.now()
    };
    await db().ref().update(updates);

    // Send notification (separately, since notifications are now owner-only write)
    // We can't write to recipient's notifications anymore, so we rely on
    // client-side real-time listener on friend-requests node instead.
    // For backwards compat we still send via the Cloud Function (if configured),
    // OR keep an in-app signal via friend-requests node above.

    return 'sent';
  }

  async function acceptFriendRequest(myUid, fromUid) {
    if (!db()) return;

    // Check if already friends (idempotent operation)
    const alreadyFriends = await db().ref('friends/' + myUid + '/' + fromUid).get();
    if (alreadyFriends.exists()) {
      // Still clean up the request
      await db().ref('friend-requests/' + myUid + '/' + fromUid).remove();
      return;
    }

    const myProfile = await getUserByUid(myUid);
    const theirProfile = await getUserByUid(fromUid);

    // Atomic bidirectional friend write + remove request
    const updates = {};
    updates['friends/' + myUid + '/' + fromUid] = {
      uid: fromUid, name: theirProfile?.name || '', addedAt: Date.now()
    };
    updates['friends/' + fromUid + '/' + myUid] = {
      uid: myUid, name: myProfile?.name || '', addedAt: Date.now()
    };
    updates['friend-requests/' + myUid + '/' + fromUid] = null;

    // Clean up any matching notifications on both sides
    await db().ref().update(updates);

    // Notify the other user (via friend-requests/$fromUid/$myUid = accepted marker)
    // Since notifications are owner-write-only, we use a special "echo" via
    // friend-requests to signal the other client to refresh their friends list.
    try {
      await db().ref('friend-requests/' + fromUid + '/' + myUid + '_accepted').set({
        fromUid: myUid,
        fromName: myProfile?.name || '',
        acceptedAt: Date.now()
      });
    } catch (e) {
      // Best-effort — if the rule doesn't allow this write, the other user
      // will discover friendship on next app open.
    }
  }

  async function declineFriendRequest(myUid, fromUid) {
    if (!db()) return;
    await db().ref('friend-requests/' + myUid + '/' + fromUid).remove();
  }

  async function removeFriend(myUid, friendUid) {
    if (!db()) return;
    // Atomic bidirectional delete
    const updates = {};
    updates['friends/' + myUid + '/' + friendUid] = null;
    updates['friends/' + friendUid + '/' + myUid] = null;
    await db().ref().update(updates);

    // Signal the other user via friend-requests node (echo)
    try {
      const myProfile = await getUserByUid(myUid);
      await db().ref('friend-requests/' + friendUid + '/' + myUid + '_removed').set({
        fromUid: myUid,
        fromName: myProfile?.name || '',
        removedAt: Date.now()
      });
    } catch (e) {
      // Best-effort
    }
  }

  async function getFriends(uid) {
    if (!db()) return [];
    const snap = await db().ref('friends/' + uid).get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach(c => { list.push(c.val()); });

    // PARALLEL fetch of fresh profile data (avoids N+1)
    const profiles = await Promise.all(
      list.map(f => getPublicProfile(f.uid).catch(() => null))
    );
    profiles.forEach((pf, i) => {
      if (pf) {
        if (pf.avatar)    list[i].avatar    = pf.avatar;
        if (pf.name)      list[i].name      = pf.name;
        if (pf.uniqueId)  list[i].uniqueId  = pf.uniqueId;
        if (pf.lastSeen)  list[i].lastSeen  = pf.lastSeen;
      }
    });
    return list;
  }

  async function getFriendRequests(uid) {
    if (!db()) return [];
    const snap = await db().ref('friend-requests/' + uid).get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach(c => {
      const v = c.val();
      // Skip echo markers (keys ending with _accepted/_removed)
      if (c.key.endsWith('_accepted') || c.key.endsWith('_removed')) return;
      list.push(v);
    });
    return list.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
  }

  /**
   * Get friendship "echo" events: accept/remove notifications from other users.
   * Used by the client to refresh friends list when remote state changes.
   */
  async function getFriendEchoes(uid) {
    if (!db()) return [];
    const snap = await db().ref('friend-requests/' + uid).get();
    if (!snap.exists()) return [];
    const echoes = [];
    const toDelete = [];
    snap.forEach(c => {
      if (c.key.endsWith('_accepted')) {
        echoes.push({ type: 'accepted', data: c.val() });
        toDelete.push(c.key);
      } else if (c.key.endsWith('_removed')) {
        echoes.push({ type: 'removed', data: c.val() });
        toDelete.push(c.key);
      }
    });
    // Clean up echoes after reading
    if (toDelete.length > 0) {
      const updates = {};
      for (const k of toDelete) {
        updates['friend-requests/' + uid + '/' + k] = null;
      }
      try { await db().ref().update(updates); } catch (_) {}
    }
    return echoes;
  }

  // ═══════════════════════════════════════════════════════
  // Reports / Complaints
  // ═══════════════════════════════════════════════════════

  async function createReport(report) {
    if (!db()) return;
    const ref = db().ref('reports').push();
    await ref.set({
      id: ref.key,
      ...report,
      status: 'pending',
      createdAt: Date.now(),
    });
  }

  async function getReports() {
    if (!db()) return [];
    const snap = await db().ref('reports').orderByChild('createdAt').get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach(c => { list.push(c.val()); });
    return list.reverse();
  }

  async function resolveReport(reportId, action, moderatorUid) {
    if (!db()) return;
    await db().ref('reports/' + reportId).update({
      status: action,
      resolvedBy: moderatorUid,
      resolvedAt: Date.now(),
    });
  }

  // ═══════════════════════════════════════════════════════
  // Stats (for dashboard) — uses precomputed stats + paginated lists
  // ═══════════════════════════════════════════════════════

  async function getStats() {
    if (!db()) return {};

    // Read precomputed aggregate counters (Cloud Function should maintain these)
    let statsSnap = null;
    try {
      statsSnap = await db().ref('stats').get();
    } catch (e) { console.warn('stats read failed:', e); }

    const stats = statsSnap?.exists() ? statsSnap.val() : {};

    // Load paginated lists for tables (limit to last 200 — admin can paginate further)
    let usersSnap = null, reportsSnap = null;
    let personalInvitesSnap = null, groupSnap = null, statusesSnap = null;

    try {
      usersSnap = await db().ref('users').orderByChild('createdAt').limitToLast(200).get();
    } catch (e) { console.warn('users read failed:', e); }
    try {
      personalInvitesSnap = await db().ref('invites').orderByChild('created').limitToLast(200).get();
    } catch (e) { console.warn('invites read failed:', e); }
    try {
      groupSnap = await db().ref('group-invites').orderByChild('created').limitToLast(200).get();
    } catch (e) { console.warn('group-invites read failed:', e); }
    try {
      statusesSnap = await db().ref('statuses').get();
    } catch (e) { console.warn('statuses read failed:', e); }
    try {
      reportsSnap = await db().ref('reports').orderByChild('createdAt').limitToLast(100).get();
    } catch (e) { console.warn('reports read failed:', e); }

    const users = [];
    if (usersSnap && usersSnap.exists()) usersSnap.forEach(c => { users.push(c.val()); });

    const personalInvites = [];
    if (personalInvitesSnap && personalInvitesSnap.exists()) {
      personalInvitesSnap.forEach(c => {
        const inv = c.val();
        inv.id = c.key;
        personalInvites.push(inv);
      });
    }

    const groupInvites = [];
    if (groupSnap && groupSnap.exists()) {
      groupSnap.forEach(c => {
        const inv = c.val();
        inv.id = c.key;
        inv.isGroup = true;
        groupInvites.push(inv);
      });
    }

    // Compute type counts from loaded lists
    const typeCounts = {};
    for (const inv of [...personalInvites, ...groupInvites]) {
      if (inv && inv.type) typeCounts[inv.type] = (typeCounts[inv.type] || 0) + 1;
    }

    // Active users (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = users.filter(u => u.lastSeen > weekAgo).length;

    // Status counts
    let acceptedInvites = 0, declinedInvites = 0, rescheduleInvites = 0;
    if (statusesSnap && statusesSnap.exists()) {
      statusesSnap.forEach(c => {
        const val = c.val();
        if (val === 'accepted') acceptedInvites++;
        else if (val === 'declined') declinedInvites++;
        else if (val === 'reschedule' || val === 'rescheduled') rescheduleInvites++;
      });
    }

    // Roles & ban count
    let founderCount = 0, techAdminCount = 0, moderatorCount = 0;
    let regularUserCount = 0, bannedCount = 0;
    users.forEach(u => {
      if (u.banned) bannedCount++;
      if (u.role === 'founder') founderCount++;
      else if (u.role === 'tech-admin') techAdminCount++;
      else if (u.role === 'moderator') moderatorCount++;
      else regularUserCount++;
    });

    // Reports breakdown
    let pendingReports = 0, resolvedReports = 0, dismissedReports = 0;
    if (reportsSnap && reportsSnap.exists()) {
      reportsSnap.forEach(c => {
        const val = c.val();
        if (val.status === 'pending') pendingReports++;
        else if (val.status === 'resolved') resolvedReports++;
        else if (val.status === 'dismissed') dismissedReports++;
      });
    }

    // Prefer precomputed totals from Cloud Function; fall back to counts
    return {
      totalUsers: stats.totalUsers ?? users.length,
      totalInvites: stats.totalInvites ?? (personalInvites.length + groupInvites.length),
      acceptedInvites: stats.acceptedInvites ?? acceptedInvites,
      declinedInvites: stats.declinedInvites ?? declinedInvites,
      rescheduleInvites: stats.rescheduleInvites ?? rescheduleInvites,
      activeUsers,
      bannedCount,
      roleCounts: {
        founder: founderCount,
        techAdmin: techAdminCount,
        moderator: moderatorCount,
        user: regularUserCount
      },
      reportsCount: {
        pending: pendingReports,
        resolved: resolvedReports,
        dismissed: dismissedReports,
        total: pendingReports + resolvedReports + dismissedReports
      },
      totalFriendsConnections: stats.totalFriendsConnections ?? 0,
      users,
      personalInvitesCount: stats.personalInvitesCount ?? personalInvites.length,
      groupInvitesCount: stats.groupInvitesCount ?? groupInvites.length,
      typeCounts,
      personalInvites,
      groupInvites,
    };
  }

  // ═══════════════════════════════════════════════════════
  // Real-time listeners — scoped to user's own data only
  // ═══════════════════════════════════════════════════════

  function listenUserInvites(uid, callback) {
    if (!db()) return;
    return db().ref('user-invites/' + uid).on('value', snap => {
      const list = [];
      if (snap.exists()) snap.forEach(c => { list.push(c.val()); });
      callback(list.sort((a, b) => (b.created || 0) - (a.created || 0)));
    });
  }

  function listenFriendRequests(uid, callback) {
    if (!db()) return;
    return db().ref('friend-requests/' + uid).on('value', snap => {
      if (!snap.exists()) { callback([]); return; }
      const list = [];
      snap.forEach(c => {
        const v = c.val();
        if (c.key.endsWith('_accepted') || c.key.endsWith('_removed')) return;
        list.push(v);
      });
      callback(list.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0)));
    });
  }

  function listenFriends(uid, callback) {
    if (!db()) return;
    return db().ref('friends/' + uid).on('value', async snap => {
      if (!snap.exists()) { callback([]); return; }
      const list = [];
      snap.forEach(c => { list.push(c.val()); });
      // Fetch fresh profile data in parallel
      const profiles = await Promise.all(
        list.map(f => getPublicProfile(f.uid).catch(() => null))
      );
      profiles.forEach((pf, i) => {
        if (pf) {
          if (pf.avatar)    list[i].avatar    = pf.avatar;
          if (pf.name)      list[i].name      = pf.name;
          if (pf.uniqueId)  list[i].uniqueId  = pf.uniqueId;
          if (pf.lastSeen)  list[i].lastSeen  = pf.lastSeen;
        }
      });
      callback(list);
    });
  }

  function stopListening(path) {
    if (!db()) return;
    db().ref(path).off();
  }

  // ═══════════════════════════════════════════════════════
  // Invite via friend (direct, no link needed)
  // ═══════════════════════════════════════════════════════

  async function sendInviteToFriend(inv, friendUid) {
    if (!db()) return;
    // Save invite atomically
    await createInvite(inv);

    // Send notification (must be via Cloud Function; client now can't write to other's notifications)
    // For now, we rely on a Cloud Function on invites/$id create that sends notification to recipientUid.
    // Alternatively, we keep an invite-recipient marker the recipient polls via getUserInvites.
    // (See Cloud Function scaffold in /firebase-functions/)
  }

  ZAP.db = {
    // Users
    getUserByUid, getPublicProfile, getUserByLogin, getUserById,
    getAllUsers, updateUserRole, banUser,
    // Invites
    createInvite, getInvite, getUserInvites, updateInviteStatus, deleteInvite,
    saveReschedule, getReschedule,
    // Group invites
    createGroupInvite, getGroupInvite, joinGroupInvite,
    updateGroupMemberStatus, sendGroupInviteToFriends,
    // Friends
    sendFriendRequest, acceptFriendRequest, declineFriendRequest,
    removeFriend, getFriends, getFriendRequests, getFriendEchoes,
    // Reports
    createReport, getReports, resolveReport,
    // Stats
    getStats,
    // Real-time
    listenUserInvites, listenFriendRequests, listenFriends, stopListening,
    // Direct invite
    sendInviteToFriend,
  };
})();
