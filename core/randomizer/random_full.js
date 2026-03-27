// core/randomizer/random_full.js

// אלגוריתם רנדומיזציה מלא — בוחר פריט אקראי בכל קטגוריה
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.RandomFull = {

        // ביצוע רנדום מלא לפי ההגדרות
        async execute(settings) {
            const categories = settings.categories;
            const advanced = settings.advanced;
            const TabNavigator = window.TankiComboManager.TabNavigator;
            const ComboLoader = window.TankiComboManager.ComboLoader;
            const ItemListScanner = window.TankiComboManager.ItemListScanner;

            // רשימת שמות לסינון לפי קטגוריה
            const excludeNames = {};
            if (advanced.excludeBrutus) excludeNames['drones'] = ['BRUTUS'];
            if (advanced.excludeTsarGrenade) excludeNames['grenades'] = ['TSAR'];

            // רשימת קטגוריות בסדר הביצוע
            const sequence = [
                { key: 'turrets', tabKey: 'Turrets', augmentKey: 'turretAugment', itemType: 'Turret' },
                { key: 'hulls', tabKey: 'Hulls', augmentKey: 'hullAugment', itemType: 'Hull' },
                { key: 'grenades', tabKey: 'Grenades', augmentKey: null, itemType: 'Grenade' },
                { key: 'drones', tabKey: 'Drones', augmentKey: null, itemType: 'Drone' }
            ];

            try {
                // מעבר על כל קטגוריה
                for (const cat of sequence) {
                    if (!categories[cat.key]) continue;
                    await this._equipRandomInCategory(cat, categories, advanced, excludeNames[cat.key] || [], TabNavigator, ComboLoader, ItemListScanner);
                }

                // חזרה לכרטיסיית COMBOS
                await this._navigateBackToCombos();
            } catch (error) {
                console.error('[ComboManager] Randomizer error:', error);
            }
        },

        // הצטיידות בפריט אקראי בקטגוריה מסוימת
        async _equipRandomInCategory(cat, categories, advanced, excludeList, TabNavigator, ComboLoader, ItemListScanner) {
            // ניווט לכרטיסייה
            await TabNavigator.navigateToTab(cat.tabKey);

            // סריקת כל הפריטים הנרכשים (עם סינון MAX אם נדרש, ועם דרישת כמות לרימונים)
            const requireQuantity = cat.key === 'grenades';
            let items = ItemListScanner.scanAllPurchasedItems(advanced.maxEquipmentOnly, requireQuantity);

            // סינון פריטים מוחרגים (Brutus, Tsar וכו')
            if (excludeList.length > 0) {
                items = items.filter(item => {
                    return !excludeList.some(excluded => item.name.includes(excluded));
                });
            }
            if (items.length === 0) return;

            // בחירת פריט אקראי
            let randomIdx = Math.floor(Math.random() * items.length);
            const selectedItem = items[randomIdx];

            // לחיצה על הפריט והצטיידות
            await this._clickAndEquipItem(selectedItem, ComboLoader);

            // אוגמנטים — רק ל-turrets/hulls, אם מופעל בקטגוריות
            if (cat.augmentKey && categories[cat.augmentKey]) {
                await this._equipRandomAugment(items, randomIdx, advanced.legendaryOnly, ComboLoader, ItemListScanner);
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

        // הצטיידות באוגמנט אקראי — עם retry אם אין אוגמנט מתאים
        async _equipRandomAugment(allItems, currentIdx, legendaryOnly, ComboLoader, ItemListScanner) {
            const triedIndices = new Set();

            while (triedIndices.size < allItems.length) {
                triedIndices.add(currentIdx);

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

                    // יציאה ממסך אוגמנטים
                    const backBtn = document.querySelector(DOM.BACK_BUTTON);
                    if (backBtn) {
                        backBtn.click();
                        await Utils.sleep(50);
                    }
                    return; // מצאנו אוגמנט — סיום
                }

                // אין אוגמנטים מתאימים — חזרה וניסיון עם פריט אחר
                const backBtn = document.querySelector(DOM.BACK_BUTTON);
                if (backBtn) {
                    backBtn.click();
                    await Utils.sleep(50);
                }

                // מציאת אינדקסים שעוד לא ניסינו
                const untried = [];
                for (let i = 0; i < allItems.length; i++) {
                    if (!triedIndices.has(i)) untried.push(i);
                }
                if (untried.length === 0) return; // ניסינו הכל — מוותרים

                // בחירת פריט אחר
                currentIdx = untried[Math.floor(Math.random() * untried.length)];
                await this._clickAndEquipItem(allItems[currentIdx], ComboLoader);
            }
        },



        // ניווט חזרה לכרטיסיית COMBOS עם delay ארוך יותר (כמו אחרי equipCombo)
        // כדי שאלמנטי Paints ירנדרו לפני שנסתיר אותם
        async _navigateBackToCombos() {
            const MenuInjector = window.TankiComboManager.MenuInjector;
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);

            if (menuContainer && MenuInjector && MenuInjector.comboTab && MenuInjector.comboTabUnderline) {
                await MenuInjector.safeActivateComboTab(
                    MenuInjector.comboTab,
                    menuContainer,
                    MenuInjector.comboTabUnderline,
                    150
                );
            }
        }
    };
})();
