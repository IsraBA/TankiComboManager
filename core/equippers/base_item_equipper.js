// core/equippers/base_item_equipper.js
// הצטיידות בסיסית בפריטים פשוטים - תותחים, גופים, רימונים, דרונים
// מכיל את הלוגיקה המשותפת לכל הפריטים האלה

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.BaseItemEquipper = {

        // פונקציה גנרית להצטיידות בפריט בסיסי
        // item - אובייקט עם name ו-image
        // tabName - שם הטאב (Turrets, Hulls, Grenades, Drones)
        // itemType - סוג הפריט (לצורך הודעות שגיאה)
        async equipItem(item, tabName, itemType) {
            if (!item || !item.name) return;

            const ComboLoader = window.TankiComboManager.ComboLoader;

            if (window.TankiComboManager.TabNavigator) {
                await window.TankiComboManager.TabNavigator.navigateToTab(tabName);
            }

            const itemElement = ComboLoader.findItemInList(item.name);
            if (!itemElement) {
                console.warn(`[ComboManager] ${itemType} ${item.name} not found in garage`);
                return;
            }

            // בדיקה אם הפריט נרכש (אם יש תמונה והוא לא מוסתר)
            if (!ComboLoader.isItemPurchased(itemElement)) {
                console.warn(`[ComboManager] ${itemType} ${item.name} not purchased`);
                return;
            }

            // לחיצה על הפריט כדי לבחור אותו
            const itemName = itemElement.querySelector(DOM.ITEM_DESCRIPTION_DEVICE)?.querySelector('span')?.innerText || item.name;

            // ננסה ללחוץ על התמונה עצמה עם pointer events וקואורדינטות מדויקות
            const itemImage = itemElement.querySelector(DOM.ITEM_LIST_IMAGE);
            if (itemImage) {
                await ComboLoader.clickWithCoordinates(itemImage);
            } else {
                itemElement.click();
            }

            await Utils.sleep(50);

            // בדיקה נוספת אחרי הלחיצה - אם אין כפתור equip, הפריט לא נרכש
            if (!ComboLoader.isItemPurchased(null)) {
                console.warn(`[ComboManager] ${itemType} ${item.name} not purchased (no equip button)`);
                return;
            }

            // לחיצה על כפתור Equip (Enter)
            await ComboLoader.clickEquipButton();
        }
    };
})();

