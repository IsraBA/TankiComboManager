// core/scanners/base_item_scanner.js
// סורק בסיסי לפריטים פשוטים - תותחים, גופים, רימונים, דרונים
// מכיל את הלוגיקה המשותפת לכל הפריטים האלה

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.BaseItemScanner = {

        // פונקציה שמנקה את שם הדרון מהרמה (Crisis-20 -> Crisis)
        cleanDroneName(fullName) {
            if (!fullName) return null;
            // הסרת הרמה - יכול להיות "Crisis-20" או "Crisis lvl-20" וכו'
            // נסיר כל מה שמתחיל ב- או lvl- או - ואחריו מספרים
            return fullName.replace(/[\s-]*lvl-?\d+[\s-]*/i, '').replace(/[\s-]*-?\d+[\s-]*$/, '').trim();
        },

        // פונקציה גנרית לזיהוי פריט מצויד
        // cleanNameFn - פונקציה אופציונלית לניקוי השם (למשל cleanDroneName לדרונים)
        scanItem(cleanNameFn = null) {
            // אנחנו בודקים אם הכפתור "Equipped" קיים בדף
            const equippedBtn = document.querySelector(DOM.ITEM_IS_EQUIPPED_BTN);

            if (equippedBtn) {
                // אם הכפתור קיים, סימן שהפריט שמוצג כרגע הוא המצויד
                const nameEl = document.querySelector(DOM.ITEM_NAME_TEXT);
                if (nameEl) {
                    const fullName = nameEl.innerText.trim();

                    // ניקוי השם - אם יש פונקציה מותאמת אישית, נשתמש בה, אחרת נשתמש ב-Utils.cleanItemName
                    let cleanName;
                    if (cleanNameFn && typeof cleanNameFn === 'function') {
                        cleanName = cleanNameFn(fullName);
                    } else {
                        cleanName = Utils.cleanItemName(fullName);
                    }

                    const upperName = cleanName ? cleanName.toUpperCase() : null;

                    // חיפוש התמונה ברשימה לפי השם המלא (כולל MK/רמה)
                    const imageUrl = this.findItemImageInList(fullName, cleanName);

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
        findItemImageInList(itemName, cleanName = null) {
            // חיפוש כל הפריטים ברשימה
            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);

            // ניקוי השם לחיפוש - אם לא קיבלנו שם נקי, ננקה אותו
            const cleanSearchName = cleanName || Utils.cleanItemName(itemName);
            if (!cleanSearchName) return null;

            const cleanSearchNameLower = cleanSearchName.toLowerCase();

            for (let item of items) {
                // חיפוש שם הפריט בתוך האלמנט
                // ננסה קודם עם DOM.ITEM_DESCRIPTION_DEVICE, ואם לא נמצא ננסה עם הסלקטור הישיר
                let descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                if (!descriptionDevice) {
                    descriptionDevice = item.querySelector('.GarageItemComponentStyle-descriptionDevice');
                }

                if (!descriptionDevice) continue;

                const nameSpan = descriptionDevice.querySelector('span');
                if (!nameSpan) continue;

                const itemNameInList = nameSpan.innerText.trim().toLowerCase();

                // השוואה לפי השם הראשי בלבד (בלי Mk/רמה) - כי ברשימה יכול להיות "MAX" במקום Mk
                if (itemNameInList === cleanSearchNameLower) {
                    // מצאנו את הפריט, נשתמש בפונקציה הגנרית למציאת תמונה
                    return Utils.findImageBySelector(DOM.ITEM_LIST_IMAGE, item);
                }
            }

            return null;
        }
    };
})();

