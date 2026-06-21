/* ═══════════════════════════════════════════════════════
   Page — Profile & Settings (Premium Redesign)
   ═══════════════════════════════════════════════════════ */

(function () {
  let editing = null; // 'name' | 'login' | 'password' | null
  let saving = false;
  let loading = true;
  let stats = null;

  async function load() {
    loading = true;
    const user = ZAP.auth.getUser();
    if (!user) { loading = false; return; }

    try {
      const invites = await ZAP.db.getUserInvites(user.uid);
      const friends = await ZAP.db.getFriends(user.uid);

      const personalCount = invites.filter(inv => !inv.isGroup).length;
      const groupCount = invites.filter(inv => inv.isGroup).length;

      const acceptedCount = invites.filter(inv => inv.status === 'accepted').length;
      const declinedCount = invites.filter(inv => inv.status === 'declined').length;
      const pendingCount = invites.filter(inv => inv.status === 'pending').length;

      stats = {
        totalInvites: invites.length,
        personalCount,
        groupCount,
        acceptedCount,
        declinedCount,
        pendingCount,
        totalFriends: friends.length
      };
    } catch (e) {
      console.warn('Profile load stats:', e);
    }
    loading = false;
    ZAP.pages.profile._loaded = true;
  }

  function renderSkeleton() {
    return `
    <div class="profile-hero" style="margin-bottom:-28px">
      <div class="profile-hero-inner">
        <div class="skeleton-circle" style="width:100px;height:100px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton-line w-1-2" style="margin-bottom:10px;height:22px"></div>
          <div class="skeleton-line w-1-4" style="height:14px"></div>
        </div>
      </div>
    </div>
    <div class="profile-stats" style="padding-top:36px">
      ${[1,2,3,4].map(() => `
        <div class="skeleton" style="height:80px;border-radius:var(--radius-card)"></div>
      `).join('')}
    </div>
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="skeleton" style="width:32px;height:32px;border-radius:8px"></div>
        <div class="skeleton-line w-1-4" style="height:12px"></div>
      </div>
      <div class="profile-section-content">
        ${[1,2,3].map(() => `
          <div class="profile-field">
            <div>
              <div class="skeleton-line w-1-4" style="margin-bottom:6px;height:10px"></div>
              <div class="skeleton-line w-1-2" style="height:14px"></div>
            </div>
            <div class="skeleton" style="width:80px;height:32px;border-radius:var(--radius-pill)"></div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  function render() {
    const profile = ZAP.auth.getProfile();
    if (loading || !profile) return renderSkeleton();

    const { esc, avatarHTML, roleBadge, icon } = ZAP.utils;

    const memberSince = profile.createdAt
      ? new Date(profile.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })
      : '—';

    return `
    <!-- Profile Hero Banner -->
    <div class="profile-hero">
      <div class="profile-hero-star">✦</div>
      <div class="profile-hero-inner">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar-ring">
            ${avatarHTML(profile, 'xl')}
          </div>
          <label class="profile-avatar-edit" title="Змінити аватар" id="avatar-edit-btn">
            ${icon('camera', 14)}
            <input type="file" accept="image/*" style="display:none"
              onchange="ZAP.pages.profile.uploadAvatar(this.files[0])"/>
          </label>
        </div>
        <div class="profile-hero-info">
          <div class="profile-hero-name">${esc(profile.name)}</div>
          <div class="profile-hero-meta">
            ${roleBadge(profile.role)}
            <span class="profile-id">${esc(profile.uniqueId)}</span>
          </div>
          <div class="profile-hero-login">
            ${icon('user', 11)}
            @${esc(profile.login)}
            <span style="opacity:.4;margin:0 2px">&middot;</span>
            ${icon('calendar', 11)}
            з ${memberSince}
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="profile-stats">
      <div class="profile-stat-card">
        <div class="profile-stat-num">${stats ? stats.totalInvites : '—'}</div>
        <div class="profile-stat-label">Запрошень</div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-num" style="background:linear-gradient(135deg,#4a90d9,#6eb3f0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 2px 6px rgba(74,144,217,.25))">${stats ? stats.totalFriends : '—'}</div>
        <div class="profile-stat-label">Друзів</div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-num" style="background:linear-gradient(135deg,var(--green),#56c68a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 2px 6px rgba(45,122,79,.25))">${stats ? stats.acceptedCount : '—'}</div>
        <div class="profile-stat-label">Прийнято</div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-num" style="background:linear-gradient(135deg,#a08878,#c4b0a0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${stats ? stats.pendingCount : '—'}</div>
        <div class="profile-stat-label">Очікує</div>
      </div>
    </div>

    <!-- Personal Info -->
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon">${icon('user', 16)}</div>
        <div class="profile-section-title">Особисті дані</div>
      </div>
      <div class="profile-section-content">

        <!-- Name -->
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Ім'я</div>
            <div class="profile-field-value">${esc(profile.name)}</div>
          </div>
          <button class="btn-outline btn-sm" onclick="ZAP.pages.profile.startEdit('name')">Змінити</button>
        </div>

        <!-- Login -->
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Логін</div>
            <div class="profile-field-value">@${esc(profile.login)}</div>
          </div>
          <button class="btn-outline btn-sm" onclick="ZAP.pages.profile.startEdit('login')">Змінити</button>
        </div>

        <!-- Unique ID -->
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Унікальний ID</div>
            <div class="profile-field-value" style="font-family:monospace;font-size:.88rem">${esc(profile.uniqueId)}</div>
          </div>
          <button class="btn-outline btn-sm"
            onclick="ZAP.utils.copyText('${esc(profile.uniqueId)}', this)">Копіювати</button>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon">${icon('shield-check', 16)}</div>
        <div class="profile-section-title">Безпека</div>
      </div>
      <div class="profile-section-content">
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Пароль</div>
            <div class="profile-field-value" style="letter-spacing:.15em;font-size:1.1rem">••••••••</div>
          </div>
          <button class="btn-outline btn-sm" onclick="ZAP.pages.profile.startEdit('password')">Змінити</button>
        </div>
      </div>
    </div>

    <!-- Stats Detail -->
    ${stats ? `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon">${icon('chart-bar', 16)}</div>
        <div class="profile-section-title">Статистика</div>
      </div>
      <div class="profile-section-content">
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Дата реєстрації</div>
            <div class="profile-field-value">${ZAP.utils.formatDate(new Date(profile.createdAt).toISOString().split('T')[0])}</div>
          </div>
        </div>
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Типи запрошень</div>
            <div class="profile-field-value" style="display:flex;align-items:center;gap:12px">
              <span style="display:flex;align-items:center;gap:5px">${icon('user', 14)} ${stats.personalCount} <span style="color:var(--muted);font-weight:400">персональних</span></span>
              <span style="color:var(--border)">·</span>
              <span style="display:flex;align-items:center;gap:5px">${icon('users', 14)} ${stats.groupCount} <span style="color:var(--muted);font-weight:400">групових</span></span>
            </div>
          </div>
        </div>
        <div class="profile-field">
          <div>
            <div class="profile-field-label">Відповіді на запрошення</div>
            <div class="profile-field-value" style="display:flex;gap:8px;flex-wrap:wrap">
              <span class="badge badge-accepted">${icon('check', 12)} ${stats.acceptedCount} прийнято</span>
              <span class="badge badge-declined">${icon('x', 12)} ${stats.declinedCount} відхилено</span>
              <span class="badge badge-pending">${icon('clock', 12)} ${stats.pendingCount} очікує</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Danger Zone -->
    <div class="profile-danger">
      <div class="profile-danger-header">
        <div class="profile-danger-icon">${icon('warning', 16)}</div>
        <div class="profile-danger-title">Небезпечна зона</div>
      </div>
      <div class="profile-danger-body">
        <p style="font-size:.88rem;color:var(--muted);margin-bottom:16px;line-height:1.6">
          Видалення акаунту є незворотнім. Усі ваші дані, запрошення та список друзів будуть безповоротно видалені.
        </p>
        <button class="btn btn-red btn-sm" onclick="ZAP.pages.profile.confirmDelete()">
          ${icon('trash', 14)} Видалити акаунт
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="profile-logout">
      <button class="btn-ghost" onclick="ZAP.pages.profile.doLogout()" style="color:var(--red);font-size:.9rem;display:flex;align-items:center;gap:6px">
        ${icon('sign-out', 16)} Вийти з акаунту
      </button>
    </div>`;
  }

  function startEdit(field) {
    const { icon } = ZAP.utils;
    editing = field;
    saving = false;

    // Remove existing if any
    document.getElementById('edit-profile-modal')?.remove();

    const profile = ZAP.auth.getProfile();
    let title, body;

    if (field === 'name') {
      title = 'Змінити ім\'я';
      body = `
        <div class="form-group">
          <label class="lbl">Нове ім'я</label>
          <input id="edit-name" value="${ZAP.utils.esc(profile.name)}" placeholder="Ваше ім'я" maxlength="15"/>
        </div>
        <div class="form-error" id="edit-error"></div>
        <button class="btn btn-dark btn-full" id="btn-save-profile" onclick="ZAP.pages.profile.saveName()">
          Зберегти
        </button>`;
    } else if (field === 'login') {
      title = 'Змінити логін';
      body = `
        <div class="form-group">
          <label class="lbl">Новий логін</label>
          <input id="edit-login" value="${ZAP.utils.esc(profile.login)}" placeholder="Логін (латиниця, цифри, _)" maxlength="10"/>
        </div>
        <p style="font-size:.8rem;color:var(--muted);margin-bottom:12px">
          ${icon('warning', 14)} Після зміни логіну потрібно буде входити з новим логіном
        </p>
        <div class="form-error" id="edit-error"></div>
        <button class="btn btn-dark btn-full" id="btn-save-profile" onclick="ZAP.pages.profile.saveLogin()">
          Зберегти
        </button>`;
    } else if (field === 'password') {
      title = 'Змінити пароль';
      body = `
        <div class="form-group">
          <label class="lbl">Поточний пароль</label>
          <input id="edit-old-pass" type="password" placeholder="Ваш поточний пароль"/>
        </div>
        <div class="form-group">
          <label class="lbl">Новий пароль</label>
          <input id="edit-new-pass" type="password" placeholder="Мінімум 6 символів"/>
        </div>
        <div class="form-group">
          <label class="lbl">Підтвердити новий пароль</label>
          <input id="edit-new-pass2" type="password" placeholder="Повторіть новий пароль"/>
        </div>
        <div class="form-error" id="edit-error"></div>
        <button class="btn btn-dark btn-full" id="btn-save-profile" onclick="ZAP.pages.profile.savePassword()">
          Зберегти
        </button>`;
    }

    const modal = document.createElement('div');
    modal.id = 'edit-profile-modal';
    modal.className = 'overlay';
    modal.onclick = e => { if (e.target === modal) cancelEdit(); };
    modal.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <h3 class="modal-title" style="margin-bottom:0">${title}</h3>
          <button onclick="ZAP.pages.profile.cancelEdit()"
            class="modal-close">×</button>
        </div>
        ${body}
      </div>`;
    document.body.appendChild(modal);
  }

  function cancelEdit() {
    editing = null;
    saving = false;
    document.getElementById('edit-profile-modal')?.remove();
  }

  function setSavingState(isSaving) {
    saving = isSaving;
    const btn = document.getElementById('btn-save-profile');
    if (btn) {
      btn.disabled = isSaving;
      btn.textContent = isSaving ? '...' : 'Зберегти';
    }
  }

  function showEditError(msg) {
    const el = document.getElementById('edit-error');
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }

  async function saveName() {
    const name = document.getElementById('edit-name')?.value.trim();
    if (!name || name.length < 2) { showEditError('Ім\'я має бути не менше 2 символів'); return; }

    setSavingState(true);
    try {
      await ZAP.auth.updateProfile(ZAP.auth.getUser().uid, { name });
      cancelEdit();
      ZAP.utils.toast(`Ім'я змінено`, 'success');
      ZAP.render();
    } catch (e) {
      setSavingState(false);
      let msg = 'Помилка збереження';
      if (e.code === 'auth/too-many-requests') msg = 'Забагато спроб. Спробуйте пізніше';
      else if (e.code === 'auth/network-request-failed') msg = 'Помилка мережі. Перевірте з\'єднання';
      else if (e.message) msg = e.message;
      setTimeout(() => showEditError(msg), 50);
    }
  }

  async function saveLogin() {
    const newLogin = document.getElementById('edit-login')?.value.trim();
    if (!newLogin) { showEditError('Введіть логін'); return; }

    setSavingState(true);
    try {
      await ZAP.auth.changeLogin(newLogin);
      cancelEdit();
      ZAP.utils.toast(`Логін змінено`, 'success');
      ZAP.render();
    } catch (e) {
      setSavingState(false);
      let msg = 'Помилка збереження';
      if (e.code === 'auth/requires-recent-login') msg = 'Для зміни логіну увійдіть знову';
      else if (e.code === 'auth/too-many-requests') msg = 'Забагато спроб. Спробуйте пізніше';
      else if (e.code === 'auth/network-request-failed') msg = 'Помилка мережі. Перевірте з\'єднання';
      else if (e.message) msg = e.message;
      setTimeout(() => showEditError(msg), 50);
    }
  }

  async function savePassword() {
    const oldPass = document.getElementById('edit-old-pass')?.value;
    const newPass = document.getElementById('edit-new-pass')?.value;
    const newPass2 = document.getElementById('edit-new-pass2')?.value;

    if (!oldPass || !newPass) { showEditError('Заповніть всі поля'); return; }
    if (newPass !== newPass2) { showEditError('Паролі не співпадають'); return; }

    setSavingState(true);
    try {
      await ZAP.auth.changePassword(oldPass, newPass);
      cancelEdit();
      ZAP.utils.toast(`Пароль змінено`, 'success');
      ZAP.render();
    } catch (e) {
      setSavingState(false);
      let msg = e.message || 'Помилка';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Невірний поточний пароль';
      else if (e.code === 'auth/too-many-requests') msg = 'Забагато спроб. Спробуйте пізніше';
      else if (e.code === 'auth/network-request-failed') msg = 'Помилка мережі. Перевірте з\'єднання';
      setTimeout(() => showEditError(msg), 50);
    }
  }

  async function uploadAvatar(file) {
    if (!file) return;
    try {
      ZAP.utils.toast('Завантаження аватару...', 'info');
      await ZAP.auth.uploadAvatar(file);
      ZAP.utils.toast(`Аватар оновлено`, 'success');
      ZAP.render();
    } catch (e) {
      let msg = 'Помилка завантаження';
      if (e.code === 'storage/unauthorized') msg = 'Немає доступу для завантаження';
      else if (e.code === 'storage/canceled') msg = 'Завантаження скасовано';
      else if (e.code === 'storage/quota-exceeded') msg = 'Перевищено ліміт сховища';
      else if (e.code === 'storage/network-request-failed') msg = 'Помилка мережі. Перевірте з\'єднання';
      else if (e.message) msg = e.message;
      ZAP.utils.toast(msg, 'error');
    }
  }

  function confirmDelete() {
    const { icon } = ZAP.utils;
    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:56px;height:56px;border-radius:50%;background:var(--red-bg);border:2px solid rgba(192,57,43,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.4rem;color:var(--red)">${icon('trash', 24)}</div>
          <h3 class="modal-title" style="color:var(--red);margin-bottom:0">Видалити акаунт?</h3>
        </div>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:20px;text-align:center;line-height:1.6">
          Ця дія незворотня. Всі ваші дані, запрошення та друзі будуть видалені назавжди.
        </p>
        <div class="form-group">
          <label class="lbl">Введіть пароль для підтвердження</label>
          <input id="delete-pass" type="password" placeholder="Ваш пароль"/>
        </div>
        <div class="form-error" id="delete-error"></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-red btn-full" onclick="ZAP.pages.profile.doDelete()">Так, видалити</button>
          <button class="btn btn-outline btn-full" onclick="this.closest('.overlay').remove()">Скасувати</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  async function doDelete() {
    const pass = document.getElementById('delete-pass')?.value;
    if (!pass) {
      const el = document.getElementById('delete-error');
      if (el) { el.textContent = 'Введіть пароль'; el.classList.add('show'); }
      return;
    }
    try {
      await ZAP.auth.deleteAccount(pass);
      ZAP.utils.toast('Акаунт видалено', 'info');
      ZAP.router.go('login');
    } catch (e) {
      const el = document.getElementById('delete-error');
      let msg = e.message || 'Помилка';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Невірний пароль';
      else if (e.code === 'auth/too-many-requests') msg = 'Забагато спроб. Спробуйте пізніше';
      else if (e.code === 'auth/network-request-failed') msg = 'Помилка мережі. Перевірте з\'єднання';
      if (el) { el.textContent = msg; el.classList.add('show'); }
    }
  }

  async function doLogout() {
    await ZAP.auth.logout();
    ZAP.utils.toast('Ви вийшли з акаунту', 'info');
    ZAP.router.go('login');
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.profile = {
    _loaded: false,
    render, load, startEdit, cancelEdit,
    saveName, saveLogin, savePassword,
    uploadAvatar, confirmDelete, doDelete, doLogout,
  };
})();
