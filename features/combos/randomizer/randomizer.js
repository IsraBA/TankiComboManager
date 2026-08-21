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
    // הפעלת הרנדומייזר
    async run() {
      // בדיקה שאנחנו במוסך
      const DOM = window.TankiQoL.DOM;
      const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
      if (!menuContainer) {
        return;
      }

      // טעינת הגדרות
      const settings = await this.loadSettings();
      let resultData = null;

      // הפעלת המצב המתאים
      if (settings.mode === "from_saved") {
        const RandomFromSaved = window.TankiQoL.RandomFromSaved;
        if (RandomFromSaved) {
          resultData = await RandomFromSaved.execute();
        }
      } else {
        const RandomFull = window.TankiQoL.RandomFull;
        if (RandomFull) {
          resultData = await RandomFull.execute(settings);
        }
      }

      // הצגת כרטיס זמני עם התוצאה (אם מופעל ויש תוצאה)
      if (SHOW_TEMPORARY_CARD && resultData) {
        const ViewRenderer = window.TankiQoL.ViewRenderer;
        if (ViewRenderer && ViewRenderer.showTemporaryCard) {
          ViewRenderer.showTemporaryCard(resultData);
        }
      }
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
