// features/advisor/recon/game/inventory.js  [MAIN world]

// מודולי ההגנה של החשבון: סוג, אחוז נוכחי, בעלות.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__ADV = W.__ADV || {});
  const I = (NS.internals = NS.internals || {});

  // המספרים באים מהמשחק: ה-toString של המודול מאיית את טווח ההגנה
  const RANGE = /PropertyData \[finalValue = ([\d.]+) initialValue = ([\d.]+) property = ([A-Z_]+_RESISTANCE) \]/;

  // ההגנות המורכבות כרגע, לפי מזהה
  I.mountedProtectionIds = function () {
    const C = W.__CMB && W.__CMB.internals;
    const g = I.garageCol();
    if (!C || !C.currentProtectionSlots || !g) return [];
    try {
      const F = g.D.itemFields;
      return C.currentProtectionSlots(g.col)
        .filter((it) => it)
        .map((it) => C.idToString(it[F.id]));
    } catch (e) {
      NS.debug.lastError = String(e);
      return [];
    }
  };

  // ה-toString של כל מודול יקר, ולכן התוצאה נשמרת לכל גרסת state
  let modCache = { state: null, out: null };

  I.readModules = function () {
    const C = W.__CMB && W.__CMB.internals;
    const g = I.garageCol();
    if (!C || !g) return null;
    if (modCache.state === g.state) return modCache.out;

    const F = g.D.itemFields;
    const out = [];
    // byId מעדיף את העותק שבבעלות על עותק השוק
    for (const it of g.col.byId.values()) {
      if (C.enumName(it[F.category]) !== 'RESISTANCE_MODULE') continue;
      const dump = I.cell(it);
      const m = dump && dump.match(RANGE);
      if (!m) continue;
      const final = Number(m[1]);
      const initial = Number(m[2]);
      const resistance = m[3];
      const level = C.upgradeLevel(it);
      const maxLevel = C.maxUpgradeLevel(it);
      let percent = initial;
      if (level != null && maxLevel) {
        percent = initial + (final - initial) * (level / maxLevel);
      }
      const fm = I.fieldMap(it);
      const bg = fm && fm.resistanceBackgroundImg;
      out.push({
        id: C.idToString(it[F.id]),
        name: I.cell(it[F.name]),
        resistance,
        percent: Math.round(percent),
        owned: it[F.owned] === true,
        icon: bg ? C.imageUrl(it[bg]) : null,
        preview: C.imageUrl(it[F.preview]),
      });
    }
    modCache = { state: g.state, out };
    return out;
  };
})();
