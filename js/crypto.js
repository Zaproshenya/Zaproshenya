/* ═══════════════════════════════════════════════════════
   Crypto — AES-GCM encryption via Web Crypto API
   ═══════════════════════════════════════════════════════

   ⚠️  This module is currently NOT used anywhere in the app.
   ⚠️  The previous version used a hardcoded SALT and uid as key,
   ⚠️  which provided NO real security (uid is publicly readable).
   ⚠️
   ⚠️  If you need client-side encryption, design it properly:
   ⚠️    - derive key from user's password (not uid)
   ⚠️    - use a unique random salt per user (stored in their profile)
   ⚠️    - keep ciphertext + iv + salt in DB, never the key
   ⚠️
   ⚠️  Kept as a stub for future, properly-designed use.
*/

(function () {
  'use strict';

  // Placeholder — disabled until properly designed
  ZAP.crypto = {
    encrypt: async function () {
      console.warn('ZAP.crypto.encrypt is disabled — see js/crypto.js for details');
      return null;
    },
    decrypt: async function () {
      console.warn('ZAP.crypto.decrypt is disabled — see js/crypto.js for details');
      return null;
    },
  };
})();
