// core/scanners/drone_scanner.js
// סורק דרונים - מזהה את הדרון המצויד ואת התמונה שלו

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.DroneScanner = {

        // פונקציה לזיהוי דרון מצויד
        scanDrone() {
            // אנחנו בודקים אם הכפתור "Equipped" קיים בדף
            const equippedBtn = document.querySelector(DOM.ITEM_IS_EQUIPPED_BTN);

            if (equippedBtn) {
                // אם הכפתור קיים, סימן שהפריט שמוצג כרגע הוא המצויד
                const nameEl = document.querySelector(DOM.ITEM_NAME_TEXT);
                if (nameEl) {
                    const fullName = nameEl.innerText.trim();
                    // ניקוי השם - הסרת הרמה (lvl-20 או -20)
                    const cleanName = this.cleanDroneName(fullName);
                    const upperName = cleanName ? cleanName.toUpperCase() : null;

                    // חיפוש התמונה ברשימה לפי השם הנקי
                    const imageUrl = this.findItemImageInList(cleanName);

                    if (upperName) {
                        return {
                            name: upperName,
                            image: imageUrl
                        };
                    }
                }
            }
            return null;
        },

        // פונקציה שמנקה את שם הדרון מהרמה (Crisis-20 -> Crisis)
        cleanDroneName(fullName) {
            if (!fullName) return null;
            // הסרת הרמה - יכול להיות "Crisis-20" או "Crisis lvl-20" וכו'
            // נסיר כל מה שמתחיל ב- או lvl- או - ואחריו מספרים
            return fullName.replace(/[\s-]*lvl-?\d+[\s-]*/i, '').replace(/[\s-]*-?\d+[\s-]*$/, '').trim();
        },

        // פונקציה שמחפשת תמונה של פריט ברשימה לפי השם
        findItemImageInList(itemName) {
            // חיפוש כל הפריטים ברשימה
            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);

            // ניקוי השם לחיפוש
            const cleanSearchName = itemName ? itemName.toLowerCase() : '';

            for (let item of items) {
                // חיפוש שם הפריט בתוך האלמנט
                const nameSpan = item.querySelector('.GarageItemComponentStyle-descriptionDevice span');
                const levelElement = item.querySelector('.GarageItemComponentStyle-descriptionDevice h2');

                if (nameSpan) {
                    const itemNameInList = nameSpan.innerText.trim().toLowerCase();

                    // השוואה לפי השם הראשי בלבד (בלי רמה) - כי למעלה השם הוא עם רמה
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

