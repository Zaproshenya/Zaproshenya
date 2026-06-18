# Cloud Functions for Firebase

These Cloud Functions handle operations that **cannot** be done securely from the client
under the new strict Security Rules (where `notifications/$uid` is owner-write-only and
`friends/$uid` is owner-write-only).

## Required functions

### 1. `deliverNotification` — cross-user notification delivery

Triggered when a write occurs in the public `outbox/$fromUid` node. Validates the payload
and writes it to the recipient's `notifications/$toUid`.

### 2. `onFriendRequestCreate` — sends "friend request" notification

Triggered when `friend-requests/$toUid/$fromUid` is created. Writes a `friend-request`
notification to `$toUid`'s notifications.

### 3. `onFriendAccept` — sends "friend accepted" notification

Triggered when `friend-requests/$uid/*_accepted` marker is created. Sends a `friend-accepted`
notification to the original requester.

### 4. `maintainStats` — keeps aggregate counters fresh

Triggered on writes to `users`, `invites`, `group-invites`, `statuses`, `reports`, `friends`.
Recomputes counters under `stats/` so the admin dashboard doesn't need to dump the entire DB.

## Deployment

```bash
cd firebase-functions
npm install
firebase deploy --only functions
```

## Notes

- The client-side code in `js/db.js` already attempts to write to `notifications/$uid`
  (it will silently fail under the new rules — that's expected).
- The `friend-requests/$uid/*_accepted` and `*_removed` echo markers are written by the
  accepting/removing party (allowed by rules) and consumed by the other side's client
  poller (`getFriendEchoes` in `js/db.js`). The Cloud Function is needed only if you want
  real-time push notifications for these events.
