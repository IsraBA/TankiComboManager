// features/advisor/recon/game/probe.js  [MAIN world]

// POC זמני: מלכודות מצב הקרב + הדפסה בכל פעולת שינוי. יוסר בהמשך.

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

  // ---- הדפסה מקובצת: פרץ שינויים -> הדפסה אחת ----

  let pending = null;
  const reasons = new Map();
  function requestPrint(kind, name) {
    if (!reasons.has(kind)) reasons.set(kind, []);
    reasons.get(kind).push(name);
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      // פרץ של 26 הצטרפויות מתכווץ ל-"joined x26"
      const parts = [];
      for (const [kind, names] of reasons) {
        parts.push(
          names.length > 3
            ? kind + ' x' + names.length
            : kind + ': ' + names.join(', '),
        );
      }
      reasons.clear();
      I.printRoster(parts.join(' | '));
    }, 300);
  }

  // ---- מטפלי לכידה ----

  let prevOnline = new Set();
  let battleId = null;
  I.tankCache = {};
  I.resCache = {};

  // פעולות השינוי: הצטרפות, עזיבה, החלפת ציוד או הגנות
  function onRoster(o) {
    NS.debug.rosterCaptures++;
    I.roster = o;
    const m = I.fieldMap(o);
    if (!m) return;
    const uids = I.parseKMap(I.cell(o[m.uids]));
    const online = new Set(I.parseList(I.cell(o[m.onlineUsers])));
    const tank = I.parseKMap(I.cell(o[m.tankInfo]));
    const res = I.parseKMap(I.cell(o[m.tankResistance]));
    const nameOf = (id) => uids[id] || id;

    for (const id of online) {
      if (!prevOnline.has(id)) requestPrint('joined', nameOf(id));
    }
    for (const id of prevOnline) {
      if (!online.has(id)) requestPrint('left', nameOf(id));
    }
    // השוואה מול ה-cache: התרוקנות זמנית של המפה איננה שינוי
    for (const id of Object.keys(tank)) {
      if (prevOnline.has(id) && I.tankCache[id] && I.tankCache[id] !== tank[id]) {
        requestPrint('equip', nameOf(id));
      }
      I.tankCache[id] = tank[id];
    }
    for (const id of Object.keys(res)) {
      if (prevOnline.has(id) && I.resCache[id] != null && I.resCache[id] !== res[id]) {
        requestPrint('protections', nameOf(id));
      }
      I.resCache[id] = res[id];
    }
    prevOnline = online;
  }

  function onBattle(o) {
    NS.debug.battleCaptures++;
    I.battle = o;
    const m = I.fieldMap(o);
    if (!m || !m.battleId) return;
    const loaded = o[m.battleLoaded] === true;
    const id = I.cell(o[m.battleId]);
    // '0' הוא ה-state ההתחלתי, לא קרב
    if (loaded && id !== '0' && id !== battleId) {
      battleId = id;
      console.log('[ADV] entered battle', {
        battleId: id,
        map: I.cell(o[m.mapNameWithoutMode]) || I.cell(o[m.mapName]),
        mode: I.cell(o[m.mode]),
        format: I.cell(o[m.battleFormat]),
        reArmorEnabled: I.cell(o[m.isReArmorEnabled]),
        scoreLimit: I.cell(o[m.scoreLimit]),
        valuable: I.cell(o[m.valuableBattle]),
        mm: I.cell(o[m.isMMBattle]),
      });
    } else if (!loaded && battleId != null) {
      battleId = null;
      prevOnline = new Set();
      I.tankCache = {};
      I.resCache = {};
      console.log('[ADV] left battle');
    }
  }

  let localSig = null;
  function onLocal(o) {
    NS.debug.localCaptures++;
    I.local = o;
    const m = I.fieldMap(o);
    if (!m) return;
    const wrp = I.cell(o[m.weaponResistanceProperty]);
    const dis = I.cell(o[m.isReArmorTemporaryDisabled]);
    const sig = wrp + '|' + dis;
    if (sig === localSig) return;
    localSig = sig;
    console.log('[ADV] local re-arm state', {
      weaponResistanceProperty: wrp,
      isReArmorTemporaryDisabled: dis,
    });
  }

  // הפרופיל שלנו — מזהה מי "אני" ומכאן מי האויב
  function onUser(o) {
    NS.debug.userCaptures++;
    const m = I.fieldMap(o);
    if (!m || !m.id) return;
    const id = I.cell(o[m.id]);
    // '0' הוא ה-state ההתחלתי, לפני התחברות
    if (!id || id === '0') return;
    const name = I.cell(o[m.uid]);
    const isNew = id !== I.selfId;
    I.selfId = id;
    if (name) I.selfName = name;
    if (isNew) {
      console.log('[ADV] self: ' + (I.selfName || '?') + ' (' + id + ')');
      if (I.roster) requestPrint('self identified', id);
    }
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
      users: I.buildUsers(),
    };
  };

  armTrap('rq4_1', '"BattleUsers(', onRoster);
  armTrap('ipw_1', '"BattleStatistics(', onBattle);
  armTrap('sq2_1', '"LocalBattleUserState(', onLocal);
  armTrap('fqi_1', '"User(', onUser);
})();
