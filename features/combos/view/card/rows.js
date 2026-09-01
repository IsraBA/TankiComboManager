// features/combos/view/card/rows.js

// ארבע שורות הכרטיס: דרון+רימון, תותח, גוף, וצבע+הגנות.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ComboCardRenderer, {
    createRowsHTML(data, removedItems = {}) {
      return this._rowDroneGrenade(data, removedItems) +
             this._rowTurret(data, removedItems) +
             this._rowHull(data, removedItems) +
             this._rowPaintProtections(data, removedItems);
    },

    _rowDroneGrenade(data, removedItems) {
      const droneImage =
        data.drone && data.drone.image && !removedItems.drone
          ? data.drone.image
          : null;
      const grenadeImage =
        data.grenade && data.grenade.image && !removedItems.grenade
          ? data.grenade.image
          : null;
      const hasDroneButNoImage =
        data.drone && !removedItems.drone && !droneImage;
      const hasGrenadeButNoImage =
        data.grenade && !removedItems.grenade && !grenadeImage;
      const isDroneRemoved = removedItems.drone;
      const isGrenadeRemoved = removedItems.grenade;

      return `
                <div class="cme_combo-row cme_combo-row-1">
                    <div class="cme_combo-square">
                        ${isDroneRemoved ? `<span class="cme_combo-item-name">NO DRONE</span>` : data.drone && data.drone.name && !removedItems.drone ? `<span class="cme_combo-item-name">${data.drone.name}</span>` : ""}
                        ${droneImage ? this.createRemovableItemHTML("drone", droneImage, data.drone.name || "Drone", "cme_combo-drone-image") : hasDroneButNoImage ? '<span class="cme_combo-no-item">NO DRONE</span>' : ""}
                    </div>
                    <div class="cme_combo-square">
                        ${isGrenadeRemoved ? `<span class="cme_combo-item-name">NO GRENADE</span>` : data.grenade && data.grenade.name && !removedItems.grenade ? `<span class="cme_combo-item-name">${data.grenade.name}</span>` : ""}
                        ${grenadeImage ? this.createRemovableItemHTML("grenade", grenadeImage, data.grenade.name || "Grenade", "cme_combo-grenade-image") : hasGrenadeButNoImage ? '<span class="cme_combo-no-item">NO GRENADE</span>' : ""}
                    </div>
                </div>
            `;
    },

    // הסקין רק מחליף את התמונה — הוא לא פריט נפרד להסרה
    _rowTurret(data, removedItems) {
      const isTurretRemoved = removedItems.turret;
      const activeTurret = data.turret && !isTurretRemoved ? data.turret : null;
      const turretImage = activeTurret
        ? (data.turretSkin && data.turretSkin.image) || activeTurret.image || null
        : null;
      const turretAugmentImage =
        !isTurretRemoved &&
        data.turretAugment &&
        data.turretAugment.image &&
        !removedItems.turretAugment
          ? data.turretAugment.image
          : null;
      const hasTurretButNoImage = activeTurret && !turretImage;

      return `
                <div class="cme_combo-row cme_combo-row-2">
                    <div class="cme_combo-rectangle">
                        ${isTurretRemoved ? `<span class="cme_combo-item-name">NO TURRET</span>` : data.turret && data.turret.name ? `<span class="cme_combo-item-name">${data.turret.name}</span>` : ""}
                        ${turretImage ? this.createRemovableItemHTML("turret", turretImage, data.turret.name || "Turret", "cme_combo-turret-image") : hasTurretButNoImage ? '<span class="cme_combo-no-item">NO TURRET</span>' : ""}
                        ${this.createBadgesHTML([
                          turretAugmentImage
                            ? this.createBadgeHTML("turretAugment", turretAugmentImage, data.turretAugment.name || "Turret Augment")
                            : "",
                        ])}
                    </div>
                </div>
            `;
    },

    _rowHull(data, removedItems) {
      const isHullRemoved = removedItems.hull;
      const activeHull = data.hull && !isHullRemoved ? data.hull : null;
      const hullImage = activeHull
        ? (data.hullSkin && data.hullSkin.image) || activeHull.image || null
        : null;
      const hullAugmentImage =
        !isHullRemoved &&
        data.hullAugment &&
        data.hullAugment.image &&
        !removedItems.hullAugment
          ? data.hullAugment.image
          : null;
      const hasHullButNoImage = activeHull && !hullImage;

      return `
                <div class="cme_combo-row cme_combo-row-3">
                    <div class="cme_combo-rectangle">
                        ${isHullRemoved ? `<span class="cme_combo-item-name">NO HULL</span>` : data.hull && data.hull.name ? `<span class="cme_combo-item-name">${data.hull.name}</span>` : ""}
                        ${hullImage ? this.createRemovableItemHTML("hull", hullImage, data.hull.name || "Hull", "cme_combo-hull-image") : hasHullButNoImage ? '<span class="cme_combo-no-item">NO HULL</span>' : ""}
                        ${this.createBadgesHTML([
                          hullAugmentImage
                            ? this.createBadgeHTML("hullAugment", hullAugmentImage, data.hullAugment.name || "Hull Augment")
                            : "",
                        ])}
                    </div>
                </div>
            `;
    },

    // ריבוע הצבע במקום שבו היה כפתור ה-EQUIP, ומוצג תמיד
    _rowPaintProtections(data, removedItems) {
      const protections =
        data.protection && Array.isArray(data.protection) ? data.protection : [];
      const isPaintRemoved = removedItems.paint;
      const paintImage =
        data.paint && data.paint.image && !isPaintRemoved
          ? data.paint.image
          : null;
      const removedProtections = removedItems.protection || [];

      let protectionsHTML = "";
      if (protections.length === 0) {
        protectionsHTML =
          '<span class="cme_combo-no-item">NO PROTECTIONS</span>';
      } else {
        // יש הגנות — 4 ריבועים, ריקים אם הוסרו
        const protectionItems = [];
        for (let i = 0; i < 4; i++) {
          const protection = protections[i] || null;
          const isRemoved = removedProtections.includes(i);
          const protectionImage =
            protection && protection.image && !isRemoved
              ? protection.image
              : null;
          const protectionName =
            protection && protection.name ? protection.name : null;
          const isEmpty = !protectionImage;
          protectionItems.push(`
                        <div class="cme_combo-protection-item ${isEmpty ? "cme_combo-protection-item-empty" : ""}">
                            ${protectionImage ? this.createRemovableItemHTML(`protection_${i}`, protectionImage, protectionName || `Protection ${i + 1}`, "") : ""}
                        </div>
                    `);
        }
        protectionsHTML = protectionItems.join("");
      }

      return `
                <div class="cme_combo-row cme_combo-row-4">
                    <div class="cme_combo-paint-square">
                        ${paintImage ? this.createRemovableItemHTML("paint", paintImage, data.paint.name || "Paint", "") : '<span class="cme_combo-item-name">NO PAINT</span>'}
                    </div>
                    <div class="cme_combo-protections">
                        ${protectionsHTML}
                    </div>
                </div>
            `;
    },

    // שורת התגים בפינה השמאלית התחתונה, בלי ריקים
    createBadgesHTML(badges) {
      const items = badges.filter(Boolean);
      if (!items.length) return "";
      return `<div class="cme_combo-badges">${items.join("")}</div>`;
    },

    createBadgeHTML(itemType, imageSrc, altText) {
      return `
                <div class="cme_combo-augment-badge">
                    ${this.createRemovableItemHTML(itemType, imageSrc, altText, "")}
                </div>
            `;
    },

    createRemovableItemHTML(itemType, imageSrc, altText, imageClass) {
      // גודל האיקס נגזר מסוג הפריט
      let iconSizeClass = "";
      if (itemType === "turret" || itemType === "hull") {
        iconSizeClass = "cme_combo-item-remove-icon-large";
      } else if (itemType === "drone" || itemType === "grenade") {
        iconSizeClass = "cme_combo-item-remove-icon-small";
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
  });
})();
