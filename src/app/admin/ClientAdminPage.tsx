'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getStats, getReports, getSupportTickets, updateUserRole, banUser, resolveReport, resolveSupportTicket, getAllUsers, sendTicketMessage, listenTicketMessages, stopListeningTicket, markTicketReadBySupport } from '@/lib/firebase/db';
import { Icon } from '@/components/Icon';
import Link from 'next/link';
import { TYPE_MAP, timeAgo } from '@/lib/utils';

import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminModeration from './AdminModeration';
import AdminReports from './AdminReports';
import AdminSupport from './AdminSupport';

export default function ClientAdminPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashTab, setDashTab] = useState('overview'); // 'overview' | 'users' | 'reports' | 'support' | 'moderation'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  
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

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const statsData = await getStats();
      setStats(statsData);
      setUsers(statsData.users || []);
      setInvites((statsData.personalInvites || []).concat(statsData.groupInvites || []).sort((a: any, b: any) => (b.created || 0) - (a.created || 0)));
      
      const rpts = await getReports();
      setReports(rpts);
      
      const tkts = await getSupportTickets();
      setSupportTickets(tkts);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== 'founder' && profile.role !== 'tech-admin' && profile.role !== 'moderator') {
      router.push('/home');
      return;
    }
    
    if (profile.role === 'moderator' && dashTab === 'overview') {
      setDashTab('users');
    }

    loadData();
  }, [user, profile, router]);

  // Handle support ticket click
  useEffect(() => {
    if (openTicket) {
      if (openTicket.unreadBySupport) {
        markTicketReadBySupport(openTicket.id).catch(() => {});
      }
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
      setTicketReply('');
    } catch (e) {
      alert('Помилка відправки');
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
        <button className={`sidebar-item ${dashTab === 'users' ? 'active' : ''}`} onClick={() => { setDashTab('users'); setSidebarOpen(false); }}>
          <span className="sidebar-item-icon"><Icon name="users" size={20}/></span> Користувачі
        </button>
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
              <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.4)'}}>{profile?.role}</div>
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
                  {dashTab === 'moderation' && 'Модерація'}
                  {dashTab === 'reports' && 'Скарги'}
                  {dashTab === 'support' && 'Підтримка'}
                </h1>
                <button className="hamburger" onClick={() => setSidebarOpen(true)}><Icon name="list" size={20}/></button>
              </div>

              {dashTab === 'overview' && <AdminOverview stats={stats} users={users} />}
              {dashTab === 'users' && <AdminUsers users={users} profile={profile} reload={loadData} />}
              {dashTab === 'moderation' && <AdminModeration invites={invites} users={users} reload={loadData} />}
              {dashTab === 'reports' && <AdminReports reports={reports} reload={loadData} />}
              {dashTab === 'support' && (
                <AdminSupport 
                  supportTickets={supportTickets} 
                  users={users}
                  reload={loadData} 
                  openTicket={openTicket} 
                  setOpenTicket={setOpenTicket} 
                  ticketMessages={ticketMessages} 
                  ticketReply={ticketReply} 
                  setTicketReply={setTicketReply} 
                  sendSupportReply={sendSupportReply} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
