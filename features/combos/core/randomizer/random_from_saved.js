// features/combos/core/randomizer/random_from_saved.js

// בוחר קומבו אקראי מהקומבואים השמורים ומצטייד בו
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.RandomFromSaved = {
    // ביצוע רנדום מתוך קומבואים שמורים — מחזיר את ה-data של הקומבו שנבחר
    async execute() {
      const LanguageManager = window.TankiQoL.LanguageManager;

      // טעינת קומבואים מה-storage
      const combos = await this._loadCombos();

      // סינון לפי שפה נוכחית
      const currentLang = LanguageManager
        ? LanguageManager.getCurrentLanguageCode()
        : "en";
      const filtered = combos.filter((combo) => {
        const comboLang = combo.language || "en";
        return comboLang === currentLang;
      });

      if (filtered.length === 0) {
        console.warn("[ComboManager] Randomizer: No saved combos to pick from");
        return null;
      }

      // בחירה אקראית
      const randomIndex = Math.floor(Math.random() * filtered.length);
      const randomCombo = filtered[randomIndex];

      // הצטיידות בקומבו — במסלול המיידי, עם נפילה ל-DOM כמו מהכרטיס עצמו
      const InstantLoader = window.TankiQoL.InstantLoader;
      if (InstantLoader) {
        await InstantLoader.equipCombo(randomCombo);
      } else {
        await window.TankiQoL.ComboLoader.equipCombo(randomCombo);
      }

      // חזרה לכרטיסיית COMBOS (רלוונטי רק כשמסלול ה-DOM ניווט בין טאבים;
      // במסלול המיידי אנחנו כבר שם וזה no-op מהיר)
      await this._navigateBackToCombos();

      // החזרת data הקומבו שנבחר (ללא removedItems)
      return randomCombo.data || null;
    },

    // טעינת קומבואים מ-chrome.storage.local (עטיפת callback ב-Promise)
    _loadCombos() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["savedCombos"], (result) => {
          resolve(result.savedCombos || []);
        });
      });
    },

    // ניווט חזרה לכרטיסיית COMBOS עם delay ארוך יותר
    async _navigateBackToCombos() {
      const DOM = window.TankiQoL.DOM;
      const MenuInjector = window.TankiQoL.MenuInjector;
      const menuContainer = document.querySelector(DOM.MENU_CONTAINER);

      if (
        menuContainer &&
        MenuInjector &&
        MenuInjector.comboTab &&
        MenuInjector.comboTabUnderline
      ) {
        await MenuInjector.safeActivateComboTab(
          MenuInjector.comboTab,
          menuContainer,
          MenuInjector.comboTabUnderline,
          150,
        );
      }
    },
  };
})();
