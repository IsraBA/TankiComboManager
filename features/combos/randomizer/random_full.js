// features/combos/randomizer/random_full.js

// אלגוריתם רנדומיזציה מלא — בוחר פריט אקראי בכל קטגוריה
(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  const Utils = window.TankiQoL.Utils;

  window.TankiQoL.RandomFull = {
    // ביצוע רנדום מלא לפי ההגדרות — מחזיר אובייקט data מלא של הקומבו הסופי
    async execute(settings) {
      const categories = settings.categories;
      const advanced = settings.advanced;
      const TabNavigator = window.TankiQoL.TabNavigator;
      const ComboLoader = window.TankiQoL.ComboLoader;
      const ItemListScanner = window.TankiQoL.ItemListScanner;
      const BaseItemScanner = window.TankiQoL.BaseItemScanner;
      const AugmentScanner = window.TankiQoL.AugmentScanner;
      const ProtectionScanner = window.TankiQoL.ProtectionScanner;

      // אובייקט תוצאה — ייאסף תוך כדי מעבר על הכרטיסיות
      const result = {};

      // רשימת שמות לסינון לפי קטגוריה (בשפה הנוכחית)
      const excludeNames = {};
      const LanguageManager = window.TankiQoL.LanguageManager;
      const lang = LanguageManager.getCurrentLanguage();
      const brutusName = lang.itemNames?.brutus || "BRUTUS";
      const tsarName = lang.itemNames?.tsar || "TSAR";
      if (advanced.excludeBrutus) excludeNames["drones"] = [brutusName];
      if (advanced.excludeTsarGrenade) excludeNames["grenades"] = [tsarName];

      // רשימת קטגוריות בסדר הביצוע
      const sequence = [
        {
          key: "turrets",
          tabKey: "Turrets",
          augmentKey: "turretAugment",
          resultKey: "turret",
          augResultKey: "turretAugment",
          hasAugment: true,
        },

        {
          key: "hulls",
          tabKey: "Hulls",
          augmentKey: "hullAugment",
          resultKey: "hull",
          augResultKey: "hullAugment",
          hasAugment: true,
        },

        {
          key: "grenades",
          tabKey: "Grenades",
          augmentKey: null,
          resultKey: "grenade",
          augResultKey: null,
          hasAugment: false,
          cleanNameFn: null,
        },
        {
          key: "drones",
          tabKey: "Drones",
          augmentKey: null,
          resultKey: "drone",
          augResultKey: null,
          hasAugment: false,
          cleanNameFn: BaseItemScanner.cleanDroneName.bind(BaseItemScanner),
        },
      ];

      try {
        for (const cat of sequence) {
          // ניווט לכרטיסייה — תמיד, גם אם הקטגוריה כבויה (כדי לסרוק)
          await TabNavigator.navigateToTab(cat.tabKey);

          if (categories[cat.key]) {
            // קטגוריה מופעלת — מצטיידים בפריט רנדומלי
            await this._equipRandomItem(
              cat,
              advanced,
              excludeNames[cat.key] || [],
              ComboLoader,
              ItemListScanner,
            );
          }

          // אוגמנט — אם מופעל, גם אם הפריט הראשי כבוי (מחליף אוגמנט על הפריט הנוכחי)
          if (cat.hasAugment && cat.augmentKey && categories[cat.augmentKey]) {
            await this._equipRandomAugmentForCurrentItem(
              advanced.legendaryOnly,
              ComboLoader,
              ItemListScanner,
            );
          }

          // סריקת הפריט המצויד כרגע (בין אם שינינו אותו או לא)
          result[cat.resultKey] = BaseItemScanner.scanItem(
            cat.cleanNameFn || null,
          );

          // סריקת אוגמנט (אם הקטגוריה תומכת באוגמנטים)
          if (cat.hasAugment && AugmentScanner) {
            result[cat.augResultKey] = await AugmentScanner.scanAugment();
          }
        }

        // סריקת הגנות — תמיד סורקים (אין רנדום להגנות)
        await TabNavigator.navigateToTab("Protection");
        result.protection = ProtectionScanner
          ? ProtectionScanner.scanProtection()
          : null;

        // חזרה לכרטיסיית COMBOS
        await this._navigateBackToCombos();

        return result;
      } catch (error) {
        console.error("[ComboManager] Randomizer error:", error);
      }

      return null;
    },

    // הצטיידות בפריט אקראי בקטגוריה מסוימת (כבר נמצאים בכרטיסייה הנכונה)
    async _equipRandomItem(
      cat,
      advanced,
      excludeList,
      ComboLoader,
      ItemListScanner,
    ) {
      // סריקת כל הפריטים הנרכשים (עם סינון MAX אם נדרש, ועם דרישת כמות לרימונים)
      const requireQuantity = cat.key === "grenades";
      let items = ItemListScanner.scanAllPurchasedItems(
        advanced.maxEquipmentOnly,
        requireQuantity,
      );

      // סינון פריטים מוחרגים (Brutus, Tsar וכו')
      if (excludeList.length > 0) {
        items = items.filter((item) => {
          return !excludeList.some((excluded) => item.name.includes(excluded));
        });
      }
      if (items.length === 0) return;

      // בחירת פריט אקראי
      const randomIdx = Math.floor(Math.random() * items.length);
      await this._clickAndEquipItem(items[randomIdx], ComboLoader);
    },

    // הצטיידות באוגמנט אקראי לפריט הנוכחי (בלי retry עם פריטים אחרים)
    async _equipRandomAugmentForCurrentItem(
      legendaryOnly,
      ComboLoader,
      ItemListScanner,
    ) {
      // פתיחת מסך אוגמנטים
      const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
      if (!openBtn) return;
      openBtn.click();
      await Utils.sleep(50);

      // סריקת אוגמנטים נרכשים
      const augments = ItemListScanner.scanAllPurchasedAugments(legendaryOnly);

      if (augments.length > 0) {
        // בחירת אוגמנט אקראי
        const randomAug = augments[Math.floor(Math.random() * augments.length)];
        await ComboLoader.clickWithCoordinates(randomAug.element);
        await Utils.sleep(50);
        await ComboLoader.clickEquipButton();
        await Utils.sleep(50);
      }

      // יציאה ממסך אוגמנטים
      const backBtn = document.querySelector(DOM.BACK_BUTTON);
      if (backBtn) {
        backBtn.click();
        await Utils.sleep(50);
      }
    },

    // לחיצה על פריט והצטיידות בו
    async _clickAndEquipItem(item, ComboLoader) {
      const img = item.element.querySelector(DOM.ITEM_LIST_IMAGE);
      if (img) {
        await ComboLoader.clickWithCoordinates(img);
      } else {
        item.element.click();
      }
      await Utils.sleep(50);
      await ComboLoader.clickEquipButton();
    },

    // ניווט חזרה לכרטיסיית COMBOS עם delay ארוך יותר (כמו אחרי equipCombo)
    // כדי שאלמנטי Paints ירנדרו לפני שנסתיר אותם
    async _navigateBackToCombos() {
      const MenuInjector = window.TankiQoL.MenuInjector;
      const menuContainer = document.querySelector(DOM.MENU_CONTAINER);

      if (
        menuContainer &&
        MenuInjector &&
        MenuInjector.comboTab &&
        MenuInjector.comboTabUnderline
      ) {
        await MenuInjector.safeActivateComboTab(
          MenuInjector.comboTab,
          menuContainer,
          MenuInjector.comboTabUnderline,
          150,
        );
      }
    },
  };
})();
