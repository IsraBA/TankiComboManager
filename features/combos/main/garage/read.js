// features/combos/main/garage/read.js  [MAIN world]

// קריאת הציוד המורכב ואינדקס המוסך — קריאה בלבד, בלי לשלוח דבר.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__CMB = W.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  const now = () => ((W.performance && W.performance.now) ? W.performance.now() : Date.now());

  // סקין נשמר כמזהה על הפריט; התמונה היא skinPreview עם preview כגיבוי
  function resolveSkin(skinId, byId) {
    if (skinId == null) return null;
    const key = I.idToString(skinId);
    const F = I.D.itemFields;
    const skinItem = byId.get(key);
    if (!skinItem) {
      return { id: key, name: '(skin id ' + key + ' — not found in state)', image: null };
    }
    const preview = (F.skinPreview != null ? skinItem[F.skinPreview] : null) || skinItem[F.preview];
    return {
      id: key,
      name: skinItem[F.name],
      category: I.enumName(skinItem[F.category]),
      image: I.imageUrl(preview),
    };
  }

  function describe(item, byId) {
    const F = I.D.itemFields;
    const category = I.enumName(item[F.category]);
    return {
      slot: I.CATEGORY_TO_SLOT[category] || null,
      category,
      id: I.idToString(item[F.id]),
      baseItemId: I.baseItemIdOf(item),
      name: item[F.name],
      mountIndex: item[F.mountIndex],
      mk: I.mkLevel(item),
      lvl: I.upgradeLevel(item),
      lvlMax: I.maxUpgradeLevel(item),
      image: I.imageUrl(item[F.preview]),
      owned: item[F.owned],
      augment: null,   // מתמלא בהמשך מתוך ה-devices
      skin: F.mountedSkin ? resolveSkin(item[F.mountedSkin], byId) : null,
      shotSkin: F.mountedShotSkin ? resolveSkin(item[F.mountedShotSkin], byId) : null,
    };
  }

  function describeDevice(dev) {
    const F = I.D.deviceFields;
    return {
      id: I.idToString(dev[F.id]),
      baseItemId: I.idToString(dev[F.baseItemId]),
      name: dev[F.name],
      category: I.enumName(dev[F.category]),
      image: I.imageUrl(dev[F.previewImage]),
    };
  }

  // הקומבו הנוכחי = כל פריט עם mounted===true, מקובץ לפי category
  I.readCombo = function () {
    const t0 = now();
    NS.debug.reads++;

    if (!I.latestState) {
      return {
        ok: false,
        error: 'garage state not captured yet — enter the garage once, then try again',
      };
    }

    let mounted, augmentsOnUnmounted;
    try {
      const found = I.collect(I.latestState);
      const F = I.D.itemFields;
      const DF = I.D.deviceFields;

      const mountedRaw = found.items.filter((it) => it[F.mounted] === true);
      mounted = mountedRaw.map((it) => describe(it, found.byId));

      // שיוך אוגמנטים לפי baseItemId. מה שנשאר שייך לפריטים לא מורכבים,
      // וזה תקין — המשחק זוכר התקנה לכל פריט בנפרד.
      augmentsOnUnmounted = [];
      if (DF) {
        const installed = I.stateDevices().filter((d) => d[DF.installed] === true);
        const byBase = new Map();
        for (const d of installed) byBase.set(I.idToString(d[DF.baseItemId]), d);

        for (let i = 0; i < mountedRaw.length; i++) {
          const dev = byBase.get(mounted[i].baseItemId);
          if (dev) {
            mounted[i].augment = describeDevice(dev);
            byBase.delete(mounted[i].baseItemId);
          }
        }
        augmentsOnUnmounted = [...byBase.values()].map(describeDevice);
      }
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }

    const combo = {
      turret: null, turretAugment: null,
      hull: null, hullAugment: null,
      grenade: null, drone: null,
      paint: null,
      protection: [],
    };
    const other = [];

    for (const it of mounted) {
      if (it.slot === 'protection') combo.protection.push(it);
      else if (it.slot && it.slot in combo) combo[it.slot] = it;
      else other.push(it);
    }
    combo.protection.sort((a, b) => (a.mountIndex || 0) - (b.mountIndex || 0));
    combo.turretAugment = combo.turret ? combo.turret.augment : null;
    combo.hullAugment = combo.hull ? combo.hull.augment : null;
    // אפקט הירייה נקרא ונשאר ב-res.mounted, אבל אינו חריץ בקומבו
    combo.turretSkin = combo.turret ? combo.turret.skin : null;
    combo.hullSkin = combo.hull ? combo.hull.skin : null;

    NS.debug.lastReadMs = Math.round(now() - t0);

    return {
      ok: true,
      combo,
      mounted,
      other,
      augmentsOnUnmounted,
      stats: {
        ms: NS.debug.lastReadMs,
        nodesScanned: NS.debug.lastNodes,
        truncated: NS.debug.truncated,
        mountedCount: mounted.length,
        discovered: NS.debug.discovered,
      },
    };
  };

  // אינדקס שטוח למיגרציה של קומבואים ישנים (שם -> מזהה).
  // כולל מה שאינו בבעלות, עם דגל: המזהה הוא עובדה על המשחק ולא על המשתמש.
  I.readIndex = function () {
    if (!I.latestState) {
      return { ok: false, error: 'garage state not captured yet' };
    }
    try {
      const IF = I.D.itemFields;
      const DF = I.D.deviceFields;
      const found = I.collect(I.latestState);

      const items = [];
      for (const it of found.items) {
        items.push({
          id: I.idToString(it[IF.id]),
          baseItemId: I.baseItemIdOf(it),
          name: it[IF.name],
          category: I.enumName(it[IF.category]),
          mk: I.mkLevel(it),
          owned: it[IF.owned] === true,
        });
      }

      const devices = [];
      if (DF) {
        for (const d of I.stateDevices()) {
          devices.push({
            id: I.idToString(d[DF.id]),
            baseItemId: I.idToString(d[DF.baseItemId]),
            name: d[DF.name],
            owned: I.deviceOwned(d),
          });
        }
      }
      return { ok: true, items, devices };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  };

  NS.read = I.readCombo;
  NS.index = I.readIndex;
})();
