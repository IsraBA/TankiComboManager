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
            this.viewElement.style.display = 'none';

            // בניית ה-HTML הפנימי עם הכפתור החדש
            this.viewElement.innerHTML = `
                <h1>Combos Manager</h1>
                <div class="combo-controls">
                    <button id="add-combo-btn" class="tm-btn-primary">ADD CURRENT COMBO</button>
                </div>
                <div id="combos-list-container">
                    </div>
            `;

            garageWrapper.appendChild(this.viewElement);

            if (window.getComputedStyle(garageWrapper).position === 'static') {
                garageWrapper.style.position = 'relative';
            }

            // חיבור האירוע לכפתור
            this.bindEvents();
        },

        bindEvents() {
            const addBtn = this.viewElement.querySelector('#add-combo-btn');
            if (addBtn) {
                addBtn.onclick = () => {
                    if (window.TankiComboManager.ComboSaver) {
                        window.TankiComboManager.ComboSaver.saveCurrentCombo();
                    } else {
                        console.error("ComboSaver not loaded!");
                    }
                };
            }
        },

        show() {
            if (this.viewElement) this.viewElement.style.display = 'flex';

            // הסתרת כל האלמנטים המפריעים
            const elementsToHide = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToHide.forEach(el => el.style.display = 'none');
            const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
            if (tankCanvas) tankCanvas.style.display = 'none';
        },

        hide() {
            if (this.viewElement) this.viewElement.style.display = 'none';

            // החזרת כל האלמנטים שהסתרנו
            const elementsToRestore = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToRestore.forEach(el => el.style.display = '');
            const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
            if (tankCanvas) tankCanvas.style.display = '';
        }
    };
})();