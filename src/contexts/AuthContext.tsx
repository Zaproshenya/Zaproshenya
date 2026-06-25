'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { loadProfile, UserProfile } from '@/lib/firebase/auth';
import { ref, set, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { toast } from '@/components/Toast';

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const p = await loadProfile(currentUser.uid);
        setProfile(p);
        if (p) {
          // Update last seen heartbeat
          set(ref(db, `users/${currentUser.uid}/lastSeen`), Date.now()).catch(() => {});
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  if (user && profile?.banned && isAuthRequiredPage) {
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile, unreadCount, adminUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
