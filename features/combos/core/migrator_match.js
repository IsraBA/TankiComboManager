// features/combos/core/migrator_match.js

// התאמת חריצי קומבו לפריטי המוסך לפי שם — הליבה של המיגרציה.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // חריצי הקומבו והקטגוריה שכל אחד מהם מצפה לה במשחק
  const SLOT_CATEGORY = {
    turret: "WEAPON",
    hull: "ARMOR",
    grenade: "BAZOOKA",
    drone: "DRONE",
    paint: "PAINT",
    turretSkin: "SKIN",
    hullSkin: "SKIN",
  };
  // חריצי אוגמנט — נפתרים מול רשימת ה-devices, לא מול הפריטים
  const AUGMENT_SLOTS = { turretAugment: "turret", hullAugment: "hull" };

  function normalize(name) {
    if (!name) return null;
    const Utils = window.TankiQoL.Utils;
    const clean = Utils ? Utils.cleanItemName(name) : name;
    return clean ? clean.trim().toUpperCase() : null;
  }

  // baseItemId הוא המפתח העמיד; id לבדו מצביע על Mk מסוימת
  function needsWork(entry) {
    if (!entry || typeof entry !== "object") return false;
    return !entry.baseItemId;
  }

  // האם יש בכלל מה לעשות — בדיקה בזיכרון, בלי גשר ובלי אחסון
  function comboNeedsWork(combo) {
    const data = combo && combo.data;
    if (!data) return false;
    for (const slot of Object.keys(SLOT_CATEGORY)) {
      if (needsWork(data[slot])) return true;
    }
    for (const slot of Object.keys(AUGMENT_SLOTS)) {
      if (needsWork(data[slot])) return true;
    }
    if (Array.isArray(data.protection)) {
      for (const p of data.protection) if (needsWork(p)) return true;
    }
    return false;
  }

  // אינדקסים לחיפוש: לפי מזהה, ולפי שם מנורמל בתוך קטגוריה
  function buildIndex(payload) {
    const byId = new Map();
    const byName = new Map(); // "CATEGORY|NAME" -> [entries]
    for (const it of payload.items || []) {
      if (it.id) byId.set(String(it.id), it);
      const key = (it.category || "") + "|" + normalize(it.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(it);
    }

    const devById = new Map();
    const devByName = new Map(); // "BASEITEMID|NAME" -> [entries]
    for (const d of payload.devices || []) {
      if (d.id) devById.set(String(d.id), d);
      const key = String(d.baseItemId) + "|" + normalize(d.name);
      if (!devByName.has(key)) devByName.set(key, []);
      devByName.get(key).push(d);
    }
    return { byId, byName, devById, devByName };
  }

  // baseItemId זהה = דרגות Mk של אותו פריט; משפחות שונות = עמימות אמיתית.
  // בוחרים את ה-Mk הגבוהה שבבעלות, ואם אין — הנמוכה ביותר.
  function pickFamilyMember(hits) {
    if (!hits || !hits.length) return null;
    const families = new Set(hits.map((h) => h.baseItemId));
    if (families.size !== 1) return null;

    const owned = hits.filter((h) => h.owned);
    if (owned.length) {
      return owned.reduce((a, b) => ((b.mk || 0) > (a.mk || 0) ? b : a));
    }
    return hits.reduce((a, b) => ((b.mk || 0) < (a.mk || 0) ? b : a));
  }

  // משלים חריץ בודד. מחזיר true אם שינה משהו.
  function fillItemSlot(entry, category, index) {
    if (!needsWork(entry)) return false;

    // כבר יש מזהה — צריך רק את משפחת הפריט
    if (entry.id) {
      const hit = index.byId.get(String(entry.id));
      if (hit && hit.baseItemId) {
        entry.baseItemId = hit.baseItemId;
        return true;
      }
      // מזהה שאינו במוסך הזה -> נופלים להתאמה בשם
    }

    const key = category + "|" + normalize(entry.name);
    const best = pickFamilyMember(index.byName.get(key));
    if (!best) return false; // עמום באמת -> לא נוגעים

    entry.id = best.id;
    entry.baseItemId = best.baseItemId;
    return true;
  }

  // אוגמנט נפתר מול ה-baseItemId של התותח/גוף שאליו הוא שייך
  function fillAugmentSlot(entry, ownerEntry, index) {
    if (!needsWork(entry)) return false;

    if (entry.id) {
      const hit = index.devById.get(String(entry.id));
      if (hit && hit.baseItemId) {
        entry.baseItemId = hit.baseItemId;
        return true;
      }
    }

    const ownerBase = ownerEntry && ownerEntry.baseItemId;
    if (!ownerBase) return false; // בלי התותח/גוף אין למה לקשור
    const hits = index.devByName.get(String(ownerBase) + "|" + normalize(entry.name));
    if (!hits || hits.length !== 1) return false;   // לאוגמנט אין דרגות Mk

    entry.id = hits[0].id;
    entry.baseItemId = hits[0].baseItemId;
    return true;
  }

  function migrateCombo(combo, index) {
    const data = combo.data;
    let changed = false;

    // הפריטים קודם, כי האוגמנטים נשענים על ה-baseItemId שלהם
    for (const slot of Object.keys(SLOT_CATEGORY)) {
      if (fillItemSlot(data[slot], SLOT_CATEGORY[slot], index)) changed = true;
    }
    for (const slot of Object.keys(AUGMENT_SLOTS)) {
      const owner = data[AUGMENT_SLOTS[slot]];
      if (fillAugmentSlot(data[slot], owner, index)) changed = true;
    }
    if (Array.isArray(data.protection)) {
      for (const p of data.protection) {
        if (fillItemSlot(p, "RESISTANCE_MODULE", index)) changed = true;
      }
    }
    return changed;
  }

  window.TankiQoL.ComboMatch = {
    normalize, needsWork, comboNeedsWork, buildIndex, migrateCombo,
  };
})();
