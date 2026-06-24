'use client';
import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  removing?: boolean;
}

let addToastFn: (msg: string, type?: ToastType, duration?: number) => void = () => {};

export function toast(message: string, type: ToastType = 'info', duration: number = 3500) {
  addToastFn(message, type, duration);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, duration);
    };
  }, []);

  // Use the legacy CSS IDs/classes
  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type} ${t.removing ? 'removing' : ''}`}>
          <span>
            {t.type === 'success' && <Icon name="check-circle" size={18} />}
            {t.type === 'error' && <Icon name="x-circle" size={18} />}
            {t.type === 'info' && <Icon name="info" size={18} />}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
