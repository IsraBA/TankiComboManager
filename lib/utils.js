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
            // לוקח רק את החלק הראשון של השם (לפני הרווח)
            // זה עובד טוב ל-Firebird, Hammer וכו'.
            // אם יש שמות עם רווח (כמו Nuclear Energy) נצטרך לוגיקה חכמה יותר בהמשך
            // כרגע נחזיר את הכל וננקה ידנית במקרה הצורך או שנסמוך על הפורמט
            return fullName.split(' Mk')[0].trim();
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