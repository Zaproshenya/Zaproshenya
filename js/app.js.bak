/* ═══════════════════════════════════════════════════════
   App — Main orchestrator
   ═══════════════════════════════════════════════════════ */

(function () {
  let authReady = false;
  let unreadCount = 0;
  let lastPage = '';
  let lastParamsStr = '';

  // ── Main render ──
  async function render() {
    const app = document.getElementById('app');
    if (!app) return;

    const route = ZAP.router.parseHash();
    const user = ZAP.auth.getUser();
    const profile = ZAP.auth.getProfile();

    const isPageChange = (route.page !== lastPage || JSON.stringify(route.params) !== lastParamsStr);
    lastPage = route.page;
    lastParamsStr = JSON.stringify(route.params);

    // Dynamic page title
    const pageTitles = {
      'home': 'Мої запрошення',
      'create': 'Створити запрошення',
      'profile': 'Профіль',
      'friends': 'Друзі',
      'notifications': 'Сповіщення',
      'dashboard': 'Дашборд',
      'crm': 'CRM System',
      'user-profile': 'Профіль користувача',
      'invite': 'Перегляд запрошення',
      'group-invite': 'Групове запрошення',
      'login': 'Вхід',
      'register': 'Реєстрація',
    };
    const titleSuffix = pageTitles[route.page] || '';
    document.title = titleSuffix ? `Запрошення | ${titleSuffix}` : 'Запрошення';

    // Set real-time user action
    if (user && profile && ZAP.dbRef) {
      const pageActions = {
        'home': 'Переглядає свої запрошення',
        'create': 'Створює нове запрошення',
        'profile': 'Редагує налаштування профілю',
        'friends': 'Переглядає список друзів',
        'notifications': 'Переглядає сповіщення',
        'dashboard': 'Керує адмін-дашбордом',
        'crm': 'Керує CRM-системою',
        'user-profile': 'Переглядає профіль користувача',
        'invite': 'Переглядає запрошення',
        'group-invite': 'Переглядає групове запрошення',
      };
      const act = pageActions[route.page] || 'Активний на сайті';
      ZAP.dbRef.ref('users/' + user.uid + '/currentAction').set(act).catch(() => { });
    }

    // ── Invite pages — accessible without auth ──
    if (route.page === 'invite') {
      if (isPageChange) {
        app.innerHTML = ZAP.utils.spinner();
        await ZAP.pages.invite.loadPersonal(route.params.inviteId, route.params.b64);
      }
      app.innerHTML = ZAP.pages.invite.render();
      return;
    }

    if (route.page === 'group-invite') {
      if (isPageChange) {
        app.innerHTML = ZAP.utils.spinner();
        await ZAP.pages.invite.loadGroup(route.params.inviteId);
      }
      app.innerHTML = ZAP.pages.invite.render();
      return;
    }

    // ── Not yet initialized ──
    if (!authReady) {
      app.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
      return;
    }

    // ── Auth required pages ──
    if (!user && ZAP.router.isAuthRequired(route.page)) {
      app.innerHTML = ZAP.pages.login.render();
      return;
    }

    // ── Login/Register page ──
    if (route.page === 'login' || route.page === 'register') {
      if (user) {
        ZAP.router.go('home');
        return;
      }
      app.innerHTML = ZAP.pages.login.render();
      return;
    }

    // ── Check banned status ──
    if (profile?.banned) {
      if (profile.bannedUntil && Date.now() > profile.bannedUntil) {
        // Auto-unban
        ZAP.db.banUser(user.uid, false);
        profile.banned = false;
        profile.bannedUntil = null;
      } else {
        // Determine ban status text (Task 1)
        let banStatusTitle = 'Назавжди заблокований';
        let banStatusBody = 'Ваш акаунт було <strong>перманентно</strong> заблоковано модератором.';

        if (profile.bannedUntil) {
          const msLeft = profile.bannedUntil - Date.now();
          const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
          const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
          const minsLeft = Math.ceil(msLeft / (60 * 1000));

          banStatusTitle = `Заблокований на ${daysLeft > 1 ? daysLeft + ' ' + (daysLeft <= 4 ? 'дні' : 'днів') : hoursLeft > 1 ? hoursLeft + ' год' : minsLeft + ' хв'}`;

          const untilDate = new Date(profile.bannedUntil);
          const untilStr = untilDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          banStatusBody = `До розблокування залишилось: <strong>${daysLeft > 1 ? daysLeft + ' дн.' : hoursLeft > 1 ? hoursLeft + ' год.' : minsLeft + ' хв.'}</strong><br><span style="color:var(--muted);font-size:.85rem">Розблокування: ${untilStr}</span>`;
        }

        app.innerHTML = `
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
            <div style="text-align:center;max-width:400px">
              <div style="font-size:3rem;margin-bottom:16px">🚫</div>
              <h2 style="font-family:var(--font-heading);font-style:italic;margin-bottom:8px">${banStatusTitle}</h2>
              <p style="color:var(--muted);margin-bottom:20px;line-height:1.6">${banStatusBody}</p>
              <button class="btn btn-outline" onclick="ZAP.pages.profile.doLogout()">Вийти</button>
            </div>
          </div>`;
        return;
      }
    }

    // ── Admin required ──
    if (ZAP.router.isAdminRequired(route.page) && !ZAP.auth.isAdmin() && !ZAP.auth.isModerator()) {
      ZAP.router.go('home');
      return;
    }

    // ── Dashboard (has its own layout) ──
    if (route.page === 'dashboard') {
      if (isPageChange) {
        app.innerHTML = ZAP.utils.spinner();
        await ZAP.pages.dashboard.load();
      }
      app.innerHTML = ZAP.pages.dashboard.render();
      ZAP.pages.dashboard.drawCharts();
      return;
    }

    // ── User profile ──
    if (route.page === 'user-profile') {
      if (isPageChange) {
        app.innerHTML = renderTopbar(route.page) + '<div class="wrap">' + ZAP.utils.spinner() + '</div>';
        await ZAP.pages.userProfile.load(route.params.uid);
      }
      app.innerHTML = renderTopbar(route.page) + ZAP.pages.userProfile.render() + (user ? renderBottomNav(route.page) : '');
      return;
    }

    // ── Pages with data loading ──
    let pageContent = '';

    switch (route.page) {
      case 'home':
        if (!ZAP.pages.home._listening) {
          ZAP.pages.home.startListening();
          ZAP.pages.home._listening = true;
        }
        if (isPageChange) {
          app.innerHTML = renderTopbar(route.page) + '<div class="wrap">' + ZAP.utils.spinner() + '</div>';
          await ZAP.pages.home.load();
        }
        pageContent = ZAP.pages.home.render();
        break;

      case 'create':
        if (isPageChange) {
          app.innerHTML = renderTopbar(route.page) + '<div class="wrap">' + ZAP.utils.spinner() + '</div>';
          await ZAP.pages.create.load();
        }
        pageContent = ZAP.pages.create.render();
        break;

      case 'profile':
        if (isPageChange) {
          app.innerHTML = renderTopbar(route.page) + '<div class="wrap">' + ZAP.utils.spinner() + '</div>';
          await ZAP.pages.profile.load();
        }
        pageContent = ZAP.pages.profile.render();
        break;

      case 'friends':
        if (isPageChange) {
          app.innerHTML = renderTopbar(route.page) + '<div class="wrap">' + ZAP.utils.spinner() + '</div>';
          await ZAP.pages.friends.load();
        }
        pageContent = ZAP.pages.friends.render();
        break;

      case 'notifications':
        pageContent = await renderNotifications();
        break;

      case 'crm':
        pageContent = await renderCRM();
        break;

      default:
        pageContent = ZAP.pages.home.render();
    }

    app.innerHTML = `
      ${renderTopbar(route.page)}
      <div class="wrap">${pageContent}</div>
      ${user ? renderBottomNav(route.page) : ''}
    `;
  }

  // ── Topbar ──
  function renderTopbar(page) {
    const profile = ZAP.auth.getProfile();
    const { esc, avatarHTML, roleBadge } = ZAP.utils;
    const isAdminUser = ZAP.auth.isAdmin() || ZAP.auth.isModerator();

    const fbStatus = ZAP.dbRef
      ? `<span title="Firebase підключено" style="font-size:.7rem;color:var(--muted);display:flex;align-items:center"><span class="fb-dot ok"></span>синх.</span>`
      : `<span title="Firebase не підключено" style="font-size:.7rem;color:var(--red)">⚠ Firebase</span>`;

    return `
    <header class="topbar">
      <button class="logo" onclick="ZAP.router.go('home')">Запрошення ✦</button>
      <div class="topbar-right">
        ${fbStatus}
        <button class="nb ${page === 'home' ? 'on' : ''}" onclick="ZAP.router.go('home')">🏠 Мої</button>
        <button class="nb ${page === 'create' ? 'on' : ''}" onclick="ZAP.router.go('create')">+ Нове</button>
        <div class="pill-wrap">
          <button class="nb ${page === 'friends' ? 'on' : ''}" onclick="ZAP.router.go('friends')">👥</button>
        </div>
        <div class="pill-wrap">
          <button class="nb ${page === 'notifications' ? 'on' : ''}" onclick="ZAP.router.go('notifications')">🔔</button>
          ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
        </div>
        ${isAdminUser ? `
          <button class="nb ${page === 'dashboard' ? 'on' : ''}" onclick="ZAP.router.go('dashboard')">📊</button>
          <button class="nb ${page === 'crm' ? 'on' : ''}" onclick="ZAP.router.go('crm')">🎯 CRM</button>
        ` : ''}
        ${profile ? `
          <div class="topbar-user" onclick="ZAP.router.go('profile')">
            ${avatarHTML(profile, 'sm')}
            <span class="topbar-username">${esc(profile.name)}</span>
          </div>
        ` : `
          <button class="btn btn-outline btn-sm" onclick="ZAP.router.go('login')" style="padding:6px 12px">Увійти</button>
        `}
      </div>
    </header>`;
  }

  // ── Bottom Navigation (Mobile) ──
  function renderBottomNav(page) {
    const isAdminUser = ZAP.auth.isAdmin() || ZAP.auth.isModerator();
    return `
    <nav class="bottom-nav">
      <button class="bn-item ${page === 'home' ? 'on' : ''}" onclick="ZAP.router.go('home')">
        <div style="font-size:1.25rem">🏠</div>
        <span>Мої</span>
      </button>
      <button class="bn-item ${page === 'friends' ? 'on' : ''}" onclick="ZAP.router.go('friends')">
        <div style="font-size:1.25rem">👥</div>
        <span>Друзі</span>
      </button>
      <button class="bn-item ${page === 'create' ? 'on' : ''}" onclick="ZAP.router.go('create')">
        <div class="bn-fab">+</div>
      </button>
      <button class="bn-item ${page === 'notifications' ? 'on' : ''}" onclick="ZAP.router.go('notifications')" style="position:relative">
        <div style="font-size:1.25rem">🔔</div>
        ${unreadCount > 0 ? `<span class="notif-badge" style="position:absolute;top:0;right:2px;font-size:.6rem;padding:1px 4px">${unreadCount}</span>` : ''}
        <span>Сповіщ.</span>
      </button>
      ${isAdminUser ? `
        <button class="bn-item ${page === 'dashboard' ? 'on' : ''}" onclick="ZAP.router.go('dashboard')">
          <div style="font-size:1.25rem">📊</div>
          <span>Панель</span>
        </button>
        <button class="bn-item ${page === 'crm' ? 'on' : ''}" onclick="ZAP.router.go('crm')">
          <div style="font-size:1.25rem">🎯</div>
          <span>CRM</span>
        </button>
      ` : `
        <button class="bn-item ${page === 'profile' ? 'on' : ''}" onclick="ZAP.router.go('profile')">
          <div style="font-size:1.25rem">👤</div>
          <span>Профіль</span>
        </button>
      `}
    </nav>`;
  }

  // ── In-App Notification Popup ──
  function showNotifPopup(notif) {
    // Remove existing popup if any
    document.querySelectorAll('.notif-popup').forEach(el => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    });

    const iconMap = {
      'friend-request': '👋',
      'friend-accepted': '✅',
      'invite': '📨',
      'group-invite': '👥',
      'invite-response': '💬',
      'invite-reschedule': '📅',
    };
    const icon = iconMap[notif.type] || '🔔';

    const popup = document.createElement('div');
    popup.className = 'notif-popup';
    popup.innerHTML = `
      <div class="notif-popup-icon">${icon}</div>
      <div class="notif-popup-body">
        <div class="notif-popup-title">${ZAP.utils.esc(notif.title || 'Сповіщення')}</div>
        <div class="notif-popup-text">${ZAP.utils.esc(notif.body || '')}</div>
      </div>
      <button class="notif-popup-close" onclick="event.stopPropagation();this.closest('.notif-popup').classList.add('removing');setTimeout(()=>this.closest('.notif-popup')?.remove(),300)">×</button>
    `;
    popup.onclick = () => {
      popup.classList.add('removing');
      setTimeout(() => popup.remove(), 300);
      // Navigate based on type
      if (notif.type === 'friend-request' || notif.type === 'friend-accepted') {
        ZAP.router.go('friends');
      } else if (notif.type === 'invite' && notif.inviteId) {
        ZAP.router.go('invite', { id: notif.inviteId });
      } else if (notif.type === 'group-invite' && notif.inviteId) {
        ZAP.router.go('group-invite', { id: notif.inviteId });
      } else {
        ZAP.router.go('notifications');
      }
    };
    document.body.appendChild(popup);

    // Auto-remove after 5s
    setTimeout(() => {
      if (popup.parentElement) {
        popup.classList.add('removing');
        setTimeout(() => popup.remove(), 300);
      }
    }, 5000);

    // Update badge count
    updateUnreadCount();
  }

  // ── Notifications page ──
  async function renderNotifications() {
    const user = ZAP.auth.getUser();
    if (!user) return '';

    const notifs = await ZAP.notifications.getNotifications(user.uid);

    // Mark all as read
    await ZAP.notifications.markAllNotifsRead(user.uid);
    unreadCount = 0;

    if (notifs.length === 0) {
      return `
      <h1 class="page-title">Сповіщення</h1>
      <div class="empty">
        <div class="empty-icon">🔔</div>
        <p style="font-style:italic;font-size:1.05rem">Немає сповіщень</p>
      </div>`;
    }

    const iconMap = {
      'friend-request': '👋',
      'friend-accepted': '✓',
      'invite': '📨',
      'group-invite': '👥',
      'invite-response': '💬',
      'invite-reschedule': '📅',
    };

    // Track processed friend requests to prevent duplicate actions
    const processedReqs = new Set();
    // Check which friend requests are already processed (user is already a friend)
    const friends = await ZAP.db.getFriends(user.uid);
    const friendUids = new Set(friends.map(f => f.uid));

    return `
    <h1 class="page-title">Сповіщення</h1>
    <p class="page-subtitle">Ваші останні сповіщення</p>
    ${notifs.map((n, i) => {
      const icon = iconMap[n.type] || '✦';
      let actionBtn = '';
      const isProcessed = (n.type === 'friend-request' && n.fromUid && friendUids.has(n.fromUid)) || processedReqs.has(n.fromUid);

      if (n.type === 'friend-request' && n.fromUid) {
        if (isProcessed) {
          actionBtn = `<span class="status-text">Запит прийнято</span>`;
        } else {
          actionBtn = `
            <button class="btn btn-gold btn-sm" 
              onclick="ZAP.pages.friends.acceptReq('${n.fromUid}');processedReqs.add('${n.fromUid}');this.closest('.notif-item').remove()">Прийняти</button>
            <button class="btn btn-outline btn-sm" 
              onclick="ZAP.pages.friends.declineReq('${n.fromUid}');processedReqs.add('${n.fromUid}');this.closest('.notif-item').remove()">Відхилити</button>
          `;
        }
      } else if ((n.type === 'invite' || n.type === 'group-invite') && n.inviteId) {
        const routePage = n.type === 'group-invite' ? 'group-invite' : 'invite';
        actionBtn = `<button class="btn btn-gold btn-sm" onclick="ZAP.router.go('${routePage}',{id:'${n.inviteId}'})">Переглянути</button>`;
      } else if (n.type === 'friend-accepted' && n.fromUid) {
        actionBtn = `<button class="btn btn-outline btn-sm" onclick="ZAP.router.go('user-profile',{uid:'${n.fromUid}'})">Профіль</button>`;
      }

      return `
      <div class="notif-item ${n.read ? '' : 'unread'} ${isProcessed ? 'processed' : ''}" style="animation-delay:${i * 40}ms">
        <div class="notif-icon">${icon}</div>
        <div class="notif-body">
          <div class="notif-text"><strong>${ZAP.utils.esc(n.title || '')}</strong></div>
          <div class="notif-text">${ZAP.utils.esc(n.body || '')}</div>
          <div class="notif-time">${ZAP.utils.timeAgo(n.createdAt)}</div>
          ${actionBtn ? `<div class="notif-actions">${actionBtn}</div>` : ''}
        </div>
        <button class="notif-delete-btn" title="Видалити" onclick="ZAP.app.deleteNotification('${n.id}', this)">×</button>
      </div>`;
    }).join('')}`;
  }

  // ── CRM Page --
  async function renderCRM() {
    const user = ZAP.auth.getUser();
    if (!user) return '';

    try {
      const response = await fetch('data/tasks.json?t=' + Date.now());
      let crmData = await response.json();
      
      const iconMap = {
        'bug': '🐛',
        'feature': '✨',
        'improvement': '📈',
        'task': '📋'
      };

      const priorityColors = {
        'critical': '#dc3545',
        'high': '#fd7e14',
        'medium': '#ffc107',
        'low': '#198754'
      };

      const priorityLabels = {
        'critical': '🔴 Критично',
        'high': '🟠 Високий',
        'medium': '🟡 Середній',
        'low': '🟢 Низький'
      };

      const typeLabels = {
        'bug': 'Баг',
        'feature': 'Фіча',
        'improvement': 'Покращення',
        'task': 'Задача'
      };

      const columns = crmData.columns || {};
      const stats = crmData.stats || {};

      return `
      <h1 class="page-title">🎯 CRM System</h1>
      <p class="page-subtitle">Керування задачами для платформи Запрошення</p>
      
      <div class="crm-stats" style="display:flex;gap:15px;margin-bottom:25px;flex-wrap:wrap;">
        <div class="stat-card" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 20px;font-size:.9rem;">
          <strong style="color:var(--muted);">Всього:</strong> <span>${stats.total || 0}</span>
        </div>
        <div class="stat-card" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 20px;font-size:.9rem;">
          <strong style="color:var(--muted);">Done:</strong> <span>${stats.byStatus?.done || 0}</span>
        </div>
        <div class="stat-card" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 20px;font-size:.9rem;">
          <strong style="color:var(--muted);">In Progress:</strong> <span>${stats.byStatus?.['in-progress'] || 0}</span>
        </div>
        <div class="stat-card" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 20px;font-size:.9rem;">
          <strong style="color:var(--muted);">To Do:</strong> <span>${stats.byStatus?.todo || 0}</span>
        </div>
      </div>
      
      <div class="crm-kanban" style="display:flex;gap:20px;overflow-x:auto;padding-bottom:20px;">
        ${Object.entries(columns).map(([id, col]) => {
          const tasks = crmData.tasks?.filter(t => t.column === id) || [];
          const color = col.color || '#6c757d';
          
          return `
            <div class="crm-column" style="flex:1;min-width:280px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:15px;" data-column="${id}">
              <div class="crm-column-header" style="display:flex;align-items:center;gap:10px;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid var(--border);">
                <div style="width:12px;height:12px;border-radius:50%;background:${color};"></div>
                <h3 style="font-size:1rem;font-weight:600;">${col.name}</h3>
                <span style="background:var(--muted);color:#fff;font-size:.7rem;padding:2px 8px;border-radius:10px;font-weight:600;">${tasks.length}</span>
              </div>
              <div class="crm-tasks" style="display:flex;flex-direction:column;gap:12px;min-height:60px;" id="crm-column-${id}">
                ${tasks.length === 0 ? '<div style="color:var(--muted);text-align:center;padding:40px 10px;font-style:italic;">Немає завдань</div>' : ''}
                ${tasks.map(task => {
                  const priorityColor = priorityColors[task.priority || 'medium'] || '#6c757d';
                  const priorityLabel = priorityLabels[task.priority || 'medium'] || task.priority;
                  const typeLabel = typeLabels[task.type || 'task'] || task.type;
                  const typeIcon = iconMap[task.type || 'task'] || '📋';
                  const created = new Date(task.createdAt).toLocaleDateString('uk-UA');
                  const labels = task.labels || [];
                  const commentsCount = task.comments?.length || 0;
                  
                  return `
                    <div class="crm-task" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;cursor:grab;" 
                         draggable="true" data-id="${task.id}" data-column="${task.column}"
                         ondragstart="event.dataTransfer.setData('text/plain','${task.id}');event.target.style.opacity='.5';"
                         ondragend="event.target.style.opacity='1';"
                         ondragover="event.preventDefault();"
                         ondrop="crmDropTask(event,'${id}');">
                      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
                        <span style="font-family:monospace;font-size:.7rem;color:var(--muted);flex-shrink:0;">${task.id}</span>
                        <span style="font-weight:600;font-size:.95rem;flex:1;">${ZAP.utils.esc(task.title)}</span>
                        <span style="font-size:.65rem;padding:2px 6px;border-radius:4px;font-weight:600;background:${priorityColor};color:#fff;">${priorityLabel}</span>
                        <span style="font-size:.65rem;padding:2px 6px;border-radius:4px;font-weight:500;" title="${typeLabel}">${typeIcon}</span>
                      </div>
                      ${task.assignee ? `<div style="display:flex;align-items:center;gap:5px;font-size:.8rem;color:var(--muted);margin-bottom:8px;">👤 ${ZAP.utils.esc(task.assignee)}</div>` : ''}
                      ${task.description ? `<div style="font-size:.85rem;color:var(--muted);line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${ZAP.utils.esc(task.description)}</div>` : ''}
                      <div style="display:flex;align-items:center;gap:10px;font-size:.7rem;color:var(--muted);">
                        <span>📅 ${created}</span>
                        ${labels.length > 0 ? labels.map(l => `<span style="background:#e9ecef;color:var(--text);padding:1px 6px;border-radius:4px;font-size:.65rem;">${ZAP.utils.esc(l)}</span>`).join('') : ''}
                        ${commentsCount > 0 ? `<span>💬 ${commentsCount}</span>` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="margin-top:20px;text-align:center;color:var(--muted);font-size:.85rem;">
        💡 Перетягніть картки між колонками для зміни статусу
      </div>
      
      <script>
        function crmDropTask(e, columnId) {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('text/plain');
          if (!taskId) return;
          
          fetch('data/tasks.json')
            .then(r => r.json())
            .then(data => {
              const task = data.tasks.find(t => t.id === taskId);
              if (task) {
                task.column = columnId;
                task.status = columnId;
                task.updatedAt = new Date().toISOString();
                
                // Update stats
                data.lastUpdated = new Date().toISOString();
                data.stats = {
                  total: data.tasks.length,
                  byStatus: {},
                  byPriority: {},
                  byAssignee: {}
                };
                data.tasks.forEach(t => {
                  data.stats.byStatus[t.column || t.status] = (data.stats.byStatus[t.column || t.status] || 0) + 1;
                  data.stats.byPriority[t.priority] = (data.stats.byPriority[t.priority] || 0) + 1;
                  if (t.assignee) {
                    data.stats.byAssignee[t.assignee] = (data.stats.byAssignee[t.assignee] || 0) + 1;
                  }
                });
                
                // For now, just reload the page since we can't save to filesystem
                // In production, you would POST to a server endpoint
                alert('Зміни буде збережено після оновлення сторінки. Файл: data/tasks.json');
                console.log('Updated CRM data:', data);
                ZAP.router.go('crm');
              }
            });
        }
        
        // Allow drop
        document.querySelectorAll('.crm-column').forEach(col => {
          col.addEventListener('dragover', e => e.preventDefault());
        });
      </script>
      `;
    } catch (e) {
      console.error('CRM Error:', e);
      return `
        <h1 class="page-title">🎯 CRM System</h1>
        <div style="text-align:center;padding:60px;color:var(--muted);">
          <div style="font-size:2rem;margin-bottom:16px;">⚠️</div>
          <p>Не вдалося завантажити дані CRM</p>
          <p style="font-size:.85rem;margin-top:8px;">Файл <code>data/tasks.json</code> відсутній або пошкоджений</p>
        </div>
      `;
    }
  }

  // ── Update unread count periodically ──
  async function updateUnreadCount() {
    const user = ZAP.auth.getUser();
    if (!user) { unreadCount = 0; return; }
    unreadCount = await ZAP.notifications.getUnreadCount(user.uid);
  }

  // ── Task 4: Delete a notification inline without full re-render ──
  async function deleteNotification(notifId, btn) {
    const user = ZAP.auth.getUser();
    if (!user || !notifId) return;
    // Animate out
    const item = btn.closest('.notif-item');
    if (item) {
      item.style.transition = 'opacity 0.2s, transform 0.2s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      setTimeout(() => item.remove(), 220);
    }
    await ZAP.notifications.deleteNotification(user.uid, notifId);
    await updateUnreadCount();
    // Re-render topbar/bottomnav badge without full page reload
    const badge = document.querySelector('.notif-badge');
    if (badge) badge.textContent = unreadCount > 0 ? unreadCount : '';
    if (unreadCount === 0 && badge) badge.remove();
  }

  // ── Init ──
  ZAP.render = render;
  ZAP.app = { deleteNotification };

  ZAP.auth.onAuthReady(async (user) => {
    authReady = true;
    if (user) {
      await updateUnreadCount();
      // Periodic unread count update
      setInterval(updateUnreadCount, 30000);
      
      // Presence heartbeat: update lastSeen every 45s
      setInterval(() => {
        const u = ZAP.auth.getUser();
        if (u && ZAP.dbRef) {
          ZAP.dbRef.ref('users/' + u.uid + '/lastSeen').set(Date.now()).catch(() => {});
        }
      }, 45000);

      // Start real-time notification listener with popup
      ZAP.notifications.listenNotifications(user.uid, (notif) => {
        showNotifPopup(notif);
      });
      // Request push permission
      ZAP.notifications.requestPushPermission();

      // ── Task 3: Real-time ban status listener ──
      // Watch banned/bannedUntil fields — if admin bans while user is online,
      // they immediately lose access without needing a page reload.
      if (ZAP.dbRef) {
        ZAP.dbRef.ref('users/' + user.uid + '/banned').on('value', snap => {
          const profile = ZAP.auth.getProfile();
          if (!profile) return;
          const newBanned = snap.val();
          if (newBanned === true && !profile.banned) {
            // User just got banned — re-fetch full profile to get bannedUntil, then re-render
            ZAP.dbRef.ref('users/' + user.uid).once('value', fullSnap => {
              if (fullSnap.exists()) {
                const updated = fullSnap.val();
                profile.banned = updated.banned;
                profile.bannedUntil = updated.bannedUntil || null;
              } else {
                profile.banned = true;
              }
              ZAP.render();
            });
          } else if (newBanned === false && profile.banned) {
            // User got unbanned — restore access
            profile.banned = false;
            profile.bannedUntil = null;
            ZAP.render();
          }
        });
      }
    }
    render();
  });
})();
