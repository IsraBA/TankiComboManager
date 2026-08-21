// features/combos/capture/game/capture.js  [MAIN world]

// מלכודות Object.prototype שתופסות את מצב המוסך ואת תבניות הפעולות.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__CMB = W.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // בדיקה מבנית היא מה שמונע מהמלכודת לתפוס אובייקט זר עם אותו שם שדה
  function looksLikeState(o) {
    if (!o || typeof o !== 'object') return false;
    const list = I.stateFieldList;
    if (!list.length) return false;
    for (let i = 0; i < list.length; i++) {
      if (!(list[i] in o)) return false;
    }
    return true;
  }

  function looksLikeProxy(o) {
    if (!o || typeof o !== 'object' || !I.D.proxyMountMethod) return false;
    const proto = Object.getPrototypeOf(o);
    if (!proto) return false;
    for (const m of (I.D.proxyMethods || [I.D.proxyMountMethod])) {
      if (typeof proto[m] !== 'function') return false;
    }
    return true;
  }

  // מלכודת גנרית: לכל שדה בודק ומטפל משלו
  const armed = new Map();
  function armTrap(prop, check, onCapture) {
    if (!prop || armed.has(prop)) return;
    armed.set(prop, true);
    try {
      Object.defineProperty(W.Object.prototype, prop, {
        configurable: true, enumerable: false,
        get() { return undefined; },
        set(v) {
          // שומרים כ-own property, כדי שהאובייקט יפסיק לעבור דרכנו
          Object.defineProperty(this, prop, {
            value: v, writable: true, configurable: true, enumerable: true,
          });
          try {
            if (check(this)) onCapture(this);
          } catch (e) { NS.debug.lastError = String(e); }
        },
      });
    } catch (e) { NS.debug.lastError = String(e); }
  }

  // ה-state נוצר מחדש בכל פעולה, ולכן המלכודת נשארת ותמיד מחזיקה את האחרון
  I.armAll = function () {
    armTrap(I.D.trapField, looksLikeState, (o) => {
      I.latestState = o;
      NS.debug.captures++;
    });
    // ה-proxy נדרש כדי להגיע לקונטרולר, ומשם ל-store
    armTrap(I.D.proxyTrapField, looksLikeProxy, (o) => {
      I.garageProxy = o;
      NS.debug.proxyCaptured = true;
    });
    // תבנית ההרכבה — נלכדת בפעם הראשונה שהמשחק מרכיב פריט בעצמו
    armTrap(I.D.actionNeedServerField, I.looksLikeMountAction, (o) => {
      if (I.mountActionProto) return;
      I.mountActionProto = Object.getPrototypeOf(o);
      NS.debug.mountActionCaptured = true;
      NS.debug.mountActionSource = 'trapped-on-real-mount';
    });
    // תבנית הבחירה — נלכדת כשהמשתמש לוחץ על פריט כלשהו במוסך
    armTrap(I.D.selectItemIdField, I.looksLikeSelectAction, (o) => {
      if (I.selectActionProto) return;
      I.selectActionProto = Object.getPrototypeOf(o);
      NS.debug.selectActionCaptured = true;
    });
  };
})();
