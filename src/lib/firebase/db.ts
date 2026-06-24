import { ref, get, set, update, remove, push, query, orderByChild, limitToLast, equalTo, onValue, off } from "firebase/database";
import { db } from "./config";
import { UserProfile } from "./auth";

// ── Users ──
export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, 'users/' + uid));
  return snap.exists() ? snap.val() : null;
}

export async function getUserByLogin(login: string): Promise<UserProfile | null> {
  const uidSnap = await get(ref(db, 'logins/' + login.toLowerCase()));
  if (!uidSnap.exists()) return null;
  return getUserByUid(uidSnap.val());
}

export async function getUserById(uniqueId: string): Promise<UserProfile | null> {
  const uidSnap = await get(ref(db, 'ids/' + uniqueId));
  if (!uidSnap.exists()) return null;
  return getUserByUid(uidSnap.val());
}

export async function getAllUsers(limit = 100): Promise<UserProfile[]> {
  const q = query(ref(db, 'users'), orderByChild('createdAt'), limitToLast(limit));
  const snap = await get(q);
  if (!snap.exists()) return [];
  const list: UserProfile[] = [];
  snap.forEach(c => { list.push(c.val()); });
  return list.reverse();
}

export async function updateUserRole(uid: string, newRole: string) {
  await set(ref(db, 'users/' + uid + '/role'), newRole);
}

export async function banUser(uid: string, banned: boolean, until: number | null = null) {
  await set(ref(db, 'users/' + uid + '/banned'), banned);
  if (banned) {
    await set(ref(db, 'users/' + uid + '/bannedAt'), Date.now());
    if (until) await set(ref(db, 'users/' + uid + '/bannedUntil'), until);
    else await remove(ref(db, 'users/' + uid + '/bannedUntil'));
  } else {
    await remove(ref(db, 'users/' + uid + '/bannedAt'));
    await remove(ref(db, 'users/' + uid + '/bannedUntil'));
  }
}

// ── Invites ──
export async function createInvite(inv: any) {
  await set(ref(db, 'invites/' + inv.id), inv);
  await set(ref(db, 'statuses/' + inv.id), 'pending');
  if (inv.creatorUid) {
    await set(ref(db, 'user-invites/' + inv.creatorUid + '/' + inv.id), {
      id: inv.id, to: inv.to, type: inv.type,
      date: inv.date, time: inv.time, status: 'pending',
      created: inv.created,
      recipientUid: inv.recipientUid || null,
    });
  }
}

export async function getInvite(invId: string) {
  const snap = await get(ref(db, 'invites/' + invId));
  return snap.exists() ? snap.val() : null;
}

export async function getUserInvites(uid: string) {
  const snap = await get(ref(db, 'user-invites/' + uid));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push(c.val()); });
  return list.sort((a, b) => (b.created || 0) - (a.created || 0));
}

export async function updateInviteStatus(invId: string, status: string, uid?: string) {
  await set(ref(db, 'statuses/' + invId), status);
  if (uid) {
    await set(ref(db, 'user-invites/' + uid + '/' + invId + '/status'), status);
  }
}

export async function deleteInvite(invId: string, uid?: string) {
  await remove(ref(db, 'invites/' + invId));
  await remove(ref(db, 'statuses/' + invId));
  await remove(ref(db, 'reschedule/' + invId));
  if (uid) {
    await remove(ref(db, 'user-invites/' + uid + '/' + invId));
  }
}

// ── Group Invites ──
export async function createGroupInvite(inv: any) {
  await set(ref(db, 'group-invites/' + inv.id), inv);
  if (inv.creatorUid) {
    await set(ref(db, 'user-invites/' + inv.creatorUid + '/' + inv.id), {
      id: inv.id, type: inv.type, date: inv.date, time: inv.time,
      status: 'pending', created: inv.created, isGroup: true,
      title: inv.title || '',
    });
  }
}

export async function getGroupInvite(invId: string) {
  const snap = await get(ref(db, 'group-invites/' + invId));
  return snap.exists() ? snap.val() : null;
}

export async function joinGroupInvite(invId: string, participant: any) {
  const key = participant.uid || participant.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
  await set(ref(db, 'group-invites/' + invId + '/members/' + key), {
    name: participant.name,
    uid: participant.uid || null,
    status: participant.status || 'accepted',
    joinedAt: Date.now(),
  });
}

