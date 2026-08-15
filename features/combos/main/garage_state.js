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
// הקריאה עצמה היא קריאה בלבד: היא לא קוראת לשום פונקציה של המשחק ולא נוגעת
// בתעבורה יוצאת (המתודות היחידות שכן נקראות הן getters טהורים של כתובת תמונה
// ושל רמת מקסימום, ותמיד בתוך try). בהמשך הקובץ יש גם **מסלול כתיבה** —
// הרכבת פריט והרכבת/הסרת הגנות — שכולו עובד ע"י שיגור הפעולות של המשחק
// עצמו דרך ה-store שלו. הוא עדיין לא מחווט לשום כפתור; הכניסה אליו היא
// דרך פונקציות הקונסול בסוף הקובץ.

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
      // דגל הבעלות. השם מטעה — במשחק זהו בדיוק המבחן קנוי/לא-קנוי:
      // iri() = infinityLifetimeItem ? BOUGHT : NOT_OWNED (שמות ה-enum
      // מופיעים בבאנדל כמחרוזות). state.devices מחזיק את הקטלוג המלא של
      // כל פריט — קנויים ולא-קנויים יחד — ולכן חובה לסנן לפי השדה הזה.
      infinityLifetimeItem: 'arb_1',
    },
    urlMethod: 'r92',
    // מסלול השליחה לשרת (הרכבה מיידית) — ראה isolated/detect.js
    proxyClass: 'M_',
    proxyTrapField: 'ccn_1',
    proxyMountMethod: 'ecn',
    proxyMethods: ['ecn', 'fcn', 'gcn', 'hcn'],
    spaceClass: 'Vr',
    spaceTrapField: 'y7p_1',
    spaceLookupMethod: 'b7n',
    spaceEnsureMethod: 'x7o',
    ctxClass: 'zi',
    ctxTrapField: 'e7j_1',
    ctxPushMethod: 'f7j',
    ctxGetMethod: 'g7j',
    ctxPopMethod: 'h7j',
    ctxCurrentField: 'd7j_1',
    proxyCcField: 'dcn_1',
    mountActionClass: '$U',
    actionItemField: 'vrd_1',
    actionNeedServerField: 'wrd_1',
    selectActionClass: 'KB',
    selectItemIdField: 'brc_1',
    // פעולות ההגנות. הנמוכות (apply/unmount) הן מה שאנחנו משגרים; שמות
    // ה-thunks נשמרים לתיעוד. ראה isolated/detect.js להסבר הטקסונומיה.
    resistApplyClass: 'FU',
    resistApplyFields: { resistance: 'kre_1', index: 'lre_1', needServerMount: 'mre_1' },
    resistUnmountClass: 'QB',
    resistUnmountFields: { resistance: 'mrc_1', needServerUnmount: 'nrc_1' },
    resistMountClass: 'tU',
    resistMountFields: { resistance: 'prc_1', index: 'qrc_1' },
    mountThunkClass: 'JB',
    mountThunkFields: { item: 'jrc_1', needServerMount: 'krc_1' },
    // פעולות האוגמנטים (Devices)
    deviceInsertClass: 'CF',
    deviceInsertFields: { device: 'gri_1', item: 'hri_1' },
    deviceRemoveClass: 'SF',
    deviceRemoveFields: { device: 'irg_1', item: 'jrg_1' },
    deviceLoadClass: 'vU',
    deviceLoadFields: { itemId: 'hrd_1' },
    // החלת סקין — מערכת בצורת האוגמנטים, לא הרכבת פריט
    skinMountClass: 'lU',
    skinMountFields: { skin: 'erd_1', item: 'frd_1' },
  };

  let D = SEED;            // מפת השמות הפעילה
  let latestState = null;  // מופע ה-state האחרון שנתפס
  let garageProxy = null;  // ה-proxy של המוסך — עליו מתודת שליחת mountItem
  let space = null;        // מרשם הישויות — ממיר מזהה פריט לישות רשת
  let ctx = null;          // מחסנית ההקשר — ממענת את הפקודה היוצאת
  let garageObject = null; // ישות המוסך, שאליה הפקודה ממוענת (נמצאת פעם אחת)
  let mountActionProto = null;  // הפרוטוטייפ של פעולת ההרכבה הפנימית
  let selectActionProto = null; // הפרוטוטייפ של פעולת "בחר פריט" (מרעננת את מודל התלת-ממד)
  let resistApplyProto = null;  // GarageApplyResistanceMount — הרכבת הגנה בחריץ
  let resistUnmountProto = null;// GarageResistanceUnMount — הסרת הגנה
  let deviceInsertProto = null; // GarageInsertDeviceClientAndServer — התקנת אוגמנט
  let deviceRemoveProto = null; // GarageRemoveDevice — הסרת אוגמנט
  let deviceLoadProto = null;   // GarageLoadAvailableDevices — בקשת קטלוג אוגמנטים
  let skinMountProto = null;    // החלת סקין על תותח/גוף
  let storeInfo = null;         // {store, dispatch} — לשיגור הפעולה

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

  // גבולות הסריקה. העומק הועלה מ-14 אחרי שהתברר שהוא חתך ענפים באוסף
  // הפריטים בשקט: אוספי קוטלין הם עצים, וענף עמוק אחד שנקטע נראה בדיוק כמו
  // "המשתמש לא מחזיק את הפריט". החיתוך נספר עכשיו ב-debug.depthCut.
  const MAX_DEPTH = 24;
  const MAX_NODES = 400000;

  NS.debug = {
    discovered: false,
    proxyCaptured: false,
    spaceCaptured: false,
    ctxCaptured: false,
    garageObjectFound: false,
    garageObjectSource: null,
    mountActionCaptured: false,
    mountActionSource: null,
    selectActionCaptured: false,
    selectsSent: 0,
    storeFound: null,
    mountsSent: 0,
    resistApplyResolved: false,
    resistUnmountResolved: false,
    resistMountsSent: 0,
    resistUnmountsSent: 0,
    deviceInsertResolved: false,
    deviceRemoveResolved: false,
    devicesInstalled: 0,
    devicesRemoved: 0,
    catalogRequests: 0,
    skinMountResolved: false,
    skinsApplied: 0,
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

  // ה-proxy של המוסך: מזוהה לפי מתודות השליחה שעל הפרוטוטייפ שלו.
  function looksLikeProxy(o) {
    if (!o || typeof o !== 'object' || !D.proxyMountMethod) return false;
    const proto = Object.getPrototypeOf(o);
    if (!proto) return false;
    for (const m of (D.proxyMethods || [D.proxyMountMethod])) {
      if (typeof proto[m] !== 'function') return false;
    }
    return true;
  }

  // ה-Space: מזוהה לפי מתודת החיפוש ומתודת ה"שלוף-או-זרוק".
  function looksLikeSpace(o) {
    if (!o || typeof o !== 'object' || !D.spaceLookupMethod) return false;
    const proto = Object.getPrototypeOf(o);
    if (!proto) return false;
    return typeof proto[D.spaceLookupMethod] === 'function' &&
           typeof proto[D.spaceEnsureMethod] === 'function';
  }

  // מלכודת גנרית: כל שדה מקבל בודק ומטפל משלו. השדות שונים זה מזה, ולכן
  // אין התנגשות; הבדיקה המבנית היא מה שמונע לכידה של אובייקט זר שבמקרה
  // כותב לשדה באותו שם ממוזער.
  const armed = new Map();
  function armTrap(prop, check, onCapture) {
    if (!prop || armed.has(prop)) return;
    armed.set(prop, true);
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
            if (check(this)) onCapture(this);
          } catch (e) { NS.debug.lastError = String(e); }
        },
      });
    } catch (e) { NS.debug.lastError = String(e); }
  }

  // מחסנית ההקשר: מזוהה לפי שלוש המתודות push/get/pop שעל הפרוטוטייפ.
  function looksLikeCtx(o) {
    if (!o || typeof o !== 'object' || !D.ctxPushMethod) return false;
    const proto = Object.getPrototypeOf(o);
    if (!proto) return false;
    return typeof proto[D.ctxPushMethod] === 'function' &&
           typeof proto[D.ctxGetMethod] === 'function' &&
           typeof proto[D.ctxPopMethod] === 'function';
  }

  // התקנת כל המלכודות לפי מפת השמות הפעילה
  function armAll() {
    armTrap(D.trapField, looksLikeState, (o) => {
      latestState = o;
      NS.debug.captures++;
      // מצב המוסך השתנה — סימן טוב לכך שישות המוסך נמצאת עכשיו בהקשר
      noteCtxCandidate();
    });
    armTrap(D.proxyTrapField, looksLikeProxy, (o) => {
      garageProxy = o;
      NS.debug.proxyCaptured = true;
      wrapProxyForLearning(o);
    });
    armTrap(D.spaceTrapField, looksLikeSpace, (o) => {
      space = o;
      NS.debug.spaceCaptured = true;
    });
    armTrap(D.ctxTrapField, looksLikeCtx, (o) => {
      ctx = o;
      NS.debug.ctxCaptured = true;
    });
    // תבנית פעולת ההרכבה — נלכדת בפעם הראשונה שהמשחק מרכיב פריט בעצמו
    armTrap(D.actionNeedServerField, looksLikeMountAction, (o) => {
      if (mountActionProto) return;
      mountActionProto = Object.getPrototypeOf(o);
      NS.debug.mountActionCaptured = true;
      NS.debug.mountActionSource = 'trapped-on-real-mount';
      console.log('%c[combos] captured the game\'s mount action — instant equip is now available.',
        'color:#7ee787;font-weight:bold');
    });
    // תבנית פעולת הבחירה — נלכדת כשהמשתמש לוחץ על פריט כלשהו במוסך.
    // ה-check גם רושם אילו מחלקות כותבות לשדה הזה, כדי שאם הזיהוי נכשל
    // נדע מיד מה כן עובר שם (ראה __CMB_DIAG).
    armTrap(D.selectItemIdField, (o) => {
      const n = ctorNameOf(o);
      if (n && selectTrapSeen.size < 30) {
        selectTrapSeen.set(n, (selectTrapSeen.get(n) || 0) + 1);
      }
      return looksLikeSelectAction(o);
    }, (o) => {
      if (selectActionProto) return;
      selectActionProto = Object.getPrototypeOf(o);
      NS.debug.selectActionCaptured = true;
      console.log('%c[combos] captured the game\'s select action — 3D preview will now follow.',
        'color:#7ee787;font-weight:bold');
    });
  }

  // ---- איתור ישות המוסך ------------------------------------------------
  //
  // הפקודה היוצאת ממוענת לישות שנמצאת בהקשר ברגע השליחה — ישות המוסך.
  // חשוב להבין למה אי אפשר "לחפש" אותה: ה-proxy הוא **סינגלטון משותף**
  // (ה-ctor שלו לא מקבל דבר מלבד קבועי hash), הוא לא מחובר לשום ישות,
  // וכל המיעון נעשה דרך ההקשר. כלומר אין קשר ישיר proxy->ישות לחפש.
  //
  // לכן לומדים מהמשחק עצמו, בשתי דרכים משלימות:
  //   1. **ודאית** — עוטפים את מתודות השליחה של ה-proxy. כשהמשחק שולח
  //      פקודת מוסך כלשהי, מה שנמצא בהקשר באותו רגע הוא בהגדרה הישות
  //      הנכונה. זה המקור המועדף.
  //   2. **הסתברותית** — מונים איזו ישות נמצאת בהקשר כשמצב המוסך משתנה.
  //      שינויי מצב מוסך מגיעים כמעט תמיד מפקודות מוסך נכנסות, שהמסגרת
  //      דוחפת עבורן את ישות המוסך. הישות השכיחה ביותר היא זו.
  //
  // מועמד נחשב "ישות" רק אם הפרוטוטייפ שלו זהה לזה של ישות פריט ידועה
  // (מתקבלת מחיפוש במרשם) — בדיקה מדויקת שלא תלויה בשום שם ממוזער.
  const selectTrapSeen = new Map();  // שם מחלקה -> כמה פעמים כתבה לשדה הבחירה
  const ctxCandidates = new Map();   // ישות -> מספר פעמים שנראתה בהקשר
  let definitiveGarageObject = null; // מהמקור הוודאי (עטיפת ה-proxy)
  let gameObjectProto = null;        // הפרוטוטייפ של ישות, לזיהוי מועמדים

  function currentCtxObject() {
    try {
      return ctx && D.ctxCurrentField ? ctx[D.ctxCurrentField] : null;
    } catch (e) { return null; }
  }

  // לומדים את הפרוטוטייפ של ישות מתוך ישות אמיתית של פריט כלשהו
  function learnGameObjectProto() {
    if (gameObjectProto || !space || !latestState) return gameObjectProto;
    try {
      const F = D.itemFields;
      const items = collect(latestState).items;
      for (const it of items) {
        const ent = space[D.spaceLookupMethod](it[F.id]);
        if (ent && typeof ent === 'object') {
          gameObjectProto = Object.getPrototypeOf(ent);
          break;
        }
      }
    } catch (e) { NS.debug.lastError = String(e); }
    return gameObjectProto;
  }

  function isGameObject(o) {
    return !!o && typeof o === 'object' && gameObjectProto != null &&
           Object.getPrototypeOf(o) === gameObjectProto;
  }

  // נרשם בכל פעם שמצב המוסך משתנה — מונה את הישות שבהקשר
  function noteCtxCandidate() {
    const o = currentCtxObject();
    if (!o || typeof o !== 'object') return;
    ctxCandidates.set(o, (ctxCandidates.get(o) || 0) + 1);
    if (ctxCandidates.size > 40) {   // תקרה, שלא נחזיק הפניות לנצח
      const weakest = [...ctxCandidates.entries()].sort((a, b) => a[1] - b[1])[0];
      if (weakest) ctxCandidates.delete(weakest[0]);
    }
  }

  function findGarageObject() {
    if (definitiveGarageObject) {
      NS.debug.garageObjectSource = 'proxy-call';
      return definitiveGarageObject;
    }
    learnGameObjectProto();
    let best = null, bestCount = 0;
    for (const [o, n] of ctxCandidates) {
      if (!isGameObject(o)) continue;
      if (n > bestCount) { best = o; bestCount = n; }
    }
    if (best) {
      NS.debug.garageObjectSource = 'context-frequency(' + bestCount + ')';
      return best;
    }
    return null;
  }

  // עוטפים את מתודות השליחה של ה-proxy כדי ללמוד את הישות הנכונה בוודאות
  function wrapProxyForLearning(proxy) {
    for (const m of (D.proxyMethods || [])) {
      try {
        const proto = Object.getPrototypeOf(proxy);
        const orig = proto[m];
        if (typeof orig !== 'function') continue;
        Object.defineProperty(proxy, m, {
          configurable: true, writable: true, enumerable: false,
          value: function () {
            try {
              const o = currentCtxObject();
              if (o && typeof o === 'object') {
                definitiveGarageObject = o;
                NS.debug.garageObjectFound = true;
              }
            } catch (e) { /* לא מפריעים למשחק */ }
            return orig.apply(this, arguments);
          },
        });
      } catch (e) { NS.debug.lastError = String(e); }
    }
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
    let depthCut = 0;

    while (stack.length) {
      const [obj, depth] = stack.pop();
      if (obj == null || typeof obj !== 'object') continue;
      // חיתוך עומק היה שקט לגמרי, ולכן מונים אותו: ענף שנקטע פירושו פריטים
      // חסרים באוסף, וזה נראה בדיוק כמו "המשתמש לא מחזיק את זה".
      if (depth > MAX_DEPTH) { depthCut++; continue; }
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

      // Map/Set: אוספים כאלה לא חושפים את תוכנם ב-Object.keys, ולכן בלי
      // הענפים האלה ענף שלם של הגרף פשוט לא נסרק — וזה נראה בדיוק כמו
      // "המשתמש לא מחזיק את הפריט".
      try {
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const v = obj[i];
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        } else if (obj instanceof Map) {
          for (const v of obj.values()) {
            if (v && typeof v === 'object') stack.push([v, depth + 1]);
          }
        } else if (obj instanceof Set) {
          for (const v of obj) {
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

    NS.debug.depthCut = depthCut;
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
        // מהרשימה הקנונית בלבד — סריקה כללית אוספת עותקים גם מהחנות
        const installed = stateDevices().filter((d) => d[DF.installed] === true);
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
    // סקינים — דקורטיביים, נקראים מהתותח/גוף המורכבים.
    // אפקט הירייה (shotSkin ברמת הפריט) נקרא ונשאר זמין ב-res.mounted, אבל
    // **אינו חריץ בקומבו** — החלטה מוצרית: הוא לא נשמר, לא מוצג ולא מוחל.
    combo.turretSkin = combo.turret ? combo.turret.skin : null;
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

  // ---- אינדקס המוסך ------------------------------------------------------
  //
  // רשימה שטוחה של כל הפריטים שבמצב המוסך, לצד ISOLATED. נועדה למיגרציה של
  // קומבואים ישנים: הם נשמרו עם שם בלבד, וכאן נמצא מה שמתרגם שם -> מזהה.
  //
  // **כולל פריטים שאינם בבעלות** ומסמן זאת בדגל: המוסך מציג גם את מה שלא
  // קנית (למכירה), אז המידע קיים ממילא. המזהה הוא עובדה על המשחק ולא על
  // המשתמש, ולכן אין סיבה לא להשלים אותו — קומבו שיובא מחשבון אחר נפתר
  // במלואו, ואם הפריט ייקנה בעתיד הוא פשוט יעבוד. הצרכן מחליט מה לעשות
  // עם הדגל.
  function readIndex() {
    if (!latestState) {
      return { ok: false, error: 'garage state not captured yet' };
    }
    try {
      const IF = D.itemFields;
      const DF = D.deviceFields;
      const found = collect(latestState);

      const items = [];
      for (const it of found.items) {
        items.push({
          id: idToString(it[IF.id]),
          baseItemId: baseItemIdOf(it),
          name: it[IF.name],
          category: enumName(it[IF.category]),
          mk: mkLevel(it),
          owned: it[IF.owned] === true,
        });
      }

      // אוגמנטים: הקטלוג הקנוני, עם דגל בעלות — כמו הפריטים. המיגרציה
      // פותרת מזהים גם ללא-קנויים (מזהה הוא עובדה על המשחק), וההצטיידות
      // היא שמסרבת לצייד את מה שלא קנוי.
      const devices = [];
      if (DF) {
        for (const d of stateDevices()) {
          devices.push({
            id: idToString(d[DF.id]),
            baseItemId: idToString(d[DF.baseItemId]),
            name: d[DF.name],
            owned: deviceOwned(d),
          });
        }
      }
      return { ok: true, items, devices };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
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

  // ---- שיגור פעולת ההרכבה הפנימית של המשחק ------------------------------
  //
  // זה היעד האמיתי: הפעולה הזו עושה את **שני** הדברים — מעדכנת את ה-state
  // המקומי (ולכן את המסך) *וגם* מפעילה את השליחה לשרת עם ההקשר הנכון.
  // כלומר במקום התזמור הידני שלנו (הקשר -> שליחה -> וה-UI נשאר ישן),
  // קריאה אחת שמתנהגת בדיוק כמו לחיצה על Equip במשחק.
  //
  // המכשול היחיד: אי אפשר לבנות אובייקט של מחלקה שיושבת בתוך המודול הסגור
  // של המשחק — ה-reducer בודק `instanceof`. הפתרון: להשיג **מופע אחד** של
  // הפעולה, ומאז ליצור עוד כמותו ע"י קריאה לבנאי דרך הפרוטוטייפ שלו.
  // המופע נלכד ע"י מלכודת על שדה ה-ctor שלה, כלומר בפעם הראשונה שהמשחק
  // מרכיב פריט בעצמו.

  function looksLikeMountAction(o) {
    if (!o || typeof o !== 'object') return false;
    if (!D.actionItemField || !D.actionNeedServerField) return false;
    // אם שם המחלקה ידוע מהגילוי — זו הבדיקה החזקה ביותר
    if (D.mountActionClass && ctorNameOf(o) === D.mountActionClass) return true;
    if (!(D.actionItemField in o)) return false;
    // אחרת: השדה הראשון חייב להחזיק אובייקט שנראה כמו פריט מוסך
    const item = o[D.actionItemField];
    return !!item && typeof item === 'object' &&
           (D.itemFields.id in item) && (D.itemFields.mounted in item);
  }

  // מאתר את ה-store ואת מתודת השיגור, ע"י קריאת **קוד המקור** של מתודות
  // הקונטרולר בזמן ריצה: כולן בצורה `this.<store>.<dispatch>(new …)`.
  // כך אין צורך בגילוי נוסף מהבאנדל, וזה עמיד לשינויי שמות.
  function findStore() {
    if (storeInfo) return storeInfo;
    if (!garageProxy || !D.proxyCcField) return null;
    const controller = garageProxy[D.proxyCcField];
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

      storeInfo = { store, dispatch: dispatchMethod, controller };
      NS.debug.storeFound = storeField + '.' + dispatchMethod + '()';
      return storeInfo;
    } catch (e) {
      NS.debug.lastError = String(e);
      return null;
    }
  }

  // בונה פעולה של המשחק מתוך פרוטוטייפ שנלכד, ע"י **קריאה לבנאי האמיתי**.
  //
  // חשוב מאוד: אסור להשתמש כאן ב-Object.create. חלק מהפעולות הן thunks —
  // ההתנהגות שלהן היא פונקציה שנוצרת *בתוך הבנאי* וסוגרת על הארגומנטים.
  // Object.create מדלג על הבנאי, ולכן מייצר קליפה ריקה: פרוטוטייפ נכון,
  // בלי שום פונקציה בפנים. היא נשלחת, לא קורה כלום, ונראה כאילו הצליח.
  // בדיוק זה קרה עם פעולת הבחירה (ולא נראה עם ההרכבה, כי היא נתונים בלבד).
  function buildAction(proto, args) {
    const Ctor = proto && proto.constructor;
    if (typeof Ctor !== 'function') throw new Error('action prototype has no constructor');
    return new Ctor(...args);
  }

  // ---- איתור הבנאי של פעולה לפי שם המחלקה -------------------------------
  //
  // פעולת הבחירה נתפסת מעצמה (המשחק משגר אותה בטעינת המוסך), אבל פעולת
  // ההרכבה נוצרת רק כשמרכיבים — כלומר בלי זה היינו דורשים מהמשתמש להחליף
  // פריט ידנית פעם אחת בכל סשן. במקום זה מאתרים את הבנאי ישירות: הגילוי
  // כבר יודע את **שם המחלקה**, והשמות הממוזערים הם הצהרות פונקציה, ולכן
  // אפשר לסרוק את גרף האובייקטים ולחפש פונקציה עם בדיוק אותו שם.
  //
  // האימות הוא מה שהופך את זה לוודאי ולא לניחוש: בונים מופע ניסיון ובודקים
  // שהשדות אכן קיבלו את מה שהעברנו. מופע שנבנה ולא משוגר הוא חסר תופעות
  // לוואי לחלוטין.
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

  // מאתר בנאי של פעולה לפי שם המחלקה, מכל השורשים שאנחנו מחזיקים.
  // עובד לפעולות ש**מנויות** אצל קונטרולר כלשהו: הרישום מחזיק KClass
  // שמצביע על הבנאי, וכך הוא נגיש מגרף האובייקטים של ה-store.
  function resolveActionCtor(className, validate) {
    if (!className) return null;
    const si = findStore();
    const roots = [];
    if (si) { roots.push(si.controller, si.store); }
    if (garageProxy) roots.push(garageProxy);
    for (const root of roots) {
      const Ctor = findCtorByName(root, className, validate);
      if (Ctor) return Ctor;
    }
    return null;
  }

  function resolveMountActionProto() {
    if (mountActionProto) return mountActionProto;
    if (!D.mountActionClass || !latestState) return null;

    const items = collect(latestState).items;
    const sample = items && items.length ? items[0] : null;
    if (!sample) return null;

    // אימות: בונים מופע ניסיון (לא משגרים) ובודקים שהשדות התמלאו נכון
    const Ctor = resolveActionCtor(D.mountActionClass, (C) => {
      if (C.length !== 2) return false;
      const probe = new C(sample, false);
      return probe[D.actionItemField] === sample &&
             probe[D.actionNeedServerField] === false;
    });
    if (!Ctor) return null;

    mountActionProto = Ctor.prototype;
    NS.debug.mountActionCaptured = true;
    NS.debug.mountActionSource = 'resolved-by-name';
    console.log('%c[combos] resolved the game\'s mount action by class name — ' +
      'no manual equip needed.', 'color:#7ee787;font-weight:bold');
    return mountActionProto;
  }

  // ---- הגנות (Resistance modules) ---------------------------------------
  //
  // המשחק מרכיב הגנה דרך thunk בשם GarageResistanceMount(resistance, index),
  // שגופו עושה בדיוק שני דברים: מסיר את מה שמורכב באותו חריץ
  // (GarageResistanceUnMount) ואז מחיל את החדשה (GarageApplyResistanceMount).
  // אנחנו משגרים את שתי הפעולות הנמוכות ישירות, כי רק הן **מנויות** ולכן
  // ניתנות לאיתור בזמן ריצה לפי שם; ה-thunk עצמו לא מופיע בשום רישום.
  //
  // מה שכן שונה אצלנו, ובכוונה: ל-thunk יש מקרה מיוחד ל"הגנה אוניברסלית"
  // (פריט שאחת מתכונותיו היא ALL_RESISTANCE) — כשמרכיבים אותה הוא מוריד את
  // **כל** ההגנות האחרות. אנחנו לא צריכים את המקרה הזה: המשחק זקוק לו כי
  // ה-UI שלו מרכיב הגנה אחת בכל פעם בלי לדעת מה המצב הסופי הרצוי, בעוד
  // שאנחנו תמיד מחילים את מצב 4 החריצים **במלואו** — ולכן כל מה שאינו רצוי
  // מוסר ממילא בשלב ההסרה.

  // פריט הגנה כלשהו מה-state, לאימות הבנאים
  function sampleResistance() {
    if (!latestState) return null;
    const F = D.itemFields;
    for (const it of collect(latestState).items) {
      if (enumName(it[F.category]) === 'RESISTANCE_MODULE') return it;
    }
    return null;
  }

  function resolveResistProtos() {
    if (resistApplyProto && resistUnmountProto) return true;
    const sample = sampleResistance();
    if (!sample) return false;

    if (!resistApplyProto && D.resistApplyClass && D.resistApplyFields) {
      const F = D.resistApplyFields;
      // אינדקס 3 ו-needServerMount=false בבנייה בלבד; המופע לעולם לא משוגר
      const Ctor = resolveActionCtor(D.resistApplyClass, (C) => {
        if (C.length !== 3) return false;
        const p = new C(sample, 3, false);
        return p[F.resistance] === sample && p[F.index] === 3 &&
               p[F.needServerMount] === false;
      });
      if (Ctor) {
        resistApplyProto = Ctor.prototype;
        NS.debug.resistApplyResolved = true;
      }
    }
    if (!resistUnmountProto && D.resistUnmountClass && D.resistUnmountFields) {
      const F = D.resistUnmountFields;
      const Ctor = resolveActionCtor(D.resistUnmountClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(sample, false);
        return p[F.resistance] === sample && p[F.needServerUnmount] === false;
      });
      if (Ctor) {
        resistUnmountProto = Ctor.prototype;
        NS.debug.resistUnmountResolved = true;
      }
    }
    return !!(resistApplyProto && resistUnmountProto);
  }

  // 4 חריצי ההגנה כפי שהם כרגע, לפי mountIndex (null בחריץ ריק).
  // מקבל אופציונלית תוצאת collect קיימת, כדי לא לסרוק את הגרף פעמיים.
  function currentProtectionSlots(found) {
    const slots = [null, null, null, null];
    if (!latestState) return slots;
    const F = D.itemFields;
    for (const it of (found || collect(latestState)).items) {
      if (it[F.mounted] !== true) continue;
      if (enumName(it[F.category]) !== 'RESISTANCE_MODULE') continue;
      const idx = it[F.mountIndex];
      if (typeof idx === 'number' && idx >= 0 && idx < 4) slots[idx] = it;
    }
    return slots;
  }

  function unmountProtection(rawItem) {
    if (!resolveResistProtos() || !resistUnmountProto) {
      return { ok: false, error: 'resistance unmount action not available' };
    }
    const si = findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };
    try {
      si.store[si.dispatch](buildAction(resistUnmountProto, [rawItem, true]));
      NS.debug.resistUnmountsSent++;
      return { ok: true };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  }

  function mountProtection(rawItem, index) {
    if (!resolveResistProtos() || !resistApplyProto) {
      return { ok: false, error: 'resistance mount action not available' };
    }
    const si = findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };
    try {
      si.store[si.dispatch](buildAction(resistApplyProto, [rawItem, index, true]));
      NS.debug.resistMountsSent++;
      return { ok: true };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  }

  // מחיל מצב מלא של 4 חריצים. desiredIds הוא מערך באורך 4 של מזהים או null.
  //
  // **ההשוואה היא לפי קבוצה, לא לפי חריץ** — וזו הנקודה החשובה כאן. 4 החריצים
  // מתחלפים ביניהם ואין להם משמעות במשחק: מה שקובע הוא אילו הגנות מורכבות,
  // לא באיזה סדר. לכן הגנה שכבר מורכבת **באיזשהו** חריץ נשארת במקומה, וקומבו
  // שמכיל בדיוק את אותן הגנות בסדר אחר לא מייצר ולו פעולה אחת. (זו בדיוק
  // הסמנטיקה של האקוויפר הישן ב-equippers/protection_equipper.js; גרסה
  // מוקדמת כאן השוותה חריץ מול חריץ והפכה שינוי סדר ל-8 פעולות מיותרות.)
  //
  // המיקום שנשמר בקומבו כן משמש, אבל רק כ**העדפה** לשיבוץ הגנה חדשה: אם
  // החריץ שלה בקומבו יתפנה, היא תיכנס אליו; אחרת לחריץ הפנוי הראשון.
  //
  // סדר הביצוע: קודם כל ההסרות ואז ההרכבות — הגנה יכולה להיות מורכבת בחריץ
  // אחד בלבד, וחריץ תפוס חייב להתפנות לפני שממלאים אותו.
  function applyProtections(desiredIds) {
    if (!latestState) return { ok: false, error: 'garage state not captured' };
    if (!Array.isArray(desiredIds)) return { ok: false, error: 'expected an array of 4 ids/nulls' };

    const F = D.itemFields;
    // סריקה אחת של הגרף לכל התכנון: גם מצב החריצים וגם חיפוש הפריטים הרצויים
    const found = collect(latestState);
    const current = currentProtectionSlots(found);

    // הרצוי: קבוצה של מזהים, עם החריץ המועדף לכל אחד
    const wantSet = new Set();
    const preferred = new Map();   // id -> החריץ שבו הוא מופיע בקומבו
    for (let i = 0; i < 4; i++) {
      if (desiredIds[i] == null) continue;
      const id = String(desiredIds[i]);
      if (!wantSet.has(id)) { wantSet.add(id); preferred.set(id, i); }
    }

    // המצב הנוכחי כקבוצה: id -> החריץ שבו הוא מורכב
    const mountedAt = new Map();
    for (let i = 0; i < 4; i++) {
      if (current[i]) mountedAt.set(idToString(current[i][F.id]), i);
    }

    const plan = { unmount: [], mount: [], unchanged: [] };

    // להסיר: מורכב אבל לא רצוי
    for (const [id, slot] of mountedAt) {
      if (wantSet.has(id)) plan.unchanged.push({ slot, id });
      else plan.unmount.push({ slot, item: current[slot], id });
    }

    // להוסיף: רצוי אבל לא מורכב באף חריץ
    const toAdd = [];
    for (const id of wantSet) {
      if (mountedAt.has(id)) continue;
      const raw = found.byId.get(id);
      if (!raw) return { ok: false, error: 'protection id not found in garage state: ' + id };
      if (enumName(raw[F.category]) !== 'RESISTANCE_MODULE') {
        return { ok: false, error: 'item ' + id + ' is not a resistance module' };
      }
      toAdd.push({ id, item: raw, preferred: preferred.get(id) });
    }

    // החריצים שיהיו פנויים: הריקים עכשיו + אלה שמתפנים בשלב ההסרה
    const free = new Set();
    for (let i = 0; i < 4; i++) if (!current[i]) free.add(i);
    for (const u of plan.unmount) free.add(u.slot);

    // שיבוץ: קודם מי שהחריץ המועדף שלו פנוי, ורק אז השאר — אחרת הגנה אחת
    // הייתה יכולה לתפוס חריץ שמיועד לאחרת ולשבש את הסדר השמור בלי סיבה.
    const ordered = toAdd.filter((a) => free.has(a.preferred))
      .concat(toAdd.filter((a) => !free.has(a.preferred)));
    for (const a of ordered) {
      let slot = free.has(a.preferred) ? a.preferred : null;
      if (slot === null) for (let i = 0; i < 4; i++) if (free.has(i)) { slot = i; break; }
      if (slot === null) {
        return { ok: false, error: 'no free protection slot for ' + a.item[F.name] };
      }
      free.delete(slot);
      plan.mount.push({ slot, item: a.item, id: a.id });
    }

    const errors = [];
    for (const u of plan.unmount) {
      const r = unmountProtection(u.item);
      if (!r.ok) errors.push('unmount slot ' + u.slot + ': ' + r.error);
    }
    for (const m of plan.mount) {
      const r = mountProtection(m.item, m.slot);
      if (!r.ok) errors.push('mount slot ' + m.slot + ': ' + r.error);
    }

    return {
      ok: errors.length === 0,
      errors,
      plan: {
        unmounted: plan.unmount.map((u) => ({ slot: u.slot, name: u.item[F.name] })),
        mounted: plan.mount.map((m) => ({ slot: m.slot, name: m.item[F.name] })),
        kept: plan.unchanged.map((u) => ({ slot: u.slot, name: current[u.slot][F.name] })),
        untouched: plan.unchanged.length,
      },
    };
  }

  // ---- אוגמנטים (במשחק: Devices) ----------------------------------------
  //
  // כאן אין thunk באמצע: שתי הפעולות שאנחנו צריכים הן ממילא הנמוכות, ושתיהן
  // מעדכנות את ה-state המקומי *וגם* שולחות לשרת (ההתקנה אפילו נקראת
  // GarageInsertDeviceClientAndServer). לכן זה המסלול הפשוט מכולם.
  //
  // כלל היסוד: **לתותח/גוף יש אוגמנט אחד בלבד**. המשחק תמיד מסיר את המותקן
  // לפני שהוא מתקין אחר, וגם אנחנו. וחשוב: המשחק זוכר את האוגמנט המותקן לכל
  // פריט בנפרד, גם כשהפריט לא מורכב — ולכן החיפוש הוא לפי baseItemId ולא
  // לפי "מה מורכב עכשיו".

  function resolveDeviceProtos() {
    if (deviceInsertProto && deviceRemoveProto) return true;
    if (!latestState || !D.deviceFields) return false;
    // כאן כל אוגמנט מספיק — הוא משמש רק כדגימה לאימות הבנאי
    const dev = collect(latestState).devices[0];
    const item = collect(latestState).items[0];
    if (!dev || !item) return false;

    if (!deviceInsertProto && D.deviceInsertClass && D.deviceInsertFields) {
      const F = D.deviceInsertFields;
      const Ctor = resolveActionCtor(D.deviceInsertClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(dev, item);
        return p[F.device] === dev && p[F.item] === item;
      });
      if (Ctor) { deviceInsertProto = Ctor.prototype; NS.debug.deviceInsertResolved = true; }
    }
    if (!deviceRemoveProto && D.deviceRemoveClass && D.deviceRemoveFields) {
      const F = D.deviceRemoveFields;
      const Ctor = resolveActionCtor(D.deviceRemoveClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(dev, item);
        return p[F.device] === dev && p[F.item] === item;
      });
      if (Ctor) { deviceRemoveProto = Ctor.prototype; NS.debug.deviceRemoveResolved = true; }
    }
    return !!(deviceInsertProto && deviceRemoveProto);
  }

  // רשימת האוגמנטים הקנונית: תת-העץ state.devices. חשוב פעמיים:
  //   * לא סריקה של כל הגרף — זו אוספת עותקים גם מ-itemsOnMarket.
  //   * זה עדיין **הקטלוג המלא** של כל פריט שנטען, קנויים ולא-קנויים יחד
  //     (אומת חי: 43 אוגמנטים לשני פריטים). הבעלות היא שדה, לא מיקום.
  function stateDevices() {
    if (!latestState || !D.stateFields || !D.stateFields.devices) return [];
    const sub = latestState[D.stateFields.devices];
    if (!sub || typeof sub !== 'object') return [];
    try {
      return collect(sub).devices;
    } catch (e) {
      NS.debug.lastError = String(e);
      return [];
    }
  }

  // האם האוגמנט קנוי. זה בדיוק המבחן של המשחק עצמו:
  //   iri() = infinityLifetimeItem ? BOUGHT : NOT_OWNED
  // (שמות ה-enum מופיעים בבאנדל כמחרוזות — אין כאן פרשנות שלנו.)
  // אם השדה לא התגלה משום מה — מתירנים, שלא נשבית אוגמנטים לגמרי.
  function deviceOwned(device) {
    const DF = D.deviceFields;
    if (!DF || !device) return true;
    const f = DF.infinityLifetimeItem;
    if (!f || !(f in device)) return true;
    return device[f] === true;
  }

  // האוגמנט המותקן על פריט נתון (או null)
  function installedDeviceFor(rawItem) {
    const DF = D.deviceFields;
    if (!DF || !latestState) return null;
    const base = baseItemIdOf(rawItem);
    for (const d of stateDevices()) {
      if (d[DF.installed] !== true) continue;
      if (idToString(d[DF.baseItemId]) === base) return d;
    }
    return null;
  }

  // מחיל אוגמנט על פריט. desiredDeviceId === null פירושו "בלי אוגמנט".
  // אם המצוי כבר שווה לרצוי — לא משוגרת אף פעולה.
  function applyAugment(rawItem, desiredDeviceId) {
    if (!latestState) return { ok: false, error: 'garage state not captured' };
    if (!rawItem) return { ok: false, error: 'no item given' };
    if (!resolveDeviceProtos()) {
      return { ok: false, error: 'device actions not available (insert=' +
        !!deviceInsertProto + ', remove=' + !!deviceRemoveProto + ')' };
    }
    const si = findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    const DF = D.deviceFields;
    const IF = D.itemFields;
    const base = baseItemIdOf(rawItem);
    const current = installedDeviceFor(rawItem);
    const currentId = current ? idToString(current[DF.id]) : null;
    const wantId = desiredDeviceId == null ? null : String(desiredDeviceId);

    if (currentId === wantId) {
      return { ok: true, changed: false, kept: current ? current[DF.name] : null };
    }

    // כל הבדיקות קורות לפני שנוגעים במשהו, וזה קריטי: ההסרה מתבצעת
    // ראשונה, כך שכישלון באמצע היה משאיר את הפריט בלי אוגמנט בכלל
    // (וזה בדיוק מה שקרה כשצוידו אוגמנטים לא-קנויים: מקומית "הצליח",
    // השרת דחה, ואחרי ריענון — בלי אוגמנט).
    let wantDev = null;
    if (wantId) {
      for (const d of stateDevices()) {
        if (idToString(d[DF.id]) === wantId) { wantDev = d; break; }
      }
      if (!wantDev) {
        // רשימת האוגמנטים של הפריט עוד לא נטענה (טעינה עצלה לפי
        // baseItemId — ראה deviceLoadClass בגילוי)
        return { ok: false, notOwned: true,
          error: 'augment ' + wantId + ' is not in the garage state' };
      }
      if (idToString(wantDev[DF.baseItemId]) !== base) {
        return { ok: false, error: 'augment ' + wantDev[DF.name] + ' does not belong to ' +
          rawItem[IF.name] };
      }
      // הקטלוג מכיל גם את מה שלא נקנה — הבעלות היא שדה, לא מיקום
      if (!deviceOwned(wantDev)) {
        return { ok: false, notOwned: true,
          error: 'augment ' + wantDev[DF.name] + ' is not owned on this account' };
      }
    }

    try {
      if (current) {
        si.store[si.dispatch](buildAction(deviceRemoveProto, [current, rawItem]));
        NS.debug.devicesRemoved++;
      }
      if (wantDev) {
        si.store[si.dispatch](buildAction(deviceInsertProto, [wantDev, rawItem]));
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
  }

  // ---- סקינים -----------------------------------------------------------
  //
  // סקין אינו פריט מורכב — ניסינו להרכיב אותו כמו תותח וזה פשוט לא קורה.
  // הוא מערכת בצורת האוגמנטים: פעולה של (סקין, פריט) שכותבת את mountedSkin
  // על התותח/הגוף ונשלחת לשרת. לכן אין "הסרת סקין": תמיד מוחלף באחר.

  function resolveSkinProto() {
    if (skinMountProto) return true;
    if (!latestState || !D.skinMountClass || !D.skinMountFields) return false;
    const F = D.skinMountFields;
    const IF = D.itemFields;
    const found = collect(latestState);
    // שני פריטים כלשהם מספיקים לאימות; ה-ctor קורא את המזהה של השני
    const a = found.items[0];
    const b = found.items.find((it) => it !== a) || a;
    if (!a) return false;

    const Ctor = resolveActionCtor(D.skinMountClass, (C) => {
      if (C.length !== 2) return false;
      const p = new C(a, b);
      return p[F.skin] === a && p[F.item] === b && b[IF.id] != null;
    });
    if (Ctor) { skinMountProto = Ctor.prototype; NS.debug.skinMountResolved = true; }
    return !!skinMountProto;
  }

  // מחיל סקין על תותח/גוף. אם הסקין המבוקש כבר מוחל — לא משוגר כלום.
  function applySkin(rawItem, skinId) {
    if (!latestState) return { ok: false, error: 'garage state not captured' };
    if (!rawItem) return { ok: false, error: 'no item given' };
    if (skinId == null) return { ok: true, changed: false, kept: null };
    if (!resolveSkinProto()) return { ok: false, error: 'skin action not available' };
    const si = findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    const IF = D.itemFields;
    const want = String(skinId);
    const currentId = IF.mountedSkin ? idToString(rawItem[IF.mountedSkin]) : null;
    if (currentId === want) return { ok: true, changed: false, kept: want };

    const skin = collect(latestState).byId.get(want);
    if (!skin) return { ok: false, error: 'skin not found in garage state: ' + want };
    if (enumName(skin[IF.category]) !== 'SKIN') {
      return { ok: false, error: 'item ' + want + ' is not a skin' };
    }

    try {
      si.store[si.dispatch](buildAction(skinMountProto, [skin, rawItem]));
      NS.debug.skinsApplied++;
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
    // הדגמה של המשחק עצמו מרעננת את התצוגה אחרי השליחה; אצלנו הבחירה
    // בפריט הבסיס היא מה שמזיז את מודל התלת-ממד.
    const refreshed = selectItem(rawItem);
    return {
      ok: true, changed: true, previewRefreshed: refreshed,
      item: rawItem[IF.name], skin: skin[IF.name],
    };
  }

  // מרכיב פריט בדרך של המשחק עצמו. needServer=false מעדכן **רק מקומית**
  // ולא שולח כלום החוצה — וזה מה שהופך את האימות לבטוח לחלוטין.
  //
  // ההרכבה לבדה לא מספיקה לתצוגה: מודל התלת-ממד במוסך מתעדכן מ**בחירת
  // פריט**, לא מההרכבה. בזרימה הרגילה המשתמש קודם לוחץ על הפריט (בחירה,
  // והמודל מתעדכן) ורק אז על Equip. לכן אחרי ההרכבה משגרים גם בחירה.
  function mountViaAction(rawItem, needServer) {
    if (!mountActionProto) resolveMountActionProto();
    if (!mountActionProto) {
      return { ok: false, error: 'mount-action template not available (equip one item manually once, then retry)' };
    }
    const si = findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    try {
      si.store[si.dispatch](buildAction(mountActionProto, [rawItem, !!needServer]));
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }

    // רענון מודל התלת-ממד. נכשל בשקט: ההרכבה עצמה כבר הצליחה, וזו רק תצוגה.
    const refreshed = selectItem(rawItem);
    return { ok: true, previewRefreshed: refreshed };
  }

  // משגר "בחר פריט" — מה שמרענן את מודל התלת-ממד במוסך
  function selectItem(rawItem) {
    if (!selectActionProto || !D.selectItemIdField) return false;
    const si = findStore();
    if (!si) return false;
    try {
      si.store[si.dispatch](buildAction(selectActionProto, [rawItem[D.itemFields.id]]));
      NS.debug.selectsSent++;
      return true;
    } catch (e) {
      NS.debug.lastError = String(e);
      return false;
    }
  }

  // שם המחלקה של אובייקט. השמות הממוזערים בבאנדל הם הצהרות פונקציה
  // (`function KB(t){…}`), ולכן `constructor.name` מחזיר בדיוק את השם
  // שהגילוי מצא — זיהוי מדויק, בלי ניחושים מבניים.
  function ctorNameOf(o) {
    try {
      const p = Object.getPrototypeOf(o);
      return p && p.constructor ? p.constructor.name : null;
    } catch (e) { return null; }
  }

  // פעולת הבחירה. חשוב: המלכודת יורה **תוך כדי הבנאי**, ובאותו רגע לאובייקט
  // כבר יש שדות ממחלקת הבסיס (thunk) — ולכן בדיקה מסוג "כמה שדות יש לו"
  // תיכשל תמיד. משווים את שם המחלקה במקום.
  function looksLikeSelectAction(o) {
    if (!o || typeof o !== 'object' || !D.selectActionClass) return false;
    return ctorNameOf(o) === D.selectActionClass;
  }

  // ---- הרכבת פריט (ניסיוני, קונסול בלבד) --------------------------------
  //
  // ⚠️ זו הפעולה הראשונה שאינה קריאה בלבד. היא **לא** מזייפת פרוטוקול: היא
  // קוראת למתודת השליחה של המשחק עצמו, שמקודדת/מצפינה/שולחת כרגיל. השרת
  // אמור להשיב באישור שמעדכן את ה-state — ומכאן שגם ה-UI מתעדכן לבד, בלי
  // ריצוד. עדיין לא מחווט לשום כפתור; מטרתו לאמת את המנגנון חי.
  function mountItemById(idStr) {
    if (!garageProxy) return { ok: false, error: 'garage proxy not captured' };
    if (!space) return { ok: false, error: 'space (entity registry) not captured' };
    if (!ctx) return { ok: false, error: 'context stack not captured' };
    if (!latestState) return { ok: false, error: 'garage state not captured' };

    // ישות המוסך — מחפשים פעם אחת ומשמרים
    if (!garageObject) {
      garageObject = findGarageObject();
      NS.debug.garageObjectFound = !!garageObject;
    }
    if (!garageObject) {
      return {
        ok: false,
        error: 'could not locate the garage entity yet — browse the garage a bit ' +
               '(open a tab, click an item) so the game performs a garage action, then retry. ' +
               'candidates seen: ' + ctxCandidates.size,
      };
    }

    // מאתרים את הפריט כדי לקבל את אובייקט המזהה **המקורי** (Long של קוטלין).
    // מחרוזת לא תעבוד — החיפוש במרשם מצפה לאובייקט המזהה עצמו.
    const F = D.itemFields;
    const found = collect(latestState);
    let raw = null;
    for (const it of found.items) {
      if (idToString(it[F.id]) === String(idStr)) { raw = it; break; }
    }
    if (!raw) return { ok: false, error: 'item id not found in garage state: ' + idStr };

    try {
      const entity = space[D.spaceLookupMethod](raw[F.id]);
      if (entity == null) return { ok: false, error: 'no entity for item ' + idStr };

      // בדיוק כמו המשחק: דוחפים את ישות המוסך להקשר, שולחים, ותמיד שולפים
      // בחזרה ב-finally — אחרת נשאיר את מחסנית ההקשר של המשחק מזוהמת.
      ctx[D.ctxPushMethod](garageObject);
      try {
        garageProxy[D.proxyMountMethod](entity);
      } finally {
        ctx[D.ctxPopMethod]();
      }

      NS.debug.mountsSent++;
      return { ok: true, name: raw[F.name], id: String(idStr) };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  }

  // ---- החלת קומבו שלם ----------------------------------------------------
  //
  // כל ההיגיון יושב כאן ולא בצד ISOLATED, ובכוונה: הפתרון של פריט תלוי
  // במצב החי (מה בבעלות, איזו Mk, מה כבר מורכב), והמצב נמצא רק כאן. הצד
  // השני שולח את הקומבו הרצוי ומקבל דוח לפי חריץ.
  //
  // סדר: פריטי בסיס -> דקורטיביים -> הגנות -> אוגמנטים. האוגמנט אחרון כי
  // הוא נתלה בפריט שלו; השאר בסדר הזה כדי שמה שהמשתמש רואה יתייצב מוקדם.
  //
  // בין פעולה לפעולה יש השהיה קצרה. לא בגלל שהמשחק דורש זאת — הוא לא —
  // אלא כדי שרצף של עשר פקודות בתוך אותה מילישנייה לא ייראה חריג.

  const DEFAULT_DELAY_MS = 80;
  const DELAY_JITTER_MS = 40;

  function sleep(ms) {
    return new Promise((resolve) => W.setTimeout(resolve, ms));
  }

  // פותר חריץ שמור לפריט אמיתי במוסך.
  //
  // המפתח הוא **baseItemId**, לא ה-id השמור: כל Mk היא פריט נפרד והמשתמש
  // מחזיק את כולן, אז קומבו שנשמר ב-Mk5 אמור לצייד את ה-Mk הנוכחית ולא
  // לנעול על הישנה. זו בדיוק ההתנהגות של המשחק, שאינו מציע בחירת Mk.
  function resolveOwnedItem(entry, category, found) {
    if (!entry) return null;
    const IF = D.itemFields;
    const base = entry.baseItemId != null ? String(entry.baseItemId) : null;
    const wantId = entry.id != null ? String(entry.id) : null;
    if (!base && !wantId) return null;

    let best = null;
    for (const it of (found || collect(latestState)).items) {
      if (it[IF.owned] !== true) continue;
      if (category && enumName(it[IF.category]) !== category) continue;
      const hit = base ? baseItemIdOf(it) === base : idToString(it[IF.id]) === wantId;
      if (!hit) continue;
      if (!best || (mkLevel(it) || 0) > (mkLevel(best) || 0)) best = it;
    }
    return best;
  }

  // מחיל קומבו. `desired` הוא מבנה הנתונים השמור, אחרי שהצד השני כבר
  // הסיר ממנו את מה שהמשתמש ביטל בכרטיס.
  //   protection === null      -> לא נוגעים בהגנות בכלל
  //   protection === [4 ערכים] -> מחילים את המצב במלואו (null בחריץ = הסרה)
  async function applyCombo(desired, opts) {
    if (!latestState) return { ok: false, error: 'garage state not captured' };
    if (!desired || typeof desired !== 'object') return { ok: false, error: 'no combo given' };

    const o = opts || {};
    const baseDelay = typeof o.delayMs === 'number' ? o.delayMs : DEFAULT_DELAY_MS;
    const jitter = typeof o.delayMs === 'number' ? 0 : DELAY_JITTER_MS;
    const IF = D.itemFields;
    const results = [];
    const t0 = (W.performance && W.performance.now) ? W.performance.now() : Date.now();

    const pause = () => sleep(baseDelay + (jitter ? Math.floor(Math.random() * jitter) : 0));

    // פריט בסיס / דקורטיבי — הרכבה רגילה
    async function doItem(slot, category) {
      const entry = desired[slot];
      if (!entry) return;
      const raw = resolveOwnedItem(entry, category, collect(latestState));
      if (!raw) {
        results.push({ slot, name: entry.name || null, status: 'unavailable' });
        return;
      }
      if (raw[IF.mounted] === true) {
        results.push({ slot, name: raw[IF.name], status: 'unchanged' });
        return;
      }
      const r = mountViaAction(raw, true);
      results.push({
        slot, name: raw[IF.name],
        status: r.ok ? 'applied' : 'failed',
        error: r.ok ? undefined : r.error,
      });
      await pause();
    }

    // סקין — פעולה משלו, ותמיד ביחס לפריט הבסיס
    async function doSkin(slot, ownerSlot, ownerCategory) {
      const entry = desired[slot];
      if (!entry || entry.id == null) return;
      const owner = resolveOwnedItem(desired[ownerSlot], ownerCategory, collect(latestState));
      if (!owner) return;   // בלי הפריט אין למה להחיל — לא שגיאה
      const r = applySkin(owner, entry.id);
      if (!r.ok) {
        results.push({ slot, name: entry.name || null, status: 'failed', error: r.error });
        return;
      }
      results.push({ slot, name: entry.name || null, status: r.changed ? 'applied' : 'unchanged' });
      if (r.changed) await pause();
    }

    // אוגמנט — נתלה בפריט שלו, ולכן אחרי שהוא כבר הורכב
    async function doAugment(slot, ownerSlot, ownerCategory) {
      const entry = desired[slot];
      if (!entry || entry.id == null) return;
      const owner = resolveOwnedItem(desired[ownerSlot], ownerCategory, collect(latestState));
      if (!owner) return;
      const r = applyAugment(owner, entry.id);
      if (!r.ok) {
        // אוגמנט שאינו בבעלות אינו כשל אלא חוסר — אין מסלול שיצליח בו,
        // ולכן גם אין טעם ליפול ל-DOM (ראה core/instant_loader.js).
        results.push({
          slot, name: entry.name || null,
          status: r.notOwned ? 'unavailable' : 'failed',
          error: r.notOwned ? undefined : r.error,
        });
        return;
      }
      results.push({ slot, name: entry.name || null, status: r.changed ? 'applied' : 'unchanged' });
      if (r.changed) await pause();
    }

    try {
      // 1. פריטי בסיס
      await doItem('turret', 'WEAPON');
      await doItem('hull', 'ARMOR');
      await doItem('grenade', 'BAZOOKA');
      await doItem('drone', 'DRONE');

      // 2. דקורטיביים
      await doItem('paint', 'PAINT');
      await doSkin('turretSkin', 'turret', 'WEAPON');
      await doSkin('hullSkin', 'hull', 'ARMOR');

      // 3. הגנות — מצב מלא, עם ה-diff הקבוצתי שכבר קיים
      if (Array.isArray(desired.protection)) {
        const found = collect(latestState);
        const ids = [];
        for (let i = 0; i < 4; i++) {
          const raw = resolveOwnedItem(desired.protection[i], 'RESISTANCE_MODULE', found);
          if (!raw && desired.protection[i]) {
            results.push({
              slot: 'protection ' + i,
              name: desired.protection[i].name || null,
              status: 'unavailable',
            });
          }
          ids.push(raw ? idToString(raw[IF.id]) : null);
        }
        const r = applyProtections(ids);
        if (!r.ok && r.error) {
          results.push({ slot: 'protection', status: 'failed', error: r.error });
        } else {
          const touched = r.plan.unmounted.length + r.plan.mounted.length;
          results.push({
            slot: 'protection',
            status: touched ? 'applied' : 'unchanged',
            detail: r.plan,
            error: (r.errors && r.errors.length) ? r.errors.join('; ') : undefined,
          });
          if (touched) await pause();
        }
      }

      // 4. אוגמנטים. שני מכשולי תזמון מכוסים כאן:
      //   * טעינה עצלה אחרי ריענון — הקטלוג עוד לא הגיע.
      //   * ההרכבה הנמוכה שלנו מדלגת על טעינת הקטלוג שה-thunk של המשחק
      //     מפעיל — אז לפריט שמסכו מעולם לא נפתח מבקשים אותו בעצמנו.
      if (desired.turretAugment || desired.hullAugment) {
        for (const [slot, cat] of [['turret', 'WEAPON'], ['hull', 'ARMOR']]) {
          if (!desired[slot + 'Augment']) continue;
          const owner = resolveOwnedItem(desired[slot], cat, collect(latestState));
          if (owner) requestDeviceCatalog(owner);
        }
        await waitForMountedDeviceCatalogs(2000);
      }
      await doAugment('turretAugment', 'turret', 'WEAPON');
      await doAugment('hullAugment', 'hull', 'ARMOR');
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e), results };
    }

    const t1 = (W.performance && W.performance.now) ? W.performance.now() : Date.now();
    const failed = results.filter((r) => r.status === 'failed');
    const unavailable = results.filter((r) => r.status === 'unavailable');
    return {
      ok: failed.length === 0,
      results,
      failed: failed.map((r) => r.slot),
      unavailable: unavailable.map((r) => r.slot),
      ms: Math.round(t1 - t0),
    };
  }

  // מבקש מהשרת את קטלוג האוגמנטים של פריט, אם הוא עוד לא ב-state.
  //
  // למה זה נדרש: ה-thunk של ההרכבה במשחק משגר GarageLoadDevicesIfNotLoaded
  // אחרי כל הרכבת תותח/גוף — ואנחנו משגרים את הפעולה הנמוכה שמדלגת על זה.
  // בלי ההשלמה הזו, פריט שמסכו מעולם לא נפתח לעולם לא יקבל קטלוג, ואוגמנט
  // שלו ידווח unavailable בטעות. הפקודה מזוהה בוודאות: זו בדיוק הפעולה
  // שה-thunk של המשחק משגר (GarageLoadAvailableDevices(baseItemId)).
  function requestDeviceCatalog(ownerRaw) {
    const DF = D.deviceFields;
    const IF = D.itemFields;
    if (!DF || !ownerRaw) return false;
    const base = baseItemIdOf(ownerRaw);

    // כבר טעון? אין מה לבקש
    for (const d of stateDevices()) {
      if (idToString(d[DF.baseItemId]) === base) return true;
    }

    if (!deviceLoadProto) {
      if (!D.deviceLoadClass || !D.deviceLoadFields || !latestState) return false;
      const F = D.deviceLoadFields;
      const sampleId = ownerRaw[IF.id];
      const Ctor = resolveActionCtor(D.deviceLoadClass, (C) => {
        if (C.length !== 1) return false;
        const p = new C(sampleId);
        return p[F.itemId] === sampleId;
      });
      if (!Ctor) return false;
      deviceLoadProto = Ctor.prototype;
    }
    const si = findStore();
    if (!si) return false;

    // המזהה הגולמי (Long) של משפחת הפריט — לא המחרוזת
    const mod = ownerRaw[IF.modification];
    const MF = D.modificationFields;
    const rawBase = (mod != null && MF && mod[MF.baseItemId] != null)
      ? mod[MF.baseItemId] : ownerRaw[IF.id];

    try {
      si.store[si.dispatch](buildAction(deviceLoadProto, [rawBase]));
      NS.debug.catalogRequests++;
      return true;
    } catch (e) {
      NS.debug.lastError = String(e);
      return false;
    }
  }

  // ---- המתנה לקטלוג האוגמנטים --------------------------------------------
  //
  // המשחק טוען את רשימת האוגמנטים של כל פריט **בעצלות**, זמן קצר אחרי
  // הכניסה למוסך. שמירה (או החלה) מיד אחרי ריענון עלולה להקדים את הטעינה —
  // ואז התותח/גוף נקראים בלי האוגמנט שלהם, למרות שהוא מותקן. התסמין:
  // השמירה הראשונה בלי אוגמנטים, השנייה תקינה.
  //
  // לא משגרים שום בקשת טעינה — רק ממתינים למה שהמשחק עושה ממילא, עם
  // תקרה. אם הקטלוג לא הגיע עד אז, ממשיכים בלעדיו (ההתנהגות הישנה).
  async function waitForMountedDeviceCatalogs(maxMs) {
    const DF = D.deviceFields;
    const IF = D.itemFields;
    if (!DF || !latestState) return true;

    // הפריטים שיש להם בכלל אוגמנטים: התותח והגוף המורכבים
    const wanted = [];
    try {
      for (const it of collect(latestState).items) {
        if (it[IF.mounted] !== true) continue;
        const cat = enumName(it[IF.category]);
        if (cat === 'WEAPON' || cat === 'ARMOR') wanted.push(baseItemIdOf(it));
      }
    } catch (e) { return true; }
    if (!wanted.length) return true;

    const deadline = Date.now() + (maxMs || 2500);
    for (;;) {
      const have = new Set();
      for (const d of stateDevices()) have.add(idToString(d[DF.baseItemId]));
      if (wanted.every((b) => have.has(b))) return true;
      if (Date.now() >= deadline) {
        NS.debug.lastError = 'device catalogs not loaded in time for: ' +
          wanted.filter((b) => !have.has(b)).join(', ');
        return false;
      }
      await sleep(150);
    }
  }

  // ---- שמות שהתגלו + גשר -----------------------------------------------

  function applyNames(d) {
    D = d;
    stateFieldList = Object.values(d.stateFields);
    NS.debug.discovered = true;
    armAll();
    // מדפיסים גם אילו קבוצות אופציונליות הגיעו — אם אחת מהן false, העמודה
    // המתאימה בלוג תהיה ריקה וזה המקום הראשון לבדוק (cache ישן / עוגן שנשבר).
    console.log('[combos] using discovered garage-state names for this build:',
      JSON.stringify({
        stateClass: d.stateClass, itemClass: d.itemClass, trapField: d.trapField,
        urlMethod: d.urlMethod || null, maxLevelMethod: d.maxLevelMethod || null,
        hasModification: !!d.modificationFields,
        hasUpgrade: !!d.upgradeFields,
        hasDevices: !!d.deviceFields,
        hasResistanceActions: !!(d.resistApplyClass && d.resistUnmountClass),
        hasDeviceActions: !!(d.deviceInsertClass && d.deviceRemoveClass),
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
      // אסינכרוני: ממתינים (עם תקרה) לקטלוג האוגמנטים, שנטען בעצלות אחרי
      // הכניסה למוסך — אחרת שמירה מיידית אחרי ריענון יוצאת בלי אוגמנטים.
      // תקרת ההמתנה קטנה מה-timeout של הגשר (4s), כך שהתשובה תמיד מגיעה.
      (async () => {
        try { await waitForMountedDeviceCatalogs(2500); } catch (e) { /* ממשיכים בלעדיו */ }
        let res;
        try { res = readCombo(); } catch (err) { res = { ok: false, error: String(err) }; }
        try { logCombo(res); } catch (err) { NS.debug.lastError = String(err); }
        // מחזירים גם לצד ISOLATED — שם ייעשה השימוש האמיתי בנתונים
        window.postMessage({
          __cmb: true, dir: 'm2i', action: 'comboResult',
          payload: Object.assign({ id }, res),
        }, '*');
      })();
      return;
    }

    if (m.action === 'readIndex') {
      const id = (m.payload || {}).id;
      let res;
      try { res = readIndex(); } catch (err) { res = { ok: false, error: String(err) }; }
      window.postMessage({
        __cmb: true, dir: 'm2i', action: 'indexResult',
        payload: Object.assign({ id }, res),
      }, '*');
      return;
    }

    if (m.action === 'applyCombo') {
      const p = m.payload || {};
      // אסינכרוני: יש השהיות בין פריט לפריט
      applyCombo(p.desired, p.opts)
        .catch((err) => ({ ok: false, error: String(err) }))
        .then((res) => {
          window.postMessage({
            __cmb: true, dir: 'm2i', action: 'applyResult',
            payload: Object.assign({ id: p.id }, res),
          }, '*');
        });
    }
  });

  // ---- API לקונסול ------------------------------------------------------
  NS.read = readCombo;
  NS.index = readIndex;
  NS.log = function () { logCombo(readCombo()); };
  NS.names = function () { return D; };
  NS.state = function () { return latestState; };

  W.__CMB_READ = NS.log;
  W.__CMB_STATE = function () {
    const s = {
      captured: !!latestState,
      proxyCaptured: !!garageProxy,
      spaceCaptured: !!space,
      ctxCaptured: !!ctx,
      garageObject: !!(garageObject || definitiveGarageObject),
      ctxCandidates: ctxCandidates.size,
      mountActionCaptured: !!mountActionProto,
      selectActionCaptured: !!selectActionProto,
      resistApplyResolved: !!resistApplyProto,
      resistUnmountResolved: !!resistUnmountProto,
      deviceInsertResolved: !!deviceInsertProto,
      deviceRemoveResolved: !!deviceRemoveProto,
      skinMountResolved: !!skinMountProto,
      store: findStore() ? NS.debug.storeFound : null,
      names: D,
      debug: NS.debug,
    };
    console.log('[combos] garage-state hook:', s);
    return s;
  };

  // הוסר: ניסיון "רענון" ע"י שליחת הפקודה חסרת-הארגומנטים (hcn).
  // היא איננה בקשת רענון — היא קשורה לאירוע "המוסך נטען" ונשלחת בתגובה
  // לבקשת טעינה מחדש מהשרת. שליחתה מחוץ להקשר גרמה לטעינת נתוני מוסך
  // שאינם של המשתמש. **לקח: לא לשלוח פקודה שלא זוהתה בוודאות.**
  // מיפוי הפקודות היוצאות של המוסך (מתוך רישום המנויים של הקונטרולר):
  //   ecn(item)     <- אירוע ההרכבה, כשמבוקש עדכון שרת   = mountItem
  //   fcn(item)     <- אירוע אחר על פריט
  //   gcn(arg)      <- אירוע אחר
  //   hcn()         <- "המוסך נטען" / תגובה ל-reloadGarage  ← לא לגעת

  // אבחון איתור ישות המוסך — מה נלמד עד כה ומאיזה מקור
  W.__CMB_DIAG = function () {
    learnGameObjectProto();
    const rows = [];
    for (const [o, n] of ctxCandidates) {
      rows.push({ seen: n, isGameObject: isGameObject(o), ctor: (o && o.constructor && o.constructor.name) || '?' });
    }
    rows.sort((a, b) => b.seen - a.seen);
    const info = {
      definitiveFromProxyCall: !!definitiveGarageObject,
      learnedGameObjectProto: !!gameObjectProto,
      candidates: rows,
      currentlyInContext: !!currentCtxObject(),
      mountActionCaptured: !!mountActionProto,
      selectActionCaptured: !!selectActionProto,
      selectActionWanted: D.selectActionClass || null,
      // מי כתב לשדה של פעולת הבחירה — אם הזיהוי נכשל, התשובה כאן
      classesWritingSelectField: [...selectTrapSeen.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => name + ' ×' + n),
    };
    console.log('[combos] garage-entity diagnostics:', info);
    if (!gameObjectProto) {
      console.warn('[combos] could not learn the entity prototype — the item lookup returned nothing.');
    }
    return info;
  };

  // ניסיוני: מרכיב פריט בודד לפי מזהה, דרך פונקציית השליחה של המשחק.
  // שימוש: __CMB_TRY_MOUNT('920009630987')
  NS.mountItemById = mountItemById;

  // מדווח אם הפריט המבוקש אכן מופיע כמורכב ב-state המקומי
  function mountedNow(idStr) {
    try {
      const F = D.itemFields;
      const items = collect(latestState).items;
      for (const it of items) {
        if (idToString(it[F.id]) === String(idStr)) return it[F.mounted] === true;
      }
    } catch (e) { /* לא קריטי */ }
    return null;
  }

  W.__CMB_TRY_MOUNT = function (id) {
    const r = mountItemById(id);
    if (!r.ok) { console.warn('[combos] mount failed:', r.error); return r; }
    console.log('%c[combos] mount command sent for ' + r.name + ' — checking whether the local view catches up…',
      'color:#7ee787;font-weight:bold');
    // בדיקה אוטומטית: האם ה-state המקומי התעדכן מעצמו (כלומר השרת החזיר אישור)
    setTimeout(() => {
      console.log('[combos] after 1.5s — local state says mounted:', mountedNow(id));
    }, 1500);
    return r;
  };

  // מאתר פריט גולמי לפי מזהה
  function rawItemById(idStr) {
    if (!latestState) return null;
    const F = D.itemFields;
    for (const it of collect(latestState).items) {
      if (idToString(it[F.id]) === String(idStr)) return it;
    }
    return null;
  }

  // ההרכבה בדרך של המשחק עצמו — מעדכנת את המסך *וגם* שולחת לשרת.
  // ‏__CMB_TRY_LOCAL(id)  — עדכון מקומי בלבד, בלי שום תעבורה החוצה (בטוח לאימות)
  // ‏__CMB_TRY_NATIVE(id) — הדבר האמיתי: מקומי + שרת, בקריאה אחת
  function nativeMount(id, needServer) {
    const raw = rawItemById(id);
    if (!raw) return { ok: false, error: 'item not found in state: ' + id };
    const r = mountViaAction(raw, needServer);
    if (!r.ok) { console.warn('[combos] native mount failed:', r.error); return r; }
    const label = needServer ? 'local + server' : 'LOCAL ONLY (nothing sent out)';
    console.log('%c[combos] dispatched the game\'s own mount action (' + label + ') for ' +
      raw[D.itemFields.name] + '. 3D preview refresh: ' +
      (r.previewRefreshed ? 'sent' : 'NOT sent (select-action template not captured yet)'),
      'color:#7ee787;font-weight:bold');
    setTimeout(() => {
      console.log('[combos] after 1s — local state says mounted:', mountedNow(id));
    }, 1000);
    return r;
  }
  W.__CMB_TRY_LOCAL = function (id) { return nativeMount(id, false); };
  W.__CMB_TRY_NATIVE = function (id) { return nativeMount(id, true); };

  // ---- הגנות: קונסול -----------------------------------------------------

  // תמונת מצב של 4 החריצים — לפני ואחרי, כדי לראות מיד אם הפעולה תפסה
  function protectionSnapshot() {
    const F = D.itemFields;
    return currentProtectionSlots().map((it, i) => ({
      slot: i,
      name: it ? it[F.name] : '—',
      id: it ? idToString(it[F.id]) : null,
      lvl: it ? upgradeLevel(it) : null,
    }));
  }

  W.__CMB_PROTECTIONS = function () {
    if (!latestState) { console.warn('[combos] garage state not captured yet'); return null; }
    const F = D.itemFields;
    const found = collect(latestState);
    const snap = currentProtectionSlots(found).map((it, i) => ({
      slot: i,
      name: it ? it[F.name] : '—',
      id: it ? idToString(it[F.id]) : null,
      lvl: it ? upgradeLevel(it) : null,
    }));
    console.log('%c[combos] protection slots (by mountIndex)', 'color:#7ee787;font-weight:bold');
    console.table(snap);
    // כל ההגנות שבבעלות המשתמש, כדי שיהיה מאיפה להעתיק מזהים לניסוי
    const owned = found.items
      .filter((it) => enumName(it[F.category]) === 'RESISTANCE_MODULE' && it[F.owned] === true)
      .map((it) => ({ name: it[F.name], id: idToString(it[F.id]),
                      lvl: upgradeLevel(it), mounted: it[F.mounted] === true }));
    console.log('owned resistance modules: ' + owned.length);
    console.table(owned);
    return { slots: snap, owned };
  };

  // אחרי כל פעולה מדפיסים שוב את החריצים — ה-state נבנה מחדש בכל שיגור,
  // אז ההשוואה לפני/אחרי היא האימות עצמו.
  function reportAfter(label, result) {
    console.log('%c[combos] ' + label, 'color:#7ee787;font-weight:bold', result);
    setTimeout(() => {
      console.log('[combos] protection slots after 1s:');
      console.table(protectionSnapshot());
    }, 1000);
    return result;
  }

  // ‏__CMB_TRY_PROT_UNMOUNT('123') — מסיר הגנה בודדת
  W.__CMB_TRY_PROT_UNMOUNT = function (id) {
    const raw = rawItemById(id);
    if (!raw) { console.warn('[combos] resistance not found in state:', id); return null; }
    return reportAfter('unmount ' + raw[D.itemFields.name], unmountProtection(raw));
  };

  // ‏__CMB_TRY_PROT_MOUNT('123', 0) — מרכיב הגנה בחריץ. שים לב: לא מפנה את
  // החריץ קודם — לשם כך יש את __CMB_TRY_PROTECTIONS, שמחשב diff מלא.
  W.__CMB_TRY_PROT_MOUNT = function (id, slot) {
    const raw = rawItemById(id);
    if (!raw) { console.warn('[combos] resistance not found in state:', id); return null; }
    return reportAfter('mount ' + raw[D.itemFields.name] + ' -> slot ' + slot,
      mountProtection(raw, Number(slot)));
  };

  // ‏__CMB_TRY_PROTECTIONS(['123', null, '456', null]) — הדבר האמיתי:
  // מחיל מצב מלא של 4 חריצים עם אופטימיזציית diff (חריץ תקין לא נוגעים בו).
  W.__CMB_TRY_PROTECTIONS = function (ids) {
    const before = protectionSnapshot();
    const r = applyProtections(ids);
    if (!r.ok && r.error) { console.warn('[combos] apply protections failed:', r.error); return r; }
    console.log('%c[combos] applied protections — untouched slots: ' + r.plan.untouched,
      'color:#7ee787;font-weight:bold', r.plan);
    if (r.errors && r.errors.length) console.warn('[combos] partial failures:', r.errors);
    console.log('before:'); console.table(before);
    setTimeout(() => { console.log('after 1s:'); console.table(protectionSnapshot()); }, 1000);
    return r;
  };

  NS.protections = protectionSnapshot;
  NS.applyProtections = applyProtections;

  // ---- אוגמנטים: קונסול --------------------------------------------------

  // מה מותקן על כל תותח/גוף מורכב, ומה זמין לו — כדי שיהיה מאיפה להעתיק
  // מזהים לניסוי.
  W.__CMB_AUGMENTS = function () {
    if (!latestState) { console.warn('[combos] garage state not captured yet'); return null; }
    const DF = D.deviceFields;
    if (!DF) { console.warn('[combos] device fields were not discovered'); return null; }
    const IF = D.itemFields;
    const found = collect(latestState);
    const catalog = stateDevices();

    const rows = [];
    const available = [];
    for (const it of found.items) {
      if (it[IF.mounted] !== true) continue;
      const cat = enumName(it[IF.category]);
      if (cat !== 'WEAPON' && cat !== 'ARMOR') continue;
      const base = baseItemIdOf(it);
      const inst = installedDeviceFor(it);
      rows.push({
        item: it[IF.name], itemId: idToString(it[IF.id]),
        installed: inst ? inst[DF.name] : '—',
        augmentId: inst ? idToString(inst[DF.id]) : null,
      });
      for (const d of catalog) {
        if (idToString(d[DF.baseItemId]) !== base) continue;
        available.push({
          forItem: it[IF.name], name: d[DF.name], augmentId: idToString(d[DF.id]),
          installed: d[DF.installed] === true,
          owned: deviceOwned(d),
        });
      }
    }

    console.log('%c[combos] augments on the mounted turret/hull', 'color:#7ee787;font-weight:bold');
    console.table(rows);
    const ownedCount = available.filter((a) => a.owned).length;
    console.log('catalog for those items: ' + available.length + ' (owned: ' + ownedCount +
      ') — equipping refuses owned:false');
    console.table(available);
    return { mounted: rows, available };
  };

  // ‏__CMB_TRY_AUGMENT(itemId, augmentId)  — מחיל אוגמנט על פריט
  // ‏__CMB_TRY_AUGMENT(itemId, null)       — מסיר את האוגמנט מהפריט
  W.__CMB_TRY_AUGMENT = function (itemId, augmentId) {
    const raw = rawItemById(itemId);
    if (!raw) { console.warn('[combos] item not found in state:', itemId); return null; }
    const r = applyAugment(raw, augmentId == null ? null : augmentId);
    if (!r.ok) { console.warn('[combos] augment failed:', r.error); return r; }
    if (!r.changed) {
      console.log('%c[combos] already correct — nothing dispatched (kept: ' + r.kept + ')',
        'color:#8b949e');
      return r;
    }
    console.log('%c[combos] augment applied on ' + r.item + ': removed=' + r.removed +
      ' installed=' + r.installed, 'color:#7ee787;font-weight:bold', r);
    setTimeout(() => {
      const now = installedDeviceFor(rawItemById(itemId));
      console.log('[combos] after 1s — installed augment is now: ' +
        (now ? now[D.deviceFields.name] : 'none'));
    }, 1000);
    return r;
  };

  NS.applyAugment = applyAugment;
  NS.installedAugment = function (itemId) {
    const raw = rawItemById(itemId);
    return raw ? installedDeviceFor(raw) : null;
  };

  // ---- צבע וסקינים: קונסול ----------------------------------------------
  //
  // אלה **פריטי מוסך רגילים** (קטגוריות PAINT / SKIN), כלומר הרכבתם היא
  // בדיוק אותה פעולה של תותח או גוף — אין להם מסלול כתיבה משלהם, ולכן
  // __CMB_TRY_NATIVE(id) הוא כל מה שדרוש. מה שכן היה חסר זה דרך לראות את
  // המזהים כדי לנסות; זה מה שהפונקציה הזו נותנת.
  //
  // הסתייגות ידועה: פעולת ה"בחירה" שמרעננת את מודל התלת-ממד חלה רק על חלק
  // מהקטגוריות. ייתכן שסקין יורכב נכון אבל המודל לא יתעדכן עד ריענון — אם
  // כך יקרה, המענה הוא GarageSelectSkin, שכבר אותר בבאנדל.
  W.__CMB_DECOR = function () {
    if (!latestState) { console.warn('[combos] garage state not captured yet'); return null; }
    const F = D.itemFields;
    const found = collect(latestState);

    // מה מורכב על התותח/גוף כרגע — כדי לסמן איזה סקין פעיל
    const activeSkinIds = new Set();
    for (const it of found.items) {
      if (it[F.mounted] !== true) continue;
      for (const f of [F.mountedSkin, F.mountedShotSkin]) {
        const v = f ? it[f] : null;
        if (v != null) activeSkinIds.add(idToString(v));
      }
    }

    const pick = (cat) => found.items
      .filter((it) => enumName(it[F.category]) === cat && it[F.owned] === true)
      .map((it) => ({
        name: it[F.name],
        id: idToString(it[F.id]),
        mounted: it[F.mounted] === true || activeSkinIds.has(idToString(it[F.id])),
      }));

    const paints = pick('PAINT');
    const skins = pick('SKIN');

    console.log('%c[combos] owned paints: ' + paints.length, 'color:#7ee787;font-weight:bold');
    console.table(paints);
    console.log('%c[combos] owned turret/hull skins: ' + skins.length, 'color:#7ee787;font-weight:bold');
    console.table(skins);
    console.log('%cPaint is an ordinary garage item — equip it with __CMB_TRY_NATIVE(id).\n' +
      'Skins are NOT: they work like augments — __CMB_TRY_SKIN(turretOrHullId, skinId).',
      'color:#8b949e');
    return { paints, skins };
  };

  // ‏__CMB_TRY_SKIN('turretId', 'skinId') — מחיל סקין על תותח או גוף
  W.__CMB_TRY_SKIN = function (itemId, skinId) {
    const raw = rawItemById(itemId);
    if (!raw) { console.warn('[combos] item not found in state:', itemId); return null; }
    const r = applySkin(raw, skinId);
    if (!r.ok) { console.warn('[combos] skin failed:', r.error); return r; }
    if (!r.changed) { console.log('%c[combos] that skin is already applied — nothing dispatched',
      'color:#8b949e'); return r; }
    console.log('%c[combos] applied skin ' + r.skin + ' to ' + r.item +
      '. 3D preview refresh: ' + (r.previewRefreshed ? 'sent' : 'NOT sent'),
      'color:#7ee787;font-weight:bold');
    setTimeout(() => {
      const now = rawItemById(itemId);
      const F = D.itemFields;
      console.log('[combos] after 1s — mountedSkin is now: ' +
        (now && F.mountedSkin ? idToString(now[F.mountedSkin]) : '?'));
    }, 1000);
    return r;
  };

  NS.applySkin = applySkin;

  // ---- boot -------------------------------------------------------------
  armAll();   // כיסוי מיידי עם שמות ה-seed, עד שהגילוי חוזר
  window.postMessage({ __cmb: true, dir: 'm2i', action: 'ready' }, '*');
  console.log('[combos] garage-state hook armed. Use __CMB_READ() for the current loadout, ' +
    '__CMB_PROTECTIONS() / __CMB_AUGMENTS() for those slots, __CMB_STATE() for diagnostics.');
})();
