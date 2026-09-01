// features/combos/randomizer/random_from_saved.js

// בוחר קומבו אקראי מהשמורים. הבחירה וההצטיידות מופרדות, כדי שהכרטיס
// יוצג במצב טעינה בזמן שמצטיידים.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.RandomFromSaved = {
    // מחזיר את הקומבו שנבחר, בלי לצייד
    async choose() {
      const LanguageManager = window.TankiQoL.LanguageManager;
      const combos = await this._loadCombos();

      const currentLang = LanguageManager
        ? LanguageManager.getCurrentLanguageCode()
        : "en";
      const filtered = combos.filter(
        (combo) => (combo.language || "en") === currentLang,
      );
      if (filtered.length === 0) return null;

      return filtered[Math.floor(Math.random() * filtered.length)];
    },

    // אותו מסלול בדיוק כמו לחיצה על הכרטיס
    async equip(combo) {
      const InstantLoader = window.TankiQoL.InstantLoader;
      if (InstantLoader) return InstantLoader.equipCombo(combo);
      if (window.TankiQoL.ComboLoader) {
        await window.TankiQoL.ComboLoader.equipCombo(combo);
        // המסלול הישן מנווט בין כרטיסיות; חוזרים לקומבואים
        await this._navigateBackToCombos();
      }
      return { ok: true };
    },

    _loadCombos() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["savedCombos"], (result) => {
          resolve(result.savedCombos || []);
        });
      });
    },

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
