'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  updateUserRole, 
  banUser, 
  resolveReport, 
  resolveSupportTicket, 
  sendTicketMessage, 
  listenTicketMessages, 
  stopListeningTicket, 
  markTicketReadBySupport,
  listenAdminUsers,
  listenAdminInvites,
  listenAdminGroupInvites,
  listenAdminReports,
  listenAdminSupportTickets,
  listenAdminStatuses,
  listenAdminFriends,
  logStaffAction,
  uploadSupportImage
} from '@/lib/firebase/db';
import { Icon } from '@/components/Icon';
import Link from 'next/link';
import { TYPE_MAP, timeAgo } from '@/lib/utils';
import { toast } from '@/components/Toast';

function compressImage(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminModeration from './AdminModeration';
import AdminReports from './AdminReports';
import AdminSupport from './AdminSupport';
import AdminRoles from './AdminRoles';
import AdminPublisher from './AdminPublisher';

export default function ClientAdminPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashTab, setDashTab] = useState('overview'); // 'overview' | 'users' | 'roles' | 'reports' | 'support' | 'moderation'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real-time Database States
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbInvites, setDbInvites] = useState<any[]>([]);
  const [dbGroupInvites, setDbGroupInvites] = useState<any[]>([]);
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbSupportTickets, setDbSupportTickets] = useState<any[]>([]);
  const [dbStatuses, setDbStatuses] = useState<Record<string, string>>({});
  const [dbFriends, setDbFriends] = useState<Record<string, any>>({});
  
  // Tab states
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitePage, setInvitePage] = useState(0);
  const PAGE_SIZE = 15;
  const INVITE_PAGE_SIZE = 30;

  // Modals / chat
  const [openTicket, setOpenTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketReply, setTicketReply] = useState('');

  // Listen to all admin statistics and records in real-time
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== 'founder' && profile.role !== 'tech-admin' && profile.role !== 'moderator') {
      router.push('/home');
      return;
    }
    
    if (profile.role === 'moderator' && dashTab === 'overview') {
      setDashTab('users');
    }

    const unsubUsers = listenAdminUsers(setDbUsers);
    const unsubInvites = listenAdminInvites(setDbInvites);
    const unsubGroupInvites = listenAdminGroupInvites(setDbGroupInvites);
    const unsubReports = listenAdminReports(setDbReports);
    const unsubSupport = listenAdminSupportTickets(setDbSupportTickets);
    const unsubStatuses = listenAdminStatuses(setDbStatuses);
    const unsubFriends = listenAdminFriends(setDbFriends);

    setLoading(false);

    return () => {
      unsubUsers();
      unsubInvites();
      unsubGroupInvites();
      unsubReports();
      unsubSupport();
      unsubStatuses();
      unsubFriends();
    };
  }, [user, profile, router]);

  // Listen to query parameters to automatically open the publisher tab on OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'publisher' || window.location.search.includes('oauth')) {
      setDashTab('publisher');
    }
  }, []);

  // Derived state mapping
  const users = dbUsers;
  const reports = dbReports;
  const supportTickets = dbSupportTickets;
  
  const invites = useMemo(() => {
    return [...dbInvites, ...dbGroupInvites].sort((a: any, b: any) => (b.created || 0) - (a.created || 0));
  }, [dbInvites, dbGroupInvites]);

  const stats = useMemo(() => {
    const totalInvites = dbInvites.length + dbGroupInvites.length;
    const personalInvitesCount = dbInvites.length;
    const groupInvitesCount = dbGroupInvites.length;
    
    const typeCounts: Record<string, number> = {};
    dbInvites.forEach(inv => {
      if (inv && inv.type) {
        typeCounts[inv.type] = (typeCounts[inv.type] || 0) + 1;
      }
    });
    dbGroupInvites.forEach(inv => {
      if (inv && inv.type) {
        typeCounts[inv.type] = (typeCounts[inv.type] || 0) + 1;
      }
    });

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = dbUsers.filter(u => u.lastSeen > weekAgo).length;

    let acceptedInvites = 0;
    let declinedInvites = 0;
    let rescheduleInvites = 0;
    Object.values(dbStatuses).forEach(val => {
      if (val === 'accepted') acceptedInvites++;
      else if (val === 'declined') declinedInvites++;
      else if (val === 'reschedule' || val === 'rescheduled') rescheduleInvites++;
    });

    let founderCount = 0;
    let techAdminCount = 0;
    let moderatorCount = 0;
    let regularUserCount = 0;
    let bannedCount = 0;

    dbUsers.forEach(u => {
      if (u.banned) bannedCount++;
      if (u.role === 'founder') founderCount++;
      else if (u.role === 'tech-admin') techAdminCount++;
      else if (u.role === 'moderator') moderatorCount++;
      else regularUserCount++;
    });

    let pendingReports = 0, resolvedReports = 0, dismissedReports = 0;
    dbReports.forEach(r => {
      if (r.status === 'pending') pendingReports++;
      else if (r.status === 'resolved') resolvedReports++;
      else if (r.status === 'dismissed') dismissedReports++;
    });

    let pendingSupport = 0, resolvedSupport = 0, dismissedSupport = 0;
    dbSupportTickets.forEach(t => {
      if (t.status === 'pending') pendingSupport++;
      else if (t.status === 'resolved') resolvedSupport++;
      else if (t.status === 'dismissed') dismissedSupport++;
    });

    let totalFriendsConnections = 0;
    Object.values(dbFriends).forEach(val => {
      if (val) {
        totalFriendsConnections += Object.keys(val).length;
      }
    });
    totalFriendsConnections = Math.floor(totalFriendsConnections / 2);

    return {
      totalUsers: dbUsers.length,
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
      users: dbUsers,
      personalInvitesCount,
      groupInvitesCount,
      typeCounts,
      personalInvites: dbInvites,
      groupInvites: dbGroupInvites,
    };
  }, [dbUsers, dbInvites, dbGroupInvites, dbReports, dbSupportTickets, dbStatuses, dbFriends]);

  const loadData = () => {
    // Keep as dummy function since data updates reactively in real time
  };

  // Handle support ticket click
  useEffect(() => {
    if (openTicket) {
      if (openTicket.unreadBySupport) {
        markTicketReadBySupport(openTicket.id).catch(() => {});
      }
      // Log ticket view action
      logStaffAction(
        user?.uid || '', profile?.name || '',
        `Відкрив звернення: ${openTicket.subject || openTicket.id}`,
        openTicket.authorUid,
        openTicket.authorName
      ).catch(() => {});
      listenTicketMessages(openTicket.id, (msgs) => setTicketMessages(msgs));
      return () => stopListeningTicket(openTicket.id);
    }
  }, [openTicket]);

  const sendSupportReply = async () => {
    if (!ticketReply.trim() || !openTicket) return;
    try {
      await sendTicketMessage(openTicket.id, {
        uid: user?.uid,
        name: profile?.name,
        role: profile?.role,
        avatar: profile?.avatar || null,
        text: ticketReply.trim(),
      });
      // Log the reply action (fire-and-forget, never breaks send)
      logStaffAction(
        user?.uid || '', profile?.name || '',
        `Відповів у зверненні: ${openTicket.subject || openTicket.id}`,
        openTicket.authorUid,
        openTicket.authorName
      ).catch(() => {});
      setTicketReply('');
    } catch (e) {
      toast('Помилка відправки', 'error');
    }
  };

  const sendSupportReplyImage = async (file: File) => {
    if (!openTicket) return;
    toast('Завантаження фото...', 'info');
    try {
      const base64Url = await compressImage(file);
      const blob = dataURLtoBlob(base64Url);
      const downloadUrl = await uploadSupportImage(openTicket.id, blob, file.name || 'image.jpg');
      await sendTicketMessage(openTicket.id, {
        uid: user?.uid,
        name: profile?.name,
        role: profile?.role,
        avatar: profile?.avatar || null,
        text: '',
        imageUrl: downloadUrl,
      });
      // Log the reply action
      logStaffAction(
        user?.uid || '', profile?.name || '',
        `Надіслав зображення у зверненні: ${openTicket.subject || openTicket.id}`,
        openTicket.authorUid,
        openTicket.authorName
      ).catch(() => {});
      toast('Фото надіслано!', 'success');
    } catch (e) {
      toast('Помилка відправки фото', 'error');
    }
  };

  if (!profile) return null;
  if (profile.role !== 'founder' && profile.role !== 'tech-admin' && profile.role !== 'moderator') {
    return <div className="wrap"><div className="empty"><Icon name="lock" size={20}/><p>Доступ заборонено</p></div></div>;
  }

  const isModeOnly = profile.role === 'moderator';

  return (
    <div className="app-with-sidebar">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="dash-sidebar">
        <div className="sidebar-logo">Запрошення ✦</div>
        <div className="sidebar-section">Меню</div>
        {!isModeOnly && (
          <button className={`sidebar-item ${dashTab === 'overview' ? 'active' : ''}`} onClick={() => { setDashTab('overview'); setSidebarOpen(false); }}>
            <span className="sidebar-item-icon"><Icon name="chart-bar" size={20}/></span> Огляд
          </button>
        )}
        {!isModeOnly && (
          <button className={`sidebar-item ${dashTab === 'publisher' ? 'active' : ''}`} onClick={() => { setDashTab('publisher'); setSidebarOpen(false); }}>
            <span className="sidebar-item-icon"><Icon name="paper-plane-tilt" size={20}/></span> Публікатор
          </button>
        )}
        <button className={`sidebar-item ${dashTab === 'users' ? 'active' : ''}`} onClick={() => { setDashTab('users'); setSidebarOpen(false); }}>
          <span className="sidebar-item-icon"><Icon name="users" size={20}/></span> Користувачі
        </button>
        {!isModeOnly && (
          <button className={`sidebar-item ${dashTab === 'roles' ? 'active' : ''}`} onClick={() => { setDashTab('roles'); setSidebarOpen(false); }}>
            <span className="sidebar-item-icon"><Icon name="shield-star" size={20}/></span> Управління ролями
          </button>
        )}
        <button className={`sidebar-item ${dashTab === 'moderation' ? 'active' : ''}`} onClick={() => { setDashTab('moderation'); setSidebarOpen(false); }}>
          <span className="sidebar-item-icon"><Icon name="shield" size={20}/></span> Модерація
        </button>
        <button className={`sidebar-item ${dashTab === 'reports' ? 'active' : ''}`} onClick={() => { setDashTab('reports'); setSidebarOpen(false); }}>
          <span className="sidebar-item-icon"><Icon name="warning" size={20}/></span> Скарги
          {reports.filter(r => r.status === 'pending').length > 0 && <span className="notif-badge" style={{position:'static',marginLeft:'auto'}}>{reports.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button className={`sidebar-item ${dashTab === 'support' ? 'active' : ''}`} onClick={() => { setDashTab('support'); setSidebarOpen(false); }}>
          <span className="sidebar-item-icon"><Icon name="lifebuoy" size={20}/></span> Підтримка
          {supportTickets.filter(t => t.status === 'pending' || (t.status === 'open' && t.unreadBySupport)).length > 0 && <span className="notif-badge" style={{position:'static',marginLeft:'auto'}}>{supportTickets.filter(t => t.status === 'pending' || (t.status === 'open' && t.unreadBySupport)).length}</span>}
        </button>

        <div className="sidebar-section">Навігація</div>
        <button className="sidebar-item" onClick={() => router.push('/home')}>
          <span className="sidebar-item-icon"><Icon name="house" size={20}/></span> Головна
        </button>
        
        <div style={{marginTop:'auto',padding:'16px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div className="avatar avatar-sm">
              {profile?.avatar ? <img src={profile.avatar} alt="" /> : profile?.name?.charAt(0)}
            </div>
            <div>
              <div style={{color:'#fff',fontSize:'.85rem',fontWeight:500}}>{profile?.name}</div>
              <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.4)'}}>{(profile?.role || '').toUpperCase()}</div>
            </div>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="sidebar-content">
        <div className="wrap">
          {loading ? (
            <div style={{padding:'40px',textAlign:'center'}}>Завантаження...</div>
          ) : error ? (
            <div style={{padding:'40px',textAlign:'center',color:'var(--red)'}}>Помилка завантаження даних</div>
          ) : (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
                <h1 className="page-title" style={{marginBottom:0}}>
                  {dashTab === 'overview' && 'Огляд'}
                  {dashTab === 'users' && 'Користувачі'}
                  {dashTab === 'roles' && 'Управління ролями'}
                  {dashTab === 'moderation' && 'Модерація'}
                  {dashTab === 'reports' && 'Скарги'}
                  {dashTab === 'support' && 'Підтримка'}
                  {dashTab === 'publisher' && 'Публікатор'}
                </h1>
                <button className="hamburger" onClick={() => setSidebarOpen(true)}><Icon name="list" size={20}/></button>
              </div>

              {dashTab === 'overview' && <AdminOverview stats={stats} users={users} />}
              {dashTab === 'users' && <AdminUsers users={users} profile={profile} reload={loadData} />}
              {dashTab === 'roles' && !isModeOnly && <AdminRoles users={users} profile={profile} reload={loadData} />}
              {dashTab === 'moderation' && <AdminModeration invites={invites} users={users} profile={profile} reload={loadData} />}
              {dashTab === 'reports' && <AdminReports reports={reports} profile={profile} reload={loadData} />}
              {dashTab === 'publisher' && !isModeOnly && <AdminPublisher />}
              {dashTab === 'support' && (
                <AdminSupport 
                  supportTickets={supportTickets} 
                  users={users}
                  profile={profile}
                  reload={loadData} 
                  openTicket={openTicket} 
                  setOpenTicket={setOpenTicket} 
                  ticketMessages={ticketMessages} 
                  ticketReply={ticketReply} 
                  setTicketReply={setTicketReply} 
                  sendSupportReply={sendSupportReply} 
                  sendSupportReplyImage={sendSupportReplyImage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
