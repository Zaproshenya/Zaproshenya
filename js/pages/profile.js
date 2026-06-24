/* ═══════════════════════════════════════════════════════
   Page — Profile & Settings (Premium Redesign)
   ═══════════════════════════════════════════════════════ */

(function () {
  let editing = null; // 'name' | 'login' | 'password' | null
  let saving = false;
  let loading = true;
  let stats = null;
  let myTickets = [];
  let _chatTicketId = null;  // currently open chat ticket
  let _chatListener = null; // active Firebase listener off-handle
  let _pendingImage = null; // { file, dataUrl } for attachment
  let _isSupportAdmin = false; // is current user a support admin

  async function load() {
    loading = true;
    stats = null;
    myTickets = [];
    editing = null;
    saving = false;
    const user = ZAP.auth.getUser();
    if (!user) { loading = false; return; }

    _isSupportAdmin = ZAP.auth.isAdmin() || ZAP.auth.isModerator();

    try {
      const [invites, friends, tickets] = await Promise.all([
        ZAP.db.getUserInvites(user.uid),
        ZAP.db.getFriends(user.uid),
        ZAP.db.getUserTickets(user.uid),
      ]);

      const personalCount = invites.filter(inv => !inv.isGroup).length;
      const groupCount = invites.filter(inv => inv.isGroup).length;
      const acceptedCount = invites.filter(inv => inv.status === 'accepted').length;
      const declinedCount = invites.filter(inv => inv.status === 'declined').length;
      const pendingCount = invites.filter(inv => inv.status === 'pending').length;

      stats = {
        totalInvites: invites.length,
        personalCount, groupCount,
        acceptedCount, declinedCount, pendingCount,
        totalFriends: friends.length
      };
      myTickets = tickets;
    } catch (e) {
      console.warn('Profile load stats:', e);
    }
    loading = false;
    ZAP.pages.profile._loaded = true;
  }

  function renderSkeleton() {
    return `
    <div class="profile-hero">
      <div class="profile-hero-inner">
        <div class="skeleton-circle" style="width:100px;height:100px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton-line w-1-2" style="margin-bottom:10px;height:22px"></div>
          <div class="skeleton-line w-1-4" style="height:14px"></div>
        </div>
      </div>
    </div>
    <div class="profile-stats">
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

    const memberSince = profile.createdAt && !isNaN(new Date(profile.createdAt).getTime())
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



    <!-- Support & Ideas -->
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon">${icon('lifebuoy', 16)}</div>
        <div class="profile-section-title">Допомога та підтримка</div>
      </div>
      <div class="support-action-grid">
        <button class="support-action-btn" onclick="ZAP.pages.profile.openNewTicket('bug')">
          <span class="sa-icon">🐛</span>Знайшов баг
        </button>
        <button class="support-action-btn" onclick="ZAP.pages.profile.openNewTicket('idea')">
          <span class="sa-icon">💡</span>Є ідея
        </button>
        <button class="support-action-btn" onclick="ZAP.pages.profile.openNewTicket('question')">
          <span class="sa-icon">❓</span>Питання
        </button>
      </div>
      ${myTickets.length > 0 ? `
        <div class="my-tickets-header">
          <span>Мої звернення</span>
          <span style="font-size:.7rem;font-weight:500">${myTickets.length}</span>
        </div>
        ${myTickets.map(t => {
          const icons = { bug: '🐛', idea: '💡', question: '❓', other: '💬' };
          const statusText = { open: 'Відкрито', resolved: 'Вирішено', dismissed: 'Закрито' };
          const ago = ZAP.utils.timeAgo(t.lastMessageAt || t.createdAt);
          const hasUnread = t.unreadByUser;
          return `
          <div class="ticket-item" onclick="ZAP.pages.profile.openTicketChat('${t.id}')">
            <div class="ticket-item-icon ${t.type || 'other'}">${icons[t.type] || '💬'}</div>
            <div class="ticket-item-body">
              <div class="ticket-item-subject">${ZAP.utils.esc(t.subject || t.type || 'Звернення')}</div>
              <div class="ticket-item-preview">${ZAP.utils.esc((t.lastMessageText || '').slice(0, 50))}</div>
            </div>
            <div class="ticket-item-meta">
              <span class="ticket-status ${t.status || 'open'}">${statusText[t.status] || 'Відкрито'}</span>
              <span style="font-size:.68rem;color:var(--muted)">${ago}</span>
              ${hasUnread ? '<div class="ticket-unread-dot"></div>' : ''}
            </div>
          </div>`;
        }).join('')}
      ` : ''}
    </div>

    <!-- Donation Block -->
    <div class="donation-block">
      <div class="donation-header">
        <div class="donation-header-icon">✦</div>
        <div class="donation-header-title">Підтримати проєкт</div>
      </div>
      <div class="donation-body">
        <div class="donation-text">
          Запрошення ✦ — це безкоштовний незалежний проєкт. Якщо він приносить вам радість — ви можете підтримати його розвиток.
        </div>
        <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" class="donation-btn">
          ${icon('heart', 18)} Підтримати через Monobank
        </a>
      </div>
    </div>

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

  // ─── New Ticket Modal ───────────────────────────────────
  function openNewTicket(defaultType) {
    const { icon } = ZAP.utils;
    let selectedType = defaultType || 'bug';
    const types = [
      { value: 'bug',      icon: '🐛', label: 'Знайшов баг',    desc: 'Помилка у роботі' },
      { value: 'idea',     icon: '💡', label: 'Є ідея',          desc: 'Пропозиція' },
      { value: 'question', icon: '❓', label: 'Питання',          desc: 'Потрібна відповідь' },
      { value: 'other',    icon: '💬', label: 'Інше',             desc: 'Загальне' },
    ];

    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.id = 'new-ticket-modal';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="modal new-ticket-modal" onclick="event.stopPropagation()" style="max-width:480px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h3 class="modal-title" style="margin-bottom:0">Нове звернення</h3>
          <button onclick="document.getElementById('new-ticket-modal').remove()" class="modal-close">×</button>
        </div>
        <div class="ticket-type-grid">
          ${types.map(t => `
            <button class="ticket-type-option${t.value === selectedType ? ' selected' : ''}" 
              onclick="ZAP.pages.profile._selectTicketType('${t.value}')"
              data-type="${t.value}">
              <span class="tt-icon">${t.icon}</span>
              <span>${t.label}</span>
              <span style="font-size:.7rem;color:var(--muted);font-weight:400">${t.desc}</span>
            </button>`).join('')}
        </div>
        <div class="form-group">
          <label class="lbl">Тема</label>
          <input id="ticket-subject" placeholder="Коротко опишіть проблему або ідею..." maxlength="100"/>
        </div>
        <div class="form-group">
          <label class="lbl">Повідомлення</label>
          <textarea id="ticket-first-msg" rows="5" maxlength="300" placeholder="Детально опишіть... (до 300 символів)" 
            style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg, var(--paper));color:var(--ink);resize:vertical;font-family:var(--font-body);font-size:.88rem;line-height:1.5"></textarea>
        </div>
        <div class="form-error" id="ticket-error"></div>
        <button class="btn btn-dark btn-full" id="btn-create-ticket" onclick="ZAP.pages.profile._submitNewTicket()">
          ${icon('paper-plane-tilt', 16)} Надіслати
        </button>
      </div>`;
    document.body.appendChild(modal);
  }

  function _selectTicketType(type) {
    document.querySelectorAll('.ticket-type-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === type);
    });
    // store selected
    document.getElementById('new-ticket-modal')._selectedType = type;
  }

  async function _submitNewTicket() {
    const modal = document.getElementById('new-ticket-modal');
    const type = (modal && modal._selectedType) ||
      (document.querySelector('.ticket-type-option.selected')?.dataset?.type) || 'bug';
    const subject = document.getElementById('ticket-subject')?.value.trim();
    const msg = document.getElementById('ticket-first-msg')?.value.trim();

    const errEl = document.getElementById('ticket-error');
    if (!subject) { if (errEl) { errEl.textContent = 'Введіть тему'; errEl.classList.add('show'); } return; }
    if (!msg) { if (errEl) { errEl.textContent = 'Введіть повідомлення'; errEl.classList.add('show'); } return; }

    const btn = document.getElementById('btn-create-ticket');
    if (btn) { btn.disabled = true; btn.textContent = 'Надсилання...'; }

    try {
      const user = ZAP.auth.getUser();
      const profile = ZAP.auth.getProfile();
      const ticketId = await ZAP.db.createSupportTicket({
        type, subject,
        firstMessage: msg,
        authorUid: user.uid,
        authorName: profile.name,
      });
      modal?.remove();
      ZAP.utils.toast('Звернення створено!', 'success');
      // Reload tickets and open chat
      myTickets = await ZAP.db.getUserTickets(user.uid);
      ZAP.render();
      setTimeout(() => openTicketChat(ticketId), 300);
    } catch (e) {
      console.error('Create ticket error:', e);
      if (errEl) { errEl.textContent = 'Помилка. Спробуйте ще раз'; errEl.classList.add('show'); }
      if (btn) { btn.disabled = false; btn.textContent = 'Надіслати'; }
    }
  }

  // ─── Support Chat ───────────────────────────────────────
  function _typeLabel(type) {
    return { bug: '🐛 Баг / Помилка', idea: '💡 Ідея', question: '❓ Питання', other: '💬 Інше' }[type] || '💬 Звернення';
  }

  function _formatChatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }

  function _formatChatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Сьогодні';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Вчора';
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  }

  function _renderMessages(messages, currentUid) {
    if (!messages || messages.length === 0) {
      return `<div class="chat-empty-state">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">Очікуйте відповіді від команди підтримки</div>
      </div>`;
    }
    let lastDate = null;
    return messages.map(msg => {
      const isUser = msg.uid === currentUid;
      const msgDate = new Date(msg.createdAt).toDateString();
      const dateSep = msgDate !== lastDate 
        ? `<div class="chat-date-separator">${_formatChatDate(msg.createdAt)}</div>` : '';
      lastDate = msgDate;
      const initials = (msg.name || '?').charAt(0).toUpperCase();
      const roleLabel = isUser ? '' : 'Підтримка';
      const imgHtml = msg.imageUrl 
        ? `<img src="${ZAP.utils.esc(msg.imageUrl)}" class="chat-bubble-img" 
             onclick="window.open('${ZAP.utils.esc(msg.imageUrl)}','_blank')" alt="Зображення">` : '';
      const textHtml = msg.text ? `<div class="chat-bubble">${ZAP.utils.esc(msg.text)}</div>` : '';

      return `${dateSep}
        <div class="chat-msg ${isUser ? 'user' : 'support'}">
          <div class="chat-msg-avatar">${initials}</div>
          <div class="chat-msg-content">
            ${textHtml}${imgHtml}
            <div class="chat-msg-time">${roleLabel ? roleLabel + ' · ' : ''}${_formatChatTime(msg.createdAt)}</div>
          </div>
        </div>`;
    }).join('');
  }

  function _scrollChatToBottom() {
    const area = document.getElementById('chat-msgs-area');
    if (area) area.scrollTop = area.scrollHeight;
  }

  async function openTicketChat(ticketId) {
    // Stop any previous listener
    if (_chatTicketId) {
      ZAP.db.stopListeningTicket(_chatTicketId);
    }
    _chatTicketId = ticketId;
    _pendingImage = null;

    const user = ZAP.auth.getUser();
    const profile = ZAP.auth.getProfile();
    const ticket = myTickets.find(t => t.id === ticketId) || await ZAP.db.getTicket(ticketId);
    if (!ticket) return;

    // Mark as read
    if (ticket.unreadByUser) {
      ZAP.db.markTicketReadByUser(ticketId).catch(() => {});
    }

    const { icon } = ZAP.utils;
    const isResolved = ticket.status === 'resolved' || ticket.status === 'dismissed';
    const statusText = { open: 'Відкрито', resolved: 'Вирішено', dismissed: 'Закрито' }[ticket.status] || 'Відкрито';

    // Remove existing
    document.getElementById('support-chat-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'support-chat-overlay';
    overlay.id = 'support-chat-overlay';
    overlay.onclick = e => { if (e.target === overlay) _closeChatModal(); };

    overlay.innerHTML = `
      <div class="support-chat-modal">
        <!-- Header -->
        <div class="chat-modal-header">
          <button class="chat-modal-back" onclick="ZAP.pages.profile._closeChatModal()">
            ${icon('arrow-left', 16)}
          </button>
          <div class="chat-modal-info">
            <div class="chat-modal-title">${_typeLabel(ticket.type)} · ${ZAP.utils.esc(ticket.subject || 'Звернення')}</div>
            <div class="chat-modal-subtitle">${statusText} · ${ZAP.utils.timeAgo(ticket.createdAt)}</div>
          </div>
          <button class="chat-modal-close" onclick="ZAP.pages.profile._closeChatModal()">×</button>
        </div>

        <!-- Messages -->
        <div class="chat-messages-area" id="chat-msgs-area">
          <div class="chat-loading-spinner">${ZAP.utils.spinner()}</div>
        </div>

        <!-- Image preview placeholder -->
        <div id="chat-img-preview-wrap"></div>

        <!-- Resolved banner OR input -->
        <div id="chat-input-container">
          ${isResolved ? `
            <div class="chat-resolved-banner">
              <div class="chat-resolved-text">${icon('check-circle', 16)} Звернення закрито</div>
            </div>
          ` : `
            <div id="chat-uploading-state" style="display:none" class="chat-uploading">
              ${ZAP.utils.spinner()} Завантаження зображення...
            </div>
            <div class="chat-input-area">
              <div class="chat-input-row">
                <button class="chat-attach-btn" onclick="document.getElementById('chat-file-input').click()" title="Прикріпити зображення">
                  ${icon('paperclip', 18)}
                </button>
                <input type="file" id="chat-file-input" accept="image/*" style="display:none"
                  onchange="ZAP.pages.profile._onImageSelected(this.files[0])"/>
                <textarea class="chat-text-input" id="chat-text-input" maxlength="300"
                  placeholder="Написати повідомлення..."
                  rows="1"
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ZAP.pages.profile._sendChatMsg();}"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
                <button class="chat-send-btn" id="chat-send-btn" onclick="ZAP.pages.profile._sendChatMsg()">
                  ${icon('paper-plane-tilt', 18)}
                </button>
              </div>
            </div>
          `}
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Start listening to messages
    ZAP.db.listenTicketMessages(ticketId, (messages) => {
      const area = document.getElementById('chat-msgs-area');
      if (!area) return;
      area.innerHTML = _renderMessages(messages, user.uid);
      _scrollChatToBottom();
    });

    // Start listening to ticket meta for real-time status updates
    ZAP.db.listenTicket(ticketId, (ticketData) => {
      if (!ticketData) return;
      const isRes = ticketData.status !== 'open';
      const container = document.getElementById('chat-input-container');
      if (container && isRes && !container.innerHTML.includes('chat-resolved-banner')) {
        container.innerHTML = `
          <div class="chat-resolved-banner">
            <div class="chat-resolved-text">${ZAP.utils.icon('check-circle', 16)} Звернення закрито</div>
          </div>`;
      }
    });
  }

  function _closeChatModal() {
    if (_chatTicketId) {
      ZAP.db.stopListeningTicket(_chatTicketId);
      ZAP.db.stopListeningTicketMeta(_chatTicketId);
      _chatTicketId = null;
    }
    _pendingImage = null;
    document.getElementById('support-chat-overlay')?.remove();
  }

  function _onImageSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      _pendingImage = { file, dataUrl: e.target.result };
      const wrap = document.getElementById('chat-img-preview-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="chat-img-preview-wrap">
            <div class="chat-img-preview">
              <img src="${e.target.result}" alt="preview">
              <button class="chat-img-preview-remove" onclick="ZAP.pages.profile._removeImage()">×</button>
            </div>
          </div>`;
      }
    };
    reader.readAsDataURL(file);
  }

  function _removeImage() {
    _pendingImage = null;
    const wrap = document.getElementById('chat-img-preview-wrap');
    if (wrap) wrap.innerHTML = '';
    const inp = document.getElementById('chat-file-input');
    if (inp) inp.value = '';
  }

  async function _sendChatMsg() {
    if (!_chatTicketId) return;
    const textEl = document.getElementById('chat-text-input');
    const text = textEl?.value.trim();
    if (!text && !_pendingImage) return;

    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const user = ZAP.auth.getUser();
    const profile = ZAP.auth.getProfile();

    try {
      let imageUrl = null;

      if (_pendingImage) {
        const uploadState = document.getElementById('chat-uploading-state');
        if (uploadState) uploadState.style.display = 'flex';
        imageUrl = await ZAP.db.uploadTicketImage(_chatTicketId, _pendingImage.file);
        if (uploadState) uploadState.style.display = 'none';
        _removeImage();
      }

      await ZAP.db.sendTicketMessage(_chatTicketId, {
        uid: user.uid,
        name: profile.name,
        role: 'user',
        text: text || null,
        imageUrl,
      });

      if (textEl) { textEl.value = ''; textEl.style.height = 'auto'; }
    } catch (e) {
      console.error('Send message error:', e);
      ZAP.utils.toast('Помилка надсилання', 'error');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  // Removed _reopenTicket function

  async function doLogout() {
    await ZAP.auth.logout();
    ZAP.utils.toast('Ви вийшли з акаунту', 'info');
    ZAP.router.go('login');
  }

  // ─── Old simple submit (kept for compat, now unused) ──
  function openSupportModal() { openNewTicket('bug'); }
  function submitSupportTicket() {}

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.profile = {
    _loaded: false,
    render, load, startEdit, cancelEdit,
    saveName, saveLogin, savePassword,
    uploadAvatar, confirmDelete, doDelete, doLogout,
    openSupportModal, submitSupportTicket,
    openNewTicket, _selectTicketType, _submitNewTicket,
    openTicketChat, _closeChatModal,
    _onImageSelected, _removeImage, _sendChatMsg,
  };
})();
