// core/auto_navigator.js

// הלוגיקה לניווט אוטומטי לכרטיסיית הקומבואים בכניסה למוסך
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const NavigationHelpers = window.TankiComboManager.NavigationHelpers;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.AutoNavigator = {
        observer: null,
        observing: false,
        autoNavigateTriggered: false, // האם כבר ביצענו ניווט אוטומטי מאז ש-GARAGE_WRAPPER הופיע

        // ניווט אוטומטי לכרטיסיית הקומבואים - בדיוק כמו בלחיצה על הכפתור בלובי
        async navigateToCombos() {
            // בדיקת ההגדרה
            chrome.storage.local.get(['autoOpenCombosOnGarageEntry'], async (result) => {
                // אם אין ערך, ברירת מחדל היא true
                const shouldAutoOpen = result.autoOpenCombosOnGarageEntry !== false;

                if (!shouldAutoOpen) return;

                // סימון שביצענו את הניווט
                this.autoNavigateTriggered = true;

                // עכשיו נלחץ על התותחים כדי לפתוח את תפריט המוסך
                const turretsBlock = await NavigationHelpers.waitForElementAndClick(DOM.LOBBY_TURRETS_BLOCK);
                if (!turretsBlock) {
                    console.error("[ComboManager] Turrets block not found");
                    // אם לא מצאנו את התותחים, נאפס את הדגל וננסה שוב בפעם הבאה
                    this.autoNavigateTriggered = false;
                    return;
                }

                // המתנה לטעינת תפריט המוסך - עם MutationObserver
                const menuContainer = await NavigationHelpers.waitForElement(DOM.MENU_CONTAINER);
                if (!menuContainer) {
                    console.error("[ComboManager] Menu container not found");
                    // אם לא מצאנו את תפריט המוסך, נאפס את הדגל וננסה שוב בפעם הבאה
                    this.autoNavigateTriggered = false;
                    return;
                }

                // ניווט לכרטיסיית הקומבואים (הפונקציה המשותפת)
                await NavigationHelpers.navigateToCombosTab(menuContainer);
            });
        },

        // בדיקה וטיפול בכניסה למוסך - נקרא מה-MutationObserver
        checkAndNavigate() {
            const garageWrapper = document.querySelector(DOM.GARAGE_WRAPPER);

            // אם GARAGE_WRAPPER קיים ולא ביצענו את הניווט עדיין
            if (garageWrapper && !this.autoNavigateTriggered) {
                // נווט לכרטיסיית הקומבואים (בדיוק כמו בלחיצה על הכפתור בלובי)
                this.navigateToCombos();
            }

            // אם GARAGE_WRAPPER נעלם (יצאנו מהמוסך), נאפס את הדגל
            if (!garageWrapper && this.autoNavigateTriggered) {
                this.autoNavigateTriggered = false;
            }
        },

        // התחלת ה-MutationObserver - נקרא מ-runInitLogic
        start() {
            // אם ה-observer כבר רץ, לא צריך להתחיל אותו שוב
            if (this.observing) return;

            // בדיקה ראשונית
            this.checkAndNavigate();

            // יצירת MutationObserver שצופה בשינויים ב-DOM
            this.observer = new MutationObserver(() => {
                this.checkAndNavigate();
            });

            // התחלת הצפייה ב-document.body עם כל השינויים
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.observing = true;
        },

        // עצירת ה-MutationObserver - נקרא כשיוצאים מהמסך הרלוונטי
        stop() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.observing = false;
            this.autoNavigateTriggered = false;
        }
    };
})();

