/* ═══════════════════════════════════════════════════════
   Page — Create Invitation (Personal + Group)
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
    const user = ZAP.auth.getUser();
    if (user) {
      friends = await ZAP.db.getFriends(user.uid);
    }
    loading = false;
    ZAP.pages.create._loaded = true;
  }

  function renderSkeleton() {
    return `
    <div class="skeleton-line w-1-2" style="margin-bottom:8px;height:28px"></div>
    <div class="skeleton-line w-3-4" style="margin-bottom:24px;height:14px"></div>
    <div style="display:flex;gap:4px;margin-bottom:28px;background:var(--warm);border-radius:var(--radius-sm);padding:4px">
      <div class="skeleton" style="flex:1;height:40px;border-radius:var(--radius-sm)"></div>
      <div class="skeleton" style="flex:1;height:40px;border-radius:var(--radius-sm)"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:24px">
      <div>
        <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
        <div class="skeleton" style="width:100%;height:44px;border-radius:var(--radius-sm)"></div>
      </div>
      <div>
        <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
        <div class="skeleton" style="width:100%;height:88px;border-radius:var(--radius-sm)"></div>
      </div>
      <div>
        <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
        <div class="skeleton" style="width:100%;height:44px;border-radius:var(--radius-sm)"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
          <div class="skeleton" style="width:100%;height:44px;border-radius:var(--radius-sm)"></div>
        </div>
        <div>
          <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
          <div class="skeleton" style="width:100%;height:44px;border-radius:var(--radius-sm)"></div>
        </div>
      </div>
      <div>
        <div class="skeleton-line w-1-4" style="margin-bottom:8px;height:10px"></div>
        <div class="skeleton" style="width:100%;height:44px;border-radius:var(--radius-sm)"></div>
      </div>
      <div class="skeleton-btn" style="width:100%"></div>
    </div>`;
  }

  function render() {
    if (loading) return renderSkeleton();
    const { esc, TYPES, icon } = ZAP.utils;
    const today = new Date().toISOString().split('T')[0];
    const profile = ZAP.auth.getProfile();

    if (done && createdInv) return renderDone();

    return `
    <h1 class="page-title">Нове запрошення</h1>
    <p class="page-subtitle">Заповніть деталі — посилання буде готове миттєво</p>

    <!-- Mode switcher -->
    <div class="tabs" style="margin-bottom:28px">
      <button class="tab ${mode === 'personal' ? 'active' : ''}"
        onclick="ZAP.pages.create.setMode('personal')">${icon('user', 18)} Персональне</button>
      <button class="tab ${mode === 'group' ? 'active' : ''}"
        onclick="ZAP.pages.create.setMode('group')">${icon('users', 18)} Групове</button>
    </div>

    <div id="cform" style="display:flex;flex-direction:column;gap:24px">

      ${mode === 'group' ? `
        <div>
          <label class="lbl">Назва зустрічі</label>
          <input id="f-title" placeholder="Наприклад: Вечірка на день народження" value="${ZAP.utils.esc(formState.title || '')}" maxlength="20" oninput="ZAP.pages.create.chk()"/>
        </div>
      ` : `
        <div>
          <label class="lbl">Кому</label>
          <input id="f-to" placeholder="Ім'я отримувача" value="${ZAP.utils.esc(formState.to || '')}" maxlength="25" oninput="ZAP.pages.create.chk()"/>
        </div>
      `}

      <div>
        <label class="lbl">Ваше повідомлення</label>
        <textarea id="f-msg" placeholder="Напишіть своїми словами — що хочете, куди запрошуєте…"
          maxlength="100" oninput="ZAP.pages.create.onMsgInput()">${ZAP.utils.esc(formState.msg || '')}</textarea>
        <div style="text-align:right;font-size:.75rem;color:var(--muted);margin-top:4px"><span id="msg-counter">${(formState.msg || '').length}</span>/100</div>
      </div>

      <div>
        <label class="lbl">Тип події</label>
        <select id="f-type" onchange="ZAP.pages.create.chk()" aria-label="Тип події">
          ${TYPES.map(o => `<option value="${o.v}" ${formState.type === o.v ? 'selected' : ''}>${o.e} ${o.l}</option>`).join('')}
        </select>
      </div>

      <div class="grid2">
        <div><label class="lbl" for="f-date">Дата</label><input type="date" id="f-date" min="${today}" value="${formState.date || ''}" oninput="ZAP.pages.create.chk()"/></div>
        <div><label class="lbl" for="f-time">Час</label><input type="time" id="f-time" value="${formState.time || ''}" oninput="ZAP.pages.create.chk()"/></div>
      </div>

      <div>
        <label class="lbl">Місце</label>
        <input id="f-place" placeholder="Адреса, назва кафе, парк…" value="${ZAP.utils.esc(formState.place || '')}" maxlength="30" oninput="ZAP.pages.create.chk()"/>
      </div>

      ${mode === 'group' ? renderGroupOptions() : renderPersonalOptions()}

      <!-- Auth required toggle -->
      <div class="warm-panel">
        <div class="toggle-wrap">
          <button class="toggle ${requireAuth ? 'on' : ''}"
            onclick="ZAP.pages.create.toggleRequireAuth(this)"
            role="switch" aria-checked="${requireAuth}" aria-label="Обмежити доступ лише для зареєстрованих"></button>
          <span class="toggle-label">
            ${requireAuth
              ? `${icon('lock', 14)} Тільки для зареєстрованих — отримувач повинен увійти в акаунт`
              : `${icon('globe-hemisphere-west', 14)} Для всіх — будь-хто може переглянути запрошення`}
          </span>
        </div>
      </div>

      <button id="sbtn" class="btn btn-dark btn-full" disabled onclick="ZAP.pages.create.submit()">
        Створити запрошення →
      </button>
    </div>`;
  }

  function renderPersonalOptions() {
    if (friends.length === 0) return '';
    const filtered = friendFilter
      ? friends.filter(f =>
          (f.name || '').toLowerCase().includes(friendFilter) ||
          (f.uniqueId || '').toLowerCase().includes(friendFilter))
      : friends;
    return `
    <div class="warm-panel">
      <p class="lbl">
        Або надішліть напряму другу
      </p>
      ${friends.length > 3 ? `
        <input type="text" placeholder="Пошук друга..."
          value="${ZAP.utils.esc(friendFilter)}"
          oninput="ZAP.pages.create.filterFriends(this.value)"
          aria-label="Пошук друга за іменем або ID"
          style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;margin-bottom:10px;background:var(--card)"/>
      ` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${filtered.length === 0 ? `
          <p style="font-size:.85rem;color:var(--muted);font-style:italic;width:100%">Нікого не знайдено</p>
        ` : filtered.map(f => `
          <button class="pill ${selectedFriends.includes(f.uid) ? 'on' : ''}"
            onclick="ZAP.pages.create.toggleFriend('${f.uid}','personal',this)">
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
              ${ZAP.utils.avatarHTML(f, 'sm')}
              <span style="font-weight:600;color:var(--ink)">${ZAP.utils.esc(f.name)}</span>
              ${f.uniqueId ? `<span style="font-size:.65rem;color:var(--muted);font-family:monospace">${ZAP.utils.esc(f.uniqueId)}</span>` : ''}
            </div>
          </button>
        `).join('')}
      </div>
    </div>`;
  }

  function renderGroupOptions() {
    const { icon } = ZAP.utils;
    const filtered = friendFilter
      ? friends.filter(f =>
          (f.name || '').toLowerCase().includes(friendFilter) ||
          (f.uniqueId || '').toLowerCase().includes(friendFilter))
      : friends;
    return `
    <!-- Public / Private toggle -->
    <div class="warm-panel">
      ${selectedFriends.length === 0 ? `
        <div class="toggle-wrap" style="margin-bottom:14px">
          <button class="toggle ${isPublic ? 'on' : ''}"
            onclick="ZAP.pages.create.togglePublic(this)"
            role="switch" aria-checked="${isPublic}" aria-label="Публічне або приватне запрошення"></button>
          <span class="toggle-label">
            ${isPublic ? `${icon('globe-hemisphere-west', 14)} Публічне — будь-хто може приєднатися за посиланням` : `${icon('lock', 14)} Приватне — тільки для обраних друзів`}
          </span>
        </div>
      ` : ''}

      <div id="group-friends-section"${isPublic && selectedFriends.length === 0 ? ' style="display:none"' : ''}>
        <p style="font-size:.78rem;color:var(--muted);margin-bottom:10px;font-weight:500;text-transform:uppercase;letter-spacing:.08em">
          Виберіть друзів для запрошення
        </p>
        ${friends.length > 3 ? `
          <input type="text" placeholder="Пошук друга..."
            value="${ZAP.utils.esc(friendFilter)}"
            oninput="ZAP.pages.create.filterFriends(this.value)"
            aria-label="Пошук друга за іменем або ID"
            style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;margin-bottom:10px;background:var(--card)"/>
        ` : ''}
        ${friends.length === 0 ? `
          <p style="font-size:.88rem;color:var(--muted);font-style:italic">
            У вас ще немає друзів. <button class="btn-ghost" onclick="ZAP.router.go('friends')">Додати →</button>
          </p>
        ` : `
          <div id="group-friends-area" style="display:flex;flex-wrap:wrap;gap:8px">
            ${filtered.length === 0 ? `
              <p style="font-size:.85rem;color:var(--muted);font-style:italic;width:100%">Нікого не знайдено</p>
            ` : filtered.map(f => `
              <button class="pill ${selectedFriends.includes(f.uid) ? 'on' : ''}"
                onclick="ZAP.pages.create.toggleFriend('${f.uid}','group',this)">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                  ${ZAP.utils.avatarHTML(f, 'sm')}
                  <span style="font-weight:600;color:var(--ink)">${ZAP.utils.esc(f.name)}</span>
                  ${f.uniqueId ? `<span style="font-size:.65rem;color:var(--muted);font-family:monospace">${ZAP.utils.esc(f.uniqueId)}</span>` : ''}
                </div>
              </button>
            `).join('')}
          </div>
        `}
      </div>
    </div>`;
  }

  function renderDone() {
    const { icon } = ZAP.utils;
    const link = createdInv.isGroup
      ? location.origin + '/g/' + createdInv.id
      : ZAP.utils.inviteLink(createdInv.id);

    return `
    <div style="animation:fadeUp .5s ease">
      <div style="text-align:center;padding:10px 0 24px">
        <div style="font-size:2.8rem;margin-bottom:12px">${icon('confetti', 48)}</div>
        <h2 style="font-family:var(--font-heading);font-weight:400;font-style:italic;font-size:1.9rem;margin-bottom:8px">Готово!</h2>
        <p style="color:var(--muted);margin-bottom:22px">
          ${createdInv.sentToFriends
            ? 'Запрошення надіслано друзям! Вони отримають сповіщення.'
            : 'Скопіюйте та надішліть це посилання:'}
        </p>
      </div>
      ${!createdInv.sentToFriends ? `
        <div class="link-box" style="margin-bottom:14px">
          <div class="link-text" id="done-link-text">${ZAP.utils.esc(link)}</div>
          <button id="done-copy-btn"
            onclick="ZAP.utils.copyText('${link.replace(/'/g,"\\'")}', this)"
            style="background:var(--ink);color:var(--paper);border:none;border-radius:10px;padding:11px;font-size:.9rem;width:100%">
            ${icon('link', 14)} Скопіювати посилання
          </button>
        </div>
      ` : ''}
      <p style="font-size:.82rem;color:var(--muted);text-align:center;margin-bottom:20px;font-style:italic">
        Коли людина відповість — статус оновиться автоматично ${icon('arrows-clockwise', 14)}
      </p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button onclick="ZAP.pages.create.reset()" class="btn-ghost">Ще одне</button>
        <span style="color:var(--border)">·</span>
        <button onclick="ZAP.router.go('home')" class="btn-ghost">← До списку</button>
      </div>
    </div>`;
  }

  function saveFormState() {
    formState.title = document.getElementById('f-title')?.value || '';
    formState.to = document.getElementById('f-to')?.value || '';
    formState.msg = document.getElementById('f-msg')?.value || '';
    formState.type = document.getElementById('f-type')?.value || '';
    formState.date = document.getElementById('f-date')?.value || '';
    formState.time = document.getElementById('f-time')?.value || '';
    formState.place = document.getElementById('f-place')?.value || '';
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
    const label = btn.parentElement.querySelector('.toggle-label');
    if (label) {
      label.innerHTML = isPublic
        ? `${ZAP.utils.icon('globe-hemisphere-west', 14)} Публічне — будь-хто може приєднатися за посиланням`
        : `${ZAP.utils.icon('lock', 14)} Приватне — тільки для обраних друзів`;
    }

    const section = document.getElementById('group-friends-section');
    if (section) section.style.display = isPublic ? 'none' : '';

    chk();
  }

  function toggleFriend(uid, ctx, el) {
    saveFormState();
    if (ctx === 'personal') {
      const wasSelected = selectedFriends.includes(uid);
      selectedFriends = wasSelected ? [] : [uid];
      document.querySelectorAll('#cform .pill.on').forEach(b => b.classList.remove('on'));
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
    } else {
      if (selectedFriends.includes(uid)) {
        selectedFriends = selectedFriends.filter(f => f !== uid);
        el.classList.remove('on');
      } else {
        selectedFriends.push(uid);
        isPublic = false;
        el.classList.add('on');
      }
      const tw = document.querySelector('.warm-panel > .toggle-wrap');
      if (tw) tw.style.display = selectedFriends.length > 0 ? 'none' : '';
      const gf = document.getElementById('group-friends-section');
      if (gf) gf.style.display = '';
    }
    chk();
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

    const type = document.getElementById('f-type').value;
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
        status: 'pending',
        created: Date.now(),
      };

      // If sending to friends directly
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
      // Group invite
      const title = document.getElementById('f-title')?.value.trim() || '';
      const inv = {
        id: ZAP.utils.genId(),
        title, type, date, time, place, msg,
        creatorUid: user.uid,
        creatorName: profile.name,
        isPublic,
        requireAuth,
        isGroup: true,
        members: {},
        invited: {},
        status: 'pending',
        created: Date.now(),
      };

      await ZAP.db.createGroupInvite(inv);

      // Send to selected friends if private
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
    formState = {};
    ZAP.render();
  }

  function toggleRequireAuth(btn) {
    saveFormState();
    requireAuth = !requireAuth;

    btn.classList.toggle('on');
    btn.setAttribute('aria-checked', requireAuth);
    const label = btn.parentElement.querySelector('.toggle-label');
    if (label) {
      label.innerHTML = requireAuth
        ? `${ZAP.utils.icon('lock', 14)} Тільки для зареєстрованих — отримувач повинен увійти в акаунт`
        : `${ZAP.utils.icon('globe-hemisphere-west', 14)} Для всіх — будь-хто може переглянути запрошення`;
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
    toggleRequireAuth, saveFormState, filterFriends, onMsgInput,
  };
})();
