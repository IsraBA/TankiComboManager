// core/scanners/paint_scanner.js
// סורק צבעים - מזהה את הצבע המצויד ואת התמונה שלו

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;

    window.TankiComboManager.PaintScanner = {

        // פונקציה לזיהוי צבע מצויד
        scanPaint() {
            // חיפוש שם הצבע - זה תמיד קיים אם אנחנו בטאב צבעים
            const nameEl = document.querySelector(DOM.PAINT_NAME);
            
            if (nameEl) {
                const paintName = nameEl.innerText.trim();
                const upperName = paintName ? paintName.toUpperCase() : null;

                // חיפוש התמונה ברשימה - הצבע המצויד מזוהה על ידי רקע ירוק
                const imageUrl = this.findPaintImageInList();

                if (upperName) {
                    return {
                        name: upperName,
                        image: imageUrl
                    };
                }
            }
            
            return null;
        },

        // פונקציה שמחפשת תמונה של צבע ברשימה
        // הצבע המצויד מזוהה על ידי רקע ירוק: rgba(118, 255, 51, 0.15) ו-box-shadow לבן
        findPaintImageInList() {
            // חיפוש כל הפריטים ברשימה
            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);

            for (let item of items) {
                // בדיקת ה-style של האלמנט - הצבע המצויד יש לו רקע ירוק ו-box-shadow לבן
                const computedStyle = window.getComputedStyle(item);
                const backgroundColor = computedStyle.backgroundColor;
                const boxShadow = computedStyle.boxShadow;

                // בדיקה אם הרקע הוא הירוק המציין צבע נבחר
                // rgba(118, 255, 51, 0.15) או rgb(118, 255, 51) עם opacity
                const hasGreenBackground = backgroundColor.includes('118, 255, 51');
                
                // בדיקה אם יש box-shadow לבן שמציין בחירה
                // box-shadow: rgb(255, 255, 255) 0em 0em 0em 0.125em
                const hasWhiteBoxShadow = boxShadow && boxShadow.includes('255, 255, 255');

                if (hasGreenBackground || hasWhiteBoxShadow) {
                    // מצאנו את הצבע המצויד! נחלץ את התמונה שלו
                    const previewContainer = item.querySelector(DOM.ITEM_PREVIEW_CONTAINER);
                    if (previewContainer) {
                        const img = previewContainer.querySelector(DOM.ITEM_LIST_IMAGE);
                        if (img && img.src) {
                            return img.src;
                        }
                    }
                }
            }

            return null;
        }
    };
})();

