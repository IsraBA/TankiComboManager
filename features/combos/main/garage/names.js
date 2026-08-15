// features/combos/main/garage/names.js  [MAIN world]

// שמות ממוזערים של הבילד (seed + מה שהתגלה), מוני דיבוג ומיפוי קטגוריות.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  // מרחב פנימי משותף לכל קבצי garage/ (המצב החי, העוזרים והפרוטוטייפים)
  const I = (NS.internals = NS.internals || {});

  // שמות הבילד האחרון הידוע (main.1327298e.js) — נדרסים ע"י isolated/detect.js
  const SEED = {
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
      modificationIndex: 'wcd_1',
    },
    upgradeFields: {
      currentLevel: 'dr8_1',
    },
    maxLevelMethod: 'wri',
    deviceFields: {
      id: 'jra_1',
      baseItemId: 'kra_1',
      installed: 'lra_1',
      name: 'mra_1',
      category: 'nra_1',
      previewImage: 'sra_1',
      // דגל הבעלות במשחק: infinityLifetimeItem ? BOUGHT : NOT_OWNED
      infinityLifetimeItem: 'arb_1',
    },
    urlMethod: 'r92',
    // ה-proxy של המוסך — דרכו מגיעים לקונטרולר ול-store
    proxyTrapField: 'ccn_1',
    proxyMountMethod: 'ecn',
    proxyMethods: ['ecn', 'fcn', 'gcn', 'hcn'],
    proxyCcField: 'dcn_1',
    mountActionClass: '$U',
    actionItemField: 'vrd_1',
    actionNeedServerField: 'wrd_1',
    selectActionClass: 'KB',
    selectItemIdField: 'brc_1',
    // הגנות: משגרים את הנמוכות (apply/unmount); שמות ה-thunks לתיעוד בלבד
    resistApplyClass: 'FU',
    resistApplyFields: { resistance: 'kre_1', index: 'lre_1', needServerMount: 'mre_1' },
    resistUnmountClass: 'QB',
    resistUnmountFields: { resistance: 'mrc_1', needServerUnmount: 'nrc_1' },
    resistMountClass: 'tU',
    resistMountFields: { resistance: 'prc_1', index: 'qrc_1' },
    mountThunkClass: 'JB',
    mountThunkFields: { item: 'jrc_1', needServerMount: 'krc_1' },
    // אוגמנטים (Devices)
    deviceInsertClass: 'CF',
    deviceInsertFields: { device: 'gri_1', item: 'hri_1' },
    deviceRemoveClass: 'SF',
    deviceRemoveFields: { device: 'irg_1', item: 'jrg_1' },
    deviceLoadClass: 'vU',
    deviceLoadFields: { itemId: 'hrd_1' },
    // סקין — פעולה בצורת אוגמנט, לא הרכבת פריט
    skinMountClass: 'lU',
    skinMountFields: { skin: 'erd_1', item: 'frd_1' },
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
