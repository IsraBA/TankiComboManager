// features/advisor/bridge/game/bridge_main.js  [MAIN world]

// הצד של MAIN: עונה על בקשת מצב אחת עם דירוג האיום ומלאי המודולים.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__ADV = W.__ADV || {});
  const I = (NS.internals = NS.internals || {});

  function reply(id, payload) {
    W.postMessage({
      __adv: true, dir: 'm2i', action: 'stateResult',
      payload: Object.assign({ id }, payload),
    }, '*');
  }

  // '0' הוא ה-state ההתחלתי, לא קרב
  function inBattle() {
    const b = I.battle;
    if (!b) return false;
    const m = I.fieldMap(b);
    if (!m) return false;
    return b[m.battleLoaded] === true && I.cell(b[m.battleId]) !== '0';
  }

  W.addEventListener('message', (e) => {
    if (e.source !== W) return;
    const msg = e.data;
    if (!msg || !msg.__adv || msg.dir !== 'i2m') return;
    if (msg.action !== 'advisorState') return;
    const id = (msg.payload || {}).id;

    try {
      // אותה חסימה שהקומבואים בודקים
      const C = W.__CMB && W.__CMB.internals;
      const cd = C && C.mountCooldown ? C.mountCooldown() : null;
      const here = inBattle();
      reply(id, {
        ok: true,
        inBattle: here,
        cooling: !!(cd && cd.active),
        mounted: I.mountedProtectionIds(),
        turrets: here ? I.rankTurrets() : [],
        modules: I.readModules() || [],
      });
    } catch (err) {
      NS.debug.lastError = String(err);
      reply(id, { ok: false, error: String(err) });
    }
  });
})();
