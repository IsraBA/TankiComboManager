// features/combos/main/garage_state.js  [MAIN world]

// קורא את הציוד המצויד כרגע ישירות ממצב המשחק, בלי DOM ובלי ניווט בין טאבים.
//
// המודל של המשחק (ראה ../../../research/CLAUDE.md, "Garage state"):
// המוסך בנוי כמו Redux — יש אובייקט state אחד, data class בשם `Garage`, שמחזיק
// בין השאר `mountedItems`, `items` ו-`devices`. כל פריט הוא `GarageItem` עם
// שדות סמנטיים: id, name, category, preview, owned, וחשוב מכל — `mounted`
// (בוליאני) ו-`mountIndex` (החריץ, מה שמפריד בין 4 מודולי ההגנה).
// כלומר "הקומבו הנוכחי" = כל הפריטים שאצלם mounted === true, מקובצים לפי
// category. זו בדיוק הסלקציה שהמשחק עצמו עושה בקוד שלו.
//
// ארבעה דברים לא יושבים ישירות על הפריט, וכל אחד מהם הגיע ממקום אחר:
//   * **Mk** — על אובייקט ה-modification, בשדה `modificationIndex`. יש שם גם
//     `modificationCount` (כמה Mk קיימים לפריט הזה), שנראה דומה אבל הוא קבוע
//     לכל הפריטים מאותו סוג — לא לקחת אותו. הערך פנימית הוא 0-based;
//     המוסך מציג 1-based (אומת מול המשחק), לכן מוסיפים 1 לתצוגה.
//   * **מיקרו-אפגרייד ("LVL-X")** — `currentLevel` על `upgradeableParams`,
//     והמקסימום ממתודה עליו (20 לדרונים, 45 להגנות וכו').
//   * **אוגמנטים** — המשחק קורא להם **Devices** (המילה "augment" לא קיימת
//     בבאנדל בכלל). כל device נושא `installed` ו-`baseItemId`, שמקשר אותו
//     לתותח/גוף שעליו הוא מורכב. חשוב: **המשחק זוכר אוגמנט מותקן לכל
//     תותח/גוף בנפרד**, גם כשהפריט לא מורכב — לכן ברשימת ה-devices יהיו
//     הרבה installed=true; רק אלה שה-baseItemId שלהם תואם לפריט מורכב
//     שייכים לקומבו הנוכחי (כך גם המשחק עצמו בוחר: מסנן לפי הפריט ואז
//     לוקח את ה-installed).
//   * **סקינים ואפקט ירייה** — שדות `mountedSkin` / `mountedShotSkin` על
//     התותח/גוף מחזיקים **ID של פריט הסקין** (לא אובייקט). ההוכחה מהבאנדל:
//     מתודה על GarageItem שבודקת "האם אני מורכב על t" משווה
//     `t.mountedSkin == this.id || t.mountedShotSkin == this.id`. פריטי
//     הסקין עצמם הם GarageItem רגילים בגרף (קטגוריות SKIN / SKINS_SHOT),
//     והתמונה שלהם יושבת ב-`skinPreview` (עם `preview` כ-fallback — כך
//     בדיוק בוחר גם קוד ה-UI של המשחק).
// והתמונות: `preview`/`skinPreview` אינם מחרוזות אלא אובייקטי משאב עם
// מתודה שבונה כתובת CDN.
//
// איך תופסים את ה-state: אותו טריק מוכח משאר הפיצ'רים — setter על
// Object.prototype על שדה שה-ctor כותב. ה-state נוצר מחדש בכל פעולה (Redux
// אימוטבילי), ולכן ה-trap נשאר מותקן ותמיד שומר את המופע האחרון והטרי.
// שדה הלכידה הוא השדה **האחרון** שה-ctor כותב, כדי שברגע הלכידה האובייקט כבר
// מאוכלס במלואו (הלקח מהלכידה של Scorpion).
//
// כל השמות הממוזערים מתגלים לכל בילד ע"י isolated/detect.js; מה שמופיע כאן
// כ-SEED הוא רק רשת ביטחון לבילד האחרון הידוע, שנותנת כיסוי מיידי בזמן
// שהגילוי רץ. הגילוי דורס אותו.
//
// המודול הזה הוא **קריאה בלבד** — הוא לא קורא לשום פונקציה של המשחק ולא נוגע
// בתעבורה יוצאת. (המתודות היחידות שכן נקראות הן getters טהורים של כתובת
// תמונה ושל רמת מקסימום, ותמיד בתוך try.)

