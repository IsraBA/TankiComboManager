// core/scanners/augment_scanner.js
// סורק אוגמנטים - מזהה את האוגמנט המצויד ואת התמונה שלו
// משותף לאוגמנטים של תותח וגוף (הלוגיקה זהה)

(function () {
  "use strict";

  const DOM = window.TankiComboManager.DOM;
  const Utils = window.TankiComboManager.Utils;

  window.TankiComboManager.AugmentScanner = {
    // פונקציה לזיהוי אוגמנט מצויד (תותח או גוף)
    async scanAugment() {
      // ניגש ל-NavigationHelpers בזמן הקריאה (לא בזמן טעינת המודול)
      // כי navigation_helpers.js נטען אחרי הקובץ הזה
      const NavigationHelpers = window.TankiComboManager.NavigationHelpers;

      const augmentImage = Utils.findImageBySelector(
        `${DOM.OPEN_AUGMENTS_BTN}`,
      );

      const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
      if (!openBtn) {
        return null;
      }

      // כניסה למסך אוגמנטים - מקימים observer *לפני* הלחיצה
      // ואז ממתינים שכל ה-DOM ייגמר להתרנדר (כולל נתוני האוגמנטים)
      const contentReady = NavigationHelpers.waitForDOMChange(null);
      openBtn.click();
      await contentReady;

      let equippedAugmentName = null;

      const mountIcon = document.querySelector(DOM.AUGMENT_EQUIPPED_ICON);

      if (mountIcon) {
        const parentCell = mountIcon.closest(DOM.AUGMENT_CELL);
        if (parentCell) {
          const nameEl = parentCell.querySelector(DOM.AUGMENT_NAME);
          if (nameEl) {
            equippedAugmentName = nameEl.innerText.trim().toUpperCase();
          }
        }
      } else {
        equippedAugmentName = "STANDARD";
      }

      // יציאה ממסך האוגמנטים
      const backBtn = document.querySelector(DOM.BACK_BUTTON);
      if (backBtn) {
        const contentBack = NavigationHelpers.waitForDOMChange(null);
        backBtn.click();
        await contentBack;
      }

      if (equippedAugmentName) {
        return {
          name: equippedAugmentName,
          image: augmentImage,
        };
      }

      return null;
    },
  };
})();
