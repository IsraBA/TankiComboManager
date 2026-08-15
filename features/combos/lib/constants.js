// features/combos/lib/constants.js

// כאן אנחנו מגדירים את ה"כתובות" ב-HTML
// משתמשים ב-IIFE כדי ליצור namespace גלובלי
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.DOM = {
    NOT_IN_GAME_CONTAINER: ".-container",
    // --- ניווט ראשי ---
    GARAGE_MENU_CONTAINER: ".GarageMenuComponentStyle-garageMenuContainer",
    MENU_CONTAINER:
      ".GarageMenuComponentStyle-garageMenuContainer .MenuComponentStyle-battleTitleCommunity > div",

    TAB_ITEM_CLASS: "MenuComponentStyle-mainMenuItem",
    ACTIVE_TAB_CLASS: "-activeMenu",
    ACTIVE_UNDERLINE_CLASS: "-menuItemActive",

    // כפתורי ניווט Q ו-E
    QE_BUTTONS_CONTAINER: ".MenuComponentStyle-blockButtonsQECommunity",
    QE_BUTTON_CLASS: "-buttonQE",

    // --- הסתרה ---
    GARAGE_WRAPPER: ".GarageCommonStyle-garageContainer",
    TANK_PREVIEW_CANVAS: "#tankPreviewCanvas",
    POSITION_CONTENT: ".GarageCommonStyle-positionContent",
    // מארחי תצוגת הטנק: הקונטיינרים שבתוכם יושב #tankPreviewContainer —
    // האלמנט שהמשחק מודד כדי למקם את מודל הטנק המסתובב. יש אחד לכל סוג
    // טאב, ומי מהם קיים תלוי באיזו כרטיסייה היה המשתמש לפני שעבר לקומבואים.
    //
    // **אסור להסתיר אותם ב-display:none.** אב מוסתר נותן לתצוגה תיבה בגודל
    // אפס, ואז כל מדידה מחדש — שינוי גודל חלון, או כל שינוי state כמו
    // החלפת צבע — מעלימה את המודל עד שיוצאים וחוזרים לכרטיסייה. זו גם
    // הסיבה שהגרירה לסיבוב מעולם לא עבדה אצלנו: אלמנט מוסתר לא מקבל
    // אירועי עכבר. במקום זה מוציאים אותם מהזרימה (ראה keepTankPreviewAlive)
    // ומסתירים את **התוכן שלצד התצוגה** דרך ELEMENTS_TO_HIDE.
    PREVIEW_HOSTS: `
            .GarageCommonStyle-positionContent,
            .PaintsCollectionComponentStyle-containerPaints
        `,

    // התצוגה עצמה, בתוך המארח
    TANK_PREVIEW: "#tankPreviewContainer, .GarageComponentStyle-tankPreview",

    // מה שמוסתר בזמן שכרטיסיית הקומבואים פתוחה — **מחוץ** למארחי התצוגה.
    // מה שבתוכם מוסתר לבד ע"י keepTankPreviewAlive, שמסתיר כל מה שאינו על
    // המסלול אל התצוגה; אין צורך לנקוב שם בשמות מחלקות.
    ELEMENTS_TO_HIDE: `
            .GarageSuppliesPreviewComponentStyle-view,
            .GarageCommonStyle-positionContentAlteration,
            .TanksPartComponentStyle-amountItems,
            .GarageGrenadePreviewComponentStyle-view
        `,

    // --- זיהוי פריטים (תותח/גוף וכו') ---
    // הטקסט שמכיל את שם הפריט (למשל Hammer Mk5-0)
    ITEM_NAME_TEXT: ".ItemDescriptionComponentStyle-nameItem span",

    // הכפתור שמראה שפריט מצויד (Equipped) במסך ראשי
    ITEM_IS_EQUIPPED_BTN: ".-buttonEstablished",

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
    HOTKEY_ELEMENT: ".-commonBlockForHotKey",

    // --- זיהוי אוגמנטים (Sub Items) ---
    // הכפתור שפותח את חלון האוגמנטים (נמצא במסך התותח)
    OPEN_AUGMENTS_BTN: ".DeviceButtonComponentStyle-deviceIcon",

    // כפתור חזרה (Back Arrow) - כדי לצאת ממסך האוגמנטים או ממסך הכרטיסיות ללובי
    BACK_BUTTON: ".BreadcrumbsComponentStyle-backButton",

    // כפתור סגירה של המוסך
    EXIT_GARAGE_BUTTON: ".BreadcrumbsComponentStyle-exitGameButton",

    // זיהוי שפה - הטקסט בראש המוסך
    GARAGE_ROOT_TITLE: ".BreadcrumbsComponentStyle-rootTitle span",

    // בתוך גריד האוגמנטים:
    AUGMENT_CELL: ".SkinsAndAlterationsStyle-SkinsVerticalComponent > div", // התא שעוטף כל אוגמנט (ילד ישיר של רשימת האוגמנטים)
    AUGMENT_NAME: ".SkinCellStyle-nameDevices", // שם האוגמנט
    AUGMENT_EQUIPPED_ICON: ".SkinCellStyle-mountIcon", // האייקון שמופיע רק על מה שמצויד
    AUGMENT_IMAGE: "img", // תמונה של אוגמנט (בתוך התא)
    AUGMENT_DISCOUNT_CELL: ".SkinCellStyle-discountCell", // תא המחיר - אם ריק, האוגמנט נרכש

    // זיהוי מסך augments/skins/Shot color (להסתרת טאב קומבואים):
    AUGMENTS_SKINS_INDICATOR: ".-flexSpaceBetweenAlignStartColumn", // התפריט הצדדי שמאפיין את מסך augments/skins/Shot color

    // זיהוי מסך משימות (Missions) (להסתרת טאב קומבואים):
    MISSIONS_INDICATOR: ".QuestsComponentStyle-content", // הקונטיינר שמאפיין את מסך המשימות

    // זיהוי מסך קלאן (Clan) (להסתרת טאב קומבואים):
    CLAN_INDICATOR:
      ".ClanCommonStyle-center, .ClanCommonStyle-content, .ClanInfoComponentStyle-containerParametersClan, .FriendListComponentStyle-containerMembers", // הקונטיינר שמאפיין את מסך הקלאן (כולל טאב Members)

    // זיהוי מסך חברים (Friends) (להסתרת טאב קומבואים):
    FRIENDS_INDICATOR: ".FriendListComponentStyle-containerFriends", // הקונטיינר שמאפיין את מסך החברים

    // זיהוי מסך יצירת באטל (Battle creation) (להסתרת טאב קומבואים):
    BATTLE_CREATION_INDICATOR: ".BattleCreateComponentStyle-mainContainer", // הקונטיינר שמאפיין את מסך יצירת באטל

    // --- זיהוי הגנה (Protection) ---
    PROTECTION_MODULE_NAME: ".GarageProtectionsComponentStyle-aboutDefence h1", // שם מודול ההגנה (Spider-0)
    PROTECTION_MOUNTED_RESIST:
      ".GarageProtectionsComponentStyle-mountedResist, .GarageProtectionsComponentStyle-mountedResistActive", // הגנה מצוידת (4 כאלה - כולל active)
    PROTECTION_RESISTANCE_ICON:
      ".CellResistanceComponentStyle-resistanceIconContainer img", // אייקון תותח בהגנה מצוידת
    PROTECTION_LIST_RESISTANCE_ICON:
      ".GarageItemComponentStyle-itemResistanceIcon", // אייקון תותח ברשימה

    // --- זיהוי צבעים (Paints) ---
    PAINT_NAME: ".PaintsCollectionComponentStyle-headlinePaint h1", // שם הצבע (White)
    PAINT_LIST_CONTAINER: ".ListItemsComponentStyle-itemsContainer", // קונטיינר של רשימת הצבעים

    // --- כפתור בלובי ---
    LOBBY_TURRETS_BLOCK: ".-commonBlockForTurretsWeapon", // הדיב של התותחים בלובי
    LOBBY_HULLS_BLOCK: ".-commonBlockForTurretsHulls", // הדיב של הגופים בלובי
    LOBBY_CONTAINER: ".MountedItemsStyle-containerBlockGarage", // הקונטיינר של כל הבלוקים
    LOBBY_ITEM_PREVIEW: ".MountedItemsStyle-itemPreview", // תמונות הפריטים בלובי
    LOBBY_TANK_PART_NAME: ".MountedItemsStyle-tankPartNameContainer", // כותרת הבלוקים בלובי
    LOBBY_DRONES_BLOCK: ".MountedItemsStyle-commonBlockDrone", // הדיב של הדרונים בלובי
    LOBBY_GRENADES_BLOCK: ".MountedItemsStyle-commonBlockGrenades", // הדיב של הרימונים בלובי

    // --- מסך הלובי הראשי ---
    MAIN_SCREEN_CONTAINER: ".MainScreenComponentStyle-containerPanel", // הקונטיינר של המסך הראשי
    GARAGE_BUTTON:
      ".PrimaryMenuItemComponentStyle-menuItemContainer .PrimaryMenuItemComponentStyle-itemLiGarage", // כפתור המוסך במסך הראשי
    MENU_ITEM_CONTAINER: ".PrimaryMenuItemComponentStyle-menuItemContainer", // קונטיינר של פריט בתפריט הראשי

    // --- רנדומייזר: זיהוי רמת נדירות אוגמנטים ---
    AUGMENT_CATEGORY_LEGENDARY:
      "SkinCellComponentStyle-gradientCategoryDevices-LEGENDARY",
    AUGMENT_CATEGORY_EPIC:
      "SkinCellComponentStyle-gradientCategoryDevices-EPIC",
    AUGMENT_CATEGORY_COMMON:
      "SkinCellComponentStyle-gradientCategoryDevices-COMMON",
  };
})();
