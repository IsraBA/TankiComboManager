// features/combos/randomizer/randomizer.js

// מנהל הרנדומיזציה — טוען הגדרות ומפעיל את המצב הנכון
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  const STORAGE_KEY = "randomizerSettings";

  // הגדרות ברירת מחדל
  const DEFAULT_SETTINGS = {
    mode: "full_random",
    categories: {
      turrets: true,
      turretAugment: true,
      hulls: true,
      hullAugment: false,
      grenades: true,
      drones: true,
      paints: true,
      skins: true,
    },
    advanced: {
      legendaryOnly: true,
      maxEquipmentOnly: true,
      excludeBrutus: true,
      excludeTsarGrenade: true,
    },
  };

  // שורה אחת לכיבוי/הדלקה של כרטיס זמני אחרי רנדום
  const SHOW_TEMPORARY_CARD = true;

  window.TankiQoL.Randomizer = {
    // מגריל, מציג את הכרטיס במצב טעינה, מצייד, ואז מכבה את הטעינה
    async run() {
      const DOM = window.TankiQoL.DOM;
      if (!document.querySelector(DOM.MENU_CONTAINER)) return;

      const VR = window.TankiQoL.ViewRenderer;
      if (VR && VR.randomizing) return;
      if (VR && VR.setRandomizing) VR.setRandomizing(true);
      try {
        await this._run();
      } finally {
        if (VR && VR.setRandomizing) VR.setRandomizing(false);
        // הציוד השתנה: הסימון הירוק על הרשימה מיושן. מסמנים מחדש ולא
        // מרנדרים, כדי לא להרוס את הכרטיס הזמני שהרגע הצגנו.
        if (VR && VR.markEquippedCombo) VR.markEquippedCombo();
      }
    },

    async _run() {
      const settings = await this.loadSettings();
      const view = SHOW_TEMPORARY_CARD ? window.TankiQoL.ViewRenderer : null;
      const show = (data, loading) => {
        if (view && data && view.showTemporaryCard) {
          view.showTemporaryCard(data, loading);
        }
      };

      if (settings.mode === "from_saved") {
        const R = window.TankiQoL.RandomFromSaved;
        if (!R) return;
        const combo = await R.choose();
        if (!combo) return;
        show(combo.data, true);
        const res = await R.equip(combo);
        // ה-cooldown חוסם; אין מה להציג כאילו הצטיידנו
        if (res && res.cooldown) {
          if (view) view.removeTemporaryCard();
          return;
        }
        show(combo.data, false);
        return;
      }

      const RF = window.TankiQoL.RandomFull;
      if (!RF) return;
      const drawn = await RF.execute(settings);
      if (!drawn || !drawn.ok || !drawn.data) return;

      // המסלול הישן כבר צייד תוך כדי הסריקה
      if (drawn.alreadyApplied) {
        show(drawn.data, false);
        return;
      }

      show(drawn.data, true);
      const finalData = await RF.apply(drawn);
      if (!finalData) {
        if (view) view.removeTemporaryCard();
        return;
      }
      show(finalData, false);
    },

    // החזרת הגדרות ברירת מחדל
    getDefaultSettings() {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    },

    // טעינת הגדרות מ-storage (ממזג עם ברירות מחדל)
    loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          const stored = result[STORAGE_KEY] || {};
          // מיזוג עם ברירות מחדל — מטפל במפתחות חסרים מגרסאות ישנות
          const merged = this.getDefaultSettings();

          if (stored.mode) merged.mode = stored.mode;

          // מיזוג categories
          if (stored.categories) {
            for (const key in merged.categories) {
              if (stored.categories[key] !== undefined) {
                merged.categories[key] = stored.categories[key];
              }
            }
          }

          // מיזוג advanced
          if (stored.advanced) {
            for (const key in merged.advanced) {
              if (stored.advanced[key] !== undefined) {
                merged.advanced[key] = stored.advanced[key];
              }
            }
          }

          resolve(merged);
        });
      });
    },

    // שמירת הגדרות ל-storage
    saveSettings(settings, callback) {
      chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
        if (callback) callback();
      });
    },
  };
})();
