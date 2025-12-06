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
            const removedItems = combo.removedItems || {};

            try {
                // 1. הצטיידות בתותח
                if (comboData.turret && !removedItems.turret) {
                    await this.equipTurret(comboData.turret);
                }

                // 2. הצטיידות באוגמנט תותח
                if (comboData.turretAugment && !removedItems.turretAugment) {
                    await this.equipTurretAugment(comboData.turretAugment);
                }

                // 3. הצטיידות בגוף
                if (comboData.hull && !removedItems.hull) {
                    await this.equipHull(comboData.hull);
                }

                // 4. הצטיידות באוגמנט גוף
                if (comboData.hullAugment && !removedItems.hullAugment) {
                    await this.equipHullAugment(comboData.hullAugment);
                }

                // 5. הצטיידות ברימון
                if (comboData.grenade && !removedItems.grenade) {
                    await this.equipGrenade(comboData.grenade);
                }

                // 6. הצטיידות בדרון
                if (comboData.drone && !removedItems.drone) {
                    await this.equipDrone(comboData.drone);
                }

                // 7. הצטיידות בהגנות (כולל הסרת הגנות אם יש חריץ ריק)
                if (comboData.protection) {
                    await this.equipProtection(comboData.protection, removedItems.protection || []);
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

        // הצטיידות בהגנות (כולל הסרת הגנות אם יש חריץ ריק)
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
            console.log('[ComboManager] Protection Current State:', currentState);

            // 2. בניית המצב הרצוי מהקומבו
            const desiredState = this.buildDesiredProtections(protections, removedProtectionIndices);
            console.log('[ComboManager] Protection Desired State:', desiredState);

            // 3. חישוב הפעולות הנדרשות
            const actions = this.calculateProtectionActions(currentState, desiredState);
            console.log('[ComboManager] Protection Actions:', actions);

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
                        await Utils.sleep(50); // המתנה קצרה אחרי הסרה
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

            // 4.2. המתנה קצרה אחרי כל ההסרות
            await Utils.sleep(50);

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

            console.log(`[ComboManager] Found ${mountedResists.length} mounted resist elements`);

            if (!ProtectionScanner) {
                console.warn('[ComboManager] ProtectionScanner not available');
                return currentState;
            }

            for (let i = 0; i < Math.min(mountedResists.length, 4); i++) {
                const mountedResist = mountedResists[i];
                if (!mountedResist) {
                    console.log(`[ComboManager] Slot ${i}: No mountedResist element`);
                    continue;
                }

                const iconImg = mountedResist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
                if (!iconImg || !iconImg.src) {
                    console.log(`[ComboManager] Slot ${i}: No icon image or src`);
                    continue;
                }

                console.log(`[ComboManager] Slot ${i}: Found icon with src: ${iconImg.src}`);

                // יש הגנה ב-חריץ הזה - נמצא את הנתונים שלה
                const protectionData = ProtectionScanner.findProtectionByIconUrl(iconImg.src);
                if (protectionData) {
                    console.log(`[ComboManager] Slot ${i}: Found protection data:`, protectionData);
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
                                        console.log(`[ComboManager] Slot ${i}: Found protection by direct search:`, { name: protectionName, image: protectionImage });
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

            console.log(`[ComboManager] Equipping protection ${protection.name} at slot ${slotIndex}`);

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
            console.log(`[ComboManager] Found protection item with name: "${foundName}"`);

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
                            console.log(`[ComboManager] Found main image in itemPreview`);
                            break;
                        }
                    }
                }
            }
            
            // אם עדיין לא מצאנו, נלחץ על האלמנט עצמו
            if (!elementToClick) {
                elementToClick = protectionItem;
                console.log(`[ComboManager] Clicking on protection item itself (no image found)`);
            } else {
                console.log(`[ComboManager] Clicking on protection image`);
            }
            
            await this.clickWithCoordinates(elementToClick);

            await Utils.sleep(50); // המתנה ארוכה יותר כדי שהדף יעדכן

            // בדיקה אחרי הלחיצה - אם אין כפתור equip, ההגנה לא נרכשה
            const isPurchased = this.isItemPurchased(null);
            console.log(`[ComboManager] Protection ${protection.name} purchased check:`, isPurchased);
            
            if (!isPurchased) {
                // נבדוק אם יש כפתור equip בכלל
                const allButtons = document.querySelectorAll(DOM.EQUIP_BUTTON);
                console.log(`[ComboManager] Found ${allButtons.length} buttons with class ${DOM.EQUIP_BUTTON}`);
                for (let btn of allButtons) {
                    const spans = btn.querySelectorAll('span');
                    for (let span of spans) {
                        const spanText = span.innerText || '';
                        console.log(`[ComboManager] Button span text: "${spanText}"`);
                    }
                }
                console.warn(`[ComboManager] Protection ${protection.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await this.clickEquipButton();
            await Utils.sleep(50);
            console.log(`[ComboManager] Equipped protection ${protection.name} at slot ${slotIndex}`);
        },

        // הסרת הגנה לפי הנתונים שלה (לא לפי slot index כי ה-DOM משתנה)
        async removeProtectionByData(protection) {
            if (!protection || !protection.image) {
                console.log('[ComboManager] No protection data for removal');
                return;
            }

            console.log(`[ComboManager] Removing protection ${protection.name}`);

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
                    console.log(`[ComboManager] Found protection ${protection.name} at slot ${i}`);
                    
                    // חיפוש כפתור ההסרה
                    const deleteButton = mountedResist.querySelector('img[src*="iconDeleteSelect"]');
                    if (deleteButton) {
                        const deleteButtonContainer = deleteButton.closest('div');
                        if (deleteButtonContainer) {
                            await this.clickWithCoordinates(deleteButtonContainer);
                            await Utils.sleep(50);
                            console.log(`[ComboManager] Removed protection ${protection.name}`);
                            return;
                        }
                    }

                    console.log(`[ComboManager] Delete button not found for ${protection.name}, trying click + equip`);
                    
                    // אם לא מצאנו כפתור הסרה, ננסה לחיצה על ההגנה ואז equip
                    await this.clickWithCoordinates(mountedResist);
                    await Utils.sleep(50);
                    await this.clickEquipButton();
                    await Utils.sleep(50);
                    return;
                }
            }

            console.log(`[ComboManager] Protection ${protection.name} not found in mounted protections`);
        },

        // הסרת הגנה ב-חריץ מסוים
        async removeProtectionAtSlot(slotIndex) {
            console.log(`[ComboManager] Removing protection at slot ${slotIndex}`);

            // מציאת כל ההגנות המצוידות
            const mountedResists = document.querySelectorAll(DOM.PROTECTION_MOUNTED_RESIST);
            
            if (slotIndex >= mountedResists.length) {
                // אין הגנה ב-חריץ הזה - אין מה להסיר
                console.log(`[ComboManager] Slot ${slotIndex} out of range`);
                return;
            }

            const mountedResist = mountedResists[slotIndex];
            if (!mountedResist) {
                console.log(`[ComboManager] No mounted resist found at slot ${slotIndex}`);
                return;
            }

            // בדיקה אם יש הגנה מצוידת ב-חריץ הזה (אם יש אייקון, יש הגנה)
            const iconImg = mountedResist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
            if (!iconImg || !iconImg.src) {
                // אין הגנה ב-חריץ הזה - אין מה להסיר
                console.log(`[ComboManager] No protection icon at slot ${slotIndex}`);
                return;
            }

            console.log(`[ComboManager] Found protection to remove at slot ${slotIndex}:`, iconImg.src);

            // חיפוש כפתור ההסרה הספציפי של ההגנה המצוידת
            // הכפתור הוא img עם src שמכיל "iconDeleteSelect"
            const deleteButton = mountedResist.querySelector('img[src*="iconDeleteSelect"]');
            if (deleteButton) {
                // מצאנו את כפתור ההסרה - נלחץ עליו
                console.log(`[ComboManager] Found delete button for slot ${slotIndex}`);
                const deleteButtonContainer = deleteButton.closest('div');
                if (deleteButtonContainer) {
                    await this.clickWithCoordinates(deleteButtonContainer);
                    await Utils.sleep(50);
                    console.log(`[ComboManager] Clicked delete button for slot ${slotIndex}`);
                    return;
                }
            }

            console.log(`[ComboManager] Delete button not found for slot ${slotIndex}, trying old method`);

            // אם לא מצאנו כפתור הסרה ספציפי, ננסה את השיטה הישנה
            // לחיצה על ההגנה המצוידת כדי לבחור אותה להסרה
            await this.clickWithCoordinates(mountedResist);
            await Utils.sleep(50);

            // לחיצה על כפתור Equip (שבעצם יסיר את ההגנה אם היא כבר מצוידת)
            await this.clickEquipButton();
            await Utils.sleep(50);
        },

        // חיפוש הגנה ברשימה לפי שם או תמונה
        findProtectionInList(protection) {
            if (!protection) return null;

            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);
            const searchName = protection.name ? protection.name.toUpperCase().trim() : '';
            const searchImageUrl = protection.image || '';

            console.log(`[ComboManager] Searching for protection: name="${searchName}", image="${searchImageUrl}"`);

            // אם יש תמונה, נשתמש בה לחיפוש (יותר מדויק)
            if (searchImageUrl) {
                const ProtectionScanner = window.TankiComboManager.ProtectionScanner;
                if (ProtectionScanner) {
                    const searchIconFileName = ProtectionScanner.extractIconFileName(searchImageUrl);
                    console.log(`[ComboManager] Searching by icon filename: "${searchIconFileName}"`);
                    
                    if (searchIconFileName) {
                        // חיפוש ישיר לפי שם הקובץ של האייקון
                        for (let item of items) {
                            const resistanceIcon = item.querySelector(DOM.PROTECTION_LIST_RESISTANCE_ICON);
                            if (resistanceIcon && resistanceIcon.src) {
                                const iconFileName = ProtectionScanner.extractIconFileName(resistanceIcon.src);
                                console.log(`[ComboManager] Comparing with icon: "${iconFileName}"`);
                                
                                if (iconFileName && iconFileName === searchIconFileName) {
                                    console.log(`[ComboManager] Found protection by icon match!`);
                                    return item;
                                }
                            }
                        }
                    }
                }
            }

            // אם לא מצאנו לפי תמונה, נחפש לפי שם
            if (searchName) {
                console.log(`[ComboManager] Searching by name: "${searchName}"`);
                for (let item of items) {
                    const descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                    if (!descriptionDevice) continue;

                    const nameSpan = descriptionDevice.querySelector('span');
                    if (!nameSpan) continue;

                    const itemNameInList = nameSpan.innerText.trim().toUpperCase();
                    const cleanItemName = Utils.cleanItemName(itemNameInList);
                    if (!cleanItemName) continue;
                    const cleanItemNameUpper = cleanItemName.toUpperCase();

                    console.log(`[ComboManager] Comparing name: "${cleanItemNameUpper}" with "${searchName}"`);

                    // השוואה לפי השם הראשי (בלי Mk/רמה)
                    if (cleanItemNameUpper === searchName || itemNameInList.includes(searchName)) {
                        console.log(`[ComboManager] Found protection by name match!`);
                        return item;
                    }
                }
            }

            console.warn(`[ComboManager] Protection not found in list!`);
            return null;
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