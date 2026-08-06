// features/combos/core/randomizer/item_list_scanner.js

// סורק את כל הפריטים והאוגמנטים הנרכשים בכרטיסייה הנוכחית
(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  const Utils = window.TankiQoL.Utils;

  window.TankiQoL.ItemListScanner = {
    // סריקת כל הפריטים הנרכשים ברשימה הנוכחית (turrets/hulls/grenades/drones)
    // maxOnly — אם true, מחזיר רק פריטים ברמה מקסימלית (MAX)
    // requireQuantity — אם true, מסנן פריטים שאין להם כמות (רלוונטי לרימונים)
    scanAllPurchasedItems(maxOnly, requireQuantity) {
      const ComboLoader = window.TankiQoL.ComboLoader;
      const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);
      const purchased = [];

      for (const item of items) {
        // בדיקה אם הפריט נרכש
        if (!ComboLoader.isItemPurchased(item)) continue;

        // שליפת שם
        const descDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
        if (!descDevice) continue;
        const nameSpan = descDevice.querySelector("span");
        if (!nameSpan) continue;

        const fullName = nameSpan.innerText.trim();

        // סינון רק פריטים ברמת MAX אם נדרש — בודק את ה-h2 ברשימה
        if (maxOnly) {
          const levelEl = descDevice.querySelector("h2");
          const levelText = levelEl
            ? levelEl.innerText.trim().toUpperCase()
            : "";
          if (!levelText.includes("MAX")) continue;
        }

        // סינון רימונים ללא כמות (amountItemsScroll) — רימון שאין לו כמות לא ניתן לבחור
        if (requireQuantity) {
          const quantityEl = descDevice.querySelector(
            ".GarageItemComponentStyle-amountItemsScroll",
          );
          if (!quantityEl) continue;
        }

        const cleanName = Utils.cleanItemName(fullName);
        if (!cleanName) continue;

        // שליפת תמונה
        const image = Utils.findImageBySelector(DOM.ITEM_LIST_IMAGE, item);

        purchased.push({
          name: cleanName.toUpperCase(),
          image: image,
          element: item,
        });
      }

      return purchased;
    },

    // סריקת כל האוגמנטים הנרכשים במסך האוגמנטים הפתוח
    // legendaryOnly — אם true, מחזיר רק אוגמנטים מסוג legendary
    scanAllPurchasedAugments(legendaryOnly) {
      const ComboLoader = window.TankiQoL.ComboLoader;
      const cells = document.querySelectorAll(DOM.AUGMENT_CELL);
      const purchased = [];

      for (const cell of cells) {
        // בדיקה אם האוגמנט נרכש
        if (!ComboLoader.isAugmentPurchased(cell)) continue;

        // שליפת שם
        const nameEl = cell.querySelector(DOM.AUGMENT_NAME);
        if (!nameEl) continue;
        const name = nameEl.innerText.trim().toUpperCase();

        // סינון STANDARD SETTINGS — לא רלוונטי לרנדום
        if (name.includes("STANDARD")) continue;

        // סינון לפי רמת נדירות אם נדרש
        if (legendaryOnly) {
          const isLegendary = !!cell.querySelector(
            `.${DOM.AUGMENT_CATEGORY_LEGENDARY}`,
          );
          if (!isLegendary) continue;
        }

        // שליפת תמונה
        const imgEl = cell.querySelector(DOM.AUGMENT_IMAGE);
        const image = imgEl ? imgEl.src : null;

        purchased.push({
          name: name,
          image: image,
          element: cell,
        });
      }

      return purchased;
    },
  };
})();
