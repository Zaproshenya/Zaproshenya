'use client';
import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  removing?: boolean;
  onClick?: () => void;
}

let addToastFn: (msg: string, type?: ToastType, duration?: number, onClick?: () => void) => void = () => {};

export function toast(message: string, type: ToastType = 'info', duration: number = 3500, onClick?: () => void) {
  addToastFn(message, type, duration, onClick);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = 'info', duration: number = 3500, onClick?: () => void) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, onClick }]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, duration);
    };
  }, []);

  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast toast-${t.type} ${t.removing ? 'removing' : ''}`}
          onClick={() => t.onClick && t.onClick()}
          style={t.onClick ? { cursor: 'pointer' } : {}}
        >
          <span className="toast-icon">
            {t.type === 'success' && <Icon name="check-circle" size={18} color="var(--green)" />}
            {t.type === 'error' && <Icon name="x-circle" size={18} color="var(--red)" />}
            {t.type === 'info' && <Icon name="info" size={18} color="var(--blue)" />}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
