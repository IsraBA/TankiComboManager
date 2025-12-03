// ui/view_renderer.js

// קובץ זה אחראי ליצור את ה-HTML של הכרטיסיית קומבואים ולנהל את ההסתרה/הצגה.
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ViewRenderer = {
        viewElement: null,

        async init() {
            if (document.getElementById('combo-manager-view')) {
                this.viewElement = document.getElementById('combo-manager-view');
                return;
            }

            const garageWrapper = document.querySelector(DOM.GARAGE_WRAPPER);
            if (!garageWrapper) return;

            this.viewElement = document.createElement('div');
            this.viewElement.id = 'combo-manager-view';
            this.viewElement.className = 'combo-manager-main';
            this.viewElement.style.display = 'none';

            // טעינת ה-HTML מהקובץ הנפרד
            try {
                const htmlContent = await this.loadViewHTML();
                this.viewElement.innerHTML = htmlContent;
            } catch (error) {
                console.error('[ComboManager] Error loading view HTML:', error);
                // fallback - טעינת HTML מובנה
                this.viewElement.innerHTML = this.createViewHTMLFallback();
            }

            garageWrapper.appendChild(this.viewElement);

            if (window.getComputedStyle(garageWrapper).position === 'static') {
                garageWrapper.style.position = 'relative';
            }

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

        // Fallback - HTML מובנה במקרה של כשל בטעינה
        createViewHTMLFallback() {
            return `
                <div class="cme_container">
                    <div class="cme_commonBlockForDescriptionAndButton">
                        <div id="cme_tankPreviewContainer" class="cme_tankPreview"></div>
                        <div class="cme_descriptionBlockCollection">
                            <div class="cme_commonBlockDescriptionCollection cme_animatedBlurredLeftBlock">
                                <div class="cme_headline">
                                    <h1>Combo Manager</h1>
                                    <h3 class="cme_styleCategory">Manage your saved combos</h3>
                                </div>
                            </div>
                        </div>
                        <div class="cme_tankPartUpgrades cme_animatedBlurredRightBlock">
                            <div id="cme_save-combo-btn" class="cme_commonBlockButton cme_bigActionButton" style="cursor: pointer;">
                                <div class="cme_flexCenterAlignCenter cme_flexCenterAlignCenter_inner">
                                    <div class="cme_backgroundImage"></div>
                                </div>
                                <div class="cme_flexEndAlignEnd">
                                    <span class="Font-bold">SAVE CURRENT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="cme_blockPaints">
                        <div class="cme_itemsListContainer cme_appearFromBottom">
                            <div class="cme_arrowLeft cme_flexCenterAlignCenter" style="opacity: 0;">
                                <img src="/play/static/images/arrow.2552fe80.svg">
                            </div>
                            <div class="cme_arrowRight cme_flexCenterAlignCenter" style="opacity: 0;">
                                <img src="/play/static/images/arrow.2552fe80.svg">
                            </div>
                            <div id="combos-grid-container" class="cme_itemsContainer">
                                <!-- כאן יוזרקו הקומבואים דינמית -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
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

            // יצירת columns (כל column מכיל 2 קומבואים)
            let currentColumn = null;
            combos.forEach((combo, index) => {
                // יצירת column חדש כל 2 קומבואים
                if (index % 2 === 0) {
                    currentColumn = document.createElement('div');
                    currentColumn.className = 'cme_flexSpaceBetweenAlignCenterColumn';
                    container.appendChild(currentColumn);
                }

                // יצירת כרטיס קומבו
                const comboCard = this.createComboCard(combo, index);
                currentColumn.appendChild(comboCard);
            });
        },

        // יצירת כרטיס קומבו בודד - בסגנון כרטיסי הצבעים
        createComboCard(combo, index) {
            const card = document.createElement('div');
            card.className = 'cme_itemStyle';
            card.dataset.comboId = combo.id;

            // פירוק המידע מהקומבו
            const data = combo.data;

            card.innerHTML = `
                <!-- Header - שם קומבו וכפתורים -->
                <div class="cme_flexSpaceBetweenAlignStretch cme_combo-header">
                    <div class="cme_combo-name-container">
                        <h3 contenteditable="true" class="cme_combo-name">${combo.name}</h3>
                        <span class="cme_combo-date">${combo.date || ''}</span>
                    </div>
                    <div class="cme_combo-actions">
                        <button class="cme_action-btn cme_delete-btn" title="Delete">×</button>
                    </div>
                </div>

                <!-- Preview - תצוגת הפריטים -->
                <div class="cme_flexCenterAlignStretch cme_combo-content">
                    <div class="cme_itemPreview cme_combo-preview">
                        ${this.createComboPreviewHTML(data)}
                    </div>
                </div>

                <!-- Footer - מידע נוסף -->
                <div class="cme_flexEndAlignCenter cme_whiteSpaceNoWrap cme_combo-footer">
                    <span class="cme_combo-id">#${combo.id}</span>
                </div>

                <!-- Info Tooltip (מופיע ב-hover) -->
                <div class="cme_combo-info">
                    ${this.createComboInfoHTML(data)}
                </div>
            `;

            // חיבור אירועים
            this.bindComboCardEvents(card, combo);

            return card;
        },

        // יצירת HTML לתצוגה מקדימה של הקומבו
        createComboPreviewHTML(data) {
            // הצגת התמונות העיקריות (turret, hull, paint)
            const items = [];

            if (data.turret?.imageUrl) {
                items.push(`<img src="${data.turret.imageUrl}" class="cme_combo-item-img" alt="${data.turret.name}">`);
            }
            if (data.hull?.imageUrl) {
                items.push(`<img src="${data.hull.imageUrl}" class="cme_combo-item-img" alt="${data.hull.name}">`);
            }
            if (data.paint?.imageUrl) {
                items.push(`<img src="${data.paint.imageUrl}" class="cme_combo-item-img-small" alt="${data.paint.name}">`);
            }

            // אם אין פריטים, נציג placeholder
            if (items.length === 0) {
                return '<span style="color: rgba(255,255,255,0.5); font-size: 0.75em;">Empty Combo</span>';
            }

            return items.join('');
        },

        // יצירת HTML למידע המפורט (נראה ב-hover)
        createComboInfoHTML(data) {
            const rows = [];

            if (data.turret?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Turret:</span>
                        <span class="cme_info-value">${data.turret.name}</span>
                    </div>
                `);
                if (data.turretAugment?.name) {
                    rows.push(`
                        <div class="cme_info-row">
                            <span class="cme_info-label">└ Augment:</span>
                            <span class="cme_info-augment">${data.turretAugment.name}</span>
                        </div>
                    `);
                }
            }

            if (data.hull?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Hull:</span>
                        <span class="cme_info-value">${data.hull.name}</span>
                    </div>
                `);
                if (data.hullAugment?.name) {
                    rows.push(`
                        <div class="cme_info-row">
                            <span class="cme_info-label">└ Augment:</span>
                            <span class="cme_info-augment">${data.hullAugment.name}</span>
                        </div>
                    `);
                }
            }

            if (data.paint?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Paint:</span>
                        <span class="cme_info-value">${data.paint.name}</span>
                    </div>
                `);
            }

            if (data.protection?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Protection:</span>
                        <span class="cme_info-value">${data.protection.name}</span>
                    </div>
                `);
            }

            if (data.drone?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Drone:</span>
                        <span class="cme_info-value">${data.drone.name}</span>
                    </div>
                `);
            }

            if (data.grenade?.name) {
                rows.push(`
                    <div class="cme_info-row">
                        <span class="cme_info-label">Grenade:</span>
                        <span class="cme_info-value">${data.grenade.name}</span>
                    </div>
                `);
            }

            return rows.join('');
        },

        // חיבור אירועים לכרטיס קומבו
        bindComboCardEvents(card, combo) {
            // כפתור מחיקה
            const deleteBtn = card.querySelector('.cme_delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteCombo(combo.id);
                };
            }

            // לחיצה על הכרטיס עצמו - equip (בעתיד)
            card.onclick = (e) => {
                // אם לחצו על כפתור, לא נעשה כלום
                if (e.target.closest('.cme_delete-btn') || e.target.closest('.cme_combo-name')) {
                    return;
                }
                this.equipCombo(combo);
            };

            // עריכת שם
            const nameElement = card.querySelector('.cme_combo-name');
            if (nameElement) {
                nameElement.onblur = (e) => {
                    const newName = e.target.textContent.trim();
                    if (newName && newName !== combo.name) {
                        this.renameCombo(combo.id, newName);
                    }
                };
                nameElement.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                };
                nameElement.onclick = (e) => {
                    e.stopPropagation();
                };
            }
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

        // הצטיידות בקומבו (TODO: להוסיף לוגיקה)
        equipCombo(combo) {
            console.log('[ComboManager] Equipping combo:', combo);
            alert('Equip functionality coming soon!');
            // TODO: להוסיף לוגיקה להצטיידות בקומבו
        },

        show() {
            if (this.viewElement) {
                this.viewElement.style.display = 'block';

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