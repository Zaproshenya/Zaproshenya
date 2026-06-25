'use client';
import { Icon } from './Icon';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDanger ? 'var(--red)' : 'var(--gold)', margin: 0 }}>
          <Icon name={isDanger ? 'warning' : 'info'} size={20} /> {title}
        </h3>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '16px 0 24px', color: 'var(--ink)' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn ${isDanger ? 'btn-red' : 'btn-gold'}`}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
