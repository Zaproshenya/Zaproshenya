/* ═══════════════════════════════════════════════════════
   Page — Invite View (for recipient)
   Handles both personal (#i/) and group (#g/) invites
   ═══════════════════════════════════════════════════════ */

(function () {
  let invData = null;
  let groupData = null;
  let loading = true;
  let answered = false;
  let answerStatus = null;
  let showRescheduleForm = false;
  let isGroup = false;
  let guestName = '';
  async function loadPersonal(inviteId, b64) {
    loading = true;
    isGroup = false;
    invData = null;
    answered = false;
    answerStatus = null;
    showRescheduleForm = false;

    if (inviteId) {
      // Short ID — load from Firebase
      try { invData = await ZAP.db.getInvite(inviteId); } catch (e) {
        console.warn('Invite load:', e.message);
      }
    } else if (b64) {
      // Legacy Base64
      try { invData = JSON.parse(decodeURIComponent(escape(atob(b64)))); } catch {}
    }

    // Check if invite is addressed to someone else
    if (invData && invData.recipientUid) {
      const currentUser = ZAP.auth.getUser();
      if (!currentUser) {
        // Enforce login for recipient-specific invites
        invData.requireAuth = true;
      } else if (currentUser.uid !== invData.recipientUid && currentUser.uid !== invData.creatorUid) {
        // Different user logged in -> obfuscate as not found for privacy
        invData = null;
      }
    }

    // Check if already answered
    if (invData) {
      try {
        const statusSnap = await ZAP.dbRef.ref('statuses/' + invData.id).get();
        if (statusSnap.exists()) {
          const st = statusSnap.val();
          if (st === 'accepted' || st === 'declined' || st === 'reschedule') {
            answered = true;
            answerStatus = st;
          }
        }
      } catch {}
    }

    loading = false;

    // Mark matching notification as read
    const currentUser = ZAP.auth.getUser();
    if (currentUser && inviteId) {
      try {
        const notifs = await ZAP.notifications.getNotifications(currentUser.uid);
        for (const n of notifs) {
          if (n.type === 'invite' && n.inviteId === inviteId && !n.read && n.id) {
            await ZAP.notifications.markNotifRead(currentUser.uid, n.id);
          }
        }
        if (ZAP.app.updateUnreadCount) ZAP.app.updateUnreadCount();
      } catch {}
    }
  }

  async function loadGroup(inviteId) {
    loading = true;
    isGroup = true;
    groupData = null;
    guestName = '';
    answered = false;
    answerStatus = null;

    try { groupData = await ZAP.db.getGroupInvite(inviteId); } catch (e) {
      console.warn('Group invite load:', e.message);
    }

    // Check if current user already joined
    const user = ZAP.auth.getUser();
    if (user && groupData?.members) {
      const memberEntry = Object.values(groupData.members).find(m => m.uid === user.uid);
      if (memberEntry) {
        answered = true;
        answerStatus = memberEntry.status;
      }
    }

    loading = false;

    // Mark matching notification as read
    const currentUser = ZAP.auth.getUser();
    if (currentUser && inviteId) {
      try {
        const notifs = await ZAP.notifications.getNotifications(currentUser.uid);
        for (const n of notifs) {
          if (n.type === 'group-invite' && n.inviteId === inviteId && !n.read && n.id) {
            await ZAP.notifications.markNotifRead(currentUser.uid, n.id);
          }
        }
        if (ZAP.app.updateUnreadCount) ZAP.app.updateUnreadCount();
      } catch {}
    }
  }

  function renderSkeleton() {
    return `
    <div class="invite-bg">
      <div class="invite-envelope">
        <div class="envelope-top" style="text-align:center">
          <div class="skeleton-circle" style="width:56px;height:56px;margin:0 auto 10px"></div>
          <div class="skeleton-line w-1-2" style="margin:0 auto 8px;height:14px;background:rgba(255,255,255,.3)"></div>
          <div class="skeleton-line w-3-4" style="margin:0 auto;height:20px;background:rgba(255,255,255,.4)"></div>
        </div>
        <div class="envelope-body">
          <div class="skeleton-line w-full" style="margin-bottom:8px;height:12px"></div>
          <div class="skeleton-line w-3-4" style="margin-bottom:14px;height:12px"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px">
            <div class="skeleton-btn" style="height:56px;border-radius:11px"></div>
            <div class="skeleton-btn" style="height:56px;border-radius:11px"></div>
            <div class="skeleton-btn" style="height:56px;border-radius:11px;grid-column:1/-1"></div>
          </div>
          <div style="display:flex;gap:7px;margin-top:14px">
            <div class="skeleton-btn" style="height:40px;border-radius:var(--radius-md);flex:1"></div>
            <div class="skeleton-btn" style="height:40px;border-radius:var(--radius-md);flex:1"></div>
            <div class="skeleton-btn" style="height:40px;border-radius:var(--radius-md);flex:1"></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function render() {
    if (loading) return renderSkeleton();

    if (isGroup) return renderGroupInvite();
    return renderPersonalInvite();
  }

  // ───────────────────────────────────────────────
  // Personal invite
  // ───────────────────────────────────────────────
  function renderPersonalInvite() {
    const { esc, TYPE_MAP, icon } = ZAP.utils;

    if (!invData) {
      return `<div style="text-align:center;padding:80px 20px">
        <div style="font-size:2rem;margin-bottom:12px">${icon('leaf', 32)}</div>
        <p style="color:var(--muted);font-size:1.1rem">Запрошення не знайдено</p>
      </div>`;
    }

    // Check if auth is required
    if (invData.requireAuth && !ZAP.auth.getUser()) {
      return `
      <div class="invite-bg">
        <div class="invite-envelope">
          <div class="envelope-top">
            <span class="envelope-emoji">${icon('lock', 24)}</span>
            <div class="envelope-type">Запрошення</div>
            <div class="envelope-to">${ZAP.utils.esc(invData.to)}</div>
          </div>
          <div class="envelope-body" style="text-align:center">
            <p style="color:var(--muted);margin-bottom:20px;font-size:1rem">
              Щоб переглянути це запрошення, потрібно увійти в акаунт або зареєструватися.
            </p>
            <button class="btn btn-dark" style="width:auto;padding:12px 32px"
              onclick="ZAP.router.go('login')">Увійти / Зареєструватися</button>
          </div>
        </div>
      </div>`;
    }

    const t = TYPE_MAP[invData.type] || TYPE_MAP.other;

    return `
    <div class="invite-bg">
      <div class="invite-envelope">
        <div class="envelope-top">
          <span class="envelope-emoji">${t.e}</span>
          <div class="envelope-type">${t.l}</div>
          <div class="envelope-to">${esc(invData.to)}</div>
          ${invData.showSender !== false ? `<div class="envelope-from">від <strong>${esc(invData.senderName || 'Невідомий')}</strong></div>` : ''}
        </div>

        <div class="envelope-body">
          ${invData.msg ? `
            <div class="msg-block">
              ${(() => {
                const mt = ZAP.utils.truncate(invData.msg, 120);
                if (mt.id) return `<p class="msg-text">${mt.html}</p>${ZAP.utils.truncateBtn(mt.id)}`;
                return `<p class="msg-text">${mt.html}</p>`;
              })()}
            </div>` : ''}

          <div class="detail-chips">
            <div class="detail-chip">
              <span class="detail-chip-icon">${icon('calendar-blank', 16)}</span>
              <div><div class="detail-chip-label">Дата</div><div class="detail-chip-value">${esc(invData.date)}</div></div>
            </div>
            <div class="detail-chip">
              <span class="detail-chip-icon">${icon('clock', 16)}</span>
              <div><div class="detail-chip-label">Час</div><div class="detail-chip-value">${esc(invData.time)}</div></div>
            </div>
            ${invData.place ? `
            <div class="detail-chip full">
              <span class="detail-chip-icon">${icon('map-pin', 16)}</span>
              <div><div class="detail-chip-label">Місце</div><div class="detail-chip-value">${esc(invData.place)}</div></div>
            </div>` : ''}
          </div>

          ${answered ? renderResult(answerStatus) : renderButtons(invData.id)}

          <div class="envelope-footer">
            ${ZAP.auth.getUser() ? `
              <button onclick="ZAP.router.go('home')">
                ← Меню
              </button>
            ` : ''}
            ${!answered ? `
              <button onclick="ZAP.pages.invite.showReport('${invData.id}')">
                ${icon('warning', 12)} Поскаржитися
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderButtons(invId) {
    const { icon } = ZAP.utils;
    const user = ZAP.auth.getUser();
    const isCreator = user && invData && user.uid === invData.creatorUid;

    if (isCreator) {
      return `
      <div class="action-section-wrap">
        <div class="answer-wrap" style="opacity:0.45;pointer-events:none">
          <button class="btn-yes" disabled>${icon('check', 14)} Так, я приду!</button>
          <button class="btn-reschedule" disabled>${icon('calendar-blank', 14)} Перенести</button>
          <button class="btn-no" disabled>${icon('x', 14)} Не зможу</button>
        </div>
        <p style="text-align:center;font-size:.75rem;color:var(--muted);margin-top:10px;font-style:italic">
          ${icon('info', 13)} Це ваше запрошення. Ви не можете на нього відповісти.
        </p>
      </div>`;
    }

    return `
    <div class="action-section-wrap">
      <div class="answer-wrap" id="answer-btns-${invId}">
        <button class="btn-yes" onclick="ZAP.pages.invite.answer('${invId}','accepted')">
          ${icon('check', 14)} Так, я приду!
        </button>
        <button class="btn-reschedule" onclick="ZAP.pages.invite.toggleReschedule('${invId}')">
          ${icon('calendar-blank', 14)} Перенести
        </button>
        <button class="btn-no" onclick="ZAP.pages.invite.answer('${invId}','declined')">
          ${icon('x', 14)} Не зможу
        </button>
      </div>
      <div id="reschedule-block-${invId}" class="reschedule-form-block" style="display:${showRescheduleForm ? 'block' : 'none'}">
        <div class="reschedule-form">
          <p style="font-size:.84rem;font-weight:500;margin-bottom:10px">Запропонуйте інший час:</p>
          <div class="grid2" style="margin-bottom:10px">
            <div><label class="lbl">Нова дата</label><input type="date" id="rdate-${invId}" min="${new Date().toISOString().split('T')[0]}"/></div>
            <div><label class="lbl">Новий час</label><input type="time" id="rtime-${invId}"/></div>
          </div>
          <button class="btn btn-gold btn-full" onclick="ZAP.pages.invite.sendReschedule('${invId}')">
            Надіслати пропозицію →
          </button>
        </div>
      </div>
    </div>`;
  }

  function renderResult(status) {
    const { icon } = ZAP.utils;
    const results = {
      accepted: `
        <span class="result-icon">${icon('confetti', 32)}</span>
        <div class="result-title" style="color:var(--green)">Ура! Так! ${icon('star', 14)}</div>
        <div class="result-sub">Ви погодились! Відправник дізнається автоматично ${icon('check', 14)}</div>`,
      declined: `
        <span class="result-icon">${icon('heart-crack', 32)}</span>
        <div class="result-title" style="color:var(--red)">Відмовлено</div>
        <div class="result-sub">Ви відмовились. Відправник дізнається автоматично.</div>`,
      reschedule: `
        <span class="result-icon">${icon('calendar-blank', 32)}</span>
        <div class="result-title" style="color:var(--gold)">Пропозицію надіслано!</div>
        <div class="result-sub">Відправник отримає ваш варіант часу і зв'яжеться з вами.</div>`,
    };
    return `<div class="result-screen" style="animation:pop .5s cubic-bezier(.34,1.56,.64,1) both">
      ${results[status] || results.declined}
    </div>`;
  }

  // ───────────────────────────────────────────────
  // Group invite
  // ───────────────────────────────────────────────
  function renderGroupInvite() {
    const { esc, TYPE_MAP, avatarHTML, icon } = ZAP.utils;

    if (!groupData) {
      return `<div style="text-align:center;padding:80px 20px">
        <div style="font-size:2rem;margin-bottom:12px">${icon('leaf', 32)}</div>
        <p style="color:var(--muted);font-size:1.1rem">Групове запрошення не знайдено</p>
      </div>`;
    }

    // Check if private and user not invited
    const user = ZAP.auth.getUser();
    if (!groupData.isPublic && user) {
      const invited = groupData.invited || {};
      if (!invited[user.uid] && groupData.creatorUid !== user.uid) {
        return `<div style="text-align:center;padding:80px 20px">
          <div style="font-size:2rem;margin-bottom:12px">${icon('lock', 32)}</div>
          <p style="color:var(--muted);font-size:1.1rem">Це приватне запрошення. Ви не в списку запрошених.</p>
        </div>`;
      }
    }

    const t = TYPE_MAP[groupData.type] || TYPE_MAP.other;
    const members = groupData.members ? Object.values(groupData.members) : [];

    return `
    <div class="invite-bg">
      <div class="invite-envelope" style="max-width:400px">
        <div class="envelope-top">
          <span class="envelope-emoji">${t.e}</span>
          <div class="envelope-type">Групове запрошення</div>
          <div class="envelope-to">${esc(groupData.title || t.l)}</div>
          <div class="envelope-from">від <strong>${esc(groupData.creatorName || 'Невідомий')}</strong></div>
        </div>

        <div class="envelope-body">
          ${groupData.msg ? `
            <div class="msg-block">
              ${(() => {
                const mt = ZAP.utils.truncate(groupData.msg, 120);
                if (mt.id) return `<p class="msg-text">${mt.html}</p>${ZAP.utils.truncateBtn(mt.id)}`;
                return `<p class="msg-text">${mt.html}</p>`;
              })()}
            </div>` : ''}

          <div class="detail-chips">
            <div class="detail-chip">
              <span class="detail-chip-icon">${icon('calendar-blank', 16)}</span>
              <div><div class="detail-chip-label">Дата</div><div class="detail-chip-value">${esc(groupData.date)}</div></div>
            </div>
            <div class="detail-chip">
              <span class="detail-chip-icon">${icon('clock', 16)}</span>
              <div><div class="detail-chip-label">Час</div><div class="detail-chip-value">${esc(groupData.time)}</div></div>
            </div>
            ${groupData.place ? `
            <div class="detail-chip full">
              <span class="detail-chip-icon">${icon('map-pin', 16)}</span>
              <div><div class="detail-chip-label">Місце</div><div class="detail-chip-value">${esc(groupData.place)}</div></div>
            </div>` : ''}
          </div>

          <!-- Participants -->
          ${members.length > 0 ? `
            <div style="margin-bottom:12px">
              <p style="font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:7px">
                Учасники (${members.length})
              </p>
              <div class="participant-list">
                ${members.map(m => `
                  <div class="participant-item">
                    <span class="participant-name">${esc(m.name)}</span>
                    <span class="participant-status">${ZAP.utils.badge(m.status || 'accepted')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${answered ? renderResult(answerStatus) : renderGroupJoin()}

          ${ZAP.auth.getUser() ? `
            <div class="envelope-footer">
              <button onclick="ZAP.router.go('home')">
                ← Меню
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderGroupJoin() {
    const { icon } = ZAP.utils;
    const user = ZAP.auth.getUser();
    const isCreator = user && groupData && user.uid === groupData.creatorUid;

    if (isCreator) {
      return `
      <div class="action-section-wrap">
        <div class="answer-wrap" style="opacity:0.45;pointer-events:none">
          <button class="btn-yes" disabled>${icon('check', 14)} Так, я приду!</button>
          <button class="btn-no" disabled>${icon('x', 14)} Не зможу</button>
        </div>
        <p style="text-align:center;font-size:.75rem;color:var(--muted);margin-top:10px;font-style:italic">
          ${icon('info', 13)} Це ваше запрошення. Ви не можете на нього відповісти.
        </p>
      </div>`;
    }

    if (!user && groupData.isPublic) {
      // Check if auth required
      if (groupData.requireAuth) {
        return `
        <div class="action-section-wrap" style="text-align:center;padding:14px 0">
          <div style="font-size:1.4rem;margin-bottom:10px">${icon('lock', 24)}</div>
          <p style="color:var(--muted);margin-bottom:12px">Для відповіді потрібно увійти в акаунт</p>
          <button class="btn btn-dark" style="width:auto;padding:10px 28px"
            onclick="ZAP.router.go('login')">Увійти</button>
        </div>`;
      }
      // Public group, no auth — enter name
      return `
      <div class="action-section-wrap">
        <div style="margin-bottom:10px">
          <label class="lbl">Ваше ім'я</label>
          <input id="guest-name" placeholder="Як вас звати?" value="${ZAP.utils.esc(guestName)}" maxlength="15"
            oninput="ZAP.pages.invite.setGuestName(this.value)"/>
        </div>
        <div class="answer-wrap" style="margin-top:8px">
          <button class="btn-yes" onclick="ZAP.pages.invite.joinGroup()" style="flex:2">
            ${icon('check', 14)} Так, я приду!
          </button>
          <button class="btn-no" onclick="ZAP.pages.invite.declineGroup()">
            ${icon('x', 14)} Не зможу
          </button>
        </div>
      </div>`;
    }

    if (user) {
      return `
      <div class="action-section-wrap">
        <div class="answer-wrap">
          <button class="btn-yes" onclick="ZAP.pages.invite.joinGroup()" style="flex:2">
            ${icon('check', 14)} Так, я приду!
          </button>
          <button class="btn-no" onclick="ZAP.pages.invite.declineGroup()">
            ${icon('x', 14)} Не зможу
          </button>
        </div>
      </div>`;
    }

    // Private group, no auth
    return `
    <div class="action-section-wrap" style="text-align:center;padding:14px 0">
      <p style="color:var(--muted);margin-bottom:12px">Увійдіть, щоб відповісти на запрошення</p>
      <button class="btn btn-dark" style="width:auto;padding:10px 28px"
        onclick="ZAP.router.go('login')">Увійти</button>
    </div>`;
  }

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────

  async function answer(invId, status) {
    // Write to Firebase
    if (ZAP.dbRef) {
      await ZAP.dbRef.ref('statuses/' + invId).set(status);
    }
    
    // Clean up notification
    const user = ZAP.auth.getUser();
    if (user) {
      await ZAP.notifications.deleteNotificationsByPayload(user.uid, 'invite', 'inviteId', invId);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
    }

    // Notify creator
    if (invData?.creatorUid) {
      const responderName = ZAP.auth.getProfile()?.name || invData.to || 'Хтось';
      const titles = {
        accepted: `Запрошення прийнято!`,
        declined: `Запрошення відхилено`,
      };
      await ZAP.notifications.addNotification(invData.creatorUid, {
        type: 'invite-response',
        title: titles[status] || 'Відповідь на запрошення',
        body: `${responderName} ${status === 'accepted' ? 'погодився прийти!' : 'не зможе прийти'}`,
        inviteId: invId,
      });
    }

    if (status === 'accepted') ZAP.utils.boom();

    answered = true;
    answerStatus = status;
    ZAP.render();
  }

  function toggleReschedule(invId) {
    showRescheduleForm = !showRescheduleForm;
    const block = document.getElementById('reschedule-block-' + invId);
    if (block) block.style.display = showRescheduleForm ? 'block' : 'none';
  }

  async function sendReschedule(invId) {
    const { icon } = ZAP.utils;
    const date = document.getElementById('rdate-' + invId)?.value || '';
    const time = document.getElementById('rtime-' + invId)?.value || '';
    if (!date && !time) { ZAP.utils.alert('Виберіть дату або час!'); return; }

    await ZAP.db.saveReschedule(invId, { date, time });

    // Clean up notification
    const user = ZAP.auth.getUser();
    if (user) {
      await ZAP.notifications.deleteNotificationsByPayload(user.uid, 'invite', 'inviteId', invId);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
    }

    // Notify creator
    if (invData?.creatorUid) {
      const responderName = ZAP.auth.getProfile()?.name || invData.to || 'Хтось';
      await ZAP.notifications.addNotification(invData.creatorUid, {
        type: 'invite-reschedule',
        title: `Запит на перенесення`,
        body: `${responderName} хоче перенести зустріч`,
        inviteId: invId,
      });
    }

    answered = true;
    answerStatus = 'reschedule';
    ZAP.render();
  }

  async function joinGroup() {
    if (!groupData) return;
    const user = ZAP.auth.getUser();
    const profile = ZAP.auth.getProfile();

    const participant = {
      name: user ? profile?.name || 'Невідомий' : guestName || 'Гість',
      uid: user?.uid || null,
      status: 'accepted',
    };

    if (!user && !guestName.trim()) {
      ZAP.utils.toast('Введіть ваше ім\'я', 'error');
      return;
    }

    await ZAP.db.joinGroupInvite(groupData.id, participant);

    // Clean up notification
    if (user) {
      await ZAP.notifications.deleteNotificationsByPayload(user.uid, 'group-invite', 'inviteId', groupData.id);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
    }

    ZAP.utils.boom();
    answered = true;
    answerStatus = 'accepted';
    ZAP.render();
  }

  async function declineGroup() {
    if (!groupData) return;
    const user = ZAP.auth.getUser();
    const profile = ZAP.auth.getProfile();

    const participant = {
      name: user ? profile?.name || 'Невідомий' : guestName || 'Гість',
      uid: user?.uid || null,
      status: 'declined',
    };

    await ZAP.db.joinGroupInvite(groupData.id, participant);

    // Clean up notification
    if (user) {
      await ZAP.notifications.deleteNotificationsByPayload(user.uid, 'group-invite', 'inviteId', groupData.id);
      if (ZAP.app.updateUnreadCount) await ZAP.app.updateUnreadCount();
    }

    answered = true;
    answerStatus = 'declined';
    ZAP.render();
  }

  function setGuestName(name) {
    guestName = name;
  }

  // ── Report ──
  function showReport(invId) {
    const { icon } = ZAP.utils;
    const reasons = [
      'Спам або шахрайство',
      'Образливий вміст',
      'Небажане запрошення',
      'Інше',
    ];

    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <h3 class="modal-title">${icon('warning', 20)} Поскаржитися</h3>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:16px">Оберіть причину скарги:</p>
        <div class="report-reasons" id="report-reasons">
          ${reasons.map((r, i) => `
            <div class="report-reason" onclick="this.parentElement.querySelectorAll('.report-reason').forEach(e=>e.classList.remove('selected'));this.classList.add('selected');this.dataset.reason='${ZAP.utils.esc(r)}'">
              <div class="report-reason-radio"></div>
              <span>${ZAP.utils.esc(r)}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:12px">
          <label class="lbl">Додатковий коментар (необов'язково)</label>
          <textarea id="report-comment" placeholder="Опишіть проблему..." style="min-height:60px" maxlength="100"></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="btn btn-red btn-full" onclick="ZAP.pages.invite.submitReport('${invId}')">
            Надіслати скаргу
          </button>
          <button class="btn btn-outline btn-full" onclick="this.closest('.overlay').remove()">
            Скасувати
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  async function submitReport(invId) {
    const selected = document.querySelector('.report-reason.selected');
    if (!selected) {
      ZAP.utils.toast('Оберіть причину скарги', 'error');
      return;
    }

    const reason = selected.dataset.reason || selected.textContent.trim();
    const comment = document.getElementById('report-comment')?.value?.trim() || '';
    const user = ZAP.auth.getUser();

    const targetContent = isGroup ? {
      title: groupData?.title || '',
      msg: groupData?.msg || '',
      date: groupData?.date || '',
      time: groupData?.time || '',
      place: groupData?.place || '',
      creatorName: groupData?.creatorName || '',
      creatorUid: groupData?.creatorUid || ''
    } : {
      to: invData?.to || '',
      msg: invData?.msg || '',
      date: invData?.date || '',
      time: invData?.time || '',
      place: invData?.place || '',
      type: invData?.type || '',
      creatorName: invData?.from || '',
      creatorUid: invData?.creatorUid || '',
      recipientUid: user?.uid || null
    };

    await ZAP.db.createReport({
      targetType: isGroup ? 'group-invite' : 'invite',
      targetId: invId,
      reason,
      comment,
      reporterUid: user?.uid || null,
      reporterName: ZAP.auth.getProfile()?.name || 'Анонім',
      targetContent,
    });

    document.querySelector('.overlay')?.remove();
    ZAP.utils.toast('Скаргу надіслано. Дякуємо!', 'success');
  }

  let _resizeHandler = null;
  function checkScroll() {
    const bg = document.querySelector('.invite-bg');
    const env = document.querySelector('.invite-envelope');
    if (!bg || !env) return;
    const overflow = env.offsetHeight - window.innerHeight;
    bg.style.overflowY = overflow > 5 ? 'auto' : '';
  }
  function initScrollCheck() {
    checkScroll();
    _resizeHandler = () => checkScroll();
    window.addEventListener('resize', _resizeHandler);
  }
  function destroyScrollCheck() {
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
  }

  ZAP.pages = ZAP.pages || {};
  ZAP.pages.invite = {
    render, loadPersonal, loadGroup,
    answer, toggleReschedule, sendReschedule,
    joinGroup, declineGroup, setGuestName,
    showReport, submitReport,
    initScrollCheck, destroyScrollCheck,
  };
})();
