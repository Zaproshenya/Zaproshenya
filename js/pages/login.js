/* ═══════════════════════════════════════════════════════
   Page — Login / Register — Premium Redesign
   ═══════════════════════════════════════════════════════ */

(function () {
  let activeTab = 'login'; // 'login' | 'register'
  let loading = false;
  let showPass = false;
  let showNewPass = false;

  function render() {
    loading = false;
    const { esc, icon } = ZAP.utils;
    return `
    <div class="auth-bg">
      <div class="auth-wrap">

        <!-- Branding side (visible on wide screens) -->
        <div class="auth-brand">
          <div class="auth-brand-logo">✦</div>
          <div class="auth-brand-name">Запрошення</div>
          <p class="auth-brand-desc">
            Створюйте та надсилайте красиві запрошення на зустрічі.<br>
            Безкоштовно і зручно.
          </p>
          <div class="auth-brand-features">
            <div class="auth-brand-feature">
              ${icon('paper-plane-tilt', 18)} Миттєве надсилання
            </div>
            <div class="auth-brand-feature">
              ${icon('bell', 18)} Сповіщення в реальному часі
            </div>
            <div class="auth-brand-feature">
              ${icon('users', 18)} Групові та особисті запрошення
            </div>
          </div>
        </div>

        <!-- Auth card -->
        <div class="auth-card">
          <!-- Header -->
          <div class="auth-header">
            <div class="auth-header-logo">✦</div>
            <div class="auth-header-title">
              ${activeTab === 'login' ? 'З поверненням!' : 'Приєднатись'}
            </div>
            <div class="auth-header-sub">
              ${activeTab === 'login'
                ? 'Увійдіть, щоб побачити свої запрошення'
                : 'Створіть безкоштовний акаунт за хвилину'}
            </div>
          </div>

          <!-- Tab switcher -->
          <div class="auth-tab-bar">
            <button class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}"
              onclick="ZAP.pages.login.setTab('login')">
              Вхід
            </button>
            <button class="auth-tab-btn ${activeTab === 'register' ? 'active' : ''}"
              onclick="ZAP.pages.login.setTab('register')">
              Реєстрація
            </button>
            <div class="auth-tab-slider ${activeTab === 'register' ? 'right' : ''}"></div>
          </div>

          <!-- Body -->
          <div class="auth-body">
            ${activeTab === 'login' ? renderLoginForm() : renderRegisterForm()}
          </div>
        </div>

      </div>
    </div>`;
  }

  function renderLoginForm() {
    const { icon } = ZAP.utils;
    return `
    <div class="auth-form" id="login-form">
      <div class="auth-field">
        <label class="auth-field-label" for="login-login">
          ${icon('user', 14)} Логін
        </label>
        <input id="login-login" type="text"
          placeholder="Ваш логін" autocomplete="username"
          onkeydown="if(event.key==='Enter')document.getElementById('login-pass').focus()"/>
      </div>

      <div class="auth-field">
        <label class="auth-field-label" for="login-pass">
          ${icon('lock', 14)} Пароль
        </label>
        <div class="auth-pass-wrap">
          <input id="login-pass" type="${showPass ? 'text' : 'password'}"
            placeholder="Ваш пароль" autocomplete="current-password"
            onkeydown="if(event.key==='Enter')ZAP.pages.login.doLogin()"/>
          <button class="auth-pass-toggle" type="button"
            onclick="ZAP.pages.login.togglePass()"
            title="${showPass ? 'Приховати' : 'Показати'} пароль">
            ${icon(showPass ? 'eye-slash' : 'eye', 16)}
          </button>
        </div>
      </div>

      <div class="form-error" id="login-error"></div>

      <button class="btn btn-dark btn-full auth-submit-btn" id="login-btn"
        onclick="ZAP.pages.login.doLogin()" ${loading ? 'disabled' : ''}>
        ${loading
          ? `<span class="auth-loading-dots"><span></span><span></span><span></span></span>`
          : `Увійти ${icon('arrow-right', 16)}`}
      </button>

      <div class="auth-divider"><span>або</span></div>

      <div class="auth-footer-link">
        Ще немає акаунту?
        <button onclick="ZAP.pages.login.setTab('register')" class="auth-link-btn">
          Зареєструватися
        </button>
      </div>
    </div>`;
  }

  function renderRegisterForm() {
    const { icon } = ZAP.utils;
    return `
    <div class="auth-form" id="register-form">
      <div class="auth-field">
        <label class="auth-field-label" for="reg-name">
          ${icon('identification-card', 14)} Ім'я
        </label>
        <input id="reg-name" type="text"
          placeholder="Як вас звати?" autocomplete="name" maxlength="15"/>
      </div>

      <div class="auth-field">
        <label class="auth-field-label" for="reg-login">
          ${icon('at', 14)} Логін
        </label>
        <input id="reg-login" type="text"
          placeholder="Латиниця, цифри, _ (3–10 символів)"
          autocomplete="username" maxlength="10"/>
      </div>

      <div class="auth-field">
        <label class="auth-field-label" for="reg-pass">
          ${icon('lock', 14)} Пароль
        </label>
        <div class="auth-pass-wrap">
          <input id="reg-pass" type="${showNewPass ? 'text' : 'password'}"
            placeholder="Мінімум 6 символів" autocomplete="new-password"/>
          <button class="auth-pass-toggle" type="button"
            onclick="ZAP.pages.login.toggleNewPass()"
            title="${showNewPass ? 'Приховати' : 'Показати'} пароль">
            ${icon(showNewPass ? 'eye-slash' : 'eye', 16)}
          </button>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-field-label" for="reg-pass2">
          ${icon('check-circle', 14)} Підтвердити пароль
        </label>
        <input id="reg-pass2" type="password"
          placeholder="Повторіть пароль" autocomplete="new-password"
          onkeydown="if(event.key==='Enter')ZAP.pages.login.doRegister()"/>
      </div>

      <label class="auth-terms-check">
        <input type="checkbox" id="reg-terms"/>
        <span class="auth-terms-box"></span>
        <span>Я приймаю <a href="/terms" target="_blank">умови користування</a></span>
      </label>

      <div class="form-error" id="reg-error"></div>

      <button class="btn btn-dark btn-full auth-submit-btn" id="reg-btn"
        onclick="ZAP.pages.login.doRegister()" ${loading ? 'disabled' : ''}>
        ${loading
          ? `<span class="auth-loading-dots"><span></span><span></span><span></span></span>`
          : `Створити акаунт ${icon('arrow-right', 16)}`}
      </button>

      <div class="auth-footer-link">
        Вже маєте акаунт?
        <button onclick="ZAP.pages.login.setTab('login')" class="auth-link-btn">
          Увійти
        </button>
      </div>
    </div>`;
  }

  function setTab(tab) {
    activeTab = tab;
    loading = false;
    ZAP.render();
  }

  function togglePass() {
    showPass = !showPass;
    const input = document.getElementById('login-pass');
    const btn = document.querySelector('#login-form .auth-pass-toggle');
    if (input) {
      input.type = showPass ? 'text' : 'password';
    }
    if (btn) {
      const { icon } = ZAP.utils;
      btn.innerHTML = icon(showPass ? 'eye-slash' : 'eye', 16);
      btn.title = showPass ? 'Приховати' : 'Показати' + ' пароль';
    }
  }

  function toggleNewPass() {
    showNewPass = !showNewPass;
    const input = document.getElementById('reg-pass');
    const btn = document.querySelector('#register-form .auth-pass-toggle');
    if (input) {
      input.type = showNewPass ? 'text' : 'password';
    }
    if (btn) {
      const { icon } = ZAP.utils;
      btn.innerHTML = icon(showNewPass ? 'eye-slash' : 'eye', 16);
      btn.title = showNewPass ? 'Приховати' : 'Показати' + ' пароль';
    }
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }

  async function doLogin() {
    const loginVal = document.getElementById('login-login')?.value?.trim();
    const passVal = document.getElementById('login-pass')?.value;

    if (!loginVal || !passVal) {
      showError('login-error', 'Заповніть всі поля');
      return;
    }

    loading = true;
    ZAP.render();

    try {
      await ZAP.auth.login(loginVal, passVal);
      ZAP.utils.toast('Ласкаво просимо! ✦', 'success');
      ZAP.router.go('home');
    } catch (e) {
      loading = false;
      ZAP.render();
      setTimeout(() => {
        let msg = 'Помилка входу';
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          msg = 'Невірний логін або пароль';
        } else if (e.code === 'auth/too-many-requests') {
          msg = 'Забагато спроб. Спробуйте пізніше';
        } else if (e.message) {
          msg = e.message;
        }
        showError('login-error', msg);
      }, 50);
    }
  }

  async function doRegister() {
    const name = document.getElementById('reg-name')?.value?.trim();
    const login = document.getElementById('reg-login')?.value?.trim();
    const pass = document.getElementById('reg-pass')?.value;
    const pass2 = document.getElementById('reg-pass2')?.value;

    if (!name || !login || !pass || !pass2) {
      showError('reg-error', 'Заповніть всі поля');
      return;
    }
    if (!document.getElementById('reg-terms')?.checked) {
      showError('reg-error', 'Прийміть умови користування');
      return;
    }
    if (pass !== pass2) {
      showError('reg-error', 'Паролі не співпадають');
      return;
    }

    loading = true;
    ZAP.render();

    try {
      const profile = await ZAP.auth.register(name, login, pass);
      ZAP.utils.toast(`Ласкаво просимо, ${profile.name}! ✦`, 'success');
      ZAP.router.go('home');
    } catch (e) {
      loading = false;
      ZAP.render();
      setTimeout(() => {
        let msg = 'Помилка реєстрації';
        if (e.code === 'auth/email-already-in-use') {
          msg = 'Цей логін вже зайнятий';
        } else if (e.code === 'auth/weak-password') {
          msg = 'Пароль занадто простий. Мінімум 6 символів';
        } else if (e.code === 'auth/too-many-requests') {
          msg = 'Забагато спроб. Спробуйте пізніше';
        } else if (e.code === 'auth/network-request-failed') {
          msg = 'Помилка мережі. Перевірте з\'єднання';
        } else if (e.message) {
          msg = e.message;
        }
        showError('reg-error', msg);
      }, 50);
    }
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.login = { render, setTab, doLogin, doRegister, togglePass, toggleNewPass };
})();
