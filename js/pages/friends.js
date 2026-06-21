/* ═══════════════════════════════════════════════════════
   Page — Friends & Friend Requests
   ═══════════════════════════════════════════════════════ */

(function () {
  let friends = [];
  let requests = [];
  let searchResult = null;
  let searchLoading = false;
  let tab = 'friends'; // 'friends' | 'requests' | 'invites'
  let friendInvites = []; // invites from friends
  let loaded = false;
  let processedRequests = new Set(); // Track processed friend requests by fromUid

  async function load() {
    loaded = false;
    const user = ZAP.auth.getUser();
    if (!user) { loaded = true; return; }
    friends = await ZAP.db.getFriends(user.uid);
    requests = await ZAP.db.getFriendRequests(user.uid);

    // Mark requests as processed if user is already a friend
    const friendUids = new Set(friends.map(f => f.uid));
    requests.forEach(req => {
      if (friendUids.has(req.fromUid)) {
        processedRequests.add(req.fromUid);
      }
    });

    // Load friend invites from notifications (unread only, last 7 days)
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
    <h1 class="page-title" style="margin-bottom:6px"><span class="skeleton-line" style="width:120px;height:28px;display:inline-block;vertical-align:middle"></span></h1>
    <p class="page-subtitle" style="margin-bottom:20px"><span class="skeleton-line" style="width:280px;height:14px;display:inline-block;vertical-align:middle"></span></p>
    <div style="margin-bottom:20px">
      <div class="skeleton" style="height:44px;border-radius:var(--radius-pill)"></div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--warm);border-radius:var(--radius-sm);padding:4px">
      <div class="skeleton" style="flex:1;height:40px;border-radius:var(--radius-sm)"></div>
      <div class="skeleton" style="flex:1;height:40px;border-radius:var(--radius-sm)"></div>
      <div class="skeleton" style="flex:1;height:40px;border-radius:var(--radius-sm)"></div>
    </div>
    ${[1,2,3,4].map(() => `
      <div class="skeleton-card" style="display:flex;align-items:center;gap:12px;padding:12px 16px">
        <div class="skeleton-circle" style="width:40px;height:40px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div class="skeleton-line w-1-2" style="margin-bottom:6px;height:14px"></div>
          <div class="skeleton-line w-1-4" style="height:12px"></div>
        </div>
        <div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>
      </div>
    `).join('')}`;
  }

  function render() {
    if (!loaded) return renderSkeleton();
    const { esc, avatarHTML, icon } = ZAP.utils;

    return `
    <h1 class="page-title">Друзі</h1>
    <p class="page-subtitle">Додавайте друзів та надсилайте запрошення напряму</p>

    <!-- Search by ID -->
    <div class="friend-search">
      <input id="friend-search-input" placeholder="Введіть ID (наприклад ZAP-A7F3K2)"
        aria-label="Пошук друга за ID" maxlength="10"
        onkeydown="if(event.key==='Enter')ZAP.pages.friends.search()"/>
      <button class="btn btn-dark" onclick="ZAP.pages.friends.search()" ${searchLoading ? 'disabled' : ''}>
        ${searchLoading ? icon('clock', 14) : `${icon('magnifying-glass', 14)} Знайти`}
      </button>
    </div>

    ${searchResult !== null ? renderSearchResult() : ''}

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab ${tab === 'friends' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('friends')">
        ${icon('users', 18)} Друзі ${friends.length > 0 ? `(${friends.length})` : ''}
      </button>
      <button class="tab ${tab === 'requests' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('requests')">
        ${icon('hand-waving', 18)} Запити ${requests.length > 0 ? `(${requests.length})` : ''}
      </button>
      <button class="tab ${tab === 'invites' ? 'active' : ''}"
        onclick="ZAP.pages.friends.setTab('invites')">
        ${icon('paper-plane-tilt', 18)} Запрошення ${friendInvites.length > 0 ? `(${friendInvites.length})` : ''}
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
    const { icon } = ZAP.utils;
    if (friends.length === 0) {
      return `
      <div class="empty">
        <div class="empty-icon"><i class="ph ph-users" style="font-size:3rem"></i></div>
        <p class="empty-desc" style="margin-bottom:8px">Ще немає друзів</p>
        <p style="font-size:.88rem;color:var(--muted)">Знайдіть друзів за їх унікальним ID</p>
      </div>`;
    }

    return `<div class="friend-list">
    ${friends.map((f, i) => {
      const { esc, avatarHTML, icon } = ZAP.utils;
      const online = isOnline(f);
      const statusText = online ? 'В мережі' : (f.lastSeen ? ZAP.utils.timeAgo(f.lastSeen) : '');
      return `
      <div class="friend-row" style="animation-delay:${i * 40}ms" data-uid="${f.uid}">
        ${avatarHTML(f._pf || f)}
        <div class="friend-row-info">
          <div class="friend-row-name">${esc(f.name)}</div>
          ${statusText ? `<div class="friend-row-status${online ? ' online' : ''}">${online ? '● ' : ''}${statusText}</div>` : ''}
        </div>
        <button class="friend-menu-btn" onclick="ZAP.pages.friends.toggleMenu(event, '${f.uid}')" title="Дії">${icon('dots-three-vertical', 20)}</button>
      </div>`;
    }).join('')}
    </div>`;
  }

  let openMenuUid = null;
  function toggleMenu(e, uid) {
    e.stopPropagation();
    if (openMenuUid === uid) {
      closeMenu();
      return;
    }
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
      menu.style.position = 'fixed';
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.right = (window.innerWidth - rect.right) + 'px';
      menu.style.zIndex = '999';
      if (rect.bottom + 130 > window.innerHeight) {
        menu.style.top = 'auto';
        menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
      }
    }
    menu.innerHTML = `
      <button class="friend-menu-item" onclick="ZAP.pages.friends.goProfile('${uid}')">
        ${ZAP.utils.icon('user', 16)} Профіль
      </button>
      <button class="friend-menu-item" onclick="ZAP.pages.friends.goInvite()">
        ${ZAP.utils.icon('paper-plane-tilt', 16)} Запросити
      </button>
      <button class="friend-menu-item danger" onclick="ZAP.pages.friends.removeFriend('${uid}','${ZAP.utils.esc(f.name)}')">
        ${ZAP.utils.icon('x', 16)} Видалити з друзів
      </button>
    `;
    document.body.appendChild(menu);
    openMenuUid = uid;
    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 10);
  }
  function closeMenu() {
    const m = document.querySelector('.friend-menu');
    if (m) m.remove();
    openMenuUid = null;
  }
  function goProfile(uid) { closeMenu(); ZAP.router.go('user-profile', { uid }); }
  function goInvite() { closeMenu(); ZAP.router.go('create'); }

  function renderRequests() {
    const { icon } = ZAP.utils;
    if (requests.length === 0) {
      return `
      <div class="empty">
        <div class="empty-icon">${icon('hand-waving', 32)}</div>
        <p class="empty-desc">Немає запитів на дружбу</p>
      </div>`;
    }

    return requests.map((req, i) => {
      const isProcessed = processedRequests.has(req.fromUid);
      return `
      <div class="friend-card ${isProcessed ? 'processed' : ''}" style="animation-delay:${i * 40}ms">
        <div class="avatar">${(req.fromName || '?').charAt(0).toUpperCase()}</div>
        <div class="friend-info">
          <div class="friend-name">${ZAP.utils.esc(req.fromName)}</div>
          <div style="font-size:.78rem;color:var(--muted)">${ZAP.utils.timeAgo(req.sentAt)}</div>
        </div>
        ${isProcessed ? `
          <div class="friend-actions processed-status">
            <span class="status-text">Запит прийнято</span>
          </div>
        ` : `
          <div class="friend-actions">
            <button class="btn btn-gold btn-sm"
              onclick="ZAP.pages.friends.acceptReq('${req.fromUid}')">${icon('check', 14)} Прийняти</button>
            <button class="btn btn-outline btn-sm"
              onclick="ZAP.pages.friends.declineReq('${req.fromUid}')">${icon('x', 14)}</button>
          </div>
        `}
      </div>
    `}).join('');
  }

  function renderFriendInvites() {
    const { icon } = ZAP.utils;
    if (friendInvites.length === 0) {
      return `
      <div class="empty">
        <div class="empty-icon">${icon('paper-plane-tilt', 32)}</div>
        <p style="font-style:italic;font-size:1.05rem;margin-bottom:8px">Немає запрошень від друзів</p>
        <p style="font-size:.88rem;color:var(--muted)">Коли друзі надішлють вам запрошення, вони з'являться тут</p>
      </div>`;
    }

    return friendInvites.map((n, i) => `
      <div class="notif-item unread" style="animation-delay:${i * 40}ms">
        <div class="notif-icon">${n.type === 'group-invite' ? icon('users', 18) : icon('paper-plane-tilt', 18)}</div>
        <div class="notif-body">
          <div class="notif-text">${ZAP.utils.esc(n.body)}</div>
          <div class="notif-time">${ZAP.utils.timeAgo(n.createdAt)}</div>
          <div class="notif-actions">
            ${n.inviteId ? `
              <button class="btn btn-gold btn-sm"
                onclick="ZAP.router.go('${n.type === 'group-invite' ? 'group-invite' : 'invite'}', {id:'${n.inviteId}'})">
                Переглянути
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderSearchResult() {
    if (searchResult === 'not-found') {
      return `
      <div style="background:var(--red-bg);border-radius:10px;padding:14px 18px;margin-bottom:20px;animation:fadeUp .3s ease">
        <p style="font-size:.9rem;color:var(--red)">${icon('x-circle', 14)} Користувача з таким ID не знайдено</p>
      </div>`;
    }

    if (searchResult === 'self') {
      return `
      <div style="background:var(--warm);border-radius:10px;padding:14px 18px;margin-bottom:20px;animation:fadeUp .3s ease">
        <p style="font-size:.9rem;color:var(--muted)">${icon('user-circle', 14)} Це ваш власний ID</p>
      </div>`;
    }

    if (searchResult && typeof searchResult === 'object') {
      const { esc, avatarHTML, roleBadge } = ZAP.utils;
      return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:20px;animation:fadeUp .3s ease">
        <div style="display:flex;align-items:center;gap:14px">
          ${avatarHTML(searchResult)}
          <div style="flex:1">
            <div style="font-weight:600">${esc(searchResult.name)}</div>
            <div style="font-size:.78rem;color:var(--muted)">${esc(searchResult.uniqueId)}</div>
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
    
    // Mark as processed immediately to prevent duplicate clicks
    processedRequests.add(fromUid);
    ZAP.render();
    
    try {
      await ZAP.db.acceptFriendRequest(me.uid, fromUid);
      requests = requests.filter(r => r.fromUid !== fromUid);
      friends = await ZAP.db.getFriends(me.uid);
      await ZAP.notifications.deleteNotificationsByPayload(me.uid, 'friend-request', 'fromUid', fromUid);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
      ZAP.utils.toast(`Друга додано`, 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося прийняти запит. Спробуйте пізніше', 'error');
    }
  }

  async function declineReq(fromUid) {
    const me = ZAP.auth.getUser();
    if (!me) return;
    
    // Mark as processed immediately to prevent duplicate clicks
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
    render, load, setTab, search, acceptReq, declineReq, removeFriend, toggleMenu, goProfile, goInvite,
  };
})();
