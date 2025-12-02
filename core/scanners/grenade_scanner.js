// core/scanners/grenade_scanner.js
// סורק רימונים - מזהה את הרימון המצויד ואת התמונה שלו

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.GrenadeScanner = {

        // פונקציה לזיהוי רימון מצויד
        scanGrenade() {
            // אנחנו בודקים אם הכפתור "Equipped" או "Unequip" קיים בדף
            // לרימונים הכפתור אומר "unequip" כשמצויד
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

            // ניקוי השם - רק החלק הראשון בלי MK (למקרה שהשם מלמעלה הוא בלי Mk)
            const cleanSearchName = Utils.cleanItemName(itemName).toLowerCase();

            for (let item of items) {
                // חיפוש שם הפריט בתוך האלמנט
                // לרימונים המבנה קצת שונה - יש GarageItemComponentStyle-descriptionDevice
                const nameSpan = item.querySelector('.GarageItemComponentStyle-descriptionDevice span');
                const mkElement = item.querySelector('.GarageItemComponentStyle-descriptionDevice h2');

                if (nameSpan) {
                    const itemNameInList = nameSpan.innerText.trim().toLowerCase();
                    
                    // השוואה לפי השם הראשי בלבד (בלי Mk) - כי למעלה השם הוא בלי Mk
                    if (itemNameInList === cleanSearchName) {
                        // מצאנו את הפריט, נשתמש בפונקציה הגנרית למציאת תמונה
                        return Utils.findImageBySelector(DOM.ITEM_LIST_IMAGE, item);
                    }
                }
            }

            return null;
        }
    };
})();

