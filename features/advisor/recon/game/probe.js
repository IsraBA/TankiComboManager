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
    lastError: null,
  };

  // שדות הבילד הנוכחי (1327298e); האחרון שהבנאי כותב. גילוי — בהמשך.
  // rq4_1=BattleUsers, ipw_1=BattleStatistics,
  // sq2_1=LocalBattleUserState, fqi_1=User (הפרופיל שלנו)

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

  function armTrap(prop, marker, onCapture) {
    try {
      // שדה שכבר בשימוש מלכודת אחרת — לא דורסים
      if (Object.getOwnPropertyDescriptor(W.Object.prototype, prop)) {
        NS.debug.skipped++;
        return;
      }
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
          try {
            if (looksLike(this, marker)) onCapture(this);
          } catch (e) {
            NS.debug.lastError = String(e);
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

  armTrap('rq4_1', '"BattleUsers(', onRoster);
  armTrap('ipw_1', '"BattleStatistics(', onBattle);
  armTrap('sq2_1', '"LocalBattleUserState(', onLocal);
  armTrap('fqi_1', '"User(', onUser);
})();
