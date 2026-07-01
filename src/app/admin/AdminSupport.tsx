'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { resolveSupportTicket, logStaffAction } from '@/lib/firebase/db';
import { createPortal } from 'react-dom';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toast';

export default function AdminSupport({ 
  supportTickets, 
  reload, 
  openTicket, 
  setOpenTicket, 
  ticketMessages, 
  ticketReply, 
  setTicketReply, 
  sendSupportReply,
  compressImage,
  users,
  profile
}: any) {
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [replyAttachedImage, setReplyAttachedImage] = useState<string | null>(null);
  const [replyUploadingImage, setReplyUploadingImage] = useState(false);

  const handleSendReply = async () => {
    setReplyUploadingImage(true);
    try {
      await sendSupportReply(replyAttachedImage);
      setReplyAttachedImage(null);
    } catch (err) {
      // Parent handles error toast
    } finally {
      setReplyUploadingImage(false);
    }
  };

  const pending = supportTickets.filter((t: any) => t.status === 'pending' || (t.status === 'open' && t.unreadBySupport));
  const active = supportTickets.filter((t: any) => t.status === 'open' && !t.unreadBySupport);
  const closed = supportTickets.filter((t: any) => t.status === 'resolved' || t.status === 'dismissed');

  const handleResolve = (id: string, status: string) => {
    const isResolved = status === 'resolved';
    setConfirmModal({
      show: true,
      title: isResolved ? 'Вирішити звернення' : 'Закрити звернення',
      message: `Ви дійсно хочете позначити це звернення як "${isResolved ? 'вирішене' : 'закрите'}"?`,
      isDanger: !isResolved, // dismissed status is not necessarily danger, resolved is green
      onConfirm: async () => {
        try {
          await resolveSupportTicket(id, status);
          const ticket = supportTickets.find((t: any) => t.id === id);
          logStaffAction(
            profile.uid, profile.name,
            `${isResolved ? 'Вирішив' : 'Закрив'} звернення (${ticket?.subject || id})`,
            ticket?.authorUid,
            ticket?.authorName
          ).catch(() => {});
          reload();
          if (openTicket && openTicket.id === id) setOpenTicket(null);
          toast('Статус звернення оновлено', 'success');
        } catch (err: any) {
          toast('Помилка: ' + (err.message || err), 'error');
        }
      }
    });
  };

  const renderTicketCard = (t: any) => {
    const isResolved = t.status === 'resolved' || t.status === 'dismissed';
    return (
      <div key={t.id} className={`support-card ${isResolved ? 'resolved' : ''} ${t.unreadBySupport ? 'unread' : ''}`} onClick={() => setOpenTicket(t)}>
        <div className="support-card-icon">
          <Icon name="chat-circle-dots" size={22}/>
        </div>
        <div className="support-card-body">
          <div className="support-card-header">
            <h3 className="support-card-title">{t.subject}</h3>
            <span className={`support-card-badge ${t.status}`}>
              {t.status === 'open' ? 'Відкрито' : t.status === 'resolved' ? 'Вирішено' : t.status}
            </span>
          </div>
          <div className="support-card-meta">
            <span className="support-card-author">
              <Icon name="user" size={14} /> {t.authorName}
            </span>
            <span className="support-card-dot">•</span>
            <span className="support-card-time">
              <Icon name="clock" size={14} /> {timeAgo(t.createdAt)}
            </span>
          </div>
        </div>
        {t.unreadBySupport && <div className="support-card-unread-indicator"></div>}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .support-dashboard {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .support-section-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid rgba(201,146,42,.15);
          padding-bottom: 8px;
        }
        .support-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
        }
        .support-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .support-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(201,146,42,.12);
          border-color: rgba(201,146,42,.3);
        }
        .support-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: transparent;
          transition: background 0.3s ease;
        }
        .support-card.unread::before {
          background: var(--gold);
        }
        .support-card.resolved {
          opacity: 0.7;
          box-shadow: none;
        }
        .support-card.resolved:hover {
          transform: translateY(-2px);
          opacity: 1;
        }
        .support-card.resolved::before {
          background: var(--green);
        }
        .support-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(201,146,42,.15), rgba(201,146,42,.05));
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .support-card.resolved .support-card-icon {
          background: linear-gradient(135deg, rgba(45,122,79,.15), rgba(45,122,79,.05));
          color: var(--green);
        }
        .support-card-body {
          flex: 1;
          min-width: 0;
        }
        .support-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }
        .support-card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .support-card-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .support-card-badge.pending, .support-card-badge.open {
          background: rgba(37,99,235,.1);
          color: var(--blue);
        }
        .support-card-badge.resolved {
          background: rgba(45,122,79,.1);
          color: var(--green);
        }
        .support-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .support-card-author, .support-card-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .support-card-author {
          font-weight: 500;
          color: var(--ink);
        }
        .support-card-unread-indicator {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 8px rgba(192,57,43,.6);
          animation: pulse 2s infinite;
        }
        .empty-state {
          background: linear-gradient(135deg, rgba(45,122,79,.08), rgba(45,122,79,.02));
          border: 1px dashed rgba(45,122,79,.3);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          color: var(--green);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-state-icon {
          width: 56px;
          height: 56px;
          background: rgba(45,122,79,.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="support-dashboard">
        <section>
          <h2 className="support-section-title">
            <Icon name="warning-circle" size={24} color="var(--red)"/> Нові звернення <span style={{color:'var(--muted)', fontSize:'1rem'}}>({pending.length})</span>
          </h2>
          {pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="check-circle" size={28}/></div>
              <p style={{fontSize:'1.05rem', fontWeight:500}}>Немає нових звернень, ви чудово працюєте!</p>
            </div>
          ) : (
            <div className="support-grid">{pending.map(renderTicketCard)}</div>
          )}
        </section>

        <section>
          <h2 className="support-section-title">
            <Icon name="envelope-open" size={24} color="var(--blue)"/> Активні <span style={{color:'var(--muted)', fontSize:'1rem'}}>({active.length})</span>
          </h2>
          {active.length === 0 ? (
            <div style={{color:'var(--muted)', fontSize:'.9rem', fontStyle:'italic'}}>Немає активних звернень</div>
          ) : (
            <div className="support-grid">{active.map(renderTicketCard)}</div>
          )}
        </section>

        <section>
          <h2 className="support-section-title">
            <Icon name="archive" size={24} color="var(--muted)"/> Архів
          </h2>
          <div className="support-grid">{closed.slice(0,10).map(renderTicketCard)}</div>
        </section>
      </div>

      {openTicket && typeof window !== 'undefined' && createPortal(
        <div className="overlay" onClick={() => setOpenTicket(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'650px', width: '100%', margin: '0 20px', padding: 0, display: 'flex', flexDirection: 'column', height: '85vh', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)'}}>
            <div style={{padding:'24px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center', flexShrink: 0, background: 'var(--card)'}}>
              <div>
                <div style={{fontWeight:700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink)'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'var(--gold-dim)',color:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="lightbulb" size={20}/></div>
                  {openTicket.subject}
                </div>
                <div style={{fontSize:'.85rem',color:'var(--muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <Icon name="user" size={14}/> Від: <strong>{openTicket.authorName}</strong> <span style={{opacity:0.6}}>({openTicket.authorUid})</span>
                </div>
              </div>
              <div style={{display:'flex',gap:'12px', alignItems:'center'}}>
                {openTicket.status !== 'resolved' && (
                  <button className="btn btn-gold btn-sm" onClick={() => handleResolve(openTicket.id, 'resolved')} style={{padding: '10px 16px', borderRadius: '12px'}}>
                    <Icon name="check" size={16}/> Вирішити
                  </button>
                )}
                <button className="modal-close" onClick={() => setOpenTicket(null)} style={{background: 'var(--warm)', border: 'none'}}>
                  <Icon name="x" size={20}/>
                </button>
              </div>
            </div>

            <div style={{flex:1,overflowX:'hidden',overflowY:'auto',padding:'24px',display:'flex',flexDirection:'column',gap:'16px', background: 'var(--paper)'}}>
              {ticketMessages.map((m: any) => {
                const isSupport = m.role === 'tech-admin' || m.role === 'moderator' || m.role === 'founder';
                const userObj = users?.find((u: any) => u.uid === m.uid);
                const avatarUrl = m.avatar || userObj?.avatar;
                
                return (
                  <div key={m.id} className={`chat-msg ${isSupport ? 'support' : 'user'}`}>
                    <div className="chat-msg-avatar" style={{width:'40px',height:'40px',borderRadius:'50%',boxShadow:'var(--shadow-sm)',overflow:'hidden'}}>
                      {isSupport ? (
                        <Icon name="headset" size={20}/>
                      ) : (
                        avatarUrl ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : (m.name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="chat-msg-content" style={{maxWidth: '85%'}}>
                      <div className="chat-bubble" style={{padding: '12px 16px', borderRadius: '16px', fontSize: '.95rem', lineHeight: '1.5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
                        {m.text}
                        {m.imageUrl && <img src={m.imageUrl} className="chat-bubble-img" alt="attachment" style={{borderRadius: '8px', marginTop: '8px', cursor: 'pointer'}} onClick={() => setLightboxImage(m.imageUrl)} />}
                      </div>
                      <div className="chat-msg-time" style={{marginTop: '6px', fontSize: '.75rem'}}>
                        {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {openTicket.status !== 'resolved' && openTicket.status !== 'dismissed' ? (
              <div style={{borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink: 0, background: 'var(--card)'}}>
                {replyAttachedImage && (
                  <div style={{padding:'10px 20px 0'}}>
                    <div className="chat-attach-preview-wrap" style={{margin: 0}}>
                      <img src={replyAttachedImage} alt="Attachment preview" className="chat-attach-preview-img" style={{maxHeight:'60px'}} />
                      <button className="chat-attach-preview-remove" onClick={() => setReplyAttachedImage(null)}>×</button>
                    </div>
                  </div>
                )}
                <div style={{padding:'20px',display:'flex',gap:'12px',alignItems:'center'}}>
                  <label className="chat-attach-btn" style={{cursor:'pointer', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', background:'var(--warm)', borderRadius:'12px', border:'1px solid var(--border)', height:'42px'}} title="Прикріпити фото">
                    <Icon name="camera" size={20}/>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setReplyUploadingImage(true);
                      try {
                        const base64Url = await compressImage(file);
                        setReplyAttachedImage(base64Url);
                      } catch (err) {
                        toast('Помилка завантаження зображення', 'error');
                      } finally {
                        setReplyUploadingImage(false);
                      }
                    }} />
                  </label>
                  <textarea 
                    placeholder={replyUploadingImage ? "Опрацювання..." : "Написати відповідь користувачу..."} 
                    style={{flex:1,padding:'10px 14px',border:'1.5px solid var(--border)',borderRadius:'12px',resize:'none',height:'42px',minHeight:'42px',fontSize:'.88rem',fontFamily:'inherit',outline:'none',boxSizing:'border-box',overflowY:'hidden',lineHeight:'1.4'}}
                    value={ticketReply}
                    disabled={replyUploadingImage}
                    onChange={e => setTicketReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  ></textarea>
                  <button className="btn btn-dark" style={{padding:'0 20px', borderRadius:'14px', height:'42px', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={handleSendReply} disabled={replyUploadingImage}>
                    {replyUploadingImage ? <Icon name="circle-notch" size={20} /> : <Icon name="paper-plane-right" size={20}/>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{padding:'20px',textAlign:'center',color:'var(--muted)',fontStyle:'italic',borderTop:'1px solid var(--border)', flexShrink: 0, background: 'var(--card)'}}>
                <span style={{marginRight:'8px'}}><Icon name="lock" size={16}/></span> Звернення закрите. Відповідь неможлива.
              </div>
            )}
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
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />
      {lightboxImage && (
        <div className="lightbox-overlay" style={{zIndex: 999999}} onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <img src={lightboxImage} alt="Enlarged support ticket attachment" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
