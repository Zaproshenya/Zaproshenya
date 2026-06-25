'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import { resolveReport } from '@/lib/firebase/db';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toast';

export default function AdminReports({ reports, reload }: { reports: any[], reload: () => void }) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const pending = reports.filter(r => r.status === 'pending');
  const other = reports.filter(r => r.status !== 'pending');

  const handleResolve = (id: string, status: string) => {
    const isResolved = status === 'resolved';
    setConfirmModal({
      show: true,
      title: isResolved ? 'Схвалити скаргу' : 'Відхилити скаргу',
      message: `Ви дійсно хочете позначити цю скаргу як "${isResolved ? 'схвалена' : 'відхилена'}"?`,
      isDanger: isResolved,
      onConfirm: async () => {
        try {
          await resolveReport(id, status);
          reload();
          toast('Статус скарги змінено', 'success');
        } catch (err: any) {
          toast('Помилка: ' + (err.message || err), 'error');
        }
      }
    });
  };

  const renderReport = (r: any) => {
    const isPending = r.status === 'pending';
    const isExpanded = !!expandedComments[r.id];
    const needsTruncation = r.comment && r.comment.length > 150;
    const commentText = needsTruncation && !isExpanded ? `${r.comment.slice(0, 150)}...` : r.comment;

    return (
      <div key={r.id} className={`report-card ${!isPending ? 'resolved' : ''}`}>
        <div className="report-card-header">
          <div style={{display:'flex', gap:'12px', alignItems:'flex-start'}}>
            <div className="report-icon">
              <Icon name="warning" size={20}/>
            </div>
            <div>
              <div className="report-id">ID: {r.id}</div>
              <h3 className="report-title">{r.reason}</h3>
            </div>
          </div>
          <div className="report-time">
            <Icon name="clock" size={14}/> {timeAgo(r.createdAt)}
          </div>
        </div>

        {r.comment && (
          <div className="report-comment">
            <div>"{commentText}"</div>
            {needsTruncation && (
              <button 
                onClick={() => setExpandedComments(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                className="report-btn-expand"
              >
                <Icon name={isExpanded ? "caret-up" : "caret-down"} size={14}/>
                {isExpanded ? 'Згорнути' : 'Переглянути більше'}
              </button>
            )}
          </div>
        )}

        <div className="report-details-grid">
          <div className="report-detail-item">
            <span className="report-detail-label">Скаржиться:</span>
            <div className="report-detail-value">{r.reporterName}</div>
            <div className="report-detail-sub">UID: {r.reporterUid}</div>
          </div>
          <div className="report-detail-item">
            <span className="report-detail-label">Ціль:</span>
            <div className="report-detail-value">
              {r.targetType === 'invite' ? 'Персональне запрошення' : r.targetType === 'group-invite' ? 'Групове запрошення' : r.targetType}
            </div>
            <Link href={`/${r.targetType === 'group-invite' ? 'g' : 'i'}/${r.targetId}`} target="_blank" className="report-btn-link">
              Переглянути ціль <Icon name="arrow-up-right" size={14}/>
            </Link>
          </div>
        </div>

        {r.targetContent && (
          <details className="report-details-raw">
            <summary>Показати збережений контент на момент скарги</summary>
            <pre>
              {JSON.stringify(r.targetContent, null, 2)}
            </pre>
          </details>
        )}

        <div className="report-actions">
          {isPending ? (
            <>
              <button className="btn btn-red" onClick={() => handleResolve(r.id, 'resolved')} style={{padding:'8px 16px', borderRadius:'12px', fontSize:'.9rem', fontWeight:600}}>
                <Icon name="check-circle" size={16}/> Схвалити скаргу
              </button>
              <button className="btn btn-outline" onClick={() => handleResolve(r.id, 'dismissed')} style={{padding:'8px 16px', borderRadius:'12px', fontSize:'.9rem'}}>
                <Icon name="x-circle" size={16}/> Відхилити
              </button>
            </>
          ) : (
            <div className={`report-status ${r.status}`}>
              <Icon name={r.status==='resolved'?'check-circle':'x-circle'} size={18}/> 
              {r.status === 'resolved' ? 'Схвалено (Вирішено)' : 'Відхилено (Хибна)'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .reports-dashboard {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .reports-section-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid rgba(192,57,43,.15);
          padding-bottom: 8px;
        }
        .reports-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .report-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          transition: all 0.3s var(--ease);
          position: relative;
          overflow: hidden;
        }
        .report-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px;
          background: var(--red);
        }
        .report-card.resolved {
          opacity: 0.8;
          box-shadow: none;
        }
        .report-card.resolved::before {
          background: var(--muted);
        }
        .report-card.resolved:hover {
          opacity: 1;
        }
        .report-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .report-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(192,57,43,.15), rgba(192,57,43,.05));
          color: var(--red);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .report-card.resolved .report-icon {
          background: rgba(0,0,0,0.05);
          color: var(--muted);
        }
        .report-id {
          font-size: 0.75rem;
          color: var(--muted);
          font-family: monospace;
          margin-bottom: 4px;
          background: var(--warm);
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .report-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--red);
          margin: 0;
        }
        .report-card.resolved .report-title {
          color: var(--ink);
        }
        .report-time {
          font-size: 0.85rem;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .report-comment {
          background: linear-gradient(135deg, var(--warm), rgba(240,232,216,0.5));
          padding: 16px;
          border-radius: 14px;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 20px;
          border-left: 3px solid var(--red);
          color: var(--ink);
        }
        .report-card.resolved .report-comment {
          border-left-color: var(--muted);
        }
        .report-btn-expand {
          margin-top: 10px;
          background: none;
          border: none;
          color: var(--gold);
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .report-btn-expand:hover {
          background: rgba(201,146,42,0.1);
        }
        .report-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: rgba(0,0,0,0.015);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .report-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .report-detail-label {
          font-size: 0.8rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .report-detail-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
        }
        .report-detail-sub {
          font-size: 0.8rem;
          font-family: monospace;
          color: var(--muted);
        }
        .report-btn-link {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--blue);
          text-decoration: none;
          font-weight: 500;
        }
        .report-btn-link:hover {
          text-decoration: underline;
        }
        .report-details-raw {
          font-size: 0.85rem;
          margin-bottom: 20px;
          background: var(--warm);
          border-radius: 12px;
          overflow: hidden;
        }
        .report-details-raw summary {
          padding: 12px 16px;
          cursor: pointer;
          color: var(--ink);
          font-weight: 600;
          outline: none;
        }
        .report-details-raw summary:hover {
          background: rgba(0,0,0,0.03);
        }
        .report-details-raw pre {
          padding: 16px;
          margin: 0;
          border-top: 1px solid var(--border);
          white-space: pre-wrap;
          word-break: break-all;
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .report-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .report-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 8px 16px;
          border-radius: 12px;
        }
        .report-status.resolved {
          background: rgba(45,122,79,.1);
          color: var(--green);
        }
        .report-status.dismissed {
          background: rgba(0,0,0,.05);
          color: var(--muted);
        }
        .reports-empty {
          background: linear-gradient(135deg, rgba(45,122,79,.08), rgba(45,122,79,.02));
          border: 1px dashed rgba(45,122,79,.3);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          color: var(--green);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
      `}</style>

      <div className="reports-dashboard">
        <section>
          <h2 className="reports-section-title">
            <Icon name="clock" size={24} color="var(--red)"/> Очікують рішення <span style={{color:'var(--muted)', fontSize:'1rem'}}>({pending.length})</span>
          </h2>
          {pending.length === 0 ? (
            <div className="reports-empty">
              <div style={{width:'64px',height:'64px',background:'rgba(45,122,79,.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="check-circle" size={32}/></div>
              <p style={{fontSize:'1.1rem', fontWeight:600}}>Немає нових скарг, система працює ідеально!</p>
            </div>
          ) : (
            <div className="reports-grid">{pending.map(renderReport)}</div>
          )}
        </section>

        <section>
          <h2 className="reports-section-title">
            <Icon name="archive" size={24} color="var(--muted)"/> Оброблені <span style={{color:'var(--muted)', fontSize:'1rem'}}>({other.length})</span>
          </h2>
          {other.length === 0 ? (
            <p style={{color:'var(--muted)',fontSize:'.95rem',fontStyle:'italic'}}>Історія скарг порожня</p>
          ) : (
            <div className="reports-grid">{other.slice(0, 20).map(renderReport)}</div>
          )}
        </section>
      </div>

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
