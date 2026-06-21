/* ═══════════════════════════════════════════════════════
   Page — View Other User's Profile — Premium Redesign
   ═══════════════════════════════════════════════════════ */

(function () {
  let userData = null;
  let friendStatus = 'none'; // 'none' | 'friend' | 'pending-sent' | 'pending-received'
  let loading = true;

  async function load(uid) {
    loading = true;
    userData = null;
    friendStatus = 'none';

    userData = await ZAP.db.getUserByUid(uid);

    const me = ZAP.auth.getUser();
    if (me && userData) {
      const friendSnap = await ZAP.dbRef.ref('friends/' + me.uid + '/' + uid).get();
      if (friendSnap.exists()) {
        friendStatus = 'friend';
      } else {
        try {
          const sentSnap = await ZAP.dbRef.ref('friend-requests/' + uid + '/' + me.uid).get();
          if (sentSnap.exists()) {
            friendStatus = 'pending-sent';
          } else {
            const recvSnap = await ZAP.dbRef.ref('friend-requests/' + me.uid + '/' + uid).get();
            if (recvSnap.exists()) friendStatus = 'pending-received';
          }
        } catch (e) {
          console.warn('Friend request check:', e.message);
        }
      }
    }

    loading = false;
  }

  function renderSkeleton() {
    return `
    <div class="uprofile-wrap">
      <div class="skeleton" style="width:80px;height:34px;border-radius:var(--radius-pill);margin-bottom:24px"></div>
      <div class="uprofile-hero">
        <div class="skeleton-circle" style="width:96px;height:96px;margin:0 auto 16px"></div>
        <div class="skeleton-line w-1-3" style="margin:0 auto 10px;height:22px"></div>
        <div class="skeleton" style="width:70px;height:18px;border-radius:20px;margin:0 auto 16px"></div>
        <div style="display:flex;gap:10px;justify-content:center">
          <div class="skeleton" style="width:130px;height:40px;border-radius:12px"></div>
          <div class="skeleton" style="width:110px;height:40px;border-radius:12px"></div>
        </div>
      </div>
    </div>`;
  }

  function render() {
    if (loading) return renderSkeleton();

    if (!userData) {
      const { icon } = ZAP.utils;
      return `
      <div class="uprofile-wrap">
        <div class="home-empty">
          <div class="home-empty-icon">${icon('user', 36)}</div>
          <div class="home-empty-title">Користувача не знайдено</div>
          <p class="home-empty-sub">Можливо, акаунт було видалено</p>
        </div>
      </div>`;
    }

    const { esc, avatarHTML, roleBadge, icon } = ZAP.utils;
    const me = ZAP.auth.getUser();
    const isMe = me && me.uid === userData.uid;

    const isOnline = userData.lastSeen && (Date.now() - userData.lastSeen < 2 * 60 * 1000);
    const memberSince = userData.createdAt
      ? new Date(userData.createdAt).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })
      : null;

    return `
    <div class="uprofile-wrap">

      <!-- Back button -->
      <button class="uprofile-back-btn" onclick="history.back()">
        ${icon('arrow-left', 16)} Назад
      </button>

      <!-- Hero card -->
      <div class="uprofile-hero">
        <!-- Avatar with online ring -->
        <div class="uprofile-avatar-wrap">
          <div class="uprofile-avatar-ring ${isOnline ? 'online' : ''}">
            ${avatarHTML(userData, 'xl')}
          </div>
          ${isOnline ? '<div class="uprofile-online-badge">В мережі</div>' : ''}
        </div>

        <!-- Name + badges -->
        <div class="uprofile-name">${esc(userData.name)}</div>
        <div class="uprofile-badges">
          ${roleBadge(userData.role)}
          <span class="profile-id" style="font-size:.7rem">${esc(userData.uniqueId)}</span>
        </div>
        ${memberSince ? `<div class="uprofile-since">${icon('calendar-blank', 13)} З ${memberSince}</div>` : ''}

        <!-- Actions -->
        ${!isMe && me ? `
          <div class="uprofile-actions">
            ${renderFriendButton()}
            <button class="btn btn-gold btn-sm" onclick="ZAP.router.go('create')" style="padding:12px 22px">
              ${icon('paper-plane-tilt', 15)} Запросити
            </button>
          </div>
        ` : ''}

        ${isMe ? `
          <div class="uprofile-actions">
            <button class="btn btn-outline btn-sm" onclick="ZAP.router.go('profile')" style="padding:12px 22px">
              ${icon('gear', 15)} Налаштування
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Info card (if not me) -->
      ${!isMe ? `
      <div class="uprofile-info-card">
        ${friendStatus === 'friend' ? `
          <div class="uprofile-friend-status">
            <div class="uprofile-friend-status-icon">${icon('check-circle', 20)}</div>
            <div>
              <div class="uprofile-friend-status-title">Ви друзі</div>
              <div class="uprofile-friend-status-sub">Ви можете надсилати запрошення напряму</div>
            </div>
          </div>
        ` : friendStatus === 'pending-sent' ? `
          <div class="uprofile-friend-status pending">
            <div class="uprofile-friend-status-icon">${icon('clock', 20)}</div>
            <div>
              <div class="uprofile-friend-status-title">Запит надіслано</div>
              <div class="uprofile-friend-status-sub">Очікуємо відповіді від ${esc(userData.name)}</div>
            </div>
          </div>
        ` : `
          <div class="uprofile-info-row">
            <span class="uprofile-info-icon">${icon('info', 16)}</span>
            <span class="uprofile-info-text">Додайте ${esc(userData.name)} у друзі, щоб надсилати запрошення напряму</span>
          </div>
        `}
      </div>
      ` : ''}

    </div>`;
  }

  function renderFriendButton() {
    const { icon } = ZAP.utils;
    switch (friendStatus) {
      case 'friend':
        return `
        <button class="btn btn-sm" disabled
          style="background:var(--green-bg);color:var(--green);border:1.5px solid rgba(45,122,79,.25);border-radius:12px;padding:12px 22px">
          ${icon('check-circle', 15)} У друзях
        </button>`;
      case 'pending-sent':
        return `
        <button class="btn btn-outline btn-sm" disabled style="padding:12px 22px">
          ${icon('clock', 15)} Запит надіслано
        </button>`;
      case 'pending-received':
        return `
        <button class="btn btn-gold btn-sm" onclick="ZAP.pages.userProfile.acceptRequest()" style="padding:12px 22px">
          ${icon('check', 15)} Прийняти запит
        </button>`;
      default:
        return `
        <button class="btn btn-dark btn-sm" onclick="ZAP.pages.userProfile.addFriend()" style="padding:12px 22px">
          ${icon('hand-waving', 15)} Додати в друзі
        </button>`;
    }
  }

  async function addFriend() {
    const me = ZAP.auth.getUser();
    const myProfile = ZAP.auth.getProfile();
    if (!me || !userData) return;
    try {
      const result = await ZAP.db.sendFriendRequest(me.uid, userData.uid, myProfile.name);
      if (result === 'auto-accepted') {
        friendStatus = 'friend';
        ZAP.utils.toast(`${userData.name} тепер ваш друг!`, 'success');
      } else {
        friendStatus = 'pending-sent';
        ZAP.utils.toast('Запит надіслано', 'success');
      }
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося надіслати запит. Спробуйте пізніше', 'error');
    }
  }

  async function acceptRequest() {
    const me = ZAP.auth.getUser();
    if (!me || !userData) return;
    try {
      await ZAP.db.acceptFriendRequest(me.uid, userData.uid);
      friendStatus = 'friend';
      ZAP.utils.toast(`${userData.name} тепер ваш друг!`, 'success');
      ZAP.render();
    } catch (e) {
      ZAP.utils.toast('Не вдалося прийняти запит. Спробуйте пізніше', 'error');
    }
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.userProfile = { render, load, addFriend, acceptRequest };
})();
