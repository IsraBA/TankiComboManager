// lib/constants.js

// כאן אנחנו מגדירים את ה"כתובות" ב-HTML
// משתמשים ב-IIFE כדי ליצור namespace גלובלי
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.DOM = {
        NOT_IN_GAME_CONTAINER: ".Common-container",
        // --- ניווט ראשי ---
        GARAGE_MENU_CONTAINER: ".GarageMenuComponentStyle-garageMenuContainer",
        MENU_CONTAINER: ".GarageMenuComponentStyle-garageMenuContainer .MenuComponentStyle-battleTitleCommunity > div",

        TAB_ITEM_CLASS: "MenuComponentStyle-mainMenuItem",
        ACTIVE_TAB_CLASS: "Common-activeMenu",
        ACTIVE_UNDERLINE_CLASS: "Common-menuItemActive",
        
        // כפתורי ניווט Q ו-E
        QE_BUTTONS_CONTAINER: ".MenuComponentStyle-blockButtonsQECommunity",
        QE_BUTTON_CLASS: "Common-buttonQE",

        // --- הסתרה ---
        GARAGE_WRAPPER: ".GarageCommonStyle-garageContainer",
        TANK_PREVIEW_CANVAS: "#tankPreviewCanvas",
        POSITION_CONTENT: ".GarageCommonStyle-positionContent",
        ELEMENTS_TO_HIDE: `
            .GarageCommonStyle-positionContent, 
            .PaintsCollectionComponentStyle-containerPaints,
            .PaintsCollectionComponentStyle-blockPaints,
            .GarageSuppliesPreviewComponentStyle-view,
            .GarageCommonStyle-positionContentAlteration,
            .TanksPartComponentStyle-amountItems,
            .GarageGrenadePreviewComponentStyle-view
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
        
        // מחיר פריט ברשימה (אם קיים, הפריט לא נרכש)
        ITEM_PRICE_IN_CRYSTALS: ".GarageItemComponentStyle-itemPriceInCrystals",

        // --- כפתורי פעולה ---
        // כפתור Equip/Upgrade (הכפתור הראשי עם Enter hotkey)
        EQUIP_BUTTON: ".SquarePriceButtonComponentStyle-commonBlockButton",
        
        // אלמנט Hotkey (Enter, Space וכו')
        HOTKEY_ELEMENT: ".HotKey-commonBlockForHotKey",

        // --- זיהוי אוגמנטים (Sub Items) ---
        // הכפתור שפותח את חלון האוגמנטים (נמצא במסך התותח)
        OPEN_AUGMENTS_BTN: ".DeviceButtonComponentStyle-deviceIcon",

        // כפתור חזרה (Back Arrow) - כדי לצאת ממסך האוגמנטים או ממסך הכרטיסיות ללובי
        BACK_BUTTON: ".BreadcrumbsComponentStyle-backButton",
        
        // כפתור סגירה של המוסך
        EXIT_GARAGE_BUTTON: ".BreadcrumbsComponentStyle-exitGameButton",

        // בתוך גריד האוגמנטים:
        AUGMENT_CELL: ".SkinCellStyle-widthHeight", // התא שעוטף כל אוגמנט
        AUGMENT_NAME: ".SkinCellStyle-nameDevices", // שם האוגמנט
        AUGMENT_EQUIPPED_ICON: ".SkinCellStyle-mountIcon", // האייקון שמופיע רק על מה שמצויד
        AUGMENT_IMAGE: "img", // תמונה של אוגמנט (בתוך התא)
        AUGMENT_DISCOUNT_CELL: ".SkinCellStyle-discountCell", // תא המחיר - אם ריק, האוגמנט נרכש
        
        // זיהוי מסך augments/skins/Shot color (להסתרת טאב קומבואים):
        AUGMENTS_SKINS_INDICATOR: ".Common-flexSpaceBetweenAlignStartColumn", // התפריט הצדדי שמאפיין את מסך augments/skins/Shot color
        
        // זיהוי מסך משימות (Missions) (להסתרת טאב קומבואים):
        MISSIONS_INDICATOR: ".QuestsComponentStyle-content", // הקונטיינר שמאפיין את מסך המשימות
        
        // זיהוי מסך קלאן (Clan) (להסתרת טאב קומבואים):
        CLAN_INDICATOR: ".ClanCommonStyle-content", // הקונטיינר שמאפיין את מסך הקלאן
        
        // זיהוי מסך חברים (Friends) (להסתרת טאב קומבואים):
        FRIENDS_INDICATOR: ".FriendListComponentStyle-containerFriends", // הקונטיינר שמאפיין את מסך החברים

        // --- זיהוי הגנה (Protection) ---
        PROTECTION_MODULE_NAME: ".GarageProtectionsComponentStyle-aboutDefence h1", // שם מודול ההגנה (Spider-0)
        PROTECTION_MOUNTED_RESIST: ".GarageProtectionsComponentStyle-mountedResist, .GarageProtectionsComponentStyle-mountedResistActive", // הגנה מצוידת (4 כאלה - כולל active)
        PROTECTION_RESISTANCE_ICON: ".CellResistanceComponentStyle-resistanceIconContainer img", // אייקון תותח בהגנה מצוידת
        PROTECTION_LIST_RESISTANCE_ICON: ".GarageItemComponentStyle-itemResistanceIcon", // אייקון תותח ברשימה

        // --- זיהוי צבעים (Paints) ---
        PAINT_NAME: ".PaintsCollectionComponentStyle-headlinePaint h1", // שם הצבע (White)
        PAINT_LIST_CONTAINER: ".ListItemsComponentStyle-itemsContainer", // קונטיינר של רשימת הצבעים

        // --- כפתור בלובי ---
        LOBBY_TURRETS_BLOCK: ".MountedItemsComponentStyleMobile-commonBlockForTurretsWeapon", // הדיב של התותחים בלובי
        LOBBY_HULLS_BLOCK: ".MountedItemsComponentStyleMobile-commonBlockForTurretsHulls", // הדיב של הגופים בלובי
        LOBBY_CONTAINER: ".MountedItemsStyle-containerBlockGarage", // הקונטיינר של כל הבלוקים
        LOBBY_ITEM_PREVIEW: ".MountedItemsStyle-itemPreview", // תמונות הפריטים בלובי
        LOBBY_TANK_PART_NAME: ".MountedItemsStyle-tankPartNameContainer", // כותרת הבלוקים בלובי
        LOBBY_DRONES_BLOCK: ".MountedItemsStyle-commonBlockDrone", // הדיב של הדרונים בלובי
        LOBBY_GRENADES_BLOCK: ".MountedItemsStyle-commonBlockGrenades" // הדיב של הרימונים בלובי
    };
})();