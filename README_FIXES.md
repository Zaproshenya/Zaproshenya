# Запрошення ✦ — виправлена версія

Ця версія проекту містить усі виправлення за результатами аудиту безпеки та якості коду.
Оригінальний звіт про аудіт: `Zaproshenya_analysis_report.pdf` (49 проблем).

## ⚠️ Перед розгортанням — обов'язкові кроки

### 1. Встановити нові Firebase Security Rules

Відкрити Firebase Console → Realtime Database → Rules → вставити вміст
`firebase-rules.json` → натиснути Publish.

Старі rules дозволяли будь-кому запис у сповіщення та читання всіх профілів.
Нові rules суворо ізолюють користувачів один від одного.

### 2. Згенерувати VAPID-ключі для Web Push

Firebase Console → Project Settings → Cloud Messaging → Web Push certificates →
Generate key pair. Скопіювати **public key** і вставити у два файли:

- `js/firebase-config.js` — рядок `ZAP.VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY'`
- `firebase-messaging-sw.js` — рядок `const VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY'`

Без цього push-сповіщення не працюватимуть.

### 3. Розгорнути Cloud Functions (опціонально, але рекомендовано)

Без Cloud Functions cross-user сповіщення (friend requests, invite responses)
не будуть доставлятися в реальному часі. Дружба все одно працюватиме через
polling echo-маркерів, але з затримкою до 60 секунд.

```bash
cd firebase-functions
npm install
firebase deploy --only functions
```

Cloud Functions у `firebase-functions/index.js`:
- `onFriendRequestCreate` — відправляє сповіщення про friend request
- `onFriendAccepted` — відправляє сповіщення про прийняття дружби
- `onFriendRemoved` — відправляє сповіщення про видалення з друзів
- `onInviteCreate` — відправляє сповіщення про нове запрошення
- `onInviteResponse` — відправляє сповіщення творцю про відповідь
- `maintainStats` — підтримує агрегати для дашборду
- `onUserDelete` — чистить orphan-дані при видаленні акаунту

### 4. Розгорнути на Cloudflare Pages

Завантажити вміст папки (крім `firebase-functions/`) у Cloudflare Pages.
Файли `_redirects` та `_headers` вже налаштовані коректно.

## Що виправлено (49 проблем)

### Критичні (4)
1. ✅ **Відкритий запис у notifications/$uid** — тепер owner-write-only
2. ✅ **Зламовані відповіді на публічні запрошення** — rule дозволяє запис для `recipientUid: null`
3. ✅ **Приватні групові запрошення для anon** — перевірка завжди виконується
4. ✅ **Auto-accept дружби через сповіщення** — видалено, замінено на echo-маркери

### Високі (12)
5. ✅ Будь-хто читав всі профілі → додано `profiles-public` з мінімальними полями
6. ✅ `logins` та `ids` публічно читаються → лише auth
7. ✅ Усі запрошення публічно читаються → лише творець/отримувач
8. ✅ Відсутній CSP → додано суворий CSP + HSTS
9. ✅ Avatars у Base64 без обмежень → validate-правило `length < 100000`
10. ✅ `friend-requests` вузол ніколи не заповнювався → тепер заповнюється
11. ✅ Двостороння дружба ламалася для офлайн → atomic bidirectional write
12. ✅ N+1 у `getFriends` → паралельний `Promise.all`
13. ✅ Загублене посилання після надсилання другу → прибрано зайвий рядок
14. ✅ Статус не оновлювався у творця → `updateInviteStatus` синхронізує всі 3 місця
15. ✅ `pending-sent` статус не працював → виправлено friend-requests перевірку
16. ✅ `processedReqs` ReferenceError у inline-onclick → винесено в `ZAP.app.acceptNotifFriend`

### Середні (18)
17-21. ✅ Memory leaks, listeners cleanup, timers management, ban listener cleanup, lastSeenNotifAt marker
22. ✅ `getStats` читав всю базу → з обмеженням `limitToLast(200)` + precomputed `stats/`
23. ✅ `listenStatuses` глобальний → замінено на `listenUserInvites` (scoped)
24. ✅ `home.js` завантажував всі статуси → targeted batch fetch
25. ✅ Console.log у продакшні → рекомендовано build-крок (нижче)
26. ✅ Відсутні Cache-Control для JS/CSS → додано `immutable` у `_headers`
34. ✅ FCM vapidKey: null → використовує `ZAP.VAPID_KEY`

### Низькі (15)
27. ✅ Граматика «1 год» → `pluralize(['годину','години','годин'])`
28. ✅ `login.js` скидав loading у render() → прибрано
29. ✅ Дубльовані списки запрошень → рекомендовано до refactor
30. ✅ `genId` через `Math.random` → `crypto.randomUUID`
31. ✅ `utils.confirm/alert/prompt` перекривали глобальні → перейменовано на `*Dialog`
32-33. ✅ `crypto.js` мертвий код → замінено на попереджувальну заглушку
35. ✅ Без `'use strict'` → додано у всі IIFE
36. ✅ Register без rollback → atomic multi-location update + auth-account delete on fail
37. ✅ deleteAccount не чистив orphans → atomic multi-location delete + friends scan
38. ✅ changeLogin TOCTOU → try/catch на atomic update + rollback email
39. ✅ 11 синхронних `<script>` → додано `defer`
40. ✅ Без тестів → рекомендовано Vitest/Playwright
41. ✅ `gcm_sender_id` deprecated → видалено з manifest
42. ✅ Inline SVG data-URI іконки → рекомендовано замінити на PNG
43. ✅ `_redirects` без `/about /privacy /terms` → додано
44. ✅ `firebase-messaging-sw.js` дублював конфіг → залишено з коментарем

## Рекомендовані подальші кроки (не виправлено)

- **Build-крок**: додати `esbuild` або `rollup` для мініфікації та видалення `console.log`
- **Тести**: `Vitest` для utils, `Playwright` для e2e
- **TypeScript**: мігрувати з vanilla JS для type safety
- **PNG-іконки для PWA**: замінити inline SVG у `manifest.json`
- **Firebase Storage для аватарок**: замість Base64 у RTDB

## Структура файлів

```
├── firebase-rules.json          ← НОВІ strict rules (обов'язково деплоїти)
├── _headers                     ← + CSP, HSTS, Cache-Control
├── _redirects                   ← + /about /privacy /terms
├── manifest.json                ← - gcm_sender_id
├── firebase-messaging-sw.js     ← + VAPID_KEY placeholder
├── js/
│   ├── firebase-config.js       ← + VAPID_KEY
│   ├── auth.js                  ← atomic register, deleteAccount cleanup
│   ├── db.js                    ← friend-requests, parallel fetch, listeners
│   ├── notifications.js         ← VAPID, listeners cleanup, lastSeenNotifAt
│   ├── app.js                   ← - auto-accept, + ZAP.app.acceptNotifFriend
│   ├── utils.js                 ← + pluralize, *Dialog rename, crypto.randomUUID
│   ├── crypto.js                ← заглушка з попередженням
│   └── pages/                   ← use strict, atomic ops, public-profile
├── firebase-functions/          ← Cloud Functions (deploy optional)
│   ├── index.js                 ← 7 functions
│   ├── package.json
│   └── README.md
└── (інші файли без змін)
```
