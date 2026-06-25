'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvite, updateInviteStatus } from '@/lib/firebase/db';
import { TYPE_MAP, boom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function ClientInvitePage({ id }: { id: string }) {
  const { user } = useAuth();
  const [invData, setInvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getInvite(id);
        if (data) {
          // Check access
          if (data.recipientUid && user?.uid !== data.recipientUid && user?.uid !== data.creatorUid) {
            setInvData(null);
          } else {
            setInvData(data);
          }
          // In a real implementation we would fetch the status from statuses/id
          // For now let's just use data.status if it was populated or fetch
          const res = await fetch(`https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app/statuses/${id}.json`);
          const st = await res.json();
          if (st === 'accepted' || st === 'declined' || st === 'reschedule') {
            setAnswered(true);
            setAnswerStatus(st);
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
    try {
      await updateInviteStatus(id, status, invData?.creatorUid);
      setAnswered(true);
      setAnswerStatus(status);
      if (status === 'accepted') {
        boom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="invite-bg">
        <div className="invite-envelope">
          <div className="envelope-top" style={{textAlign:'center'}}>
            <div className="skeleton-circle" style={{width:'56px',height:'56px',margin:'0 auto 10px'}}></div>
            <div className="skeleton-line w-1-2" style={{margin:'0 auto 8px',height:'14px',background:'rgba(255,255,255,.3)'}}></div>
            <div className="skeleton-line w-3-4" style={{margin:'0 auto',height:'20px',background:'rgba(255,255,255,.4)'}}></div>
          </div>
          <div className="envelope-body">
            <div className="skeleton-line w-full" style={{marginBottom:'8px',height:'12px'}}></div>
            <div className="skeleton-line w-3-4" style={{marginBottom:'14px',height:'12px'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invData) {
    return (
      <div style={{textAlign:'center',padding:'80px 20px'}}>
        <div style={{fontSize:'2rem',marginBottom:'12px'}}><Icon name="leaf" size={32}/></div>
        <p style={{color:'var(--muted)',fontSize:'1.1rem'}}>Запрошення не знайдено</p>
      </div>
    );
  }

  if (invData.requireAuth && !user) {
    return (
      <div className="invite-bg">
        <div className="invite-envelope">
          <div className="envelope-top">
            <span className="envelope-emoji"><Icon name="lock" size={24}/></span>
            <div className="envelope-type">Запрошення</div>
            <div className="envelope-to">{invData.to}</div>
          </div>
          <div className="envelope-body" style={{textAlign:'center'}}>
            <p style={{color:'var(--muted)',marginBottom:'20px',fontSize:'1rem'}}>
              Щоб переглянути це запрошення, потрібно увійти в акаунт або зареєструватися.
            </p>
            <Link href="/login" className="btn btn-dark" style={{width:'auto',padding:'12px 32px'}}>
              Увійти / Зареєструватися
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const t = TYPE_MAP[invData.type] || TYPE_MAP.other;
  const isCreator = user && user.uid === invData.creatorUid;

  return (
    <div className="invite-bg">
      <div className="invite-envelope">
        <div className="envelope-top">
          <span className="envelope-emoji">{t.e}</span>
          <div className="envelope-type">{t.l}</div>
          <div className="envelope-to">{invData.to}</div>
          {invData.showSender !== false && <div className="envelope-from">від <strong>{invData.senderName || 'Невідомий'}</strong></div>}
        </div>

        <div className="envelope-body">
          {invData.msg && (
            <div className="msg-block">
              <p className="msg-text">{invData.msg}</p>
            </div>
          )}

          <div className="detail-chips">
            <div className="detail-chip">
              <span className="detail-chip-icon"><Icon name="calendar-blank" size={16}/></span>
              <div><div className="detail-chip-label">Дата</div><div className="detail-chip-value">{invData.date}</div></div>
            </div>
            <div className="detail-chip">
              <span className="detail-chip-icon"><Icon name="clock" size={16}/></span>
              <div><div className="detail-chip-label">Час</div><div className="detail-chip-value">{invData.time}</div></div>
            </div>
            {invData.place && (
              <div className="detail-chip full">
                <span className="detail-chip-icon"><Icon name="map-pin" size={16}/></span>
                <div><div className="detail-chip-label">Місце</div><div className="detail-chip-value">{invData.place}</div></div>
              </div>
            )}
          </div>

          {answered ? (
            <div className="result-screen" style={{animation:'pop .5s cubic-bezier(.34,1.56,.64,1) both'}}>
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
              {answerStatus === 'reschedule' && (
                <>
                  <span className="result-icon"><Icon name="calendar-blank" size={32}/></span>
                  <div className="result-title" style={{color:'var(--gold)'}}>Пропозицію надіслано!</div>
                  <div className="result-sub">Відправник отримає ваш варіант часу і зв'яжеться з вами.</div>
                </>
              )}
            </div>
          ) : (
            isCreator ? (
              <div className="action-section-wrap">
                <div className="answer-wrap" style={{opacity:0.45, pointerEvents:'none'}}>
                  <button className="btn-yes" disabled><Icon name="check" size={14}/> Так, я приду!</button>
                  <button className="btn-reschedule" disabled><Icon name="calendar-blank" size={14}/> Перенести</button>
                  <button className="btn-no" disabled><Icon name="x" size={14}/> Ні</button>
                </div>
                <p style={{textAlign:'center', fontSize:'.85rem', color:'var(--muted)', marginTop:'12px'}}>
                  Ви — відправник цього запрошення
                </p>
              </div>
            ) : (
              <div className="action-section-wrap">
                <div className="answer-wrap">
                  <button className="btn-yes" onClick={() => handleAnswer('accepted')}><Icon name="check" size={14}/> Так, я приду!</button>
                  <button className="btn-reschedule" onClick={() => handleAnswer('reschedule')}><Icon name="calendar-blank" size={14}/> Перенести</button>
                  <button className="btn-no" onClick={() => handleAnswer('declined')}><Icon name="x" size={14}/> Ні</button>
                </div>
              </div>
            )
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
