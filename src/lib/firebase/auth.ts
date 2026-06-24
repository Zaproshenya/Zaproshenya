import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User 
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
}

export async function register(name: string, login: string, password: string): Promise<UserProfile> {
  const cleanLogin = login.trim().toLowerCase();
  const cleanName = name.trim();

  if (cleanName.length < 2) throw new Error('Ім\'я має бути не менше 2 символів');
  if (cleanLogin.length < 3) throw new Error('Логін має бути не менше 3 символів');
  if (!/^[a-z0-9_]+$/.test(cleanLogin)) throw new Error('Логін: тільки латиниця, цифри, _');
  if (password.length < 6) throw new Error('Пароль має бути не менше 6 символів');

  const existing = await get(ref(db, 'logins/' + cleanLogin));
  if (existing.exists()) throw new Error('Цей логін вже зайнятий');

  const email = cleanLogin + '@zap.app';
  const cred = await createUserWithEmailAndPassword(auth, email, password);
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

  await set(ref(db, 'users/' + uid), profile);
  await set(ref(db, 'logins/' + cleanLogin), uid);
  await set(ref(db, 'ids/' + uniqueId), uid);

  return profile;
}

export async function loginUser(login: string, password: string) {
  const cleanLogin = login.trim().toLowerCase();
  const email = cleanLogin + '@zap.app';
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
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
  if (!/^[a-z0-9_]+$/.test(cleanNewLogin)) throw new Error('Логін: тільки латиниця, цифри, _');
  if (cleanNewLogin.length < 3) throw new Error('Логін має бути не менше 3 символів');

  const existing = await get(ref(db, 'logins/' + cleanNewLogin));
  if (existing.exists()) throw new Error('Цей логін вже зайнятий');

  const oldLogin = currentProfile.login;
  const newEmail = cleanNewLogin + '@zap.app';

  try {
    await verifyBeforeUpdateEmail(user, newEmail);
  } catch {
    await updateEmail(user, newEmail);
  }

  await remove(ref(db, 'logins/' + oldLogin));
  await set(ref(db, 'logins/' + cleanNewLogin), user.uid);
  await updateProfileData(user.uid, { login: cleanNewLogin });
}

export async function changePassword(user: User, currentProfile: UserProfile, oldPassword: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error('Пароль має бути не менше 6 символів');

  const email = currentProfile.login + '@zap.app';
  const cred = EmailAuthProvider.credential(email, oldPassword);
  await reauthenticateWithCredential(user, cred);

  await updatePassword(user, newPassword);
}

export async function deleteAccount(user: User, currentProfile: UserProfile, password: string) {
  const email = currentProfile.login + '@zap.app';
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
