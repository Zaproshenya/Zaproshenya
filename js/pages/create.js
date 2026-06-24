/* ═══════════════════════════════════════════════════════
   Page — Create Invitation (Personal + Group) — Premium Redesign
   ═══════════════════════════════════════════════════════ */

(function () {
  let mode = 'personal'; // 'personal' | 'group'
  let isPublic = true;
  let requireAuth = false;
  let selectedFriends = [];
  let friends = [];
  let friendFilter = '';
  let loading = true;
  let done = false;
  let createdInv = null;
  let formState = {};
  let selectedType = '';

  // All event types with emoji — synced with ZAP.utils.TYPES values
  const EVENT_TYPES = [
    { v: 'date',     e: '🌹', l: 'Побачення'  },
    { v: 'walk',     e: '🍃', l: 'Прогулянка' },
    { v: 'birthday', e: '🎂', l: 'День нар.'  },
    { v: 'party',    e: '🥂', l: 'Вечірка'    },
    { v: 'cinema',   e: '🎬', l: 'Кіно'       },
    { v: 'coffee',   e: '☕', l: 'Кава'       },
    { v: 'travel',   e: '✈️', l: 'Подорож'    },
    { v: 'other',    e: '✨', l: 'Інше'       },
  ];

  async function load() {
    loading = true;
    done = false;
    createdInv = null;
    selectedFriends = [];
    mode = 'personal';
    isPublic = true;
    requireAuth = false;
    formState = {};
    friendFilter = '';
    selectedType = EVENT_TYPES[0].v;
    const user = ZAP.auth.getUser();
    if (user) {
      friends = await ZAP.db.getFriends(user.uid);
    }
    loading = false;
    ZAP.pages.create._loaded = true;
  }

  function renderSkeleton() {
    return `
    <div class="create-header">
      <div class="skeleton-line w-1-2" style="margin-bottom:8px;height:28px"></div>
      <div class="skeleton-line w-3-4" style="height:14px"></div>
    </div>
    <div class="mode-tabs" style="margin-bottom:28px">
      <div class="skeleton" style="flex:1;height:44px;border-radius:10px"></div>
      <div class="skeleton" style="flex:1;height:44px;border-radius:10px"></div>
    </div>
    <div class="form-section">
      <div class="form-section-header">
        <div class="skeleton" style="width:28px;height:28px;border-radius:8px"></div>
        <div class="skeleton-line w-1-4" style="height:12px"></div>
      </div>
      <div class="form-section-body">
        <div class="skeleton" style="width:100%;height:44px;border-radius:8px"></div>
        <div class="skeleton" style="width:100%;height:88px;border-radius:8px"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-header">
        <div class="skeleton" style="width:28px;height:28px;border-radius:8px"></div>
        <div class="skeleton-line w-1-4" style="height:12px"></div>
      </div>
      <div class="form-section-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${[1,2,3,4,5,6,7,8].map(() => `<div class="skeleton" style="height:72px;border-radius:12px"></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="skeleton-btn" style="width:100%;margin-top:8px"></div>`;
  }

  function render() {
    if (loading) return renderSkeleton();
    const { esc, icon } = ZAP.utils;
    const today = new Date().toISOString().split('T')[0];

    if (done && createdInv) return renderDone();

    // Sync selectedType from formState
    if (!selectedType) selectedType = formState.type || EVENT_TYPES[0].v;

    return `
    <div class="create-header">
      <h1 class="create-title">Нове запрошення</h1>
      <p class="create-subtitle">Заповніть деталі — посилання буде готове миттєво</p>
    </div>

    <!-- Mode switcher -->
    <div class="mode-tabs">
      <button class="mode-tab ${mode === 'personal' ? 'active' : ''}"
        onclick="ZAP.pages.create.setMode('personal')">
        ${icon('user', 17)} Персональне
      </button>
      <button class="mode-tab ${mode === 'group' ? 'active' : ''}"
        onclick="ZAP.pages.create.setMode('group')">
        ${icon('users', 17)} Групове
      </button>
    </div>

    <div id="cform">

      <!-- Section 1: Recipient / Title -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon(mode === 'personal' ? 'user' : 'users', 14)}</div>
          <div class="form-section-label">${mode === 'personal' ? 'Отримувач' : 'Назва зустрічі'}</div>
        </div>
        <div class="form-section-body">
          ${mode === 'group' ? `
            <div>
              <label class="lbl">Назва зустрічі</label>
              <input id="f-title" placeholder="Наприклад: Вечірка на день народження"
                value="${esc(formState.title || '')}" maxlength="40"
                oninput="ZAP.pages.create.chk()"/>
            </div>
          ` : `
            <div>
              <label class="lbl">Кому</label>
              <input id="f-to" placeholder="Ім'я отримувача"
                value="${esc(formState.to || '')}" maxlength="25"
                oninput="ZAP.pages.create.chk()"/>
            </div>
            ${renderPersonalFriends()}
          `}
        </div>
      </div>

      <!-- Section 2: Message -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon('chat-circle-dots', 14)}</div>
          <div class="form-section-label">Повідомлення</div>
        </div>
        <div class="form-section-body">
          <div>
            <label class="lbl">Ваше повідомлення</label>
            <textarea id="f-msg"
              placeholder="Напишіть своїми словами — що хочете, куди запрошуєте…"
              maxlength="100"
              oninput="ZAP.pages.create.onMsgInput()">${esc(formState.msg || '')}</textarea>
            <div style="text-align:right;font-size:.72rem;color:var(--muted);margin-top:4px">
              <span id="msg-counter">${(formState.msg || '').length}</span>/100
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Event type picker -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon('sparkle', 14)}</div>
          <div class="form-section-label">Тип події</div>
        </div>
        <div class="form-section-body">
          <div class="type-picker">
            ${EVENT_TYPES.map(t => `
              <button class="type-option ${selectedType === t.v ? 'selected' : ''}"
                onclick="ZAP.pages.create.selectType('${t.v}')">
                <span class="type-option-emoji">${t.e}</span>
                <span>${t.l}</span>
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="f-type" value="${selectedType}"/>
        </div>
      </div>

      <!-- Section 4: Date & Time & Place -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon('calendar-blank', 14)}</div>
          <div class="form-section-label">Коли та де</div>
        </div>
        <div class="form-section-body">
          <div class="datetime-row">
            <div>
              <label class="lbl" for="f-date">Дата</label>
              <input type="date" id="f-date" min="${today}"
                value="${formState.date || ''}" oninput="ZAP.pages.create.chk()"/>
            </div>
            <div>
              <label class="lbl" for="f-time">Час</label>
              <input type="time" id="f-time"
                value="${formState.time || ''}" oninput="ZAP.pages.create.chk()"/>
            </div>
          </div>
          <div>
            <label class="lbl">Місце</label>
            <input id="f-place"
              placeholder="Адреса, назва кафе, парк…"
              value="${esc(formState.place || '')}" maxlength="60"
              oninput="ZAP.pages.create.chk()"/>
          </div>
        </div>
      </div>

      <!-- Section 5: Privacy & Group options -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon('shield', 14)}</div>
          <div class="form-section-label">Налаштування доступу</div>
        </div>
        <div class="form-section-body" style="padding-top:4px;padding-bottom:4px">
          ${mode === 'group' ? renderGroupPrivacy() : ''}

          <!-- Auth required toggle -->
          <div class="toggle-row" id="require-auth-row" ${selectedFriends.length > 0 ? 'style="display:none"' : ''}>
            <button class="toggle ${requireAuth ? 'on' : ''}"
              onclick="ZAP.pages.create.toggleRequireAuth(this)"
              role="switch" aria-checked="${requireAuth}"
              aria-label="Обмежити доступ лише для зареєстрованих"></button>
            <div class="toggle-row-text">
              <div class="toggle-row-label">
                ${requireAuth
                  ? `${icon('lock', 13)} Тільки для зареєстрованих`
                  : `${icon('globe-hemisphere-west', 13)} Для всіх`}
              </div>
              <div class="toggle-row-desc">
                ${requireAuth
                  ? 'Отримувач повинен увійти в акаунт'
                  : 'Будь-хто може переглянути запрошення'}
              </div>
            </div>
          </div>

          <!-- Show sender toggle -->
          <div class="toggle-row">
            <button class="toggle ${formState.showSender !== false ? 'on' : ''}"
              onclick="ZAP.pages.create.toggleShowSender(this)"
              role="switch" aria-checked="${formState.showSender !== false}"
              aria-label="Показувати відправника"></button>
            <div class="toggle-row-text">
              <div class="toggle-row-label">
                ${formState.showSender !== false
                  ? `${icon('eye', 13)} Показувати від кого`
                  : `${icon('eye-slash', 13)} Анонімне запрошення`}
              </div>
              <div class="toggle-row-desc">
                ${formState.showSender !== false
                  ? 'Отримувач бачитиме ваше ім\'я'
                  : 'Відправник прихований'}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${mode === 'group' ? renderGroupFriends() : ''}

      <!-- Submit button -->
      <div class="create-submit-wrap">
        <button id="sbtn" class="btn btn-dark btn-full" disabled
          onclick="ZAP.pages.create.submit()"
          style="margin-top:4px;font-size:1rem;padding:15px 24px">
          ${icon('paper-plane-tilt', 18)} Створити запрошення
        </button>
      </div>

    </div>`;
  }

  function renderPersonalFriends() {
    if (friends.length === 0) return '';
    const { esc, avatarHTML, icon } = ZAP.utils;
    const filtered = friendFilter
      ? friends.filter(f =>
          (f.name || '').toLowerCase().includes(friendFilter) ||
          (f.uniqueId || '').toLowerCase().includes(friendFilter))
      : friends;

    return `
    <div style="margin-top:4px">
      <label class="lbl" style="margin-bottom:8px">Або обрати з друзів</label>
      ${friends.length > 4 ? `
        <input type="text" placeholder="Пошук друга..."
          value="${esc(friendFilter)}"
          oninput="ZAP.pages.create.filterFriends(this.value)"
          aria-label="Пошук друга за іменем або ID"
          style="margin-bottom:10px"/>
      ` : ''}
      <div class="friends-grid">
        ${filtered.length === 0 ? `
          <p style="font-size:.85rem;color:var(--muted);font-style:italic">Нікого не знайдено</p>
        ` : filtered.map(f => `
          <button class="friend-chip ${selectedFriends.includes(f.uid) ? 'on' : ''}"
            onclick="ZAP.pages.create.toggleFriend('${f.uid}','personal',this)">
            ${avatarHTML(f, 'sm')}
            <span class="friend-chip-name">${esc(f.name)}</span>
            ${f.uniqueId ? `<span class="friend-chip-id">${esc(f.uniqueId)}</span>` : ''}
          </button>
        `).join('')}
      </div>
    </div>`;
  }

  function renderGroupPrivacy() {
    const { icon } = ZAP.utils;
    return `
    <div class="toggle-row">
      <button class="toggle ${isPublic ? 'on' : ''}"
        onclick="ZAP.pages.create.togglePublic(this)"
        role="switch" aria-checked="${isPublic}"
        aria-label="Публічне або приватне запрошення"></button>
      <div class="toggle-row-text">
        <div class="toggle-row-label">
          ${isPublic
            ? `${icon('globe-hemisphere-west', 13)} Публічне`
            : `${icon('lock', 13)} Приватне`}
        </div>
        <div class="toggle-row-desc">
          ${isPublic
            ? 'Будь-хто може приєднатися за посиланням'
            : 'Тільки для обраних друзів'}
        </div>
      </div>
    </div>`;
  }

  function renderGroupFriends() {
    const { esc, avatarHTML, icon } = ZAP.utils;
    if (friends.length === 0 && !isPublic) {
      return `
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon">${icon('users', 14)}</div>
          <div class="form-section-label">Учасники</div>
        </div>
        <div class="form-section-body">
          <p style="font-size:.88rem;color:var(--muted);font-style:italic">
            У вас ще немає друзів.
            <button class="btn-ghost" onclick="ZAP.router.go('friends')">Додати →</button>
          </p>
        </div>
      </div>`;
    }
    if (isPublic && selectedFriends.length === 0) return '';

    const filtered = friendFilter
      ? friends.filter(f =>
          (f.name || '').toLowerCase().includes(friendFilter) ||
          (f.uniqueId || '').toLowerCase().includes(friendFilter))
      : friends;

    return `
    <div class="form-section" id="group-friends-section">
      <div class="form-section-header">
        <div class="form-section-icon">${icon('users', 14)}</div>
        <div class="form-section-label">Запросити друзів ${selectedFriends.length > 0 ? `<span class="tab-count">${selectedFriends.length}</span>` : ''}</div>
      </div>
      <div class="form-section-body">
        ${friends.length > 4 ? `
          <input type="text" placeholder="Пошук друга..."
            value="${esc(friendFilter)}"
            oninput="ZAP.pages.create.filterFriends(this.value)"
            aria-label="Пошук друга за іменем або ID"/>
        ` : ''}
        <div class="friends-grid" id="group-friends-area">
          ${filtered.length === 0 ? `
            <p style="font-size:.85rem;color:var(--muted);font-style:italic">Нікого не знайдено</p>
          ` : filtered.map(f => `
            <button class="friend-chip ${selectedFriends.includes(f.uid) ? 'on' : ''}"
              onclick="ZAP.pages.create.toggleFriend('${f.uid}','group',this)">
              ${avatarHTML(f, 'sm')}
              <span class="friend-chip-name">${esc(f.name)}</span>
              ${f.uniqueId ? `<span class="friend-chip-id">${esc(f.uniqueId)}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderDone() {
    const { icon } = ZAP.utils;
    const link = createdInv.isGroup
      ? location.origin + '/g/' + createdInv.id
      : ZAP.utils.inviteLink(createdInv.id);

    return `
    <div class="create-done">
      <div class="create-done-icon">${icon('confetti', 36)}</div>
      <h2 class="create-done-title">Готово!</h2>
      <p class="create-done-desc">
        ${createdInv.sentToFriends
          ? 'Запрошення надіслано друзям! Вони отримають сповіщення.'
          : 'Скопіюйте та поділіться цим посиланням:'}
      </p>

      ${!createdInv.sentToFriends ? `
        <div class="create-link-box">
          <div class="create-link-url" id="done-link-text">${ZAP.utils.esc(link)}</div>
          <button id="done-copy-btn"
            onclick="ZAP.utils.copyText('${link.replace(/'/g,"\\'")}', this)"
            class="btn btn-dark btn-full" style="font-size:.95rem">
            ${icon('link', 15)} Скопіювати посилання
          </button>
        </div>
      ` : ''}

      <p class="create-done-note">
        ${icon('arrows-clockwise', 14)}
        Коли людина відповість — статус оновиться автоматично
      </p>

      <div class="create-done-actions" style="margin-top:20px">
        <button onclick="ZAP.pages.create.reset()"
          class="btn btn-outline" style="padding:10px 24px">
          ${icon('plus', 14)} Ще одне
        </button>
        <button onclick="ZAP.router.go('home')"
          class="btn btn-dark" style="padding:10px 24px">
          ${icon('house', 14)} До списку
        </button>
      </div>

      <div style="margin-top:32px;padding:20px;border-radius:16px;background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.2);text-align:center">
        <div style="font-size:24px;margin-bottom:8px">☕</div>
        <div style="font-weight:600;margin-bottom:4px;color:var(--ink)">Запрошення готове!</div>
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:16px;line-height:1.5">
          Якщо вам подобається Запрошення ✦, ви можете підтримати розвиток проєкту.
        </div>
        <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" class="btn btn-dark btn-full" style="background:var(--gold);color:#000;border:none">
          Підтримати (Monobank)
        </a>
      </div>
    </div>`;
  }

  function saveFormState() {
    formState.title = document.getElementById('f-title')?.value || '';
    formState.to = document.getElementById('f-to')?.value || '';
    formState.msg = document.getElementById('f-msg')?.value || '';
    formState.type = document.getElementById('f-type')?.value || selectedType;
    formState.date = document.getElementById('f-date')?.value || '';
    formState.time = document.getElementById('f-time')?.value || '';
    formState.place = document.getElementById('f-place')?.value || '';
  }

  function selectType(v) {
    saveFormState();
    selectedType = v;
    formState.type = v;
    // Update hidden input
    const inp = document.getElementById('f-type');
    if (inp) inp.value = v;
    // Update UI
    document.querySelectorAll('.type-option').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('onclick')?.includes(`'${v}'`));
    });
    chk();
  }

  function setMode(m) {
    saveFormState();
    mode = m;
    selectedFriends = [];
    ZAP.render();
  }

  function togglePublic(btn) {
    saveFormState();
    isPublic = !isPublic;
    if (isPublic) selectedFriends = [];

    btn.classList.toggle('on');
    btn.setAttribute('aria-checked', isPublic);
    const row = btn.closest('.toggle-row');
    if (row) {
      const label = row.querySelector('.toggle-row-label');
      const desc = row.querySelector('.toggle-row-desc');
      if (label) label.innerHTML = isPublic
        ? `${ZAP.utils.icon('globe-hemisphere-west', 13)} Публічне`
        : `${ZAP.utils.icon('lock', 13)} Приватне`;
      if (desc) desc.textContent = isPublic
        ? 'Будь-хто може приєднатися за посиланням'
        : 'Тільки для обраних друзів';
    }

    // Show/hide group friends section
    const section = document.getElementById('group-friends-section');
    if (section) {
      section.style.display = (isPublic && selectedFriends.length === 0) ? 'none' : '';
    } else if (!isPublic) {
      ZAP.render();
    }

    chk();
  }

  function toggleFriend(uid, ctx, el) {
    saveFormState();
    if (ctx === 'personal') {
      const wasSelected = selectedFriends.includes(uid);
      selectedFriends = wasSelected ? [] : [uid];
      document.querySelectorAll('#cform .friend-chip.on').forEach(b => b.classList.remove('on'));
      const toInput = document.getElementById('f-to');
      if (!wasSelected) {
        el.classList.add('on');
        const friend = friends.find(f => f.uid === uid);
        if (friend && toInput) {
          toInput.value = friend.name;
          toInput.readOnly = true;
          toInput.style.opacity = '0.7';
          formState.to = friend.name;
        }
      } else {
        if (toInput) {
          toInput.value = '';
          toInput.readOnly = false;
          toInput.style.opacity = '';
          formState.to = '';
        }
      }
      updateRequireAuthVisibility();
    } else {
      if (selectedFriends.includes(uid)) {
        selectedFriends = selectedFriends.filter(f => f !== uid);
        el.classList.remove('on');
      } else {
        selectedFriends.push(uid);
        isPublic = false;
        el.classList.add('on');
      }
      updateToggleState();
      updateRequireAuthVisibility();

      // Update section label count
      const sectionLabel = document.querySelector('#group-friends-section .form-section-label');
      if (sectionLabel) {
        sectionLabel.innerHTML = `Запросити друзів ${selectedFriends.length > 0 ? `<span class="tab-count">${selectedFriends.length}</span>` : ''}`;
      }

      const gf = document.getElementById('group-friends-section');
      if (gf) gf.style.display = '';
    }
    chk();
  }

  function updateToggleState() {
    // Find the public toggle row in group mode
    const toggleRows = document.querySelectorAll('.toggle-row');
    if (!toggleRows.length) return;
    const btn = toggleRows[0]?.querySelector('.toggle');
    const label = toggleRows[0]?.querySelector('.toggle-row-label');
    const desc = toggleRows[0]?.querySelector('.toggle-row-desc');
    if (btn) {
      btn.classList.toggle('on', isPublic);
      btn.setAttribute('aria-checked', isPublic);
    }
    if (label) label.innerHTML = isPublic
      ? `${ZAP.utils.icon('globe-hemisphere-west', 13)} Публічне`
      : `${ZAP.utils.icon('lock', 13)} Приватне`;
    if (desc) desc.textContent = isPublic
      ? 'Будь-хто може приєднатися за посиланням'
      : 'Тільки для обраних друзів';
  }

  function updateRequireAuthVisibility() {
    const row = document.getElementById('require-auth-row');
    if (!row) return;
    const hasFriends = selectedFriends.length > 0;
    row.style.display = hasFriends ? 'none' : '';
    if (hasFriends && requireAuth) {
      requireAuth = false;
      const btn = row.querySelector('.toggle');
      if (btn) {
        btn.classList.remove('on');
        btn.setAttribute('aria-checked', 'false');
      }
      const label = row.querySelector('.toggle-row-label');
      const desc = row.querySelector('.toggle-row-desc');
      if (label) label.innerHTML = `${ZAP.utils.icon('globe-hemisphere-west', 13)} Для всіх`;
      if (desc) desc.textContent = 'Будь-хто може переглянути запрошення';
    }
  }

  function chk() {
    const btn = document.getElementById('sbtn');
    if (!btn) return;
    if (mode === 'personal') {
      btn.disabled = !(
        document.getElementById('f-to')?.value.trim() &&
        document.getElementById('f-date')?.value &&
        document.getElementById('f-time')?.value
      );
    } else {
      btn.disabled = !(
        document.getElementById('f-date')?.value &&
        document.getElementById('f-time')?.value
      );
    }
  }

  async function submit() {
    const profile = ZAP.auth.getProfile();
    const user = ZAP.auth.getUser();
    if (!profile || !user) return;

    const type = document.getElementById('f-type')?.value || selectedType;
    const date = document.getElementById('f-date').value;
    const time = document.getElementById('f-time').value;
    const place = document.getElementById('f-place')?.value.trim() || '';
    const msg = document.getElementById('f-msg')?.value.trim() || '';

    if (mode === 'personal') {
      const to = document.getElementById('f-to').value.trim();
      const inv = {
        id: ZAP.utils.genId(),
        to, type, date, time, place, msg,
        from: profile.name,
        creatorUid: user.uid,
        requireAuth,
        showSender: formState.showSender !== false,
        senderName: profile.name,
        status: 'pending',
        created: Date.now(),
      };

      if (selectedFriends.length > 0) {
        for (const fUid of selectedFriends) {
          const friendInv = { ...inv, id: ZAP.utils.genId(), to: to || 'Друг', recipientUid: fUid };
          await ZAP.db.sendInviteToFriend(friendInv, fUid);
        }
        inv.sentToFriends = true;
        createdInv = inv;
      } else {
        inv.recipientUid = null;
        await ZAP.db.createInvite(inv);
        createdInv = inv;
      }

      createdInv = inv;
    } else {
      const title = document.getElementById('f-title')?.value.trim() || '';
      const inv = {
        id: ZAP.utils.genId(),
        title, type, date, time, place, msg,
        creatorUid: user.uid,
        creatorName: profile.name,
        isPublic,
        requireAuth,
        showSender: formState.showSender !== false,
        senderName: profile.name,
        isGroup: true,
        members: {},
        invited: {},
        status: 'pending',
        created: Date.now(),
      };

      await ZAP.db.createGroupInvite(inv);

      if (!isPublic && selectedFriends.length > 0) {
        await ZAP.db.sendGroupInviteToFriends(inv.id, selectedFriends, inv);
        inv.sentToFriends = true;
      }

      createdInv = inv;
    }

    done = true;
    ZAP.render();
  }

  function reset() {
    done = false;
    createdInv = null;
    selectedFriends = [];
    requireAuth = false;
    selectedType = EVENT_TYPES[0].v;
    formState = {};
    ZAP.render();
  }

  function toggleRequireAuth(btn) {
    saveFormState();
    requireAuth = !requireAuth;

    btn.classList.toggle('on');
    btn.setAttribute('aria-checked', requireAuth);
    const row = btn.closest('.toggle-row');
    if (row) {
      const label = row.querySelector('.toggle-row-label');
      const desc = row.querySelector('.toggle-row-desc');
      if (label) label.innerHTML = requireAuth
        ? `${ZAP.utils.icon('lock', 13)} Тільки для зареєстрованих`
        : `${ZAP.utils.icon('globe-hemisphere-west', 13)} Для всіх`;
      if (desc) desc.textContent = requireAuth
        ? 'Отримувач повинен увійти в акаунт'
        : 'Будь-хто може переглянути запрошення';
    }

    chk();
  }

  function toggleShowSender(btn) {
    saveFormState();
    formState.showSender = formState.showSender === false ? true : false;

    btn.classList.toggle('on');
    btn.setAttribute('aria-checked', formState.showSender !== false);
    const row = btn.closest('.toggle-row');
    if (row) {
      const label = row.querySelector('.toggle-row-label');
      const desc = row.querySelector('.toggle-row-desc');
      if (label) label.innerHTML = formState.showSender !== false
        ? `${ZAP.utils.icon('eye', 13)} Показувати від кого`
        : `${ZAP.utils.icon('eye-slash', 13)} Анонімне запрошення`;
      if (desc) desc.textContent = formState.showSender !== false
        ? 'Отримувач бачитиме ваше ім\'я'
        : 'Відправник прихований';
    }

    chk();
  }

  function filterFriends(query) {
    friendFilter = query.toLowerCase().trim();
    ZAP.render();
  }

  function onMsgInput() {
    const ta = document.getElementById('f-msg');
    const counter = document.getElementById('msg-counter');
    if (ta && counter) counter.textContent = ta.value.length;
    chk();
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.create = {
    _loaded: false,
    render, load, setMode, togglePublic, toggleFriend, chk, submit, reset,
    toggleRequireAuth, toggleShowSender, saveFormState, filterFriends, onMsgInput,
    selectType,
  };
})();
