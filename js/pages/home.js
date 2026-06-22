/* ═══════════════════════════════════════════════════════
   Page — Home (My Invitations) — Premium Redesign
   ═══════════════════════════════════════════════════════ */

(function () {
  let filter = 'all';
  let invites = [];
  let modalInv = null;
  let loading = true;
  let loaded = false;
  let activeTab = 'outgoing';
  let incomingInvites = [];

  async function load() {
    loading = true;
    invites = [];
    incomingInvites = [];
    modalInv = null;
    const user = ZAP.auth.getUser();
    if (!user) { loading = false; loaded = false; return; }
    invites = await ZAP.db.getUserInvites(user.uid);

    // Sync statuses from Firebase
    const statusSnap = await ZAP.dbRef.ref('statuses').get();
    const statuses = statusSnap.exists() ? statusSnap.val() : {};
    invites.forEach(inv => {
      if (statuses[inv.id] && statuses[inv.id] !== inv.status) {
        inv.status = statuses[inv.id];
        ZAP.db.updateInviteStatus(inv.id, statuses[inv.id], ZAP.auth.getUser().uid);
      }
    });

    // Load incoming invitations from notifications
    const notifs = await ZAP.notifications.getNotifications(user.uid);
    incomingInvites = notifs.filter(n =>
      (n.type === 'invite' || n.type === 'group-invite') && n.inviteId && !n.read
    );

    // Cross-reference with actual statuses — skip already-answered invites
    incomingInvites = incomingInvites.filter(n => {
      const s = statuses[n.inviteId];
      return !s || !['accepted', 'declined', 'reschedule'].includes(s);
    });

    loading = false;
    loaded = true;
    ZAP.pages.home._loaded = true;
  }

  function render() {
    if (loading) return renderSkeleton();
    const { esc, badge, TYPE_MAP, inviteLink, copyText, icon } = ZAP.utils;
    const incomingCount = incomingInvites.length;

    // Stats for outgoing
    const counts = {
      all: invites.length,
      pending: invites.filter(i => i.status === 'pending').length,
      accepted: invites.filter(i => i.status === 'accepted').length,
      declined: invites.filter(i => i.status === 'declined').length,
      reschedule: invites.filter(i => i.status === 'reschedule').length,
    };

    return `
    <!-- Page header -->
    <div class="home-header">
      <div class="home-header-left">
        <h1 class="home-title">Мої запрошення</h1>
      </div>
      <button class="btn-create-fab" onclick="ZAP.router.go('create')" title="Нове запрошення">
        ${icon('plus', 20)}
        <span>Нове</span>
      </button>
    </div>

    <!-- Quick stats row -->
    ${invites.length > 0 ? `
    <div class="home-stats-row">
      ${[
        { key: 'all',        label: 'Всі',        cls: '' },
        { key: 'pending',    label: 'Очікують',   cls: 'stat-pending' },
        { key: 'accepted',   label: 'Прийняті',   cls: 'stat-accepted' },
        { key: 'declined',   label: 'Відхилені',  cls: 'stat-declined' },
        { key: 'reschedule', label: 'Перенос',    cls: 'stat-reschedule' },
      ].map(({ key, label, cls }) => `
        <button class="home-stat-chip ${filter === key && activeTab === 'outgoing' ? 'active' : ''} ${cls}"
          onclick="ZAP.pages.home.setFilterAndTab('${key}')">
          <span class="home-stat-num">${counts[key]}</span>
          <span class="home-stat-label">${label}</span>
        </button>
      `).join('')}
    </div>` : ''}

    <!-- Tab bar -->
    <div class="home-tabs">
      <button class="home-tab ${activeTab === 'outgoing' ? 'active' : ''}"
        onclick="ZAP.pages.home.setTab('outgoing')">
        ${icon('paper-plane-tilt', 16)} Відправлені
      </button>
      <button class="home-tab ${activeTab === 'incoming' ? 'active' : ''}"
        onclick="ZAP.pages.home.setTab('incoming')">
        ${icon('users', 16)} Від друзів
        ${incomingCount > 0 ? `<span class="home-tab-badge">${incomingCount}</span>` : ''}
      </button>
    </div>

    ${activeTab === 'outgoing' ? renderOutgoing() : renderIncoming()}`;
  }

  function renderSkeleton() {
    return `
    <div class="home-header">
      <div class="home-header-left">
        <div class="skeleton-line" style="width:220px;height:26px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:280px;height:13px"></div>
      </div>
      <div class="skeleton" style="width:96px;height:40px;border-radius:var(--radius-pill)"></div>
    </div>
    <div class="home-stats-row">
      ${[1,2,3,4,5].map(() => `
        <div class="skeleton" style="flex:1;height:62px;border-radius:12px"></div>
      `).join('')}
    </div>
    <div class="home-tabs" style="margin-bottom:24px">
      <div class="skeleton" style="flex:1;height:40px;border-radius:8px"></div>
      <div class="skeleton" style="flex:1;height:40px;border-radius:8px"></div>
    </div>
    ${[1,2,3,4].map((_, i) => `
      <div class="home-inv-card" style="animation:none;margin-bottom:10px">
        <div class="inv-card-header">
          <div class="skeleton" style="width:44px;height:44px;border-radius:12px;flex-shrink:0"></div>
          <div class="skeleton-line w-1-3" style="height:10px"></div>
          <div class="skeleton" style="width:60px;height:22px;border-radius:20px;flex-shrink:0"></div>
        </div>
        <div class="inv-card-body">
          <div class="skeleton-line w-3-4" style="margin-bottom:8px;height:14px"></div>
          <div class="skeleton-line w-1-2" style="height:12px"></div>
        </div>
        <div class="inv-card-footer">
          <div class="skeleton" style="width:34px;height:34px;border-radius:10px"></div>
        </div>
      </div>
    `).join('')}`;
  }

  function renderOutgoing() {
    const { esc, badge, TYPE_MAP, inviteLink, icon } = ZAP.utils;
    const f = filter;
    const shown = f === 'all' ? invites : invites.filter(i => i.status === f);

    if (shown.length === 0) {
      return `
      <div class="home-empty">
        <div class="home-empty-icon">
          ${f === 'all' ? icon('paper-plane-tilt', 40) : icon('funnel', 40)}
        </div>
        <div class="home-empty-title">
          ${f === 'all' ? 'Ще немає запрошень' : 'Немає запрошень з таким статусом'}
        </div>
        <p class="home-empty-sub">
          ${f === 'all' ? 'Створіть перше запрошення і поділіться ним з другом' : 'Спробуйте обрати інший фільтр'}
        </p>
        ${f === 'all' ? `
          <button class="btn btn-dark" style="width:auto;padding:12px 32px;margin-top:4px"
            onclick="ZAP.router.go('create')">
            ${icon('plus', 16)} Створити запрошення
          </button>
        ` : `
          <button class="btn-ghost" onclick="ZAP.pages.home.setFilter('all')">
            Показати всі
          </button>
        `}
      </div>`;
    }

    return shown.map((inv, i) => {
      const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
      const link = inv.isGroup
        ? location.origin + '/g/' + inv.id
        : inviteLink(inv.id);
      return `
      <div class="home-inv-card status-${inv.status}" style="animation-delay:${i * 35}ms"
        onclick="ZAP.pages.home.openModal('${inv.id}')">
        <div class="inv-card-header">
          <div class="inv-card-emoji">${t.e}</div>
          <div class="inv-card-type">${t.l}</div>
          ${badge(inv.status)}
        </div>
        <div class="inv-card-body">
          <div class="inv-card-title">
            ${esc(inv.to || inv.title || 'Групове запрошення')}
            ${inv.isGroup ? `<span class="inv-card-group-badge">${icon('users', 12)} Група</span>` : ''}
          </div>
          <div class="inv-card-details">
            ${inv.date ? `<div class="inv-card-detail">${icon('calendar-blank', 14)} ${esc(inv.date)}</div>` : ''}
            ${inv.time ? `<div class="inv-card-detail">${icon('clock', 14)} ${esc(inv.time)}</div>` : ''}
            ${inv.place ? `<div class="inv-card-detail">${icon('map-pin', 14)} ${esc(inv.place)}</div>` : ''}
          </div>
        </div>
        <div class="inv-card-footer">
          <button class="home-copy-btn" id="copy-${inv.id}"
            onclick="event.stopPropagation();ZAP.utils.copyText('${link.replace(/'/g,"\\'")}', this)"
            title="Копіювати посилання">
            ${icon('link', 14)}
          </button>
        </div>
      </div>`;
    }).join('');
  }

  function renderIncoming() {
    const { esc, TYPE_MAP, icon } = ZAP.utils;

    if (incomingInvites.length === 0) {
      return `
      <div class="home-empty">
        <div class="home-empty-icon">${icon('tray', 40)}</div>
        <div class="home-empty-title">Немає вхідних запрошень</div>
        <p class="home-empty-sub">Коли друзі надішлють вам запрошення, вони з'являться тут</p>
      </div>`;
    }

    return incomingInvites.map((n, i) => {
      const isGroup = n.type === 'group-invite';
      const route = isGroup ? 'group-invite' : 'invite';
      return `
      <div class="home-inv-card status-pending" style="animation-delay:${i * 35}ms"
        onclick="ZAP.router.go('${route}', {id:'${n.inviteId}'})">
        <div class="inv-card-header">
          <div class="inv-card-emoji" style="background:var(--gold-dim)">
            ${isGroup ? icon('users', 22) : icon('paper-plane-tilt', 22)}
          </div>
          <div class="inv-card-type">${isGroup ? 'Групове' : 'Особисте'}</div>
          <span class="inv-card-badge">${icon('bell', 10)} Нове</span>
        </div>
        <div class="inv-card-body">
          <div class="inv-card-title">${esc(n.body || 'Нове запрошення')}</div>
          <div class="inv-card-details">
            <div class="inv-card-detail">${icon('clock', 14)} ${ZAP.utils.timeAgo(n.createdAt)}</div>
          </div>
        </div>
        <div class="inv-card-footer">
          <button class="btn btn-gold btn-sm"
            onclick="event.stopPropagation();ZAP.router.go('${route}', {id:'${n.inviteId}'})">
            Відкрити
          </button>
        </div>
      </div>`;
    }).join('');
  }

  function renderModal(inv) {
    const { esc, badge, TYPE_MAP, inviteLink, divLine, icon } = ZAP.utils;
    const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
    const link = inv.isGroup
      ? location.origin + '/g/' + inv.id
      : inviteLink(inv.id);

    return `
    <div class="overlay" onclick="ZAP.pages.home.closeModal()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width:420px">
        <!-- Modal header -->
        <div class="modal-hdr">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="modal-emoji-wrap">${t.e}</div>
            <div>
              <div class="modal-inv-name">${esc(inv.to || inv.title || 'Групове')}</div>
              <div class="modal-inv-type">${t.l}${inv.isGroup ? ` · ${icon('users', 13)} Групове` : ''}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${badge(inv.status)}
            <button onclick="ZAP.pages.home.closeModal()" class="modal-close">${icon('x', 18)}</button>
          </div>
        </div>

        <!-- Details -->
        <div class="modal-details">
          <div class="modal-detail-row">
            <span class="modal-detail-icon">${icon('calendar-blank', 17)}</span>
            <span class="modal-detail-label">Дата</span>
            <span class="modal-detail-value">${esc(inv.date) || '—'}</span>
          </div>
          <div class="modal-detail-row">
            <span class="modal-detail-icon">${icon('clock', 17)}</span>
            <span class="modal-detail-label">Час</span>
            <span class="modal-detail-value">${esc(inv.time || '—')}</span>
          </div>
          ${inv.place ? `
          <div class="modal-detail-row">
            <span class="modal-detail-icon">${icon('map-pin', 17)}</span>
            <span class="modal-detail-label">Місце</span>
            <span class="modal-detail-value">${esc(inv.place)}</span>
          </div>` : ''}
          ${inv.msg ? `
          <div class="modal-detail-row">
            <span class="modal-detail-icon">${icon('chat-circle-dots', 17)}</span>
            <span class="modal-detail-label">Текст</span>
            <span class="modal-detail-value" style="font-style:italic">${esc(inv.msg)}</span>
          </div>` : ''}
          ${inv.status === 'reschedule' ? `
          <div id="modal-resc-${inv.id}" class="modal-detail-row" style="background:var(--gold-dim); flex-direction:column; align-items:flex-start; gap:6px; border-top:1px solid var(--border);">
            <div style="font-size:.7rem;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;font-weight:700;display:flex;align-items:center;gap:6px">
              ${icon('calendar-plus', 14)} Пропозиція отримувача
            </div>
            <div style="font-size:.92rem;font-weight:500;color:var(--ink)" id="reschedule-info-${inv.id}">${icon('circle-notch', 14)} Завантаження...</div>
          </div>` : ''}
        </div>

        <!-- Link box -->
        <div class="modal-link-box">
          <p style="font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:8px">${icon('link', 14)} Посилання</p>
          <div class="modal-link-url">${esc(link)}</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button id="mcopy"
              onclick="ZAP.utils.copyText('${link.replace(/'/g,"\\'")}', this)"
              class="btn btn-dark" style="flex:1;padding:10px 14px;font-size:.88rem">
              ${icon('copy', 14)} Скопіювати
            </button>
            <button onclick="ZAP.pages.home.closeModal();ZAP.router.go('${inv.isGroup ? 'group-invite' : 'invite'}', {id:'${inv.id}'})"
              class="btn btn-outline" style="flex:1;padding:10px 14px;font-size:.88rem">
              ${icon('eye', 14)} Переглянути
            </button>
          </div>
        </div>

        <button onclick="ZAP.pages.home.deleteInv('${inv.id}')"
          style="display:flex;align-items:center;gap:5px;margin:12px auto 0;background:none;border:none;color:var(--muted);font-size:.82rem;cursor:pointer;padding:4px 8px;border-radius:6px;transition:color .15s"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">
          ${icon('trash', 14)} Видалити запрошення
        </button>
      </div>
    </div>`;
  }

  async function openModal(id) {
    const inv = invites.find(i => i.id === id);
    if (!inv) return;

    const existing = document.getElementById('home-modal-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'home-modal-container';
    container.innerHTML = renderModal(inv);
    document.body.appendChild(container);

    if (inv.status === 'reschedule') {
      const resc = await ZAP.db.getReschedule(id);
      const el = document.getElementById('reschedule-info-' + id);
      if (el && resc) {
        el.textContent = [resc.date, resc.time].filter(Boolean).join(' о ') || 'Без конкретної дати';
      } else if (el) {
        el.textContent = 'Деталі не вказані';
      }
    }
  }

  function closeModal() {
    const existing = document.getElementById('home-modal-container');
    if (existing) existing.remove();
  }

  function setTab(t) {
    activeTab = t;
    ZAP.render();
  }

  function setFilter(f) {
    filter = f;
    ZAP.render();
  }

  function setFilterAndTab(f) {
    filter = f;
    activeTab = 'outgoing';
    ZAP.render();
  }

  async function deleteInv(id) {
    closeModal();
    if (!await ZAP.utils.confirm('Видалити запрошення?')) return;
    await ZAP.db.deleteInvite(id, ZAP.auth.getUser()?.uid);
    invites = invites.filter(i => i.id !== id);
    modalInv = null;
    ZAP.utils.toast('Запрошення видалено', 'info');
    ZAP.render();
  }

  function startListening() {
    const user = ZAP.auth.getUser();
    if (!user) return;
    ZAP.db.listenStatuses(user.uid, statuses => {
      let changed = false;
      invites.forEach(inv => {
        if (statuses[inv.id] && statuses[inv.id] !== inv.status) {
          inv.status = statuses[inv.id];
          changed = true;
          if (inv.status === 'accepted') {
            ZAP.utils.toast(`${inv.to || 'Хтось'} прийняв запрошення!`, 'success');
          } else if (inv.status === 'declined') {
            ZAP.utils.toast(`${inv.to || 'Хтось'} відхилив запрошення`, 'error');
          } else if (inv.status === 'reschedule') {
            ZAP.utils.toast(`${inv.to || 'Хтось'} хоче перенести зустріч`, 'info');
          }
        }
      });
      if (changed) {
        const route = ZAP.router.parsePath();
        if (route.page === 'home') ZAP.render();
      }
    });
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.home = {
    _loaded: false,
    render, load, setTab, setFilter, setFilterAndTab, openModal, closeModal, deleteInv, startListening,
  };
})();
