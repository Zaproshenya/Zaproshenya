'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getGroupInvite, joinGroupInvite } from '@/lib/firebase/db';
import { TYPE_MAP, boom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function ClientGroupInvitePage({ id }: { id: string }) {
  const { user, profile } = useAuth();
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getGroupInvite(id);
        if (data) {
          setGroupData(data);
          
          if (user && data.members) {
            const memberEntry = Object.values(data.members as Record<string, any>).find(m => m.uid === user.uid);
            if (memberEntry) {
              setAnswered(true);
              setAnswerStatus(memberEntry.status);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleAnswer = async (status: string) => {
    let finalName = '';
    if (user && profile) {
      finalName = profile.name;
    } else {
      if (!guestName.trim()) {
        alert('Будь ласка, введіть своє ім\'я');
        return;
      }
      finalName = guestName.trim();
    }
    
    try {
      await joinGroupInvite(id, { name: finalName, uid: user?.uid || null, status });
      setAnswered(true);
      setAnswerStatus(status);
      if (status === 'accepted') {
        boom();
      }
      
      // Update local state to show immediately
      const newMember = { name: finalName, uid: user?.uid || null, status, joinedAt: Date.now() };
      setGroupData((prev: any) => ({
        ...prev,
        members: { ...(prev.members || {}), ['temp_' + Date.now()]: newMember }
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Завантаження...</div>;
  }

  if (!groupData) {
    return (
      <div style={{textAlign:'center',padding:'80px 20px'}}>
        <div style={{fontSize:'2rem',marginBottom:'12px'}}><Icon name="users" size={32}/></div>
        <p style={{color:'var(--muted)',fontSize:'1.1rem'}}>Групове запрошення не знайдено</p>
      </div>
    );
  }

  if (!groupData.isPublic && (!user || (groupData.invitedUids && !groupData.invitedUids.includes(user.uid) && user.uid !== groupData.creatorUid))) {
    return (
      <div className="invite-bg">
        <div className="invite-envelope">
          <div className="envelope-top">
            <span className="envelope-emoji"><Icon name="lock" size={24}/></span>
            <div className="envelope-type">Приватна група</div>
            <div className="envelope-to">{groupData.title || 'Зустріч'}</div>
          </div>
          <div className="envelope-body" style={{textAlign:'center'}}>
            <p style={{color:'var(--muted)',marginBottom:'20px',fontSize:'1rem'}}>
              Це приватне групове запрошення. Увійдіть в акаунт, щоб перевірити доступ.
            </p>
            {!user && (
              <Link href="/login" className="btn btn-dark" style={{width:'auto',padding:'12px 32px'}}>
                Увійти / Зареєструватися
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const t = TYPE_MAP[groupData.type] || TYPE_MAP.other;
  const membersList = groupData.members ? Object.values(groupData.members as Record<string, any>) : [];
  const acceptedMembers = membersList.filter(m => m.status === 'accepted');
  const otherMembers = membersList.filter(m => m.status !== 'accepted');
  const isCreator = user && user.uid === groupData.creatorUid;

  return (
    <div className="invite-bg">
      <div className="invite-envelope" style={{animation: 'none', transform: 'none', maxWidth: '440px'}}>
        <div className="envelope-top" style={{borderRadius: '24px 24px 0 0'}}>
          <div style={{display:'inline-flex', background:'rgba(255,255,255,.15)', padding:'4px 10px', borderRadius:'var(--radius-pill)', fontSize:'.75rem', fontWeight:600, color:'#fff', marginBottom:'14px', alignItems:'center', gap:'4px'}}>
            <Icon name="users" size={12}/> Групове запрошення
          </div>
          <span className="envelope-emoji">{t.e}</span>
          <div className="envelope-to" style={{fontSize:'1.6rem'}}>{groupData.title || 'Зустріч'}</div>
          {groupData.showSender !== false && <div className="envelope-from" style={{marginTop:'8px'}}>організатор <strong>{groupData.senderName || 'Невідомий'}</strong></div>}
        </div>

        <div className="envelope-body">
          {groupData.msg && (
            <div className="msg-block">
              <p className="msg-text">{groupData.msg}</p>
            </div>
          )}

          <div className="detail-chips">
            <div className="detail-chip">
              <span className="detail-chip-icon"><Icon name="calendar-blank" size={16}/></span>
              <div><div className="detail-chip-label">Дата</div><div className="detail-chip-value">{groupData.date}</div></div>
            </div>
            <div className="detail-chip">
              <span className="detail-chip-icon"><Icon name="clock" size={16}/></span>
              <div><div className="detail-chip-label">Час</div><div className="detail-chip-value">{groupData.time}</div></div>
            </div>
            {groupData.place && (
              <div className="detail-chip full">
                <span className="detail-chip-icon"><Icon name="map-pin" size={16}/></span>
                <div><div className="detail-chip-label">Місце</div><div className="detail-chip-value">{groupData.place}</div></div>
              </div>
            )}
          </div>

          <div style={{marginTop:'24px', marginBottom:'24px', background:'var(--warm)', borderRadius:'16px', padding:'16px', border:'1px solid var(--gold-border)'}}>
            <h3 style={{fontSize:'.95rem', fontWeight:600, color:'var(--ink)', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span>Учасники ({acceptedMembers.length})</span>
            </h3>
            
            {membersList.length === 0 ? (
              <p style={{fontSize:'.85rem', color:'var(--muted)', fontStyle:'italic'}}>Поки ніхто не відповів</p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                {acceptedMembers.map((m, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', background:'var(--card)', padding:'8px 12px', borderRadius:'10px', border:'1px solid rgba(24,18,10,.05)'}}>
                    <div className="avatar avatar-sm">{m.name.charAt(0).toUpperCase()}</div>
                    <span style={{fontSize:'.9rem', fontWeight:500, color:'var(--ink)'}}>{m.name}</span>
                    <span style={{marginLeft:'auto', fontSize:'.75rem', color:'var(--green)', display:'flex', alignItems:'center', gap:'4px'}}><Icon name="check-circle" size={14}/> Йде</span>
                  </div>
                ))}
                {otherMembers.length > 0 && (
                  <div style={{marginTop:'8px'}}>
                    <div style={{fontSize:'.8rem', color:'var(--muted)', marginBottom:'6px'}}>Інші відповіді:</div>
                    {otherMembers.map((m, i) => (
                      <div key={i} style={{display:'flex', alignItems:'center', gap:'8px', opacity:0.7, padding:'4px 0'}}>
                        <span style={{fontSize:'.85rem', color:'var(--ink)'}}>{m.name}</span>
                        <span style={{fontSize:'.75rem', color:'var(--muted)'}}>
                          {m.status === 'declined' ? '— Не прийде' : '— ' + m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {answered ? (
            <div className="result-screen" style={{animation:'pop .5s cubic-bezier(.34,1.56,.64,1) both', marginTop:'24px'}}>
              {answerStatus === 'accepted' && (
                <>
                  <span className="result-icon"><Icon name="confetti" size={32}/></span>
                  <div className="result-title" style={{color:'var(--green)'}}>Ура! Так! <Icon name="star" size={14}/></div>
                  <div className="result-sub">Ви погодились! Відправник дізнається автоматично <Icon name="check" size={14}/></div>
                </>
              )}
              {answerStatus === 'declined' && (
                <>
                  <span className="result-icon"><Icon name="heart-crack" size={32}/></span>
                  <div className="result-title" style={{color:'var(--red)'}}>Відмовлено</div>
                  <div className="result-sub">Ви відмовились. Відправник дізнається автоматично.</div>
                </>
              )}
            </div>
          ) : !isCreator && (
            <div className="action-section-wrap" style={{background:'var(--card)', border:'1px solid var(--gold-border)'}}>
              {!user && (
                <div style={{marginBottom:'16px'}}>
                  <label className="lbl" style={{textAlign:'left'}}>Як вас звати?</label>
                  <input type="text" placeholder="Ваше ім'я" value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={20}/>
                </div>
              )}
              
              <div className="answer-wrap" style={{flexDirection:'column'}}>
                <button className="btn-yes" style={{width:'100%'}} onClick={() => handleAnswer('accepted')}><Icon name="check" size={16}/> Приєднатися до зустрічі</button>
                <button className="btn-no" style={{width:'100%'}} onClick={() => handleAnswer('declined')}>Не зможу бути</button>
              </div>
            </div>
          )}

          <div className="envelope-footer">
            {user && (
              <Link href="/home">← Меню</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
