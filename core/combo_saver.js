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
                protection: null,
                paint: null
            };

            try {
                // TODO: לצמצם חלק מהקוד של הסריקות למשהו יותר גנרי 

                // 1. סריקת תותח
                await this.navigateToTab('Turrets');
                currentCombo.turret = window.TankiComboManager.TurretScanner.scanTurret();

                // 2. סריקת אוגמנט תותח
                currentCombo.turretAugment = await window.TankiComboManager.TurretAugmentScanner.scanTurretAugment();

                // 3. סריקת גוף
                await this.navigateToTab('Hulls');
                currentCombo.hull = window.TankiComboManager.HullScanner.scanHull();

                // 4. סריקת אוגמנט גוף
                currentCombo.hullAugment = await window.TankiComboManager.HullAugmentScanner.scanHullAugment();

                // 5. סריקת רימון
                await this.navigateToTab('Grenades');
                currentCombo.grenade = window.TankiComboManager.GrenadeScanner.scanGrenade();

                // 6. סריקת דרון
                await this.navigateToTab('Drones');
                currentCombo.drone = window.TankiComboManager.DroneScanner.scanDrone();

                // 7. סריקת הגנה
                await this.navigateToTab('Protection');
                currentCombo.protection = window.TankiComboManager.ProtectionScanner.scanProtection();

                // 8. סריקת צבע
                await this.navigateToTab('Paints');
                currentCombo.paint = window.TankiComboManager.PaintScanner.scanPaint();

                // שמירה ל-localStorage
                this.saveToStorage(currentCombo);

                // חזרה לכרטיסיית COMBOS
                await this.navigateToComboTab();

            } catch (error) {
                console.error("[ComboManager] Error during save:", error);
                alert("Error saving combo. See console.");
            }
        },

        // חזרה לכרטיסיית COMBOS
        async navigateToComboTab() {
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) return;

            // חיפוש הטאב COMBOS
            const comboTab = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");
            if (comboTab) {
                // מציאת הקו התחתון של הטאב
                const underline = comboTab.querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                
                // הפעלת הטאב דרך MenuInjector
                if (window.TankiComboManager.MenuInjector) {
                    window.TankiComboManager.MenuInjector.activateComboTab(comboTab, menuContainer, underline);
                } else {
                    // אם MenuInjector לא זמין, פשוט נקרא ל-click
                    comboTab.click();
                }
                await Utils.sleep(50);
            }
        },

        // מעבר לטאב לפי טקסט
        async navigateToTab(tabName) {
            const tabs = document.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
            let targetTab = null;

            for (let tab of tabs) {
                // שימוש ב-textContent במקום innerText - יותר אמין
                const tabText = tab.textContent ? tab.textContent.trim() : '';
                const tabTextLower = tabText.toLowerCase();
                const searchNameLower = tabName.toLowerCase();

                // בדיקה מדויקת קודם, ואז בדיקה חלקית
                if (tabTextLower === searchNameLower || tabTextLower.includes(searchNameLower)) {
                    // ודא שזה לא הטאב שלנו (COMBOS)
                    if (!tabTextLower.includes('combo')) {
                        targetTab = tab;
                        break;
                    }
                }
            }

            if (targetTab) {
                // אם אנחנו על טאב COMBOS, נסתיר אותו קודם
                if (window.TankiComboManager.ViewRenderer && window.TankiComboManager.ViewRenderer.viewElement) {
                    const comboView = window.TankiComboManager.ViewRenderer.viewElement;
                    if (comboView.style.display !== 'none') {
                        window.TankiComboManager.ViewRenderer.hide();
                        await Utils.sleep(50); // המתנה קצרה להסתרה
                    }
                }

                targetTab.click();
                // המתנה קריטית לטעינת ה-HTML של הטאב
                await Utils.sleep(50);
            } else {
                const allTabTexts = Array.from(tabs).map(t => t.textContent?.trim() || '').join(', ');
                throw new Error(`Tab ${tabName} not found! Available tabs: ${allTabTexts}`);
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