// core/combo_loader.js

// זה הקובץ שמצטייד בקומבו - עובר על כל פריט בקומבו, מוצא אותו ברשימה, ולוחץ equip
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.ComboLoader = {

        // פונקציה ראשית להצטיידות בקומבו
        async equipCombo(combo) {
            console.log('[ComboManager] Equipping combo:', combo);

            if (!combo || !combo.data) {
                console.error('[ComboManager] Invalid combo data');
                return;
            }

            const comboData = combo.data;

            try {
                // 1. הצטיידות בתותח
                if (comboData.turret) {
                    await this.equipTurret(comboData.turret);
                }

                // 2. הצטיידות באוגמנט תותח
                if (comboData.turretAugment) {
                    await this.equipTurretAugment(comboData.turretAugment);
                }

                // 3. הצטיידות בגוף
                if (comboData.hull) {
                    await this.equipHull(comboData.hull);
                }

                // 4. הצטיידות באוגמנט גוף
                if (comboData.hullAugment) {
                    await this.equipHullAugment(comboData.hullAugment);
                }

                // 5. הצטיידות ברימון
                if (comboData.grenade) {
                    await this.equipGrenade(comboData.grenade);
                }

                // 6. הצטיידות בדרון
                if (comboData.drone) {
                    await this.equipDrone(comboData.drone);
                }

                // חזרה לכרטיסיית COMBOS
                if (window.TankiComboManager.MenuInjector) {
                    const DOM = window.TankiComboManager.DOM;
                    const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                    if (menuContainer) {
                        const comboTab = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");
                        if (comboTab) {
                            const underline = comboTab.querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                            // אחרי equipCombo נשתמש בהמתנה ארוכה יותר (150ms) כדי להבטיח ש-Paints יוסתר
                            await window.TankiComboManager.MenuInjector.safeActivateComboTab(comboTab, menuContainer, underline, 150);
                        }
                    }
                }

                // console.log('[ComboManager] Combo equipped successfully');
            } catch (error) {
                console.error("[ComboManager] Error during equip:", error);
                // לא נציג alert כדי לא להפריע למשתמש
            }
        },

        // הצטיידות בתותח
        async equipTurret(turret) {
            if (!turret || !turret.name) return;

            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Turrets');
            }

            const item = this.findItemInList(turret.name);
            if (!item) {
                console.warn(`[ComboManager] Turret ${turret.name} not found in garage`);
                return;
            }

            // בדיקה אם הפריט נרכש (אם יש תמונה והוא לא מוסתר)
            if (!this.isItemPurchased(item)) {
                console.warn(`[ComboManager] Turret ${turret.name} not purchased`);
                return;
            }

            // לחיצה על הפריט כדי לבחור אותו
            const itemName = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE)?.querySelector('span')?.innerText || turret.name;

            // ננסה ללחוץ על התמונה עצמה עם pointer events וקואורדינטות מדויקות
            const itemImage = item.querySelector(DOM.ITEM_LIST_IMAGE);
            if (itemImage) {
                await this.clickWithCoordinates(itemImage);
            } else {
                item.click();
            }

            await Utils.sleep(50);

            // בדיקה נוספת אחרי הלחיצה - אם אין כפתור equip, הפריט לא נרכש
            if (!this.isItemPurchased(null)) {
                console.warn(`[ComboManager] Turret ${turret.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await this.clickEquipButton();
        },

        // הצטיידות באוגמנט תותח
        async equipTurretAugment(augment) {
            if (!augment || !augment.name) return;

            // וידוא שאנחנו במסך התותח
            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Turrets');
            }

            // פתיחת מסך האוגמנטים
            const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
            if (!openBtn) {
                console.warn('[ComboManager] Could not open augments screen');
                return;
            }

            openBtn.click();
            await Utils.sleep(50); // המתנה לפתיחת החלון

            // חיפוש האוגמנט ברשימה
            const augmentCell = this.findAugmentInList(augment.name);
            if (!augmentCell) {
                console.warn(`[ComboManager] Augment ${augment.name} not found`);
                // יציאה ממסך האוגמנטים
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }
                return;
            }

            // בדיקה אם האוגמנט נרכש
            if (!this.isAugmentPurchased(augmentCell)) {
                console.warn(`[ComboManager] Augment ${augment.name} not purchased`);
                // יציאה ממסך האוגמנטים
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }
                return;
            }

            // לחיצה על האוגמנט כדי להצטייד בו
            const augmentName = augmentCell.querySelector(DOM.AUGMENT_NAME)?.innerText || augment.name;

            // נשתמש בלחיצה עם קואורדינטות
            await this.clickWithCoordinates(augmentCell);
            await Utils.sleep(50);

            // לחיצה על כפתור Equip במסך האוגמנטים
            await this.clickEquipButton();
            await Utils.sleep(50);

            // יציאה ממסך האוגמנטים
            const backBtn = document.querySelector(DOM.BACK_BUTTON);
            if (backBtn) {
                backBtn.click();
                await Utils.sleep(50);
            }
        },

        // הצטיידות בגוף
        async equipHull(hull) {
            if (!hull || !hull.name) return;

            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Hulls');
            }

            const item = this.findItemInList(hull.name);
            if (!item) {
                console.warn(`[ComboManager] Hull ${hull.name} not found in garage`);
                return;
            }

            // בדיקה אם הפריט נרכש
            if (!this.isItemPurchased(item)) {
                console.warn(`[ComboManager] Hull ${hull.name} not purchased`);
                return;
            }

            // לחיצה על הפריט כדי לבחור אותו
            const itemName = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE)?.querySelector('span')?.innerText || hull.name;

            // ננסה ללחוץ על התמונה עצמה עם pointer events וקואורדינטות מדויקות
            const itemImage = item.querySelector(DOM.ITEM_LIST_IMAGE);
            if (itemImage) {
                await this.clickWithCoordinates(itemImage);
            } else {
                item.click();
            }

            await Utils.sleep(50);

            // בדיקה נוספת אחרי הלחיצה - אם אין כפתור equip, הפריט לא נרכש
            if (!this.isItemPurchased(null)) {
                console.warn(`[ComboManager] Hull ${hull.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await this.clickEquipButton();
        },

        // הצטיידות באוגמנט גוף
        async equipHullAugment(augment) {
            if (!augment || !augment.name) return;

            // וידוא שאנחנו במסך הגוף
            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Hulls');
            }

            // פתיחת מסך האוגמנטים
            const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
            if (!openBtn) {
                console.warn('[ComboManager] Could not open augments screen');
                return;
            }

            openBtn.click();
            await Utils.sleep(50); // המתנה לפתיחת החלון

            // חיפוש האוגמנט ברשימה
            const augmentCell = this.findAugmentInList(augment.name);
            if (!augmentCell) {
                console.warn(`[ComboManager] Augment ${augment.name} not found`);
                // יציאה ממסך האוגמנטים
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }
                return;
            }

            // בדיקה אם האוגמנט נרכש
            if (!this.isAugmentPurchased(augmentCell)) {
                console.warn(`[ComboManager] Augment ${augment.name} not purchased`);
                // יציאה ממסך האוגמנטים
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }
                return;
            }

            // לחיצה על האוגמנט כדי להצטייד בו
            const augmentName = augmentCell.querySelector(DOM.AUGMENT_NAME)?.innerText || augment.name;

            // נשתמש בלחיצה עם קואורדינטות
            await this.clickWithCoordinates(augmentCell);
            await Utils.sleep(50);

            // לחיצה על כפתור Equip במסך האוגמנטים
            await this.clickEquipButton();
            await Utils.sleep(50);

            // יציאה ממסך האוגמנטים
            const backBtn = document.querySelector(DOM.BACK_BUTTON);
            if (backBtn) {
                backBtn.click();
                await Utils.sleep(50);
            }
        },

        // הצטיידות ברימון
        async equipGrenade(grenade) {
            if (!grenade || !grenade.name) return;

            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Grenades');
            }

            const item = this.findItemInList(grenade.name);
            if (!item) {
                console.warn(`[ComboManager] Grenade ${grenade.name} not found in garage`);
                return;
            }

            // בדיקה אם הפריט נרכש
            if (!this.isItemPurchased(item)) {
                console.warn(`[ComboManager] Grenade ${grenade.name} not purchased`);
                return;
            }

            // לחיצה על הפריט כדי לבחור אותו
            const itemName = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE)?.querySelector('span')?.innerText || grenade.name;

            // ננסה ללחוץ על התמונה עצמה עם pointer events וקואורדינטות מדויקות
            const itemImage = item.querySelector(DOM.ITEM_LIST_IMAGE);
            if (itemImage) {
                await this.clickWithCoordinates(itemImage);
            } else {
                item.click();
            }

            await Utils.sleep(50);

            // בדיקה נוספת אחרי הלחיצה - אם אין כפתור equip, הפריט לא נרכש
            if (!this.isItemPurchased(null)) {
                console.warn(`[ComboManager] Grenade ${grenade.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await this.clickEquipButton();
        },

        // הצטיידות בדרון
        async equipDrone(drone) {
            if (!drone || !drone.name) return;

            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Drones');
            }

            const item = this.findItemInList(drone.name);
            if (!item) {
                console.warn(`[ComboManager] Drone ${drone.name} not found in garage`);
                return;
            }

            // בדיקה אם הפריט נרכש
            if (!this.isItemPurchased(item)) {
                console.warn(`[ComboManager] Drone ${drone.name} not purchased`);
                return;
            }

            // לחיצה על הפריט כדי לבחור אותו
            const itemName = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE)?.querySelector('span')?.innerText || drone.name;

            // ננסה ללחוץ על התמונה עצמה עם pointer events וקואורדינטות מדויקות
            const itemImage = item.querySelector(DOM.ITEM_LIST_IMAGE);
            if (itemImage) {
                await this.clickWithCoordinates(itemImage);
            } else {
                item.click();
            }

            await Utils.sleep(50);

            // בדיקה נוספת אחרי הלחיצה - אם אין כפתור equip, הפריט לא נרכש
            if (!this.isItemPurchased(null)) {
                console.warn(`[ComboManager] Drone ${drone.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await this.clickEquipButton();
        },

        // חיפוש פריט ברשימה לפי שם
        findItemInList(itemName) {
            if (!itemName) return null;

            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);
            const searchName = itemName.toUpperCase();

            for (let item of items) {
                const descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                if (!descriptionDevice) continue;

                const nameSpan = descriptionDevice.querySelector('span');
                if (!nameSpan) continue;

                const itemNameInList = nameSpan.innerText.trim().toUpperCase();
                const cleanItemName = Utils.cleanItemName(itemNameInList);
                if (!cleanItemName) continue;
                const cleanItemNameUpper = cleanItemName.toUpperCase();

                // השוואה לפי השם הראשי (בלי Mk/רמה)
                if (cleanItemNameUpper === searchName || itemNameInList.includes(searchName)) {
                    return item;
                }
            }

            return null;
        },

        // חיפוש אוגמנט ברשימה לפי שם
        findAugmentInList(augmentName) {
            const cells = document.querySelectorAll(DOM.AUGMENT_CELL);
            const searchName = augmentName.toUpperCase().trim();

            // טיפול מיוחד ב-"STANDARD SETTINGS"
            if (searchName === "STANDARD" || searchName.includes("STANDARD SETTINGS") || searchName.includes("STANDARD")) {
                for (let cell of cells) {
                    const nameEl = cell.querySelector(DOM.AUGMENT_NAME);
                    if (nameEl) {
                        const cellName = nameEl.innerText.trim().toUpperCase();
                        if (cellName.includes("STANDARD") || cellName.includes("SETTINGS")) {
                            return cell;
                        }
                    }
                }
            }

            // חיפוש רגיל
            for (let cell of cells) {
                const nameEl = cell.querySelector(DOM.AUGMENT_NAME);
                if (!nameEl) continue;

                const cellName = nameEl.innerText.trim().toUpperCase();

                // השוואה מדויקת קודם
                if (cellName === searchName) {
                    return cell;
                }
            }

            return null;
        },

        // בדיקה אם פריט נרכש
        // אם item הוא null, בודקים את כפתור ה-equip בדף (אחרי לחיצה על הפריט)
        // אם item קיים, בודקים אם התמונה לא מוסתרת (לפני לחיצה)
        isItemPurchased(item) {
            // אם item הוא null, בודקים את כפתור ה-equip בדף
            if (item === null || item === undefined) {
                const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);
                for (let btn of allButtons) {
                    const btnText = btn.innerText || '';
                    const btnTextLower = btnText.toLowerCase().trim();
                    let foundEquip = false;
                    const spans = btn.querySelectorAll('span');
                    for (let span of spans) {
                        const spanText = span.innerText || '';
                        const spanTextLower = spanText.toLowerCase().trim();
                        if (spanTextLower === 'equip') {
                            foundEquip = true;
                            break;
                        }
                    }
                    if (foundEquip || btnTextLower === 'equip') {
                        return true; // מצאנו כפתור equip, הפריט נרכש
                    }
                }
                return false; // לא מצאנו כפתור equip, הפריט לא נרכש
            }

            // בדיקה ברשימה (לפני לחיצה) - רק אם התמונה לא מוסתרת
            const img = item.querySelector(DOM.ITEM_LIST_IMAGE);
            if (!img) return false;

            // בדיקה אם התמונה לא מוסתרת
            if (img.style.display === 'none') return false;

            // בדיקה אם אין אייקון unavailable
            const unavailableIcon = item.querySelector('img[src*="unavailable"]');
            if (unavailableIcon) return false;

            return true;
        },

        // בדיקה אם אוגמנט נרכש
        isAugmentPurchased(augmentCell) {
            // בדיקה אם יש שם לאוגמנט (אם אין שם, האוגמנט לא קיים)
            const nameEl = augmentCell.querySelector(DOM.AUGMENT_NAME);
            if (!nameEl || !nameEl.innerText || nameEl.innerText.trim().length === 0) {
                return false; // אין שם, האוגמנט לא קיים
            }

            // בדיקה אם SkinCellStyle-discountCell מכיל תוכן (מחיר)
            // אם יש תוכן - האוגמנט לא נרכש, אם ריק - נרכש
            const discountCell = augmentCell.querySelector(DOM.AUGMENT_DISCOUNT_CELL);
            if (discountCell) {
                // בדיקה אם יש תוכן פנימי (div עם מחיר)
                const hasContent = discountCell.children.length > 0 || discountCell.innerText.trim().length > 0;
                if (hasContent) {
                    return false; // יש מחיר, האוגמנט לא נרכש
                }
            }

            return true;
        },

        // פונקציה כללית ללחיצה עם קואורדינטות מדויקות
        async clickWithCoordinates(element) {
            if (!element) return;

            // חישוב קואורדינטות המרכז של האלמנט
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Pointer events עם קואורדינטות מדויקות
            const pointerDown = new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                pointerType: 'mouse',
                button: 0,
                buttons: 1,
                clientX: centerX,
                clientY: centerY,
                isPrimary: true
            });
            const pointerUp = new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                pointerType: 'mouse',
                button: 0,
                buttons: 0,
                clientX: centerX,
                clientY: centerY,
                isPrimary: true
            });
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
                clientX: centerX,
                clientY: centerY,
                view: window
            });

            // שולחים את האירועים ברצף (ללא sleep - זה קורה מיד)
            element.dispatchEvent(pointerDown);
            element.dispatchEvent(pointerUp);
            element.dispatchEvent(clickEvent);
        },

        // לחיצה על כפתור Equip
        async clickEquipButton() {
            // חיפוש כפתור Equip - זה הכפתור שיש בו הטקסט "equip" (לא "equipped")
            const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);

            for (let btn of allButtons) {
                // נחפש את הטקסט "equip" בתוך הכפתור (לא "equipped")
                // נבדוק אם יש span עם הטקסט "equip" בתוך הכפתור
                const spans = btn.querySelectorAll('span');

                for (let span of spans) {
                    const spanText = span.innerText || '';
                    const spanTextLower = spanText.toLowerCase().trim();
                    // אם מצאנו span עם הטקסט "equip" (לא "equipped")
                    if (spanTextLower === 'equip') {
                        // מצאנו את הכפתור הנכון - נשתמש בלחיצה עם קואורדינטות
                        console.log('[ComboManager] Clicking on Equip button');
                        await this.clickWithCoordinates(btn);
                        await Utils.sleep(50);
                        return;
                    }
                }
            }

            // אם לא מצאנו כפתור "equip", נדלג (אולי הפריט כבר מצויד)
        },
    };
})();