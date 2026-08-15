// features/combos/main/garage/devices.js  [MAIN world]

// אוגמנטים (במשחק: Devices) — התקנה והסרה, עם בדיקת בעלות לפני כל שיגור.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // שתי הפעולות כאן הן ממילא הנמוכות, ושתיהן מעדכנות מקומית *וגם* שולחות
  function resolveDeviceProtos() {
    if (I.deviceInsertProto && I.deviceRemoveProto) return true;
    const D = I.D;
    if (!I.latestState || !D.deviceFields) return false;
    // כל אוגמנט ופריט מספיקים — הם רק דגימה לאימות הבנאי
    const dev = I.collect(I.latestState).devices[0];
    const item = I.collect(I.latestState).items[0];
    if (!dev || !item) return false;

    if (!I.deviceInsertProto && D.deviceInsertClass && D.deviceInsertFields) {
      const F = D.deviceInsertFields;
      const Ctor = I.resolveActionCtor(D.deviceInsertClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(dev, item);
        return p[F.device] === dev && p[F.item] === item;
      });
      if (Ctor) { I.deviceInsertProto = Ctor.prototype; NS.debug.deviceInsertResolved = true; }
    }
    if (!I.deviceRemoveProto && D.deviceRemoveClass && D.deviceRemoveFields) {
      const F = D.deviceRemoveFields;
      const Ctor = I.resolveActionCtor(D.deviceRemoveClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(dev, item);
        return p[F.device] === dev && p[F.item] === item;
      });
      if (Ctor) { I.deviceRemoveProto = Ctor.prototype; NS.debug.deviceRemoveResolved = true; }
    }
    return !!(I.deviceInsertProto && I.deviceRemoveProto);
  }

  // המשחק זוכר אוגמנט מותקן לכל תותח/גוף בנפרד — לכן החיפוש לפי baseItemId
  I.installedDeviceFor = function (rawItem) {
    const DF = I.D.deviceFields;
    if (!DF || !I.latestState) return null;
    const base = I.baseItemIdOf(rawItem);
    for (const d of I.stateDevices()) {
      if (d[DF.installed] !== true) continue;
      if (I.idToString(d[DF.baseItemId]) === base) return d;
    }
    return null;
  };

  // מחיל אוגמנט על פריט. null = בלי אוגמנט. מצוי==רצוי -> אפס פעולות.
  I.applyAugment = function (rawItem, desiredDeviceId) {
    if (!I.latestState) return { ok: false, error: 'garage state not captured' };
    if (!rawItem) return { ok: false, error: 'no item given' };
    if (!resolveDeviceProtos()) {
      return { ok: false, error: 'device actions not available (insert=' +
        !!I.deviceInsertProto + ', remove=' + !!I.deviceRemoveProto + ')' };
    }
    const si = I.findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    const DF = I.D.deviceFields;
    const IF = I.D.itemFields;
    const base = I.baseItemIdOf(rawItem);
    const current = I.installedDeviceFor(rawItem);
    const currentId = current ? I.idToString(current[DF.id]) : null;
    const wantId = desiredDeviceId == null ? null : String(desiredDeviceId);

    if (currentId === wantId) {
      return { ok: true, changed: false, kept: current ? current[DF.name] : null };
    }

    // כל הבדיקות לפני שנוגעים במשהו: ההסרה ראשונה, וכישלון באמצע היה
    // משאיר את הפריט בלי אוגמנט בכלל (בדיוק מה שקרה עם לא-קנויים).
    let wantDev = null;
    if (wantId) {
      for (const d of I.stateDevices()) {
        if (I.idToString(d[DF.id]) === wantId) { wantDev = d; break; }
      }
      if (!wantDev) {
        // הקטלוג של הפריט עוד לא נטען (טעינה עצלה לפי baseItemId)
        return { ok: false, notOwned: true,
          error: 'augment ' + wantId + ' is not in the garage state' };
      }
      if (I.idToString(wantDev[DF.baseItemId]) !== base) {
        return { ok: false, error: 'augment ' + wantDev[DF.name] + ' does not belong to ' +
          rawItem[IF.name] };
      }
      if (!I.deviceOwned(wantDev)) {
        return { ok: false, notOwned: true,
          error: 'augment ' + wantDev[DF.name] + ' is not owned on this account' };
      }
    }

    try {
      if (current) {
        si.store[si.dispatch](I.buildAction(I.deviceRemoveProto, [current, rawItem]));
        NS.debug.devicesRemoved++;
      }
      if (wantDev) {
        si.store[si.dispatch](I.buildAction(I.deviceInsertProto, [wantDev, rawItem]));
        NS.debug.devicesInstalled++;
      }
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }

    return {
      ok: true,
      changed: true,
      item: rawItem[IF.name],
      removed: current ? current[DF.name] : null,
      installed: wantDev ? wantDev[DF.name] : null,
    };
  };
})();
