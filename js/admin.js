(function () {
  function addControls(page) {
    // Topbar: add dashboard button before user section
    var topRight = document.querySelector('.topbar-right');
    if (topRight && !document.querySelector('.nb[aria-label="Дашборд"]')) {
      var btn = document.createElement('button');
      btn.className = 'nb' + (page === 'dashboard' ? ' on' : '');
      btn.setAttribute('aria-label', 'Дашборд');
      // Create icon wrapper to allow absolute positioning of badge
      btn.innerHTML = '<div style="position:relative;display:inline-block">' + ZAP.utils.icon('chart-bar', 18) + '<span class="admin-badge" style="display:none;position:absolute;top:-4px;right:-8px;background:var(--red);color:#fff;font-size:10px;font-weight:bold;padding:2px 5px;border-radius:10px;line-height:1"></span></div>';
      btn.onclick = function () { ZAP.router.go('dashboard'); };
      var ref = topRight.querySelector('.topbar-user, .btn-outline');
      if (ref) { topRight.insertBefore(btn, ref); } else { topRight.appendChild(btn); }
    }

    // Bottom nav: change Профіль → Панель
    var items = document.querySelectorAll('.bn-item');
    for (var i = 0; i < items.length; i++) {
      var span = items[i].querySelector('span');
      if (span && span.textContent === 'Профіль') {
        items[i].onclick = function () { ZAP.router.go('dashboard'); };
        var div = items[i].querySelector('div');
        if (div) {
          div.style.position = 'relative';
          div.innerHTML = ZAP.utils.icon('chart-bar', 22) + '<span class="admin-badge-mobile" style="display:none;position:absolute;top:-2px;right:-6px;background:var(--red);color:#fff;font-size:9px;font-weight:bold;padding:1px 4px;border-radius:10px;line-height:1"></span>';
        }
        span.textContent = 'Панель';
        if (page === 'dashboard') { items[i].classList.add('on'); } else { items[i].classList.remove('on'); }
      }
    }
  }

  function updateBadge(count) {
    var desktopBadge = document.querySelector('.admin-badge');
    if (desktopBadge) {
      if (count > 0) {
        desktopBadge.textContent = count > 99 ? '99+' : count;
        desktopBadge.style.display = 'block';
      } else {
        desktopBadge.style.display = 'none';
      }
    }

    var mobileBadge = document.querySelector('.admin-badge-mobile');
    if (mobileBadge) {
      if (count > 0) {
        mobileBadge.textContent = count > 99 ? '99+' : count;
        mobileBadge.style.display = 'block';
      } else {
        mobileBadge.style.display = 'none';
      }
    }
  }

  window.ZAP_ADMIN = { addControls: addControls, updateBadge: updateBadge };
})();
