// main.js

// המנצח על התזמורת - מוודא שהמשחק נטען ואז מפעיל הכל
(function () {
    'use strict';

    console.log("Tanki Combo Manager: Main Script Loaded");

    function waitForGameLoad() {
        function initIntegration() {
            if (!document.body) {
                setTimeout(initIntegration, 100);
                return;
            }

            const manager = window.TankiComboManager || {};
            const DOM = manager.DOM;
            const MenuInjector = manager.MenuInjector;
            const ViewRenderer = manager.ViewRenderer;
            const LobbyButtonInjector = manager.LobbyButtonInjector;

            // נחכה עד שכל החלקים הקריטיים יהיו מוכנים
            if (!DOM || !MenuInjector || !ViewRenderer) {
                setTimeout(initIntegration, 100);
                return;
            }

            let observer = null;
            let observing = false;

            // האם אנחנו במסך שבו התוסף רלוונטי? (מוסך או לובי)
            function isRelevantScreen() {
                return !!document.querySelector(DOM.NOT_IN_GAME_CONTAINER);
            }

            // הלוגיקה העיקרית של התוסף
            function runInitLogic() {
                if (!DOM || !MenuInjector || !ViewRenderer) return;

                // רק אם אנחנו במסך רלוונטי (מוסך / לובי)
                if (!isRelevantScreen()) return;

                // בדיקה האם הכפתור נעלם (כדי לאפס את הדגל injected)
                MenuInjector.checkAlive();

                // אתחול ה-View
                ViewRenderer.init();

                const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                if (menuContainer) {
                    // הפונקציות בפנים כבר מגנות מפני כפילויות
                    MenuInjector.inject();
                } else {
                    // גם כשאין menuContainer, נוסיף את ה-listeners לכפתורי היציאה
                    MenuInjector.addExitButtonsListener();
                }

                // הזרקת כפתור בלובי (אם קיים LobbyButtonInjector)
                if (LobbyButtonInjector) {
                    LobbyButtonInjector.checkAlive();
                    LobbyButtonInjector.inject();
                }
            }

            // ה-observer שמקשיב לשינויים במוסך/לובי
            observer = new MutationObserver(() => {
                // בלי debounce – רצים מייד על כל שינוי,
                // אבל רק אם isRelevantScreen() מחזיר true
                runInitLogic();
            });

            // פונקציה שמחליטה אם לחבר/לנתק את ה-observer
            function updateObserverState() {
                const shouldObserve = isRelevantScreen();

                // נכנסנו למוסך/לובי → לחבר observer + להריץ לוגיקה מייד
                if (shouldObserve && !observing) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    observing = true;
                    runInitLogic();
                }

                // יצאנו למסך משחק (או למסך לא רלוונטי) → לנתק observer
                if (!shouldObserve && observing) {
                    observer.disconnect();
                    observing = false;
                }
            }

            // בדיקה ראשונית
            updateObserverState();

            // נבדוק כל 300ms אם עברנו למסך אחר (לובי/מוסך/משחק)
            setInterval(updateObserverState, 300);
        }

        initIntegration();
    }

    waitForGameLoad();
})();