// ── Friends ──
export async function sendFriendRequest(fromUid: string, toUid: string, fromName: string) {
  const existing = await get(ref(db, 'friends/' + fromUid + '/' + toUid));
  if (existing.exists()) throw new Error('Вже у друзях');
  
  const q = query(ref(db, 'notifications/' + toUid), orderByChild('type'), equalTo('friend-request'));
  const notifsSnap = await get(q);
  if (notifsSnap.exists()) {
    let alreadySent = false;
    notifsSnap.forEach(c => { if (c.val().fromUid === fromUid) alreadySent = true; });
    if (alreadySent) throw new Error('Запит вже надіслано');
  }

  await addNotification(toUid, {
    type: 'friend-request',
    title: 'Запит на дружбу',
    body: `${fromName} хоче додати вас у друзі`,
    fromUid, fromName,
  });
  return 'sent';
}

export async function getFriends(uid: string) {
  const snap = await get(ref(db, 'friends/' + uid));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push(c.val()); });
  
  for (const f of list) {
    const pf = await getUserByUid(f.uid);
    if (pf) {
      if (pf.avatar) f.avatar = pf.avatar;
      if (pf.name) f.name = pf.name;
      if (pf.uniqueId) f.uniqueId = pf.uniqueId;
      if (pf.lastSeen) f.lastSeen = pf.lastSeen;
      f._pf = pf;
    }
  }
  return list;
}

export async function getFriendRequests(uid: string) {
  const snap = await get(ref(db, 'friend-requests/' + uid));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push(c.val()); });
  return list;
}

export async function acceptFriendRequest(myUid: string, fromUid: string) {
  const alreadyFriends = await get(ref(db, 'friends/' + myUid + '/' + fromUid));
  if (alreadyFriends.exists()) return;

  const myProfile = await getUserByUid(myUid);
  const theirProfile = await getUserByUid(fromUid);

  await set(ref(db, 'friends/' + myUid + '/' + fromUid), {
    uid: fromUid, name: theirProfile?.name || '', addedAt: Date.now(),
  });

  await addNotification(fromUid, {
    type: 'friend-accepted',
    title: '✓ Запит прийнято',
    body: `${myProfile?.name || 'Хтось'} прийняв вашу пропозицію дружби`,
    fromUid: myUid, fromName: myProfile?.name || '',
  });
}

export async function declineFriendRequest(myUid: string, fromUid: string) {
  await remove(ref(db, 'friend-requests/' + myUid + '/' + fromUid));
}

export async function removeFriend(myUid: string, friendUid: string) {
  await remove(ref(db, 'friends/' + myUid + '/' + friendUid));
  const myProfile = await getUserByUid(myUid);
  await addNotification(friendUid, {
    type: 'friend-removed',
    title: 'Друга видалено',
    body: `${myProfile?.name || 'Хтось'} видалив вас з друзів`,
    fromUid: myUid, fromName: myProfile?.name || '',
  });
}

// ── Notifications ──
export async function addNotification(toUid: string, data: any) {
  const refObj = push(ref(db, 'notifications/' + toUid));
  await set(refObj, {
    id: refObj.key,
    ...data,
    read: false,
    createdAt: Date.now(),
  });
}

export async function getNotifications(uid: string) {
  const q = query(ref(db, 'notifications/' + uid), orderByChild('createdAt'), limitToLast(50));
  const snap = await get(q);
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => {
    const val = c.val();
    if (val.title) val.title = val.title.replace(/<[^>]*>/g, '');
    if (val.body) val.body = val.body.replace(/<[^>]*>/g, '');
    list.push(val);
  });
  return list.reverse();
}

export async function markNotifRead(uid: string, notifId: string) {
  await set(ref(db, 'notifications/' + uid + '/' + notifId + '/read'), true);
}

export async function markAllNotifsRead(uid: string) {
  const snap = await get(ref(db, 'notifications/' + uid));
  if (!snap.exists()) return;
  const updates: any = {};
  snap.forEach(c => {
    const type = c.val().type;
    if (type !== 'invite' && type !== 'group-invite' && type !== 'friend-request') {
      updates[c.key + '/read'] = true;
    }
  });
  if (Object.keys(updates).length > 0) {
    await update(ref(db, 'notifications/' + uid), updates);
  }
}

