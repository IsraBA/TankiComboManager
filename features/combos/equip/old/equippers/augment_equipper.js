// features/combos/equip/old/equippers/augment_equipper.js
// הצטיידות באוגמנטים (תותח וגוף)

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  const Utils = window.TankiQoL.Utils;

  window.TankiQoL.AugmentEquipper = {
    // פונקציה גנרית להצטיידות באוגמנט
    // augment - אובייקט עם name ו-image
    // tabName - שם הטאב (Turrets או Hulls)
    async equipAugment(augment, tabName) {
      if (!augment || !augment.name) return;

      const ComboLoader = window.TankiQoL.ComboLoader;

      // וידוא שאנחנו במסך הנכון
      if (window.TankiQoL.TabNavigator) {
        await window.TankiQoL.TabNavigator.navigateToTab(tabName);
      }

      // פתיחת מסך האוגמנטים
      const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
      if (!openBtn) {
        return;
      }

      openBtn.click();
      await Utils.sleep(50); // המתנה לפתיחת החלון

      // חיפוש האוגמנט ברשימה
      const augmentCell = ComboLoader.findAugmentInList(augment.name);
      if (!augmentCell) {
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
        // יציאה ממסך האוגמנטים
        const backBtn = document.querySelector(DOM.BACK_BUTTON);
        if (backBtn) {
          backBtn.click();
          await Utils.sleep(50);
        }
        return;
      }

      // לחיצה על האוגמנט כדי להצטייד בו
      const augmentName =
        augmentCell.querySelector(DOM.AUGMENT_NAME)?.innerText || augment.name;

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
    },
  };
})();
