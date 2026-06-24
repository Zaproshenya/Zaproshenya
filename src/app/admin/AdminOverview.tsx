'use client';
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon';
import { TYPE_MAP, timeAgo } from '@/lib/utils';

export default function AdminOverview({ stats, users }: { stats: any, users: any[] }) {
  const onlineUsers = users.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 2 * 60 * 1000));
  const onlineCount = onlineUsers.length;

  const chartActivityRef = useRef<HTMLCanvasElement>(null);
  const chartRolesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Activity Chart (Last 7 Days)
    if (chartActivityRef.current && stats?.users) {
      const canvas = chartActivityRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const days = 7;
        const counts = Array(days).fill(0);
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        stats.users.forEach((u: any) => {
          if (u.createdAt) {
            const diff = now - u.createdAt;
            const dIndex = days - 1 - Math.floor(diff / dayMs);
            if (dIndex >= 0 && dIndex < days) counts[dIndex]++;
          }
        });

        const W = canvas.width;
        const H = canvas.height;
        const padT = 20, padB = 20, padL = 30, padR = 10;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        const maxCount = Math.max(...counts, 5);
        const max = Math.ceil(maxCount / 5) * 5;

        // Grid
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
          const y = padT + (chartH / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padL - 5, y);
          ctx.lineTo(W - padR, y);
          ctx.stroke();
          ctx.fillText(String(Math.round(max - (max / 4) * i)), padL - 10, y);
        }

        const step = chartW / (days - 1);
        ctx.beginPath();
        for (let i = 0; i < counts.length; i++) {
          const c = counts[i];
          const x = padL + i * step;
          const y = padT + chartH - (c / max) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#2d7a4f';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.lineTo(padL + (counts.length - 1) * step, padT + chartH);
        ctx.lineTo(padL, padT + chartH);
        const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
        grad.addColorStop(0, 'rgba(45, 122, 79, 0.2)');
        grad.addColorStop(1, 'rgba(45, 122, 79, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    // Roles Donut Chart
    if (chartRolesRef.current && stats?.roleCounts) {
      const canvas = chartRolesRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(cx, cy) - 20;
        
        const data = [
          { val: stats.roleCounts.founder, color: '#f59e0b', label: 'Founder' },
          { val: stats.roleCounts.techAdmin, color: '#3b82f6', label: 'Tech' },
          { val: stats.roleCounts.moderator, color: '#8b5cf6', label: 'Mod' },
          { val: stats.roleCounts.user, color: '#10b981', label: 'User' },
        ];
        
        const total = data.reduce((sum, item) => sum + item.val, 0);
        if (total === 0) return;

        let startAngle = -0.5 * Math.PI;
        data.forEach(item => {
          if (item.val === 0) return;
          const sliceAngle = (item.val / total) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(cx, cy, R, startAngle, startAngle + sliceAngle);
          ctx.lineWidth = 20;
          ctx.strokeStyle = item.color;
          ctx.stroke();
          startAngle += sliceAngle;
        });
      }
    }
  }, [stats]);

  return (
    <>
      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users"><Icon name="user" size={20}/></div>
          <div className="stat-value">{(stats?.totalUsers || 0).toLocaleString()}</div>
          <div className="stat-label">Користувачі</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon online"><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#2d7a4f'}}></span></div>
          <div className="stat-value">{onlineCount.toLocaleString()}</div>
          <div className="stat-label">Онлайн зараз</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon invites"><Icon name="paper-plane-tilt" size={20}/></div>
          <div className="stat-value">{(stats?.totalInvites || 0).toLocaleString()}</div>
          <div className="stat-label">Запрошення</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accepted"><Icon name="check-circle" size={20}/></div>
          <div className="stat-value">{(stats?.acceptedInvites || 0).toLocaleString()}</div>
          <div className="stat-label">Прийняті</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><Icon name="chart-bar" size={20}/></div>
          <div className="stat-value">{(stats?.activeUsers || 0).toLocaleString()}</div>
          <div className="stat-label">Активні (7д)</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-title"><h2>Активність</h2></div>
          <canvas ref={chartActivityRef} width={400} height={220} className="chart-canvas"></canvas>
        </div>
        <div className="chart-card">
          <div className="chart-card-title"><h2>Ролі</h2></div>
          <canvas ref={chartRolesRef} width={400} height={220} className="chart-canvas"></canvas>
        </div>
      </div>

      <div className="grid2" style={{marginBottom: '28px'}}>
        <div className="table-card">
          <div className="table-header"><h2>Аудиторія та безпека</h2></div>
          <div style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="crown" size={20}/> Засновники</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>{stats?.roleCounts?.founder || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="wrench" size={14}/> Тех-адміністратори</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>{stats?.roleCounts?.techAdmin || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="shield-check" size={20}/> Модератори</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>{stats?.roleCounts?.moderator || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="users" size={20}/> Звичайні користувачі</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>{stats?.roleCounts?.user || 0}</span>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--red)',fontWeight:500}}><Icon name="prohibit" size={20}/> Заблоковані користувачі</span>
              <span style={{fontWeight:600,color:'var(--red)'}}>{stats?.bannedCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header"><h2>Статуси зустрічей та взаємодія</h2></div>
          <div style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="check-circle" size={20}/> Прийняті запрошення</span>
              <span style={{fontWeight:600,color:'var(--green)'}}>{stats?.acceptedInvites || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="x-circle" size={20}/> Відхилені запрошення</span>
              <span style={{fontWeight:600,color:'var(--red)'}}>{stats?.declinedInvites || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="calendar-blank" size={20}/> Перенесені події</span>
              <span style={{fontWeight:600,color:'var(--gold)'}}>{stats?.rescheduleInvites || 0}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--muted)'}}><Icon name="clock" size={20}/> В очікуванні відповіді</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>
                {(stats?.totalInvites || 0) - (stats?.acceptedInvites || 0) - (stats?.declinedInvites || 0) - (stats?.rescheduleInvites || 0)}
              </span>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',fontSize:'.9rem'}}>
              <span style={{color:'var(--ink)',fontWeight:500}}><Icon name="users" size={14}/> Всього зв'язків дружби</span>
              <span style={{fontWeight:600,color:'var(--ink)'}}>{stats?.totalFriendsConnections || 0}</span>
            </div>
          </div>
        </div>

        <div className="table-card" style={{gridColumn: 'span 2'}}>
          <div className="table-header"><h2>Статистика модерації скарг</h2></div>
          <div style={{padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center'}}>
            <div>
              <div style={{fontSize:'1.6rem',fontWeight:700,color:'var(--muted)'}}>{stats?.reportsCount?.total || 0}</div>
              <div style={{fontSize:'.8rem',color:'var(--muted)'}}>Всього скарг</div>
            </div>
            <div>
              <div style={{fontSize:'1.6rem',fontWeight:700,color:'var(--red)'}}>{stats?.reportsCount?.pending || 0}</div>
              <div style={{fontSize:'.8rem',color:'var(--red)'}}>Очікують розгляду</div>
            </div>
            <div>
              <div style={{fontSize:'1.6rem',fontWeight:700,color:'var(--green)'}}>{stats?.reportsCount?.resolved || 0}</div>
              <div style={{fontSize:'.8rem',color:'var(--green)'}}>Вирішено (Схвалено)</div>
            </div>
            <div>
              <div style={{fontSize:'1.6rem',fontWeight:700,color:'var(--gold)'}}>{stats?.reportsCount?.dismissed || 0}</div>
              <div style={{fontSize:'.8rem',color:'var(--gold)'}}>Відхилено</div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card" style={{marginBottom: '28px'}}>
        <div className="table-header"><h2>У мережі зараз ({onlineCount})</h2></div>
        {onlineCount === 0 ? (
          <div style={{textAlign:'center',padding:'24px 0',color:'var(--muted)',fontStyle:'italic',fontSize:'0.95rem'}}>
            <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#2d7a4f',marginRight:'6px'}}></span>Наразі немає користувачів у мережі
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table className="data-table">
              <thead><tr>
                <th>Користувач</th><th>Логін</th><th>Роль</th><th>Поточна дія</th>
              </tr></thead>
              <tbody>
                {onlineUsers.map((u: any) => (
                  <tr key={u.uid}>
                    <td style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt=""/> : u.name?.charAt(0)}</div>
                      <span style={{fontWeight:500}}>{u.name}</span>
                    </td>
                    <td style={{color:'var(--muted)'}}>@{u.login}</td>
                    <td>{u.role}</td>
                    <td style={{fontWeight:500,color:'var(--gold)'}}>
                      <span className="fb-dot ok" style={{marginRight:'6px'}}></span>
                      {u.currentAction || 'Переглядає сайт'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
