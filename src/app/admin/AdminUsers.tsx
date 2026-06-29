'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { updateUserRole, banUser, logStaffAction } from '@/lib/firebase/db';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toast';

const ROLE_LABELS: Record<string, string> = {
  founder: 'FOUNDER',
  'tech-admin': 'TECH-ADMIN',
  moderator: 'MODERATOR',
  user: 'USER',
};

export default function AdminUsers({ users, profile, reload }: { users: any[], profile: any, reload: () => void }) {
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; onCancel?: () => void; isDanger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const PAGE_SIZE = 15;

  // Auto-unban expired users when admin views the list
  useEffect(() => {
    const now = Date.now();
    users.forEach(async (u) => {
      if (u.banned && u.bannedUntil && now > u.bannedUntil) {
        try {
          await banUser(u.uid, false, null);
          reload();
        } catch (err) {
          console.error(`Auto-unban failed for user ${u.uid}:`, err);
        }
      }
    });
  }, [users, reload]);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<any>(null);

  const filtered = userSearch
    ? users.filter(u =>
        u.login.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  const getRank = (r: string) => {
    if (r === 'founder') return 100;
    if (r === 'tech-admin') return 90;
    if (r === 'moderator') return 50;
    return 10;
  };
  const myRank = getRank(profile?.role);
  const isModeOnly = profile?.role === 'moderator' && profile?.role !== 'tech-admin' && profile?.role !== 'founder';

  const getBanTimeLeft = (bannedUntil: number | null | undefined) => {
    if (!bannedUntil) return 'назавжди';
    const diff = bannedUntil - Date.now();
    if (diff <= 0) return 'скоро розблокується';
    const mins = Math.ceil(diff / 60000);
    if (mins < 60) return `залишилось ${mins} хв.`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours < 24) return `залишилось ${hours} год. ${remainingMins} хв.`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `залишилось ${days} дн. ${remainingHours} год.`;
  };

  const handleRoleChange = (uid: string, e: any) => {
    const newRole = e.target.value;
    const oldRole = e.target.defaultValue;
    const targetUser = users.find(u => u.uid === uid);
    setConfirmModal({
      show: true,
      title: 'Зміна ролі',
      message: `Ви дійсно хочете змінити роль користувача на "${ROLE_LABELS[newRole] || newRole}"?`,
      onConfirm: async () => {
        try {
          await updateUserRole(uid, newRole);
          await logStaffAction(profile.uid, profile.name, `Змінив роль → ${newRole}`, uid, targetUser?.name);
          reload();
          toast('Роль успішно змінено', 'success');
        } catch (err: any) {
          toast('Помилка збереження', 'error');
          e.target.value = oldRole;
        }
      },
      onCancel: () => {
        e.target.value = oldRole;
      }
    });
  };

  const handleBanClick = (u: any) => {
    if (u.banned) {
      setConfirmModal({
        show: true,
        title: 'Розблокування користувача',
        message: `Дійсно розблокувати користувача ${u.name}?`,
        onConfirm: async () => {
          try {
            await banUser(u.uid, false, null);
            await logStaffAction(profile.uid, profile.name, 'Розблокував користувача', u.uid, u.name);
            reload();
            toast('Користувача розблоковано', 'success');
          } catch (e: any) {
            toast('Помилка: ' + (e.message || e), 'error');
          }
        }
      });
    } else {
      setBanTarget(u);
      setBanModalOpen(true);
    }
  };

  const handleDeleteClick = (u: any) => {
    setConfirmModal({
      show: true,
      title: 'Видалення акаунту',
      message: `Ви дійсно хочете повністю видалити акаунт користувача ${u.name} (@${u.login})? Всі його дані, запрошення та друзі будуть видалені назавжди. Цю дію неможливо скасувати.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const { adminDeleteAccount } = await import('@/lib/firebase/db');
          await adminDeleteAccount(u.uid, u.login, u.uniqueId);
          await logStaffAction(profile.uid, profile.name, `Видалив акаунт @${u.login}`, u.uid, u.name);
          reload();
          toast('Акаунт успішно видалено', 'success');
        } catch (err: any) {
          toast('Помилка: ' + (err.message || err), 'error');
        }
      }
    });
  };

  const submitBan = async (hours: number) => {
    if (!banTarget) return;
    try {
      let until = null;
      if (hours > 0 && hours < 999999) {
        until = Date.now() + hours * 60 * 60 * 1000;
      }
      await banUser(banTarget.uid, true, until);
      const banDesc = hours >= 999999 ? 'назавжди' : `на ${hours} год`;
      await logStaffAction(profile.uid, profile.name, `Заблокував користувача ${banDesc}`, banTarget.uid, banTarget.name);
      setBanModalOpen(false);
      setBanTarget(null);
      reload();
      toast('Користувача заблоковано', 'success');
    } catch (err: any) {
      toast('Помилка: ' + (err.message || err), 'error');
    }
  };

  return (
    <>
      <div style={{background:'var(--warm)',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1px solid var(--border)'}}>
        <input type="text" placeholder="Пошук за логіном чи іменем…"
          value={userSearch}
          onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
          style={{width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'.88rem',background:'var(--card)'}}/>
      </div>

      <div style={{marginBottom:'8px',fontSize:'.8rem',color:'var(--muted)'}}>
        {filtered.length} користувачів
      </div>

      <div className="table-card">
        <div className="table-scroll-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Користувач</th><th>Логін / ID</th><th>Роль</th><th>Зареєстрований</th><th>Активність</th><th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'24px',color:'var(--muted)'}}>Нікого не знайдено</td></tr>
              ) : paged.map(u => {
                const uRank = getRank(u.role);
                const isSuperAdmin = myRank >= 90; // Tech-admin or Founder
                const canEditRole = myRank > uRank || isSuperAdmin; // SuperAdmins can edit anyone's role
                const canBan = myRank > uRank; // cannot ban equal or higher rank
                
                const roleOptions = [
                  {v:'user', l:'USER'},
                  {v:'moderator', l:'MODERATOR'},
                  {v:'tech-admin', l:'TECH-ADMIN'}
                ];
                if (isSuperAdmin || u.role === 'founder') {
                  roleOptions.push({v:'founder', l:'FOUNDER'});
                }

                return (
                  <tr key={u.uid} style={u.banned ? {opacity:0.6, background:'rgba(255,0,0,0.02)'} : {}}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt=""/> : u.name?.charAt(0)}</div>
                        <div>
                          <div style={{fontWeight:500}}>{u.name}</div>
                          {u.banned && <div style={{fontSize:'.7rem',color:'var(--red)',fontWeight:600}}><Icon name="prohibit" size={10}/> Заблокований ({getBanTimeLeft(u.bannedUntil)})</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{color:'var(--muted)'}}>@{u.login}</div>
                      <div style={{fontFamily:'monospace',fontSize:'.75rem',color:'var(--muted)'}}>{u.uniqueId || '—'}</div>
                    </td>
                    <td>
                      {canEditRole && !isModeOnly ? (
                        <select
                          defaultValue={u.role || 'user'}
                          onChange={e => handleRoleChange(u.uid, e)}
                          style={{padding:'4px 8px',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--card)',fontSize:'.8rem'}}
                        >
                          {roleOptions.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                        </select>
                      ) : (
                        <div style={{fontSize:'.8rem',padding:'4px 8px',borderRadius:'6px',background:'var(--border)',display:'inline-block',fontWeight:600,letterSpacing:'.04em'}}>
                          {ROLE_LABELS[u.role || 'user'] || (u.role || 'user').toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{timeAgo(u.createdAt)}</td>
                    <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{u.lastSeen ? timeAgo(u.lastSeen) : 'Ніколи'}</td>
                    <td>
                      <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                        {canBan && u.uid !== profile.uid ? (
                          <button 
                            className={`btn btn-sm ${u.banned ? 'btn-outline' : 'btn-red'}`} 
                            style={{padding:'4px 10px'}}
                            onClick={() => handleBanClick(u)}
                          >
                            {u.banned ? 'Розблокувати' : 'Бан'}
                          </button>
                        ) : null}
                        {isSuperAdmin && u.uid !== profile.uid ? (
                          <button 
                            className="btn btn-sm btn-red" 
                            style={{padding:'4px 8px', display:'inline-flex', alignItems:'center', justifyContent:'center'}}
                            onClick={() => handleDeleteClick(u)}
                            title="Видалити акаунт"
                          >
                            <Icon name="trash" size={14}/>
                          </button>
                        ) : null}
                        {!(canBan && u.uid !== profile.uid) && !(isSuperAdmin && u.uid !== profile.uid) && (
                          <span style={{color:'var(--muted)',fontSize:'.8rem'}}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{display:'flex',justifyContent:'center',gap:'8px',marginTop:'20px',flexWrap:'wrap'}}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} className={`btn btn-sm ${i === userPage ? 'btn-dark' : 'btn-outline'}`} onClick={() => setUserPage(i)}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Ban Modal */}
      {banModalOpen && banTarget && typeof window !== 'undefined' && createPortal(
        <div className="overlay" onClick={() => setBanModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'400px', width: '100%', margin: '0 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h3 className="modal-title" style={{marginBottom:0}}>Блокування</h3>
              <button className="modal-close" onClick={() => setBanModalOpen(false)}>
                <Icon name="x" size={24} />
              </button>
            </div>
            <p style={{fontSize:'.9rem',color:'var(--muted)',marginBottom:'20px'}}>
              Оберіть термін блокування для користувача <strong style={{color:'var(--ink)'}}>{banTarget.name}</strong> (@{banTarget.login}).
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>
              <button className="btn btn-outline btn-sm" onClick={() => submitBan(24)}>1 День</button>
              <button className="btn btn-outline btn-sm" onClick={() => submitBan(72)}>3 Дні</button>
              <button className="btn btn-outline btn-sm" onClick={() => submitBan(168)}>Тиждень</button>
              <button className="btn btn-outline btn-sm" onClick={() => submitBan(720)}>Місяць</button>
              <button className="btn btn-outline btn-sm" onClick={() => submitBan(8760)}>Рік</button>
              <button className="btn btn-red btn-sm" onClick={() => submitBan(999999)}>Назавжди</button>
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => setBanModalOpen(false)}>Скасувати</button>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, show: false }));
        }}
        onCancel={() => {
          if (confirmModal.onCancel) confirmModal.onCancel();
          setConfirmModal(prev => ({ ...prev, show: false }));
        }}
      />
    </>
  );
}
