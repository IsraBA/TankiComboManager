// core/combo_saver.js

// זה הקובץ שעושה את הקסם. הוא עובר כל כרטיסייה, מחכה, בודק מה מצויד, נכנס לאוגמנטים, שומר, וחוזר.
// core/combo_saver.js
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.ComboSaver = {

        // פונקציה ראשית שנקראת בלחיצת כפתור
        async saveCurrentCombo() {
            // אובייקט שיחזיק את התוצאות
            const currentCombo = {
                turret: null,
                turretAugment: null,
                hull: null,
                hullAugment: null,
                grenade: null,
                drone: null,
                protection: null
                // paint: null,  // בוטל - פונקציונליות הצבע הוסרה
            };

            try {
                // 1. סריקת תותח
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Turrets');
                }
                currentCombo.turret = window.TankiComboManager.BaseItemScanner.scanItem();

                // 2. סריקת אוגמנט תותח
                currentCombo.turretAugment = await window.TankiComboManager.AugmentScanner.scanAugment();

                // 3. סריקת גוף
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Hulls');
                }
                currentCombo.hull = window.TankiComboManager.BaseItemScanner.scanItem();

                // 4. סריקת אוגמנט גוף
                currentCombo.hullAugment = await window.TankiComboManager.AugmentScanner.scanAugment();

                // 5. סריקת רימון
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Grenades');
                }
                currentCombo.grenade = window.TankiComboManager.BaseItemScanner.scanItem();

                // 6. סריקת דרון (עם פונקציית ניקוי מיוחדת)
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Drones');
                }
                currentCombo.drone = window.TankiComboManager.BaseItemScanner.scanItem(
                    window.TankiComboManager.BaseItemScanner.cleanDroneName.bind(window.TankiComboManager.BaseItemScanner)
                );

                // 7. סריקת הגנה
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Protection');
                }
                currentCombo.protection = window.TankiComboManager.ProtectionScanner.scanProtection();

                // 8. סריקת צבע - בוטל
                // if (window.TankiComboManager.TabNavigator) {
                //     await window.TankiComboManager.TabNavigator.navigateToTab('Paints');
                // }
                // currentCombo.paint = window.TankiComboManager.PaintScanner.scanPaint();

                // שמירה ל-localStorage
                this.saveToStorage(currentCombo);

                // חזרה לכרטיסיית COMBOS
                if (window.TankiComboManager.MenuInjector) {
                    const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                    if (menuContainer) {
                        const comboTab = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");
                        if (comboTab) {
                            const underline = comboTab.querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                            await window.TankiComboManager.MenuInjector.safeActivateComboTab(comboTab, menuContainer, underline, 1);
                        }
                    }
                }

            } catch (error) {
                console.error("[ComboManager] Error during save:", error);
                alert("Error saving combo. See console.");
            }
        },




        saveToStorage(comboData) {
            // שליפת קומבואים קיימים
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];

                const newCombo = {
                    id: Date.now(), // מזהה ייחודי
                    name: `Combo ${combos.length + 1}`,
                    data: comboData,
                    date: new Date().toLocaleDateString()
                };

                combos.push(newCombo);

                chrome.storage.local.set({ savedCombos: combos }, () => {
                    console.log("[ComboManager] Combo saved to localStorage:", newCombo);
                });
            });
        }
    };
})();