// features/combos/core/combo_migrator.js

// משלים id/baseItemId לקומבואים ישנים ברקע, בכל טעינת רשימה.
// אידמפוטנטי, לא מוחק כלום, ולא מנחש. הרציונל: CLAUDE.mds/combos.md

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ComboMigrator = {
    // ה-callback מקבל כמה קומבואים השתנו (0 גם כשאין מה לעשות)
    backfillIds(callback) {
      const M = window.TankiQoL.ComboMatch;
      if (!M) {
        if (callback) callback(0);
        return;
      }

      chrome.storage.local.get(["savedCombos"], async (result) => {
        const combos = result.savedCombos || [];
        const pending = combos.filter(M.comboNeedsWork);
        if (!pending.length) {
          if (callback) callback(0);
          return;
        }

        const bridge = window.TankiQoL.GarageBridge;
        if (!bridge) {
          if (callback) callback(0);
          return;
        }

        let index;
        try {
          const payload = await bridge.readIndex();
          // ה-state עוד לא נתפס — ננסה שוב בטעינה הבאה
          if (!payload || !payload.ok) {
            if (callback) callback(0);
            return;
          }
          index = M.buildIndex(payload);
        } catch (e) {
          if (callback) callback(0);
          return;
        }

        let changedCount = 0;
        for (const combo of pending) {
          if (M.migrateCombo(combo, index)) changedCount++;
        }

        // כותבים רק אם הושלם משהו, אחרת כל רינדור היה כותב לאחסון
        if (!changedCount) {
          if (callback) callback(0);
          return;
        }
        chrome.storage.local.set({ savedCombos: combos }, () => {
          if (callback) callback(changedCount);
        });
      });
    },
  };
})();
