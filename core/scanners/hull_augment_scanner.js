// core/scanners/hull_augment_scanner.js
// סורק אוגמנטים לגוף - מזהה את האוגמנט המצויד ואת התמונה שלו

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.HullAugmentScanner = {

        // פונקציה לזיהוי אוגמנט גוף מצויד
        async scanHullAugment() {
            // קודם כל, נקח את התמונה של האוגמנט מהמסך הראשי (לפני שנכנסים למסך האוגמנטים)
            // התמונה נמצאת ב-img עם class DeviceButtonComponentStyle-deviceIcon
            const augmentImage = Utils.findImageBySelector(`${DOM.OPEN_AUGMENTS_BTN}`);

            const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
            if (!openBtn) {
                return null;
            }

            // כניסה למסך אוגמנטים
            openBtn.click();
            await Utils.sleep(300); // המתנה לפתיחת החלון

            let equippedAugmentName = null;

            // חיפוש האייקון של "Equipped" בתוך הגריד
            const mountIcon = document.querySelector(DOM.AUGMENT_EQUIPPED_ICON);

            if (mountIcon) {
                // מצאנו את האייקון, עכשיו צריך למצוא את השם שנמצא באותו "תא"
                // אנחנו עולים למעלה לאבא המשותף (התא) ואז מחפשים את השם
                const parentCell = mountIcon.closest(DOM.AUGMENT_CELL); // שימוש ב-closest זה הכי בטוח
                if (parentCell) {
                    const nameEl = parentCell.querySelector(DOM.AUGMENT_NAME);
                    if (nameEl) {
                        equippedAugmentName = nameEl.innerText.trim().toUpperCase();
                    }
                }
            } else {
                // אם לא מצאנו אייקון mount, אולי "Standard settings" נבחר?
                // בדרך כלל לסטנדרט אין אייקון mount, אז נניח שזה זה.
                equippedAugmentName = "STANDARD";
            }

            // יציאה ממסך האוגמנטים (חזרה לגוף)
            const backBtn = document.querySelector(DOM.BACK_BUTTON);
            if (backBtn) {
                backBtn.click();
                await Utils.sleep(300); // המתנה קצרה ליציאה
            }

            if (equippedAugmentName) {
                return {
                    name: equippedAugmentName,
                    image: augmentImage
                };
            }

            return null;
        }
    };
})();

