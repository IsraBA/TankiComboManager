// features/combos/isolated/bridge.js  [ISOLATED world]

// הגשר בין קוד הקומבואים (עולם ISOLATED, עובד מול ה-DOM) לבין ההוק שקורא את
// מצב המוסך מתוך המשחק עצמו (עולם MAIN).
//
// למה בכלל צריך גשר: תוכן-סקריפטים רצים כברירת מחדל בעולם ISOLATED, שם יש
// גישה ל-chrome.* אבל אין גישה ל-JS של הדף. ה-trap על Object.prototype שתופס
// את אובייקט מצב המוסך עובד רק בעולם MAIN, ושם אין chrome.*. לכן פיצול לשניים
// והודעות ביניהם — בדיוק כמו בפיצ'ר התרגום ובמו Shaft-Extension-V2.
//
// פרוטוקול: window.postMessage, כל הודעה מתויגת `__cmb` עם כיוון
// (`i2m` = isolated->main, `m2i` = main->isolated).
//
// | כיוון | action           | payload                    | משמעות                        |
// |-------|------------------|----------------------------|-------------------------------|
// | i2m   | garageConstants  | מפת שמות שהתגלתה           | מ-detect.js (ראה שם)          |
// | i2m   | readCombo        | {id}                       | בקשה לקרוא את הקומבו הנוכחי   |
// | m2i   | ready            | —                          | MAIN מודיע שה-listeners שלו עלו |
// | m2i   | comboResult      | {id, ok, combo, ...}       | תשובה לבקשת קריאה             |

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};

  const TIMEOUT_MS = 4000;   // תקרה קשיחה, כדי ש-Promise לא ייתקע לעולם

  let nextId = 1;
  const pending = new Map();   // id -> {resolve, timer}

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'm2i') return;
    if (m.action !== 'comboResult') return;

    const p = m.payload || {};
    const entry = pending.get(p.id);
    if (!entry) return;
    pending.delete(p.id);
    clearTimeout(entry.timer);
    entry.resolve(p);
  });

  window.TankiQoL.GarageBridge = {
    // קורא את הקומבו המצויד כרגע ישירות ממצב המשחק (בלי DOM, בלי ניווט טאבים).
    // מחזיר Promise עם {ok, combo, mounted, stats} או {ok:false, error}.
    readCombo() {
      return new Promise((resolve) => {
        const id = nextId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve({ ok: false, error: 'timeout — MAIN world did not answer' });
        }, TIMEOUT_MS);

        pending.set(id, { resolve, timer });
        window.postMessage({ __cmb: true, dir: 'i2m', action: 'readCombo', payload: { id } }, '*');
      });
    },
  };
})();
