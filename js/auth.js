/* ═══════════════════════════════════════════════════════
   Auth — Registration, Login, Session
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──
  let currentUser = null;   // Firebase Auth user
  let currentProfile = null; // Our user profile from DB

  function getUser() { return currentUser; }
  function getProfile() { return currentProfile; }

  function isAdmin() {
    const role = currentProfile?.role;
    return role === 'founder' || role === 'tech-admin';
  }

  function isModerator() {
    return isAdmin() || currentProfile?.role === 'moderator';
  }

  // ═══════════════════════════════════════════════════════
  // Register — atomic multi-location write + auto-rollback
  // ═══════════════════════════════════════════════════════
  async function register(name, login, password) {
    if (!ZAP.authInstance || !ZAP.dbRef) throw new Error('Firebase не ініціалізовано');

    login = login.trim().toLowerCase();
    name  = name.trim();

    if (!name || name.length < 2) throw new Error('Ім\'я має бути не менше 2 символів');
    if (!login || login.length < 3) throw new Error('Логін має бути не менше 3 символів');
    if (!/^[a-z0-9_]+$/.test(login)) throw new Error('Логін: тільки латиниця, цифри, _');
    if (!password || password.length < 6) throw new Error('Пароль має бути не менше 6 символів');

    // Check login uniqueness
    const existing = await ZAP.dbRef.ref('logins/' + login).get();
    if (existing.exists()) throw new Error('Цей логін вже зайнятий');

    // Create Firebase Auth user (login@zap.app as fake email)
    const email = login + '@zap.app';
    let cred;
    try {
      cred = await ZAP.authInstance.createUserWithEmailAndPassword(email, password);
    } catch (e) {
      throw e;
    }
    const uid = cred.user.uid;

    // Generate unique public ID
    let uniqueId = ZAP.utils.genUserId();
    let idCheck = await ZAP.dbRef.ref('ids/' + uniqueId).get();
    while (idCheck.exists()) {
      uniqueId = ZAP.utils.genUserId();
      idCheck = await ZAP.dbRef.ref('ids/' + uniqueId).get();
    }

    const role = 'user';

    const profile = {
      uid,
      name,
      login,
      uniqueId,
      role,
      avatar: null,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    // Atomic multi-location write — either all succeed or all fail
    const updates = {};
    updates['users/' + uid] = profile;
    updates['logins/' + login] = uid;
    updates['ids/' + uniqueId] = uid;
    updates['profiles-public/' + uid] = {
      name, uniqueId, avatar: null, lastSeen: Date.now()
    };

    try {
      await ZAP.dbRef.ref().update(updates);
    } catch (e) {
      // Rollback: delete auth account if DB write failed
      try { await cred.user.delete(); } catch (_) {}
      throw new Error('Не вдалося зберегти профіль: ' + e.message);
    }

    currentProfile = profile;
    return profile;
  }

  // ── Login ──
  async function login(login, password) {
    if (!ZAP.authInstance) throw new Error('Firebase не ініціалізовано');

    login = login.trim().toLowerCase();
    const email = login + '@zap.app';

    await ZAP.authInstance.signInWithEmailAndPassword(email, password);
    // Profile will be loaded by onAuthStateChanged
  }

  // ── Logout — clean up all listeners & intervals ──
  async function logout() {
    if (!ZAP.authInstance) return;
    const uid = currentUser?.uid;
    ZAP.notifications.stopListeningNotifications();
    ZAP.notifications.stopBanListener();
    ZAP.notifications.clearTimers();
    if (uid) ZAP.notifications.deleteFCMToken(uid);
    // Stop home page listener
    if (ZAP.pages?.home?._listening) {
      ZAP.db.stopListening('statuses');
      ZAP.db.stopListening('user-invites/' + uid);
      ZAP.pages.home._listening = false;
    }
    await ZAP.authInstance.signOut();
    currentUser = null;
    currentProfile = null;
  }

  // ── Load profile ──
  async function loadProfile(uid) {
    if (!ZAP.dbRef) return null;
    try {
      const snap = await ZAP.dbRef.ref('users/' + uid).get();
      return snap.exists() ? snap.val() : null;
    } catch (e) {
      console.warn('loadProfile:', e);
      return null;
    }
  }

  // ── Update profile (atomic, also syncs profiles-public) ──
  async function updateProfile(uid, updates) {
    if (!ZAP.dbRef) return;
    const rootUpdates = {};
    // Always also update profiles-public mirror for whitelisted fields
    const PUBLIC_FIELDS = ['name', 'avatar', 'lastSeen'];
    let publicChanged = false;
    for (const k of PUBLIC_FIELDS) {
      if (k in updates) {
        rootUpdates['profiles-public/' + uid + '/' + k] = updates[k];
        publicChanged = true;
      }
    }
    for (const [k, v] of Object.entries(updates)) {
      rootUpdates['users/' + uid + '/' + k] = v;
    }
    await ZAP.dbRef.ref().update(rootUpdates);
    if (uid === currentUser?.uid) {
      currentProfile = { ...currentProfile, ...updates };
    }
  }

  // ── Change login — handles TOCTOU via Security Rules ──
  async function changeLogin(newLogin) {
    if (!currentUser || !currentProfile) throw new Error('Не авторизовано');
    newLogin = newLogin.trim().toLowerCase();

    if (!/^[a-z0-9_]+$/.test(newLogin)) throw new Error('Логін: тільки латиниця, цифри, _');
    if (newLogin.length < 3) throw new Error('Логін має бути не менше 3 символів');
    if (newLogin === currentProfile.login) throw new Error('Це вже ваш поточний логін');

    // Pre-check uniqueness (final protection is via Security Rules)
    const existing = await ZAP.dbRef.ref('logins/' + newLogin).get();
    if (existing.exists() && existing.val() !== currentUser.uid) {
      throw new Error('Цей логін вже зайнятий');
    }

    const oldLogin = currentProfile.login;
    const newEmail = newLogin + '@zap.app';

    // Try modern method first, fall back to deprecated for compat
    if (currentUser.verifyBeforeUpdateEmail) {
      try { await currentUser.verifyBeforeUpdateEmail(newEmail); }
      catch {
        try { await currentUser.updateEmail(newEmail); }
        catch (e) {
          if (e.code === 'auth/requires-recent-login') {
            throw new Error('Для зміни логіну увійдіть знову');
          }
          throw e;
        }
      }
    } else {
      await currentUser.updateEmail(newEmail);
    }

    // Atomic multi-location update
    const updates = {};
    updates['logins/' + oldLogin] = null;
    updates['logins/' + newLogin] = currentUser.uid;
    updates['users/' + currentUser.uid + '/login'] = newLogin;
    updates['profiles-public/' + currentUser.uid + '/name'] = currentProfile.name;

    try {
      await ZAP.dbRef.ref().update(updates);
      currentProfile.login = newLogin;
    } catch (e) {
      // Rollback email if DB write failed
      try { await currentUser.updateEmail(oldLogin + '@zap.app'); } catch (_) {}
      throw new Error('Не вдалося оновити логін: ' + e.message);
    }
  }

  // ── Change password ──
  async function changePassword(oldPassword, newPassword) {
    if (!currentUser || !currentProfile) throw new Error('Не авторизовано');
    if (newPassword.length < 6) throw new Error('Пароль має бути не менше 6 символів');

    // Reauthenticate
    const email = currentProfile.login + '@zap.app';
    const cred = firebase.auth.EmailAuthProvider.credential(email, oldPassword);
    await currentUser.reauthenticateWithCredential(cred);

    await currentUser.updatePassword(newPassword);
  }

  // ── Upload avatar ──
  async function uploadAvatar(file) {
    if (!ZAP.dbRef || !currentUser) throw new Error('Недоступно');

    // Validate file
    if (!file.type.startsWith('image/')) throw new Error('Тільки зображення');
    if (file.size > 5 * 1024 * 1024) throw new Error('Максимум 5 МБ');

    // Resize on client and convert to Base64
    const base64Url = await resizeImageToBase64(file, 256);

    // Save URL (Base64 string) in profile inside Realtime DB
    await updateProfile(currentUser.uid, { avatar: base64Url });

    return base64Url;
  }

  // ── Resize image on client to Base64 ──
  function resizeImageToBase64(file, maxSize) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const reader = new FileReader();

      reader.onload = e => {
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
          else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ── Delete account — cleans all orphan data ──
  async function deleteAccount(password) {
    if (!currentUser || !currentProfile) throw new Error('Не авторизовано');

    // Reauthenticate
    const email = currentProfile.login + '@zap.app';
    const cred = firebase.auth.EmailAuthProvider.credential(email, password);
    await currentUser.reauthenticateWithCredential(cred);

    const uid = currentUser.uid;
    const login_val = currentProfile.login;
    const uniqueId = currentProfile.uniqueId;

    // Collect user's invites (so we can remove them too)
    const userInvitesSnap = await ZAP.dbRef.ref('user-invites/' + uid).get();
    const inviteIds = [];
    if (userInvitesSnap.exists()) {
      userInvitesSnap.forEach(c => { inviteIds.push(c.key); });
    }

    // Atomic multi-location delete
    const updates = {};
    updates['users/' + uid] = null;
    updates['profiles-public/' + uid] = null;
    updates['logins/' + login_val] = null;
    updates['ids/' + uniqueId] = null;
    updates['notifications/' + uid] = null;
    updates['friends/' + uid] = null;
    updates['friend-requests/' + uid] = null;
    updates['user-invites/' + uid] = null;

    // Remove this user's invites (their creations)
    for (const invId of inviteIds) {
      updates['invites/' + invId] = null;
      updates['statuses/' + invId] = null;
      updates['reschedule/' + invId] = null;
      updates['group-invites/' + invId] = null;
    }

    // Remove user from others' friends lists (best-effort scan)
    // Note: this is N+1 by nature — for production use a Cloud Function
    try {
      const allFriendsSnap = await ZAP.dbRef.ref('friends').get();
      if (allFriendsSnap.exists()) {
        allFriendsSnap.forEach(userNode => {
          if (userNode.key !== uid && userNode.val() && userNode.val()[uid]) {
            updates['friends/' + userNode.key + '/' + uid] = null;
          }
        });
      }
    } catch (e) {
      console.warn('Could not clean friends lists:', e.message);
    }

    await ZAP.dbRef.ref().update(updates);

    // Delete auth account
    await currentUser.delete();
    currentUser = null;
    currentProfile = null;
  }

  // ── Auth state listener ──
  function onAuthReady(callback) {
    if (!ZAP.authInstance) {
      callback(null);
      return;
    }
    ZAP.authInstance.onAuthStateChanged(async user => {
      currentUser = user;
      if (user) {
        currentProfile = await loadProfile(user.uid);
        // Update lastSeen
        if (currentProfile) {
          ZAP.dbRef.ref('users/' + user.uid + '/lastSeen').set(Date.now()).catch(() => { });
          ZAP.dbRef.ref('profiles-public/' + user.uid + '/lastSeen').set(Date.now()).catch(() => { });
        }
      } else {
        currentProfile = null;
        ZAP.notifications.stopListeningNotifications();
      }
      callback(user);
    });
  }

  ZAP.auth = {
    getUser, getProfile, isAdmin, isModerator,
    register, login, logout,
    loadProfile, updateProfile,
    changeLogin, changePassword,
    uploadAvatar, deleteAccount,
    onAuthReady,
  };
})();
