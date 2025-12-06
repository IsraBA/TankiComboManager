// core/equippers/protection_equipper.js
// הצטיידות בהגנות (כולל הסרת הגנות אם יש חריץ ריק)

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.ProtectionEquipper = {
        async equipProtection(protections, removedProtectionIndices = []) {
            if (!protections || !Array.isArray(protections)) {
                console.warn('[ComboManager] Invalid protections data');
                return;
            }

            // מעבר לכרטיסיית Protection
            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab('Protection');
            }

            // 1. סריקת המצב הנוכחי - איזה הגנות מצוידות ואיפה
            const currentState = this.scanCurrentProtections();

            // 2. בניית המצב הרצוי מהקומבו
            const desiredState = this.buildDesiredProtections(protections, removedProtectionIndices);

            // 3. חישוב הפעולות הנדרשות
            const actions = this.calculateProtectionActions(currentState, desiredState);

            // 4. ביצוע הפעולות - קודם כל הסרות, אחר כך הצטיידויות
            // 4.1. הסרת כל ההגנות שצריך להסיר
            // שימוש ב-while loop כי ה-DOM משתנה אחרי כל הסרה
            const removeActions = actions.filter(a => a.type === 'remove');
            while (removeActions.length > 0) {
                // סריקה מחדש של המצב הנוכחי
                const currentStateAfterRemoval = this.scanCurrentProtections();

                // מציאת הגנה שצריך להסיר שעדיין מצוידת
                let foundProtectionToRemove = false;
                for (let i = removeActions.length - 1; i >= 0; i--) {
                    const removeAction = removeActions[i];
                    // בדיקה אם ההגנה עדיין מצוידת
                    let stillMounted = false;
                    for (let j = 0; j < currentStateAfterRemoval.length; j++) {
                        if (this.areProtectionsEqual(currentStateAfterRemoval[j], removeAction.protection)) {
                            stillMounted = true;
                            break;
                        }
                    }

                    if (stillMounted) {
                        // ההגנה עדיין מצוידת - נסיר אותה
                        await this.removeProtectionByData(removeAction.protection);
                        removeActions.splice(i, 1); // הסרה מהרשימה
                        foundProtectionToRemove = true;
                        break;
                    } else {
                        // ההגנה כבר לא מצוידת - נסיר אותה מהרשימה
                        removeActions.splice(i, 1);
                    }
                }

                // אם לא מצאנו הגנה להסרה, נצא מהלולאה
                if (!foundProtectionToRemove) {
                    break;
                }
            }

            // 4.3. הצטיידות בכל ההגנות שצריך לצייד
            const equipActions = actions.filter(a => a.type === 'equip');
            for (const equipAction of equipActions) {
                await this.equipProtectionAtSlot(equipAction.protection, equipAction.slotIndex);
            }
        },

        // סריקת המצב הנוכחי - איזה הגנות מצוידות ואיפה
        scanCurrentProtections() {
            const currentState = [null, null, null, null]; // 4 חריצים
            const mountedResists = document.querySelectorAll(DOM.PROTECTION_MOUNTED_RESIST);
            const ProtectionScanner = window.TankiComboManager.ProtectionScanner;


            if (!ProtectionScanner) {
                console.warn('[ComboManager] ProtectionScanner not available');
                return currentState;
            }

            for (let i = 0; i < Math.min(mountedResists.length, 4); i++) {
                const mountedResist = mountedResists[i];
                if (!mountedResist) {
                    continue;
                }

                const iconImg = mountedResist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
                if (!iconImg || !iconImg.src) {
                    continue;
                }


                // יש הגנה ב-חריץ הזה - נמצא את הנתונים שלה
                const protectionData = ProtectionScanner.findProtectionByIconUrl(iconImg.src);
                if (protectionData) {
                    currentState[i] = protectionData;
                } else {
                    console.warn(`[ComboManager] Slot ${i}: Could not find protection data for icon: ${iconImg.src}`);
                    // ננסה לחלץ את הנתונים ישירות מה-DOM
                    const iconFileName = ProtectionScanner.extractIconFileName(iconImg.src);
                    if (iconFileName) {
                        // נחפש את ההגנה ברשימה לפי האייקון
                        const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);
                        for (let item of items) {
                            const resistanceIcon = item.querySelector(DOM.PROTECTION_LIST_RESISTANCE_ICON);
                            if (resistanceIcon && resistanceIcon.src) {
                                const listIconFileName = ProtectionScanner.extractIconFileName(resistanceIcon.src);
                                if (listIconFileName === iconFileName) {
                                    const descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                                    const nameSpan = descriptionDevice ? descriptionDevice.querySelector('span') : null;
                                    if (nameSpan) {
                                        const protectionName = nameSpan.innerText.trim().toUpperCase();
                                        const protectionImage = resistanceIcon.src;
                                        currentState[i] = {
                                            name: protectionName,
                                            image: protectionImage
                                        };
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return currentState;
        },

        // בניית המצב הרצוי מהקומבו
        buildDesiredProtections(protections, removedProtectionIndices = []) {
            const desiredState = [null, null, null, null]; // 4 חריצים

            for (let i = 0; i < Math.min(protections.length, 4); i++) {
                if (removedProtectionIndices.includes(i)) {
                    // ה-חריץ הזה הוסר - נשאיר null
                    desiredState[i] = null;
                } else {
                    // יש הגנה בקומבו ב-חריץ הזה
                    desiredState[i] = protections[i] || null;
                }
            }

            return desiredState;
        },

        // חישוב הפעולות הנדרשות - מה צריך להסיר, מה צריך להחליף, מה צריך להוסיף
        calculateProtectionActions(currentState, desiredState) {
            const actions = [];

            // 1. יצירת רשימת הגנות מהקומבו (בלי כפילויות, בלי null)
            const desiredProtections = [];
            for (let i = 0; i < desiredState.length; i++) {
                if (desiredState[i] && !this.isProtectionInList(desiredState[i], desiredProtections)) {
                    desiredProtections.push(desiredState[i]);
                }
            }

            // 2. יצירת רשימת הגנות מצוידות (בלי כפילויות, בלי null)
            const currentProtections = [];
            for (let i = 0; i < currentState.length; i++) {
                if (currentState[i] && !this.isProtectionInList(currentState[i], currentProtections)) {
                    currentProtections.push(currentState[i]);
                }
            }

            // 3. מציאת הגנות שצריך להוסיף - הגנות בקומבו שלא מצוידות
            const protectionsToAdd = [];
            for (const desiredProt of desiredProtections) {
                if (!this.isProtectionInList(desiredProt, currentProtections)) {
                    protectionsToAdd.push(desiredProt);
                }
            }

            // 4. מציאת הגנות שצריך להסיר - הגנות מצוידות שלא בקומבו
            const protectionsToRemove = [];
            for (let slotIndex = 0; slotIndex < currentState.length; slotIndex++) {
                const currentProt = currentState[slotIndex];
                if (currentProt && !this.isProtectionInList(currentProt, desiredProtections)) {
                    protectionsToRemove.push({ protection: currentProt, slotIndex: slotIndex });
                }
            }

            // 5. הוספת פעולות הסרה
            for (const removeAction of protectionsToRemove) {
                actions.push({
                    type: 'remove',
                    protection: removeAction.protection,
                    slotIndex: removeAction.slotIndex
                });
            }

            // 6. הוספת פעולות הצטיידות - נמצא חריץ פנוי לכל הגנה שצריך להוסיף
            // נשתמש בחריצים שכבר מסומנים להסרה (אחרי הסרה יהיו פנויים)
            const slotsToBeFreed = new Set();
            for (const removeAction of protectionsToRemove) {
                slotsToBeFreed.add(removeAction.slotIndex);
            }

            for (const protectionToAdd of protectionsToAdd) {
                let targetSlot = null;

                // קודם נחפש חריץ ריק במצב הנוכחי
                for (let i = 0; i < currentState.length; i++) {
                    if (!currentState[i]) {
                        targetSlot = i;
                        break;
                    }
                }

                // אם לא מצאנו חריץ ריק, נשתמש ב-חריץ שיועבר להיות פנוי אחרי הסרה
                if (targetSlot === null) {
                    for (const slotIndex of slotsToBeFreed) {
                        targetSlot = slotIndex;
                        break; // נשתמש ב-חריץ הראשון שיועבר להיות פנוי
                    }
                }

                if (targetSlot !== null) {
                    actions.push({
                        type: 'equip',
                        protection: protectionToAdd,
                        slotIndex: targetSlot
                    });
                }
            }

            return actions;
        },

        // בדיקה אם הגנה נמצאת ברשימה
        isProtectionInList(protection, list) {
            if (!protection) return false;
            for (const item of list) {
                if (this.areProtectionsEqual(protection, item)) {
                    return true;
                }
            }
            return false;
        },

        // השוואה בין שתי הגנות (לפי תמונה)
        areProtectionsEqual(protection1, protection2) {
            // אם שתיהן null - זהות
            if (!protection1 && !protection2) {
                return true;
            }

            // אם אחת null והשנייה לא - לא זהות
            if (!protection1 || !protection2) {
                return false;
            }

            // השוואה לפי תמונה (הכי מדויק)
            const ProtectionScanner = window.TankiComboManager.ProtectionScanner;
            if (ProtectionScanner && protection1.image && protection2.image) {
                const fileName1 = ProtectionScanner.extractIconFileName(protection1.image);
                const fileName2 = ProtectionScanner.extractIconFileName(protection2.image);
                if (fileName1 && fileName2) {
                    return fileName1 === fileName2;
                }
            }

            // אם אין תמונות, נשווה לפי שם
            if (protection1.name && protection2.name) {
                return protection1.name.toUpperCase().trim() === protection2.name.toUpperCase().trim();
            }

            return false;
        },

        // הצטיידות בהגנה ב-חריץ מסוים
        async equipProtectionAtSlot(protection, slotIndex) {
            if (!protection || !protection.name) {
                console.warn(`[ComboManager] Invalid protection data for slot ${slotIndex}`);
                return;
            }


            // חיפוש ההגנה ברשימה לפי שם או תמונה
            const protectionItem = this.findProtectionInList(protection);
            if (!protectionItem) {
                console.warn(`[ComboManager] Protection ${protection.name} not found in garage`);
                return;
            }

            // בדיקה שהגנה שמצאנו היא הנכונה
            const descriptionDevice = protectionItem.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
            const nameSpan = descriptionDevice ? descriptionDevice.querySelector('span') : null;
            const foundName = nameSpan ? nameSpan.innerText.trim().toUpperCase() : 'UNKNOWN';

            // לחיצה על ההגנה כדי לבחור אותה
            // ננסה למצוא את התמונה הראשית, ואם לא נמצא - נלחץ על האלמנט עצמו
            const itemImage = protectionItem.querySelector(DOM.ITEM_LIST_IMAGE);
            let elementToClick = itemImage;

            // אם לא מצאנו תמונה, נחפש את התמונה הראשית בצורה אחרת
            if (!elementToClick) {
                // נחפש את התמונה הראשית בתוך itemPreview
                const itemPreview = protectionItem.querySelector('.GarageItemComponentStyle-itemPreview');
                if (itemPreview) {
                    // נחפש את התמונה הראשית (לא את האייקון)
                    const images = itemPreview.querySelectorAll('img');
                    for (let img of images) {
                        // נבדוק אם זה לא האייקון של התותח
                        if (!img.classList.contains('GarageItemComponentStyle-itemResistanceIcon')) {
                            elementToClick = img;
                            break;
                        }
                    }
                }
            }

            // אם עדיין לא מצאנו, נלחץ על האלמנט עצמו
            if (!elementToClick) {
                elementToClick = protectionItem;
            } else {
            }

            const ComboLoader = window.TankiComboManager.ComboLoader;
            await ComboLoader.clickWithCoordinates(elementToClick);

            await Utils.sleep(50); // המתנה כדי שהדף יעדכן

            // בדיקה אחרי הלחיצה - אם אין כפתור equip, ההגנה לא נרכשה
            const isPurchased = ComboLoader.isItemPurchased(null);

            if (!isPurchased) {
                // נבדוק אם יש כפתור equip בכלל
                const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);
                for (let btn of allButtons) {
                    const spans = btn.querySelectorAll('span');
                    for (let span of spans) {
                        const spanText = span.innerText || '';
                    }
                }
                console.warn(`[ComboManager] Protection ${protection.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await ComboLoader.clickEquipButton();
        },

        // הסרת הגנה לפי הנתונים שלה (לא לפי slot index כי ה-DOM משתנה)
        async removeProtectionByData(protection) {
            if (!protection || !protection.image) {
                return;
            }

            const ComboLoader = window.TankiComboManager.ComboLoader;

            // סריקה מחדש של ההגנות המצוידות - מציאת ה-slot הנוכחי של ההגנה
            const mountedResists = document.querySelectorAll(DOM.PROTECTION_MOUNTED_RESIST);
            const ProtectionScanner = window.TankiComboManager.ProtectionScanner;

            if (!ProtectionScanner) {
                console.warn('[ComboManager] ProtectionScanner not available');
                return;
            }

            const protectionIconFileName = ProtectionScanner.extractIconFileName(protection.image);
            if (!protectionIconFileName) {
                console.warn('[ComboManager] Could not extract icon filename from:', protection.image);
                return;
            }

            // חיפוש ההגנה בכל ה-slots המצוידים
            for (let i = 0; i < mountedResists.length; i++) {
                const mountedResist = mountedResists[i];
                if (!mountedResist) continue;

                const iconImg = mountedResist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
                if (!iconImg || !iconImg.src) continue;

                const mountedIconFileName = ProtectionScanner.extractIconFileName(iconImg.src);
                if (mountedIconFileName === protectionIconFileName) {
                    // מצאנו את ההגנה - נסיר אותה

                    // חיפוש כפתור ההסרה
                    const deleteButton = mountedResist.querySelector('img[src*="iconDeleteSelect"]');
                    if (deleteButton) {
                        const deleteButtonContainer = deleteButton.closest('div');
                        if (deleteButtonContainer) {
                            await ComboLoader.clickWithCoordinates(deleteButtonContainer);
                            return;
                        }
                    }


                    // אם לא מצאנו כפתור הסרה, ננסה לחיצה על ההגנה ואז equip
                    await ComboLoader.clickWithCoordinates(mountedResist);
                    await Utils.sleep(50);
                    await ComboLoader.clickEquipButton();
                    return;
                }
            }

        },

        // הסרת הגנה ב-חריץ מסוים
        async removeProtectionAtSlot(slotIndex) {
            const ComboLoader = window.TankiComboManager.ComboLoader;

            // מציאת כל ההגנות המצוידות
            const mountedResists = document.querySelectorAll(DOM.PROTECTION_MOUNTED_RESIST);

            if (slotIndex >= mountedResists.length) {
                // אין הגנה ב-חריץ הזה - אין מה להסיר
                return;
            }

            const mountedResist = mountedResists[slotIndex];
            if (!mountedResist) {
                return;
            }

            // בדיקה אם יש הגנה מצוידת ב-חריץ הזה (אם יש אייקון, יש הגנה)
            const iconImg = mountedResist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
            if (!iconImg || !iconImg.src) {
                // אין הגנה ב-חריץ הזה - אין מה להסיר
                return;
            }


            // חיפוש כפתור ההסרה הספציפי של ההגנה המצוידת
            // הכפתור הוא img עם src שמכיל "iconDeleteSelect"
            const deleteButton = mountedResist.querySelector('img[src*="iconDeleteSelect"]');
            if (deleteButton) {
                // מצאנו את כפתור ההסרה - נלחץ עליו
                const deleteButtonContainer = deleteButton.closest('div');
                if (deleteButtonContainer) {
                    await ComboLoader.clickWithCoordinates(deleteButtonContainer);
                    return;
                }
            }


            // אם לא מצאנו כפתור הסרה ספציפי, ננסה את השיטה הישנה
            // לחיצה על ההגנה המצוידת כדי לבחור אותה להסרה
            await ComboLoader.clickWithCoordinates(mountedResist);
            await Utils.sleep(50);

            // לחיצה על כפתור Equip (שבעצם יסיר את ההגנה אם היא כבר מצוידת)
            await ComboLoader.clickEquipButton();
        },

        // חיפוש הגנה ברשימה לפי שם או תמונה
        findProtectionInList(protection) {
            if (!protection) return null;

            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);
            const searchName = protection.name ? protection.name.toUpperCase().trim() : '';
            const searchImageUrl = protection.image || '';


            // אם יש תמונה, נשתמש בה לחיפוש (יותר מדויק)
            if (searchImageUrl) {
                const ProtectionScanner = window.TankiComboManager.ProtectionScanner;
                if (ProtectionScanner) {
                    const searchIconFileName = ProtectionScanner.extractIconFileName(searchImageUrl);

                    if (searchIconFileName) {
                        // חיפוש ישיר לפי שם הקובץ של האייקון
                        for (let item of items) {
                            const resistanceIcon = item.querySelector(DOM.PROTECTION_LIST_RESISTANCE_ICON);
                            if (resistanceIcon && resistanceIcon.src) {
                                const iconFileName = ProtectionScanner.extractIconFileName(resistanceIcon.src);

                                if (iconFileName && iconFileName === searchIconFileName) {
                                    return item;
                                }
                            }
                        }
                    }
                }
            }

            // אם לא מצאנו לפי תמונה, נחפש לפי שם
            if (searchName) {
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
            }

            console.warn(`[ComboManager] Protection not found in list!`);
            return null;
        }
    };
})();

