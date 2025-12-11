// core/navigation_helpers.js

// פונקציות עזר משותפות לניווט לכרטיסיית הקומבואים
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.NavigationHelpers = {
        // המתנה לאלמנט שיופיע ב-DOM עם MutationObserver
        waitForElement(selector, timeout = 10000) {
            return new Promise((resolve) => {
                // בדיקה ראשונית - אולי האלמנט כבר קיים
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                // אם לא קיים, נחכה עם MutationObserver
                const observer = new MutationObserver((mutations, obs) => {
                    const foundElement = document.querySelector(selector);
                    if (foundElement) {
                        obs.disconnect();
                        clearTimeout(timeoutId);
                        resolve(foundElement);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // timeout למקרה שהאלמנט לא יופיע
                const timeoutId = setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
        },

        // המתנה לאלמנט ולחיצה עליו
        async waitForElementAndClick(selector, timeout = 10000) {
            const element = await this.waitForElement(selector, timeout);
            if (element) {
                element.click();
                return element;
            }
            return null;
        },

        // המתנה ש-MenuInjector יהיה מוכן עם הכרטיסייה
        waitForComboTab(timeout = 10000) {
            return new Promise((resolve) => {
                // בדיקה ראשונית
                const MenuInjector = window.TankiComboManager?.MenuInjector;
                if (MenuInjector && MenuInjector.comboTab && MenuInjector.comboTabUnderline) {
                    resolve(true);
                    return;
                }

                // אם לא מוכן, נחכה עם MutationObserver
                const observer = new MutationObserver((mutations, obs) => {
                    const updatedMenuInjector = window.TankiComboManager?.MenuInjector;
                    if (updatedMenuInjector && updatedMenuInjector.comboTab && updatedMenuInjector.comboTabUnderline) {
                        obs.disconnect();
                        clearTimeout(timeoutId);
                        resolve(true);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // timeout
                const timeoutId = setTimeout(() => {
                    observer.disconnect();
                    resolve(false);
                }, timeout);
            });
        },

        // המתנה ש-ViewRenderer יהיה מוכן עם האלמנט שלו
        waitForViewRenderer(timeout = 10000) {
            return new Promise((resolve) => {
                // בדיקה ראשונית - האם ViewRenderer קיים ויש לו viewElement
                const ViewRenderer = window.TankiComboManager?.ViewRenderer;
                if (ViewRenderer && ViewRenderer.viewElement) {
                    // בדיקה שהאלמנט קיים ב-DOM
                    if (document.contains(ViewRenderer.viewElement)) {
                        resolve(true);
                        return;
                    }
                }

                // אם לא מוכן, נחכה עם MutationObserver
                const observer = new MutationObserver((mutations, obs) => {
                    const updatedViewRenderer = window.TankiComboManager?.ViewRenderer;
                    if (updatedViewRenderer && updatedViewRenderer.viewElement) {
                        // בדיקה שהאלמנט קיים ב-DOM
                        if (document.contains(updatedViewRenderer.viewElement)) {
                            obs.disconnect();
                            clearTimeout(timeoutId);
                            resolve(true);
                        }
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // timeout
                const timeoutId = setTimeout(() => {
                    observer.disconnect();
                    resolve(false);
                }, timeout);
            });
        },

        // פונקציה משותפת לניווט לכרטיסיית הקומבואים
        // מניחה שכבר יש menuContainer (כי זה נקרא אחרי שכבר לחצנו על תותחים)
        async navigateToCombosTab(menuContainer) {
            // המתנה ש-MenuInjector יהיה מוכן עם הכרטיסייה
            const comboTabReady = await this.waitForComboTab();
            if (!comboTabReady) {
                console.error("[ComboManager] Combo tab not ready");
                return false;
            }

            // וידוא ש-ViewRenderer מוכן - אם לא, נאתחל אותו
            const ViewRenderer = window.TankiComboManager?.ViewRenderer;
            if (ViewRenderer) {
                // אם האלמנט עדיין לא קיים, נאתחל אותו
                if (!ViewRenderer.viewElement) {
                    await ViewRenderer.init();
                }
            }

            // המתנה ש-ViewRenderer יהיה מוכן עם האלמנט שלו
            const viewRendererReady = await this.waitForViewRenderer();
            if (!viewRendererReady) {
                console.error("[ComboManager] ViewRenderer not ready");
                return false;
            }

            // המתנה ש-#combos-grid-container יהיה קיים (כדי לוודא שה-HTML נטען)
            const combosContainer = await this.waitForElement('#combos-grid-container');
            if (!combosContainer) {
                console.error("[ComboManager] Combos container not found");
                return false;
            }

            // ניווט לכרטיסיית הקומבואים
            const MenuInjector = window.TankiComboManager?.MenuInjector;
            if (MenuInjector && MenuInjector.comboTab && MenuInjector.comboTabUnderline) {
                MenuInjector.activateComboTab(
                    MenuInjector.comboTab,
                    menuContainer,
                    MenuInjector.comboTabUnderline
                );

                // וידוא ש-loadAndRenderCombos רץ - אם show() לא קרא לו, נקרא לו מפורשות
                if (ViewRenderer && ViewRenderer.loadAndRenderCombos) {
                    // המתנה קצרה כדי לוודא ש-show() סיים
                    await new Promise(resolve => setTimeout(resolve, 100));
                    ViewRenderer.loadAndRenderCombos();
                }
                return true;
            }
            return false;
        }
    };
})();

