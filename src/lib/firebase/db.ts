import { ref, get, set, update, remove, push, query, orderByChild, limitToLast, equalTo } from "firebase/database";
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

  // ToDo: Send notification using addNotification function (will be migrated to a separate module)
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
