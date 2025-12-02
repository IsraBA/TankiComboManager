// lib/constants.js

// כאן אנחנו מגדירים את ה"כתובות" ב-HTML
// משתמשים ב-IIFE כדי ליצור namespace גלובלי
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.DOM = {
        // --- ניווט ראשי ---
        MENU_CONTAINER: ".GarageMenuComponentStyle-garageMenuContainer .MenuComponentStyle-battleTitleCommunity > div",

        TAB_ITEM_CLASS: "MenuComponentStyle-mainMenuItem",
        ACTIVE_TAB_CLASS: "Common-activeMenu",
        ACTIVE_UNDERLINE_CLASS: "Common-menuItemActive",

        // --- הסתרה ---
        GARAGE_WRAPPER: ".GarageCommonStyle-garageContainer",
        TANK_PREVIEW_CANVAS: "#tankPreviewCanvas",
        ELEMENTS_TO_HIDE: `
            .GarageCommonStyle-positionContent, 
            .PaintsCollectionComponentStyle-containerPaints,
            .PaintsCollectionComponentStyle-blockPaints,
            .GarageSuppliesPreviewComponentStyle-view,
            .GarageCommonStyle-positionContentAlteration
        `,

        // --- זיהוי פריטים (תותח/גוף וכו') ---
        // הטקסט שמכיל את שם הפריט (למשל Hammer Mk5-0)
        ITEM_NAME_TEXT: ".ItemDescriptionComponentStyle-nameItem span",

        // הכפתור שמראה שפריט מצויד (Equipped) במסך ראשי
        ITEM_IS_EQUIPPED_BTN: ".MountedItemsComponentStyleMobile-buttonEstablished",

        // תמונה של פריט ברשימה
        ITEM_LIST_IMAGE: ".GarageItemComponentStyle-mainImg",
        
        // קונטיינר של פריט ברשימה
        ITEM_LIST_CONTAINER: ".garage-item",
        
        // קונטיינר תמונה ברשימה (להגנה)
        ITEM_PREVIEW_CONTAINER: ".GarageItemComponentStyle-itemPreview",
        
        // תיאור פריט ברשימה (לשם הפריט)
        ITEM_DESCRIPTION_DEVICE: ".GarageItemComponentStyle-descriptionDevice",

        // --- זיהוי אוגמנטים (Sub Items) ---
        // הכפתור שפותח את חלון האוגמנטים (נמצא במסך התותח)
        OPEN_AUGMENTS_BTN: ".DeviceButtonComponentStyle-deviceIcon",

        // כפתור חזרה (Back Arrow) - כדי לצאת ממסך האוגמנטים
        BACK_BUTTON: ".BreadcrumbsComponentStyle-backButton",

        // בתוך גריד האוגמנטים:
        AUGMENT_CELL: ".Common-flexCenterAlignCenterColumn", // התא שעוטף כל אוגמנט
        AUGMENT_NAME: ".SkinCellStyle-nameDevices", // שם האוגמנט
        AUGMENT_EQUIPPED_ICON: ".SkinCellStyle-mountIcon", // האייקון שמופיע רק על מה שמצויד
        AUGMENT_IMAGE: "img", // תמונה של אוגמנט (בתוך התא)

        // --- זיהוי הגנה (Protection) ---
        PROTECTION_MODULE_NAME: ".GarageProtectionsComponentStyle-aboutDefence h1", // שם מודול ההגנה (Spider-0)
        PROTECTION_MOUNTED_RESIST: ".GarageProtectionsComponentStyle-mountedResist", // הגנה מצוידת (4 כאלה)
        PROTECTION_RESISTANCE_ICON: ".CellResistanceComponentStyle-resistanceIconContainer img", // אייקון תותח בהגנה מצוידת
        PROTECTION_LIST_RESISTANCE_ICON: ".GarageItemComponentStyle-itemResistanceIcon", // אייקון תותח ברשימה

        // --- זיהוי צבעים (Paints) ---
        PAINT_NAME: ".PaintsCollectionComponentStyle-headlinePaint h1", // שם הצבע (White)
        PAINT_LIST_CONTAINER: ".ListItemsComponentStyle-itemsContainer" // קונטיינר של רשימת הצבעים
    };
})();