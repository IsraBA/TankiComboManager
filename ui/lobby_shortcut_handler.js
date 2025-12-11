// ui/lobby_shortcut_handler.js

// הלוגיקה שמוסיפה קיצור דרך מהלובי הראשי - מקש C פותח את המוסך עם כרטיסיית הקומבואים
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const NavigationHelpers = window.TankiComboManager.NavigationHelpers;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.LobbyShortcutHandler = {
        listenerAdded: false,
        keydownHandler: null,

        // בדיקה אם אנחנו במסך הלובי הראשי (לא במוסך)
        isOnMainLobbyScreen() {
            // בלובי הראשי יש את הקונטיינר הראשי ואין את קונטיינר המוסך
            const hasMainScreen = !!document.querySelector(DOM.MAIN_SCREEN_CONTAINER);
            const hasGarageContainer = !!document.querySelector(DOM.GARAGE_WRAPPER);

            return hasMainScreen && !hasGarageContainer;
        },

        // בדיקה אם אנחנו במסך רלוונטי (מוסך או לובי)
        isRelevantScreen() {
            return !!document.querySelector(DOM.NOT_IN_GAME_CONTAINER);
        },

        // עדכון מצב ההאזנה - מחבר/מנתק לפי isRelevantScreen
        updateListenerState() {
            const shouldListen = this.isRelevantScreen() && this.isOnMainLobbyScreen();

            if (shouldListen && !this.listenerAdded) {
                // לחבר את ה-listener
                this.keydownHandler = this.handleKeyPress.bind(this);
                document.addEventListener('keydown', this.keydownHandler);
                this.listenerAdded = true;
                // console.log("[ComboManager] Lobby shortcut listener attached - Press C to open Combos");
            } else if (!shouldListen && this.listenerAdded) {
                // לנתק את ה-listener
                if (this.keydownHandler) {
                    document.removeEventListener('keydown', this.keydownHandler);
                    this.keydownHandler = null;
                }
                this.listenerAdded = false;
                // console.log("[ComboManager] Lobby shortcut listener detached");
            }
        },

        // טיפול בלחיצה על מקש
        async handleKeyPress(e) {
            // שימוש ב-key code לעצמאות משפה במקלדת
            const keyCode = e.code || e.keyCode;

            // רק אם לחצו על C (KeyC או 67)
            if (keyCode !== 'KeyC' && keyCode !== 67) return;

            // רק אם לא לוחצים על input, textarea, או אלמנט contenteditable
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                return;
            }

            // רק אם אנחנו במסך הלובי הראשי
            if (!this.isOnMainLobbyScreen()) return;

            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();

            // console.log("[ComboManager] C key pressed in main lobby - Navigating to Combos");

            // פתיחת המוסך וניווט לקומבואים
            await this.openGarageAndNavigateToCombos();
        },

        // פתיחת המוסך וניווט לכרטיסיית הקומבואים
        async openGarageAndNavigateToCombos() {
            // מציאת כפתור המוסך
            const garageButton = document.querySelector(DOM.GARAGE_BUTTON);
            if (!garageButton) {
                console.error("[ComboManager] Garage button not found!");
                return;
            }

            // לחיצה על כפתור המוסך - זה פותח את לובי המוסך
            const parentButton = garageButton.closest(DOM.MENU_ITEM_CONTAINER);
            if (parentButton) {
                parentButton.click();
            } else {
                garageButton.click();
            }

            // המתנה לטעינת לובי המוסך - עם MutationObserver
            const garageLoaded = await NavigationHelpers.waitForElement(DOM.LOBBY_CONTAINER);
            if (!garageLoaded) {
                console.error("[ComboManager] Timeout waiting for garage lobby to load");
                return;
            }

            // עכשיו נלחץ על התותחים כדי לפתוח את תפריט המוסך
            const turretsBlock = await NavigationHelpers.waitForElementAndClick(DOM.LOBBY_TURRETS_BLOCK);
            if (!turretsBlock) {
                console.error("[ComboManager] Turrets block not found");
                return;
            }

            // המתנה לטעינת תפריט המוסך - עם MutationObserver
            const menuContainer = await NavigationHelpers.waitForElement(DOM.MENU_CONTAINER);
            if (!menuContainer) {
                console.error("[ComboManager] Menu container not found");
                return;
            }

            // ניווט לכרטיסיית הקומבואים (הפונקציה המשותפת)
            await NavigationHelpers.navigateToCombosTab(menuContainer);
        }
    };
})();