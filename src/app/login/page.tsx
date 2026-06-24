/* eslint-disable react/no-unescaped-entities */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser, register } from '@/lib/firebase/auth';
import { toast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loginForm, setLoginForm] = useState({ login: '', pass: '' });
  const [regForm, setRegForm] = useState({ name: '', login: '', pass: '', pass2: '', terms: false });
  
  const [loginError, setLoginError] = useState('');
  const [regError, setRegError] = useState('');

  if (user) {
    router.push('/home');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.login || !loginForm.pass) {
      setLoginError('Заповніть всі поля');
      return;
    }
    setLoading(true);
    try {
      await loginUser(loginForm.login, loginForm.pass);
      toast('Ласкаво просимо! ✦', 'success');
      router.push('/home');
    } catch (e: any) {
      setLoading(false);
      let msg = 'Помилка входу';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = 'Невірний логін або пароль';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Забагато спроб. Спробуйте пізніше';
      } else if (e.message) {
        msg = e.message;
      }
      setLoginError(msg);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.name || !regForm.login || !regForm.pass || !regForm.pass2) {
      setRegError('Заповніть всі поля');
      return;
    }
    if (!regForm.terms) {
      setRegError('Прийміть умови користування');
      return;
    }
    if (regForm.pass !== regForm.pass2) {
      setRegError('Паролі не співпадають');
      return;
    }
    setLoading(true);
    try {
      const profile = await register(regForm.name, regForm.login, regForm.pass);
      toast(`Ласкаво просимо, ${profile.name}! ✦`, 'success');
      router.push('/home');
    } catch (e: any) {
      setLoading(false);
      let msg = 'Помилка реєстрації';
      if (e.code === 'auth/email-already-in-use') {
        msg = 'Цей логін вже зайнятий';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Пароль занадто простий. Мінімум 6 символів';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Забагато спроб. Спробуйте пізніше';
      } else if (e.message) {
        msg = e.message;
      }
      setRegError(msg);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-logo">✦</div>
          <div className="auth-brand-name">Запрошення</div>
          <p className="auth-brand-desc">
            Створюйте та надсилайте красиві запрошення на зустрічі.<br />
            Безкоштовно і зручно.
          </p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <Icon name="paper-plane-tilt" size={18} /> Миттєве надсилання
            </div>
            <div className="auth-brand-feature">
              <Icon name="bell" size={18} /> Сповіщення в реальному часі
            </div>
            <div className="auth-brand-feature">
              <Icon name="users" size={18} /> Групові та особисті запрошення
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-header-logo">✦</div>
            <div className="auth-header-title">
              {activeTab === 'login' ? 'З поверненням!' : 'Приєднатись'}
            </div>
            <div className="auth-header-sub">
              {activeTab === 'login'
                ? 'Увійдіть, щоб побачити свої запрошення'
                : 'Створіть безкоштовний акаунт за хвилину'}
            </div>
          </div>

          <div className="auth-tab-bar">
            <button className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setLoginError(''); }}>
              Вхід
            </button>
            <button className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setRegError(''); }}>
              Реєстрація
            </button>
            <div className={`auth-tab-slider ${activeTab === 'register' ? 'right' : ''}`}></div>
          </div>

          <div className="auth-body">
            {activeTab === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="user" size={14} /> Логін
                  </label>
                  <input type="text"
                    placeholder="Ваш логін" autoComplete="username"
                    value={loginForm.login} onChange={e => setLoginForm({...loginForm, login: e.target.value})}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="lock" size={14} /> Пароль
                  </label>
                  <div className="auth-pass-wrap">
                    <input type={showPass ? 'text' : 'password'}
                      placeholder="Ваш пароль" autoComplete="current-password"
                      value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                    />
                    <button className="auth-pass-toggle" type="button" onClick={() => setShowPass(!showPass)}
                      title={showPass ? 'Приховати' : 'Показати'}>
                      <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>

                {loginError && <div className="form-error show">{loginError}</div>}

                <button className="btn btn-dark btn-full auth-submit-btn" type="submit" disabled={loading}>
                  {loading
                    ? <span className="auth-loading-dots"><span></span><span></span><span></span></span>
                    : <>Увійти <Icon name="arrow-right" size={16} /></>}
                </button>

                <div className="auth-divider"><span>або</span></div>

                <div className="auth-footer-link">
                  Ще немає акаунту?
                  <button type="button" onClick={() => setActiveTab('register')} className="auth-link-btn">
                    Зареєструватися
                  </button>
                </div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="identification-card" size={14} /> Ім'я
                  </label>
                  <input type="text"
                    placeholder="Як вас звати?" autoComplete="name" maxLength={15}
                    value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="at" size={14} /> Логін
                  </label>
                  <input type="text"
                    placeholder="Латиниця, цифри, _ (3–10 символів)"
                    autoComplete="username" maxLength={10}
                    value={regForm.login} onChange={e => setRegForm({...regForm, login: e.target.value})}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="lock" size={14} /> Пароль
                  </label>
                  <div className="auth-pass-wrap">
                    <input type={showNewPass ? 'text' : 'password'}
                      placeholder="Мінімум 6 символів" autoComplete="new-password"
                      value={regForm.pass} onChange={e => setRegForm({...regForm, pass: e.target.value})}
                    />
                    <button className="auth-pass-toggle" type="button" onClick={() => setShowNewPass(!showNewPass)}>
                      <Icon name={showNewPass ? 'eye-slash' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-field-label">
                    <Icon name="check-circle" size={14} /> Підтвердити пароль
                  </label>
                  <input type="password"
                    placeholder="Повторіть пароль" autoComplete="new-password"
                    value={regForm.pass2} onChange={e => setRegForm({...regForm, pass2: e.target.value})}
                  />
                </div>

                <label className="auth-terms-check">
                  <input type="checkbox" checked={regForm.terms} onChange={e => setRegForm({...regForm, terms: e.target.checked})}/>
                  <span className="auth-terms-box"></span>
                  <span>Я приймаю <Link href="/terms" target="_blank">умови користування</Link></span>
                </label>

                {regError && <div className="form-error show">{regError}</div>}

                <button className="btn btn-dark btn-full auth-submit-btn" type="submit" disabled={loading}>
                  {loading
                    ? <span className="auth-loading-dots"><span></span><span></span><span></span></span>
                    : <>Створити акаунт <Icon name="arrow-right" size={16} /></>}
                </button>

                <div className="auth-footer-link">
                  Вже маєте акаунт?
                  <button type="button" onClick={() => setActiveTab('login')} className="auth-link-btn">
                    Увійти
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
