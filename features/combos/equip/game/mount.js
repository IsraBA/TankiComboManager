// features/combos/equip/game/mount.js  [MAIN world]

// הרכבת פריט בפעולה של המשחק עצמו, ובחירתו כדי שמודל התלת-ממד יעקוב.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  I.looksLikeMountAction = function (o) {
    const D = I.D;
    if (!o || typeof o !== 'object') return false;
    if (!D.actionItemField || !D.actionNeedServerField) return false;
    if (D.mountActionClass && I.ctorNameOf(o) === D.mountActionClass) return true;
    if (!(D.actionItemField in o)) return false;
    // אחרת: השדה הראשון חייב להחזיק אובייקט שנראה כמו פריט מוסך
    const item = o[D.actionItemField];
    return !!item && typeof item === 'object' &&
           (D.itemFields.id in item) && (D.itemFields.mounted in item);
  };

  // המלכודת יורה **תוך כדי הבנאי**, ואז כבר יש שדות ממחלקת הבסיס —
  // ולכן בדיקה לפי מספר שדות תיכשל תמיד. משווים שם מחלקה.
  I.looksLikeSelectAction = function (o) {
    if (!o || typeof o !== 'object' || !I.D.selectActionClass) return false;
    return I.ctorNameOf(o) === I.D.selectActionClass;
  };

  // בלי זה היה צריך שהמשתמש יחליף פריט ידנית פעם אחת בכל סשן
  I.resolveMountActionProto = function () {
    const D = I.D;
    if (I.mountActionProto) return I.mountActionProto;
    if (!D.mountActionClass || !I.latestState) return null;

    const items = I.collect(I.latestState).items;
    const sample = items && items.length ? items[0] : null;
    if (!sample) return null;

    const Ctor = I.resolveActionCtor(D.mountActionClass, (C) => {
      if (C.length !== 2) return false;
      const probe = new C(sample, false);
      return probe[D.actionItemField] === sample &&
             probe[D.actionNeedServerField] === false;
    });
    if (!Ctor) return null;

    I.mountActionProto = Ctor.prototype;
    NS.debug.mountActionCaptured = true;
    NS.debug.mountActionSource = 'resolved-by-name';
    return I.mountActionProto;
  };

  // needServer=false מעדכן **רק מקומית** ולא שולח כלום החוצה.
  // ההרכבה לבדה לא מזיזה את המודל — הבחירה היא שמזיזה אותו.
  I.mountViaAction = function (rawItem, needServer) {
    if (!I.mountActionProto) I.resolveMountActionProto();
    if (!I.mountActionProto) {
      return { ok: false, error: 'mount-action template not available (equip one item manually once, then retry)' };
    }
    const si = I.findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    try {
      si.store[si.dispatch](I.buildAction(I.mountActionProto, [rawItem, !!needServer]));
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }

    // רענון המודל נכשל בשקט — ההרכבה עצמה כבר הצליחה
    const refreshed = I.selectItem(rawItem);
    return { ok: true, previewRefreshed: refreshed };
  };

  I.selectItem = function (rawItem) {
    if (!I.selectActionProto || !I.D.selectItemIdField) return false;
    const si = I.findStore();
    if (!si) return false;
    try {
      si.store[si.dispatch](I.buildAction(I.selectActionProto, [rawItem[I.D.itemFields.id]]));
      NS.debug.selectsSent++;
      return true;
    } catch (e) {
      NS.debug.lastError = String(e);
      return false;
    }
  };
})();
