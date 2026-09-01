// features/combos/equip/instant_loader.js

// מחליט **מה** להחיל ושולח לעולם MAIN, שמחליט **איך**.
// כשל בחריץ בודד נופל ל-DOM; חוסר בעלות מדלגים בלי fallback.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // חריצים רגילים שאפשר לבטל מהכרטיס
  const SLOTS = [
    "turret",
    "hull",
    "grenade",
    "drone",
    "paint",
    "turretSkin",
    "hullSkin",
    "turretAugment",
    "hullAugment",
  ];

  // הגנה שהמשתמש הסיר -> null בחריץ, כלומר הסרה אמיתית.
  // בלי הגנות בכלל -> protection:null, כלומר "אל תיגע בהן".
  function buildDesired(combo, includeProtections) {
    const data = (combo && combo.data) || {};
    const removed = combo.removedItems || {};
    const desired = {};

    for (const slot of SLOTS) {
      if (removed[slot]) continue;
      if (data[slot]) desired[slot] = data[slot];
    }

    if (!includeProtections || !Array.isArray(data.protection)) {
      desired.protection = null;
      return desired;
    }
    const removedIdx = removed.protection || [];
    const slots = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      if (removedIdx.includes(i)) continue;
      slots[i] = data.protection[i] || null;
    }
    desired.protection = slots;
    return desired;
  }

  function readSetting(key, fallback) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (r) => {
          resolve(r && r[key] !== undefined ? r[key] : fallback);
        });
      } catch (e) {
        resolve(fallback);
      }
    });
  }

  window.TankiQoL.InstantLoader = {
    // מחיל קומבו; מחזירה {ok, results, usedFallback}
    // opts.forceProtections — למי שכל עניינו הגנות, ודורס את ההעדפה הכללית
    async equipCombo(combo, opts) {
      const bridge = window.TankiQoL.GarageBridge;
      if (!bridge || !bridge.applyCombo) {
        return this._fallbackWholeCombo(combo, "GarageBridge not loaded");
      }

      const includeProtections =
        (opts && opts.forceProtections === true) ||
        (await readSetting("equipProtectionsOnLoad", true));
      const desired = buildDesired(combo, includeProtections);

      let res;
      try {
        res = await bridge.applyCombo(desired);
      } catch (e) {
        return this._fallbackWholeCombo(combo, String(e));
      }

      // ה-cooldown חוסם גם בשרת, ולכן גם ה-DOM ייכשל — לא נופלים אליו
      if (res && res.cooldown) {
        return { ok: false, cooldown: true, msLeft: res.msLeft, usedFallback: false };
      }

      // שום חריץ לא יצא לדרך -> נפילה על הקומבו כולו
      if (!res || (!res.results && !res.ok)) {
        return this._fallbackWholeCombo(combo, (res && res.error) || "no response");
      }

      // מה שאינו בבעלות מדולג בשקט — אין מסלול שיצליח בו
      const failed = (res.results || []).filter((r) => r.status === "failed");

      // כשל אמיתי בחריץ בודד -> משלימים אותו בלבד דרך ה-DOM
      let usedFallback = false;
      for (const f of failed) {
        if (await this._fallbackSlot(combo, f.slot)) usedFallback = true;
      }

      return { ok: failed.length === 0, results: res.results, usedFallback };
    },

    // ל-DOM יש מקבילה רק לפריטי בסיס, אוגמנטים והגנות — לא לדקורטיביים.
    // שמות הטאבים הם בדיוק אלה שה-combo_loader הישן מעביר.
    async _fallbackSlot(combo, slot) {
      const data = combo.data || {};
      const BASE = {
        turret: ["Turrets", "Turret"],
        hull: ["Hulls", "Hull"],
        grenade: ["Grenades", "Grenade"],
        drone: ["Drones", "Drone"],
      };
      const AUG = { turretAugment: "Turrets", hullAugment: "Hulls" };

      try {
        if (BASE[slot]) {
          const eq = window.TankiQoL.BaseItemEquipper;
          if (!eq || !data[slot]) return false;
          await eq.equipItem(data[slot], BASE[slot][0], BASE[slot][1]);
          return true;
        }
        if (AUG[slot]) {
          const eq = window.TankiQoL.AugmentEquipper;
          if (!eq || !data[slot]) return false;
          await eq.equipAugment(data[slot], AUG[slot]);
          return true;
        }
        if (slot === "protection") {
          const eq = window.TankiQoL.ProtectionEquipper;
          if (!eq || !Array.isArray(data.protection)) return false;
          await eq.equipProtection(data.protection, (combo.removedItems || {}).protection || []);
          return true;
        }
      } catch (e) { /* ה-fallback נכשל -> החריץ פשוט לא הוחל */ }
      return false;
    },

    // המסלול המיידי לא זמין כלל -> הקומבו כולו עובר לאקוויפר הישן
    async _fallbackWholeCombo(combo, why) {
      const loader = window.TankiQoL.ComboLoader;
      if (!loader) return { ok: false, error: why, usedFallback: false };
      await loader.equipCombo(combo);
      return { ok: true, usedFallback: true };
    },

    // חשוף לבדיקות אופליין
    _internals: { buildDesired },
  };
})();
