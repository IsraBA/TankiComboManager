// features/combos/capture/game/kotlin.js  [MAIN world]

// קריאת ערכים מאובייקטים של קוטלין: enum, Long, תמונות, Mk ומיקרו-אפגרייד.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // שם enum: ה-toString של קוטלין מחזיר את שם הערך, וזה יציב בין בילדים
  I.enumName = function (v) {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    try {
      const s = String(v);
      if (/^[A-Z][A-Z0-9_]*$/.test(s)) return s;
    } catch (e) { /* נופלים לשיטה הבאה */ }
    try {
      for (const k of Object.keys(v)) {
        const val = v[k];
        if (typeof val === 'string' && /^[A-Z][A-Z0-9_]*$/.test(val)) return val;
      }
    } catch (e) { /* אין שם -> null */ }
    return null;
  };

  // מזהה פריט: Long מגיע כאובייקט, אבל ה-toString שלו נכון
  I.idToString = function (v) {
    if (v == null) return null;
    try { return String(v); } catch (e) { return null; }
  };

  // גיבוי לכתובת תמונה: סריקה רדודה אחרי מחרוזת שנראית ככתובת
  function scanForUrl(v) {
    const strings = [];
    const seen = new Set();
    (function walk(o, depth) {
      if (o == null || depth > 4 || strings.length > 40) return;
      if (typeof o === 'string') { strings.push(o); return; }
      if (typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      try {
        if (Array.isArray(o)) { for (const x of o) walk(x, depth + 1); return; }
        for (const k of Object.keys(o)) walk(o[k], depth + 1);
      } catch (e) { /* אובייקט לא נגיש -> מדלגים */ }
    })(v, 0);
    return strings.find((s) => /\.(png|jpg|jpeg|webp|svg|ktx)/i.test(s)) ||
           strings.find((s) => s.includes('/')) || null;
  }

  // ה-preview אינו מחרוזת אלא אובייקט עם מתודה שבונה כתובת CDN
  I.imageUrl = function (res) {
    if (res == null) return null;
    if (typeof res === 'string') return res;
    if (I.D.urlMethod) {
      try {
        const fn = res[I.D.urlMethod];
        if (typeof fn === 'function') {
          const v = fn.call(res);
          if (typeof v === 'string' && v) return v;
        }
      } catch (e) { /* נופלים לסריקה */ }
    }
    return scanForUrl(res);
  };

  // קוטלין מחזיר לפעמים Long/אובייקט במקום number
  I.numOrNull = function (v) { return typeof v === 'number' ? v : null; };

  // רמת Mk: modificationIndex (מה שמורכב), 0-based -> תצוגה 1-based
  I.mkLevel = function (item) {
    const mod = item[I.D.itemFields.modification];
    const f = I.D.modificationFields && I.D.modificationFields.modificationIndex;
    if (mod == null || !f) return null;
    const idx = I.numOrNull(mod[f]);
    return idx == null ? null : idx + 1;
  };

  // מזהה משפחת הפריט — לפריט משודרג הוא יושב על ה-modification
  I.baseItemIdOf = function (item) {
    const mod = item[I.D.itemFields.modification];
    const f = I.D.modificationFields && I.D.modificationFields.baseItemId;
    if (mod != null && f && mod[f] != null) return I.idToString(mod[f]);
    return I.idToString(item[I.D.itemFields.id]);
  };

  I.upgradeLevel = function (item) {
    const up = item[I.D.itemFields.upgradeableParams];
    if (up == null || !I.D.upgradeFields) return null;
    return I.numOrNull(up[I.D.upgradeFields.currentLevel]);
  };

  // המקסימום יושב מאחורי מתודה (20 לדרונים, 45 להגנות)
  I.maxUpgradeLevel = function (item) {
    const up = item[I.D.itemFields.upgradeableParams];
    if (up == null || !I.D.maxLevelMethod) return null;
    try {
      const fn = up[I.D.maxLevelMethod];
      if (typeof fn !== 'function') return null;
      return I.numOrNull(fn.call(up));
    } catch (e) { return null; }
  };
})();
