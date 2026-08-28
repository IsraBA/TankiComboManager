// features/advisor/bridge/bridge.js  [ISOLATED world]

// גשר בקשה/תשובה אל בדיקת הקרב בעולם MAIN. תג נפרד מזה של הקומבואים.

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};

  // נסקר בלולאה כל עוד הכרטיסייה פתוחה; עדיף לוותר מהר מלהצטבר
  const TIMEOUT_MS = 1500;

  let nextId = 1;
  const pending = new Map();   // id -> {resolve, timer}

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__adv || m.dir !== 'm2i') return;
    if (m.action !== 'stateResult') return;

    const p = m.payload || {};
    const entry = pending.get(p.id);
    if (!entry) return;
    pending.delete(p.id);
    clearTimeout(entry.timer);
    entry.resolve(p);
  });

  function request(action) {
    return new Promise((resolve) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve({ ok: false, error: 'timeout — MAIN world did not answer' });
      }, TIMEOUT_MS);

      pending.set(id, { resolve, timer });
      window.postMessage({
        __adv: true, dir: 'i2m', action, payload: { id },
      }, '*');
    });
  }

  window.TankiQoL.AdvisorBridge = {
    // {ok, inBattle, turrets[], modules[]} — הכל מה-state החי
    readState() { return request('advisorState'); },
  };
})();
