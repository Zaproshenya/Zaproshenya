/* ═══════════════════════════════════════════════════════
   Page — Admin Dashboard
   ═══════════════════════════════════════════════════════ */

(function () {
  let stats = null;
  let users = [];
  let reports = [];
  let supportTickets = [];
  let invites = [];
  let loading = true;
  let dashTab = 'overview'; // 'overview' | 'users' | 'reports' | 'support' | 'moderation'
  let userSearch = '';
  let userPage = 0;
  let inviteSearch = '';
  let invitePage = 0;
  let _loadingGuard = false;
  let loadingError = false;
  let _loaded = false;
  const PAGE_SIZE = 15;
  const INVITE_PAGE_SIZE = 30;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  async function load() {
    console.log('[DASH] load() start', Date.now(), 'lastPage tracker:', window._lastDashPage);
    if (!ZAP.auth.isAdmin() && !ZAP.auth.isModerator()) {
      ZAP.router.go('home');
      return;
    }
    if (_loadingGuard) { console.log('[DASH] load() skipped — already loading'); return; }
    _loadingGuard = true;
    loading = true;
    loadingError = false;

    const timeout = setTimeout(function () {
      console.warn('[DASH] load() TIMEOUT — 15s passed, showing retry');
      loading = false;
      _loadingGuard = false;
      loadingError = true;
      ZAP.render();
    }, 15000);

    try {
      const data = await ZAP.db.getStats();
      clearTimeout(timeout);
      console.log('[DASH] getStats done, users:', (data.users || []).length, 'invites:', (data.personalInvites || []).length, 'groups:', (data.groupInvites || []).length);
      stats = data;
      users = data.users || [];
      reports = await ZAP.db.getReports();
      supportTickets = await ZAP.db.getSupportTickets();
      console.log('[DASH] reports & support done:', reports.length, supportTickets.length);
      invites = (data.personalInvites || []).concat(data.groupInvites || [])
        .sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
      _loaded = true;
      console.log('[DASH] load() complete, total invites:', invites.length, Date.now());
    } catch (e) {
      clearTimeout(timeout);
      console.warn('[DASH] load() error:', e);
    } finally {
      clearTimeout(timeout);
      loading = false;
      _loadingGuard = false;
    }
  }

  function render() {
    const { icon } = ZAP.utils;
    if (!ZAP.auth.isAdmin() && !ZAP.auth.isModerator()) {
      return `<div class="wrap"><div class="empty">
        <div class="empty-icon">${icon('lock', 20)}</div>
        <p style="font-style:italic;font-size:1.05rem">Доступ заборонено</p>
      </div></div>`;
    }

    // Task 5: Moderators cannot access the overview tab — redirect them to users or reports
    const isModeOnly = ZAP.auth.isModerator() && !ZAP.auth.isAdmin();
    if (isModeOnly && dashTab === 'overview') {
      dashTab = 'users';
    }

    return `
    <div class="app-with-sidebar">
      ${renderSidebar()}
      <div class="sidebar-content">
        <div class="wrap">
          ${loading ? renderSkeleton() : loadingError ? renderLoadError() : renderDashContent()}
        </div>
      </div>
    </div>`;
  }

  function renderSidebar() {
    const { icon } = ZAP.utils;
    const profile = ZAP.auth.getProfile();
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const pendingSupport = supportTickets.filter(t => t.status === 'pending').length;
    const isModeOnly = ZAP.auth.isModerator() && !ZAP.auth.isAdmin();

    return `
    <aside class="sidebar" id="dash-sidebar">
      <div class="sidebar-logo">Запрошення ✦</div>

      <div class="sidebar-section">Меню</div>
      ${!isModeOnly ? `
      <button class="sidebar-item ${dashTab === 'overview' ? 'active' : ''}"
        onclick="ZAP.pages.dashboard.setTab('overview')">
        <span class="sidebar-item-icon">${icon('chart-bar', 20)}</span> Огляд
      </button>
      ` : ''}
      <button class="sidebar-item ${dashTab === 'users' ? 'active' : ''}"
        onclick="ZAP.pages.dashboard.setTab('users')">
        <span class="sidebar-item-icon">${icon('users', 20)}</span> Користувачі
      </button>
      <button class="sidebar-item ${dashTab === 'moderation' ? 'active' : ''}"
        onclick="ZAP.pages.dashboard.setTab('moderation')">
        <span class="sidebar-item-icon">${icon('shield', 20)}</span> Модерація
      </button>
      <button class="sidebar-item ${dashTab === 'reports' ? 'active' : ''}"
        onclick="ZAP.pages.dashboard.setTab('reports')">
        <span class="sidebar-item-icon">${icon('warning', 20)}</span> Скарги
        ${pendingReports > 0 ? `<span class="notif-badge" style="position:static;margin-left:auto">${pendingReports}</span>` : ''}
      </button>
      <button class="sidebar-item ${dashTab === 'support' ? 'active' : ''}"
        onclick="ZAP.pages.dashboard.setTab('support')">
        <span class="sidebar-item-icon">${icon('lifebuoy', 20)}</span> Підтримка
        ${pendingSupport > 0 ? `<span class="notif-badge" style="position:static;margin-left:auto">${pendingSupport}</span>` : ''}
      </button>

      <div class="sidebar-section">Навігація</div>
      <button class="sidebar-item" onclick="ZAP.router.go('home')">
        <span class="sidebar-item-icon">${icon('house', 20)}</span> Головна
      </button>
      <button class="sidebar-item" onclick="ZAP.router.go('profile')">
        <span class="sidebar-item-icon">${icon('gear', 20)}</span> Профіль
      </button>

      <div style="margin-top:auto;padding:16px;border-top:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;align-items:center;gap:10px">
          ${ZAP.utils.avatarHTML(profile, 'sm')}
          <div>
            <div style="color:#fff;font-size:.85rem;font-weight:500">${ZAP.utils.esc(profile?.name)}</div>
            <div style="font-size:.7rem;color:rgba(255,255,255,.4)">${ZAP.utils.roleBadge(profile?.role)}</div>
          </div>
        </div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="ZAP.pages.dashboard.toggleSidebar()"></div>`;
  }

  function renderLoadError() {
    const { icon } = ZAP.utils;
    return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:16px;color:var(--red)">${icon('warning-circle', 48)}</div>
      <h2 style="font-family:var(--font-heading);font-weight:400;margin-bottom:8px">Не вдалося завантажити дані</h2>
      <p style="color:var(--muted);margin-bottom:24px;max-width:320px">
        Перевірте з'єднання з інтернетом або спробуйте ще раз.
      </p>
      <button class="btn btn-dark" onclick="ZAP.pages.dashboard.retryLoad()">${icon('arrows-clockwise', 16)} Спробувати ще раз</button>
    </div>`;
  }

  function renderSkeleton() {
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div class="skeleton-line w-1-4" style="height:28px"></div>
      <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
    </div>
    <div class="stats-grid">
      ${[1,2,3,4,5].map(() => `
        <div class="stat-card">
          <div class="skeleton-circle" style="width:44px;height:44px;margin-bottom:14px"></div>
          <div class="skeleton-line w-1-2" style="margin-bottom:6px;height:28px"></div>
          <div class="skeleton-line w-3-4" style="height:12px"></div>
        </div>
      `).join('')}
    </div>
    <div class="chart-grid">
      <div class="chart-card">
        <div class="skeleton-line w-1-4" style="margin-bottom:18px;height:16px"></div>
        <div class="skeleton" style="width:100%;height:220px;border-radius:var(--radius-sm)"></div>
      </div>
      <div class="chart-card">
        <div class="skeleton-line w-1-4" style="margin-bottom:18px;height:16px"></div>
        <div class="skeleton" style="width:100%;height:220px;border-radius:50%"></div>
      </div>
    </div>
    <div class="table-card">
      <div class="skeleton-line w-1-4" style="margin-bottom:16px;height:16px"></div>
      ${[1,2,3,4,5].map(() => `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)">
          <div class="skeleton-circle" style="width:36px;height:36px;flex-shrink:0"></div>
          <div style="flex:1">
            <div class="skeleton-line w-1-2" style="margin-bottom:6px;height:14px"></div>
            <div class="skeleton-line w-1-4" style="height:12px"></div>
          </div>
          <div class="skeleton" style="width:80px;height:24px;border-radius:var(--radius-sm)"></div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderDashContent() {
    if (dashTab === 'users') return renderUsers();
    if (dashTab === 'reports') return renderReports();
    if (dashTab === 'support') return renderSupport();
    if (dashTab === 'moderation') return renderModeration();
    return renderOverview();
  }

  // ═══════════════════════════════════════════════════════
  // Overview
  // ═══════════════════════════════════════════════════════
  function renderOverview() {
    const { icon } = ZAP.utils;
    const onlineUsers = users.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 2 * 60 * 1000));
    const onlineCount = onlineUsers.length;

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="page-title" style="margin-bottom:0">Дашборд</h1>
      <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()">${icon('list', 20)}</button>
    </div>

    <!-- Stats cards -->
    <div class="stats-grid">
      ${statCard(icon('user', 20), 'users', 'Користувачі', stats?.totalUsers || 0)}
      ${statCard('<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2d7a4f"></span>', 'online', 'Онлайн зараз', onlineCount)}
      ${statCard(icon('paper-plane-tilt', 20), 'invites', 'Запрошення', stats?.totalInvites || 0)}
      ${statCard(icon('check-circle', 20), 'accepted', 'Прийняті', stats?.acceptedInvites || 0)}
      ${statCard(icon('chart-bar', 20), 'active', 'Активні (7д)', stats?.activeUsers || 0)}
    </div>

    <!-- Charts -->
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card-title">
          <h2>Активність</h2>
        </div>
        <canvas id="chart-activity" class="chart-canvas"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">
          <h2>Ролі</h2>
        </div>
        <canvas id="chart-roles" class="chart-canvas"></canvas>
      </div>
    </div>

    <!-- Advanced Stats Grid -->
    <div class="grid2" style="margin-bottom: 28px;">
      <!-- System Roles & Bans -->
      <div class="table-card">
        <div class="table-header">
          <h2>Аудиторія та безпека</h2>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('crown', 20)} Засновники</span>
            <span style="font-weight:600;color:var(--ink)">${stats?.roleCounts?.founder || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('wrench', 14)} Тех-адміністратори</span>
            <span style="font-weight:600;color:var(--ink)">${stats?.roleCounts?.techAdmin || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('shield-check', 20)} Модератори</span>
            <span style="font-weight:600;color:var(--ink)">${stats?.roleCounts?.moderator || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('users', 20)} Звичайні користувачі</span>
            <span style="font-weight:600;color:var(--ink)">${stats?.roleCounts?.user || 0}</span>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--red);font-weight:500">${icon('prohibit', 20)} Заблоковані користувачі</span>
            <span style="font-weight:600;color:var(--red)">${stats?.bannedCount || 0}</span>
          </div>
        </div>
      </div>

      <!-- Invite Statuses & Social Connections -->
      <div class="table-card">
        <div class="table-header">
          <h2>Статуси зустрічей та взаємодія</h2>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('check-circle', 20)} Прийняті запрошення</span>
            <span style="font-weight:600;color:var(--green)">${stats?.acceptedInvites || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('x-circle', 20)} Відхилені запрошення</span>
            <span style="font-weight:600;color:var(--red)">${stats?.declinedInvites || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('calendar-blank', 20)} Перенесені події</span>
            <span style="font-weight:600;color:var(--gold)">${stats?.rescheduleInvites || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--muted)">${icon('clock', 20)} В очікуванні відповіді</span>
            <span style="font-weight:600;color:var(--ink)">
              ${(stats?.totalInvites || 0) - (stats?.acceptedInvites || 0) - (stats?.declinedInvites || 0) - (stats?.rescheduleInvites || 0)}
            </span>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:space-between;font-size:.9rem">
            <span style="color:var(--ink);font-weight:500">${icon('users', 14)} Всього зв'язків дружби</span>
            <span style="font-weight:600;color:var(--ink)">${stats?.totalFriendsConnections || 0}</span>
          </div>
        </div>
      </div>

      <!-- Moderation Reports Breakdown -->
      <div class="table-card" style="grid-column: span 2;">
        <div class="table-header">
          <h2>Статистика модерації скарг</h2>
        </div>
        <div style="padding: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
          <div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--muted)">${stats?.reportsCount?.total || 0}</div>
            <div style="font-size:.8rem;color:var(--muted)">Всього скарг</div>
          </div>
          <div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--red)">${stats?.reportsCount?.pending || 0}</div>
            <div style="font-size:.8rem;color:var(--red)">Очікують розгляду</div>
          </div>
          <div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--green)">${stats?.reportsCount?.resolved || 0}</div>
            <div style="font-size:.8rem;color:var(--green)">Вирішено (Схвалено)</div>
          </div>
          <div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--gold)">${stats?.reportsCount?.dismissed || 0}</div>
            <div style="font-size:.8rem;color:var(--gold)">Відхилено</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Online users and their actions -->
    <div class="table-card" style="margin-bottom: 28px;">
      <div class="table-header">
        <h2>У мережі зараз (${onlineCount})</h2>
      </div>
      ${onlineCount === 0 ? `
        <div style="text-align:center;padding:24px 0;color:var(--muted);font-style:italic;font-size:0.95rem">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2d7a4f"></span> Наразі немає користувачів у мережі
        </div>
      ` : `
        <div class="table-scroll-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Користувач</th><th>Логін</th><th>Роль</th><th>Поточна дія</th>
          </tr></thead>
          <tbody>
            ${onlineUsers.map(u => `
              <tr>
                <td style="display:flex;align-items:center;gap:8px">
                  ${ZAP.utils.avatarHTML(u, 'sm')}
                  <span style="font-weight:500">${ZAP.utils.esc(u.name)}</span>
                </td>
                <td style="color:var(--muted)">@${ZAP.utils.esc(u.login)}</td>
                <td>${ZAP.utils.roleBadge(u.role)}</td>
                <td style="font-weight:500;color:var(--gold)">
                  <span class="fb-dot ok" style="margin-right:6px"></span>
                  ${ZAP.utils.esc(u.currentAction || 'Переглядає сайт')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>

    <!-- Extra Stats Section -->
    <div class="grid2" style="margin-bottom: 28px;">
      <!-- Invites Breakdown -->
      <div class="table-card">
        <div class="table-header">
          <h2>Формати запрошень</h2>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:6px">
              <span>${icon('user', 20)} Персональні запрошення</span>
              <span style="font-weight:600">${stats?.personalInvitesCount || 0}</span>
            </div>
            <div style="background:var(--border);border-radius:4px;height:8px;overflow:hidden">
              <div style="background:var(--ink);height:100%;width:${stats?.totalInvites ? ((stats.personalInvitesCount || 0) / stats.totalInvites) * 100 : 0}%"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:6px">
              <span>${icon('users', 20)} Групові події</span>
              <span style="font-weight:600">${stats?.groupInvitesCount || 0}</span>
            </div>
            <div style="background:var(--border);border-radius:4px;height:8px;overflow:hidden">
              <div style="background:var(--gold);height:100%;width:${stats?.totalInvites ? ((stats.groupInvitesCount || 0) / stats.totalInvites) * 100 : 0}%"></div>
            </div>
          </div>
          <div style="border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;">
            <div style="display:flex;justify-content:space-between;font-size:.9rem;color:var(--muted)">
              <span>Середня активність:</span>
              <span style="font-weight:500;color:var(--ink)">
                ${stats?.totalUsers ? (stats.totalInvites / stats.totalUsers).toFixed(1) : 0} запр./користувача
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Popular Types -->
      <div class="table-card">
        <div class="table-header">
          <h2>Найпопулярніші події</h2>
        </div>
        <div style="padding: 16px 20px; display: flex; flex-direction: column; gap: 10px;">
          ${Object.entries(stats?.typeCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([type, count]) => {
              const t = ZAP.utils.TYPE_MAP[type] || ZAP.utils.TYPE_MAP.other || { e: '✨', l: 'Інше' };
              const percent = stats?.totalInvites ? (count / stats.totalInvites) * 100 : 0;
              return `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:4px">
                  <span>${t.e} ${t.l}</span>
                  <span style="color:var(--muted)">${count} (${percent.toFixed(0)}%)</span>
                </div>
                <div style="background:var(--border);border-radius:4px;height:6px;overflow:hidden">
                  <div style="background:var(--green);height:100%;width:${percent}%"></div>
                </div>
              </div>`;
            }).join('') || `<div style="text-align:center;padding:24px 0;color:var(--muted);font-style:italic">Немає створених подій</div>`}
        </div>
      </div>
    </div>

    <!-- Recent users -->
    <div class="table-card">
      <div class="table-header">
        <h2>Останні реєстрації</h2>
      </div>
      <div class="table-scroll-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Користувач</th><th>Логін</th><th>Роль</th><th>ID користувача</th><th>Зареєстрований</th><th>Остання активність</th><th>Статус</th>
        </tr></thead>
        <tbody>
          ${users.slice(0, 5).map(u => {
            const statusBadge = u.banned
              ? `<span class="badge badge-declined">${icon('prohibit', 20)} Бан</span>`
              : `<span class="badge badge-accepted">${icon('check-circle',16)} Активний</span>`;

            return `
            <tr>
              <td style="display:flex;align-items:center;gap:8px">
                ${ZAP.utils.avatarHTML(u, 'sm')}
                <span style="font-weight:500">${ZAP.utils.esc(u.name)}</span>
              </td>
              <td style="color:var(--muted)">@${ZAP.utils.esc(u.login)}</td>
              <td>${ZAP.utils.roleBadge(u.role)}</td>
              <td style="font-family:monospace;font-size:.82rem;color:var(--muted)">${ZAP.utils.esc(u.uniqueId || '—')}</td>
              <td style="font-size:.82rem;color:var(--muted)">${ZAP.utils.timeAgo(u.createdAt)}</td>
              <td style="font-size:.82rem;color:var(--muted)">${u.lastSeen ? ZAP.utils.timeAgo(u.lastSeen) : 'Ніколи'}</td>
              <td>${statusBadge}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      </div>
    </div>`;
  }

  function statCard(icon, cls, label, value) {
    return `
    <div class="stat-card">
      <div class="stat-icon ${cls}">${icon}</div>
      <div class="stat-value">${value.toLocaleString()}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════
  // Users management
  // ═══════════════════════════════════════════════════════
  function renderUsers() {
    const { icon } = ZAP.utils;
    const filtered = userSearch
      ? users.filter(u =>
          u.login.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.name.toLowerCase().includes(userSearch.toLowerCase()))
      : users;

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);
    const myProfile = ZAP.auth.getProfile();
    const myRank = getRank(myProfile?.role);
    const isModeOnly = ZAP.auth.isModerator() && !ZAP.auth.isAdmin();

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="page-title" style="margin-bottom:0">Користувачі</h1>
      <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()">${icon('list', 20)}</button>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h2>Всього: ${filtered.length}</h2>
        <input class="table-search" placeholder="Пошук по логіну або імені..."
          value="${ZAP.utils.esc(userSearch)}"
          oninput="ZAP.pages.dashboard.searchUsers(this.value)"
          aria-label="Пошук користувачів"/>
      </div>

      <div class="table-scroll-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Користувач</th><th>Логін</th><th>Роль</th><th>Зареєстрований</th><th>Активність</th><th>Статус</th><th>Дії</th>
        </tr></thead>
        <tbody>
          ${paged.map(u => {
            const targetRank = getRank(u.role);
            const canBan = myRank > targetRank; // Task 6: can only ban lower ranks

            // Task 1: Build ban status text
            let banStatusText = '';
            if (u.banned) {
              if (u.bannedUntil) {
                const msLeft = u.bannedUntil - Date.now();
                if (msLeft > 0) {
                  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                  const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
                  banStatusText = daysLeft > 1 ? `${icon('prohibit', 20)} Бан · ${daysLeft} дн.` : `${icon('prohibit', 20)} Бан · ${hoursLeft} год.`;
                } else {
                  ZAP.db.banUser(u.uid, false);
                  u.banned = false;
                  u.bannedUntil = null;
                }
              } else {
                banStatusText = `${icon('prohibit', 20)} Назавжди`;
              }
            }

            return `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:8px;cursor:pointer"
                  onclick="ZAP.router.go('user-profile',{uid:'${u.uid}'})">
                  ${ZAP.utils.avatarHTML(u, 'sm')}
                  <div>
                    <div style="font-weight:500">${ZAP.utils.esc(u.name)}</div>
                    <div style="font-size:.72rem;color:var(--muted)">${ZAP.utils.esc(u.uniqueId)}</div>
                  </div>
                </div>
              </td>
              <td style="color:var(--muted);font-size:.88rem">@${ZAP.utils.esc(u.login)}</td>
              <td>
                <select class="role-select" onchange="ZAP.pages.dashboard.changeRole('${u.uid}',this.value)"
                  aria-label="Роль користувача ${ZAP.utils.esc(u.name)}"
                  ${!ZAP.auth.isAdmin() ? 'disabled' : ''}>
                  ${['user','moderator','tech-admin','founder'].map(r =>
                    `<option value="${r}" ${u.role === r ? 'selected' : ''}>${
                      {user:'Користувач',moderator:'Модератор','tech-admin':'Тех-адмін',founder:'Засновник'}[r]
                    }</option>`
                  ).join('')}
                </select>
              </td>
              <td style="font-size:.82rem;color:var(--muted)">${ZAP.utils.timeAgo(u.createdAt)}</td>
              <td style="font-size:.82rem;color:var(--muted)">${u.lastSeen ? ZAP.utils.timeAgo(u.lastSeen) : 'Ніколи'}</td>
              <td>
                ${u.banned
                  ? `<span class="badge badge-declined" title="${u.bannedUntil ? new Date(u.bannedUntil).toLocaleString('uk-UA') : 'Перманентно'}">${banStatusText}</span>`
                  : `<span class="badge badge-accepted">${icon('check-circle',16)} Активний</span>`}
              </td>
              <td>
                ${u.banned
                  ? (canBan ? `<button class="btn btn-sm btn-gold" onclick="ZAP.pages.dashboard.toggleBan('${u.uid}',false)">Розбанити</button>` : '<span style="color:var(--muted);font-size:.8rem">—</span>')
                  : (canBan ? `<button class="btn btn-sm btn-outline" style="color:var(--red);border-color:var(--red)"
                      onclick="ZAP.pages.dashboard.toggleBan('${u.uid}',true)">Бан</button>` : '<span style="color:var(--muted);font-size:.8rem">—</span>')}
              </td>
            </tr>`; }).join('')}
        </tbody>
      </table>
      </div>

      ${totalPages > 1 ? `
        <div class="pagination">
          ${Array.from({length: totalPages}, (_, i) => `
            <button class="page-btn ${i === userPage ? 'active' : ''}"
              onclick="ZAP.pages.dashboard.setUserPage(${i})">${i + 1}</button>
          `).join('')}
        </div>
      ` : ''}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════
  // Reports / Complaints
  // ═══════════════════════════════════════════════════════
  function renderReports() {
    const { icon } = ZAP.utils;
    const pending = reports.filter(r => r.status === 'pending');
    const resolved = reports.filter(r => r.status !== 'pending');

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="page-title" style="margin-bottom:0">Скарги</h1>
      <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()">${icon('list', 20)}</button>
    </div>

    ${pending.length > 0 ? `
      <div class="dash-section">
        <div class="dash-section-title">Очікують розгляду (${pending.length})</div>
        ${pending.map(r => renderReportCard(r)).join('')}
      </div>
    ` : `
      <div style="background:var(--green-bg);border-radius:12px;padding:18px;margin-bottom:24px;text-align:center">
        <p style="color:var(--green);font-size:.95rem">${icon('check-circle',16)} Немає нових скарг</p>
      </div>
    `}

    ${resolved.length > 0 ? `
      <div class="dash-section">
        <div class="dash-section-title">Розглянуті (${resolved.length})</div>
        ${resolved.slice(0, 20).map(r => renderReportCard(r, true)).join('')}
      </div>
    ` : ''}`;
  }

  function renderReportCard(r, isResolved) {
    const { icon } = ZAP.utils;
    let invitePreview = '';
    
    // Helper to find profile in loaded users array
    const getUserProfile = (uid) => users.find(u => u.uid === uid) || null;

    if (r.targetContent) {
      const tc = r.targetContent;
      const dateText = tc.date || 'Не вказано';
      const timeText = tc.time ? `, ${tc.time}` : '';
      const placeText = tc.place ? ` · ${icon('map-pin', 20)} ${ZAP.utils.esc(tc.place)}` : '';

      const creatorUid = tc.creatorUid || '';
      const recipientUid = tc.recipientUid || (r.reporterUid && r.targetType === 'invite' ? r.reporterUid : '');

      const creatorProfile = getUserProfile(creatorUid);
      const recipientProfile = getUserProfile(recipientUid);

      const creatorIdText = creatorProfile 
        ? ` (<strong>${ZAP.utils.esc(creatorProfile.uniqueId)}</strong>, @${ZAP.utils.esc(creatorProfile.login)})`
        : (creatorUid ? ` (ID: ${ZAP.utils.esc(creatorUid)})` : '');
      const creator = tc.creatorName ? ` від <strong>${ZAP.utils.esc(tc.creatorName)}</strong>${creatorIdText}` : '';

      const toIdText = recipientProfile
        ? ` (<strong>${ZAP.utils.esc(recipientProfile.uniqueId)}</strong>, @${ZAP.utils.esc(recipientProfile.login)})`
        : (recipientUid ? ` (ID: ${ZAP.utils.esc(recipientUid)})` : '');
      const toText = tc.to ? ` для <strong>${ZAP.utils.esc(tc.to)}</strong>${toIdText}` : ' (Групове)';

      const msgTrunc = tc.msg ? ZAP.utils.truncate(tc.msg, 80) : null;
      let msgHtml = '';
      if (msgTrunc && msgTrunc.id) {
        msgHtml = `<p class="cip-msg">« ${msgTrunc.html} »</p>${ZAP.utils.truncateBtn(msgTrunc.id)}`;
      } else if (msgTrunc) {
        msgHtml = `<p class="cip-msg">« ${msgTrunc.html} »</p>`;
      } else {
        msgHtml = '<p class="cip-msg" style="font-style:italic;color:var(--muted)">Без тексту повідомлення</p>';
      }

      invitePreview = `
        <div class="complaint-invite-preview">
          <div class="cip-header">
            <span>${icon('clipboard-text', 14)} Вміст запрошення${toText}${creator}</span>
          </div>
          <div class="cip-content">
            ${msgHtml}
            <div class="cip-details" style="font-size:.78rem;color:var(--muted);margin-top:5px">
              ${icon('calendar-blank', 20)} ${ZAP.utils.esc(dateText)}${timeText}${placeText}
            </div>
          </div>
        </div>
      `;
    }

    const reporterProfile = getUserProfile(r.reporterUid);
    const reporterIdText = reporterProfile 
      ? ` (<strong>${ZAP.utils.esc(reporterProfile.uniqueId)}</strong>, @${ZAP.utils.esc(reporterProfile.login)})`
      : (r.reporterUid ? ` (ID: ${ZAP.utils.esc(r.reporterUid)})` : '');

    return `
    <div class="complaint-card ${isResolved ? 'resolved' : ''}">
      <div class="complaint-icon">${icon('warning', 20)}</div>
      <div class="complaint-body">
        <div class="complaint-reason">${ZAP.utils.esc(r.reason)}</div>
        <div class="complaint-meta">
          Від: ${ZAP.utils.esc(r.reporterName || 'Анонім')}${reporterIdText} ·
          Тип: ${r.targetType === 'invite' ? `${icon('paper-plane-tilt', 20)} Запрошення` : `${icon('users', 20)} Групове`} ·
          ${ZAP.utils.timeAgo(r.createdAt)}
          ${(() => {
            if (!r.comment) return '';
            const ct = ZAP.utils.truncate(r.comment, 80);
            if (ct.id) return `<br><span class="cmt-line">${icon('chat-circle-dots', 20)} ${ct.html}</span> ${ZAP.utils.truncateBtn(ct.id)}`;
            return `<br>${icon('chat-circle-dots', 20)} ${ct.html}`;
          })()}
        </div>
        ${invitePreview}
        ${!isResolved ? `
          <div class="complaint-actions">
            <button class="btn btn-sm btn-red"
              onclick="ZAP.pages.dashboard.resolveReport('${r.id}','resolved')">
              ${icon('check',14)} Вирішено
            </button>
            <button class="btn btn-sm btn-outline"
              onclick="ZAP.pages.dashboard.resolveReport('${r.id}','dismissed')">
              Відхилити
            </button>
            ${r.targetId ? `
              <button class="btn btn-sm btn-outline"
                onclick="ZAP.pages.dashboard.deleteReportedInvite('${r.targetId}','${r.targetType}','${r.id}')">
                ${icon('trash', 20)} Видалити запрошення
              </button>
            ` : ''}
          </div>
        ` : `
          <div style="margin-top:6px;font-size:.78rem;color:var(--muted)">
            ${r.status === 'resolved' ? `${icon('check',14)} Вирішено` : `${icon('x',14)} Відхилено`}
            ${r.resolvedAt ? ' · ' + ZAP.utils.timeAgo(r.resolvedAt) : ''}
          </div>
        `}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════
  // Support Tickets — Full Chat System
  // ═══════════════════════════════════════════════════════
  let _dashOpenTicket = null;    // ticket object currently open in chat
  let _dashChatMessages = [];    // messages for current open ticket

  function renderSupport() {
    if (_dashOpenTicket) return renderSupportChat();
    return renderSupportList();
  }

  function renderSupportList() {
    const { icon } = ZAP.utils;
    const open = supportTickets.filter(t => t.status === 'open');
    const resolved = supportTickets.filter(t => t.status !== 'open');
    const typeLabel = { bug: '🐛 Баг', idea: '💡 Ідея', question: '❓ Питання', other: '💬 Інше' };

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="page-title" style="margin-bottom:0">Підтримка</h1>
      <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()">${icon('list', 20)}</button>
    </div>

    ${open.length === 0 ? `
      <div style="background:var(--green-bg);border-radius:12px;padding:18px;margin-bottom:24px;text-align:center">
        <p style="color:var(--green);font-size:.95rem">${icon('check-circle',16)} Немає відкритих звернень</p>
      </div>
    ` : `
      <div class="dash-section">
        <div class="dash-section-title">Відкриті (${open.length})</div>
        ${open.map(t => renderSupportTicketRow(t)).join('')}
      </div>
    `}

    ${resolved.length > 0 ? `
      <div class="dash-section" style="margin-top:20px">
        <div class="dash-section-title">Завершені (${resolved.length})</div>
        ${resolved.slice(0, 30).map(t => renderSupportTicketRow(t, true)).join('')}
      </div>
    ` : ''}`;
  }

  function renderSupportTicketRow(t, isResolved) {
    const { icon } = ZAP.utils;
    const authorProfile = users.find(u => u.uid === t.authorUid);
    const authorDisplay = authorProfile 
      ? `${ZAP.utils.esc(t.authorName)} (@${ZAP.utils.esc(authorProfile.login)})`
      : ZAP.utils.esc(t.authorName || 'Анонім');
    const typeIcons = { bug: '🐛', idea: '💡', question: '❓', other: '💬' };
    const statusColors = { open: 'var(--blue)', resolved: 'var(--green)', dismissed: 'var(--muted)' };

    return `
    <div class="complaint-card ${isResolved ? 'resolved' : ''}" 
      style="cursor:pointer;transition:box-shadow .15s" 
      onclick="ZAP.pages.dashboard.openSupportChat('${t.id}')">
      <div class="complaint-icon" style="color:var(--gold);background:rgba(212,175,55,0.1);border-color:rgba(212,175,55,0.2);font-size:1.1rem">
        ${typeIcons[t.type] || '💬'}
      </div>
      <div class="complaint-body" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px">
          <div class="complaint-reason" style="font-size:.92rem;margin-bottom:0">
            ${ZAP.utils.esc(t.subject || t.type || 'Звернення')}
          </div>
          <span style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:20px;background:rgba(${t.status==='open'?'37,99,235':'45,122,79'},.1);color:${statusColors[t.status] || 'var(--blue)'};flex-shrink:0">
            ${t.status === 'open' ? 'Відкрито' : t.status === 'resolved' ? 'Вирішено' : 'Закрито'}
          </span>
        </div>
        <div class="complaint-meta">
          Від: <strong>${authorDisplay}</strong> · 
          ${ZAP.utils.esc((t.lastMessageText || '').slice(0, 60))} · 
          ${ZAP.utils.timeAgo(t.lastMessageAt || t.createdAt)}
          ${t.unreadBySupport ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gold);margin-left:6px;vertical-align:middle"></span>` : ''}
        </div>
      </div>
      <div style="color:var(--muted);font-size:.8rem;flex-shrink:0">${icon('caret-right', 16)}</div>
    </div>`;
  }

  // ─── Chat view ───────────────────────────────────────────
  function renderSupportChat() {
    if (!_dashOpenTicket) return renderSupportList();
    const { icon } = ZAP.utils;
    const t = _dashOpenTicket;
    const me = ZAP.auth.getUser();
    const myProfile = ZAP.auth.getProfile();
    const isResolved = t.status !== 'open';
    const typeIcons = { bug: '🐛', idea: '💡', question: '❓', other: '💬' };
    const typeLabels = { bug: 'Баг / Помилка', idea: 'Ідея / Пропозиція', question: 'Питання', other: 'Інше' };

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()" style="margin-right:4px">${icon('list', 20)}</button>
        <button class="dash-chat-back" onclick="ZAP.pages.dashboard.closeSupportChat()">
          ${icon('arrow-left', 14)} Назад
        </button>
      </div>
    </div>

    <div class="dash-ticket-chat">
      <!-- Chat header -->
      <div class="dash-chat-header">
        <div style="font-size:1.5rem">${typeIcons[t.type] || '💬'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.95rem;color:var(--ink)">${ZAP.utils.esc(t.subject || 'Звернення')}</div>
          <div style="font-size:.75rem;color:var(--muted)">
            ${typeLabels[t.type] || 'Інше'} · Від: <strong>${ZAP.utils.esc(t.authorName)}</strong> · ${ZAP.utils.timeAgo(t.createdAt)}
          </div>
        </div>
        ${!isResolved ? `
          <button class="btn btn-sm" style="background:var(--green);color:#fff;border:none"
            onclick="ZAP.pages.dashboard.resolveSupportTicket('${t.id}','resolved')">
            ${icon('check', 14)} Вирішити
          </button>
          <button class="btn btn-sm btn-outline"
            onclick="ZAP.pages.dashboard.resolveSupportTicket('${t.id}','dismissed')">
            Закрити
          </button>
        ` : `
          <span style="font-size:.78rem;font-weight:600;color:var(--green)">✓ ${t.status === 'resolved' ? 'Вирішено' : 'Закрито'}</span>
        `}
      </div>

      <!-- Messages area -->
      <div class="chat-messages-area" id="dash-chat-msgs">
        ${_dashChatMessages.length === 0 
          ? `<div class="chat-loading-spinner">${ZAP.utils.spinner()}</div>`
          : _renderDashMessages(_dashChatMessages, me?.uid)
        }
      </div>

      <!-- Image preview area -->
      <div id="dash-chat-img-preview"></div>

      <!-- Input -->
      ${!isResolved ? `
        <div id="dash-chat-uploading" style="display:none" class="chat-uploading">
          ${ZAP.utils.spinner()} Завантаження...
        </div>
        <div class="chat-input-area">
          <div class="chat-input-row">
            <button class="chat-attach-btn" onclick="document.getElementById('dash-chat-file').click()" title="Прикріпити зображення">
              ${icon('paperclip', 18)}
            </button>
            <input type="file" id="dash-chat-file" accept="image/*" style="display:none"
              onchange="ZAP.pages.dashboard._dashOnImage(this.files[0])"/>
            <textarea class="chat-text-input" id="dash-chat-input"
              placeholder="Написати відповідь..."
              rows="1"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ZAP.pages.dashboard._dashSendMsg();}"
              oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
            <button class="chat-send-btn" id="dash-send-btn" onclick="ZAP.pages.dashboard._dashSendMsg()">
              ${icon('paper-plane-tilt', 18)}
            </button>
          </div>
        </div>
      ` : `
        <div class="chat-resolved-banner">
          <div class="chat-resolved-text">${icon('check-circle', 16)} Тікет закрито</div>
          <button class="chat-reopen-btn" onclick="ZAP.pages.dashboard._dashReopenTicket('${t.id}')">Відкрити знову</button>
        </div>
      `}
    </div>`;
  }

  function _renderDashMessages(messages, currentUid) {
    if (!messages || messages.length === 0) {
      return `<div class="chat-empty-state"><div class="chat-empty-icon">💬</div><div class="chat-empty-text">Повідомлень ще немає</div></div>`;
    }
    let lastDate = null;
    return messages.map(msg => {
      const isUser = msg.role === 'user';
      const d = new Date(msg.createdAt);
      const dateStr = d.toDateString();
      const today = new Date();
      let dateLabel = dateStr === today.toDateString() ? 'Сьогодні' : d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
      const dateSep = dateStr !== lastDate ? `<div class="chat-date-separator">${dateLabel}</div>` : '';
      lastDate = dateStr;
      const time = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
      const initials = (msg.name || '?').charAt(0).toUpperCase();
      const imgHtml = msg.imageUrl ? `<img src="${ZAP.utils.esc(msg.imageUrl)}" class="chat-bubble-img" onclick="window.open('${ZAP.utils.esc(msg.imageUrl)}','_blank')" alt="Зображення">` : '';
      const textHtml = msg.text ? `<div class="chat-bubble">${ZAP.utils.esc(msg.text)}</div>` : '';
      return `${dateSep}
        <div class="chat-msg ${isUser ? 'support' : 'user'}">
          <div class="chat-msg-avatar">${initials}</div>
          <div class="chat-msg-content">
            ${textHtml}${imgHtml}
            <div class="chat-msg-time">${isUser ? ZAP.utils.esc(msg.name) : 'Підтримка'} · ${time}</div>
          </div>
        </div>`;
    }).join('');
  }

  let _dashPendingImage = null;

  async function openSupportChat(ticketId) {
    const ticket = supportTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    _dashOpenTicket = ticket;
    _dashChatMessages = [];
    _dashPendingImage = null;
    if (ticket.unreadBySupport) ZAP.db.markTicketReadBySupport(ticketId).catch(() => {});
    ZAP.render();
    // Start listening
    ZAP.db.listenTicketMessages(ticketId, (msgs) => {
      _dashChatMessages = msgs;
      const area = document.getElementById('dash-chat-msgs');
      if (area) {
        area.innerHTML = _renderDashMessages(msgs, ZAP.auth.getUser()?.uid);
        area.scrollTop = area.scrollHeight;
      }
    });
  }

  function closeSupportChat() {
    if (_dashOpenTicket) {
      ZAP.db.stopListeningTicket(_dashOpenTicket.id);
      _dashOpenTicket = null;
      _dashChatMessages = [];
      _dashPendingImage = null;
    }
    ZAP.render();
  }

  function _dashOnImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      _dashPendingImage = { file, dataUrl: e.target.result };
      const wrap = document.getElementById('dash-chat-img-preview');
      if (wrap) {
        wrap.innerHTML = `<div class="chat-img-preview-wrap"><div class="chat-img-preview">
          <img src="${e.target.result}" alt="preview">
          <button class="chat-img-preview-remove" onclick="ZAP.pages.dashboard._dashRemoveImage()">×</button>
        </div></div>`;
      }
    };
    reader.readAsDataURL(file);
  }

  function _dashRemoveImage() {
    _dashPendingImage = null;
    const wrap = document.getElementById('dash-chat-img-preview');
    if (wrap) wrap.innerHTML = '';
    const inp = document.getElementById('dash-chat-file');
    if (inp) inp.value = '';
  }

  async function _dashSendMsg() {
    if (!_dashOpenTicket) return;
    const textEl = document.getElementById('dash-chat-input');
    const text = textEl?.value.trim();
    if (!text && !_dashPendingImage) return;
    const sendBtn = document.getElementById('dash-send-btn');
    if (sendBtn) sendBtn.disabled = true;
    const profile = ZAP.auth.getProfile();
    const user = ZAP.auth.getUser();
    try {
      let imageUrl = null;
      if (_dashPendingImage) {
        const up = document.getElementById('dash-chat-uploading');
        if (up) up.style.display = 'flex';
        imageUrl = await ZAP.db.uploadTicketImage(_dashOpenTicket.id, _dashPendingImage.file);
        if (up) up.style.display = 'none';
        _dashRemoveImage();
      }
      await ZAP.db.sendTicketMessage(_dashOpenTicket.id, {
        uid: user.uid,
        name: profile.name + ' (Підтримка)',
        role: 'support',
        text: text || null,
        imageUrl,
      });
      if (textEl) { textEl.value = ''; textEl.style.height = 'auto'; }
    } catch (e) {
      ZAP.utils.toast('Помилка надсилання', 'error');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  async function _dashReopenTicket(ticketId) {
    try {
      await ZAP.db.reopenSupportTicket(ticketId);
      const t = supportTickets.find(t => t.id === ticketId);
      if (t) t.status = 'open';
      if (_dashOpenTicket && _dashOpenTicket.id === ticketId) _dashOpenTicket.status = 'open';
      ZAP.utils.toast('Тікет відкрито знову', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Помилка', 'error');
    }
  }
  // ═══════════════════════════════════════════════════════
  // Moderation — all invites
  // ═══════════════════════════════════════════════════════

  function getProfile(uid) {
    return users.find(function (u) { return u.uid === uid; }) || null;
  }

  function renderModeration() {
    const { icon } = ZAP.utils;
    const filtered = inviteSearch
      ? invites.filter(function (inv) {
          var q = inviteSearch.toLowerCase();
          return (inv.id && inv.id.includes(q))
            || (inv.to && inv.to.toLowerCase().includes(q))
            || (inv.from && inv.from.toLowerCase().includes(q))
            || (inv.creatorName && inv.creatorName.toLowerCase().includes(q))
            || (inv.title && inv.title.toLowerCase().includes(q))
            || (inv.creatorUid && inv.creatorUid.includes(q));
        })
      : invites;
    const paged = filtered.slice(invitePage * INVITE_PAGE_SIZE, (invitePage + 1) * INVITE_PAGE_SIZE);
    var totalPages = Math.ceil(filtered.length / INVITE_PAGE_SIZE);

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="page-title" style="margin-bottom:0">Модерація запрошень</h1>
      <button class="hamburger" onclick="ZAP.pages.dashboard.toggleSidebar()">${icon('list', 20)}</button>
    </div>

    <div style="background:var(--warm);border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid var(--border)">
      <input type="text" placeholder="Пошук за ID запрошення, ID користувача, іменем…"
        value="${ZAP.utils.esc(inviteSearch)}"
        oninput="ZAP.pages.dashboard.searchInvites(this.value)"
        aria-label="Пошук запрошень"
        style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;background:var(--card)"/>
    </div>

    <div style="margin-bottom:8px;font-size:.8rem;color:var(--muted)">
      ${filtered.length} запрошень
    </div>

    ${paged.length === 0 ? `
      <div style="background:var(--green-bg);border-radius:12px;padding:18px;text-align:center">
        <p style="color:var(--green);font-size:.95rem">${icon('check-circle',16)} Нічого не знайдено</p>
      </div>
    ` : paged.map(function (inv) {
      return renderInviteCard(inv);
    }).join('')}

    ${totalPages > 1 ? `
      <div style="display:flex;justify-content:center;gap:8px;margin-top:20px;flex-wrap:wrap">
        ${Array.from({ length: totalPages }, function (_, i) {
          return '<button class="btn btn-sm ' + (i === invitePage ? 'btn-dark' : 'btn-outline') + '" onclick="ZAP.pages.dashboard.setInvitePage(' + i + ')">' + (i + 1) + '</button>';
        }).join('')}
      </div>
    ` : ''}`;
  }

  function renderInviteCard(inv) {
    const { icon } = ZAP.utils;
    var isGroup = inv.isGroup;
    var creatorProfile = getProfile(inv.creatorUid);
    var creatorIdText = creatorProfile
      ? ' (<strong>' + ZAP.utils.esc(creatorProfile.uniqueId) + '</strong>, @' + ZAP.utils.esc(creatorProfile.login) + ')'
      : (inv.creatorUid ? ' (ID: ' + ZAP.utils.esc(inv.creatorUid) + ')' : '');

    var recipientHtml = '';
    if (isGroup) {
      var memberCount = inv.members ? Object.keys(inv.members).length : 0;
      var invitedCount = inv.invited ? Object.keys(inv.invited).length : 0;
      recipientHtml = '<span style="font-size:.82rem">' + icon('users', 16) + (inv.title ? ' ' + ZAP.utils.esc(inv.title) : ' Групове') + ' <span style="color:var(--muted)">(' + memberCount + ' учасників, ' + invitedCount + ' запрошено)</span></span>';
    } else {
      var recipientProfile = getProfile(inv.recipientUid);
      var toIdText = recipientProfile
        ? ' (<strong>' + ZAP.utils.esc(recipientProfile.uniqueId) + '</strong>, @' + ZAP.utils.esc(recipientProfile.login) + ')'
        : (inv.recipientUid ? ' (ID: ' + ZAP.utils.esc(inv.recipientUid) + ')' : '');
      recipientHtml = '<span style="font-size:.82rem">' + icon('user', 16) + ' ' + (inv.to ? '<strong>' + ZAP.utils.esc(inv.to) + '</strong>' : '?') + toIdText + '</span>';
    }

    var statusMap = { pending: 'pending', accepted: 'accepted', declined: 'declined', reschedule: 'reschedule' };
    var statusLabel = inv.status || 'pending';
    var statusText = statusLabel === 'accepted' ? 'Прийнято' : statusLabel === 'declined' ? 'Відхилено' : statusLabel === 'reschedule' ? 'Перенесення' : 'Очікує';
    var statusStyle = statusLabel === 'accepted' ? 'color:var(--green)' : statusLabel === 'declined' ? 'color:var(--red)' : statusLabel === 'reschedule' ? 'color:var(--gold)' : 'color:var(--muted)';

    var dateText = inv.date || 'Не вказано';
    var timeText = inv.time ? ', ' + inv.time : '';
    var placeText = inv.place ? ' · ' + icon('map-pin', 16) + ' ' + ZAP.utils.esc(inv.place) : '';

    var msgHtml = '';
    if (inv.msg) {
      var mt = ZAP.utils.truncate(inv.msg, 60);
      msgHtml = '<span style="color:var(--muted);font-style:italic">« ' + mt.html + ' »</span>';
      if (mt.id) msgHtml += ZAP.utils.truncateBtn(mt.id);
    }

    var shortId = inv.id ? inv.id.substring(0, 8) + '…' : '?';

    return `
    <div class="complaint-card">
      <div class="complaint-icon">${icon(isGroup ? 'users' : 'paper-plane-tilt', 20)}</div>
      <div class="complaint-body">
        <div class="complaint-meta">
          <span style="font-weight:600">${isGroup ? 'Групове' : 'Персональне'}</span>
          · <span style="${statusStyle};font-weight:500">${statusText}</span>
          · <code style="font-size:.7rem;color:var(--muted)">${ZAP.utils.esc(shortId)}</code>
        </div>
        <div class="complaint-meta" style="margin-top:2px">
          ${icon('arrow-up', 16)} <strong>${ZAP.utils.esc(inv.creatorName || inv.from || 'Невідомо')}</strong>${creatorIdText}
          <br>${icon('arrow-down', 16)} ${recipientHtml}
        </div>
        <div class="complaint-meta" style="margin-top:2px">
          ${icon('calendar-blank', 16)} ${ZAP.utils.esc(dateText)}${timeText}${placeText}
        </div>
        ${msgHtml ? '<div class="complaint-meta" style="margin-top:2px">' + msgHtml + '</div>' : ''}
        <div class="complaint-meta" style="margin-top:2px;font-size:.75rem;color:var(--muted)">
          ${ZAP.utils.timeAgo(inv.created)}
        </div>
        <div class="complaint-actions" style="margin-top:6px">
          <button class="btn btn-sm btn-gold"
            onclick="ZAP.router.go(${isGroup ? "'group-invite'" : "'invite'"},{id:'${inv.id}'})">
            ${icon('eye', 14)} Переглянути
          </button>
          <button class="btn btn-sm btn-outline"
            onclick="ZAP.pages.dashboard.modDeleteInvite('${inv.id}','${isGroup ? 'group' : 'personal'}')">
            ${icon('trash', 16)} Видалити
          </button>
        </div>
      </div>
    </div>`;
  }

  function searchInvites(q) {
    inviteSearch = q.toLowerCase().trim();
    invitePage = 0;
    var container = document.getElementById('app');
    if (container) ZAP.render();
  }

  function setInvitePage(p) {
    invitePage = p;
    ZAP.render();
  }

  async function modDeleteInvite(invId, type) {
    if (!await ZAP.utils.confirm('Видалити це запрошення? Цю дію не можна скасувати.')) return;
    try {
      var path = type === 'group' ? 'group-invites/' : 'invites/';
      await ZAP.dbRef.ref(path + invId).remove();
      await ZAP.dbRef.ref('statuses/' + invId).remove();
      invites = invites.filter(function (i) { return i.id !== invId; });
      ZAP.utils.toast('Запрошення видалено', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося видалити. Спробуйте пізніше', 'error');
    }
  }

  // ═══════════════════════════════════════════════════════
  // Chart rendering (Canvas)
  // ═══════════════════════════════════════════════════════
  function drawCharts() {
    setTimeout(() => {
      drawActivityChart();
      drawRolesChart();
    }, 100);
  }

  function drawActivityChart() {
    const canvas = document.getElementById('chart-activity');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth - 40;
    const H = 200;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(2, 2);

    // Group users by registration day (last 14 days)
    const days = [];
    const labels = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push(key);
      labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    }

    const counts = days.map(day => {
      return users.filter(u => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        if (isNaN(d.getTime())) return false;
        return d.toISOString().split('T')[0] === day;
      }).length;
    });

    const max = Math.max(...counts, 1);
    const padL = 30, padR = 10, padT = 20, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // Grid
    ctx.strokeStyle = 'rgba(180,140,60,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = css('--muted') || '#6b6058'; ctx.font = '10px DM Sans';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(max - (max / 4) * i), padL - 6, y + 4);
    }

    // Labels
    ctx.fillStyle = css('--muted') || '#6b6058'; ctx.font = '9px DM Sans'; ctx.textAlign = 'center';
    const step = chartW / (days.length - 1);
    labels.forEach((l, i) => {
      if (i % 2 === 0) ctx.fillText(l, padL + i * step, H - 8);
    });

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#c9922a'; ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    counts.forEach((c, i) => {
      const x = padL + i * step;
      const y = padT + chartH - (c / max) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area fill
    ctx.lineTo(padL + (counts.length - 1) * step, padT + chartH);
    ctx.lineTo(padL, padT + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(201,146,42,0.15)');
    grad.addColorStop(1, 'rgba(201,146,42,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Dots
    counts.forEach((c, i) => {
      const x = padL + i * step;
      const y = padT + chartH - (c / max) * chartH;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c9922a'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }

  function drawRolesChart() {
    const canvas = document.getElementById('chart-roles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth - 40;
    const H = 200;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(2, 2);

    const roles = {
      user: { label: 'Користувачі', color: css('--muted') || '#6b6058', count: 0 },
      moderator: { label: 'Модератори', color: css('--gold') || '#c9922a', count: 0 },
      'tech-admin': { label: 'Тех-адміни', color: css('--blue') || '#2563eb', count: 0 },
      founder: { label: 'Засновники', color: css('--purple') || '#7c3aed', count: 0 },
    };
    users.forEach(u => { if (roles[u.role]) roles[u.role].count++; });

    const entries = Object.values(roles).filter(r => r.count > 0);
    const total = entries.reduce((s, r) => s + r.count, 0) || 1;

    // Draw donut chart
    const cx = W / 2, cy = H / 2 - 10;
    const outerR = Math.min(cx, cy) - 20;
    const innerR = outerR * 0.55;

    let angle = -Math.PI / 2;
    entries.forEach(r => {
      const sliceAngle = (r.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = r.color;
      ctx.fill();
      angle += sliceAngle;
    });

    // Inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#18120a'; ctx.font = 'bold 20px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 4);
    ctx.fillStyle = css('--muted') || '#6b6058'; ctx.font = '10px DM Sans';
    ctx.fillText('всього', cx, cy + 18);

    // Legend
    let ly = H - 14;
    ctx.textAlign = 'left';
    const legendX = 10;
    entries.forEach((r, i) => {
      const x = legendX + i * (W / entries.length);
      ctx.fillStyle = r.color;
      ctx.fillRect(x, ly, 10, 10);
      ctx.fillStyle = css('--muted') || '#6b6058'; ctx.font = '9px DM Sans';
      ctx.fillText(`${r.label} (${r.count})`, x + 14, ly + 9);
    });
  }

  // ═══════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════

  function setTab(t) {
    dashTab = t;
    ZAP.render();
    if (t === 'overview') drawCharts();
  }

  function toggleSidebar() {
    document.getElementById('dash-sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('open');
  }

  function searchUsers(q) {
    const { icon } = ZAP.utils;
    userSearch = q;
    userPage = 0;

    const filtered = userSearch
      ? users.filter(u =>
          (u.login || '').toLowerCase().includes(userSearch.toLowerCase()) ||
          (u.name || '').toLowerCase().includes(userSearch.toLowerCase()))
      : users;

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);
    const myProfile = ZAP.auth.getProfile();
    const myRank = getRank(myProfile?.role);

    // 1. Update total count header
    const headerTitle = document.querySelector('.table-header h3');
    if (headerTitle) {
      headerTitle.textContent = `Всього: ${filtered.length}`;
    }

    // 2. Update table rows
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      tbody.innerHTML = paged.map(u => {
        const targetRank = getRank(u.role);
        const canBan = myRank > targetRank;

        let banStatusText = '';
        if (u.banned) {
          if (u.bannedUntil) {
            const msLeft = u.bannedUntil - Date.now();
            if (msLeft > 0) {
              const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
              const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
              banStatusText = daysLeft > 1 ? `${icon('prohibit', 20)} Бан · ${daysLeft} дн.` : `${icon('prohibit', 20)} Бан · ${hoursLeft} год.`;
            } else {
              ZAP.db.banUser(u.uid, false);
              u.banned = false;
              u.bannedUntil = null;
            }
          } else {
            banStatusText = `${icon('prohibit', 20)} Назавжди`;
          }
        }

        return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px;cursor:pointer"
              onclick="ZAP.router.go('user-profile',{uid:'${u.uid}'})">
              ${ZAP.utils.avatarHTML(u, 'sm')}
              <div>
                <div style="font-weight:500">${ZAP.utils.esc(u.name)}</div>
                <div style="font-size:.72rem;color:var(--muted)">${ZAP.utils.esc(u.uniqueId)}</div>
              </div>
            </div>
          </td>
          <td style="color:var(--muted);font-size:.88rem">@${ZAP.utils.esc(u.login)}</td>
          <td>
            <select class="role-select" onchange="ZAP.pages.dashboard.changeRole('${u.uid}',this.value)"
              aria-label="Роль користувача ${ZAP.utils.esc(u.name)}"
              ${!ZAP.auth.isAdmin() ? 'disabled' : ''}>
              ${['user','moderator','tech-admin','founder'].map(r =>
                `<option value="${r}" ${u.role === r ? 'selected' : ''}>${
                  {user:'Користувач',moderator:'Модератор','tech-admin':'Тех-адмін',founder:'Засновник'}[r]
                }</option>`
              ).join('')}
            </select>
          </td>
          <td style="font-size:.82rem;color:var(--muted)">${ZAP.utils.timeAgo(u.createdAt)}</td>
          <td style="font-size:.82rem;color:var(--muted)">${u.lastSeen ? ZAP.utils.timeAgo(u.lastSeen) : 'Ніколи'}</td>
          <td>
            ${u.banned
              ? `<span class="badge badge-declined" title="${u.bannedUntil ? new Date(u.bannedUntil).toLocaleString('uk-UA') : 'Перманентно'}">${banStatusText}</span>`
              : `<span class="badge badge-accepted">${icon('check-circle',16)} Активний</span>`}
          </td>
          <td>
            ${u.banned
              ? (canBan ? `<button class="btn btn-sm btn-gold" onclick="ZAP.pages.dashboard.toggleBan('${u.uid}',false)">Розбанити</button>` : '<span style="color:var(--muted);font-size:.8rem">—</span>')
              : (canBan ? `<button class="btn btn-sm btn-outline" style="color:var(--red);border-color:var(--red)"
                  onclick="ZAP.pages.dashboard.toggleBan('${u.uid}',true)">Бан</button>` : '<span style="color:var(--muted);font-size:.8rem">—</span>')}
          </td>
        </tr>`;
      }).join('');
    }

    // 3. Update pagination
    let paginationDiv = document.querySelector('.pagination');
    if (totalPages > 1) {
      const paginationHTML = Array.from({length: totalPages}, (_, i) => `
        <button class="page-btn ${i === userPage ? 'active' : ''}"
          onclick="ZAP.pages.dashboard.setUserPage(${i})">${i + 1}</button>
      `).join('');
      
      if (paginationDiv) {
        paginationDiv.innerHTML = paginationHTML;
      } else {
        const tableCard = document.querySelector('.table-card');
        if (tableCard) {
          paginationDiv = document.createElement('div');
          paginationDiv.className = 'pagination';
          paginationDiv.innerHTML = paginationHTML;
          tableCard.appendChild(paginationDiv);
        }
      }
    } else {
      if (paginationDiv) {
        paginationDiv.remove();
      }
    }
  }

  function setUserPage(p) {
    userPage = p;
    ZAP.render();
  }

  async function changeRole(uid, newRole) {
    try {
      await ZAP.db.updateUserRole(uid, newRole);
      const u = users.find(u => u.uid === uid);
      if (u) u.role = newRole;
      ZAP.utils.toast('Роль змінено', 'success');
    } catch (e) {
      ZAP.utils.toast('Не вдалося змінити роль. Спробуйте пізніше', 'error');
    }
  }

  // ── Role hierarchy helper ──
  const ROLE_RANK = { user: 0, moderator: 1, 'tech-admin': 2, founder: 3 };
  function getRank(role) { return ROLE_RANK[role] ?? 0; }

  async function toggleBan(uid, ban) {
    // ── Task 6: Hierarchy check ──
    const myProfile = ZAP.auth.getProfile();
    const myRank = getRank(myProfile?.role);
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser) {
      const targetRank = getRank(targetUser.role);
      if (ban && targetRank >= myRank) {
        ZAP.utils.toast('Ви не можете заблокувати користувача з рівною або вищою роллю', 'error');
        return;
      }
    }

    let until = null;
    
    if (ban) {
      const days = await ZAP.utils.prompt('На скільки днів забанити?', 'Залиште порожнім для перманентного бану');
      if (days === null) return; // cancelled
      if (days.trim() !== '' && !isNaN(Number(days))) {
        until = Date.now() + (Number(days) * 24 * 60 * 60 * 1000);
      }
    } else {
      if (!await ZAP.utils.confirm('Ви впевнені, що хочете розбанити цього користувача?')) return;
    }

    try {
      await ZAP.db.banUser(uid, ban, until);
      const u = users.find(u => u.uid === uid);
      if (u) {
        u.banned = ban;
        u.bannedUntil = until;
      }
      ZAP.utils.toast(ban ? 'Користувача забанено' : 'Користувача розбанено', ban ? 'error' : 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося виконати операцію. Спробуйте пізніше', 'error');
    }
  }

  async function resolveReport(reportId, action) {
    try {
      await ZAP.db.resolveReport(reportId, action, ZAP.auth.getUser()?.uid);
      const r = reports.find(r => r.id === reportId);
      if (r) r.status = action;
      ZAP.utils.toast(action === 'resolved' ? 'Скаргу вирішено' : 'Скаргу відхилено', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося обробити скаргу. Спробуйте пізніше', 'error');
    }
  }

  async function resolveSupportTicket(ticketId, action) {
    try {
      await ZAP.db.resolveSupportTicket(ticketId, action, ZAP.auth.getUser()?.uid);
      const t = supportTickets.find(t => t.id === ticketId);
      if (t) t.status = action;
      if (_dashOpenTicket && _dashOpenTicket.id === ticketId) _dashOpenTicket.status = action;
      ZAP.utils.toast(action === 'resolved' ? 'Звернення вирішено' : 'Звернення закрито', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося обробити звернення. Спробуйте пізніше', 'error');
    }
  }

  async function deleteReportedInvite(targetId, targetType, reportId) {
    if (!await ZAP.utils.confirm('Видалити це запрошення та вирішити скаргу?')) return;
    try {
      if (targetType === 'group-invite') {
        await ZAP.dbRef.ref('group-invites/' + targetId).remove();
      } else {
        await ZAP.dbRef.ref('invites/' + targetId).remove();
        await ZAP.dbRef.ref('statuses/' + targetId).remove();
      }
      await ZAP.db.resolveReport(reportId, 'resolved', ZAP.auth.getUser()?.uid);
      const r = reports.find(r => r.id === reportId);
      if (r) r.status = 'resolved';
      ZAP.utils.toast('Запрошення видалено, скаргу вирішено', 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося видалити запрошення. Спробуйте пізніше', 'error');
    }
  }

  function retryLoad() {
    console.log('[DASH] retryLoad clicked');
    loadingError = false;
    load().then(function () { ZAP.render(); });
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.dashboard = {
    render, load, setTab, toggleSidebar, drawCharts,
    searchUsers, setUserPage,
    changeRole, toggleBan,
    resolveReport, resolveSupportTicket, deleteReportedInvite,
    openSupportChat, closeSupportChat,
    _dashOnImage, _dashRemoveImage, _dashSendMsg, _dashReopenTicket,
    searchInvites, setInvitePage, modDeleteInvite, retryLoad,
  };
})();
