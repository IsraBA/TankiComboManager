// features/combos/equip/combo_identity.js

// האם קומבו כבר מצויד במלואו. משווה את מה ש-buildDesired היה מצייד
// מול הציוד הנוכחי, כדי שההשוואה לא תוכל לסטות מההצטיידות.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // חריצים שמזוהים לפי משפחה: קומבו מ-Mk5 מצייד את ה-Mk הגבוהה
  const BY_FAMILY = ["turret", "hull", "grenade", "drone", "paint"];
  // אוגמנט וסקין: ה-baseItemId שלהם אינו ייחודי, ולכן לפי מזהה
  const BY_ID = ["turretAugment", "hullAugment", "turretSkin", "hullSkin"];

  // דור-1 נסרק מה-DOM ולא רשם דקורטיביים כלל. חוסר שם אינו "אין
  // צבע" אלא "לא ידוע", ולכן אינו הופך שני קומבואים לשונים.
  const TOLERATE_UNRECORDED = { paint: true, turretSkin: true, hullSkin: true };

  function norm(name) {
    return name == null ? "" : String(name).trim().toUpperCase();
  }

  // known=false פירושו שהחריץ מעולם לא נרשם; הסרה בעריכה היא כן ידיעה
  function slotState(combo, slot) {
    if ((combo.removedItems || {})[slot] === true) return { known: true, entry: null };
    const entry = (combo.data || {})[slot];
    return entry ? { known: true, entry } : { known: false, entry: null };
  }

  // ההגנות שהקומבו באמת יצייד, בלי אלה שהמשתמש הסיר
  function effectiveProtections(combo) {
    const list = (combo.data || {}).protection;
    if (!Array.isArray(list)) return [];
    const removed = (combo.removedItems || {}).protection || [];
    return list.filter((p, i) => p && removed.indexOf(i) === -1);
  }

  // משווים על הזהות החזקה ביותר ששני הצדדים מחזיקים. דור-1 מחזיק שם
  // בלבד, ולכן אי אפשר לקבע מפתח אחד מראש.
  function sameFamily(a, b) {
    if (!a || !b) return !a && !b;
    if (a.baseItemId != null && b.baseItemId != null) {
      return String(a.baseItemId) === String(b.baseItemId);
    }
    if (a.id != null && b.id != null) return String(a.id) === String(b.id);
    return norm(a.name) !== "" && norm(a.name) === norm(b.name);
  }

  function sameExact(a, b) {
    if (!a || !b) return !a && !b;
    if (a.id != null && b.id != null) return String(a.id) === String(b.id);
    return norm(a.name) !== "" && norm(a.name) === norm(b.name);
  }

  // ההגנות הן קבוצה: אותם מודולים בסדר אחר הם אותו מצב, ומספר
  // החריצים הריקים נובע מגודל הקבוצה.
  function sameProtections(want, have) {
    const w = (want || []).filter(Boolean);
    const h = (have || []).filter(Boolean);
    if (w.length !== h.length) return false;
    const used = h.map(() => false);
    for (const item of w) {
      let hit = -1;
      for (let i = 0; i < h.length; i++) {
        if (!used[i] && sameFamily(item, h[i])) { hit = i; break; }
      }
      if (hit === -1) return false;
      used[hit] = true;
    }
    return true;
  }

  window.TankiQoL.ComboIdentity = {
    // current = combo מתוך GarageBridge.readCombo()
    isEquipped(combo, current, includeProtections) {
      const InstantLoader = window.TankiQoL.InstantLoader;
      if (!combo || !current || !InstantLoader || !InstantLoader._internals) {
        return false;
      }
      const desired = InstantLoader._internals.buildDesired(
        combo,
        includeProtections !== false,
      );

      // חריץ שאינו ב-desired הוסר או לא קיים בקומבו — לא נוגעים בו
      for (const slot of BY_FAMILY) {
        if (!desired[slot]) continue;
        if (!sameFamily(desired[slot], current[slot])) return false;
      }
      for (const slot of BY_ID) {
        if (!desired[slot]) continue;
        if (!sameExact(desired[slot], current[slot])) return false;
      }

      // protection:null פירושו "אל תיגע", ולכן אינו משתתף
      if (Array.isArray(desired.protection)) {
        if (!sameProtections(desired.protection, current.protection)) return false;
      }
      return true;
    },

    // האם שני קומבואים מציידים בדיוק אותו דבר.
    // כאן אי אפשר להישען על buildDesired כמו ב-isEquipped: הוא מכווץ
    // "הוסר בעריכה" ו"מעולם לא נרשם" לאותו חוסר, וההבדל ביניהם מהותי.
    isSameCombo(a, b) {
      if (!a || !b) return false;

      for (const slot of BY_FAMILY.concat(BY_ID)) {
        const x = slotState(a, slot);
        const y = slotState(b, slot);
        // דור ישן לא רשם דקורטיביים — חוסר מידע אינו הבדל
        if (TOLERATE_UNRECORDED[slot] && (!x.known || !y.known)) continue;
        if (!x.entry !== !y.entry) return false;
        if (!x.entry) continue;
        const same = BY_ID.indexOf(slot) === -1 ? sameFamily : sameExact;
        if (!same(x.entry, y.entry)) return false;
      }

      // הגנות: חלק מהזהות, אבל כקבוצה — בדיוק כמו בכל השאר
      return sameProtections(effectiveProtections(a), effectiveProtections(b));
    },

    // חשוף לבדיקות אופליין
    _internals: { sameFamily, sameExact, sameProtections },
  };
})();
