'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { updateUserRole, banUser } from '@/lib/firebase/db';

export default function AdminUsers({ users, profile, reload }: { users: any[], profile: any, reload: () => void }) {
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 15;

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

  const handleRoleChange = async (uid: string, e: any) => {
    const newRole = e.target.value;
    if (confirm(`Змінити роль на ${newRole}?`)) {
      try {
        await updateUserRole(uid, newRole);
        reload();
      } catch (err) {
        alert('Помилка збереження');
      }
    } else {
      e.target.value = e.target.defaultValue; // reset
    }
  };

  const handleBanClick = (u: any) => {
    if (u.banned) {
      if (confirm('Дійсно розблокувати цього користувача?')) {
        banUser(u.uid, false, null).then(() => reload()).catch(e => alert('Помилка: ' + e));
      }
    } else {
      setBanTarget(u);
      setBanModalOpen(true);
    }
  };

  const submitBan = async (hours: number) => {
    if (!banTarget) return;
    try {
      let until = null;
      if (hours > 0 && hours < 999999) {
        until = Date.now() + hours * 60 * 60 * 1000;
      }
      await banUser(banTarget.uid, true, until);
      setBanModalOpen(false);
      setBanTarget(null);
      reload();
    } catch (err) {
      alert('Помилка: ' + err);
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
                const canEditRole = myRank > uRank || myRank === 100; // founders can edit founders
                const canBan = myRank > uRank; // cannot ban equal or higher unless... wait, let's just use myRank > uRank so tech-admin can't ban tech-admin
                
                const roleOptions = [
                  {v:'user', l:'Користувач'},
                  {v:'moderator', l:'Модератор'},
                  {v:'tech-admin', l:'Тех-адмін'}
                ];
                if (profile?.role === 'founder' || u.role === 'founder') {
                  roleOptions.push({v:'founder', l:'Засновник'});
                }

                return (
                  <tr key={u.uid} style={u.banned ? {opacity:0.6, background:'rgba(255,0,0,0.02)'} : {}}>
                    <td style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt=""/> : u.name?.charAt(0)}</div>
                      <div>
                        <div style={{fontWeight:500}}>{u.name}</div>
                        {u.banned && <div style={{fontSize:'.7rem',color:'var(--red)',fontWeight:600}}><Icon name="prohibit" size={10}/> Заблокований</div>}
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
                        <div style={{fontSize:'.8rem',padding:'4px 8px',borderRadius:'6px',background:'var(--border)',display:'inline-block'}}>
                          {roleOptions.find(o => o.v === (u.role || 'user'))?.l || u.role || 'user'}
                        </div>
                      )}
                    </td>
                    <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{timeAgo(u.createdAt)}</td>
                    <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{u.lastSeen ? timeAgo(u.lastSeen) : 'Ніколи'}</td>
                    <td>
                      {canBan && u.uid !== profile.uid ? (
                        <button 
                          className={`btn btn-sm ${u.banned ? 'btn-outline' : 'btn-red'}`} 
                          style={{padding:'4px 10px'}}
                          onClick={() => handleBanClick(u)}
                        >
                          {u.banned ? 'Розблокувати' : 'Бан'}
                        </button>
                      ) : <span style={{color:'var(--muted)',fontSize:'.8rem'}}>—</span>}
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
      {banModalOpen && banTarget && (
        <div className="overlay" onClick={() => setBanModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h3 className="modal-title" style={{marginBottom:0}}>Блокування</h3>
              <button className="modal-close" onClick={() => setBanModalOpen(false)}>×</button>
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
        </div>
      )}
    </>
  );
}
