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

  // If demoting to regular user — replace privileged ID with a random one
  if (newRole === 'user') {
    const snap = await get(ref(db, 'users/' + uid));
    if (snap.exists()) {
      const profile = snap.val();
      const oldId: string | undefined = profile.uniqueId;
      if (oldId) {
        const { genUserId, isReservedId } = await import('@/lib/utils');
        if (isReservedId(oldId)) {
          // Generate a fresh random ID
          let newId = genUserId();
          let check = await get(ref(db, 'ids/' + newId));
          while (check.exists()) {
            newId = genUserId();
            check = await get(ref(db, 'ids/' + newId));
          }
          await changeUserUniqueId(uid, oldId, newId);
        }
      }
    }
  }
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
      customLabel: inv.customLabel || null,
      customEmoji: inv.customEmoji || null,
    });
  }
}

// ── Custom presets ──
export async function saveCustomPreset(uid: string, preset: { id: string; label: string; emoji: string }) {
  await set(ref(db, `user-custom-presets/${uid}/${preset.id}`), preset);
}

export async function getCustomPresets(uid: string): Promise<{ id: string; label: string; emoji: string }[]> {
  const snap = await get(ref(db, `user-custom-presets/${uid}`));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as { id: string; label: string; emoji: string }[];
}

export async function deleteCustomPreset(uid: string, presetId: string) {
  await remove(ref(db, `user-custom-presets/${uid}/${presetId}`));
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

export async function deleteInvite(invId: string, uid?: string, isGroup?: boolean, isModeratorAction: boolean = false) {
  const path = isGroup ? 'group-invites/' : 'invites/';
  if (uid && isModeratorAction) {
    try {
      const inviteSnap = await get(ref(db, path + invId));
      if (inviteSnap.exists()) {
        const inviteVal = inviteSnap.val();
        const labelMap: Record<string, string> = {
          'date': 'Побачення',
          'walk': 'Прогулянка',
          'wedding': 'Весілля',
          'birthday': 'День народження',
          'party': 'Свято / Вечірка',
          'cinema': 'Кіно',
          'coffee': 'Кава',
          'dinner': 'Обід / Вечеря',
          'sport': 'Спорт / Активність',
          'meeting': 'Ділова зустріч',
          'travel': 'Подорож',
          'custom': 'Своє'
        };
        const localizedType = inviteVal.type === 'custom'
          ? (inviteVal.customLabel || 'Своє')
          : (labelMap[inviteVal.type] || inviteVal.type || 'запрошення');
        const inviteName = inviteVal.title || inviteVal.to || localizedType;
        await addNotification(uid, {
          type: 'invite-moderated',
          title: 'Запрошення видалено модератором',
          body: `Ваше запрошення "${inviteName}" було видалено модератором через скаргу або порушення правил.`
        });
      }
    } catch (e) {
      console.error('Failed to send invite moderated notification:', e);
    }
  }
  await remove(ref(db, path + invId));
  try {
    await remove(ref(db, 'statuses/' + invId));
  } catch (e) {
    console.error('Failed to remove status:', e);
  }
  try {
    await remove(ref(db, 'reschedule/' + invId));
  } catch (e) {
    console.error('Failed to remove reschedule:', e);
  }
  if (uid) {
    try {
      await remove(ref(db, 'user-invites/' + uid + '/' + invId));
    } catch (e) {
      console.error('Failed to remove user-invite:', e);
    }
  }
}

export async function saveReschedule(invId: string, data: { date: string; time: string }) {
  await set(ref(db, 'reschedule/' + invId), { ...data, ts: Date.now() });
  await set(ref(db, 'statuses/' + invId), 'reschedule');
}

export async function getReschedule(invId: string) {
  const snap = await get(ref(db, 'reschedule/' + invId));
  return snap.exists() ? snap.val() : null;
}

// ── Group Invites ──
export async function createGroupInvite(inv: any) {
  await set(ref(db, 'group-invites/' + inv.id), inv);
  if (inv.creatorUid) {
    await set(ref(db, 'user-invites/' + inv.creatorUid + '/' + inv.id), {
      id: inv.id, type: inv.type, date: inv.date, time: inv.time,
      status: 'pending', created: inv.created, isGroup: true,
      title: inv.title || '',
      customLabel: inv.customLabel || null,
      customEmoji: inv.customEmoji || null,
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
      if (pf.login) f.login = pf.login;
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
  if (!toUid || toUid === 'undefined') {
    console.warn('addNotification: toUid is invalid:', toUid);
    return;
  }
  const refObj = push(ref(db, 'notifications/' + toUid));
  await set(refObj, {
    id: refObj.key,
    ...data,
    read: false,
    createdAt: Date.now(),
  });
}

export async function getNotifications(uid: string) {
  if (!uid || uid === 'undefined') return [];
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
  if (!uid || uid === 'undefined' || !notifId) return;
  await set(ref(db, 'notifications/' + uid + '/' + notifId + '/read'), true);
}

export async function markAllNotifsRead(uid: string) {
  if (!uid || uid === 'undefined') return;
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
  if (!uid || uid === 'undefined' || !notifId) return;
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
    avatar: message.avatar || null,
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

    try {
      const ticketSnap = await get(ref(db, 'support_tickets/' + ticketId));
      if (ticketSnap.exists()) {
        const ticketVal = ticketSnap.val();
        if (ticketVal.authorUid) {
          await addNotification(ticketVal.authorUid, {
            type: 'support-reply',
            ticketId,
            title: 'Нова відповідь від підтримки',
            body: `Підтримка відповіла на ваше звернення "${ticketVal.subject || 'без теми'}": ${message.text ? message.text.slice(0, 60) : '📷 Зображення'}`
          });
        }
      }
    } catch (e) {
      console.error('Failed to send support reply notification:', e);
    }
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

export async function deleteSupportTicket(ticketId: string) {
  await remove(ref(db, 'support_tickets/' + ticketId));
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

  try {
    const reportSnap = await get(ref(db, 'reports/' + reportId));
    if (reportSnap.exists()) {
      const reportVal = reportSnap.val();
      if (reportVal.reporterUid) {
        const isApproved = status === 'resolved';
        await addNotification(reportVal.reporterUid, {
          type: 'report-resolved',
          reportId,
          title: isApproved ? 'Скаргу розглянуто' : 'Скаргу відхилено',
          body: isApproved 
            ? `Адміністрація вжила заходів щодо вашої скарги на запрошення "${reportVal.reason || 'без теми'}". Дякуємо за допомогу!`
            : `Адміністрація відхилила вашу скаргу на запрошення "${reportVal.reason || 'без теми'}" після перевірки.`
        });
      }
    }
  } catch (e) {
    console.error('Failed to send report resolved notification:', e);
  }
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

// ── Real-time Database Listeners & Reporting ──

export async function createReport(report: any) {
  const refObj = push(ref(db, 'reports'));
  await set(refObj, {
    id: refObj.key,
    ...report,
    status: 'pending',
    createdAt: Date.now(),
  });
  return refObj.key;
}

export function listenToInvite(invId: string, callback: (data: any) => void) {
  const inviteRef = ref(db, 'invites/' + invId);
  onValue(inviteRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(inviteRef);
}

export function listenToInviteStatus(invId: string, callback: (status: string | null) => void) {
  const statusRef = ref(db, 'statuses/' + invId);
  onValue(statusRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(statusRef);
}

export function listenToGroupInvite(invId: string, callback: (data: any) => void) {
  const groupRef = ref(db, 'group-invites/' + invId);
  onValue(groupRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(groupRef);
}

export function listenUserInvites(uid: string, callback: (list: any[]) => void) {
  const invitesRef = ref(db, 'user-invites/' + uid);
  onValue(invitesRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => { list.push(c.val()); });
    }
    callback(list.sort((a, b) => (b.created || 0) - (a.created || 0)));
  });
  return () => off(invitesRef);
}

export function listenNotifications(uid: string, callback: (list: any[]) => void) {
  if (!uid || uid === 'undefined') {
    callback([]);
    return () => {};
  }
  const q = query(ref(db, 'notifications/' + uid), orderByChild('createdAt'), limitToLast(50));
  onValue(q, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => {
        const val = c.val();
        if (val.title) val.title = val.title.replace(/<[^>]*>/g, '');
        if (val.body) val.body = val.body.replace(/<[^>]*>/g, '');
        list.push(val);
      });
    }
    callback(list.reverse());
  });
  return () => off(ref(db, 'notifications/' + uid));
}

export function listenAdminUsers(callback: (users: any[]) => void) {
  const usersRef = ref(db, 'users');
  onValue(usersRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => { list.push(c.val()); });
    }
    callback(list);
  });
  return () => off(usersRef);
}

