// ui/menu_injector.js

// הלוגיקה שמוסיפה את הכפתור ומטפלת בלחיצה עליו (ובלחיצה על כפתורים אחרים כדי לצאת)
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.MenuInjector = {
        injected: false,

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

            console.log("Tanki Combos: Injecting Menu Button...");

            const comboTab = document.createElement('div');
            comboTab.className = DOM.TAB_ITEM_CLASS;
            comboTab.innerText = "COMBOS";
            comboTab.style.order = "99";
            comboTab.style.cursor = "pointer";

            // הוספת DIV פנימי שיהיה הקו התחתון שלנו (כמו במשחק)
            // ניתן לו ID ייחודי כדי שנוכל למצוא ולמחוק אותו בקלות
            const myUnderline = document.createElement('div');
            myUnderline.className = DOM.ACTIVE_UNDERLINE_CLASS;
            myUnderline.style.display = 'none'; // מוסתר בהתחלה
            comboTab.appendChild(myUnderline);

            comboTab.onclick = (e) => {
                e.stopPropagation();
                this.activateComboTab(comboTab, menuContainer, myUnderline);
            };

            menuContainer.addEventListener('click', (e) => {
                const clickedTab = e.target.closest(`.${DOM.TAB_ITEM_CLASS}`);
                if (clickedTab && clickedTab !== comboTab) {
                    this.deactivateComboTab(comboTab, menuContainer, myUnderline);
                }
            });

            menuContainer.appendChild(comboTab);
            this.injected = true;
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

        // פונקציה לבדיקה אם הכפתור נמחק (קורה במעבר בין מסכים)
        checkAlive() {
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            if (menuContainer) {
                const existingBtn = Array.from(menuContainer.children).find(el => el.innerText === "COMBOS");
                if (!existingBtn) {
                    this.injected = false; // הכפתור נמחק, צריך להזריק שוב
                }
            } else {
                this.injected = false; // התפריט נעלם, אז בטח גם הכפתור
            }
        }
    };
})();