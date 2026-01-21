// core/combo_cleaner.js

// מודול זה אחראי לניקוי אוטומטי של קומבואים ריקים
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ComboCleaner = {

        // בדיקה אם קומבו ריק (כל הפריטים הוסרו או לא קיימים)
        isComboEmpty(combo) {
            if (!combo || !combo.data) return true;

            const data = combo.data;
            const removedItems = combo.removedItems || {};

            // בדיקת פריטים ראשיים (turret, hull, grenade, drone)
            const hasActiveTurret = data.turret && !removedItems.turret;
            const hasActiveHull = data.hull && !removedItems.hull;
            const hasActiveGrenade = data.grenade && !removedItems.grenade;
            const hasActiveDrone = data.drone && !removedItems.drone;

            // בדיקת הגנות - protection היא מערך
            const protections = data.protection && Array.isArray(data.protection) ? data.protection : [];
            const removedProtections = removedItems.protection || [];
            let hasActiveProtection = false;

            // בדיקה אם יש לפחות הגנה אחת שלא הוסרה
            for (let i = 0; i < protections.length; i++) {
                if (protections[i] && !removedProtections.includes(i)) {
                    hasActiveProtection = true;
                    break;
                }
            }

            // הקומבו ריק רק אם אין אף פריט פעיל
            return !hasActiveTurret && !hasActiveHull && !hasActiveGrenade &&
                !hasActiveDrone && !hasActiveProtection;
        },

        // מחיקה אוטומטית של קומבואים ריקים
        // מקבלת callback שייקרא אחרי המחיקה (אופציונלי)
        removeEmptyCombos(callback) {
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                const originalLength = combos.length;

                // סינון קומבואים - הסרת קומבואים ריקים
                combos = combos.filter(combo => !this.isComboEmpty(combo));

                const removedCount = originalLength - combos.length;

                // שמירה רק אם היו קומבואים ריקים
                if (removedCount > 0) {
                    chrome.storage.local.set({ savedCombos: combos }, () => {
                        console.log(`[ComboManager] Removed ${removedCount} empty combo(s)`);
                        if (callback) callback(removedCount);
                    });
                } else {
                    // אם לא היו קומבואים ריקים, עדיין נקרא ל-callback
                    if (callback) callback(0);
                }
            });
        }
    };
})();
