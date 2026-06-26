/* eslint-disable react/no-unescaped-entities */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser, register, sendPasswordReset, sendVerification, signInWithSocial } from '@/lib/firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { ref, get } from 'firebase/database';
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
  const [regForm, setRegForm] = useState({ name: '', login: '', pass: '', pass2: '', email: '', terms: false });
  
  const [loginError, setLoginError] = useState('');
  const [regError, setRegError] = useState('');

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  useEffect(() => {
    if (!showVerifyModal) return;
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          const { updateProfileData } = await import('@/lib/firebase/auth');
          await updateProfileData(auth.currentUser.uid, { twoFactorEnabled: true });
          toast('Пошту успішно підтверджено! 2FA активовано. ✦', 'success');
          setShowVerifyModal(false);
          router.push('/home');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [showVerifyModal, router]);

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
      const profile = await register(regForm.name, regForm.login, regForm.pass, regForm.email || undefined);
      if (regForm.email && auth.currentUser) {
        await sendVerification(auth.currentUser);
        setVerifyEmail(regForm.email);
        setShowVerifyModal(true);
      } else {
        toast(`Ласкаво просимо, ${profile.name}! ✦`, 'success');
        router.push('/home');
      }
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

  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    try {
      await signInWithSocial(provider);
      toast('Ласкаво просимо! ✦', 'success');
      router.push('/home');
    } catch (e: any) {
      setLoading(false);
      if (e.code === 'auth/popup-closed-by-user') {
        toast('Вхід скасовано', 'info');
      } else {
        toast(e.message || 'Помилка входу через соцмережу', 'error');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast('Введіть логін або email', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      let emailToSend = forgotEmail.trim();
      if (!emailToSend.includes('@')) {
        const cleanLogin = emailToSend.toLowerCase();
        const loginSnap = await get(ref(db, 'logins/' + cleanLogin));
        if (!loginSnap.exists()) {
          throw new Error('Користувача з таким логіном не знайдено');
        }
        const uid = loginSnap.val();
        const userSnap = await get(ref(db, `users/${uid}`));
        if (!userSnap.exists() || !userSnap.val().email) {
          throw new Error('До цього акаунту не прив\'язано електронну пошту');
        }
        emailToSend = userSnap.val().email;
      }

      await sendPasswordReset(emailToSend);
      toast('Посилання для скидання паролю надіслано!', 'success');
      setShowForgot(false);
      setForgotEmail('');
    } catch (e: any) {
      toast(e.message || 'Помилка відправлення запиту', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const checkVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const { updateProfileData } = await import('@/lib/firebase/auth');
        await updateProfileData(auth.currentUser.uid, { twoFactorEnabled: true });
        toast('Пошту успішно підтверджено! 2FA активовано. ✦', 'success');
        setShowVerifyModal(false);
        router.push('/home');
      } else {
        toast('Пошта все ще не підтверджена. Будь ласка, перевірте свій лист.', 'info');
      }
    } catch (e: any) {
      toast(e.message || 'Помилка перевірки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendVerification(auth.currentUser);
      toast('Лист для підтвердження надіслано повторно!', 'success');
    } catch (e: any) {
      toast(e.message || 'Помилка відправлення', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelVerification = async () => {
    const { logoutUser } = await import('@/lib/firebase/auth');
    await logoutUser();
    setShowVerifyModal(false);
    setLoading(false);
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
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label className="auth-field-label">
                      <Icon name="lock" size={14} /> Пароль
                    </label>
                    <button type="button" onClick={() => setShowForgot(true)} className="auth-link-btn" style={{fontSize:'.75rem', fontWeight:500, textDecoration:'none', color:'var(--muted)', background:'none', border:'none', cursor:'pointer'}}>
                      Забули пароль?
                    </button>
                  </div>
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

                <button type="button" onClick={() => handleSocialLogin('google')} className="btn btn-outline btn-full" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'12px', border:'1.5px solid var(--border)', borderRadius:'var(--radius-input)', fontSize:'0.9rem', fontWeight:600, width:'100%', marginTop:'6px'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.97 3.08C6.39 7.37 9 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.75 2.91c2.18-2 3.68-4.96 3.68-8.64z"/><path fill="#FBBC05" d="M5.47 10.58c-.24-.71-.37-1.46-.37-2.24s.13-1.53.37-2.24L1.5 3.02C.54 4.95 0 7.12 0 9.4s.54 4.45 1.5 6.38l3.97-3.2z"/><path fill="#34A853" d="M12 18.96c-3 0-5.61-2.33-6.53-5.54L1.5 16.5c1.89 3.85 5.85 6.5 10.5 6.5 2.99 0 5.67-1 7.67-2.73l-3.75-2.91c-1.09.73-2.48 1.6-3.92 1.6z"/></svg>
                  Продовжити з Google
                </button>

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
                    <Icon name="envelope-simple" size={14} /> Електронна пошта (необов'язково)
                  </label>
                  <input type="email"
                    placeholder="example@domain.com (для 2FA / відновлення)" autoComplete="email"
                    value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})}
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

                <div className="auth-divider"><span>або</span></div>

                <button type="button" onClick={() => handleSocialLogin('google')} className="btn btn-outline btn-full" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'12px', border:'1.5px solid var(--border)', borderRadius:'var(--radius-input)', fontSize:'0.9rem', fontWeight:600, width:'100%', marginTop:'6px'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.97 3.08C6.39 7.37 9 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.75 2.91c2.18-2 3.68-4.96 3.68-8.64z"/><path fill="#FBBC05" d="M5.47 10.58c-.24-.71-.37-1.46-.37-2.24s.13-1.53.37-2.24L1.5 3.02C.54 4.95 0 7.12 0 9.4s.54 4.45 1.5 6.38l3.97-3.2z"/><path fill="#34A853" d="M12 18.96c-3 0-5.61-2.33-6.53-5.54L1.5 16.5c1.89 3.85 5.85 6.5 10.5 6.5 2.99 0 5.67-1 7.67-2.73l-3.75-2.91c-1.09.73-2.48 1.6-3.92 1.6z"/></svg>
                  Продовжити з Google
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

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
          <div onClick={() => setShowForgot(false)} style={{position:'absolute', inset:0, background:'rgba(24,18,10,0.5)', backdropFilter:'blur(4px)'}}></div>
          <div className="auth-card" style={{position:'relative', zIndex:1010, maxWidth:'400px', width:'100%', padding:'24px', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', animation:'pop 0.3s var(--ease) both'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.4rem'}}>Відновлення паролю</h3>
              <button onClick={() => setShowForgot(false)} style={{background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:4}}><Icon name="x" size={20}/></button>
            </div>
            <form onSubmit={handleForgotPassword} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <p style={{fontSize:'.88rem', color:'var(--muted)', lineHeight:1.5}}>
                Введіть ваш логін або електронну пошту. Ми надішлемо вам посилання для скидання паролю.
              </p>
              <div className="auth-field">
                <label className="auth-field-label"><Icon name="user" size={14}/> Логін або Email</label>
                <input type="text" placeholder="Ваш логін або email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required/>
              </div>
              <button className="btn btn-dark btn-full" type="submit" disabled={forgotLoading} style={{padding:'12px'}}>
                {forgotLoading ? 'Надсилання...' : 'Надіслати посилання'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Verification Blocking Modal */}
      {showVerifyModal && (
        <div style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
          <div style={{position:'absolute', inset:0, background:'rgba(24,18,10,0.6)', backdropFilter:'blur(6px)'}}></div>
          <div className="auth-card" style={{position:'relative', zIndex:1010, maxWidth:'420px', width:'100%', padding:'32px 28px', border:'1px solid var(--border)', borderRadius:'var(--radius-card)', textAlign:'center', animation:'pop 0.3s var(--ease) both'}}>
            <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'rgba(var(--gold-rgb), 0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', margin:'0 auto 20px'}}>
              <Icon name="envelope-simple" size={28}/>
            </div>
            <h3 style={{fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.6rem', marginBottom:'10px'}}>Підтвердження пошти</h3>
            <p style={{fontSize:'.88rem', color:'var(--muted)', lineHeight:1.6, marginBottom:'24px'}}>
              Ми надіслали лист із посиланням на адресу <strong style={{color:'var(--ink)'}}>{verifyEmail}</strong>. 
              Будь ласка, перевірте свою скриньку (також папку "Спам") та перейдіть за посиланням у листі.
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button onClick={checkVerification} className="btn btn-dark btn-full" style={{padding:'12px'}}>
                Я підтвердив(ла)
              </button>
              <button onClick={resendVerificationEmail} className="btn btn-outline btn-full" style={{padding:'12px'}}>
                Надіслати лист ще раз
              </button>
              <button onClick={cancelVerification} className="btn btn-ghost" style={{color:'var(--red)', fontSize:'.85rem', marginTop:'8px'}}>
                Скасувати та вийти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
