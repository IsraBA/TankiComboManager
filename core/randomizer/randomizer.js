// core/randomizer/randomizer.js

// מנהל הרנדומיזציה — טוען הגדרות ומפעיל את המצב הנכון
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    const STORAGE_KEY = 'randomizerSettings';

    // הגדרות ברירת מחדל
    const DEFAULT_SETTINGS = {
        mode: 'full_random',
        categories: {
            turrets: true,
            turretAugment: true,
            hulls: true,
            hullAugment: false,
            grenades: true,
            drones: true
        },
        advanced: {
            legendaryOnly: true,
            maxEquipmentOnly: true,
            excludeBrutus: true,
            excludeTsarGrenade: true
        }
    };

    window.TankiComboManager.Randomizer = {

        // הפעלת הרנדומייזר
        async run() {
            // בדיקה שאנחנו במוסך
            const DOM = window.TankiComboManager.DOM;
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) {
                console.warn('[ComboManager] Randomizer: Not in garage');
                return;
            }

            // טעינת הגדרות
            const settings = await this.loadSettings();

            // הפעלת המצב המתאים
            if (settings.mode === 'from_saved') {
                const RandomFromSaved = window.TankiComboManager.RandomFromSaved;
                if (RandomFromSaved) {
                    await RandomFromSaved.execute();
                }
            } else {
                const RandomFull = window.TankiComboManager.RandomFull;
                if (RandomFull) {
                    await RandomFull.execute(settings);
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
        }
    };
})();