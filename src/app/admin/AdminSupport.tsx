'use client';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { resolveSupportTicket } from '@/lib/firebase/db';

export default function AdminSupport({ 
  supportTickets, 
  reload, 
  openTicket, 
  setOpenTicket, 
  ticketMessages, 
  ticketReply, 
  setTicketReply, 
  sendSupportReply 
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

  const renderTicketCard = (t: any) => (
    <div key={t.id} 
      onClick={() => setOpenTicket(t)}
      style={{
        background:'var(--card)',borderRadius:'12px',padding:'16px',border:openTicket?.id === t.id ? '2px solid var(--gold)' : '1px solid var(--border)',
        marginBottom:'12px',cursor:'pointer',position:'relative'
      }}
    >
      {t.unreadBySupport && <div style={{position:'absolute',top:'16px',right:'16px',width:'10px',height:'10px',background:'var(--red)',borderRadius:'50%'}}></div>}
      <div style={{fontSize:'.8rem',color:'var(--muted)',fontFamily:'monospace',marginBottom:'4px'}}>ID: {t.id}</div>
      <div style={{fontSize:'1rem',fontWeight:600,color:'var(--ink)',marginBottom:'6px'}}>{t.subject}</div>
      <div style={{fontSize:'.85rem',color:'var(--muted)',display:'flex',justifyContent:'space-between'}}>
        <span>Від: {t.authorName}</span>
        <span>{timeAgo(t.lastMessageAt || t.createdAt)}</span>
      </div>
    </div>
  );

  return (
    <div className="grid2" style={{alignItems:'flex-start'}}>
      <div>
        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="warning-circle" size={18}/> Потребують уваги ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div style={{background:'var(--green-bg)',borderRadius:'12px',padding:'14px',textAlign:'center',marginBottom:'24px'}}>
            <p style={{color:'var(--green)',fontSize:'.9rem'}}><Icon name="check-circle" size={14}/> Все перевірено</p>
          </div>
        ) : (
          <div style={{marginBottom:'24px'}}>{pending.map(renderTicketCard)}</div>
        )}

        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="envelope-open" size={18}/> Відкриті ({active.length})
        </h2>
        <div style={{marginBottom:'24px'}}>{active.map(renderTicketCard)}</div>

        <h2 style={{fontSize:'1.1rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <Icon name="archive" size={18}/> Закриті
        </h2>
        <div>{closed.slice(0,10).map(renderTicketCard)}</div>
      </div>

      <div>
        {openTicket ? (
          <div style={{background:'var(--card)',borderRadius:'12px',border:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'calc(100vh - 120px)',position:'sticky',top:'80px'}}>
            <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{openTicket.subject}</div>
                <div style={{fontSize:'.8rem',color:'var(--muted)'}}>Від: {openTicket.authorName} ({openTicket.authorUid})</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                {openTicket.status !== 'resolved' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleResolve(openTicket.id, 'resolved')}>
                    <Icon name="check" size={14}/> Вирішити
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setOpenTicket(null)}><Icon name="x" size={16}/></button>
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
              {ticketMessages.map((m: any) => {
                const isSupport = m.role === 'tech-admin' || m.role === 'moderator' || m.role === 'founder';
                return (
                  <div key={m.id} className={`chat-msg ${isSupport ? 'user' : 'support'}`}>
                    <div className="chat-msg-avatar">
                      {isSupport ? 'A' : (m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-msg-content">
                      <div className="chat-bubble">
                        {m.text}
                        {m.imageUrl && <img src={m.imageUrl} className="chat-bubble-img" alt="attachment"/>}
                      </div>
                      <div className="chat-msg-time">
                        {m.name} {isSupport && `(${m.role})`} • {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {openTicket.status !== 'resolved' && openTicket.status !== 'dismissed' ? (
              <div style={{padding:'16px',borderTop:'1px solid var(--border)',display:'flex',gap:'10px'}}>
                <textarea 
                  placeholder="Напишіть відповідь..." 
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
              <div style={{padding:'16px',textAlign:'center',color:'var(--muted)',fontStyle:'italic',borderTop:'1px solid var(--border)'}}>
                Тикет закрито
              </div>
            )}
          </div>
        ) : (
          <div style={{background:'var(--warm)',borderRadius:'12px',border:'1px dashed var(--border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'300px',color:'var(--muted)'}}>
            <div style={{marginBottom:'16px',opacity:0.5}}>
              <Icon name="chat-circle-dots" size={48} />
            </div>
            <p>Оберіть тикет для перегляду</p>
          </div>
        )}
      </div>
    </div>
  );
}
