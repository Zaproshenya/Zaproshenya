import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { ref, set, get, update, remove } from "firebase/database";
import { auth, db } from "./config";
import { genUserId } from "../utils";

export interface UserProfile {
  uid: string;
  name: string;
  login: string;
  uniqueId: string;
  role: string;
  avatar?: string | null;
  createdAt: number;
  lastSeen: number;
  banned?: boolean;
  bannedUntil?: number | null;
  email?: string;
  twoFactorEnabled?: boolean;
  registrationIncomplete?: boolean;
  pendingEmail?: string;
}

export async function register(name: string, login: string, password: string, email?: string): Promise<UserProfile> {
  const cleanLogin = login.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanEmail = email?.trim().toLowerCase();

  if (cleanName.length < 2) throw new Error('Ім\'я має бути не менше 2 символів');
  if (cleanLogin.length < 3) throw new Error('Логін має бути не менше 3 символів');
  if (!/^[a-z0-9._]+$/.test(cleanLogin)) throw new Error('Логін: тільки латиниця, цифри, крапка (.) та підкреслення (_)');
  if (password.length < 6) throw new Error('Пароль має бути не менше 6 символів');
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Некоректний формат пошти');

  const existing = await get(ref(db, 'logins/' + cleanLogin));
  if (existing.exists()) throw new Error('Цей логін вже зайнятий');

  const authEmail = cleanEmail || (cleanLogin + '@zap.app');
  const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
  const uid = cred.user.uid;

  let uniqueId = genUserId();
  let idCheck = await get(ref(db, 'ids/' + uniqueId));
  while (idCheck.exists()) {
    uniqueId = genUserId();
    idCheck = await get(ref(db, 'ids/' + uniqueId));
  }

  const profile: UserProfile = {
    uid,
    name: cleanName,
    login: cleanLogin,
    uniqueId,
    role: 'user',
    avatar: null,
    createdAt: Date.now(),
    lastSeen: Date.now(),
  };

  if (cleanEmail) {
    profile.email = cleanEmail;
    profile.twoFactorEnabled = true;
    await sendEmailVerification(cred.user);
  }

  await set(ref(db, 'users/' + uid), profile);
  await set(ref(db, 'logins/' + cleanLogin), uid);
  await set(ref(db, 'ids/' + uniqueId), uid);

  return profile;
}

export async function loginUser(loginOrEmail: string, password: string) {
  const clean = loginOrEmail.trim().toLowerCase();

  if (!clean.includes('@')) {
    // If it's a username, check if they have bound a real email in their profile
    try {
      const loginSnap = await get(ref(db, 'logins/' + clean));
      if (loginSnap.exists()) {
        const uid = loginSnap.val();
        const userSnap = await get(ref(db, 'users/' + uid));
        if (userSnap.exists()) {
          const profile = userSnap.val();
          const candidates: string[] = [];

          if (profile.email && !profile.email.endsWith('@zap.app')) {
            candidates.push(profile.email);
          }
          if (profile.pendingEmail && !profile.pendingEmail.endsWith('@zap.app')) {
            candidates.push(profile.pendingEmail);
          }
          candidates.push(clean + '@zap.app');

          const uniqueCandidates = Array.from(new Set(candidates));
          let lastError: any = null;
          for (const cand of uniqueCandidates) {
            try {
              return await signInWithEmailAndPassword(auth, cand, password);
            } catch (err: any) {
              lastError = err;
            }
          }
          if (lastError) throw lastError;
        }
      }
    } catch (e) {
      // Fallback below
    }
    return await signInWithEmailAndPassword(auth, clean + '@zap.app', password);
  }

  return await signInWithEmailAndPassword(auth, clean, password);
}

export async function logoutUser() {
  if (typeof window !== 'undefined') {
    const uid = auth.currentUser?.uid;
    if (uid) {
      localStorage.removeItem('2fa_verified_' + uid);
    }
  }
  await signOut(auth);
}

export async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, 'users/' + uid));
  return snap.exists() ? snap.val() : null;
}

export async function updateProfileData(uid: string, updates: Partial<UserProfile>) {
  await update(ref(db, 'users/' + uid), updates);
}

export async function changeLogin(user: User, currentProfile: UserProfile, newLogin: string) {
  const cleanNewLogin = newLogin.trim().toLowerCase();
  if (!/^[a-z0-9._]+$/.test(cleanNewLogin)) throw new Error('Логін: тільки латиниця, цифри, крапка (.) та підкреслення (_)');
  if (cleanNewLogin.length < 3) throw new Error('Логін має бути не менше 3 символів');

  const existing = await get(ref(db, 'logins/' + cleanNewLogin));
  if (existing.exists()) throw new Error('Цей логін вже зайнятий');

  const oldLogin = currentProfile.login;
  const hasRealEmail = currentProfile.email && !currentProfile.email.endsWith('@zap.app');

  if (!hasRealEmail) {
    const newEmail = cleanNewLogin + '@zap.app';
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
    } catch {
      await updateEmail(user, newEmail);
    }
  }

  await remove(ref(db, 'logins/' + oldLogin));
  await set(ref(db, 'logins/' + cleanNewLogin), user.uid);
  await updateProfileData(user.uid, { login: cleanNewLogin });
}

export async function changePassword(user: User, currentProfile: UserProfile, oldPassword: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error('Пароль має бути не менше 6 символів');

  const email = user.email || (currentProfile.login + '@zap.app');
  const cred = EmailAuthProvider.credential(email, oldPassword);
  await reauthenticateWithCredential(user, cred);

  await updatePassword(user, newPassword);
}

export async function deleteAccount(user: User, currentProfile: UserProfile, password: string) {
  const email = user.email || (currentProfile.login + '@zap.app');
  const cred = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, cred);

  const uid = user.uid;
  const login_val = currentProfile.login;
  const uniqueId = currentProfile.uniqueId;

  await remove(ref(db, 'users/' + uid));
  await remove(ref(db, 'logins/' + login_val));
  await remove(ref(db, 'ids/' + uniqueId));
  await remove(ref(db, 'notifications/' + uid));
  await remove(ref(db, 'friends/' + uid));
  await remove(ref(db, 'friend-requests/' + uid));

  await user.delete();
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerification(user: User) {
  await sendEmailVerification(user);
}

export async function verifyAndChangeEmail(user: User, newEmail: string) {
  await verifyBeforeUpdateEmail(user, newEmail);
  await update(ref(db, 'users/' + user.uid), { pendingEmail: newEmail });
}

export async function signInWithSocial(providerName: 'google'): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const uid = user.uid;

  const snap = await get(ref(db, 'users/' + uid));
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      name: user.displayName || 'Користувач',
      login: '',
      uniqueId: '',
      role: 'user',
      avatar: user.photoURL || null,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      registrationIncomplete: true
    };

    if (user.email) {
      profile.email = user.email;
      profile.twoFactorEnabled = false;
    }

    await set(ref(db, 'users/' + uid), profile);
    return profile;
  }

  return snap.val();
}
