// ui/view_renderer.js

// קובץ זה אחראי ליצור את ה-HTML של הכרטיסיית קומבואים ולנהל את ההסתרה/הצגה.
(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ViewRenderer = {
        viewElement: null,
        enterKeyHandler: null,
        dragHandlerInitialized: false,

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
                // אתחול drag handler אם עדיין לא אותחל
                if (!this.dragHandlerInitialized) {
                    this.initDragHandler();
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

            // אתחול drag handler
            this.initDragHandler();

            // וידוא שלכל הקומבואים יש order
            this.ensureAllCombosHaveOrder();
        },

        // המתנה לאלמנט בתוך ה-view (למשל #combos-grid-container) בלי sleep
        waitForElementInView(selector, timeout = 5000) {
            return new Promise((resolve) => {
                if (!this.viewElement) {
                    resolve(null);
                    return;
                }

                const existing = this.viewElement.querySelector(selector);
                if (existing) {
                    resolve(existing);
                    return;
                }

                const observer = new MutationObserver((mutations, obs) => {
                    if (!this.viewElement) return;
                    const found = this.viewElement.querySelector(selector);
                    if (found) {
                        obs.disconnect();
                        clearTimeout(timeoutId);
                        resolve(found);
                    }
                });

                observer.observe(this.viewElement, { childList: true, subtree: true });

                const timeoutId = setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
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

        // וידוא שלכל הקומבואים יש order
        ensureAllCombosHaveOrder() {
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                let needsUpdate = false;

                // בדיקה אם יש קומבואים בלי order
                combos.forEach((combo, index) => {
                    if (combo.order === undefined) {
                        combo.order = index;
                        needsUpdate = true;
                    }
                });

                // שמירה רק אם היה צורך בעדכון
                if (needsUpdate) {
                    chrome.storage.local.set({ savedCombos: combos }, () => {
                        // console.log('[ComboManager] Updated combos with order field');
                    });
                }
            });
        },

        // אתחול drag handler
        initDragHandler() {
            if (this.dragHandlerInitialized) return;
            
            if (window.TankiComboManager.ComboDragHandler) {
                window.TankiComboManager.ComboDragHandler.init(this);
                this.dragHandlerInitialized = true;
            }
        },

        // חיבור drag events לקונטיינר - נקרא אחרי כל רינדור
        bindDragEvents(container) {
            if (!container) {
                console.warn('[ComboManager] No container provided to bindDragEvents');
                return;
            }
            
            const dragHandler = window.TankiComboManager.ComboDragHandler;
            if (!dragHandler) {
                console.warn('[ComboManager] ComboDragHandler not available');
                return;
            }

            // הסרת listeners ישנים אם קיימים (כדי למנוע כפילויות)
            // שמירת reference ל-handlers כדי שנוכל להסיר אותם
            if (!container._dragEventsAdded) {
                const dragOverHandler = (e) => {
                    dragHandler.handleDragOver(e, container);
                };
                const dropHandler = (e) => {
                    dragHandler.handleDrop(e, container);
                };
                const dragEnterHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                };

                container.addEventListener('dragover', dragOverHandler);
                container.addEventListener('drop', dropHandler);
                container.addEventListener('dragenter', dragEnterHandler);
                container.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                });
                
                container._dragEventsAdded = true;
                // console.log('[ComboManager] Drag events bound to container successfully');
                // console.log('[ComboManager] Container ID:', container.id);
            } else {
                // console.log('[ComboManager] Drag events already bound, skipping');
            }
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

            // הוספת גלילה אופקית עם גלגלת העכבר
            const combosContainer = this.viewElement.querySelector('#combos-grid-container');
            const arrowLeft = this.viewElement.querySelector('.cme_arrowLeft');
            const arrowRight = this.viewElement.querySelector('.cme_arrowRight');

            // גלילה אופקית אוטומטית עם גלגלת העכבר
            if (combosContainer) {
                // הוספת גלילה אופקית עם גלגלת העכבר
                combosContainer.addEventListener('wheel', (e) => {
                    // אם יש גלילה אופקית, נאפשר אותה כרגיל
                    if (e.deltaX !== 0) {
                        return;
                    }
                    // אם יש גלילה אנכית, נמיר אותה לאופקית
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        combosContainer.scrollLeft += e.deltaY;
                        this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
                    }
                }, { passive: false });

                // עדכון נראות החיצים כשגוללים
                combosContainer.addEventListener('scroll', () => {
                    this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
                });

                // עדכון נראות החיצים כשמשנים גודל החלון
                window.addEventListener('resize', () => {
                    this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
                });
            }

            // לחיצה על החצים
            if (arrowLeft) {
                arrowLeft.onclick = () => {
                    if (combosContainer) {
                        const scrollAmount = combosContainer.clientWidth * 0.5;
                        combosContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    }
                };
            }

            if (arrowRight) {
                arrowRight.onclick = () => {
                    if (combosContainer) {
                        const scrollAmount = combosContainer.clientWidth * 0.5;
                        combosContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                };
            }

            // הוספת מאזין Enter לכפתור שמירה
            this.enterKeyHandler = (e) => {
                // בדיקה שהתצוגה גלויה
                if (!this.viewElement || this.viewElement.style.display === 'none') {
                    return;
                }

                // בדיקה שהמשתמש לא בעריכה של שם קומבו
                const activeElement = document.activeElement;
                if (activeElement && activeElement.isContentEditable) {
                    return;
                }

                // אם לחצו Enter, שמירת הקומבו
                if (e.key === 'Enter') {
                    const saveBtn = this.viewElement.querySelector('#cme_save-combo-btn');
                    if (saveBtn) {
                        e.preventDefault();
                        e.stopPropagation();
                        saveBtn.click();
                    }
                }
            };

            // הוספת המאזין לדוקומנט
            document.addEventListener('keydown', this.enterKeyHandler);
        },

        // טעינת הקומבואים מ-storage והצגתם
        async loadAndRenderCombos() {
            // console.log("[ComboManager] loadAndRenderCombos called");
            // לפעמים show() נקרא בזמן ש-init עדיין טוען HTML; נחכה שה-container יופיע בתוך ה-view
            const container = await this.waitForElementInView('#combos-grid-container', 7000);
            
            if (!container) {
                console.error("[ComboManager] combos-grid-container not found in view!");
                return;
            }

            // console.log("[ComboManager] Container found, fetching combos from storage...");
            chrome.storage.local.get(['savedCombos'], (result) => {
                const combos = result.savedCombos || [];
                // console.log(`[ComboManager] Fetched ${combos.length} combos from storage`);
                
                // מיון לפי order (אם קיים), אחרת לפי id (timestamp) מהחדש לישן
                const sortedCombos = combos.sort((a, b) => {
                    // אם לשניהם יש order, נמיין לפי order
                    if (a.order !== undefined && b.order !== undefined) {
                        return a.order - b.order;
                    }
                    // אם רק לאחד יש order, הוא יבוא ראשון
                    if (a.order !== undefined) return -1;
                    if (b.order !== undefined) return 1;
                    // אחרת, מיון לפי id (מהחדש לישן)
                    return (b.id || 0) - (a.id || 0);
                });
                
                this.renderCombos(sortedCombos);
            });
        },

        // רינדור הקומבואים ל-DOM
        renderCombos(combos) {
            const container = this.viewElement.querySelector('#combos-grid-container');
            if (!container) {
                console.error("[ComboManager] renderCombos: Container not found!");
                return;
            }

            // console.log(`[ComboManager] Rendering ${combos.length} combos to container`);

            // ניקוי התוכן הקיים
            container.innerHTML = '';

            if (combos.length === 0) {
                container.innerHTML = `
                    <div class="cme_empty-state">
                        <h2>No saved combos yet</h2>
                        <p>Click "SAVE CURRENT" to save your first combo!</p>
                    </div>
                `;
                // עדכון נראות החיצים - אין תוכן לגלול
                const arrowLeft = this.viewElement.querySelector('.cme_arrowLeft');
                const arrowRight = this.viewElement.querySelector('.cme_arrowRight');
                this.updateArrowsVisibility(container, arrowLeft, arrowRight);
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

            // חיבור drag events אחרי הרינדור
            setTimeout(() => {
                this.bindDragEvents(container);
            }, 100);

            // עדכון נראות החיצים אחרי הרינדור
            const arrowLeft = this.viewElement.querySelector('.cme_arrowLeft');
            const arrowRight = this.viewElement.querySelector('.cme_arrowRight');
            // נשתמש ב-setTimeout כדי לוודא שהרינדור הסתיים
            setTimeout(() => {
                this.updateArrowsVisibility(container, arrowLeft, arrowRight);
            }, 0);
        },

        // עדכון נראות החיצים בהתאם למיקום הגלילה
        updateArrowsVisibility(container, arrowLeft, arrowRight) {
            if (!container) return;

            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScrollLeft = scrollWidth - clientWidth;

            // חץ שמאלה - מופיע אם יש תוכן משמאל
            if (arrowLeft) {
                arrowLeft.style.opacity = scrollLeft > 10 ? '1' : '0';
            }

            // חץ ימינה - מופיע אם יש תוכן מימין
            if (arrowRight) {
                arrowRight.style.opacity = scrollLeft < maxScrollLeft - 10 ? '1' : '0';
            }
        },

        // מחיקת קומבו
        deleteCombo(comboId) {
            if (!confirm('Are you sure you want to delete this combo?')) return;

            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                combos = combos.filter(c => c.id !== comboId);

                chrome.storage.local.set({ savedCombos: combos }, () => {
                    // console.log(`[ComboManager] Combo ${comboId} deleted`);
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
                        // console.log(`[ComboManager] Combo ${comboId} renamed to "${newName}"`);
                    });
                }
            });
        },

        // הצטיידות בקומבו
        async equipCombo(combo) {
            // console.log('[ComboManager] Equipping combo:', combo);
            if (window.TankiComboManager.ComboLoader) {
                await window.TankiComboManager.ComboLoader.equipCombo(combo);
            } else {
                console.error("ComboLoader not loaded!");
            }
        },

        // הסרת פריט מקומבו
        removeItemFromCombo(comboId, itemType) {
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                const combo = combos.find(c => c.id === comboId);
                if (!combo) return;

                // יצירת removedItems אם לא קיים
                if (!combo.removedItems) {
                    combo.removedItems = {};
                }

                // סימון הפריט כהוסר
                // טיפול בפריטי הגנה - itemType הוא protection_0, protection_1 וכו'
                if (itemType.startsWith('protection_')) {
                    const protectionIndex = parseInt(itemType.split('_')[1]);
                    if (!combo.removedItems.protection) {
                        combo.removedItems.protection = [];
                    }
                    if (!combo.removedItems.protection.includes(protectionIndex)) {
                        combo.removedItems.protection.push(protectionIndex);
                    }
                } else {
                    // פריטים רגילים
                    combo.removedItems[itemType] = true;

                    // אם מסירים turret, גם האוגמנט שלו צריך להיות מוסר
                    if (itemType === 'turret') {
                        combo.removedItems.turretAugment = true;
                    }

                    // אם מסירים hull, גם האוגמנט שלו צריך להיות מוסר
                    if (itemType === 'hull') {
                        combo.removedItems.hullAugment = true;
                    }
                }

                chrome.storage.local.set({ savedCombos: combos }, () => {
                    // console.log(`[ComboManager] Item ${itemType} removed from combo ${comboId}`);
                    this.loadAndRenderCombos();
                });
            });
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

            // הסרת מאזין Enter (אבל לא ממש מסירים אותו כי הוא צריך לעבוד גם כשה-view מוסתר)
            // המאזין בודק בעצמו אם ה-view גלוי
        }
    };
})();