// features/combos/main/garage/boot.js  [MAIN world]

// נטען אחרון: מתקין את המלכודות בשמות ה-seed ומודיע ל-ISOLATED שאפשר לשלוח.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  I.armAll();   // כיסוי מיידי עד שהגילוי חוזר ודורס את השמות
  window.postMessage({ __cmb: true, dir: 'm2i', action: 'ready' }, '*');
})();
