/* ═══════════════════════════════════════════════════════
   Page — Friends & Friend Requests — Premium Redesign
   ═══════════════════════════════════════════════════════ */

(function () {
  let friends = [];
  let requests = [];
  let searchResult = null;
  let searchLoading = false;
  let tab = 'friends'; // 'friends' | 'requests' | 'invites'
  let friendInvites = [];
  let loaded = false;
  let processedRequests = new Set();

  async function load() {
    loaded = false;
    const user = ZAP.auth.getUser();
    if (!user) { loaded = true; return; }
    friends = await ZAP.db.getFriends(user.uid);
    requests = await ZAP.db.getFriendRequests(user.uid);

    const friendUids = new Set(friends.map(f => f.uid));
    requests.forEach(req => {
      if (friendUids.has(req.fromUid)) processedRequests.add(req.fromUid);
    });

    const notifs = await ZAP.notifications.getNotifications(user.uid);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    friendInvites = notifs.filter(n =>
      (n.type === 'invite' || n.type === 'group-invite') && n.inviteId && !n.read &&
      now - n.createdAt < SEVEN_DAYS
    );

    loaded = true;
    ZAP.pages.friends._loaded = true;
  }

  function renderSkeleton() {
    return `
    <div class="friends-header">
      <div>
        <div class="skeleton-line" style="width:140px;height:26px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:260px;height:13px"></div>
      </div>
    </div>
    <div style="margin-bottom:20px">
      <div class="skeleton" style="height:48px;border-radius:var(--radius-sm)"></div>
    </div>
    <div class="mode-tabs" style="margin-bottom:20px">
      <div class="skeleton" style="flex:1;height:42px;border-radius:10px"></div>
      <div class="skeleton" style="flex:1;height:42px;border-radius:10px"></div>
      <div class="skeleton" style="flex:1;height:42px;border-radius:10px"></div>
    </div>
    <div class="friend-list">
      ${[1,2,3,4].map(() => `
        <div class="friend-row" style="animation:none">
          <div class="skeleton-circle" style="width:42px;height:42px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div class="skeleton-line w-1-3" style="margin-bottom:6px;height:14px"></div>
            <div class="skeleton-line w-1-4" style="height:11px"></div>
          </div>
          <div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>
        </div>
      `).join('')}
    </div>`;
  }

  function render() {
    if (!loaded) return renderSkeleton();
    const { esc, avatarHTML, icon } = ZAP.utils;

    return `
    <!-- Page header -->
    <div class="friends-header">
      <div>
        <h1 class="friends-title">Друзі</h1>
        <p class="friends-subtitle">Додавайте друзів та надсилайте запрошення напряму</p>
      </div>
    </div>

    <!-- Search bar -->
    <div class="friends-search-bar">
      <div class="friends-search-input-wrap">
        <span class="friends-search-icon">${icon('magnifying-glass', 18)}</span>
        <input id="friend-search-input"
          placeholder="Введіть ID (ZAP-XXXXXX) або логін (@name)"
          aria-label="Пошук друга за ID або логіном" maxlength="12"
          onkeydown="if(event.key==='Enter')ZAP.pages.friends.search()"
          oninput="ZAP.pages.friends.clearSearch()"/>
      </div>
      <button class="btn btn-dark" onclick="ZAP.pages.friends.search()" ${searchLoading ? 'disabled' : ''}
        style="flex-shrink:0;padding:12px 20px">
        ${searchLoading ? icon('circle-notch', 16) : 'Знайти'}
      </button>
    </div>

    ${searchResult !== null ? renderSearchResult() : ''}

    <!-- Tab bar -->
    <div class="mode-tabs">
      <button class="mode-tab ${tab === 'friends' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('friends')">
        ${icon('users', 16)}
        Друзі
        ${friends.length > 0 ? `<span class="tab-count">${friends.length}</span>` : ''}
      </button>
      <button class="mode-tab ${tab === 'requests' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('requests')">
        ${icon('hand-waving', 16)}
        Запити
        ${requests.length > 0 ? `<span class="tab-count" style="background:rgba(192,57,43,.15);color:var(--red)">${requests.length}</span>` : ''}
      </button>
      <button class="mode-tab ${tab === 'invites' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('invites')">
        ${icon('paper-plane-tilt', 16)}
        Запрошення
        ${friendInvites.length > 0 ? `<span class="tab-count">${friendInvites.length}</span>` : ''}
      </button>
    </div>

    ${renderTab()}`;
  }

  function renderTab() {
    if (tab === 'requests') return renderRequests();
    if (tab === 'invites') return renderFriendInvites();
    return renderFriendsList();
  }

  function isOnline(f) {
    return f.lastSeen && (Date.now() - f.lastSeen < 2 * 60 * 1000);
  }

  function renderFriendsList() {
    const { esc, avatarHTML, icon } = ZAP.utils;

    if (friends.length === 0) {
      return `
      <div class="friends-empty">
        <div class="friends-empty-icon">${icon('users-three', 40)}</div>
        <div class="friends-empty-title">Ще немає друзів</div>
        <p class="friends-empty-sub">
          Введіть унікальний ID (ZAP-XXXXXX) або @логін у пошуковий рядок вище, щоб знайти друга
        </p>
      </div>`;
    }

    return `
    <div class="friend-list">
      ${friends.map((f, i) => {
        const online = isOnline(f);
        const statusText = online ? 'В мережі' : (f.lastSeen ? ZAP.utils.timeAgo(f.lastSeen) : '');
        return `
        <div class="friend-row" style="animation-delay:${i * 35}ms" data-uid="${f.uid}">
          <div style="position:relative;flex-shrink:0">
            ${avatarHTML(f._pf || f)}
            ${online ? '<span class="friend-online-dot"></span>' : ''}
          </div>
          <div class="friend-row-info">
            <div class="friend-row-name">${esc(f.name)}</div>
            ${statusText ? `<div class="friend-row-status${online ? ' online' : ''}">${statusText}</div>` : ''}
          </div>
          <button class="friend-menu-btn" onclick="ZAP.pages.friends.toggleMenu(event, '${f.uid}')" title="Дії">
            ${icon('dots-three-vertical', 20)}
          </button>
        </div>`;
      }).join('')}
    </div>`;
  }

  let openMenuUid = null;
  function toggleMenu(e, uid) {
    e.stopPropagation();
    if (openMenuUid === uid) { closeMenu(); return; }
    closeMenu();
    const row = e.target.closest('.friend-row');
    if (!row) return;
    const f = friends.find(x => x.uid === uid);
    if (!f) return;
    const menu = document.createElement('div');
    menu.className = 'friend-menu';
    const btn = e.target.closest('.friend-menu-btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menu.style.top = (rect.bottom + 6) + 'px';
      menu.style.right = (window.innerWidth - rect.right) + 'px';
      if (rect.bottom + 140 > window.innerHeight) {
        menu.style.top = 'auto';
        menu.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
      }
    }
    menu.innerHTML = `
      <button class="friend-menu-item" onclick="ZAP.pages.friends.goProfile('${uid}')">
        ${ZAP.utils.icon('user', 16)} Переглянути профіль
      </button>
      <button class="friend-menu-item" onclick="ZAP.pages.friends.goInvite()">
        ${ZAP.utils.icon('paper-plane-tilt', 16)} Запросити
      </button>
      <button class="friend-menu-item danger" onclick="ZAP.pages.friends.removeFriend('${uid}','${ZAP.utils.esc(f.name)}')">
        ${ZAP.utils.icon('user-minus', 16)} Видалити з друзів
      </button>`;
    document.body.appendChild(menu);
    openMenuUid = uid;
    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 10);
  }

  function closeMenu() {
    document.querySelector('.friend-menu')?.remove();
    openMenuUid = null;
  }

  function goProfile(uid) { closeMenu(); ZAP.router.go('user-profile', { uid }); }
  function goInvite() { closeMenu(); ZAP.router.go('create'); }

  function renderRequests() {
    const { icon, avatarHTML, esc, timeAgo } = ZAP.utils;

    if (requests.length === 0) {
      return `
      <div class="friends-empty">
        <div class="friends-empty-icon">${icon('hand-waving', 40)}</div>
        <div class="friends-empty-title">Немає запитів</div>
        <p class="friends-empty-sub">Нові запити на дружбу з'являться тут</p>
      </div>`;
    }

    return `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${requests.map((req, i) => {
        const isProcessed = processedRequests.has(req.fromUid);
        return `
        <div class="friend-request-card ${isProcessed ? 'processed' : ''}" style="animation-delay:${i * 35}ms">
          <div class="avatar" style="flex-shrink:0">${(req.fromName || '?').charAt(0).toUpperCase()}</div>
          <div class="friend-request-info">
            <div class="friend-request-name">${esc(req.fromName)}</div>
            <div class="friend-request-time">${timeAgo(req.sentAt)}</div>
          </div>
          ${isProcessed ? `
            <span class="friend-accepted-badge">${icon('check-circle', 14)} Прийнято</span>
          ` : `
            <div class="friend-request-actions">
              <button class="btn btn-gold btn-sm"
                onclick="ZAP.pages.friends.acceptReq('${req.fromUid}')">
                ${icon('check', 14)} Прийняти
              </button>
              <button class="btn-icon"
                onclick="ZAP.pages.friends.declineReq('${req.fromUid}')"
                title="Відхилити" style="border-radius:8px;width:36px;height:36px">
                ${icon('x', 16)}
              </button>
            </div>
          `}
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderFriendInvites() {
    const { icon, esc, timeAgo } = ZAP.utils;

    if (friendInvites.length === 0) {
      return `
      <div class="friends-empty">
        <div class="friends-empty-icon">${icon('paper-plane-tilt', 40)}</div>
        <div class="friends-empty-title">Немає запрошень від друзів</div>
        <p class="friends-empty-sub">Коли друзі надішлють вам запрошення — вони з'являться тут</p>
      </div>`;
    }

    return `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${friendInvites.map((n, i) => `
        <div class="notif-item unread" style="animation-delay:${i * 35}ms">
          <div class="notif-icon-wrap ${n.type === 'group-invite' ? 'type-group-invite' : 'type-invite'}">
            ${n.type === 'group-invite' ? icon('users', 18) : icon('paper-plane-tilt', 18)}
          </div>
          <div class="notif-body">
            <div class="notif-title">${esc(n.body || 'Запрошення')}</div>
            <div class="notif-time">
              <span class="notif-dot"></span>
              ${timeAgo(n.createdAt)}
            </div>
            ${n.inviteId ? `
            <div class="notif-actions">
              <button class="btn btn-gold btn-sm"
                onclick="ZAP.router.go('${n.type === 'group-invite' ? 'group-invite' : 'invite'}', {id:'${n.inviteId}'})">
                Переглянути
              </button>
            </div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderSearchResult() {
    const { icon, esc, avatarHTML } = ZAP.utils;

    if (searchResult === 'not-found') {
      return `
      <div class="search-result-card search-not-found">
        <span>${icon('x-circle', 16)}</span>
        <p>Користувача з таким ID або логіном не знайдено</p>
      </div>`;
    }

    if (searchResult === 'self') {
      return `
      <div class="search-result-card search-self">
        <span>${icon('user-circle', 16)}</span>
        <p>Це ваш власний обліковий запис</p>
      </div>`;
    }

    if (searchResult && typeof searchResult === 'object') {
      return `
      <div class="search-result-card search-found">
        <div style="display:flex;align-items:center;gap:14px">
          ${avatarHTML(searchResult, 'md')}
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:.95rem">${esc(searchResult.name)}</div>
            <div style="font-size:.78rem;color:var(--muted);font-family:monospace">${esc(searchResult.uniqueId)}</div>
          </div>
          <button class="btn btn-dark btn-sm"
            onclick="ZAP.router.go('user-profile', {uid:'${searchResult.uid}'})">
            Профіль →
          </button>
        </div>
      </div>`;
    }

    return '';
  }

  function clearSearch() {
    if (searchResult !== null) {
      searchResult = null;
      // Don't re-render full page, just hide the result
      const el = document.querySelector('.search-result-card');
      if (el) el.remove();
    }
  }

  function setTab(t) {
    tab = t;
    ZAP.render();
  }

  async function search() {
    const input = document.getElementById('friend-search-input');
    const query = input?.value.trim();
    if (!query) return;

    searchLoading = true;
    searchResult = null;
    ZAP.render();

    try {
      let user = null;
      if (query.startsWith('@')) {
        user = await ZAP.db.getUserByLogin(query.slice(1).toLowerCase());
      } else if (query.toUpperCase().startsWith('ZAP')) {
        user = await ZAP.db.getUserById(query.toUpperCase());
      } else {
        user = await ZAP.db.getUserByLogin(query.toLowerCase());
      }

      if (!user) {
        searchResult = 'not-found';
      } else if (user.uid === ZAP.auth.getUser()?.uid) {
        searchResult = 'self';
      } else {
        searchResult = user;
      }
    } catch {
      searchResult = 'not-found';
    }

    searchLoading = false;
    ZAP.render();
  }

  async function acceptReq(fromUid) {
    const me = ZAP.auth.getUser();
    if (!me) return;
    processedRequests.add(fromUid);
    ZAP.render();
    try {
      await ZAP.db.acceptFriendRequest(me.uid, fromUid);
      requests = requests.filter(r => r.fromUid !== fromUid);
      friends = await ZAP.db.getFriends(me.uid);
      await ZAP.notifications.deleteNotificationsByPayload(me.uid, 'friend-request', 'fromUid', fromUid);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
      ZAP.utils.toast('Друга додано ✓', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося прийняти запит. Спробуйте пізніше', 'error');
    }
  }

  async function declineReq(fromUid) {
    const me = ZAP.auth.getUser();
    if (!me) return;
    processedRequests.add(fromUid);
    ZAP.render();
    await ZAP.db.declineFriendRequest(me.uid, fromUid);
    requests = requests.filter(r => r.fromUid !== fromUid);
    await ZAP.notifications.deleteNotificationsByPayload(me.uid, 'friend-request', 'fromUid', fromUid);
    if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
    ZAP.render();
  }

  async function removeFriend(friendUid, friendName) {
    if (!await ZAP.utils.confirm(`Видалити ${friendName} з друзів?`)) return;
    const me = ZAP.auth.getUser();
    if (!me) return;
    await ZAP.db.removeFriend(me.uid, friendUid);
    friends = friends.filter(f => f.uid !== friendUid);
    ZAP.utils.toast('Видалено з друзів', 'info');
    ZAP.render();
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.friends = {
    _loaded: false,
    render, load, setTab, search, clearSearch, acceptReq, declineReq, removeFriend,
    toggleMenu, goProfile, goInvite,
  };
})();
