// ui/view_renderer.js

// קובץ זה אחראי ליצור את ה-HTML של הכרטיסיית קומבואים ולנהל את ההסתרה/הצגה.
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ViewRenderer = {
        viewElement: null,

        async init() {
            const garageMenuContainer = document.querySelector(DOM.GARAGE_MENU_CONTAINER);
            if (!garageMenuContainer) return;

            // בדיקה אם האלמנט כבר קיים
            let existingElement = document.getElementById('combo-manager-view');
            
            if (existingElement) {
                this.viewElement = existingElement;
                // בדיקה אם האלמנט נמצא במקום הנכון (אחרי garageMenuContainer)
                const parent = garageMenuContainer.parentNode;
                if (parent && existingElement.parentNode === parent) {
                    // בדיקה אם הסדר נכון
                    const menuIndex = Array.from(parent.children).indexOf(garageMenuContainer);
                    const viewIndex = Array.from(parent.children).indexOf(existingElement);
                    if (viewIndex <= menuIndex) {
                        // האלמנט לא במקום הנכון - הזז אותו
                        garageMenuContainer.insertAdjacentElement('afterend', existingElement);
                    }
                } else {
                    // האלמנט לא באותו parent - הזז אותו
                    garageMenuContainer.insertAdjacentElement('afterend', existingElement);
                }
                return;
            }

            this.viewElement = document.createElement('div');
            this.viewElement.id = 'combo-manager-view';
            this.viewElement.className = 'cme_container';
            this.viewElement.style.display = 'none';

            // טעינת ה-HTML מהקובץ הנפרד
            const htmlContent = await this.loadViewHTML();
            this.viewElement.innerHTML = htmlContent;

            // הוספת ה-viewElement מתחת ל-garageMenuContainer
            garageMenuContainer.insertAdjacentElement('afterend', this.viewElement);

            // חיבור האירועים
            this.bindEvents();
        },

        // טעינת ה-HTML מהקובץ הנפרד
        async loadViewHTML() {
            const htmlUrl = chrome.runtime.getURL('ui/combo_view_base.html');
            const response = await fetch(htmlUrl);
            if (!response.ok) {
                throw new Error(`Failed to load HTML: ${response.status}`);
            }
            return await response.text();
        },

        bindEvents() {
            const saveBtn = this.viewElement.querySelector('#cme_save-combo-btn');
            if (saveBtn) {
                saveBtn.onclick = async () => {
                    if (window.TankiComboManager.ComboSaver) {
                        await window.TankiComboManager.ComboSaver.saveCurrentCombo();
                        // רענון התצוגה אחרי השמירה
                        this.loadAndRenderCombos();
                    } else {
                        console.error("ComboSaver not loaded!");
                    }
                };
            }
        },

        // טעינת הקומבואים מ-storage והצגתם
        loadAndRenderCombos() {
            chrome.storage.local.get(['savedCombos'], (result) => {
                const combos = result.savedCombos || [];
                this.renderCombos(combos);
            });
        },

        // רינדור הקומבואים ל-DOM
        renderCombos(combos) {
            const container = this.viewElement.querySelector('#combos-grid-container');
            if (!container) return;

            // ניקוי התוכן הקיים
            container.innerHTML = '';

            if (combos.length === 0) {
                container.innerHTML = `
                    <div class="cme_empty-state">
                        <h2>No saved combos yet</h2>
                        <p>Click "SAVE CURRENT" to save your first combo!</p>
                    </div>
                `;
                return;
            }

            // יצירת column לכל קומבו (כל קומבו ב-column נפרד)
            combos.forEach((combo, index) => {
                // יצירת column חדש לכל קומבו
                const currentColumn = document.createElement('div');
                currentColumn.className = 'cme_flexSpaceBetweenAlignCenterColumn';
                container.appendChild(currentColumn);

                // יצירת כרטיס קומבו באמצעות ComboCardRenderer
                if (window.TankiComboManager.ComboCardRenderer) {
                    const comboCard = window.TankiComboManager.ComboCardRenderer.createComboCard(combo, index, this);
                    currentColumn.appendChild(comboCard);
                } else {
                    console.error("ComboCardRenderer not loaded!");
                }
            });
        },

        // מחיקת קומבו
        deleteCombo(comboId) {
            if (!confirm('Are you sure you want to delete this combo?')) return;

            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                combos = combos.filter(c => c.id !== comboId);

                chrome.storage.local.set({ savedCombos: combos }, () => {
                    console.log(`[ComboManager] Combo ${comboId} deleted`);
                    this.loadAndRenderCombos();
                });
            });
        },

        // שינוי שם קומבו
        renameCombo(comboId, newName) {
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                const combo = combos.find(c => c.id === comboId);
                if (combo) {
                    combo.name = newName;
                    chrome.storage.local.set({ savedCombos: combos }, () => {
                        console.log(`[ComboManager] Combo ${comboId} renamed to "${newName}"`);
                    });
                }
            });
        },

        // הצטיידות בקומבו
        async equipCombo(combo) {
            console.log('[ComboManager] Equipping combo:', combo);
            if (window.TankiComboManager.ComboLoader) {
                await window.TankiComboManager.ComboLoader.equipCombo(combo);
            } else {
                console.error("ComboLoader not loaded!");
            }
        },

        show() {
            if (this.viewElement) {
                this.viewElement.style.display = 'flex';

                // טעינת הקומבואים כשמציגים את התצוגה
                this.loadAndRenderCombos();
            }

            // הסתרת כל האלמנטים המפריעים
            const elementsToHide = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToHide.forEach(el => el.style.display = 'none');
        },

        hide() {
            if (this.viewElement) this.viewElement.style.display = 'none';

            // החזרת כל האלמנטים שהסתרנו
            const elementsToRestore = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
            elementsToRestore.forEach(el => el.style.display = '');
            const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
            if (tankCanvas) {
                tankCanvas.style.removeProperty('display');
            }
        }
    };
})();