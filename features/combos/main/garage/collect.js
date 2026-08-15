// features/combos/main/garage/collect.js  [MAIN world]

// סריקה מבנית של גרף ה-state: אוספת פריטים ואוגמנטים בלי להסתמך על שמות.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // עומק 24 ולא 14: ענף שנקטע נראה בדיוק כמו "הפריט לא בבעלות"
  const MAX_DEPTH = 24;
  const MAX_NODES = 400000;

  // אוספי קוטלין הם מחלקות פנימיות ששמות המתודות שלהן מתחלפות כל בילד,
  // ולכן הזיהוי הוא לפי מבנה האובייקט עצמו.
  I.collect = function (root) {
    const IF = I.D.itemFields;
    const itemNeed = [IF.id, IF.name, IF.category, IF.mounted, IF.mountIndex];
    const DF = I.D.deviceFields;
    const devNeed = DF ? [DF.id, DF.baseItemId, DF.installed, DF.name] : null;

    const items = [];
    const devices = [];
    const byId = new Map();   // idString -> item, לפתרון סקינים לפי מזהה
    const seen = new Set();
    const stack = [[root, 0]];
    let nodes = 0;
    let truncated = false;
    let depthCut = 0;

    while (stack.length) {
      const [obj, depth] = stack.pop();
      if (obj == null || typeof obj !== 'object') continue;
      if (depth > MAX_DEPTH) { depthCut++; continue; }
      if (seen.has(obj)) continue;
      seen.add(obj);
      if (++nodes > MAX_NODES) { truncated = true; break; }

      let isItem = true;
      for (const f of itemNeed) { if (!(f in obj)) { isItem = false; break; } }
      if (isItem) {   // לא יורדים לתוך פריטים
        items.push(obj);
        const key = I.idToString(obj[IF.id]);
        if (key != null) byId.set(key, obj);
        continue;
      }

      if (devNeed) {
        let isDev = true;
        for (const f of devNeed) { if (!(f in obj)) { isDev = false; break; } }
        if (isDev) { devices.push(obj); continue; }
      }

      // Map/Set לא חושפים תוכן ב-Object.keys — בלעדיהם ענף שלם לא נסרק
      try {
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const v = obj[i];
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        } else if (obj instanceof Map) {
          for (const v of obj.values()) {
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        } else if (obj instanceof Set) {
          for (const v of obj) {
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        } else {
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        }
      } catch (e) { /* אובייקט לא נגיש -> מדלגים עליו */ }
    }

    NS.debug.depthCut = depthCut;
    NS.debug.lastNodes = nodes;
    NS.debug.truncated = truncated;
    return { items, devices, byId };
  };

  // הקטלוג הקנוני של האוגמנטים: תת-העץ state.devices בלבד.
  // סריקה כללית הייתה אוספת עותקים גם מ-itemsOnMarket.
  I.stateDevices = function () {
    const SF = I.D.stateFields;
    if (!I.latestState || !SF || !SF.devices) return [];
    const sub = I.latestState[SF.devices];
    if (!sub || typeof sub !== 'object') return [];
    try {
      return I.collect(sub).devices;
    } catch (e) {
      NS.debug.lastError = String(e);
      return [];
    }
  };

  // בעלות על אוגמנט — בדיוק המבחן של המשחק: infinityLifetimeItem.
  // הקטלוג מכיל גם מה שלא נקנה, ולכן חובה לבדוק לפני כל שיגור.
  I.deviceOwned = function (device) {
    const DF = I.D.deviceFields;
    if (!DF || !device) return true;
    const f = DF.infinityLifetimeItem;
    if (!f || !(f in device)) return true;   // לא התגלה -> מתירנים
    return device[f] === true;
  };

  I.rawItemById = function (idStr) {
    if (!I.latestState) return null;
    const F = I.D.itemFields;
    for (const it of I.collect(I.latestState).items) {
      if (I.idToString(it[F.id]) === String(idStr)) return it;
    }
    return null;
  };
})();
