'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvite, updateInviteStatus, createReport, listenToInvite, listenToInviteStatus } from '@/lib/firebase/db';
import { TYPE_MAP, boom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

export default function ClientInvitePage({ id }: { id: string }) {
  const { user, profile } = useAuth();
  const [invData, setInvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);

  // States for reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [reason, setReason] = useState('Спам або шахрайство');
  const [comment, setComment] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // States for rescheduling
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  useEffect(() => {
    if (user === undefined) return;

    const unsubInvite = listenToInvite(id, (data) => {
      if (data) {
        if (data.recipientUid && user?.uid !== data.recipientUid && user?.uid !== data.creatorUid) {
          setInvData(null);
        } else {
          setInvData(data);
        }
      } else {
        setInvData(null);
      }
      setLoading(false);
    });

    const unsubStatus = listenToInviteStatus(id, (st) => {
      if (st === 'accepted' || st === 'declined' || st === 'reschedule') {
        setAnswered(true);
        setAnswerStatus(st);
      } else {
        setAnswered(false);
        setAnswerStatus(null);
      }
    });

    return () => {
      unsubInvite();
      unsubStatus();
    };
  }, [id, user]);

  const [rescheduleData, setRescheduleData] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    if (answerStatus === 'reschedule') {
      setRescheduleData(undefined);
      import('@/lib/firebase/db').then(({ getReschedule }) => {
        getReschedule(id).then((res) => {
          setRescheduleData(res || null);
        }).catch((err) => {
          console.error(err);
          setRescheduleData(null);
        });
      });
    } else {
      setRescheduleData(null);
    }
  }, [id, answerStatus]);

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

  const submitReschedule = async () => {
    if (!rescheduleDate && !rescheduleTime) {
      toast('Виберіть дату або час!', 'error');
      return;
    }

    try {
      const { saveReschedule, addNotification } = await import('@/lib/firebase/db');
      await saveReschedule(id, { date: rescheduleDate, time: rescheduleTime });

      // Notify creator
      if (invData?.creatorUid) {
        const responderName = profile?.name || invData.to || 'Хтось';
        await addNotification(invData.creatorUid, {
          type: 'invite-reschedule',
          title: `Запит на перенесення`,
          body: `${responderName} хоче перенести зустріч`,
          inviteId: id,
        });
      }

      setAnswered(true);
      setAnswerStatus('reschedule');
      setShowRescheduleForm(false);
      toast('Пропозицію надіслано!', 'success');
    } catch (e) {
      console.error(e);
      toast('Сталася помилка при збереженні', 'error');
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

  const t = invData.type === 'custom'
    ? { v: 'custom', l: invData.customLabel || 'Своє', e: invData.customEmoji || '✦' }
    : (TYPE_MAP[invData.type] || TYPE_MAP.other);
  const isCreator = user && user.uid === invData.creatorUid;

  const submitReport = async () => {
    if (!reason) {
      toast('Оберіть причину скарги', 'error');
      return;
    }
    setSubmittingReport(true);
    const targetContent = {
      to: invData?.to || '',
      msg: invData?.msg || '',
      date: invData?.date || '',
      time: invData?.time || '',
      place: invData?.place || '',
      type: invData?.type || '',
      creatorName: invData?.senderName || '',
      creatorUid: invData?.creatorUid || '',
      recipientUid: user?.uid || null
    };

    try {
      await createReport({
        targetType: 'invite',
        targetId: id,
        reason,
        comment: comment.trim(),
        reporterUid: user?.uid || null,
        reporterName: profile?.name || 'Анонім',
        targetContent,
      });

      setShowReportModal(false);
      setComment('');
      toast('Скаргу надіслано. Дякуємо!', 'success');
    } catch (err) {
      console.error('Failed to send report:', err);
      toast('Не вдалося надіслати скаргу. Спробуйте пізніше.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

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
                isCreator ? (
                  <>
                    <span className="result-icon"><Icon name="confetti" size={32}/></span>
                    <div className="result-title" style={{color:'var(--green)'}}>Запрошення прийнято! <Icon name="star" size={14}/></div>
                    <div className="result-sub">Отримувач погодився прийти на зустріч <Icon name="check" size={14}/></div>
                  </>
                ) : (
                  <>
                    <span className="result-icon"><Icon name="confetti" size={32}/></span>
                    <div className="result-title" style={{color:'var(--green)'}}>Ура! Так! <Icon name="star" size={14}/></div>
                    <div className="result-sub">Ви погодились! Відправник дізнається автоматично <Icon name="check" size={14}/></div>
                  </>
                )
              )}
              {answerStatus === 'declined' && (
                isCreator ? (
                  <>
                    <span className="result-icon"><Icon name="heart-crack" size={32}/></span>
                    <div className="result-title" style={{color:'var(--red)'}}>Отримувач відмовився</div>
                    <div className="result-sub">На жаль, отримувач відхилив ваше запрошення.</div>
                  </>
                ) : (
                  <>
                    <span className="result-icon"><Icon name="heart-crack" size={32}/></span>
                    <div className="result-title" style={{color:'var(--red)'}}>Відмовлено</div>
                    <div className="result-sub">Ви відмовились. Відправник дізнається автоматично.</div>
                  </>
                )
              )}
              {answerStatus === 'reschedule' && (
                isCreator ? (
                  <>
                    <span className="result-icon"><Icon name="calendar-blank" size={32}/></span>
                    <div className="result-title" style={{color:'var(--gold)'}}>Запит на перенесення</div>
                    <div className="result-sub">
                      {rescheduleData === undefined ? (
                        'Завантаження...'
                      ) : rescheduleData ? (
                        `Отримувач пропонує перенести на: ${rescheduleData.date || '—'}${rescheduleData.time ? ` о ${rescheduleData.time}` : ''}`
                      ) : (
                        'Отримувач запропонував перенести зустріч.'
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="result-icon"><Icon name="calendar-blank" size={32}/></span>
                    <div className="result-title" style={{color:'var(--gold)'}}>Пропозицію надіслано!</div>
                    <div className="result-sub">Відправник отримає ваш варіант часу і зв'яжеться з вами.</div>
                  </>
                )
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
                   <button className={`btn-reschedule ${showRescheduleForm ? 'active' : ''}`} onClick={() => setShowRescheduleForm(!showRescheduleForm)}><Icon name="calendar-blank" size={14}/> Перенести</button>
                   <button className="btn-no" onClick={() => handleAnswer('declined')}><Icon name="x" size={14}/> Ні</button>
                 </div>

                 {showRescheduleForm && (
                   <div className="reschedule-form-block" style={{ marginTop: '16px', animation: 'fadeIn .2s ease' }}>
                     <div className="reschedule-form" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--warm)' }}>
                       <p style={{ fontSize: '.84rem', fontWeight: 500, marginBottom: '12px' }}>Запропонуйте інший час:</p>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                         <div>
                           <label className="lbl">Нова дата</label>
                           <input
                             type="date"
                             style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--paper)', color: 'var(--ink)', fontSize: '0.9rem' }}
                             value={rescheduleDate}
                             min={new Date().toISOString().split('T')[0]}
                             onChange={(e) => setRescheduleDate(e.target.value)}
                           />
                         </div>
                         <div>
                           <label className="lbl">Новий час</label>
                           <input
                             type="time"
                             style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--paper)', color: 'var(--ink)', fontSize: '0.9rem' }}
                             value={rescheduleTime}
                             onChange={(e) => setRescheduleTime(e.target.value)}
                           />
                         </div>
                       </div>
                       <button className="btn btn-gold btn-full" style={{ width: '100%', padding: '10px' }} onClick={submitReschedule}>
                         Надіслати пропозицію →
                       </button>
                     </div>
                   </div>
                 )}
               </div>
            )
          )}

          <div className="envelope-footer" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'18px', width:'100%'}}>
            {user && (
              <Link href="/home">← Меню</Link>
            )}
            {user && !answered && (
              <span style={{color:'var(--border)', fontSize:'.85rem'}}>•</span>
            )}
            {!answered && (
              <button 
                onClick={() => setShowReportModal(true)} 
                style={{background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', gap:'4px'}}
              >
                <Icon name="warning" size={14}/> Поскаржитися
              </button>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="overlay" onClick={() => setShowReportModal(false)} style={{zIndex: 9999}}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Icon name="warning" size={20}/> Поскаржитися
            </h3>
            <p style={{color:'var(--muted)', fontSize:'.9rem', marginBottom:'16px'}}>Оберіть причину скарги:</p>
            <div className="report-reasons">
              {['Спам або шахрайство', 'Образливий вміст', 'Небажане запрошення', 'Інше'].map((reasonOption) => (
                <div
                  key={reasonOption}
                  className={`report-reason ${reason === reasonOption ? 'selected' : ''}`}
                  onClick={() => setReason(reasonOption)}
                >
                  <div className="report-reason-radio"></div>
                  <span>{reasonOption}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:'12px'}}>
              <label className="lbl">Додатковий коментар (необов'язково)</label>
              <textarea
                placeholder="Опишіть проблему..."
                style={{minHeight:'60px', width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--paper)', color:'var(--ink)'}}
                maxLength={100}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'18px'}}>
              <button
                className="btn btn-red"
                style={{flex: 1}}
                onClick={submitReport}
                disabled={submittingReport}
              >
                {submittingReport ? 'Надсилання...' : 'Надіслати скаргу'}
              </button>
              <button
                className="btn btn-outline"
                style={{flex: 1}}
                onClick={() => setShowReportModal(false)}
                disabled={submittingReport}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
