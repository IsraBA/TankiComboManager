// core/tab_navigator.js

// הלוגיקה לניווט בין הכרטיסיות באמצעות כפתורי Q ו-E
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
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
                e.preventDefault();
                e.stopPropagation();
                this.navigateToPreviousTab();
            };

            const handleE = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigateToNextTab();
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

                // רק אם לא לוחצים על input או textarea
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }

                // שימוש ב-key code במקום האות (יותר אמין, לא תלוי בשפה)
                const keyCode = e.code || e.keyCode;
                if (keyCode === 'KeyQ' || keyCode === 81) {
                    handleQ(e);
                } else if (keyCode === 'KeyE' || keyCode === 69) {
                    handleE(e);
                }
            };

            document.addEventListener('keydown', keydownHandler);

            if (qeContainer) {
                this.qeButtonsListenerAdded = true;
            }
        },

        // מעבר לכרטיסייה הקודמת
        navigateToPreviousTab() {
            const tabs = this.getAllTabsInOrder();
            if (tabs.length === 0) return;

            const currentIndex = this.getCurrentTabIndex(tabs);
            const previousIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;

            this.activateTab(tabs[previousIndex]);
        },

        // מעבר לכרטיסייה הבאה
        navigateToNextTab() {
            const tabs = this.getAllTabsInOrder();
            if (tabs.length === 0) return;

            const currentIndex = this.getCurrentTabIndex(tabs);
            const nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;

            this.activateTab(tabs[nextIndex]);
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

            return 0; // ברירת מחדל - הכרטיסייה הראשונה
        },

        // הפעלת כרטיסייה (כולל כרטיסיית הקומבואים)
        activateTab(tab) {
            if (!tab) return;

            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) return;

            const MenuInjector = window.TankiComboManager?.MenuInjector;
            if (!MenuInjector) return;

            // אם זה כרטיסיית הקומבואים שלנו
            if (tab === this.comboTab) {
                MenuInjector.activateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
            } else {
                // אם אנחנו על כרטיסיית הקומבואים, נכבה אותה קודם
                if (this.comboTab && this.comboTab.classList.contains(DOM.ACTIVE_TAB_CLASS)) {
                    MenuInjector.deactivateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
                }
                // הפעלת הכרטיסייה הרגילה
                tab.click();
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