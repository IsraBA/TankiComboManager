// features/advisor/recon/game/probe.js  [MAIN world]

// מלכודות מצב הקרב. אוסף בלבד — שום פלט, שום עבודה מעבר ללכידה.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__ADV = W.__ADV || {});
  const I = (NS.internals = NS.internals || {});
  NS.debug = {
    rosterCaptures: 0,
    battleCaptures: 0,
    localCaptures: 0,
    userCaptures: 0,
    skipped: 0,
    discovered: false,
    lastError: null,
  };

  I.tankCache = {};
  I.resCache = {};
  let battleId = null;
  let lastTankRef = null;
  let lastResRef = null;

  // ---- מטפלי לכידה ----

  // המפות מתרוקנות זמנית (מוות, מוסך); ה-cache מחזיק את האחרון הידוע.
  // ה-state אימוטבילי: שדה שלא השתנה שומר רפרנס, ואז אין מה לפרק.
  function onRoster(o) {
    NS.debug.rosterCaptures++;
    I.roster = o;
    const m = I.fieldMap(o);
    if (!m) return;
    const t = o[m.tankInfo];
    if (t !== lastTankRef) {
      lastTankRef = t;
      const tank = I.parseKMap(I.cell(t));
      for (const id of Object.keys(tank)) I.tankCache[id] = tank[id];
    }
    const r = o[m.tankResistance];
    if (r !== lastResRef) {
      lastResRef = r;
      const res = I.parseKMap(I.cell(r));
      for (const id of Object.keys(res)) I.resCache[id] = res[id];
    }
  }

  function onBattle(o) {
    NS.debug.battleCaptures++;
    I.battle = o;
    const m = I.fieldMap(o);
    if (!m || !m.battleId) return;
    const loaded = o[m.battleLoaded] === true;
    const id = I.cell(o[m.battleId]);
    // '0' הוא ה-state ההתחלתי, לא קרב
    if (loaded && id !== '0') {
      battleId = id;
    } else if (!loaded && battleId != null) {
      battleId = null;
      I.tankCache = {};
      I.resCache = {};
      lastTankRef = null;
      lastResRef = null;
    }
  }

  function onLocal(o) {
    NS.debug.localCaptures++;
    I.local = o;
  }

  // הפרופיל שלנו — מזהה מי "אני" ומכאן מי האויב
  function onUser(o) {
    NS.debug.userCaptures++;
    const m = I.fieldMap(o);
    if (!m || !m.id) return;
    const id = I.cell(o[m.id]);
    // '0' הוא ה-state ההתחלתי, לפני התחברות
    if (!id || id === '0') return;
    I.selfId = id;
    const name = I.cell(o[m.uid]);
    if (name) I.selfName = name;
  }

  // ---- המלכודות ----

  // זיהוי לפי שם המחלקה בקוד ה-toString שלה
  function looksLike(o, marker) {
    if (!o || typeof o !== 'object') return false;
    try {
      return String(Object.getPrototypeOf(o).toString).indexOf(marker) !== -1;
    } catch (e) {
      return false;
    }
  }

  // שדה -> הסמנים שמאזינים עליו. הגילוי עשוי להחזיר שם שה-SEED כבר
  // חימש עבור מחלקה אחרת, ודילוג שם היה מוחק את הלכידה בשקט.
  I.armed = new Map();

  function armTrap(prop, marker, onCapture) {
    try {
      const mine = I.armed.get(prop);
      if (mine) {
        if (!mine.some((e) => e.marker === marker)) mine.push({ marker, onCapture });
        return;
      }
      // שדה שכבר בשימוש מלכודת זרה (הקומבואים, תוסף אחר) — לא דורסים
      if (Object.getOwnPropertyDescriptor(W.Object.prototype, prop)) {
        NS.debug.skipped++;
        return;
      }
      const list = [{ marker, onCapture }];
      I.armed.set(prop, list);
      Object.defineProperty(W.Object.prototype, prop, {
        configurable: true,
        enumerable: false,
        get() {
          return undefined;
        },
        set(v) {
          // שומרים כ-own property, כדי שהאובייקט יפסיק לעבור דרכנו
          Object.defineProperty(this, prop, {
            value: v,
            writable: true,
            configurable: true,
            enumerable: true,
          });
          for (const e of list) {
            try {
              if (looksLike(this, e.marker)) e.onCapture(this);
            } catch (err) {
              NS.debug.lastError = String(err);
            }
          }
        },
      });
    } catch (e) {
      NS.debug.lastError = String(e);
    }
  }

  NS.raw = function () {
    return {
      battle: I.battle,
      roster: I.roster,
      local: I.local,
      selfId: I.selfId,
      turrets: I.rankTurrets(),
      users: I.buildUsers(),
    };
  };

  // מפתח -> [שם המחלקה לאימות, מטפל]
  const MARKERS = {
    battleUsers: ['"BattleUsers(', onRoster],
    battleStatistics: ['"BattleStatistics(', onBattle],
    localBattleUserState: ['"LocalBattleUserState(', onLocal],
    user: ['"User(', onUser],
  };

  // שמות הבילד האחרון הידוע (f1de53fa) — נדרסים ע"י recon/detect.js
  const SEED = {
    battleUsers: 'wq4_1',
    battleStatistics: 'lpw_1',
    localBattleUserState: 'xq2_1',
    user: 'kqi_1',
  };

  function armAll(fields) {
    for (const key of Object.keys(MARKERS)) {
      const prop = fields[key];
      if (typeof prop === 'string' && /^[\w$]+_1$/.test(prop)) {
        armTrap(prop, MARKERS[key][0], MARKERS[key][1]);
      }
    }
  }

  armAll(SEED);

  // השמות שהתגלו לבילד הרץ; שדה שכבר חמוש נשאר כמות שהוא
  W.addEventListener('message', (e) => {
    if (e.source !== W) return;
    const m = e.data;
    if (!m || !m.__adv || m.dir !== 'i2m' || m.action !== 'advisorFields') return;
    if (!m.payload) return;
    armAll(m.payload);
    NS.debug.discovered = true;
  });
  W.postMessage({ __adv: true, dir: 'm2i', action: 'ready' }, '*');
})();
