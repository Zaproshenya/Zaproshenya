'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { loadProfile, UserProfile } from '@/lib/firebase/auth';
import { ref, set, get, update, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { toast } from '@/components/Toast';
import { Icon } from '@/components/Icon';

interface AuthContextType {
  user: User | null | undefined;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  unreadCount: number;
  adminUnreadCount: number;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  profile: null,
  loading: true,
  updateProfile: () => {},
  unreadCount: 0,
  adminUnreadCount: 0,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const pathname = usePathname();

  const [is2faPending, setIs2faPending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resending, setResending] = useState(false);

  // Google registration completion state
  const [completeName, setCompleteName] = useState('');
  const [completeLogin, setCompleteLogin] = useState('');
  const [completeError, setCompleteError] = useState('');
  const [completeSaving, setCompleteSaving] = useState(false);

  const isRegistrationIncomplete = !!(user && !loading && (!profile || profile.registrationIncomplete));

  useEffect(() => {
    if (isRegistrationIncomplete) {
      if (!completeName) {
        setCompleteName(profile?.name || user?.displayName || '');
      }
      if (!completeLogin && user?.email) {
        const base = user.email.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 25);
        setCompleteLogin(base);
      }
    }
  }, [isRegistrationIncomplete, profile, user]);

  const isEmailVerificationPending = !!(
    user &&
    user.email &&
    !user.email.endsWith('@zap.app') &&
    !user.emailVerified &&
    !user.providerData?.some(p => p.providerId === 'google.com')
  );

  useEffect(() => {
    if (!user || !isEmailVerificationPending) return;

    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);
        const { updateProfileData } = await import('@/lib/firebase/auth');
        await updateProfileData(user.uid, { twoFactorEnabled: true });
        updateProfile({ twoFactorEnabled: true });
        localStorage.setItem('2fa_verified_' + user.uid, 'true');
        toast('Пошту успішно підтверджено! 2FA активовано. ✦', 'success');
        window.location.reload();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, isEmailVerificationPending]);

  useEffect(() => {
    if (user && profile && profile.twoFactorEnabled) {
      const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
      if (isGoogleUser) {
        setIs2faPending(false);
        return;
      }

      const isVerified = localStorage.getItem('2fa_verified_' + user.uid) === 'true';
      if (!isVerified) {
        setIs2faPending(true);
        if (!otpSent && !otpLoading) {
          sendOtpCode(user.uid, profile.email);
        }
      } else {
        setIs2faPending(false);
      }
    } else {
      setIs2faPending(false);
    }
  }, [user, profile]);

  const sendOtpCode = async (uid: string, email?: string) => {
    if (!email || !user) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/2fa/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Помилка надсилання коду');
      setOtpSent(true);
      if (data.dev_code) {
        toast(`[Тест] Код підтвердження: ${data.dev_code} ✦`, 'info');
        console.log("OTP Code (Dev Mode):", data.dev_code);
      } else {
        toast('Код підтвердження надіслано на пошту ✦', 'success');
      }
    } catch (e: any) {
      setOtpError(e.message || 'Помилка');
      toast(e.message || 'Помилка надсилання коду', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!user) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/2fa/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, code, token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Невірний код або термін дії закінчився');
      
      localStorage.setItem('2fa_verified_' + user.uid, 'true');
      setIs2faPending(false);
      setVerificationCode('');
      setOtpError('');
      toast('Вхід підтверджено! ✦', 'success');
    } catch (e: any) {
      setOtpError(e.message || 'Невірний код');
      toast(e.message || 'Невірний код', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancel2fa = async () => {
    const { logoutUser } = await import('@/lib/firebase/auth');
    await logoutUser();
    setIs2faPending(false);
    setOtpSent(false);
    setVerificationCode('');
    setOtpError('');
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setResending(true);
    try {
      const { sendVerification } = await import('@/lib/firebase/auth');
      await sendVerification(user);
      toast('Лист підтвердження надіслано знову ✦', 'success');
    } catch (e: any) {
      toast(e.message || 'Помилка надсилання листа', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleCancelVerification = async () => {
    const { logoutUser } = await import('@/lib/firebase/auth');
    await logoutUser();
    window.location.href = '/login';
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCompleteSaving(true);
    setCompleteError('');

    const cleanLogin = completeLogin.trim().toLowerCase();
    const cleanName = completeName.trim();

    try {
      if (cleanName.length < 2) throw new Error("Ім'я має бути не менше 2 символів");
      if (cleanLogin.length < 3) throw new Error("Логін має бути не менше 3 символів");
      if (!/^[a-z0-9._]+$/.test(cleanLogin)) throw new Error("Логін може містити лише латинські літери, цифри, крапку (.) та підкреслення (_)");

      // Check login uniqueness
      const loginCheck = await get(ref(db, 'logins/' + cleanLogin));
      if (loginCheck.exists()) throw new Error("Цей логін вже зайнятий");

      // Generate unique ID
      const { genUserId, isReservedId } = await import('@/lib/utils');
      let uniqueId = genUserId();
      // Regenerate if ID matches a reserved role pattern or already exists
      let idCheck = await get(ref(db, 'ids/' + uniqueId));
      while (idCheck.exists() || isReservedId(uniqueId)) {
        uniqueId = genUserId();
        idCheck = await get(ref(db, 'ids/' + uniqueId));
      }

      // Check if profile exists (meaning it's an existing incomplete registration from the database)
      // or if we need to create it from scratch.
      const userRef = ref(db, 'users/' + user.uid);
      const snap = await get(userRef);
      if (!snap.exists()) {
        const newProfile = {
          uid: user.uid,
          name: cleanName,
          login: cleanLogin,
          uniqueId: uniqueId,
          role: 'user',
          avatar: user.photoURL || null,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          email: user.email || null,
          twoFactorEnabled: false
        };
        await set(userRef, newProfile);
      } else {
        await update(userRef, {
          name: cleanName,
          login: cleanLogin,
          uniqueId: uniqueId,
          registrationIncomplete: null
        });
      }

      // Write indexes
      await set(ref(db, 'logins/' + cleanLogin), user.uid);
      await set(ref(db, 'ids/' + uniqueId), user.uid);

      toast("Реєстрацію успішно завершено! ✦", "success");
    } catch (err: any) {
      setCompleteError(err.message || "Помилка");
      toast(err.message || "Помилка збереження", "error");
    } finally {
      setCompleteSaving(false);
    }
  };

  const handleCancelRegistration = async () => {
    const { logoutUser } = await import('@/lib/firebase/auth');
    await logoutUser();
    window.location.reload();
  };

  useEffect(() => {
    if (!user || !profile) return;

    const pageActions: Record<string, string> = {
      '/home': 'Переглядає свої запрошення',
      '/create': 'Створює нове запрошення',
      '/profile': 'Редагує налаштування профілю',
      '/friends': 'Переглядає список друзів',
      '/notifications': 'Переглядає сповіщення',
      '/admin': 'Керує адмін-дашбордом',
    };

    let act = 'Активний на сайті';
    if (pathname) {
      if (pathname.startsWith('/u/')) {
        act = 'Переглядає профіль користувача';
      } else if (pathname.startsWith('/i/')) {
        act = 'Переглядає запрошення';
      } else if (pathname.startsWith('/g/')) {
        act = 'Переглядає групове запрошення';
      } else {
        act = pageActions[pathname] || 'Активний на сайті';
      }
    }

    set(ref(db, `users/${user.uid}/currentAction`), act).catch(() => {});
  }, [pathname, user, profile]);

  useEffect(() => {
    let dbUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (dbUnsubscribe) {
        dbUnsubscribe();
        dbUnsubscribe = null;
      }

      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        dbUnsubscribe = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const p = snapshot.val();
            setProfile(p);
            // Update last seen heartbeat
            set(ref(db, `users/${currentUser.uid}/lastSeen`), Date.now()).catch(() => {});

            // Self-healing check: if Firebase Auth has a verified real email, sync it to the database
            if (currentUser.emailVerified && currentUser.email && !currentUser.email.endsWith('@zap.app')) {
              if (p.email !== currentUser.email || !p.twoFactorEnabled || p.pendingEmail) {
                update(ref(db, `users/${currentUser.uid}`), {
                  email: currentUser.email,
                  twoFactorEnabled: true,
                  pendingEmail: null
                }).catch((err: any) => console.error("Error healing profile email:", err));
              }
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error loading user profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (dbUnsubscribe) dbUnsubscribe();
    };
  }, []);

  // Check if unban is needed at render time
  useEffect(() => {
    if (user && profile && profile.banned && profile.bannedUntil && Date.now() > profile.bannedUntil) {
      const performUnban = async () => {
        const { banUser } = await import('@/lib/firebase/db');
        await banUser(user.uid, false);
        updateProfile({ banned: false, bannedUntil: null });
      };
      performUnban();
    }
  }, [user, profile]);

  // Register push notifications on user login
  useEffect(() => {
    if (!user) return;

    const initPushNotifications = async () => {
      try {
        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
          return;
        }

        // Request permission if not already set
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') return;

        // Dynamically import messaging and config to prevent SSR errors
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { app } = await import('@/lib/firebase/config');
        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: 'BGfTmcxPeL2Y6-YVjUv--G-rUP0sD5WrWBiV2lxuRFySQx65UD3HlPKOPhxw4W2ZaLWZPGKaYeHuSAM5RPpeaFk',
        });

        if (token) {
          const { ref, set } = await import('firebase/database');
          const { db } = await import('@/lib/firebase/config');
          const safeTokenKey = btoa(token).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          await set(ref(db, `users/${user.uid}/fcmTokens/${safeTokenKey}`), token);
          console.log('✦ FCM token registered on new domain');
        }
      } catch (err) {
        console.warn('FCM registration failed:', err);
      }
    };

    initPushNotifications();
  }, [user]);

  const shownNotifs = useRef<Set<string>>(new Set());

  // Listen to new notifications in real-time and show Toast alerts
  useEffect(() => {
    if (!user) return;

    const notifQuery = query(
      ref(db, 'notifications/' + user.uid),
      orderByChild('createdAt'),
      limitToLast(5)
    );

    let isInitial = true;

    const unsubscribe = onValue(notifQuery, (snap) => {
      if (snap.exists()) {
        const notifs: any[] = [];
        snap.forEach((c) => {
          notifs.push({ ...c.val(), id: c.key });
        });

        // If it's the initial load, populate shownNotifs to prevent showing old notifications
        if (isInitial) {
          notifs.forEach(n => {
            shownNotifs.current.add(n.id);
          });
          isInitial = false;
          return;
        }

        // Show toast alerts for any new, unread notification
        notifs.forEach(n => {
          if (!n.read && !shownNotifs.current.has(n.id) && Date.now() - (n.createdAt || 0) < 30000) {
            shownNotifs.current.add(n.id);
            toast(`🔔 ${n.title}: ${n.body}`, 'info');
          }
        });
      } else {
        isInitial = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Listen to user's unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const notifsRef = ref(db, 'notifications/' + user.uid);
    const unsub = onValue(notifsRef, (snap) => {
      let count = 0;
      if (snap.exists()) {
        snap.forEach((c) => {
          if (c.val().read === false) count++;
        });
      }
      setUnreadCount(count);
    });

    return () => unsub();
  }, [user]);

  // Listen to admin panel unread counts (pending reports + support tickets unread by support)
  useEffect(() => {
    if (!user || !profile) {
      setAdminUnreadCount(0);
      return;
    }
    const isAdmin = profile.role === 'founder' || profile.role === 'tech-admin' || profile.role === 'moderator';
    if (!isAdmin) {
      setAdminUnreadCount(0);
      return;
    }

    const reportsRef = ref(db, 'reports');
    const supportRef = ref(db, 'support_tickets');

    let pendingReportsCount = 0;
    let unreadSupportCount = 0;

    const unsubReports = onValue(reportsRef, (snap) => {
      let count = 0;
      if (snap.exists()) {
        snap.forEach((c) => {
          if (c.val().status === 'pending') count++;
        });
      }
      pendingReportsCount = count;
      setAdminUnreadCount(pendingReportsCount + unreadSupportCount);
    });

    const unsubSupport = onValue(supportRef, (snap) => {
      let count = 0;
      if (snap.exists()) {
        snap.forEach((c) => {
          if (c.val().unreadBySupport === true) count++;
        });
      }
      unreadSupportCount = count;
      setAdminUnreadCount(pendingReportsCount + unreadSupportCount);
    });

    return () => {
      unsubReports();
      unsubSupport();
    };
  }, [user, profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const isAuthRequiredPage = pathname && (
    pathname === '/home' ||
    pathname === '/create' ||
    pathname === '/profile' ||
    pathname === '/friends' ||
    pathname === '/notifications' ||
    pathname === '/admin' ||
    pathname.startsWith('/u/')
  );

  const isBannedActive = profile?.banned && (!profile.bannedUntil || Date.now() <= profile.bannedUntil);
  if (user && isBannedActive && isAuthRequiredPage) {
    let banStatusTitle = 'Назавжди заблокований';
    let banStatusBody = 'Ваш акаунт було перманентно заблоковано модератором.';

    if (profile.bannedUntil) {
      const msLeft = profile.bannedUntil - Date.now();
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
      const minsLeft = Math.ceil(msLeft / (60 * 1000));

      banStatusTitle = `Заблокований на ${
        daysLeft > 1
          ? daysLeft + ' ' + (daysLeft <= 4 ? 'дні' : 'днів')
          : hoursLeft > 1
          ? hoursLeft + ' год'
          : minsLeft + ' хв'
      }`;

      const untilDate = new Date(profile.bannedUntil);
      const untilStr = untilDate.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      banStatusBody = `До розблокування залишилось: <strong>${
        daysLeft > 1 ? daysLeft + ' дн.' : hoursLeft > 1 ? hoursLeft + ' год.' : minsLeft + ' хв.'
      }</strong><br/><span style="color:var(--muted);font-size:.85rem">Розблокування: ${untilStr}</span>`;
    }

    const handleBanLogout = async () => {
      const { logoutUser } = await import('@/lib/firebase/auth');
      await logoutUser();
      window.location.href = '/login';
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--paper)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--red)' }}>
            <span className="ph ph-prohibit" style={{ fontSize: '3rem' }}></span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', marginBottom: '8px', color: 'var(--ink)' }}>{banStatusTitle}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '20px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: banStatusBody }} />
          <button className="btn btn-outline" onClick={handleBanLogout}>Вийти</button>
        </div>
      </div>
    );
  }

  if (isRegistrationIncomplete && user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--paper)' }}>
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '36px 30px', border: '1px solid rgba(201, 146, 42, 0.12)', borderRadius: '20px', background: 'linear-gradient(135deg, var(--card) 0%, #fffdfa 100%)', boxShadow: '0 20px 48px rgba(24, 18, 10, 0.08), 0 4px 12px rgba(24, 18, 10, 0.02)', animation: 'pop 0.3s var(--ease) both' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(201, 146, 42, 0.06)', border: '1.5px dashed rgba(201, 146, 42, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', margin: '0 auto 20px' }}>
            <Icon name="user-plus" size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.6rem', marginBottom: '10px' }}>Завершення реєстрації</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Ви успішно авторизувались через Google! Для завершення створення акаунту виберіть ваше ім'я та унікальний логін.
          </p>

          <form onSubmit={handleCompleteRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="auth-field-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                <Icon name="user" size={14} /> Ім'я
              </label>
              <input 
                type="text" 
                placeholder="Ваше ім'я" 
                maxLength={15} 
                value={completeName} 
                onChange={e => setCompleteName(e.target.value)}
                style={{ padding: '11px 18px', background: 'var(--warm)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-input)', color: 'var(--ink)', width: '100%', outline: 'none' }}
                disabled={completeSaving}
                required
              />
            </div>

            <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="auth-field-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                <Icon name="at" size={14} /> Логін
              </label>
              <input 
                type="text" 
                placeholder="Тільки латиниця, цифри, . та _ (3-25 симв.)" 
                maxLength={25} 
                value={completeLogin} 
                onChange={e => setCompleteLogin(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                style={{ padding: '11px 18px', background: 'var(--warm)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-input)', color: 'var(--ink)', width: '100%', outline: 'none' }}
                disabled={completeSaving}
                required
              />
            </div>

            {completeError && <div className="form-error show" style={{ marginTop: 0 }}>{completeError}</div>}
            
            <button className="btn btn-dark btn-full" type="submit" disabled={completeSaving || completeLogin.length < 3 || completeName.length < 2} style={{ padding: '12px', marginTop: '8px', borderRadius: '30px' }}>
              {completeSaving ? 'Збереження...' : 'Створити акаунт'}
            </button>
          </form>

          <button 
            onClick={handleCancelRegistration} 
            className="btn btn-ghost btn-full" 
            style={{ color: 'var(--red)', fontSize: '.85rem', marginTop: '12px', borderRadius: '30px' }}
          >
            Скасувати реєстрацію
          </button>
        </div>
      </div>
    );
  }

  if (isEmailVerificationPending && user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--paper)' }}>
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '32px 28px', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', animation: 'pop 0.3s var(--ease) both' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(var(--gold-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', margin: '0 auto 20px' }}>
            <Icon name="envelope-simple" size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.6rem', marginBottom: '10px' }}>Підтвердіть пошту</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
            На вашу електронну адресу <strong style={{ color: 'var(--ink)' }}>{user.email}</strong> надіслано лист із посиланням для підтвердження. 
            Будь ласка, перевірте пошту та підтвердіть акаунт.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(var(--gold-rgb), 0.06)', border: '1px solid rgba(var(--gold-rgb), 0.25)', padding: '12px 14px', borderRadius: '10px', textAlign: 'left', marginBottom: '24px', fontSize: '0.82rem', color: 'var(--ink)', lineHeight: '1.4' }}>
            <span style={{ fontSize: '1.1rem', marginTop: '-2px' }}>⚠️</span>
            <span>
              Не бачите листа? Обов'язково перевірте папки <strong>«Спам» (Spam)</strong>, <strong>«Реклама/Оповіщення» (Promotions)</strong> або надішліть лист повторно.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={async () => {
                await user.reload();
                if (user.emailVerified) {
                  const { updateProfileData } = await import('@/lib/firebase/auth');
                  await updateProfileData(user.uid, { twoFactorEnabled: true });
                  updateProfile({ twoFactorEnabled: true });
                  localStorage.setItem('2fa_verified_' + user.uid, 'true');
                  toast('Пошту успішно підтверджено! 2FA активовано. ✦', 'success');
                  window.location.reload();
                } else {
                  toast('Пошту ще не підтверджено. Перевірте ваш кошик або папку спам.', 'info');
                }
              }} 
              className="btn btn-dark btn-full" 
              style={{ padding: '12px' }}
            >
              Я підтвердив пошту
            </button>
            <button 
              onClick={handleResendVerification} 
              className="btn btn-outline btn-full btn-sm" 
              disabled={resending} 
              style={{ padding: '10px' }}
            >
              {resending ? 'Надсилання...' : 'Надіслати лист знову'}
            </button>
            <button 
              onClick={handleCancelVerification} 
              className="btn btn-ghost" 
              style={{ color: 'var(--red)', fontSize: '.85rem', marginTop: '8px' }}
            >
              Вийти з акаунту
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (is2faPending && user && profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--paper)' }}>
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '32px 28px', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', animation: 'pop 0.3s var(--ease) both' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(var(--gold-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', margin: '0 auto 20px' }}>
            <Icon name="shield-check" size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.6rem', marginBottom: '10px' }}>Двофакторна автентифікація</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Введіть 6-значний код підтвердження, надісланий на вашу електронну адресу <strong style={{ color: 'var(--ink)' }}>{profile.email}</strong>.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(verificationCode); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="000000" 
              maxLength={6} 
              value={verificationCode} 
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.2em', fontWeight: 700, padding: '10px', width: '100%', background: 'var(--warm)', border: '1.5px solid var(--border)', borderRadius: '8px', color: 'var(--ink)' }}
              disabled={otpLoading}
              required
            />
            {otpError && <div className="form-error show" style={{ marginTop: 0 }}>{otpError}</div>}
            <button className="btn btn-dark btn-full" type="submit" disabled={otpLoading || verificationCode.length < 6} style={{ padding: '12px' }}>
              {otpLoading ? 'Перевірка...' : 'Підтвердити'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => sendOtpCode(user.uid, profile.email)} className="btn btn-outline btn-full btn-sm" disabled={otpLoading} style={{ padding: '10px' }}>
              Надіслати код знову
            </button>
            <button onClick={handleCancel2fa} className="btn btn-ghost" style={{ color: 'var(--red)', fontSize: '.85rem' }}>
              Скасувати
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile, unreadCount, adminUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
