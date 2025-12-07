// ui/combo_card_renderer.js

// קובץ זה אחראי ליצירת כרטיסי קומבו בודדים
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.ComboCardRenderer = {
        // יצירת כרטיס קומבו בודד
        createComboCard(combo, index, viewRenderer) {
            const card = document.createElement('div');
            card.className = 'cme_combo-card';
            card.setAttribute('data-combo-id', combo.id);

            // יצירת 4 השורות (עם בדיקת פריטים מוסרים)
            const rowsHTML = this.createRowsHTML(combo.data, combo.removedItems || {});

            // כפתור מחיקה
            const deleteBtnHTML = `
                <div class="cme_delete-btn" title="Delete combo">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            `;

            // כותרת הקומבו (ללא רקע כהה)
            const titleHTML = `
                <div class="cme_combo-title">
                    <h1 contenteditable="true" spellcheck="false">${combo.name || `COMBO ${index + 1}`}</h1>
                </div>
            `;

            card.innerHTML = `
                <div class="cme_combo-preview-container">
                    ${titleHTML}
                    <div class="cme_combo-rows">
                        ${rowsHTML}
                    </div>
                    ${deleteBtnHTML}
                </div>
            `;

            // חיבור אירועים
            this.bindComboCardEvents(card, combo, viewRenderer);

            return card;
        },

        // יצירת 4 השורות
        createRowsHTML(data, removedItems = {}) {
            // שורה ראשונה: 2 ריבועים - drone ו-grenade
            const droneImage = data.drone && data.drone.image && !removedItems.drone ? data.drone.image : null;
            const grenadeImage = data.grenade && data.grenade.image && !removedItems.grenade ? data.grenade.image : null;
            const hasDroneButNoImage = data.drone && !removedItems.drone && !droneImage;
            const hasGrenadeButNoImage = data.grenade && !removedItems.grenade && !grenadeImage;
            const isDroneRemoved = removedItems.drone;
            const isGrenadeRemoved = removedItems.grenade;

            const row1HTML = `
                <div class="cme_combo-row cme_combo-row-1">
                    <div class="cme_combo-square">
                        ${isDroneRemoved ? `<span class="cme_combo-item-name">NO DRONE</span>` : (data.drone && data.drone.name && !removedItems.drone ? `<span class="cme_combo-item-name">${data.drone.name}</span>` : '')}
                        ${droneImage ? this.createRemovableItemHTML('drone', droneImage, data.drone.name || 'Drone', 'cme_combo-drone-image') : (hasDroneButNoImage ? '<span class="cme_combo-no-item">NO DRONE</span>' : '')}
                    </div>
                    <div class="cme_combo-square">
                        ${isGrenadeRemoved ? `<span class="cme_combo-item-name">NO GRENADE</span>` : (data.grenade && data.grenade.name && !removedItems.grenade ? `<span class="cme_combo-item-name">${data.grenade.name}</span>` : '')}
                        ${grenadeImage ? this.createRemovableItemHTML('grenade', grenadeImage, data.grenade.name || 'Grenade', 'cme_combo-grenade-image') : (hasGrenadeButNoImage ? '<span class="cme_combo-no-item">NO GRENADE</span>' : '')}
                    </div>
                </div>
            `;

            // שורה שניה: מלבן עם turret, ובפינה השמאלית התחתונה - turretAugment
            const turretImage = data.turret && data.turret.image && !removedItems.turret ? data.turret.image : null;
            // אם turret הוסר, גם האוגמנט צריך להיות מוסר
            const turretAugmentImage = !removedItems.turret && data.turretAugment && data.turretAugment.image && !removedItems.turretAugment ? data.turretAugment.image : null;
            const hasTurretButNoImage = data.turret && !removedItems.turret && !turretImage;
            const isTurretRemoved = removedItems.turret;

            const row2HTML = `
                <div class="cme_combo-row cme_combo-row-2">
                    <div class="cme_combo-rectangle">
                        ${isTurretRemoved ? `<span class="cme_combo-item-name">NO TURRET</span>` : (data.turret && data.turret.name && !removedItems.turret ? `<span class="cme_combo-item-name">${data.turret.name}</span>` : '')}
                        ${turretImage ? this.createRemovableItemHTML('turret', turretImage, data.turret.name || 'Turret', 'cme_combo-turret-image') : (hasTurretButNoImage ? '<span class="cme_combo-no-item">NO TURRET</span>' : '')}
                        ${turretAugmentImage ? `
                            <div class="cme_combo-augment-badge">
                                ${this.createRemovableItemHTML('turretAugment', turretAugmentImage, data.turretAugment.name || 'Turret Augment', '')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // שורה שלישית: מלבן עם hull, ובפינה השמאלית התחתונה - hullAugment
            const hullImage = data.hull && data.hull.image && !removedItems.hull ? data.hull.image : null;
            // אם hull הוסר, גם האוגמנט צריך להיות מוסר
            const hullAugmentImage = !removedItems.hull && data.hullAugment && data.hullAugment.image && !removedItems.hullAugment ? data.hullAugment.image : null;
            const hasHullButNoImage = data.hull && !removedItems.hull && !hullImage;
            const isHullRemoved = removedItems.hull;

            const row3HTML = `
                <div class="cme_combo-row cme_combo-row-3">
                    <div class="cme_combo-rectangle">
                        ${isHullRemoved ? `<span class="cme_combo-item-name">NO HULL</span>` : (data.hull && data.hull.name && !removedItems.hull ? `<span class="cme_combo-item-name">${data.hull.name}</span>` : '')}
                        ${hullImage ? this.createRemovableItemHTML('hull', hullImage, data.hull.name || 'Hull', 'cme_combo-hull-image') : (hasHullButNoImage ? '<span class="cme_combo-no-item">NO HULL</span>' : '')}
                        ${hullAugmentImage ? `
                            <div class="cme_combo-augment-badge">
                                ${this.createRemovableItemHTML('hullAugment', hullAugmentImage, data.hullAugment.name || 'Hull Augment', '')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // שורה רביעית: מלבן עם 4 ההגנות (ללא ריבוע צבע)
            const protections = data.protection && Array.isArray(data.protection) ? data.protection : [];
            // בוטל - פונקציונליות הצבע הוסרה
            // const paintImage = data.paint && data.paint.image ? data.paint.image : null;
            // const paintName = data.paint && data.paint.name ? data.paint.name : null;

            // יצירת 4 פריטי הגנה
            const removedProtections = removedItems.protection || [];
            
            let protectionsHTML = '';
            if (protections.length === 0) {
                // אין הגנות בכלל - מציגים "NO PROTECTIONS"
                protectionsHTML = '<span class="cme_combo-no-item">NO PROTECTIONS</span>';
            } else {
                // יש הגנות - מציגים ריבועים (ריקים אם הוסרו)
                const protectionItems = [];
                for (let i = 0; i < 4; i++) {
                    const protection = protections[i] || null;
                    const isRemoved = removedProtections.includes(i);
                    const protectionImage = protection && protection.image && !isRemoved ? protection.image : null;
                    const protectionName = protection && protection.name ? protection.name : null;
                    const isEmpty = !protectionImage;
                    protectionItems.push(`
                        <div class="cme_combo-protection-item ${isEmpty ? 'cme_combo-protection-item-empty' : ''}">
                            ${protectionImage ? this.createRemovableItemHTML(`protection_${i}`, protectionImage, protectionName || `Protection ${i + 1}`, '') : ''}
                        </div>
                    `);
                }
                protectionsHTML = protectionItems.join('');
            }

            // כפתור EQUIP NOW
            const equipButtonHTML = `
                <div class="cme_combo-equip-btn">
                    <div class="cme_combo-equip-btn-inner">
                        <div class="cme_combo-equip-icon"></div>
                        <span class="cme_combo-equip-text">EQUIP</span>
                    </div>
                </div>
            `;

            const row4HTML = `
                <div class="cme_combo-row cme_combo-row-4">
                    ${equipButtonHTML}
                    <div class="cme_combo-protections">
                        ${protectionsHTML}
                    </div>
                </div>
            `;
            // <div class="cme_combo-row cme_combo-row-4">
            //     <div class="cme_combo-protections">
            //         ${protectionsHTML}
            //     </div>
            //     <div class="cme_combo-paint-square">
            //         ${paintImage ? `<img src="${paintImage}" alt="${paintName || 'Paint'}" onerror="this.style.display='none';">` : ''}
            //     </div>
            // </div>

            return row1HTML + row2HTML + row3HTML + row4HTML;
        },

        // יצירת HTML לפריט שניתן להסיר
        createRemovableItemHTML(itemType, imageSrc, altText, imageClass) {
            // קביעת גודל האיקס לפי סוג הפריט
            let iconSizeClass = '';
            if (itemType === 'turret' || itemType === 'hull') {
                iconSizeClass = 'cme_combo-item-remove-icon-large';
            } else if (itemType === 'drone' || itemType === 'grenade') {
                iconSizeClass = 'cme_combo-item-remove-icon-small';
            }
            
            return `
                <div class="cme_combo-item-removable" data-item-type="${itemType}">
                    <img src="${imageSrc}" alt="${altText}" class="${imageClass}" onerror="this.style.display='none';">
                    <svg class="cme_combo-item-remove-icon ${iconSizeClass}" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            `;
        },

        // חיבור אירועים לכרטיס קומבו
        bindComboCardEvents(card, combo, viewRenderer) {
            // כפתור מחיקה
            const deleteBtn = card.querySelector('.cme_delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    viewRenderer.deleteCombo(combo.id);
                };
            }

            // עריכת שם הקומבו
            const titleElement = card.querySelector('.cme_combo-title h1');
            if (titleElement) {
                const MAX_NAME_LENGTH = 15;
                
                // פונקציה לבדיקת אורך השם
                const enforceMaxLength = (element) => {
                    const text = element.textContent;
                    if (text.length > MAX_NAME_LENGTH) {
                        element.textContent = text.substring(0, MAX_NAME_LENGTH);
                        // החזרת הקורסור לסוף הטקסט
                        const range = document.createRange();
                        const selection = window.getSelection();
                        range.selectNodeContents(element);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                };
                
                titleElement.onblur = (e) => {
                    const newName = e.target.textContent.trim().substring(0, MAX_NAME_LENGTH);
                    if (newName && newName !== combo.name) {
                        viewRenderer.renameCombo(combo.id, newName);
                    }
                    // עדכון הטקסט אם הוא חתוך
                    if (e.target.textContent.trim().length > MAX_NAME_LENGTH) {
                        e.target.textContent = newName;
                    }
                };
                titleElement.onkeydown = (e) => {
                    // מונע מהמשחק לקבל את אירועי המקלדת
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                    // מונע הקלדה אם הגענו למקסימום (חוץ מכפתורי בקרה)
                    const text = e.target.textContent;
                    if (text.length >= MAX_NAME_LENGTH && 
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                          'Home', 'End', 'Tab', 'Enter', 'Escape'].includes(e.key) &&
                        !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                    }
                };
                // מונע התפשטות של כל אירועי המקלדת למשחק
                titleElement.onkeyup = (e) => {
                    e.stopPropagation();
                };
                titleElement.onkeypress = (e) => {
                    e.stopPropagation();
                };
                titleElement.onclick = (e) => {
                    e.stopPropagation();
                };
                // מונע התפשטות גם באירועי focus ו-input
                titleElement.onfocus = (e) => {
                    e.stopPropagation();
                };
                titleElement.oninput = (e) => {
                    e.stopPropagation();
                    enforceMaxLength(e.target);
                };
                // מונע הדבקה של טקסט ארוך מדי
                titleElement.onpaste = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                    const currentText = e.target.textContent;
                    const selection = window.getSelection();
                    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                    
                    if (range) {
                        range.deleteContents();
                        const textNode = document.createTextNode(pastedText.substring(0, MAX_NAME_LENGTH - currentText.length + range.toString().length));
                        range.insertNode(textNode);
                        range.setStartAfter(textNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        const newText = (currentText + pastedText).substring(0, MAX_NAME_LENGTH);
                        e.target.textContent = newText;
                    }
                    enforceMaxLength(e.target);
                };
            }

            // טיפול בלחיצה על פריטים להסרה
            const removableItems = card.querySelectorAll('.cme_combo-item-removable');
            removableItems.forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    const itemType = item.getAttribute('data-item-type');
                    if (itemType) {
                        viewRenderer.removeItemFromCombo(combo.id, itemType);
                    }
                };
            });

            // לחיצה על הכרטיס עצמו - equip (בעתיד)
            card.onclick = (e) => {
                // אם לחצו על כפתור, כותרת, או פריט להסרה, לא נעשה כלום
                if (e.target.closest('.cme_delete-btn') || 
                    e.target.closest('.cme_combo-title h1') || 
                    e.target.closest('.cme_combo-item-removable')) {
                    return;
                }
                viewRenderer.equipCombo(combo);
            };
        }
    };
})();

