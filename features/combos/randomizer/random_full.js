// features/combos/randomizer/random_full.js

// רנדום מלא במסלול המיידי: ההגרלה בעולם MAX, ההחלה דרך applyCombo.
// המסלול הישן שניווט בין כרטיסיות נשאר ב-old/.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // שמות להחרגה, בשפה שהמשתמש משחק בה
  function buildExcludes(advanced) {
    const LM = window.TankiQoL.LanguageManager;
    const lang = LM ? LM.getCurrentLanguage() : null;
    const names = (lang && lang.itemNames) || {};
    const out = {};
    if (advanced.excludeBrutus) out.drones = [names.brutus || "BRUTUS"];
    if (advanced.excludeTsarGrenade) out.grenades = [names.tsar || "TSAR"];
    return out;
  }

  // חריץ שנכשל בהחלה לא יוצג בכרטיס — עדיף חסר מאשר שקר
  function dropFailedSlots(data, results) {
    for (const r of results || []) {
      if (r.status !== "failed" && r.status !== "unavailable") continue;
      if (Object.prototype.hasOwnProperty.call(data, r.slot)) data[r.slot] = null;
    }
    return data;
  }

  window.TankiQoL.RandomFull = {
    // מחזיר {ok, data} — data הוא הקומבו להצגה בכרטיס
    async execute(settings) {
      const bridge = window.TankiQoL.GarageBridge;
      if (!bridge || !bridge.drawRandom) {
        return this._legacy(settings);
      }

      const advanced = settings.advanced || {};
      let drawn;
      try {
        drawn = await bridge.drawRandom({
          categories: settings.categories,
          advanced,
          exclude: buildExcludes(advanced),
        });
      } catch (e) {
        return this._legacy(settings);
      }
      if (!drawn || !drawn.ok || !drawn.data) {
        return this._legacy(settings);
      }

      return { ok: true, data: drawn.data, desired: drawn.desired };
    },

    // ההחלה עצמה, אחרי שהכרטיס כבר מוצג במצב טעינה
    async apply(drawn) {
      const bridge = window.TankiQoL.GarageBridge;
      if (!bridge || !drawn || !drawn.desired) return drawn && drawn.data;

      let res = null;
      try {
        res = await bridge.applyCombo(drawn.desired);
      } catch (e) { /* הכרטיס עדיין יוצג לפי מה שהוגרל */ }

      if (res && res.cooldown) return null;
      return dropFailedSlots(drawn.data, res && res.results);
    },

    // אין גשר -> המסלול הישן, שמצייד דרך ה-DOM ומחזיר data
    async _legacy(settings) {
      const old = window.TankiQoL.RandomFullLegacy;
      if (!old) return { ok: false };
      const data = await old.execute(settings);
      return { ok: !!data, data, desired: null, alreadyApplied: true };
    },
  };
})();
