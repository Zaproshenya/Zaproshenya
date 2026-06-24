'use client';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { resolveSupportTicket } from '@/lib/firebase/db';
import { createPortal } from 'react-dom';

export default function AdminSupport({ 
  supportTickets, 
  reload, 
  openTicket, 
  setOpenTicket, 
  ticketMessages, 
  ticketReply, 
  setTicketReply, 
  sendSupportReply,
  users
}: any) {
  const pending = supportTickets.filter((t: any) => t.status === 'pending' || (t.status === 'open' && t.unreadBySupport));
  const active = supportTickets.filter((t: any) => t.status === 'open' && !t.unreadBySupport);
  const closed = supportTickets.filter((t: any) => t.status === 'resolved' || t.status === 'dismissed');

  const handleResolve = async (id: string, status: string) => {
    if (confirm(`Позначити тикет як "${status}"?`)) {
      try {
        await resolveSupportTicket(id, status);
        reload();
        if (openTicket && openTicket.id === id) setOpenTicket(null);
      } catch (err) {
        alert('Помилка: ' + err);
      }
    }
  };

  const renderTicketCard = (t: any) => {
    const isResolved = t.status === 'resolved' || t.status === 'dismissed';
    return (
      <div key={t.id} className={`complaint-card ${isResolved ? 'resolved' : ''}`} style={{cursor:'pointer',transition:'box-shadow .15s',marginBottom:'12px'}} onClick={() => setOpenTicket(t)}>
        <div className="complaint-icon" style={{color:'var(--gold)',background:'rgba(212,175,55,0.1)',borderColor:'rgba(212,175,55,0.2)'}}>
          <Icon name="chat-circle-dots" size={20}/>
        </div>
        <div className="complaint-body" style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px',alignItems:'center'}}>
            <div className="complaint-reason" style={{fontSize:'.92rem',marginBottom:0}}>{t.subject}</div>
            <span style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',padding:'3px 8px',borderRadius:'20px',background:t.status==='open'?'rgba(37,99,235,.1)':'rgba(45,122,79,.1)',color:t.status==='open'?'var(--blue)':'var(--green)'}}>
              {t.status === 'open' ? 'Відкрито' : t.status === 'resolved' ? 'Вирішено' : t.status}
            </span>
          </div>
          <div className="complaint-meta">
            Від: <strong>{t.authorName}</strong> • {timeAgo(t.createdAt)}
            {t.unreadBySupport && <span style={{display:'inline-block',width:'7px',height:'7px',borderRadius:'50%',background:'var(--gold)',marginLeft:'6px'}}></span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="warning-circle" size={18}/> Нові звернення ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div style={{background:'var(--green-bg)',borderRadius:'12px',padding:'14px',textAlign:'center',marginBottom:'24px'}}>
            <p style={{color:'var(--green)',fontSize:'.9rem'}}><Icon name="check-circle" size={14}/> Немає звернень</p>
          </div>
        ) : (
          <div style={{marginBottom:'24px'}}>{pending.map(renderTicketCard)}</div>
        )}

        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="envelope-open" size={18}/> Активні ({active.length})
        </h2>
        <div style={{marginBottom:'24px'}}>{active.map(renderTicketCard)}</div>

        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="archive" size={18}/> Архів
        </h2>
        <div>{closed.slice(0,10).map(renderTicketCard)}</div>
      </div>

      {openTicket && typeof window !== 'undefined' && createPortal(
        <div className="overlay" onClick={() => setOpenTicket(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'600px', width: '100%', margin: '0 20px', padding: 0, display: 'flex', flexDirection: 'column', height: '80vh'}}>
            <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center', flexShrink: 0}}>
              <div>
                <div style={{fontWeight:600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Icon name="lightbulb" size={18} color="var(--gold)"/> {openTicket.subject}
                </div>
                <div style={{fontSize:'.8rem',color:'var(--muted)'}}>Від: {openTicket.authorName} ({openTicket.authorUid})</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                {openTicket.status !== 'resolved' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleResolve(openTicket.id, 'resolved')}>
                    <Icon name="check" size={14}/> Вирішити
                  </button>
                )}
                <button className="modal-close" onClick={() => setOpenTicket(null)}>
                  <Icon name="x" size={20}/>
                </button>
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px', background: 'var(--paper)'}}>
              {ticketMessages.map((m: any) => {
                const isSupport = m.role === 'tech-admin' || m.role === 'moderator' || m.role === 'founder';
                const userObj = users?.find((u: any) => u.uid === m.uid);
                const avatarUrl = m.avatar || userObj?.avatar;
                
                return (
                  <div key={m.id} className={`chat-msg ${isSupport ? 'support' : 'user'}`}>
                    <div className="chat-msg-avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="" /> : (isSupport ? <Icon name="headset" size={16}/> : (m.name || '?').charAt(0).toUpperCase())}
                    </div>
                    <div className="chat-msg-content">
                      <div className="chat-bubble">
                        {m.text}
                        {m.imageUrl && <img src={m.imageUrl} className="chat-bubble-img" alt="attachment"/>}
                      </div>
                      <div className="chat-msg-time">
                        {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {openTicket.status !== 'resolved' && openTicket.status !== 'dismissed' ? (
              <div style={{padding:'16px',borderTop:'1px solid var(--border)',display:'flex',gap:'10px', flexShrink: 0, background: 'var(--card)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'}}>
                <textarea 
                  placeholder="Ваша відповідь..." 
                  style={{flex:1,padding:'10px',border:'1px solid var(--border)',borderRadius:'8px',resize:'none',height:'44px'}}
                  value={ticketReply}
                  onChange={e => setTicketReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportReply(); } }}
                ></textarea>
                <button className="btn btn-dark" style={{padding:'0 16px'}} onClick={sendSupportReply}>
                  <Icon name="paper-plane-right" size={18}/>
                </button>
              </div>
            ) : (
              <div style={{padding:'16px',textAlign:'center',color:'var(--muted)',fontStyle:'italic',borderTop:'1px solid var(--border)', flexShrink: 0, background: 'var(--card)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'}}>
                Звернення закрите
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
