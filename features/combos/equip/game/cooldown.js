// features/combos/equip/game/cooldown.js  [MAIN world]

// ה-cooldown של החלפת ציוד, כפי שהמשחק עצמו בודק אותו.
// הרציונל: CLAUDE.mds/garage-native.md

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // הרדיוסר כותב now+delayMs, או 0 כשאין הגבלה. הבדיקה של המשחק
  // היא deadline <= now, ולכן חותמת שפגה שקולה לאפס.
  I.mountCooldown = function () {
    const f = I.D.stateFields && I.D.stateFields.delayMountTimeMs;
    if (!I.latestState || !f) return { known: false, active: false, msLeft: 0 };

    const raw = I.latestState[f];
    if (raw == null) return { known: false, active: false, msLeft: 0 };

    // Long מגיע כאובייקט; ה-toString שלו הוא המספר העשרוני
    const deadline = Number(I.idToString(raw));
    if (!isFinite(deadline)) return { known: false, active: false, msLeft: 0 };

    const msLeft = deadline - Date.now();
    if (msLeft <= 0) return { known: true, active: false, msLeft: 0 };
    return { known: true, active: true, msLeft, deadline };
  };
})();
