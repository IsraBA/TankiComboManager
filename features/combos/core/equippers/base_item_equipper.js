// features/combos/core/equippers/base_item_equipper.js

// הצטיידות ב-DOM בפריט בסיס: תותח, גוף, רימון, דרון.

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  const Utils = window.TankiQoL.Utils;

  window.TankiQoL.BaseItemEquipper = {
    // item={name,image}, tabName=Turrets/Hulls/Grenades/Drones
    async equipItem(item, tabName, itemType) {
      if (!item || !item.name) return;

      const ComboLoader = window.TankiQoL.ComboLoader;

      if (window.TankiQoL.TabNavigator) {
        await window.TankiQoL.TabNavigator.navigateToTab(tabName);
      }

      const itemElement = ComboLoader.findItemInList(item.name);
      if (!itemElement) {
        return;
      }

      // בדיקה אם הפריט נרכש (אם יש תמונה והוא לא מוסתר)
      if (!ComboLoader.isItemPurchased(itemElement)) {
        return;
      }

      // לחיצה על הפריט כדי לבחור אותו
      const itemName =
        itemElement
          .querySelector(DOM.ITEM_DESCRIPTION_DEVICE)
          ?.querySelector("span")?.innerText || item.name;

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
        return;
      }

      // לחיצה על כפתור Equip (Enter)
      await ComboLoader.clickEquipButton();
    },
  };
})();
