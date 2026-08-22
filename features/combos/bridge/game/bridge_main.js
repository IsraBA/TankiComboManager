// features/combos/bridge/game/bridge_main.js  [MAIN world]

// צד MAIN של הגשר: מקבל בקשות מהעולם ISOLATED ומחזיר תשובה עם אותו מזהה.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  function reply(action, payload) {
    window.postMessage({ __cmb: true, dir: 'm2i', action, payload }, '*');
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'i2m') return;

    if (m.action === 'garageConstants') {
      try { I.applyNames(m.payload); } catch (err) { NS.debug.lastError = String(err); }
      return;
    }

    if (m.action === 'readCombo') {
      const id = (m.payload || {}).id;
      // ממתינים לקטלוג האוגמנטים שנטען בעצלות, אחרת שמירה מיד אחרי
      // ריענון יוצאת בלי אוגמנטים. התקרה קטנה מה-timeout של הגשר.
      (async () => {
        try { await I.waitForMountedDeviceCatalogs(2500); } catch (err) { /* ממשיכים */ }
        let res;
        try { res = I.readCombo(); } catch (err) { res = { ok: false, error: String(err) }; }
        reply('comboResult', Object.assign({ id }, res));
      })();
      return;
    }

    if (m.action === 'cooldown') {
      const id = (m.payload || {}).id;
      let res;
      try { res = I.mountCooldown(); } catch (err) { res = { known: false, active: false, msLeft: 0 }; }
      reply('cooldownResult', Object.assign({ id, ok: true }, res));
      return;
    }

    if (m.action === 'readIndex') {
      const id = (m.payload || {}).id;
      let res;
      try { res = I.readIndex(); } catch (err) { res = { ok: false, error: String(err) }; }
      reply('indexResult', Object.assign({ id }, res));
      return;
    }

    if (m.action === 'selectPaint') {
      const id = (m.payload || {}).id;
      let ok = false;
      try { ok = I.selectMountedPaint(); } catch (err) { /* המודל בלבד */ }
      reply('selectPaintResult', { id, ok });
      return;
    }

    if (m.action === 'drawRandom') {
      const p = m.payload || {};
      // אסינכרוני: ממתין לקטלוג האוגמנטים של מה שהוגרל
      I.drawRandomCombo(p.settings)
        .catch((err) => ({ ok: false, error: String(err) }))
        .then((res) => reply('drawResult', Object.assign({ id: p.id }, res)));
      return;
    }

    if (m.action === 'applyCombo') {
      const p = m.payload || {};
      // אסינכרוני: יש השהיות בין פריט לפריט
      I.applyCombo(p.desired, p.opts)
        .catch((err) => ({ ok: false, error: String(err) }))
        .then((res) => reply('applyResult', Object.assign({ id: p.id }, res)));
    }
  });
})();
