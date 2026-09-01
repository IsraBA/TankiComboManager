// features/combos/randomizer/game/draw.js  [MAIN world]

// הגרלת קומבו מתוך הציוד שבבעלות, לפי העדפות המשתמש.
// הרציונל: CLAUDE.mds/combos.md

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // "Legendary only" כולל גם EXOTIC — החלטת מוצר, לא שם הדרגה
  const RARE_ENOUGH = { LEGENDARY: true, EXOTIC: true };

  // לסקין ה"רגיל" אין שם משלו — המשחק משאיר את התבנית כמו שהיא
  const STANDARD_SKIN_NAME = '<name>';

  const SEQUENCE = [
    { key: 'turrets', slot: 'turret', category: 'WEAPON',
      augment: 'turretAugment', skin: 'turretSkin' },
    { key: 'hulls', slot: 'hull', category: 'ARMOR',
      augment: 'hullAugment', skin: 'hullSkin' },
    { key: 'grenades', slot: 'grenade', category: 'BAZOOKA', stock: true },
    { key: 'drones', slot: 'drone', category: 'DRONE' },
  ];

  // אוסף קוטלין אינו מערך; מנסים את הצורות שהוא מגיע בהן
  function asArray(coll) {
    if (coll == null) return [];
    if (Array.isArray(coll)) return coll;
    try { if (typeof coll.toArray === 'function') return coll.toArray() || []; } catch (e) { /* הלאה */ }
    try { if (typeof coll[Symbol.iterator] === 'function') return Array.from(coll); } catch (e) { /* הלאה */ }
    try {
      for (const k of Object.keys(coll)) if (Array.isArray(coll[k])) return coll[k];
    } catch (e) { /* אין מה לעשות */ }
    return [];
  }

  function entry(item) {
    if (!item) return null;
    const IF = I.D.itemFields;
    const out = {
      id: I.idToString(item[IF.id]),
      baseItemId: I.baseItemIdOf(item),
      name: item[IF.name] || null,
      image: I.imageUrl(item[IF.preview]),
    };
    const mk = I.mkLevel(item);
    const lvl = I.upgradeLevel(item);
    if (mk != null) out.mk = mk;
    if (lvl != null) out.lvl = lvl;
    return out;
  }

  function deviceEntry(dev) {
    if (!dev) return null;
    const DF = I.D.deviceFields;
    return {
      id: I.idToString(dev[DF.id]),
      baseItemId: I.idToString(dev[DF.baseItemId]),
      name: dev[DF.name] || null,
      image: I.imageUrl(dev[DF.previewImage]),
    };
  }

  // ה-LVL: מריצים את המתודה של המשחק עצמו (currentLevel === maxLevel)
  function levelMaxed(item) {
    const up = item[I.D.itemFields.upgradeableParams];
    if (up == null) return true;   // אין מסלול שדרוג
    const fn = I.D.isMaxedMethod ? up[I.D.isMaxedMethod] : null;
    if (typeof fn === 'function') {
      try { return fn.call(up) === true; } catch (e) { /* נופלים להשוואה */ }
    }
    const lvl = I.upgradeLevel(item);
    const max = I.maxUpgradeLevel(item);
    return lvl == null || max == null || lvl >= max;
  }

  // ה-Mk: למשחק אין מתודה לזה — הוא קורא את שני השדות בנפרד.
  // בלי הבדיקה הזו תותח Mk5 ב-LVL מלא היה נחשב MAX.
  function mkMaxed(item) {
    const MF = I.D.modificationFields;
    const mod = item[I.D.itemFields.modification];
    if (!mod || !MF || !MF.modificationIndex || !MF.modificationCount) return true;
    const idx = I.numOrNull(mod[MF.modificationIndex]);
    const cnt = I.numOrNull(mod[MF.modificationCount]);
    if (idx == null || cnt == null) return true;
    return idx + 1 >= cnt;
  }

  const isMaxed = (item) => mkMaxed(item) && levelMaxed(item);

  // מלאי הרימון אינו על הרימון — count עליו הוא 0 תמיד. הוא יושב על
  // פריט נפרד בקטגוריה GRENADE (הרימון עצמו הוא BAZOOKA), עם אותו שם.
  // כך המשחק מצייר את התג; bazookaToSupply הוא אותו קישור במפת קוטלין.
  function grenadeStockNames(found) {
    const IF = I.D.itemFields;
    const names = new Set();
    for (const it of found.items) {
      if (I.enumName(it[IF.category]) !== 'GRENADE') continue;
      if ((I.numOrNull(it[IF.count]) || 0) <= 0) continue;
      const n = it[IF.name];
      if (n) names.add(String(n).toUpperCase());
    }
    return names;
  }

  function excluded(name, list) {
    if (!name || !list || !list.length) return false;
    const upper = String(name).toUpperCase();
    return list.some((x) => x && upper.includes(String(x).toUpperCase()));
  }

  // משפחה אחת = baseItemId אחד. בלי הקיבוץ פריט עם שבע דרגות Mk
  // היה נשלף בסיכוי פי שבע מפריט בלי דרגות.
  function familiesFor(found, category, opts) {
    const IF = I.D.itemFields;
    const byBase = new Map();
    for (const it of found.items) {
      if (it[IF.owned] !== true) continue;
      if (I.enumName(it[IF.category]) !== category) continue;
      if (excluded(it[IF.name], opts.exclude)) continue;
      if (opts.stock && !opts.stock.has(String(it[IF.name] || '').toUpperCase())) continue;
      const base = I.baseItemIdOf(it);
      const prev = byBase.get(base);
      if (!prev || (I.mkLevel(it) || 0) > (I.mkLevel(prev) || 0)) byBase.set(base, it);
    }
    const out = [];
    for (const it of byBase.values()) {
      if (opts.maxOnly && !isMaxed(it)) continue;
      out.push(it);
    }
    return out;
  }

  function pick(list) {
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }

  function mountedOf(found, category) {
    const IF = I.D.itemFields;
    for (const it of found.items) {
      if (it[IF.mounted] === true && I.enumName(it[IF.category]) === category) return it;
    }
    return null;
  }

  // תמונת סקין: skinPreview עם preview כגיבוי, כמו במסלול הקריאה
  function skinEntry(s) {
    if (!s) return null;
    const IF = I.D.itemFields;
    const preview = (IF.skinPreview != null ? s[IF.skinPreview] : null) || s[IF.preview];
    return {
      id: I.idToString(s[IF.id]),
      name: s[IF.name] || null,
      image: I.imageUrl(preview),
    };
  }

  // רק סקינים שבבעלות. הרגיל לעולם אינו בבעלות — נמדד חי על פריט
  // שכן בבעלות — ולכן הוא נופל מעצמו; ההשוואה לשם היא חגורה שנייה.
  function skinsFor(owner, found) {
    const IF = I.D.itemFields;
    const out = [];
    for (const id of asArray(owner[IF.availableSkins])) {
      const s = found.byId.get(I.idToString(id));
      if (!s || s[IF.owned] !== true) continue;
      if (String(s[IF.name]) === STANDARD_SKIN_NAME) continue;
      out.push(s);
    }
    return out;
  }

  function currentSkinOf(owner, found) {
    const IF = I.D.itemFields;
    if (!IF.mountedSkin) return null;
    const id = I.idToString(owner[IF.mountedSkin]);
    return id == null ? null : (found.byId.get(id) || null);
  }

  function installedDeviceFor(base) {
    const DF = I.D.deviceFields;
    if (!DF) return null;
    for (const d of I.stateDevices()) {
      if (d[DF.installed] === true && I.idToString(d[DF.baseItemId]) === base) return d;
    }
    return null;
  }

  function augmentsFor(base, legendaryOnly) {
    const DF = I.D.deviceFields;
    if (!DF) return [];
    const out = [];
    for (const d of I.stateDevices()) {
      if (I.idToString(d[DF.baseItemId]) !== base) continue;
      if (!I.deviceOwned(d)) continue;
      // "Standard settings" הוא היעדר אוגמנט, לא אוגמנט להגרלה
      if (String(d[DF.name] || '').toUpperCase().includes('STANDARD')) continue;
      if (legendaryOnly && !RARE_ENOUGH[I.enumName(d[DF.rarity])]) continue;
      out.push(d);
    }
    return out;
  }

  // מחזיר {data} לכרטיס ו-{desired} להחלה. חריץ שלא הוגרל נקרא
  // מהמצב הנוכחי, כדי שהכרטיס יתאר את מה שבאמת יהיה מצויד.
  I.drawRandomCombo = async function (settings) {
    if (!I.latestState) return { ok: false, error: 'garage state not captured' };

    const s = settings || {};
    const cats = s.categories || {};
    const adv = s.advanced || {};
    const exclude = s.exclude || {};
    const IF = I.D.itemFields;

    const found = I.collect(I.latestState);
    const inStock = grenadeStockNames(found);
    const data = {};
    const chosen = {};

    for (const c of SEQUENCE) {
      let raw = null;
      if (cats[c.key]) {
        const opts = { stock: c.stock ? inStock : null, exclude: exclude[c.key] };
        let pool = familiesFor(found, c.category,
          Object.assign({ maxOnly: adv.maxEquipmentOnly }, opts));
        // אין בקטגוריה ציוד ממוקסם -> מוותרים על ההעדפה, אחרת
        // הלחיצה לא הייתה עושה כלום והמשתמש לא היה יודע למה
        if (!pool.length && adv.maxEquipmentOnly) {
          pool = familiesFor(found, c.category, opts);
        }
        raw = pick(pool);
      }
      // קטגוריה כבויה, או שאין ממה להגריל בכלל -> נשאר המצויד כרגע
      if (!raw) raw = mountedOf(found, c.category);
      chosen[c.slot] = raw;
      data[c.slot] = entry(raw);
    }

    // הקטלוג נטען בעצלות לפי baseItemId; לפריט שלא נפתח מעולם הוא ריק
    const bases = [];
    for (const c of SEQUENCE) {
      if (!c.augment || !chosen[c.slot]) continue;
      I.requestDeviceCatalog(chosen[c.slot]);
      bases.push(I.baseItemIdOf(chosen[c.slot]));
    }
    if (bases.length) await I.waitForDeviceCatalogs(bases, 2000);

    for (const c of SEQUENCE) {
      if (!c.augment) continue;
      const owner = chosen[c.slot];
      if (!owner) { data[c.augment] = null; continue; }
      const base = I.baseItemIdOf(owner);
      let dev = cats[c.augment] ? pick(augmentsFor(base, adv.legendaryOnly)) : null;
      if (!dev) dev = installedDeviceFor(base);
      data[c.augment] = deviceEntry(dev);
    }

    // סקינים: רק מה שבבעלות לפריט שהוגרל. אין כאלה -> משאירים את
    // מה שכבר עליו, שהוא הרגיל ממילא.
    const drawnSkins = {};
    for (const c of SEQUENCE) {
      if (!c.skin) continue;
      const owner = chosen[c.slot];
      if (!owner) { data[c.skin] = null; continue; }
      const s = cats.skins ? pick(skinsFor(owner, found)) : null;
      if (s) drawnSkins[c.skin] = true;
      data[c.skin] = skinEntry(s || currentSkinOf(owner, found));
    }

    // צבע: מוגרל אם המשתמש ביקש, אחרת נקרא כדי שהכרטיס יהיה שלם
    let paint = null;
    if (cats.paints) paint = pick(familiesFor(found, 'PAINT', {}));
    data.paint = entry(paint || mountedOf(found, 'PAINT'));

    const prot = [null, null, null, null];
    let anyProt = false;
    for (const it of found.items) {
      if (it[IF.mounted] !== true) continue;
      if (I.enumName(it[IF.category]) !== 'RESISTANCE_MODULE') continue;
      const idx = I.numOrNull(it[IF.mountIndex]);
      if (idx == null || idx < 0 || idx > 3) continue;
      prot[idx] = entry(it);
      anyProt = true;
    }
    data.protection = anyProt ? prot : null;

    // ההחלה נוגעת רק במה שהוגרל; protection:null = אל תיגע בהן
    const desired = {
      turret: data.turret,
      hull: data.hull,
      grenade: data.grenade,
      drone: data.drone,
      turretAugment: data.turretAugment,
      hullAugment: data.hullAugment,
      // רק מה שהוגרל; אין טעם לשגר החלה של מה שכבר מורכב
      paint: paint ? data.paint : undefined,
      turretSkin: drawnSkins.turretSkin ? data.turretSkin : undefined,
      hullSkin: drawnSkins.hullSkin ? data.hullSkin : undefined,
      protection: null,
    };

    return { ok: true, data, desired };
  };
})();
