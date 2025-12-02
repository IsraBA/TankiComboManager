// lib/utils.js
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.Utils = {
        // פונקציית המתנה (Promise based)
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // פונקציה שמנקה את השם (למשל מורידה את ה-Mk7-20)
        cleanItemName(fullName) {
            if (!fullName) return null;
            // לוקח רק את החלק הראשון של השם (לפני Mk/MK/mk)
            // זה עובד טוב ל-Firebird, Hammer וכו'.            
            // חיפוש של Mk/MK/mk (case insensitive) עם או בלי רווח לפני
            const mkPattern = /\s*[Mm][Kk]\d+/;
            const match = fullName.match(mkPattern);
            if (match) {
                return fullName.substring(0, match.index).trim();
            }
            
            // אם לא מצאנו, נחזיר את כל השם
            return fullName.trim();
        },

        // פונקציה גנרית למציאת תמונה לפי סלקטור
        findImageBySelector(selector, container = document) {
            const img = container.querySelector(selector);
            if (img && img.src) {
                return img.src;
            }
            return null;
        },

        // לוגר צבעוני ויפה לקונסול
        log(msg, data = null) {
            if (data) {
                console.log(`%c[ComboManager] ${msg}`, 'color: #76ff33; font-weight: bold;', data);
            } else {
                console.log(`%c[ComboManager] ${msg}`, 'color: #76ff33; font-weight: bold;');
            }
        }
    };
})();