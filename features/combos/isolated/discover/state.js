// features/combos/isolated/discover/state.js  [ISOLATED world]

// גילוי מחלקת ה-state, מחלקת הפריט, שדה הלכידה ושדות הקריאה הנלווים.

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};
  const GD = (window.TankiQoL.GarageDiscover = window.TankiQoL.GarageDiscover || {});

  // בלעדיהם אין טעם להמשיך
  const REQUIRED_STATE = ['mountedItems', 'items', 'isLoaded', 'currentCategory'];
  const REQUIRED_ITEM = ['id', 'name', 'category', 'mounted', 'mountIndex'];

  // מחזיר את הליבה, או null אם משהו בה לא נמצא בוודאות
  GD.discoverState = function (src) {
    // מחלקת ה-state: ה-toString היחיד שפותח ב-"Garage(" ומכיל mountedItems=
    const stateRe = /[\w$]+\(([\w$]+)\)\.toString=function\(\)\{return"Garage\((.*?)"\}/g;
    let stateMatch = null;
    let m;
    while ((m = stateRe.exec(src)) !== null) {
      if (!m[2].includes('mountedItems=')) continue;
      if (stateMatch) return null;   // יותר ממחלקה אחת -> עדיף להיכשל
      stateMatch = m;
    }
    if (!stateMatch) return null;

    const stateClass = stateMatch[1];
    const stateFields = GD.parseFields('itemsOnDepot=' + stateMatch[2]);
    for (const f of REQUIRED_STATE) if (!stateFields[f]) return null;

    const itemRe = /[\w$]+\(([\w$]+)\)\.toString=function\(\)\{return"GarageItem\((.*?)"\}/g;
    let itemMatch = null;
    while ((m = itemRe.exec(src)) !== null) {
      if (itemMatch) return null;
      itemMatch = m;
    }
    if (!itemMatch) return null;

    const itemFields = GD.parseFields('id=' + itemMatch[2]);
    for (const f of REQUIRED_ITEM) if (!itemFields[f]) return null;

    // שדה הלכידה = השדה האחרון שה-ctor כותב. מאמתים שהסדר תואם ל-toString
    // במקום להניח: לכידה על שדה שאינו אחרון תופסת אובייקט חלקי.
    const order = Object.values(stateFields);
    const known = new Set(order);
    const cm = new RegExp('function ' + GD.escapeRe(stateClass) + '\\([^)]*\\)\\{').exec(src);
    if (!cm) return null;

    const tail = src.slice(cm.index, cm.index + 6000);
    const seq = [];
    for (const a of tail.matchAll(/this\.([\w$]+_1)=/g)) {
      if (!known.has(a[1])) { if (seq.length) break; continue; }
      seq.push(a[1]);
    }
    const trapField = seq[seq.length - 1];
    if (!trapField || trapField !== order[order.length - 1]) return null;

    return { trapField, stateFields, itemFields, itemBody: 'id=' + itemMatch[2] };
  };

  // תוספות הקריאה. כישלון באחת מהן משאיר רק את העמודה שלה ריקה.
  GD.discoverReadExtras = function (src, itemFields) {
    const out = {};

    // Mk: למחלקה יש גם modificationCount (כמה Mk קיימים) — לא זה
    const mcc = /toString=function\(\)\{var t="ModificationCC \[";return(.*?)\}/.exec(src);
    if (mcc) out.modificationFields = GD.parseCcFields(mcc[1]);

    const upgradeFields = GD.dataClassFields(src, 'UpgradableItemParams');
    if (upgradeFields && upgradeFields.currentLevel) {
      out.upgradeFields = upgradeFields;
      // הרמה המקסימלית מאחורי מתודה; מתודת ה"האם במקסימום" היא עוגן חד-משמעי
      const mx = new RegExp('\\.[\\w$]+=function\\(\\)\\{return this\\.' +
        GD.escapeRe(upgradeFields.currentLevel) + '===this\\.([\\w$]+)\\(\\)\\}').exec(src);
      if (mx) out.maxLevelMethod = mx[1];
    }

    // אוגמנטים: במשחק Devices, עם installed ו-baseItemId
    const deviceFields = GD.dataClassFields(src, 'GarageDevice');
    if (deviceFields && deviceFields.installed) out.deviceFields = deviceFields;

    // כתובת התמונה: משימוש אמיתי בקוד, מוצלב מול ה-accessor ששמו "url"
    if (itemFields.preview) {
      const counts = {};
      const useRe = new RegExp('\\.' + GD.escapeRe(itemFields.preview) + '\\.([\\w$]+)\\(\\)', 'g');
      let u;
      while ((u = useRe.exec(src)) !== null) counts[u[1]] = (counts[u[1]] || 0) + 1;
      const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const anchor = /\)\.([\w$]+)=function\(\)\{var t=this\.[\w$]+_1;if\(null!=t\)return t;[\w$]+\("url"\)\}/.exec(src);
      out.urlMethod = best || (anchor ? anchor[1] : undefined);
    }

    return out;
  };
})();
