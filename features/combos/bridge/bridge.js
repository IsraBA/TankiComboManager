// features/combos/bridge/bridge.js  [ISOLATED world]

// גשר בקשה/תשובה אל ההוק בעולם MAIN. כל בקשה נושאת מזהה רץ ותקרת זמן.
// הפרוטוקול המלא: CLAUDE.mds/garage-native.md

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};

  const TIMEOUT_MS = 4000;         // תקרה קשיחה, כדי ש-Promise לא ייתקע לעולם
  const APPLY_TIMEOUT_MS = 20000;  // החלה משהה בין פריט לפריט, ולכן ארוכה יותר
  const REPLIES = { comboResult: true, indexResult: true, applyResult: true };

  let nextId = 1;
  const pending = new Map();   // id -> {resolve, timer}

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'm2i') return;
    if (!REPLIES[m.action]) return;

    const p = m.payload || {};
    const entry = pending.get(p.id);
    if (!entry) return;
    pending.delete(p.id);
    clearTimeout(entry.timer);
    entry.resolve(p);
  });

  function request(action, extra, timeoutMs) {
    return new Promise((resolve) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve({ ok: false, error: 'timeout — MAIN world did not answer' });
      }, timeoutMs || TIMEOUT_MS);

      pending.set(id, { resolve, timer });
      window.postMessage({
        __cmb: true, dir: 'i2m', action,
        payload: Object.assign({ id }, extra || {}),
      }, '*');
    });
  }

  window.TankiQoL.GarageBridge = {
    // {ok, combo, mounted, stats} — הציוד המורכב, ממצב המשחק
    readCombo() { return request('readCombo'); },

    // {ok, items[], devices[]} — אינדקס שטוח למיגרציה (שם -> מזהה)
    readIndex() { return request('readIndex'); },

    // {ok, results[], failed[], unavailable[], ms} — דוח לפי חריץ
    applyCombo(desired, opts) {
      return request('applyCombo', { desired, opts }, APPLY_TIMEOUT_MS);
    },
  };
})();
