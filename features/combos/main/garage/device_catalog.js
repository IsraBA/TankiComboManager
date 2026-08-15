// features/combos/main/garage/device_catalog.js  [MAIN world]

// קטלוג האוגמנטים נטען בעצלות לפי baseItemId: בקשה מפורשת והמתנה לו.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  I.sleep = function (ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  };

  // ה-thunk של המשחק טוען את הקטלוג אחרי הרכבת תותח/גוף, וההרכבה הנמוכה
  // שלנו מדלגת על זה — בלי ההשלמה הזו אוגמנט של פריט שלא נפתח ידווח
  // unavailable בטעות. הפעולה מזוהה: זו בדיוק זו שה-thunk משגר.
  I.requestDeviceCatalog = function (ownerRaw) {
    const D = I.D;
    const DF = D.deviceFields;
    const IF = D.itemFields;
    if (!DF || !ownerRaw) return false;
    const base = I.baseItemIdOf(ownerRaw);

    for (const d of I.stateDevices()) {
      if (I.idToString(d[DF.baseItemId]) === base) return true;   // כבר טעון
    }

    if (!I.deviceLoadProto) {
      if (!D.deviceLoadClass || !D.deviceLoadFields || !I.latestState) return false;
      const F = D.deviceLoadFields;
      const sampleId = ownerRaw[IF.id];
      const Ctor = I.resolveActionCtor(D.deviceLoadClass, (C) => {
        if (C.length !== 1) return false;
        const p = new C(sampleId);
        return p[F.itemId] === sampleId;
      });
      if (!Ctor) return false;
      I.deviceLoadProto = Ctor.prototype;
    }
    const si = I.findStore();
    if (!si) return false;

    // המזהה הגולמי (Long) של משפחת הפריט — לא המחרוזת
    const mod = ownerRaw[IF.modification];
    const MF = D.modificationFields;
    const rawBase = (mod != null && MF && mod[MF.baseItemId] != null)
      ? mod[MF.baseItemId] : ownerRaw[IF.id];

    try {
      si.store[si.dispatch](I.buildAction(I.deviceLoadProto, [rawBase]));
      NS.debug.catalogRequests++;
      return true;
    } catch (e) {
      NS.debug.lastError = String(e);
      return false;
    }
  };

  // ממתין למה שהמשחק טוען ממילא, עם תקרה ובלי לשגר כלום.
  // בלי זה שמירה מיד אחרי ריענון יוצאת בלי אוגמנטים.
  I.waitForMountedDeviceCatalogs = async function (maxMs) {
    const DF = I.D.deviceFields;
    const IF = I.D.itemFields;
    if (!DF || !I.latestState) return true;

    // רק לתותח ולגוף המורכבים יש בכלל אוגמנטים
    const wanted = [];
    try {
      for (const it of I.collect(I.latestState).items) {
        if (it[IF.mounted] !== true) continue;
        const cat = I.enumName(it[IF.category]);
        if (cat === 'WEAPON' || cat === 'ARMOR') wanted.push(I.baseItemIdOf(it));
      }
    } catch (e) { return true; }
    if (!wanted.length) return true;

    const deadline = Date.now() + (maxMs || 2500);
    for (;;) {
      const have = new Set();
      for (const d of I.stateDevices()) have.add(I.idToString(d[DF.baseItemId]));
      if (wanted.every((b) => have.has(b))) return true;
      if (Date.now() >= deadline) {
        NS.debug.lastError = 'device catalogs not loaded in time for: ' +
          wanted.filter((b) => !have.has(b)).join(', ');
        return false;
      }
      await I.sleep(150);
    }
  };
})();
