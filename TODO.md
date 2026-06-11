# TODO

## До кінця проекту

### Мініфікація
- [ ] Мініфікувати `js/pages/dashboard.js` (Terser) після всіх фінальних змін
- [ ] Оновити шлях у `js/app.js` на `dashboard.min.js`

### Потенційні покращення
- [ ] Перевірити, що всі security rules у Firebase коректні
- [ ] Очистити зайві консолі логів

## Виконано
- [x] Seamless friend selection (create.js — direct DOM toggle)
- [x] Badge creation on popup (updateUnreadCount)
- [x] Filter old invites in friends.js (!n.read + 7-day)
- [x] Cross-reference answered invites in home.js
- [x] "Переглянути" → "Переглянуто" для прочитаних
- [x] Mobile toggle switch CSS
- [x] Character counter for message textarea (create.js)
- [x] Show friend IDs in group invite selection
- [x] Remove textarea resize
- [x] Remove sync icon from topbar
- [x] Pill-style group friends (like personal mode)
- [x] Seamless togglePublic / toggleRequireAuth
- [x] Extract admin UI to js/admin.js (dynamic load)
- [x] Lazy load dashboard.js (only for admins)
- [x] Guard dashboard load() — redirect non-admins
- [x] Moderation panel in dashboard (all invites, search, user IDs, actions)