export async function deleteNotification(uid: string, notifId: string) {
  await remove(ref(db, 'notifications/' + uid + '/' + notifId));
}

// ── Support Tickets ──
export async function createSupportTicket(ticket: any) {
  const refObj = push(ref(db, 'support_tickets'));
  const key = refObj.key;
  if (!key) return null;
  const ticketData = {
    id: key,
    type: ticket.type,
    subject: ticket.subject || ticket.type,
    authorUid: ticket.authorUid,
    authorName: ticket.authorName,
    status: 'open',
    createdAt: Date.now(),
    lastMessageAt: Date.now(),
    lastMessageText: ticket.firstMessage,
    unreadBySupport: true,
  };
  await set(refObj, ticketData);

  const msgRef = push(ref(db, 'support_tickets/' + key + '/messages'));
  await set(msgRef, {
    id: msgRef.key,
    uid: ticket.authorUid,
    name: ticket.authorName,
    role: 'user',
    text: ticket.firstMessage,
    imageUrl: null,
    createdAt: Date.now(),
  });
  return key;
}

export async function getUserTickets(uid: string) {
  const q = query(ref(db, 'support_tickets'), orderByChild('authorUid'), equalTo(uid));
  const snap = await get(q);
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push(c.val()); });
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getTicket(ticketId: string) {
  const snap = await get(ref(db, 'support_tickets/' + ticketId));
  return snap.exists() ? snap.val() : null;
}

export async function sendTicketMessage(ticketId: string, message: any) {
  const msgRef = push(ref(db, 'support_tickets/' + ticketId + '/messages'));
  await set(msgRef, {
    id: msgRef.key,
    uid: message.uid,
    name: message.name,
    role: message.role,
    text: message.text || null,
    imageUrl: message.imageUrl || null,
    createdAt: Date.now(),
  });
  
  const ticketUpdate: any = {
    lastMessageAt: Date.now(),
    lastMessageText: message.text || '📷 Зображення',
  };
  if (message.role === 'user') {
    ticketUpdate.unreadBySupport = true;
  } else {
    ticketUpdate.unreadByUser = true;
    ticketUpdate.unreadBySupport = false;
  }
  await update(ref(db, 'support_tickets/' + ticketId), ticketUpdate);
}

export function listenTicketMessages(ticketId: string, callback: (msgs: any[]) => void) {
  const messagesRef = ref(db, 'support_tickets/' + ticketId + '/messages');
  onValue(messagesRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => { list.push(c.val()); });
    }
    callback(list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
  });
}

export function stopListeningTicket(ticketId: string) {
  off(ref(db, 'support_tickets/' + ticketId + '/messages'));
}

export function listenTicket(ticketId: string, callback: (t: any) => void) {
  const ticketRef = ref(db, 'support_tickets/' + ticketId);
  onValue(ticketRef, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
}

export function stopListeningTicketMeta(ticketId: string) {
  off(ref(db, 'support_tickets/' + ticketId));
}

export async function markTicketReadByUser(ticketId: string) {
  await set(ref(db, 'support_tickets/' + ticketId + '/unreadByUser'), false);
}

export async function markTicketReadBySupport(ticketId: string) {
  await set(ref(db, 'support_tickets/' + ticketId + '/unreadBySupport'), false);
}

export async function resolveSupportTicket(ticketId: string, action: string, resolverUid?: string) {
  await update(ref(db, 'support_tickets/' + ticketId), {
    status: action,
    resolvedBy: resolverUid || null,
    resolvedAt: Date.now()
  });
}

export async function getSupportTickets() {
  const snap = await get(ref(db, 'support_tickets'));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push(c.val()); });
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

// ── Reports ──
export async function getReports() {
  const snap = await get(ref(db, 'reports'));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push({ ...c.val(), id: c.key }); });
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function resolveReport(reportId: string, status: string, resolverUid?: string) {
  await update(ref(db, 'reports/' + reportId), {
    status,
    resolvedBy: resolverUid || null,
    resolvedAt: Date.now()
  });
}

