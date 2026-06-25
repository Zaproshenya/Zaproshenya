'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { loadProfile, UserProfile } from '@/lib/firebase/auth';
import { ref, set } from 'firebase/database';

interface AuthContextType {
  user: User | null | undefined;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  profile: null,
  loading: true,
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
    <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
