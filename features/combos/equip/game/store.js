// features/combos/equip/game/store.js  [MAIN world]

// איתור ה-store של המשחק, בניית פעולות ואיתור בנאים לפי שם מחלקה.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // שם המחלקה של אובייקט. השמות הממוזערים הם הצהרות פונקציה,
  // ולכן constructor.name מחזיר בדיוק את מה שהגילוי מצא.
  I.ctorNameOf = function (o) {
    try {
      const p = Object.getPrototypeOf(o);
      return p && p.constructor ? p.constructor.name : null;
    } catch (e) { return null; }
  };

  // מאתר store + מתודת שיגור מתוך **קוד המקור** של מתודות הקונטרולר:
  // כולן בצורה this.<store>.<dispatch>(new …), אז אין צורך בגילוי נוסף.
  I.findStore = function () {
    if (I.storeInfo) return I.storeInfo;
    if (!I.garageProxy || !I.D.proxyCcField) return null;
    const controller = I.garageProxy[I.D.proxyCcField];
    if (!controller || typeof controller !== 'object') return null;

    try {
      const proto = Object.getPrototypeOf(controller);
      const counts = new Map();
      for (const k of Object.getOwnPropertyNames(proto)) {
        let fn;
        try { fn = proto[k]; } catch (e) { continue; }
        if (typeof fn !== 'function') continue;
        const m = /this\.([\w$]+_1)\.([\w$]+)\(new /.exec(Function.prototype.toString.call(fn));
        if (!m) continue;
        const key = m[1] + '|' + m[2];
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      // הצירוף השכיח ביותר הוא ה-store ומתודת השיגור
      let best = null, bestN = 0;
      for (const [key, n] of counts) if (n > bestN) { best = key; bestN = n; }
      if (!best) return null;
      const [storeField, dispatchMethod] = best.split('|');
      const store = controller[storeField];
      if (!store || typeof store[dispatchMethod] !== 'function') return null;

      I.storeInfo = { store, dispatch: dispatchMethod, controller };
      NS.debug.storeFound = storeField + '.' + dispatchMethod + '()';
      return I.storeInfo;
    } catch (e) {
      NS.debug.lastError = String(e);
      return null;
    }
  };

  // בונה פעולה ע"י **קריאה לבנאי האמיתי**. אסור Object.create: יש פעולות
  // שההתנהגות שלהן היא closure שנוצר בבנאי, ובלעדיו נוצרת קליפה ריקה
  // שמשוגרת בהצלחה ולא עושה כלום.
  I.buildAction = function (proto, args) {
    const Ctor = proto && proto.constructor;
    if (typeof Ctor !== 'function') throw new Error('action prototype has no constructor');
    return new Ctor(...args);
  };

  // סורק את גרף האובייקטים ומחפש פונקציה בשם הזה. עובד רק לפעולות
  // **מנויות**: הרישום מחזיק KClass שמצביע על הבנאי.
  function findCtorByName(root, name, validate) {
    const seen = new Set();
    const stack = [[root, 0]];
    let nodes = 0;

    while (stack.length) {
      const [o, depth] = stack.pop();
      if (o == null || typeof o !== 'object' || depth > 10) continue;
      if (seen.has(o)) continue;
      seen.add(o);
      if (++nodes > 200000) break;

      const consider = (v) => {
        if (typeof v === 'function') {
          if (v.name === name) { try { if (validate(v)) return v; } catch (e) { /* לא זה */ } }
          return null;
        }
        if (v && typeof v === 'object') stack.push([v, depth + 1]);
        return null;
      };

      try {
        for (const k of Object.keys(o)) {
          let v; try { v = o[k]; } catch (e) { continue; }
          const hit = consider(v);
          if (hit) return hit;
        }
        if (o instanceof Map) {
          for (const v of o.values()) { const hit = consider(v); if (hit) return hit; }
        }
      } catch (e) { /* אובייקט לא נגיש -> מדלגים */ }
    }
    return null;
  }

  // האימות (בניית מופע ניסיון שלא משוגר) הוא מה שהופך את זה לוודאי
  I.resolveActionCtor = function (className, validate) {
    if (!className) return null;
    const si = I.findStore();
    const roots = [];
    if (si) { roots.push(si.controller, si.store); }
    if (I.garageProxy) roots.push(I.garageProxy);
    for (const root of roots) {
      const Ctor = findCtorByName(root, className, validate);
      if (Ctor) return Ctor;
    }
    return null;
  };
})();
