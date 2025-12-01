// ui/view_renderer.js

// קובץ זה אחראי ליצור את ה-HTML של הכרטיסיית קומבואים ולנהל את ההסתרה/הצגה.
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ViewRenderer = {
        viewElement: null,

        init() {
            if (document.getElementById('combo-manager-view')) {
                this.viewElement = document.getElementById('combo-manager-view');
                return;
            }

            const garageWrapper = document.querySelector(DOM.GARAGE_WRAPPER);
            if (!garageWrapper) return;

            this.viewElement = document.createElement('div');
            this.viewElement.id = 'combo-manager-view';
            this.viewElement.innerHTML = `<h1>Combos Manager - Ready</h1>`;
            this.viewElement.style.display = 'none';

            garageWrapper.appendChild(this.viewElement);

            if (window.getComputedStyle(garageWrapper).position === 'static') {
                garageWrapper.style.position = 'relative';
            }
        },

        show() {
            if (this.viewElement) this.viewElement.style.display = 'flex';

            // הסתרת כל האלמנטים המפריעים
            const elementsToHide = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToHide.forEach(el => {
                el.style.display = 'none';
            });

            // הסתרת הטנק
            const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
            if (tankCanvas) tankCanvas.style.display = 'none';
        },

        hide() {
            if (this.viewElement) this.viewElement.style.display = 'none';

            // החזרת כל האלמנטים שהסתרנו
            const elementsToRestore = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToRestore.forEach(el => {
                // אנחנו מסירים את ה-inline style שהוספנו
                // ונותנים למשחק (או ל-CSS המקורי) להחליט אם להציג אותם או לא
                el.style.display = '';
            });

            // החזרת הטנק
            const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
            if (tankCanvas) tankCanvas.style.display = '';
        }
    };
})();