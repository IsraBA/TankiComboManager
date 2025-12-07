// core/equippers/augment_equipper.js
// הצטיידות באוגמנטים (תותח וגוף)

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.AugmentEquipper = {
        // פונקציה גנרית להצטיידות באוגמנט
        // augment - אובייקט עם name ו-image
        // tabName - שם הטאב (Turrets או Hulls)
        async equipAugment(augment, tabName) {
            if (!augment || !augment.name) return;

            const ComboLoader = window.TankiComboManager.ComboLoader;

            // וידוא שאנחנו במסך הנכון
            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab(tabName);
            }

            // פתיחת מסך האוגמנטים
            const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
            if (!openBtn) {
                // console.warn('[ComboManager] Could not open augments screen');
                return;
            }

            openBtn.click();
            await Utils.sleep(50); // המתנה לפתיחת החלון

            // חיפוש האוגמנט ברשימה
            const augmentCell = ComboLoader.findAugmentInList(augment.name);
            if (!augmentCell) {
                // console.warn(`[ComboManager] Augment ${augment.name} not found`);
                // יציאה ממסך האוגמנטים
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }
                return;
            }

            // בדיקה אם האוגמנט נרכש
            if (!ComboLoader.isAugmentPurchased(augmentCell)) {
                // console.warn(`[ComboManager] Augment ${augment.name} not purchased`);
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
            await ComboLoader.clickWithCoordinates(augmentCell);
            await Utils.sleep(50);

            // לחיצה על כפתור Equip במסך האוגמנטים
            await ComboLoader.clickEquipButton();
            await Utils.sleep(50);

            // יציאה ממסך האוגמנטים
            const backBtn = document.querySelector(DOM.BACK_BUTTON);
            if (backBtn) {
                backBtn.click();
                await Utils.sleep(50);
            }
        }
    };
})();