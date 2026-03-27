// core/randomizer/random_from_saved.js

// בוחר קומבו אקראי מהקומבואים השמורים ומצטייד בו
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.RandomFromSaved = {

        // ביצוע רנדום מתוך קומבואים שמורים
        async execute() {
            const ComboLoader = window.TankiComboManager.ComboLoader;
            const LanguageManager = window.TankiComboManager.LanguageManager;

            // טעינת קומבואים מה-storage
            const combos = await this._loadCombos();

            // סינון לפי שפה נוכחית
            const currentLang = LanguageManager ? LanguageManager.getCurrentLanguageCode() : 'en';
            const filtered = combos.filter(combo => {
                const comboLang = combo.language || 'en';
                return comboLang === currentLang;
            });

            if (filtered.length === 0) {
                console.warn('[ComboManager] Randomizer: No saved combos to pick from');
                return;
            }

            // בחירה אקראית
            const randomIndex = Math.floor(Math.random() * filtered.length);
            const randomCombo = filtered[randomIndex];

            // הצטיידות בקומבו
            await ComboLoader.equipCombo(randomCombo);

            // חזרה לכרטיסיית COMBOS
            await this._navigateBackToCombos();
        },

        // טעינת קומבואים מ-chrome.storage.local (עטיפת callback ב-Promise)
        _loadCombos() {
            return new Promise((resolve) => {
                chrome.storage.local.get(['savedCombos'], (result) => {
                    resolve(result.savedCombos || []);
                });
            });
        },

        // ניווט חזרה לכרטיסיית COMBOS עם delay ארוך יותר
        async _navigateBackToCombos() {
            const DOM = window.TankiComboManager.DOM;
            const MenuInjector = window.TankiComboManager.MenuInjector;
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);

            if (menuContainer && MenuInjector && MenuInjector.comboTab && MenuInjector.comboTabUnderline) {
                await MenuInjector.safeActivateComboTab(
                    MenuInjector.comboTab,
                    menuContainer,
                    MenuInjector.comboTabUnderline,
                    150
                );
            }
        }
    };
})();
