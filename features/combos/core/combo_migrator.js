// features/combos/core/combo_migrator.js

// משלים מזהים לקומבואים שנשמרו בלי — ברקע, בלי שהמשתמש ידע.
//
// למה זה נחוץ: קומבואים מ"דור 1" נשמרו ע"י סריקת DOM ומחזיקים שם ותמונה
// בלבד. ההצטיידות המיידית עובדת מול המזהים של המשחק, ולכן בלי השלמה כזו
// כל קומבו ישן היה נופל למסלול ה-DOM האיטי לנצח.
//
// מתי זה רץ: בכל טעינה של רשימת הקומבואים, ברקע ואחרי הרינדור — כמו ניקוי
// הקומבואים הריקים. **בכוונה לא דגל חד-פעמי ב-storage**: יש ייבוא/ייצוא,
// והמשתמש יכול לייבא קובץ ישן בכל רגע. סריקה אידמפוטנטית מטפלת בזה בחינם,
// והיא זולה — אחרי ההשלמה הראשונה היא יוצאת מיד ולא נוגעת לא בגשר ולא
// באחסון.
//
// גם קומבואים חדשים צריכים את זה: baseItemId נוסף לשמירה מאוחר יותר, אז
// קומבו שנשמר לפני כן מחזיק id בלבד.
//
// שלוש החלטות שמונעות נזק:
//   * **לא מוחקים כלום.** מוסיפים id/baseItemId לצד ה-name/image הקיימים.
//     חריץ שלא נפתר נשאר בדיוק כפי שהיה, ומסלול ה-DOM ממשיך לצייד אותו.
//   * **גם פריטים שאינם בבעלות נפתרים.** המזהה הוא עובדה על המשחק ולא על
//     המשתמש, והמוסך מכיל אותם ממילא (הם מוצגים למכירה). קומבו שיובא
//     מחשבון אחר נפתר במלואו, ואם הפריט ייקנה בעתיד הוא פשוט יעבוד.
//   * **התאמה עמומה נדחית.** שני מועמדים -> לא מנחשים.
//
// לגבי Mk: המשתמש מחזיק את **כל** דרגות ה-Mk של פריט, וכל אחת היא פריט
// נפרד עם id משלה. לכן שם נקי כמו "THUNDER" מחזיר שבעה מועמדים — וזו אינה
// עמימות אלא משפחה אחת, כי כולם חולקים baseItemId. עמימות אמיתית היא שני
// baseItemId שונים תחת אותו שם.
//
// מה נשמר מתוך המשפחה: **baseItemId תמיד** — הוא המפתח העמיד, והוא מה
// שההצטיידות נשענת עליו כדי לקחת את ה-Mk הנוכחי בזמן ההחלה. ה-id הוא
// תצלום נוח, ולכן נבחרת ממנו ה-Mk **הגבוהה ביותר שבבעלות**; אם שום דרגה
// אינה בבעלות נלקחת הנמוכה, וזה בסדר כי ההצטיידות לא תיסמך עליה.
//
// מגבלה ידועה: שם נשמר בשפה שבה שיחק המשתמש. אם שפת המשחק השתנתה מאז,
// ההתאמה לא תצליח ואין מאיפה לתרגם — הקומבו יישאר על מסלול ה-DOM, בדיוק
// כמו היום.

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

  // חריץ נחשב מושלם כשיש לו baseItemId — זה המפתח העמיד, וזה מה
  // שההצטיידות נשענת עליו. id לבדו לא מספיק (הוא מצביע על Mk מסוימת).
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
      // המזהה אינו בבעלות המשתמש הזה (קומבו שיובא מחשבון אחר, או פריט
      // שנמכר) — נופלים להתאמה בשם, ואם גם היא נכשלת פשוט לא נוגעים
    }

    const key = category + "|" + normalize(entry.name);
    const best = pickFamilyMember(index.byName.get(key));
    if (!best) return false; // לא בבעלות, או עמום באמת -> לא נוגעים

    entry.id = best.id;
    entry.baseItemId = best.baseItemId;
    return true;
  }

  // מתוך מועמדים בעלי אותו שם: אם כולם אותה משפחה (baseItemId זהה) אלה רק
  // דרגות Mk של אותו פריט. משפחות שונות = עמימות אמיתית.
  // הבחירה: ה-Mk הגבוהה ביותר **שבבעלות** — זו שהמוסך מציג ושהאקוויפר הישן
  // היה מצייד. אם אף דרגה אינה בבעלות (קומבו מחשבון אחר), נלקחת הנמוכה
  // ביותר, שהיא מה שיתקבל אם הפריט ייקנה.
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

  // אוגמנט: מזוהה מול הפריט שאליו הוא שייך, ולכן צריך את ה-baseItemId שלו
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
    if (!ownerBase) return false; // בלי התותח/גוף אין לנו למה לקשור
    const hits = index.devByName.get(String(ownerBase) + "|" + normalize(entry.name));
    if (!hits || hits.length !== 1) return false;   // לאוגמנט אין דרגות Mk

    entry.id = hits[0].id;
    entry.baseItemId = hits[0].baseItemId;
    return true;
  }

  function migrateCombo(combo, index) {
    const data = combo.data;
    let changed = false;

    // קודם הפריטים הרגילים — האוגמנטים נשענים על ה-baseItemId שלהם
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

  window.TankiQoL.ComboMigrator = {
    // משלים מזהים לכל הקומבואים השמורים. ה-callback מקבל את מספר
    // הקומבואים שהשתנו (0 גם כשלא היה מה לעשות וגם כשלא הצלחנו).
    backfillIds(callback) {
      chrome.storage.local.get(["savedCombos"], async (result) => {
        const combos = result.savedCombos || [];
        const pending = combos.filter(comboNeedsWork);
        if (!pending.length) {
          if (callback) callback(0);
          return;
        }

        const bridge = window.TankiQoL.GarageBridge;
        if (!bridge) {
          if (callback) callback(0);
          return;
        }

        let index;
        try {
          const payload = await bridge.readIndex();
          // ה-state עוד לא נתפס (למשל לפני כניסה למוסך) — ננסה שוב בטעינה הבאה
          if (!payload || !payload.ok) {
            if (callback) callback(0);
            return;
          }
          index = buildIndex(payload);
        } catch (e) {
          if (callback) callback(0);
          return;
        }

        let changedCount = 0;
        for (const combo of pending) {
          if (migrateCombo(combo, index)) changedCount++;
        }

        // כותבים רק אם באמת הושלם משהו — אחרת כל רינדור היה כותב לאחסון
        if (!changedCount) {
          if (callback) callback(0);
          return;
        }
        chrome.storage.local.set({ savedCombos: combos }, () => {
          if (window.TankiQoL.DEBUG) {
            console.log(
              `[ComboManager] backfilled ids for ${changedCount} combo(s)`,
            );
          }
          if (callback) callback(changedCount);
        });
      });
    },

    // חשוף לבדיקות אופליין
    _internals: { normalize, needsWork, comboNeedsWork, buildIndex, migrateCombo },
  };
})();