(function () {
  'use strict';

  const W = window;
  const NS = (W.__CMB = W.__CMB || {});

  // ---- שמות seed מהבילד האחרון הידוע (main.1327298e.js) -----------------
  // מוחלפים ע"י מה ש-detect.js מגלה לבילד הרץ.
  const SEED = {
    stateClass: 'MB',
    itemClass: 'sB',
    trapField: 'vq0_1',
    stateFields: {
      itemsOnDepot: 'tpz_1',
      mountedItems: 'vpz_1',
      items: 'xpz_1',
      devices: 'ypz_1',
      isLoaded: 'aq0_1',
      currentCategory: 'bq0_1',
      unlockedProtectionSlots: 'pq0_1',
    },
    itemFields: {
      id: 'ir3_1',
      name: 'jr3_1',
      category: 'kr3_1',
      viewCategory: 'lr3_1',
      preview: 'pr3_1',
      owned: 'rr3_1',
      mounted: 'tr3_1',
      mountIndex: 'ur3_1',
      modification: 'zr3_1',
      upgradeableParams: 'br4_1',
      mountedSkin: 'mr4_1',
      mountedShotSkin: 'nr4_1',
      skinPreview: 'or4_1',
    },
    modificationFields: {
      baseItemId: 'ucd_1',
      modificationCount: 'vcd_1',
      modificationIndex: 'wcd_1',
    },
    upgradeFields: {
      properties: 'cr8_1',
      currentLevel: 'dr8_1',
      upgradeParams: 'er8_1',
    },
    maxLevelMethod: 'wri',
    deviceFields: {
      id: 'jra_1',
      baseItemId: 'kra_1',
      installed: 'lra_1',
      name: 'mra_1',
      category: 'nra_1',
      previewImage: 'sra_1',
    },
    urlMethod: 'r92',
  };

  let D = SEED;            // מפת השמות הפעילה
  let latestState = null;  // מופע ה-state האחרון שנתפס

  // רשימת שדות ה-state, מחושבת מראש. ה-setter של ה-trap הוא נתיב חם (הוא רץ
  // על כל אובייקט במשחק שכותב לשדה באותו שם ממוזער), ולכן אסור שיקצה מערך חדש
  // בכל קריאה. מתעדכן ב-applyNames.
  let stateFieldList = Object.values(SEED.stateFields);

  // מיפוי קטגוריות המשחק לחריצים של הקומבו.
  const CATEGORY_TO_SLOT = {
    WEAPON: 'turret',
    ARMOR: 'hull',
    DRONE: 'drone',
    BAZOOKA: 'grenade',
    RESISTANCE_MODULE: 'protection',
    PAINT: 'paint',
    INVENTORY: 'supply',
    SKIN: 'skin',
    SKINS_SHOT: 'shotSkin',
    KIT: 'kit',
  };

  const MAX_DEPTH = 14;
  const MAX_NODES = 400000;

  NS.debug = {
    discovered: false,
    captures: 0,
    reads: 0,
    lastReadMs: 0,
    lastNodes: 0,
    truncated: false,
    lastError: null,
  };

  // ---- כלי עזר לקריאת ערכים מאובייקטים של קוטלין ------------------------

  // שם של enum: ל-toString של קוטלין מחזיר את שם הערך ("WEAPON"), וזה יציב
  // בין בילדים — בניגוד לשדה הפנימי שמחזיק אותו.
  function enumName(v) {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    try {
      const s = String(v);
      if (/^[A-Z][A-Z0-9_]*$/.test(s)) return s;
    } catch (e) { /* מתעלמים ונופלים לשיטה הבאה */ }
    try {
      for (const k of Object.keys(v)) {
        const val = v[k];
        if (typeof val === 'string' && /^[A-Z][A-Z0-9_]*$/.test(val)) return val;
      }
    } catch (e) { /* אין שם -> null */ }
    return null;
  }

  // מזהה פריט: Long של קוטלין מגיע כאובייקט, אבל ה-toString שלו נכון.
  function idToString(v) {
    if (v == null) return null;
    try { return String(v); } catch (e) { return null; }
  }

  // חיפוש מחרוזת שנראית ככתובת תמונה, בסריקה רדודה. משמש כגיבוי כשמתודת
  // ה-URL לא זמינה או לא החזירה מחרוזת.
  function scanForUrl(v) {
    const strings = [];
    const seen = new Set();
    (function walk(o, depth) {
      if (o == null || depth > 4 || strings.length > 40) return;
      if (typeof o === 'string') { strings.push(o); return; }
      if (typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      try {
        if (Array.isArray(o)) { for (const x of o) walk(x, depth + 1); return; }
        for (const k of Object.keys(o)) walk(o[k], depth + 1);
      } catch (e) { /* אובייקט לא נגיש -> מדלגים */ }
    })(v, 0);
    return strings.find((s) => /\.(png|jpg|jpeg|webp|svg|ktx)/i.test(s)) ||
           strings.find((s) => s.includes('/')) || null;
  }

  // כתובת תמונה: אובייקט ה-preview לא מחזיק מחרוזת אלא מתודה שבונה את הכתובת
  // מתוך רישום המשאבים של המשחק. קוראים לה (getter טהור), ואם משהו משתנה —
  // נופלים לסריקת מחרוזות.
  function imageUrl(res) {
    if (res == null) return null;
    if (typeof res === 'string') return res;
    if (D.urlMethod) {
      try {
        const fn = res[D.urlMethod];
        if (typeof fn === 'function') {
          const v = fn.call(res);
          if (typeof v === 'string' && v) return v;
        }
      } catch (e) { /* נופלים לסריקה */ }
    }
    return scanForUrl(res);
  }

  // מספר בטוח: קוטלין מחזיר לפעמים Long/אובייקט במקום number.
  function numOrNull(v) { return typeof v === 'number' ? v : null; }

  // רמת ה-Mk. חשוב: modificationIndex (מה שמורכב) ולא modificationCount
  // (כמה Mk קיימים לפריט — קבוע לכל הפריטים מאותו סוג).
  // הערך הפנימי הוא 0-based; המוסך מציג 1-based (אומת חי) — לכן 1+.
  function mkLevel(item) {
    const mod = item[D.itemFields.modification];
    const f = D.modificationFields && D.modificationFields.modificationIndex;
    if (mod == null || !f) return null;
    const idx = numOrNull(mod[f]);
    return idx == null ? null : idx + 1;
  }

  // baseItemId — המזהה של "משפחת" הפריט, מה שמקשר אוגמנט לתותח/גוף שעליו הוא
  // מורכב. לפריט משודרג הוא יושב על ה-modification; אחרת המזהה עצמו.
  function baseItemIdOf(item) {
    const mod = item[D.itemFields.modification];
    const f = D.modificationFields && D.modificationFields.baseItemId;
    if (mod != null && f && mod[f] != null) return idToString(mod[f]);
    return idToString(item[D.itemFields.id]);
  }

  // המיקרו-אפגרייד ("LVL-X") והמקסימום שלו.
  function upgradeLevel(item) {
    const up = item[D.itemFields.upgradeableParams];
    if (up == null || !D.upgradeFields) return null;
    return numOrNull(up[D.upgradeFields.currentLevel]);
  }
  function maxUpgradeLevel(item) {
    const up = item[D.itemFields.upgradeableParams];
    if (up == null || !D.maxLevelMethod) return null;
    try {
      const fn = up[D.maxLevelMethod];
      if (typeof fn !== 'function') return null;
      return numOrNull(fn.call(up));
    } catch (e) { return null; }
  }

  // ---- לכידת ה-state ----------------------------------------------------

  // אובייקט נחשב מצב-מוסך אם יש לו את כל שדות ה-state שאנחנו מכירים.
  // בדיקה מבנית כזו היא מה שמונע מה-trap (שהוא פטיש גס) לתפוס אובייקט זר
  // שבמקרה כותב לשדה באותו שם ממוזער.
  function looksLikeState(o) {
    if (!o || typeof o !== 'object') return false;
    if (!stateFieldList.length) return false;
    for (let i = 0; i < stateFieldList.length; i++) {
      if (!(stateFieldList[i] in o)) return false;
    }
    return true;
  }

  const armed = new Set();
  function armTrap(prop) {
    if (!prop || armed.has(prop)) return;
    armed.add(prop);
    try {
      Object.defineProperty(W.Object.prototype, prop, {
        configurable: true, enumerable: false,
        get() { return undefined; },
        set(v) {
          // שומרים כ-own property רגיל, כדי שהאובייקט הזה יפסיק לעבור דרכנו
          Object.defineProperty(this, prop, {
            value: v, writable: true, configurable: true, enumerable: true,
          });
          try {
            if (looksLikeState(this)) {
              latestState = this;
              NS.debug.captures++;
            }
          } catch (e) { NS.debug.lastError = String(e); }
        },
      });
    } catch (e) { NS.debug.lastError = String(e); }
  }

  // ---- איסוף הפריטים והאוגמנטים -----------------------------------------

  // סורק את גרף ה-state פעם אחת ואוסף גם פריטים וגם devices (אוגמנטים).
  // למה סריקה גנרית ולא ניווט ישיר באוספים: האוספים של קוטלין הם מחלקות
  // פנימיות ששמות המתודות שלהן (iterator/hasNext/next) מתחלפות כל בילד.
  // זיהוי לפי מבנה האובייקט עצמו לא תלוי בכלום מזה.
  function collect(root) {
    const IF = D.itemFields;
    const itemNeed = [IF.id, IF.name, IF.category, IF.mounted, IF.mountIndex];
    const DF = D.deviceFields;
    const devNeed = DF ? [DF.id, DF.baseItemId, DF.installed, DF.name] : null;

    const items = [];
    const devices = [];
    const byId = new Map();   // idString -> item, לפתרון סקינים לפי ID
    const seen = new Set();
    const stack = [[root, 0]];
    let nodes = 0;
    let truncated = false;

    while (stack.length) {
      const [obj, depth] = stack.pop();
      if (obj == null || typeof obj !== 'object' || depth > MAX_DEPTH) continue;
      if (seen.has(obj)) continue;
      seen.add(obj);
      if (++nodes > MAX_NODES) { truncated = true; break; }

      let isItem = true;
      for (const f of itemNeed) { if (!(f in obj)) { isItem = false; break; } }
      if (isItem) {   // לא יורדים לתוך פריטים
        items.push(obj);
        const key = idToString(obj[IF.id]);
        if (key != null) byId.set(key, obj);
        continue;
      }

      if (devNeed) {
        let isDev = true;
        for (const f of devNeed) { if (!(f in obj)) { isDev = false; break; } }
        if (isDev) { devices.push(obj); continue; }
      }

      try {
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const v = obj[i];
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

    NS.debug.lastNodes = nodes;
    NS.debug.truncated = truncated;
    return { items, devices, byId };
  }

  // פתרון סקין לפי ID: מאתרים את פריט הסקין באינדקס ומחזירים תקציר שלו.
  // התמונה — skinPreview עם fallback ל-preview (כמו קוד ה-UI של המשחק).
  function resolveSkin(skinId, byId) {
    if (skinId == null) return null;
    const key = idToString(skinId);
    const F = D.itemFields;
    const skinItem = byId.get(key);
    if (!skinItem) {
      // לא נמצא בגרף — נציג את ה-ID כדי שנראה את זה בלוג ונלמד
      return { id: key, name: '(skin id ' + key + ' — not found in state)', image: null };
    }
    const preview = (F.skinPreview != null ? skinItem[F.skinPreview] : null) || skinItem[F.preview];
    return {
      id: key,
      name: skinItem[F.name],
      category: enumName(skinItem[F.category]),
      image: imageUrl(preview),
    };
  }

  function describe(item, byId) {
    const F = D.itemFields;
    const category = enumName(item[F.category]);
    return {
      slot: CATEGORY_TO_SLOT[category] || null,
      category,
      id: idToString(item[F.id]),
      baseItemId: baseItemIdOf(item),
      name: item[F.name],
      mountIndex: item[F.mountIndex],
      mk: mkLevel(item),
      lvl: upgradeLevel(item),
      lvlMax: maxUpgradeLevel(item),
      image: imageUrl(item[F.preview]),
      owned: item[F.owned],
      augment: null,   // מתמלא בהמשך מתוך ה-devices
      skin: F.mountedSkin ? resolveSkin(item[F.mountedSkin], byId) : null,
      shotSkin: F.mountedShotSkin ? resolveSkin(item[F.mountedShotSkin], byId) : null,
    };
  }

  function describeDevice(dev) {
    const F = D.deviceFields;
    return {
      id: idToString(dev[F.id]),
      baseItemId: idToString(dev[F.baseItemId]),
      name: dev[F.name],
      category: enumName(dev[F.category]),
      image: imageUrl(dev[F.previewImage]),
    };
  }

  // ---- הקריאה עצמה ------------------------------------------------------

  function readCombo() {
    const t0 = (W.performance && W.performance.now) ? W.performance.now() : Date.now();
    NS.debug.reads++;

    if (!latestState) {
      return {
        ok: false,
        error: 'garage state not captured yet — enter the garage once, then try again',
      };
    }

    let mounted, augmentsOnUnmounted;
    try {
      const found = collect(latestState);
      const F = D.itemFields;
      const DF = D.deviceFields;

      const mountedRaw = found.items.filter((it) => it[F.mounted] === true);
      mounted = mountedRaw.map((it) => describe(it, found.byId));

      // שיוך האוגמנטים לפריטים לפי baseItemId. מה שנשאר אחרי השיוך הוא
      // תקין לגמרי: אוגמנטים שמותקנים על תותחים/גופים שלא מורכבים כרגע
      // (המשחק זוכר התקנה לכל פריט בנפרד).
      augmentsOnUnmounted = [];
      if (DF) {
        const installed = found.devices.filter((d) => d[DF.installed] === true);
        const byBase = new Map();
        for (const d of installed) byBase.set(idToString(d[DF.baseItemId]), d);

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

    // בונים את הקומבו במבנה שהתוסף כבר משתמש בו (ראה CLAUDE.md, savedCombos).
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
    // סקינים ואפקט ירייה — דקורטיביים, נקראים מהתותח/גוף המורכבים.
    // (ברמת הפריט השדה נקרא shotSkin — כשם הקונספט במשחק, SKINS_SHOT;
    //  ברמת הקומבו השם המוצרי הוא turretShotFx.)
    combo.turretSkin = combo.turret ? combo.turret.skin : null;
    combo.turretShotFx = combo.turret ? combo.turret.shotSkin : null;
    combo.hullSkin = combo.hull ? combo.hull.skin : null;

    const t1 = (W.performance && W.performance.now) ? W.performance.now() : Date.now();
    NS.debug.lastReadMs = Math.round(t1 - t0);

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
  }

  // הדפסה קריאה לקונסול — זה מה שה-POC נמדד עליו.
  function logCombo(res) {
    if (!res.ok) {
      console.warn('[combos] could not read loadout:', res.error);
      return;
    }
    const c = res.combo;
    const rows = [];
    const lvlText = (it) => (it && it.lvl != null
      ? 'LVL-' + it.lvl + (it.lvlMax != null ? '/' + it.lvlMax : '')
      : '');
    const push = (label, it) => rows.push({
      slot: label,
      name: it ? it.name : '—',
      mk: it && it.mk != null ? 'Mk' + it.mk : '',
      lvl: lvlText(it),
      augment: it && it.augment ? it.augment.name : '',
      image: it && it.image ? it.image : '',
    });

    console.group('%c[combos] current loadout — read from game state (POC)',
      'color:#7ee787;font-weight:bold');
    push('turret', c.turret);
    push('turret skin', c.turretSkin);
    push('turret shot fx', c.turretShotFx);
    push('hull', c.hull);
    push('hull skin', c.hullSkin);
    push('grenade', c.grenade);
    push('drone', c.drone);
    push('paint', c.paint);
    c.protection.forEach((p, i) => push('protection ' + (i + 1) + ' (slot ' + p.mountIndex + ')', p));
    console.table(rows);

    if (res.other.length) {
      console.log('%cmounted items not mapped to a combo slot:', 'color:#f0883e');
      console.table(res.other.map((o) => ({ category: o.category, name: o.name, mountIndex: o.mountIndex })));
    }
    if (res.augmentsOnUnmounted && res.augmentsOnUnmounted.length) {
      // אינפורמטיבי, לא בעיה: המשחק זוכר אוגמנט מותקן לכל תותח/גוף בנפרד,
      // אז אלה ההתקנות של הפריטים שלא מורכבים כרגע.
      console.log('%caugments installed on unmounted turrets/hulls (normal — one remembered per item): ' +
        res.augmentsOnUnmounted.length, 'color:#8b949e');
      console.log('%c  ' + res.augmentsOnUnmounted.map((a) => a.name).join(', '), 'color:#8b949e');
    }
    console.log('stats:', res.stats);
    console.log('all mounted items:', res.mounted);
    console.groupEnd();
  }

  // ---- שמות שהתגלו + גשר -----------------------------------------------

  function applyNames(d) {
    D = d;
    stateFieldList = Object.values(d.stateFields);
    NS.debug.discovered = true;
    armTrap(d.trapField);
    // מדפיסים גם אילו קבוצות אופציונליות הגיעו — אם אחת מהן false, העמודה
    // המתאימה בלוג תהיה ריקה וזה המקום הראשון לבדוק (cache ישן / עוגן שנשבר).
    console.log('[combos] using discovered garage-state names for this build:',
      JSON.stringify({
        stateClass: d.stateClass, itemClass: d.itemClass, trapField: d.trapField,
        urlMethod: d.urlMethod || null, maxLevelMethod: d.maxLevelMethod || null,
        hasModification: !!d.modificationFields,
        hasUpgrade: !!d.upgradeFields,
        hasDevices: !!d.deviceFields,
      }));
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'i2m') return;

    if (m.action === 'garageConstants') {
      try { applyNames(m.payload); } catch (err) { NS.debug.lastError = String(err); }
      return;
    }

    if (m.action === 'readCombo') {
      const id = (m.payload || {}).id;
      let res;
      try { res = readCombo(); } catch (err) { res = { ok: false, error: String(err) }; }
      try { logCombo(res); } catch (err) { NS.debug.lastError = String(err); }
      // מחזירים גם לצד ISOLATED — שם ייעשה בהמשך השימוש האמיתי בנתונים
      window.postMessage({
        __cmb: true, dir: 'm2i', action: 'comboResult',
        payload: Object.assign({ id }, res),
      }, '*');
    }
  });

  // ---- API לקונסול ------------------------------------------------------
  NS.read = readCombo;
  NS.log = function () { logCombo(readCombo()); };
  NS.names = function () { return D; };
  NS.state = function () { return latestState; };

  W.__CMB_READ = NS.log;
  W.__CMB_STATE = function () {
    const s = {
      captured: !!latestState,
      names: D,
      debug: NS.debug,
    };
    console.log('[combos] garage-state hook:', s);
    return s;
  };

  // ---- boot -------------------------------------------------------------
  armTrap(SEED.trapField);   // כיסוי מיידי עם שמות ה-seed, עד שהגילוי חוזר
  window.postMessage({ __cmb: true, dir: 'm2i', action: 'ready' }, '*');
  console.log('[combos] garage-state hook armed (read-only). Use __CMB_READ() ' +
    'to print the current loadout, __CMB_STATE() for diagnostics.');
})();
