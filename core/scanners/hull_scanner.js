// core/scanners/hull_scanner.js
// סורק גופים - מזהה את הגוף המצויד ואת התמונה שלו

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.HullScanner = {

        // פונקציה לזיהוי גוף מצויד
        scanHull() {
            // אנחנו בודקים אם הכפתור "Equipped" קיים בדף
            const equippedBtn = document.querySelector(DOM.ITEM_IS_EQUIPPED_BTN);

            if (equippedBtn) {
                // אם הכפתור קיים, סימן שהפריט שמוצג כרגע הוא המצויד
                const nameEl = document.querySelector(DOM.ITEM_NAME_TEXT);
                if (nameEl) {
                    const fullName = nameEl.innerText.trim();
                    // ניקוי השם - רק החלק הראשון בלי MK
                    const cleanName = Utils.cleanItemName(fullName);
                    const upperName = cleanName ? cleanName.toUpperCase() : null;

                    // חיפוש התמונה ברשימה לפי השם המלא (כולל MK)
                    const imageUrl = this.findItemImageInList(fullName);

                    if (upperName) {
                        return {
                            name: upperName,
                            image: imageUrl
                        };
                    }
                }
            }
            // הערה: הלוגיקה הזו נכונה אם המשחק מציג תמיד את הפריט המצויד כשנכנסים לטאב.
            // אם לא, נצטרך לרוץ על הגריד למטה. לפי מה שאני מכיר בטנקי, כשנכנסים לטאב הוא מראה את מה שעליך.
            return null;
        },

        // פונקציה שמחפשת תמונה של פריט ברשימה לפי השם
        findItemImageInList(itemName) {
            // חיפוש כל הפריטים ברשימה
            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);

            // ניקוי השם לחיפוש - רק החלק הראשון בלי MK
            const cleanSearchName = Utils.cleanItemName(itemName);
            if (!cleanSearchName) return null;

            for (let item of items) {
                // חיפוש שם הפריט בתוך האלמנט
                const descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                if (!descriptionDevice) continue;
                
                const nameSpan = descriptionDevice.querySelector('span');
                if (!nameSpan) continue;

                const itemNameInList = nameSpan.innerText.trim().toLowerCase();
                const cleanSearchNameLower = cleanSearchName.toLowerCase();

                // השוואה לפי השם הראשי בלבד (בלי Mk) - כי ברשימה יכול להיות "MAX" במקום Mk
                if (itemNameInList === cleanSearchNameLower) {
                    // מצאנו את הפריט, נשתמש בפונקציה הגנרית למציאת תמונה
                    return Utils.findImageBySelector(DOM.ITEM_LIST_IMAGE, item);
                }
            }

            return null;
        }
    };
})();

