// ui/menu_injector.js

// הלוגיקה שמוסיפה את הכפתור ומטפלת בלחיצה עליו (ובלחיצה על כפתורים אחרים כדי לצאת)
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.MenuInjector = {
        injected: false,
        exitButtonsListenerAdded: false,
        comboTab: null,
        comboTabUnderline: null,

        inject() {
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (!menuContainer) return;

            // בדיקה האם הכפתור כבר קיים פיזית (למקרה שהמשתנה injected משקר)
            // אנחנו מחפשים כפתור שיש לו את הטקסט "COMBOS"
            const existingBtn = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");

            if (existingBtn) {
                this.injected = true;
                return;
            }

            // console.log("Tanki Combos: Injecting Menu Button...");

            const comboTab = document.createElement('div');
            comboTab.className = DOM.TAB_ITEM_CLASS;
            comboTab.innerText = "COMBOS";
            comboTab.style.order = "99";
            comboTab.style.cursor = "pointer";

            // שמירת reference לטאב שלנו
            this.comboTab = comboTab;

            // הוספת DIV פנימי שיהיה הקו התחתון שלנו (כמו במשחק)
            // ניתן לו ID ייחודי כדי שנוכל למצוא ולמחוק אותו בקלות
            const myUnderline = document.createElement('div');
            myUnderline.className = DOM.ACTIVE_UNDERLINE_CLASS;
            myUnderline.style.display = 'none'; // מוסתר בהתחלה
            comboTab.appendChild(myUnderline);
            this.comboTabUnderline = myUnderline;

            comboTab.onclick = (e) => {
                e.stopPropagation();
                this.safeActivateComboTab(comboTab, menuContainer, myUnderline);
            };

            menuContainer.addEventListener('click', (e) => {
                const clickedTab = e.target.closest(`.${DOM.TAB_ITEM_CLASS}`);
                if (clickedTab && clickedTab !== comboTab) {
                    this.deactivateComboTab(comboTab, menuContainer, myUnderline);
                    // עדכון נראות לאחר לחיצה על טאב אחר (למקרה שעברנו למסך augments/skins)
                    setTimeout(() => this.updateTabVisibility(), 50);
                }
            });

            menuContainer.appendChild(comboTab);
            this.injected = true;

            // עדכון נראות הטאב לפי המסך הנוכחי
            this.updateTabVisibility();

            // האזנה לכפתורים שיכולים לסגור את המוסך, לחזור ללובי, או לניווט (Q/E)
            // כדי להסתיר את התצוגה מיד כשלוחצים עליהם (לפני שה-DOM משתנה)
            this.addExitButtonsListener();

            // TODO: ניווט עם Q ו-E - מוער כרגע
            // אתחול TabNavigator עם reference לטאב שלנו
            // if (window.TankiComboManager.TabNavigator) {
            //     window.TankiComboManager.TabNavigator.init(comboTab, myUnderline);
            // }
        },

        // האזנה לכפתורים שיכולים לסגור את המוסך, לחזור ללובי, או לניווט (Q/E)
        // כדי להסיר את ההשפעה של הכרטיסיית קומבואים מיד לפני שה-DOM משתנה
        addExitButtonsListener() {
            if (this.exitButtonsListenerAdded) return;

            const hideComboView = () => {
                const ViewRenderer = window.TankiComboManager?.ViewRenderer;
                if (ViewRenderer && ViewRenderer.viewElement) {
                    const comboViewStyle = window.getComputedStyle(ViewRenderer.viewElement);
                    if (comboViewStyle.display !== 'none') {
                        ViewRenderer.hide();
                    }
                }
            };

            // פונקציה ל-Q ו-E - גם מסתירה וגם מכבה את הטאב
            const hideAndDeactivateComboTab = () => {
                const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                if (menuContainer && this.comboTab && this.comboTabUnderline) {
                    // אם הטאב שלנו פעיל, נכבה אותו
                    if (this.comboTab.classList.contains(DOM.ACTIVE_TAB_CLASS)) {
                        this.deactivateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
                    } else {
                        // אם לא, רק נסתיר את התצוגה
                        hideComboView();
                    }
                } else {
                    hideComboView();
                }
            };

            // כפתור חזרה
            const backButton = document.querySelector(DOM.BACK_BUTTON);
            if (backButton) {
                backButton.addEventListener('click', hideComboView);
            }

            // כפתור סגירה של המוסך
            const exitButton = document.querySelector(DOM.EXIT_GARAGE_BUTTON);
            if (exitButton) {
                exitButton.addEventListener('click', hideComboView);
            }

            // כפתורי Q ו-E ב-UI
            const qeContainer = document.querySelector(DOM.QE_BUTTONS_CONTAINER);
            if (qeContainer) {
                const buttons = qeContainer.querySelectorAll(`.${DOM.QE_BUTTON_CLASS}`);
                if (buttons.length >= 2) {
                    // הראשון הוא Q, השני הוא E
                    buttons[0].addEventListener('click', hideAndDeactivateComboTab);
                    buttons[1].addEventListener('click', hideAndDeactivateComboTab);
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
                if (keyCode === 'KeyQ' || keyCode === 81 || keyCode === 'KeyE' || keyCode === 69) {
                    hideAndDeactivateComboTab();
                }
            };

            document.addEventListener('keydown', keydownHandler);

            if (backButton || exitButton || qeContainer) {
                this.exitButtonsListenerAdded = true;
            }
        },

        // פונקציה בטוחה לפתיחת כרטיסיית הקומבואים - עוברת דרך Paints קודם
        // paintsDelay - זמן המתנה אחרי לחיצה על Paints (ברירת מחדל: 1ms)
        async safeActivateComboTab(myTab, container, myUnderline, paintsDelay = 1) {
            const Utils = window.TankiComboManager?.Utils;
            
            // קודם כל נכנסים לכרטיסיית Paints
            const allTabs = container.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
            let paintsTab = null;
            
            for (let tab of allTabs) {
                const tabText = tab.textContent ? tab.textContent.trim() : '';
                const tabTextLower = tabText.toLowerCase();
                // חיפוש טאב Paints
                if (tabTextLower === 'paints' || tabTextLower.includes('paint')) {
                    // ודא שזה לא הטאב שלנו (COMBOS)
                    if (!tabTextLower.includes('combo')) {
                        paintsTab = tab;
                        break;
                    }
                }
            }

            // אם מצאנו את טאב Paints, נלחץ עליו קודם
            if (paintsTab) {
                paintsTab.click();
                // המתנה לפי הפרמטר (1ms בדרך כלל, 150ms אחרי equipCombo)
                if (Utils && Utils.sleep) {
                    await Utils.sleep(paintsDelay);
                }
            }

            // אחר כך נפעיל את טאב הקומבואים
            this.activateComboTab(myTab, container, myUnderline);
            
            // וידוא נוסף שהסתרת אלמנטי Paints (רק אם יש המתנה ארוכה, כלומר אחרי equipCombo)
            if (paintsDelay > 1 && Utils && Utils.sleep) {
                await Utils.sleep(50);
                // הסתרה מפורשת של אלמנטי Paints
                const paintsElements = document.querySelectorAll(`
                    .PaintsCollectionComponentStyle-containerPaints,
                    .PaintsCollectionComponentStyle-blockPaints
                `);
                paintsElements.forEach(el => {
                    if (el) {
                        el.style.display = 'none';
                    }
                });
            }
        },

        activateComboTab(myTab, container, myUnderline) {
            // הסתרת הקו הירוק מכל שאר הטאבים
            const allTabs = container.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
            allTabs.forEach(tab => {
                tab.classList.remove(DOM.ACTIVE_TAB_CLASS);
                const underline = tab.querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                // אנחנו מסתירים רק אם זה לא הקו שלנו
                if (underline && underline !== myUnderline) {
                    underline.style.display = 'none';
                }
            });

            // הפעלת הטאב שלנו
            myTab.classList.add(DOM.ACTIVE_TAB_CLASS);
            myUnderline.style.display = 'block'; // הצגת הקו שלנו

            if (window.TankiComboManager.ViewRenderer) {
                window.TankiComboManager.ViewRenderer.show();
            }
        },

        deactivateComboTab(myTab, container, myUnderline) {
            // כיבוי הטאב שלנו
            myTab.classList.remove(DOM.ACTIVE_TAB_CLASS);
            myUnderline.style.display = 'none';

            // החזרת הקווים הירוקים לטאבים המקוריים
            // (הערה: המשחק ינהל בעצמו מי צריך להיות דלוק, אנחנו רק מבטלים את ה-none ששמנו)
            const allTabs = container.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
            allTabs.forEach(tab => {
                const underline = tab.querySelector(`.${DOM.ACTIVE_UNDERLINE_CLASS}`);
                if (underline && underline !== myUnderline) {
                    underline.style.display = ''; // נותן למשחק להחליט אם להציג או לא
                }
            });

            if (window.TankiComboManager.ViewRenderer) {
                window.TankiComboManager.ViewRenderer.hide();
            }
        },

        // בדיקה אם אנחנו במסך של augments/skins/Shot color (שם הטאב לא צריך להיראות)
        isOnAugmentsOrSkinsScreen() {
            // מסך האוגמנטים/סקינים מאופיין בנוכחות של אלמנט עם הקלאס Common-flexSpaceBetweenAlignStartColumn
            return !!document.querySelector(DOM.AUGMENTS_SKINS_INDICATOR);
        },

        // בדיקה אם אנחנו במסך המשימות (שם הטאב לא צריך להיראות)
        isOnMissionsScreen() {
            // מסך המשימות מאופיין בנוכחות של אלמנט עם הקלאס QuestsComponentStyle-content
            return !!document.querySelector(DOM.MISSIONS_INDICATOR);
        },

        // בדיקה אם אנחנו במסך הקלאן (שם הטאב לא צריך להיראות)
        isOnClanScreen() {
            // מסך הקלאן מאופיין בנוכחות של אלמנט עם הקלאס ClanCommonStyle-content
            return !!document.querySelector(DOM.CLAN_INDICATOR);
        },

        // בדיקה אם אנחנו במסך החברים (שם הטאב לא צריך להיראות)
        isOnFriendsScreen() {
            // מסך החברים מאופיין בנוכחות של אלמנט עם הקלאס FriendListComponentStyle-containerFriends
            return !!document.querySelector(DOM.FRIENDS_INDICATOR);
        },

        // עדכון נראות הטאב לפי המסך הנוכחי
        updateTabVisibility() {
            if (!this.comboTab) return;

            // הטאב צריך להיות מוסתר במסך augments/skins, במסך המשימות, במסך הקלאן, או במסך החברים
            const shouldHide = this.isOnAugmentsOrSkinsScreen()
                || this.isOnMissionsScreen()
                || this.isOnClanScreen()
                || this.isOnFriendsScreen();

            if (shouldHide) {
                // הסתרת הטאב
                this.comboTab.style.display = 'none';
                // אם הטאב פעיל, נכבה אותו
                if (this.comboTab.classList.contains(DOM.ACTIVE_TAB_CLASS)) {
                    const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                    if (menuContainer && this.comboTabUnderline) {
                        this.deactivateComboTab(this.comboTab, menuContainer, this.comboTabUnderline);
                    }
                }
            } else {
                // הצגת הטאב
                this.comboTab.style.display = '';
            }
        },

        // פונקציה לבדיקה אם הכפתור נמחק (קורה במעבר בין מסכים)
        checkAlive() {
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (menuContainer) {
                const existingBtn = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");
                if (!existingBtn) {
                    this.injected = false; // הכפתור נמחק, צריך להזריק שוב
                    this.exitButtonsListenerAdded = false; // צריך להוסיף מחדש את ה-listener
                    this.comboTab = null;
                    this.comboTabUnderline = null;
                    // TODO: ניווט עם Q ו-E - מוער כרגע
                    // if (window.TankiComboManager.TabNavigator) {
                    //     window.TankiComboManager.TabNavigator.reset();
                    // }
                } else {
                    // הכפתור קיים, נבדוק אם צריך להסתיר אותו
                    this.updateTabVisibility();
                }
            } else {
                this.injected = false; // התפריט נעלם, אז בטח גם הכפתור
                this.exitButtonsListenerAdded = false;
                this.comboTab = null;
                this.comboTabUnderline = null;
                // TODO: ניווט עם Q ו-E - מוער כרגע
                // if (window.TankiComboManager.TabNavigator) {
                //     window.TankiComboManager.TabNavigator.reset();
                // }
            }
        }
    };
})();