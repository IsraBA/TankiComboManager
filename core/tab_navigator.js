// core/tab_navigator.js

// הלוגיקה לניווט בין הכרטיסיות באמצעות כפתורי Q ו-E
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.TabNavigator = {
        qeButtonsListenerAdded: false,

        init(comboTab, comboTabUnderline) {
            this.comboTab = comboTab;
            this.comboTabUnderline = comboTabUnderline;
            this.addQEButtonsListener();
        },

        // האזנה לכפתורי Q ו-E לניווט בין הכרטיסיות
        addQEButtonsListener() {
            if (this.qeButtonsListenerAdded) return;

            const handleQ = (e) => {
                const tabs = this.getAllTabsInOrder();
                const ViewRenderer = window.TankiComboManager?.ViewRenderer;
                const isOnComboTab = ViewRenderer && ViewRenderer.viewElement &&
                    window.getComputedStyle(ViewRenderer.viewElement).display !== 'none';

                // אם אנחנו על כרטיסיית הקומבואים, עוברים לכרטיסייה האחרונה
                if (isOnComboTab) {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalTabs = this.getOriginalTabsInOrder();
                    if (originalTabs.length > 0) {
                        this.activateTab(originalTabs[originalTabs.length - 1]);
                    }
                    return;
                }

                // רק אם אנחנו בכרטיסייה הראשונה (Turrets), עוברים ל-COMBOS
                // בכל מקרה אחר (כולל Paints), נותן למשחק לטפל בזה
                if (this.isOnFirstOriginalTab(tabs)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.activateTab(this.comboTab);
                }
                // אחרת, נותן למשחק לטפל בזה (לא מונעים כלום)
            };

            const handleE = (e) => {
                const tabs = this.getAllTabsInOrder();
                const ViewRenderer = window.TankiComboManager?.ViewRenderer;
                const isOnComboTab = ViewRenderer && ViewRenderer.viewElement &&
                    window.getComputedStyle(ViewRenderer.viewElement).display !== 'none';

                // אם אנחנו על כרטיסיית הקומבואים, עוברים לכרטיסייה הראשונה
                if (isOnComboTab) {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalTabs = this.getOriginalTabsInOrder();
                    if (originalTabs.length > 0) {
                        this.activateTab(originalTabs[0]);
                    }
                    return;
                }

                // אם אנחנו בכרטיסייה האחרונה, עוברים ל-COMBOS
                if (this.isOnLastOriginalTab(tabs)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.activateTab(this.comboTab);
                }
                // אחרת, נותן למשחק לטפל בזה
            };

            // האזנה לכפתורים - נמצאים בתוך הקונטיינר
            const qeContainer = document.querySelector(DOM.QE_BUTTONS_CONTAINER);
            if (qeContainer) {
                const buttons = qeContainer.querySelectorAll(`.${DOM.QE_BUTTON_CLASS}`);
                if (buttons.length >= 2) {
                    // הראשון הוא Q, השני הוא E
                    buttons[0].addEventListener('click', handleQ);
                    buttons[1].addEventListener('click', handleE);
                }
            }

            // האזנה למקשים במקלדת - רק אם אנחנו במוסך
            const keydownHandler = (e) => {
                const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                if (!menuContainer) return;

                // רק אם לא לוחצים על input, textarea, או אלמנט contenteditable
                if (e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'TEXTAREA' ||
                    e.target.isContentEditable) {
                    return;
                }

                // שימוש ב-key code במקום האות (יותר אמין, לא תלוי בשפה)
                const keyCode = e.code || e.keyCode;
                if (keyCode === 'KeyQ' || keyCode === 81) {
                    // קוראים לאותה פונקציה כמו הכפתורים ב-UI
                    handleQ(e);
                } else if (keyCode === 'KeyE' || keyCode === 69) {
                    // קוראים לאותה פונקציה כמו הכפתורים ב-UI
                    handleE(e);
                }
            };

            // האזנה ל-keydown עם capture phase כדי לתפוס את האירוע לפני שהמשחק מטפל בו
            document.addEventListener('keydown', keydownHandler, true);

            if (qeContainer) {
                this.qeButtonsListenerAdded = true;
            }
        },

        // קבלת כל הכרטיסיות בסדר הנכון (לפי הסדר ב-DOM)
        getAllTabsInOrder() {
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) return [];

            const tabs = Array.from(menuContainer.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`));

            // מיון לפי הסדר המקורי ב-DOM
            return tabs.sort((a, b) => {
                const position = a.compareDocumentPosition(b);
                if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return -1;
                } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
                    return 1;
                }
                return 0;
            });
        },

        // קבלת כל הכרטיסיות המקוריות (בלי COMBOS) בסדר הנכון
        getOriginalTabsInOrder() {
            const allTabs = this.getAllTabsInOrder();
            // מסננים את COMBOS
            return allTabs.filter(tab => tab !== this.comboTab);
        },

        // בדיקה אם הכרטיסייה הנוכחית היא האחרונה (Paints)
        isOnLastOriginalTab(tabs) {
            const originalTabs = this.getOriginalTabsInOrder();
            if (originalTabs.length === 0) return false;

            const currentIndex = this.getCurrentTabIndex(tabs);
            // אם לא מצאנו כרטיסייה פעילה, זה לא הכרטיסייה האחרונה
            if (currentIndex === -1) return false;

            const currentTab = tabs[currentIndex];

            // אם אנחנו על COMBOS, זה לא הכרטיסייה האחרונה
            if (currentTab === this.comboTab) return false;

            // נבדוק אם הכרטיסייה הנוכחית היא האחרונה ברשימה המקורית
            const lastOriginalTab = originalTabs[originalTabs.length - 1];
            return currentTab === lastOriginalTab;
        },

        // בדיקה אם הכרטיסייה הנוכחית היא הראשונה (Turrets)
        isOnFirstOriginalTab(tabs) {
            const originalTabs = this.getOriginalTabsInOrder();
            if (originalTabs.length === 0) return false;

            const currentIndex = this.getCurrentTabIndex(tabs);
            // אם לא מצאנו כרטיסייה פעילה, זה לא הכרטיסייה הראשונה
            if (currentIndex === -1) return false;

            const currentTab = tabs[currentIndex];

            // אם אנחנו על COMBOS, זה לא הכרטיסייה הראשונה
            if (currentTab === this.comboTab) return false;

            // נבדוק אם הכרטיסייה הנוכחית היא הראשונה ברשימה המקורית
            const firstOriginalTab = originalTabs[0];
            return currentTab === firstOriginalTab;
        },

        // מציאת האינדקס של הכרטיסייה הפעילה
        getCurrentTabIndex(tabs) {
            // קודם נבדוק אם כרטיסיית הקומבואים פעילה (לפי ViewRenderer)
            // זה חשוב כי כשעוברים לכרטיסיית הקומבואים, הכרטיסייה הקודמת עדיין מסומנת כ-active
            const ViewRenderer = window.TankiComboManager?.ViewRenderer;
            if (ViewRenderer && ViewRenderer.viewElement && this.comboTab) {
                const comboViewStyle = window.getComputedStyle(ViewRenderer.viewElement);
                if (comboViewStyle.display !== 'none') {
                    const index = tabs.indexOf(this.comboTab);
                    if (index !== -1) {
                        return index;
                    }
                }
            }

            // אחרת, נחפש את הכרטיסייה הפעילה לפי class
            // אבל נדלג על COMBOS אם היא לא באמת פעילה (לפי ViewRenderer)
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i] === this.comboTab) {
                    // אם זה COMBOS, נדלג עליו כי כבר בדקנו אותו למעלה
                    continue;
                }
                if (tabs[i].classList.contains(DOM.ACTIVE_TAB_CLASS)) {
                    return i;
                }
            }

            // אם לא מצאנו כרטיסייה פעילה, נחפש לפי underline (הקו הירוק)
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i] === this.comboTab) {
                    continue;
                }
                const underline = tabs[i].querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                if (underline && underline.style.display !== 'none') {
                    return i;
                }
            }

            // אם עדיין לא מצאנו, נחזיר -1 (לא נמצא)
            return -1;
        },

        // הפעלת כרטיסייה (כולל כרטיסיית הקומבואים)
        async activateTab(tab) {
            if (!tab) return;

            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) return;

            const MenuInjector = window.TankiComboManager?.MenuInjector;
            if (!MenuInjector) return;

            // אם זה כרטיסיית הקומבואים שלנו
            if (tab === this.comboTab) {
                await MenuInjector.safeActivateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
            } else {
                // אם אנחנו על כרטיסיית הקומבואים, נכבה אותה קודם
                if (this.comboTab && this.comboTab.classList.contains(DOM.ACTIVE_TAB_CLASS)) {
                    MenuInjector.deactivateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
                }
                // הסרת ה-class מכל הטאבים (לפני החזרתו לטאב הנכון)
                const allTabs = menuContainer.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
                allTabs.forEach(t => t.classList.remove(DOM.ACTIVE_TAB_CLASS));
                // הפעלת הכרטיסייה הרגילה - וידוא שה-class מוחזר
                tab.classList.add(DOM.ACTIVE_TAB_CLASS);
                tab.click();
            }
        },

        // מעבר לטאב לפי טקסט (מקבל מפתח כמו 'Turrets', 'Hulls' וכו')
        async navigateToTab(tabKey) {
            const LanguageManager = window.TankiComboManager.LanguageManager;
            const tabName = LanguageManager ? LanguageManager.getTabName(tabKey) : tabKey;
            
            const tabs = document.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
            let targetTab = null;

            for (let tab of tabs) {
                // שימוש ב-textContent במקום innerText - יותר אמין
                const tabText = tab.textContent ? tab.textContent.trim() : '';
                const tabTextLower = tabText.toLowerCase();
                const searchNameLower = tabName.toLowerCase();

                // בדיקה מדויקת קודם, ואז בדיקה חלקית
                if (tabTextLower === searchNameLower || tabTextLower.includes(searchNameLower)) {
                    // ודא שזה לא הטאב שלנו (COMBOS)
                    if (!tabTextLower.includes('combo')) {
                        targetTab = tab;
                        break;
                    }
                }
            }

            if (targetTab) {
                // אם אנחנו על טאב COMBOS, נסתיר אותו קודם
                if (window.TankiComboManager.ViewRenderer && window.TankiComboManager.ViewRenderer.viewElement) {
                    const comboView = window.TankiComboManager.ViewRenderer.viewElement;
                    if (comboView.style.display !== 'none') {
                        window.TankiComboManager.ViewRenderer.hide();
                    }
                }

                targetTab.click();
                // המתנה קריטית לטעינת ה-HTML של הטאב
                await Utils.sleep(60);
            } else {
                const allTabTexts = Array.from(tabs).map(t => t.textContent?.trim() || '').join(', ');
                // console.error(`[ComboManager] Tab ${tabName} (key: ${tabKey}) not found! Available tabs: ${allTabTexts}`);
            }
        },

        // איפוס (כשהכפתור נמחק)
        reset() {
            this.qeButtonsListenerAdded = false;
            this.comboTab = null;
            this.comboTabUnderline = null;
        }
    };
})();