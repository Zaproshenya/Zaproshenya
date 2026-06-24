'use client';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { resolveReport } from '@/lib/firebase/db';
import Link from 'next/link';

export default function AdminReports({ reports, reload }: { reports: any[], reload: () => void }) {
  const pending = reports.filter(r => r.status === 'pending');
  const other = reports.filter(r => r.status !== 'pending');

  const handleResolve = async (id: string, status: string) => {
    if (confirm(`Позначити скаргу як "${status}"?`)) {
      try {
        await resolveReport(id, status);
        reload();
      } catch (err) {
        alert('Помилка: ' + err);
      }
    }
  };

  const renderReport = (r: any) => {
    const isPending = r.status === 'pending';
    return (
      <div key={r.id} style={{background:'var(--card)',borderRadius:'12px',padding:'16px',border:'1px solid var(--border)',marginBottom:'12px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
          <div>
            <div style={{fontSize:'.8rem',color:'var(--muted)',fontFamily:'monospace',marginBottom:'4px'}}>ID: {r.id}</div>
            <div style={{fontSize:'1rem',fontWeight:600,color:'var(--red)'}}><Icon name="warning" size={16}/> {r.reason}</div>
          </div>
          <div style={{fontSize:'.8rem',color:'var(--muted)'}}>{timeAgo(r.createdAt)}</div>
        </div>

        {r.comment && (
          <div style={{background:'var(--warm)',padding:'12px',borderRadius:'8px',fontSize:'.9rem',marginBottom:'12px',borderLeft:'3px solid var(--red)',wordBreak:'break-all'}}>
            "{r.comment}"
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',fontSize:'.85rem',background:'rgba(0,0,0,0.02)',padding:'12px',borderRadius:'8px',marginBottom:'16px'}}>
          <div>
            <div style={{color:'var(--muted)',marginBottom:'4px'}}>Скаржиться:</div>
            <div style={{fontWeight:500}}>{r.reporterName}</div>
            <div style={{fontFamily:'monospace',fontSize:'.75rem'}}>{r.reporterUid}</div>
          </div>
          <div>
            <div style={{color:'var(--muted)',marginBottom:'4px'}}>Ціль:</div>
            <div>{r.targetType === 'invite' ? 'Персональне запрошення' : r.targetType === 'group-invite' ? 'Групове запрошення' : r.targetType}</div>
            <Link href={`/${r.targetType === 'group-invite' ? 'g' : 'i'}/${r.targetId}`} target="_blank" className="btn-ghost" style={{padding:0,fontSize:'.8rem'}}>Переглянути ціль ↗</Link>
          </div>
        </div>

        {r.targetContent && (
          <details style={{fontSize:'.8rem',marginBottom:'16px'}}>
            <summary style={{cursor:'pointer',color:'var(--muted)',fontWeight:500}}>Показати збережений контент на момент скарги</summary>
            <pre style={{background:'var(--warm)',padding:'10px',borderRadius:'6px',marginTop:'8px',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
              {JSON.stringify(r.targetContent, null, 2)}
            </pre>
          </details>
        )}

        {isPending ? (
          <div style={{display:'flex',gap:'10px'}}>
            <button className="btn btn-red btn-sm" onClick={() => handleResolve(r.id, 'resolved')}>Схвалити (Порушення)</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleResolve(r.id, 'dismissed')}>Відхилити (Хибна)</button>
          </div>
        ) : (
          <div style={{fontSize:'.85rem',color:r.status==='resolved'?'var(--green)':'var(--gold)',display:'flex',alignItems:'center',gap:'6px',fontWeight:500}}>
            <Icon name={r.status==='resolved'?'check-circle':'x-circle'} size={16}/> 
            {r.status === 'resolved' ? 'Схвалено (Вирішено)' : 'Відхилено'}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <h2 style={{fontSize:'1.2rem',fontWeight:600,marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
        <Icon name="clock" size={20}/> Очікують рішення ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div style={{background:'var(--green-bg)',borderRadius:'12px',padding:'18px',textAlign:'center',marginBottom:'32px'}}>
          <p style={{color:'var(--green)',fontSize:'.95rem'}}><Icon name="check-circle" size={16}/> Немає нових скарг</p>
        </div>
      ) : (
        <div style={{marginBottom:'32px'}}>{pending.map(renderReport)}</div>
      )}

      <h2 style={{fontSize:'1.2rem',fontWeight:600,marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
        <Icon name="archive" size={20}/> Оброблені
      </h2>
      {other.length === 0 ? (
        <p style={{color:'var(--muted)',fontSize:'.9rem',fontStyle:'italic'}}>Історія порожня</p>
      ) : (
        <div>{other.slice(0, 20).map(renderReport)}</div>
      )}
    </>
  );
}