export function listenAdminInvites(callback: (invites: any[]) => void) {
  const invitesRef = ref(db, 'invites');
  onValue(invitesRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => {
        const val = c.val();
        val.id = c.key;
        list.push(val);
      });
    }
    callback(list);
  });
  return () => off(invitesRef);
}

export function listenAdminGroupInvites(callback: (groupInvites: any[]) => void) {
  const groupRef = ref(db, 'group-invites');
  onValue(groupRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => {
        const val = c.val();
        val.id = c.key;
        val.isGroup = true;
        list.push(val);
      });
    }
    callback(list);
  });
  return () => off(groupRef);
}

export function listenAdminReports(callback: (reports: any[]) => void) {
  const reportsRef = ref(db, 'reports');
  onValue(reportsRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => { list.push({ ...c.val(), id: c.key }); });
    }
    callback(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  });
  return () => off(reportsRef);
}

export function listenAdminSupportTickets(callback: (tickets: any[]) => void) {
  const supportRef = ref(db, 'support_tickets');
  onValue(supportRef, (snap) => {
    const list: any[] = [];
    if (snap.exists()) {
      snap.forEach(c => { list.push(c.val()); });
    }
    callback(list.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(supportRef);
}

export function listenAdminStatuses(callback: (statuses: Record<string, string>) => void) {
  const statusesRef = ref(db, 'statuses');
  onValue(statusesRef, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return () => off(statusesRef);
}

export function listenAdminFriends(callback: (friends: Record<string, any>) => void) {
  const friendsRef = ref(db, 'friends');
  onValue(friendsRef, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return () => off(friendsRef);
}

export async function adminDeleteAccount(uid: string, login?: string, uniqueId?: string) {
  if (!uid || uid === 'undefined') {
    console.warn('adminDeleteAccount: uid is invalid:', uid);
    return;
  }
  await remove(ref(db, 'users/' + uid));
  if (login) {
    await remove(ref(db, 'logins/' + login.toLowerCase().trim()));
  }
  if (uniqueId) {
    await remove(ref(db, 'ids/' + uniqueId.trim()));
  }
  await remove(ref(db, 'notifications/' + uid));
  await remove(ref(db, 'friends/' + uid));
  await remove(ref(db, 'friend-requests/' + uid));
  await remove(ref(db, 'user-invites/' + uid));
}

// ── Change user uniqueId atomically across the whole database ──
export async function changeUserUniqueId(uid: string, oldId: string, newId: string) {
  const updates: Record<string, any> = {};

  // Update user profile
  updates['users/' + uid + '/uniqueId'] = newId;

  // Swap ids/ index
  updates['ids/' + oldId.trim()] = null;
  updates['ids/' + newId.trim()] = uid;

  await update(ref(db), updates);
}

// ── Preview role ID changes WITHOUT applying ──
export async function previewAutoAssignRoleIds(): Promise<Array<{ uid: string; name: string; role: string; oldId: string; newId: string }>> {
  const { genRoleUserId } = await import('@/lib/utils');

  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return [];

  const users: any[] = [];
  snap.forEach(c => { users.push(c.val()); });

  const moderators = users.filter(u => u.role === 'moderator').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const techAdmins = users.filter(u => u.role === 'tech-admin');
  const founders = users.filter(u => u.role === 'founder');

  const toUpdate: Array<{ uid: string; name: string; role: string; oldId: string; newId: string }> = [];

  moderators.forEach((u, i) => {
    const expectedId = genRoleUserId('moderator', i + 1);
    if (u.uniqueId !== expectedId) {
      toUpdate.push({ uid: u.uid, name: u.name || '', role: 'moderator', oldId: u.uniqueId || '', newId: expectedId });
    }
  });
  techAdmins.forEach(u => {
    const expectedId = genRoleUserId('tech-admin');
    if (u.uniqueId !== expectedId) toUpdate.push({ uid: u.uid, name: u.name || '', role: 'tech-admin', oldId: u.uniqueId || '', newId: expectedId });
  });
  founders.forEach(u => {
    const expectedId = genRoleUserId('founder');
    if (u.uniqueId !== expectedId) toUpdate.push({ uid: u.uid, name: u.name || '', role: 'founder', oldId: u.uniqueId || '', newId: expectedId });
  });

  return toUpdate;
}

// ── Apply role-based IDs to all privileged users ──
export async function autoAssignRoleIds(): Promise<{ updated: number; skipped: number }> {
  const toUpdate = await previewAutoAssignRoleIds();

  let updated = 0;
  for (const item of toUpdate) {
    try {
      await changeUserUniqueId(item.uid, item.oldId, item.newId);
      updated++;
    } catch (e) {
      console.error('autoAssignRoleIds: failed to update', item.uid, e);
    }
  }

  return { updated, skipped: toUpdate.length - updated };
}

// ── Staff Action Logging ──

export async function logStaffAction(adminUid: string, adminName: string, action: string, targetUid?: string, targetName?: string) {
  if (!adminUid) return; // guard: skip if no admin uid
  const logRef = push(ref(db, 'staff_logs'));
  // Write WITHOUT pinned field — avoids child-rule permission issues for moderators
  await set(logRef, {
    id: logRef.key,
    adminUid,
    adminName: adminName || '',
    action,
    targetUid: targetUid || null,
    targetName: targetName || null,
    createdAt: Date.now(),
  });

  // Fire-and-forget rotation (never blocks the log write, never throws to caller)
  rotateStaffLogs();
}

function rotateStaffLogs() {
  get(ref(db, 'staff_logs')).then(allSnap => {
    if (!allSnap.exists()) return;
    const all: any[] = [];
    allSnap.forEach(c => { all.push({ key: c.key, ...c.val() }); });
    // Keep pinned entries always; rotate non-pinned down to 50
    const nonPinned = all.filter(l => !l.pinned).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (nonPinned.length > 50) {
      const toDelete = nonPinned.slice(0, nonPinned.length - 50);
      const delUpdates: Record<string, null> = {};
      toDelete.forEach(l => { delUpdates['staff_logs/' + l.key] = null; });
      update(ref(db), delUpdates).catch(() => {});
    }
  }).catch(() => {});
}

export async function pinStaffLog(logId: string, pinned: boolean) {
  await set(ref(db, 'staff_logs/' + logId + '/pinned'), pinned);
}

export async function getStaffActionLog(): Promise<any[]> {
  const snap = await get(ref(db, 'staff_logs'));
  if (!snap.exists()) return [];
  const list: any[] = [];
  snap.forEach(c => { list.push({ key: c.key, ...c.val() }); });
  // Pinned first, then by date desc
  return list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

export function listenStaffActionLog(callback: (logs: any[]) => void) {
  const logsRef = ref(db, 'staff_logs');
  onValue(logsRef, snap => {
    const list: any[] = [];
    if (snap.exists()) snap.forEach(c => { list.push({ key: c.key, ...c.val() }); });
    callback(list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    }));
  });
  return () => off(logsRef);
}

// ── Moderator Permissions ──
export async function updateModeratorPermissions(uid: string, permissions: Record<string, boolean>) {
  await set(ref(db, 'users/' + uid + '/permissions'), permissions);
}
