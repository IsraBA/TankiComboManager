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

            // יצירת 4 השורות
            const rowsHTML = this.createRowsHTML(combo.data);

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
        createRowsHTML(data) {
            // שורה ראשונה: 2 ריבועים - drone ו-grenade
            const droneImage = data.drone && data.drone.image ? data.drone.image : null;
            const grenadeImage = data.grenade && data.grenade.image ? data.grenade.image : null;

            const row1HTML = `
                <div class="cme_combo-row cme_combo-row-1">
                    <div class="cme_combo-square">
                        ${data.drone && data.drone.name ? `<span class="cme_combo-item-name">${data.drone.name}</span>` : ''}
                        ${droneImage ? `<img src="${droneImage}" alt="${data.drone.name || 'Drone'}" class="cme_combo-drone-image" onerror="this.style.display='none';">` : ''}
                    </div>
                    <div class="cme_combo-square">
                        ${data.grenade && data.grenade.name ? `<span class="cme_combo-item-name">${data.grenade.name}</span>` : ''}
                        ${grenadeImage ? `<img src="${grenadeImage}" alt="${data.grenade.name || 'Grenade'}" class="cme_combo-grenade-image" onerror="this.style.display='none';">` : ''}
                    </div>
                </div>
            `;

            // שורה שניה: מלבן עם turret, ובפינה השמאלית התחתונה - turretAugment
            const turretImage = data.turret && data.turret.image ? data.turret.image : null;
            const turretAugmentImage = data.turretAugment && data.turretAugment.image ? data.turretAugment.image : null;

            const row2HTML = `
                <div class="cme_combo-row cme_combo-row-2">
                    <div class="cme_combo-rectangle">
                        ${data.turret && data.turret.name ? `<span class="cme_combo-item-name">${data.turret.name}</span>` : ''}
                        ${turretImage ? `<img src="${turretImage}" alt="${data.turret.name || 'Turret'}" class="cme_combo-turret-image" onerror="this.style.display='none';">` : ''}
                        ${turretAugmentImage ? `
                            <div class="cme_combo-augment-badge">
                                <img src="${turretAugmentImage}" alt="${data.turretAugment.name || 'Turret Augment'}" onerror="this.style.display='none';">
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // שורה שלישית: מלבן עם hull, ובפינה השמאלית התחתונה - hullAugment
            const hullImage = data.hull && data.hull.image ? data.hull.image : null;
            const hullAugmentImage = data.hullAugment && data.hullAugment.image ? data.hullAugment.image : null;

            const row3HTML = `
                <div class="cme_combo-row cme_combo-row-3">
                    <div class="cme_combo-rectangle">
                        ${data.hull && data.hull.name ? `<span class="cme_combo-item-name">${data.hull.name}</span>` : ''}
                        ${hullImage ? `<img src="${hullImage}" alt="${data.hull.name || 'Hull'}" class="cme_combo-hull-image" onerror="this.style.display='none';">` : ''}
                        ${hullAugmentImage ? `
                            <div class="cme_combo-augment-badge">
                                <img src="${hullAugmentImage}" alt="${data.hullAugment.name || 'Hull Augment'}" onerror="this.style.display='none';">
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // שורה רביעית: מלבן עם 4 ההגנות וריבוע עם תמונת הצבע
            const protections = data.protection && Array.isArray(data.protection) ? data.protection : [];
            const paintImage = data.paint && data.paint.image ? data.paint.image : null;
            const paintName = data.paint && data.paint.name ? data.paint.name : null;

            // יצירת 4 פריטי הגנה (אם יש פחות מ-4, נוסיף ריקים)
            const protectionItems = [];
            for (let i = 0; i < 4; i++) {
                const protection = protections[i] || null;
                const protectionImage = protection && protection.image ? protection.image : null;
                const protectionName = protection && protection.name ? protection.name : null;
                protectionItems.push(`
                    <div class="cme_combo-protection-item">
                        ${protectionImage ? `<img src="${protectionImage}" alt="${protectionName || `Protection ${i + 1}`}" onerror="this.style.display='none';">` : ''}
                    </div>
                `);
            }
            const protectionsHTML = protectionItems.join('');

            const row4HTML = `
                <div class="cme_combo-row cme_combo-row-4">
                    <div class="cme_combo-protections">
                        ${protectionsHTML}
                    </div>
                    <div class="cme_combo-paint-square">
                        ${paintImage ? `<img src="${paintImage}" alt="${paintName || 'Paint'}" onerror="this.style.display='none';">` : ''}
                    </div>
                </div>
            `;

            return row1HTML + row2HTML + row3HTML + row4HTML;
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
                titleElement.onblur = (e) => {
                    const newName = e.target.textContent.trim();
                    if (newName && newName !== combo.name) {
                        viewRenderer.renameCombo(combo.id, newName);
                    }
                };
                titleElement.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                };
                titleElement.onclick = (e) => {
                    e.stopPropagation();
                };
            }

            // לחיצה על הכרטיס עצמו - equip (בעתיד)
            card.onclick = (e) => {
                // אם לחצו על כפתור או כותרת, לא נעשה כלום
                if (e.target.closest('.cme_delete-btn') || e.target.closest('.cme_combo-title h1')) {
                    return;
                }
                viewRenderer.equipCombo(combo);
            };
        }
    };
})();

