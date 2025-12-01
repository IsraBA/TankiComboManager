// lib/constants.js

// כאן אנחנו מגדירים את ה"כתובות" ב-HTML
// משתמשים ב-IIFE כדי ליצור namespace גלובלי
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    // הקונטיינר שמחזיק את כל הטאבים (Turrets, Hulls...)
    window.TankiComboManager.DOM = {
        // לפי ה-HTML: הוא נמצא בתוך MenuComponentStyle-battleTitleCommunity והוא ה-Div הראשון בתוכו (שהוא Flex)
        MENU_CONTAINER: ".MenuComponentStyle-battleTitleCommunity > div",

        // המחלקה של כפתור טאב רגיל
        TAB_ITEM_CLASS: "MenuComponentStyle-mainMenuItem",

        // המחלקה שמסמנת שטאב הוא פעיל (ירוק)
        ACTIVE_TAB_CLASS: "Common-activeMenu",

        // ה-Div הפנימי שעושה את הקו התחתון הירוק לטאב הפעיל
        ACTIVE_UNDERLINE_CLASS: "Common-menuItemActive",

        // כל התוכן של המוסך (הטנק הגדול + הרשימה למטה) - אותו נרצה להסתיר
        GAME_CONTENT: ".GarageCommonStyle-positionContent",

        // המודל של הטנק שמסתובב (נמצא מחוץ לתוכן הראשי)
        TANK_PREVIEW_CANVAS: "#tankPreviewCanvas",

        // העוטף הראשי של המוסך - לתוכו נזריק את המסך שלנו
        GARAGE_WRAPPER: ".GarageCommonStyle-garageContainer",

        // רשימה מופרדת בפסיקים של כל מה שצריך להסתיר
        // כולל התוכן הרגיל, מסך הצבעים, ומסך האספקה
        ELEMENTS_TO_HIDE: `
            .GarageCommonStyle-positionContent, 
            .PaintsCollectionComponentStyle-containerPaints,
            .PaintsCollectionComponentStyle-blockPaints,
            .GarageSuppliesPreviewComponentStyle-view
        `
    };
})();