// ── Admin Stats ──
export async function getStats() {
  const usersSnap = await get(ref(db, 'users')).catch(() => null);
  const invitesSnap = await get(ref(db, 'invites')).catch(() => null);
  const groupSnap = await get(ref(db, 'group-invites')).catch(() => null);
  const reportsSnap = await get(ref(db, 'reports')).catch(() => null);
  const supportSnap = await get(ref(db, 'support_tickets')).catch(() => null);
  const statusesSnap = await get(ref(db, 'statuses')).catch(() => null);
  const friendsSnap = await get(ref(db, 'friends')).catch(() => null);

  const users: any[] = [];
  if (usersSnap && usersSnap.exists()) usersSnap.forEach(c => { users.push(c.val()); });

  let totalInvites = 0;
  let personalInvitesCount = 0;
  let groupInvitesCount = 0;
  const typeCounts: Record<string, number> = {};
  const personalInvites: any[] = [];
  const groupInvites: any[] = [];

  if (invitesSnap && invitesSnap.exists()) {
    invitesSnap.forEach(c => {
      totalInvites++;
      personalInvitesCount++;
      const inv = c.val();
      inv.id = c.key;
      personalInvites.push(inv);
      if (inv && inv.type) {
        typeCounts[inv.type] = (typeCounts[inv.type] || 0) + 1;
      }
    });
  }
  if (groupSnap && groupSnap.exists()) {
    groupSnap.forEach(c => {
      totalInvites++;
      groupInvitesCount++;
      const inv = c.val();
      inv.id = c.key;
      inv.isGroup = true;
      groupInvites.push(inv);
      if (inv && inv.type) {
        typeCounts[inv.type] = (typeCounts[inv.type] || 0) + 1;
      }
    });
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeUsers = users.filter(u => u.lastSeen > weekAgo).length;

  let acceptedInvites = 0;
  let declinedInvites = 0;
  let rescheduleInvites = 0;
  if (statusesSnap && statusesSnap.exists()) {
    statusesSnap.forEach(c => {
      const val = c.val();
      if (val === 'accepted') acceptedInvites++;
      else if (val === 'declined') declinedInvites++;
      else if (val === 'reschedule' || val === 'rescheduled') rescheduleInvites++;
    });
  }

  let founderCount = 0;
  let techAdminCount = 0;
  let moderatorCount = 0;
  let regularUserCount = 0;
  let bannedCount = 0;

  users.forEach(u => {
    if (u.banned) bannedCount++;
    if (u.role === 'founder') founderCount++;
    else if (u.role === 'tech-admin') techAdminCount++;
    else if (u.role === 'moderator') moderatorCount++;
    else regularUserCount++;
  });

  let pendingReports = 0, resolvedReports = 0, dismissedReports = 0;
  if (reportsSnap && reportsSnap.exists()) {
    reportsSnap.forEach(c => {
      const val = c.val();
      if (val.status === 'pending') pendingReports++;
      else if (val.status === 'resolved') resolvedReports++;
      else if (val.status === 'dismissed') dismissedReports++;
    });
  }

  let pendingSupport = 0, resolvedSupport = 0, dismissedSupport = 0;
  if (supportSnap && supportSnap.exists()) {
    supportSnap.forEach(c => {
      const val = c.val();
      if (val.status === 'pending') pendingSupport++;
      else if (val.status === 'resolved') resolvedSupport++;
      else if (val.status === 'dismissed') dismissedSupport++;
    });
  }

  let totalFriendsConnections = 0;
  if (friendsSnap && friendsSnap.exists()) {
    friendsSnap.forEach(userNode => {
      const val = userNode.val();
      if (val) {
        totalFriendsConnections += Object.keys(val).length;
      }
    });
  }
  totalFriendsConnections = Math.floor(totalFriendsConnections / 2);

  return {
    totalUsers: users.length,
    totalInvites,
    acceptedInvites,
    declinedInvites,
    rescheduleInvites,
    activeUsers,
    bannedCount,
    roleCounts: { founder: founderCount, techAdmin: techAdminCount, moderator: moderatorCount, user: regularUserCount },
    reportsCount: { pending: pendingReports, resolved: resolvedReports, dismissed: dismissedReports, total: pendingReports + resolvedReports + dismissedReports },
    supportCount: { pending: pendingSupport, resolved: resolvedSupport, dismissed: dismissedSupport, total: pendingSupport + resolvedSupport + dismissedSupport },
    totalFriendsConnections,
    users,
    personalInvitesCount,
    groupInvitesCount,
    typeCounts,
    personalInvites,
    groupInvites,
  };
}
