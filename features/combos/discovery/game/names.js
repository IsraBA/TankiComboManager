// features/combos/discovery/game/names.js  [MAIN world]

// שמות ממוזערים של הבילד (seed + מה שהתגלה), מוני דיבוג ומיפוי קטגוריות.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  // מרחב פנימי משותף לכל קבצי game/ (המצב החי, העוזרים והפרוטוטייפים)
  const I = (NS.internals = NS.internals || {});

  // שמות הבילד האחרון הידוע (main.f1de53fa.js) — נדרסים ע"י discovery/detect.js
  const SEED = {
    trapField: 'aq1_1',
    stateFields: {
      itemsOnDepot: 'wpz_1',
      mountedItems: 'ypz_1',
      items: 'aq0_1',
      devices: 'bq0_1',
      isLoaded: 'dq0_1',
      currentCategory: 'eq0_1',
      // חותמת סיום מוחלטת ל-cooldown ההצטיידות (0 = אין הגבלה)
      delayMountTimeMs: 'lq0_1',
      unlockedProtectionSlots: 'sq0_1',
    },
    itemFields: {
      id: 'nr3_1',
      name: 'or3_1',
      category: 'pr3_1',
      preview: 'ur3_1',
      owned: 'wr3_1',
      mounted: 'yr3_1',
      mountIndex: 'zr3_1',
      modification: 'er4_1',
      upgradeableParams: 'gr4_1',
      mountedSkin: 'rr4_1',
      mountedShotSkin: 'sr4_1',
      skinPreview: 'tr4_1',
      // מזהי הסקינים של הפריט — הקישור היחיד בין סקין לתותח/גוף
      availableSkins: 'pr4_1',
      // לרנדומייזר: נדירות, ומלאי לרימונים
      rarity: 'vr4_1',
      count: 'hr4_1',
      countable: 'jr4_1',
    },
    modificationFields: {
      baseItemId: 'vcd_1',
      // כמה דרגות Mk קיימות לסוג הזה — קבוע, לא הדרגה הנוכחית
      modificationCount: 'wcd_1',
      modificationIndex: 'xcd_1',
    },
    upgradeFields: {
      currentLevel: 'ir8_1',
    },
    maxLevelMethod: 'erj',
    // currentLevel >= maxLevel() — המבחן של המשחק ל"אין מה לשדרג"
    isMaxedMethod: 'mr8',
    deviceFields: {
      id: 'ora_1',
      baseItemId: 'pra_1',
      installed: 'qra_1',
      name: 'rra_1',
      category: 'sra_1',
      previewImage: 'xra_1',
      // דגל הבעלות במשחק: infinityLifetimeItem ? BOUGHT : NOT_OWNED
      infinityLifetimeItem: 'frb_1',
      rarity: 'orb_1',
    },
    urlMethod: 'r92',
    // ה-proxy של המוסך — דרכו מגיעים לקונטרולר ול-store
    proxyTrapField: 'dcn_1',
    proxyMountMethod: 'fcn',
    proxyMethods: ['fcn', 'gcn', 'hcn', 'icn'],
    proxyCcField: 'ecn_1',
    mountActionClass: 'jU',
    actionItemField: 'zrd_1',
    actionNeedServerField: 'are_1',
    selectActionClass: 'YB',
    selectItemIdField: 'grc_1',
    // הגנות: משגרים את הנמוכות (apply/unmount); שמות ה-thunks לתיעוד בלבד
    resistApplyClass: 'FU',
    resistApplyFields: { resistance: 'ore_1', index: 'pre_1', needServerMount: 'qre_1' },
    resistUnmountClass: 'tU',
    resistUnmountFields: { resistance: 'rrc_1', needServerUnmount: 'src_1' },
    resistMountClass: 'nU',
    resistMountFields: { resistance: 'urc_1', index: 'vrc_1' },
    mountThunkClass: 'ZB',
    mountThunkFields: { item: 'orc_1', needServerMount: 'prc_1' },
    // אוגמנטים (Devices)
    deviceInsertClass: 'TF',
    deviceInsertFields: { device: 'ori_1', item: 'pri_1' },
    deviceRemoveClass: 'EF',
    deviceRemoveFields: { device: 'qrg_1', item: 'rrg_1' },
    deviceLoadClass: 'wU',
    deviceLoadFields: { itemId: 'mrd_1' },
    // סקין — פעולה בצורת אוגמנט, לא הרכבת פריט
    skinMountClass: 'vU',
    skinMountFields: { skin: 'jrd_1', item: 'krd_1' },
  };

  I.SEED = SEED;
  I.D = SEED;              // מפת השמות הפעילה
  I.latestState = null;    // מופע ה-state האחרון שנתפס

  // רשימת שדות ה-state, מחושבת מראש — ה-setter של ה-trap הוא נתיב חם
  I.stateFieldList = Object.values(SEED.stateFields);

  // מיפוי קטגוריות המשחק לחריצי הקומבו
  I.CATEGORY_TO_SLOT = {
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

  NS.debug = {
    discovered: false,
    proxyCaptured: false,
    mountActionCaptured: false,
    mountActionSource: null,
    selectActionCaptured: false,
    selectsSent: 0,
    storeFound: null,
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
    cooldownBlocks: 0,
    captures: 0,
    reads: 0,
    lastReadMs: 0,
    lastNodes: 0,
    truncated: false,
    lastError: null,
  };

  // החלפת מפת השמות במה שהתגלה לבילד הרץ, והתקנת המלכודות מחדש
  I.applyNames = function (d) {
    I.D = d;
    I.stateFieldList = Object.values(d.stateFields);
    NS.debug.discovered = true;
    I.armAll();
  };

  NS.names = function () { return I.D; };
  NS.state = function () { return I.latestState; };
})();
