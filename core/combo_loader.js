// core/combo_loader.js

// זה הקובץ שמצטייד בקומבו - עובר על כל פריט בקומבו, מוצא אותו ברשימה, ולוחץ equip
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.ComboLoader = {

        // פונקציה ראשית להצטיידות בקומבו
        async equipCombo(combo) {
            // console.log('[ComboManager] Equipping combo:', combo);

            if (!combo || !combo.data) {
                // console.error('[ComboManager] Invalid combo data');
                return;
            }

            const comboData = combo.data;
            const removedItems = combo.removedItems || {};

            try {
                // 1. הצטיידות בתותח
                if (comboData.turret && !removedItems.turret) {
                    await window.TankiComboManager.BaseItemEquipper.equipItem(comboData.turret, 'Turrets', 'Turret');
                }

                // 2. הצטיידות באוגמנט תותח
                if (comboData.turretAugment && !removedItems.turretAugment) {
                    await window.TankiComboManager.AugmentEquipper.equipAugment(comboData.turretAugment, 'Turrets');
                }

                // 3. הצטיידות בגוף
                if (comboData.hull && !removedItems.hull) {
                    await window.TankiComboManager.BaseItemEquipper.equipItem(comboData.hull, 'Hulls', 'Hull');
                }

                // 4. הצטיידות באוגמנט גוף
                if (comboData.hullAugment && !removedItems.hullAugment) {
                    await window.TankiComboManager.AugmentEquipper.equipAugment(comboData.hullAugment, 'Hulls');
                }

                // 5. הצטיידות ברימון
                if (comboData.grenade && !removedItems.grenade) {
                    await window.TankiComboManager.BaseItemEquipper.equipItem(comboData.grenade, 'Grenades', 'Grenade');
                }

                // 6. הצטיידות בדרון
                if (comboData.drone && !removedItems.drone) {
                    await window.TankiComboManager.BaseItemEquipper.equipItem(comboData.drone, 'Drones', 'Drone');
                }

                // 7. הצטיידות בהגנות (כולל הסרת הגנות אם יש חריץ ריק)
                if (comboData.protection) {
                    await window.TankiComboManager.ProtectionEquipper.equipProtection(comboData.protection, removedItems.protection || []);
                }

                // חזרה לכרטיסיית Protection
                if (window.TankiComboManager.TabNavigator) {
                    await window.TankiComboManager.TabNavigator.navigateToTab('Protection');
                }

                // console.log('[ComboManager] Combo equipped successfully');
            } catch (error) {
                console.error("[ComboManager] Error during equip:", error);
                // לא נציג alert כדי לא להפריע למשתמש
            }
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
                const LanguageManager = window.TankiComboManager.LanguageManager;
                const equipText = LanguageManager ? LanguageManager.getEquipButtonText() : 'equip';
                const equipTextLower = equipText.toLowerCase().trim();
                
                const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);
                for (let btn of allButtons) {
                    const btnText = btn.innerText || '';
                    const btnTextLower = btnText.toLowerCase().trim();
                    let foundEquip = false;
                    const spans = btn.querySelectorAll('span');
                    for (let span of spans) {
                        const spanText = span.innerText || '';
                        const spanTextLower = spanText.toLowerCase().trim();
                        if (spanTextLower === equipTextLower) {
                            foundEquip = true;
                            break;
                        }
                    }
                    if (foundEquip || btnTextLower === equipTextLower) {
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
            // קבלת הטקסט של כפתור ה-equip בשפה הנוכחית
            const LanguageManager = window.TankiComboManager.LanguageManager;
            const equipText = LanguageManager ? LanguageManager.getEquipButtonText() : 'equip';
            const equipTextLower = equipText.toLowerCase().trim();
            
            // חיפוש כפתור Equip - זה הכפתור שיש בו הטקסט של equip בשפה הנוכחית
            const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);

            for (let btn of allButtons) {
                // נחפש את הטקסט של equip בשפה הנוכחית בתוך הכפתור
                // נבדוק אם יש span עם הטקסט המתאים בתוך הכפתור
                const spans = btn.querySelectorAll('span');

                for (let span of spans) {
                    const spanText = span.innerText || '';
                    const spanTextLower = spanText.toLowerCase().trim();
                    // אם מצאנו span עם הטקסט המתאים
                    if (spanTextLower === equipTextLower) {
                        // מצאנו את הכפתור הנכון - נשתמש בלחיצה עם קואורדינטות
                        await this.clickWithCoordinates(btn);
                        await Utils.sleep(50);
                        return;
                    }
                }
            }

            // אם לא מצאנו כפתור equip, נדלג (אולי הפריט כבר מצויד)
        },
    };
})();