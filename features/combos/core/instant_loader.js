// features/combos/core/instant_loader.js

// הצטיידות מיידית בקומבו — משגרת את הפעולות של המשחק עצמו במקום לנווט בין
// טאבים וללחוץ. זה המסלול שמחווט לכרטיס; המסלול הישן (combo_loader.js)
// נשאר בעץ ומשמש כ-fallback לפריט בודד שנכשל.
//
// חלוקת העבודה: כאן מחליטים **מה** להחיל, ובעולם MAIN מחליטים **איך**.
// הסיבה פשוטה — פתרון של פריט תלוי במצב החי (מה בבעלות, איזו Mk, מה כבר
// מורכב), והמצב קיים רק שם. לכן נשלח קומבו רצוי אחד ומתקבל דוח לפי חריץ,
// במקום עשר הלוך-ושוב.
//
// מה נעשה כאן:
//   * מסננים את מה שהמשתמש ביטל בכרטיס (removedItems).
//   * מכבדים את ההגדרה equipProtectionsOnLoad.
//   * מפעילים fallback ל-DOM על **הפריט הבודד** שנכשל, לא על הקומבו כולו.
//
// ההבחנה החשובה: פריט שאינו בבעלות המשתמש אינו "כשל" אלא חוסר. הוא לא
// ניתן להצטיידות בשום מסלול, וגם ה-DOM ייכשל בו — אז מדלגים ומדווחים,
// בלי לבזבז עליו ניווט איטי.

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

  // בונה את הקומבו הרצוי מתוך הרשומה השמורה, אחרי הסרות והגדרות.
  //
  // הגנות: המשחק מקבל מצב מלא של 4 חריצים, ולכן חריץ שהמשתמש הסיר הופך
  // ל-null — כלומר ההגנה שם באמת תוסר. זה מכוון וזו ההתנהגות הקיימת.
  // קומבו בלי הגנות בכלל שולח null, שפירושו "אל תיגע בהגנות".
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
    // מחיל קומבו. מחזירה {ok, results, usedFallback} — הקורא לא חייב
    // להסתכל בזה; הכל מדווח גם לקונסול.
    async equipCombo(combo) {
      const bridge = window.TankiQoL.GarageBridge;
      if (!bridge || !bridge.applyCombo) {
        return this._fallbackWholeCombo(combo, "GarageBridge not loaded");
      }

      const includeProtections = await readSetting("equipProtectionsOnLoad", true);
      const desired = buildDesired(combo, includeProtections);

      let res;
      try {
        res = await bridge.applyCombo(desired);
      } catch (e) {
        return this._fallbackWholeCombo(combo, String(e));
      }

      // המסלול המיידי לא זמין בכלל (state לא נתפס, גילוי נכשל) — כאן
      // הנפילה היא על הקומבו כולו, כי שום חריץ לא יצא לדרך.
      if (!res || (!res.results && !res.ok)) {
        return this._fallbackWholeCombo(combo, (res && res.error) || "no response");
      }

      const failed = (res.results || []).filter((r) => r.status === "failed");
      const unavailable = (res.results || []).filter((r) => r.status === "unavailable");

      if (window.TankiQoL.DEBUG) {
        console.log("[ComboManager] instant equip:", res.ms + "ms", res.results);
      }
      if (unavailable.length) {
        console.warn(
          "[ComboManager] not in this account's garage, skipped: " +
            unavailable.map((r) => r.slot + " (" + r.name + ")").join(", "),
        );
      }

      // כשל אמיתי בחריץ בודד -> משלימים אותו בלבד דרך ה-DOM
      let usedFallback = false;
      for (const f of failed) {
        console.warn("[ComboManager] slot failed natively: " + f.slot + " — " + f.error);
        if (await this._fallbackSlot(combo, f.slot)) usedFallback = true;
      }

      return { ok: failed.length === 0, results: res.results, usedFallback };
    },

    // fallback לחריץ בודד. מסלול ה-DOM הישן יודע לצייד פריטי בסיס, אוגמנטים
    // והגנות; לצבע ולסקינים אין לו מקבילה, ושם אין מה לעשות מלבד לדווח.
    // שמות הטאבים והסוגים הם בדיוק אלה שה-combo_loader הישן מעביר.
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
      } catch (e) {
        console.warn("[ComboManager] DOM fallback for " + slot + " failed:", e);
      }
      return false;
    },

    // המסלול המיידי לא זמין כלל -> הקומבו כולו עובר לאקוויפר הישן
    async _fallbackWholeCombo(combo, why) {
      console.warn("[ComboManager] instant equip unavailable (" + why + ") — using the DOM path");
      const loader = window.TankiQoL.ComboLoader;
      if (!loader) return { ok: false, error: why, usedFallback: false };
      await loader.equipCombo(combo);
      return { ok: true, usedFallback: true };
    },

    // חשוף לבדיקות אופליין
    _internals: { buildDesired },
  };
})();
