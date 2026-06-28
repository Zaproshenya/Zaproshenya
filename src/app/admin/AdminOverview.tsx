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
        const W = canvas.parentElement?.clientWidth ? canvas.parentElement.clientWidth - 40 : 400;
        const H = 200;
        canvas.width = W * 2; canvas.height = H * 2;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.scale(2, 2);

        const days = [];
        const labels = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          days.push(key);
          labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        }

        const counts = days.map(day => {
          return stats.users.filter((u: any) => {
            if (!u.createdAt) return false;
            const d = new Date(u.createdAt);
            if (isNaN(d.getTime())) return false;
            return d.toISOString().split('T')[0] === day;
          }).length;
        });

        const max = Math.max(...counts, 1);
        const padL = 30, padR = 10, padT = 20, padB = 30;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        // Grid
        ctx.strokeStyle = 'rgba(180,140,60,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = padT + (chartH / 4) * i;
          ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
          ctx.fillStyle = '#6b6058'; ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(String(Math.round(max - (max / 4) * i)), padL - 6, y + 4);
        }

        // Labels
        ctx.fillStyle = '#6b6058'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
        const step = chartW / (days.length - 1);
        labels.forEach((l, i) => {
          if (i % 2 === 0) ctx.fillText(l, padL + i * step, H - 8);
        });

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#c9922a'; ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        counts.forEach((c, i) => {
          const x = padL + i * step;
          const y = padT + chartH - (c / max) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Area under line
        ctx.lineTo(padL + chartW, padT + chartH);
        ctx.lineTo(padL, padT + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
        grad.addColorStop(0, 'rgba(201,146,42,0.15)');
        grad.addColorStop(1, 'rgba(201,146,42,0)');
        ctx.fillStyle = grad; ctx.fill();

        // Points
        counts.forEach((c, i) => {
          const x = padL + i * step;
          const y = padT + chartH - (c / max) * chartH;
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#c9922a'; ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        });
      }
    }

    // Roles Donut Chart
    if (chartRolesRef.current && stats?.roleCounts) {
      const canvas = chartRolesRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const W = canvas.parentElement?.clientWidth ? canvas.parentElement.clientWidth - 40 : 400;
        const H = 200;
        canvas.width = W * 2; canvas.height = H * 2;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.scale(2, 2);

        const roles = [
          { label: 'Користувачі', color: '#6b6058', count: stats.roleCounts.user || 0 },
          { label: 'Модератори', color: '#c9922a', count: stats.roleCounts.moderator || 0 },
          { label: 'Тех-адміни', color: '#2563eb', count: stats.roleCounts.techAdmin || 0 },
          { label: 'Засновники', color: '#7c3aed', count: stats.roleCounts.founder || 0 },
        ].filter(r => r.count > 0);
        
        const total = roles.reduce((s, r) => s + r.count, 0) || 1;

        const cx = W / 2, cy = H / 2 - 10;
        const outerR = Math.min(cx, cy) - 20;
        const innerR = outerR * 0.55;

        let angle = -Math.PI / 2;
        roles.forEach(r => {
          const sliceAngle = (r.count / total) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, outerR, angle, angle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = r.color;
          ctx.fill();
          angle += sliceAngle;
        });

        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Center text
        ctx.fillStyle = '#18120a'; ctx.font = 'bold 20px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(total), cx, cy + 4);
        ctx.fillStyle = '#6b6058'; ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Всього', cx, cy + 18);

        // Legend
        let ly = H - 14;
        ctx.textAlign = 'left';
        const legendX = 10;
        roles.forEach((r, i) => {
          const x = legendX + i * (W / roles.length);
          ctx.fillStyle = r.color;
          ctx.fillRect(x, ly - 8, 8, 8);
          ctx.fillStyle = '#18120a'; ctx.font = '10px Inter, sans-serif';
          ctx.fillText(r.label, x + 12, ly);
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
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt=""/> : u.name?.charAt(0)}</div>
                        <span style={{fontWeight:500}}>{u.name}</span>
                      </div>
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
