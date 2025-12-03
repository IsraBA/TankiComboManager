// main.js

// המנצח על התזמורת - מוודא שהמשחק נטען ואז מפעיל הכל
(function () {
    'use strict';

    console.log("Tanki Combo Manager: Main Script Loaded");

    function waitForGameLoad() {
        // נחכה ש-document.body יהיה זמין
        function initObserver() {
            if (!document.body) {
                // אם body עדיין לא קיים, נחכה קצת וננסה שוב
                setTimeout(initObserver, 100);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                const DOM = window.TankiComboManager?.DOM;
                const ViewRenderer = window.TankiComboManager?.ViewRenderer;
                const MenuInjector = window.TankiComboManager?.MenuInjector;

                if (!DOM || !MenuInjector || !ViewRenderer) return;

                // בדיקה האם הכפתור נעלם (כדי לאפס את הדגל injected)
                MenuInjector.checkAlive();

                ViewRenderer.init();
                
                const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
                if (menuContainer) {
                    // ננסה לאתחל בכל פעם שמזהים שינוי ב-DOM
                    // הפונקציות בפנים חכמות מספיק כדי לא לעשות כפילויות
                    MenuInjector.inject();
                } else {
                    // גם כשאין menuContainer, נוסיף את ה-listeners לכפתורי היציאה
                    MenuInjector.addExitButtonsListener();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // הפעלה
        initObserver();
    }

    // הפעלה
    waitForGameLoad();
})();