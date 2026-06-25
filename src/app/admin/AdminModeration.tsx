'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { TYPE_MAP } from '@/lib/utils';
import Link from 'next/link';
import { deleteInvite } from '@/lib/firebase/db';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function AdminModeration({ invites, users, reload }: { invites: any[], users: any[], reload?: () => void }) {
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitePage, setInvitePage] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const INVITE_PAGE_SIZE = 30;

  const filtered = inviteSearch
    ? invites.filter(inv =>
        (inv.id && inv.id.toLowerCase().includes(inviteSearch.toLowerCase())) ||
        (inv.creatorUid && inv.creatorUid.toLowerCase().includes(inviteSearch.toLowerCase())) ||
        (inv.title && inv.title.toLowerCase().includes(inviteSearch.toLowerCase())) ||
        (inv.to && inv.to.toLowerCase().includes(inviteSearch.toLowerCase()))
      )
    : invites;

  const totalPages = Math.ceil(filtered.length / INVITE_PAGE_SIZE);
  const paged = filtered.slice(invitePage * INVITE_PAGE_SIZE, (invitePage + 1) * INVITE_PAGE_SIZE);

  const getProfile = (uid: string) => users.find(u => u.uid === uid);

  return (
    <>
      <div style={{background:'var(--warm)',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1px solid var(--border)'}}>
        <input type="text" placeholder="Пошук за ID запрошення, ID користувача, іменем…"
          value={inviteSearch}
          onChange={e => { setInviteSearch(e.target.value); setInvitePage(0); }}
          style={{width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'.88rem',background:'var(--card)'}}/>
      </div>

      <div style={{marginBottom:'8px',fontSize:'.8rem',color:'var(--muted)'}}>
        {filtered.length} запрошень
      </div>

      {paged.length === 0 ? (
        <div style={{background:'var(--green-bg)',borderRadius:'12px',padding:'18px',textAlign:'center'}}>
          <p style={{color:'var(--green)',fontSize:'.95rem'}}><Icon name="check-circle" size={16}/> Нічого не знайдено</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {paged.map(inv => {
            const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
            const creator = getProfile(inv.creatorUid);
            const creatorText = creator ? `(${creator.uniqueId}, @${creator.login})` : `(ID: ${inv.creatorUid})`;
            const recipientHtml = inv.isGroup
              ? `<span style="color:var(--gold)"><Icon name="users" size={14}/> Групове (${inv.title || 'Без назви'})</span>`
              : `<span style="color:var(--ink)"><Icon name="user" size={14}/> Для: <strong>${inv.to}</strong></span>`;

            return (
              <div key={inv.id} style={{background:'var(--card)',borderRadius:'12px',padding:'16px',border:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:'.8rem',color:'var(--muted)',fontFamily:'monospace',marginBottom:'4px'}}>ID: {inv.id}</div>
                    <div style={{fontSize:'.95rem',fontWeight:600}}>{t.e} {t.l}</div>
                    <div style={{fontSize:'.85rem',marginTop:'4px'}} dangerouslySetInnerHTML={{__html: recipientHtml}} />
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <Link href={`/${inv.isGroup ? 'g' : 'i'}/${inv.id}`} target="_blank" className="btn btn-outline btn-sm"><Icon name="link" size={14} /></Link>
                     <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={() => {
                      setConfirmModal({
                        show: true,
                        title: 'Видалити запрошення',
                        message: `Ви дійсно хочете видалити це запрошення? Цю дію не можна буде скасувати.`,
                        isDanger: true,
                        onConfirm: async () => {
                          await deleteInvite(inv.id, inv.creatorUid, inv.isGroup);
                          if(reload) reload();
                        }
                      });
                    }}>
                      <Icon name="trash" size={14} /> Видалити
                    </button>
                  </div>
                </div>
                {inv.msg && (
                  <div style={{background:'var(--warm)',padding:'10px',borderRadius:'8px',fontSize:'.85rem',color:'var(--ink)',fontStyle:'italic'}}>
                    "{inv.msg}"
                  </div>
                )}
                <div style={{fontSize:'.8rem',color:'var(--muted)',display:'flex',gap:'16px',marginTop:'4px'}}>
                  <span>Від: <strong>{inv.from || inv.creatorName || 'Невідомий'}</strong> {creatorText}</span>
                  <span>{inv.date} {inv.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{display:'flex',justifyContent:'center',gap:'8px',marginTop:'20px',flexWrap:'wrap'}}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} className={`btn btn-sm ${i === invitePage ? 'btn-dark' : 'btn-outline'}`} onClick={() => setInvitePage(i)}>
              {i + 1}
            </button>
          ))}
        </div>
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
    </>
  );
}
