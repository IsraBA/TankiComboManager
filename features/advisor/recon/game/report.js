// features/advisor/recon/game/report.js  [MAIN world]

// פירוק מצב הקרב לשחקנים ודירוג האיום לפי תותח.

(function () {
  'use strict';

  const W = window;
  const NS = (W.__ADV = W.__ADV || {});
  const I = (NS.internals = NS.internals || {});

  // ---- קריאת שדות ----

  // שם סמנטי -> ממוזער, מתוך קוד ה-toString של המחלקה עצמה
  const mapCache = new WeakMap();
  I.fieldMap = function (o) {
    const proto = Object.getPrototypeOf(o);
    if (!proto || typeof proto.toString !== 'function') return null;
    if (mapCache.has(proto)) return mapCache.get(proto);
    let m = null;
    try {
      const src = String(proto.toString);
      const re = /[,(] ?([A-Za-z0-9_]+)="\+(?:[A-Za-z0-9_$]+\()*this\.([A-Za-z0-9_$]+)/g;
      let x;
      while ((x = re.exec(src))) {
        m = m || {};
        m[x[1]] = x[2];
      }
    } catch (e) {
      m = null;
    }
    mapCache.set(proto, m);
    return m;
  };

  // פרימיטיב כמו שהוא, אחרת toString (Long, enum, אוספים)
  I.cell = function (v) {
    if (v == null) return null;
    if (typeof v === 'number' || typeof v === 'boolean') return v;
    try {
      return String(v);
    } catch (e) {
      return null;
    }
  };

  // ---- פירוק מחרוזות toString של קוטלין ----

  // פיצול ב-", " רק ברמה העליונה, בלי להיכנס לסוגריים
  function splitTop(s) {
    const out = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '[' || c === '{' || c === '(') depth++;
      else if (c === ']' || c === '}' || c === ')') depth--;
      else if (c === ',' && depth === 0 && s[i + 1] === ' ') {
        out.push(s.slice(start, i));
        start = i + 2;
        i++;
      }
    }
    if (start < s.length) out.push(s.slice(start));
    return out;
  }

  // "{id=ערך, id=ערך}" -> אובייקט
  I.parseKMap = function (s) {
    const out = {};
    if (!s || s[0] !== '{') return out;
    const inner = s.slice(1, -1);
    if (!inner) return out;
    for (const e of splitTop(inner)) {
      const eq = e.indexOf('=');
      if (eq > 0) out[e.slice(0, eq)] = e.slice(eq + 1);
    }
    return out;
  };

  // "[a, b, c]" -> מערך
  I.parseList = function (s) {
    if (!s || s[0] !== '[' || s.length < 3) return [];
    return splitTop(s.slice(1, -1));
  };

  // "field = value" מתוך פורמט הסוגריים המרובעים
  function tok(s, field) {
    const x = s.match(new RegExp(field + ' = (\\S+)'));
    return x && x[1] !== 'null' ? x[1] : null;
  }
  function tokNum(s, field) {
    const v = tok(s, field);
    return v == null ? null : Number(v);
  }

  function resistances(s) {
    if (!s) return null;
    const out = [];
    const re = /resistanceInPercent = (\d+) resistanceProperty = ([A-Z_]+)/g;
    let x;
    while ((x = re.exec(s))) out.push(x[2] + ':' + x[1]);
    return out.length ? out.join(' ') : null;
  }

  // ---- ה-state של המוסך: סריקה אחת לכל גרסת state ----

  // הסריקה יקרה; כל הקוראים חולקים אותה דרך ה-cache הזה
  let gCache = { state: null, col: null, D: null };
  I.garageCol = function () {
    const C = W.__CMB && W.__CMB.internals;
    if (!C || !C.latestState || !C.collect || !C.D) return null;
    if (gCache.state !== C.latestState) {
      try {
        gCache = { state: C.latestState, col: C.collect(C.latestState), D: C.D };
      } catch (e) {
        NS.debug.lastError = String(e);
        return null;
      }
    }
    return gCache.col ? gCache : null;
  };

  function itemName(idStr) {
    const g = I.garageCol();
    if (!g || !idStr) return null;
    const it = g.col.byId.get(String(idStr));
    return it ? I.cell(it[g.D.itemFields.name]) : null;
  }

  function deviceName(idStr) {
    const g = I.garageCol();
    if (!g || !idStr || !g.D.deviceFields) return null;
    for (const d of g.col.devices) {
      if (I.cell(d[g.D.deviceFields.id]) === String(idStr)) {
        return I.cell(d[g.D.deviceFields.name]);
      }
    }
    return null;
  }

  // ---- בניית השחקנים ----

  // ה-roster נבנה מחדש בכל שינוי, ולכן רפרנס זהה = תוכן זהה
  let uCache = { roster: null, gstate: null, users: null };

  I.buildUsers = function () {
    const o = I.roster;
    if (!o) return [];
    const g = I.garageCol();
    const gstate = g ? g.state : null;
    if (uCache.roster === o && uCache.gstate === gstate) return uCache.users;

    const m = I.fieldMap(o);
    if (!m) return [];
    const km = (f) => I.parseKMap(I.cell(o[m[f]]));
    const uids = km('uids');
    const teams = km('teams');
    const ranks = km('ranks');
    const clans = km('clanTags');
    const stats = km('stats');
    const gear = km('gearScores');
    const tank = km('tankInfo');
    const res = km('tankResistance');
    const online = new Set(I.parseList(I.cell(o[m.onlineUsers])));

    const selfTeam = I.selfId != null ? teams[I.selfId] : null;
    const users = [];
    for (const id of Object.keys(uids)) {
      const st = stats[id] || '';
      // tankInfo מתרוקן זמנית (מוות, מוסך) — נופלים ל-cache
      const t = tank[id] || (I.tankCache || {})[id] || '';
      const rs = res[id] != null ? res[id] : (I.resCache || {})[id];
      const me = id === I.selfId;
      let enemy = null;
      if (selfTeam === 'NONE') enemy = !me;
      else if (selfTeam) enemy = teams[id] !== selfTeam;
      users.push({
        id,
        name: uids[id],
        team: teams[id] || null,
        me,
        enemy,
        online: online.has(id),
        score: tokNum(st, 'score'),
        kills: tokNum(st, 'kills'),
        deaths: tokNum(st, 'deaths'),
        rank: ranks[id] != null ? Number(ranks[id]) : null,
        gearScore: gear[id] != null ? Number(gear[id]) : null,
        clan: clans[id] === 'null' ? null : clans[id] || null,
        weaponBase: tok(t, 'weaponBaseId'),
        weapon:
          itemName(tok(t, 'weaponId')) ||
          itemName(tok(t, 'weaponBaseId')) ||
          tok(t, 'weaponBaseId'),
        weaponAugment: deviceName(tok(t, 'weaponDeviceId')) || tok(t, 'weaponDeviceId'),
        hull: itemName(tok(t, 'hullId')) || itemName(tok(t, 'hullBaseId')) || tok(t, 'hullBaseId'),
        hullAugment: deviceName(tok(t, 'hullDeviceId')) || tok(t, 'hullDeviceId'),
        resistances: resistances(rs),
      });
    }
    uCache = { roster: o, gstate, users };
    return users;
  };

  // ---- דירוג האיום ----

  // הרוגים לכל תותח, על פני כל האויבים המחוברים.
  // שוברי שוויון: נקודות, מחזיקים, gearScore, מזהה — לסדר יציב.
  I.rankTurrets = function () {
    const users = I.buildUsers();
    const known = users.some((u) => u.enemy != null);
    const agg = new Map();
    for (const u of users) {
      if (known && u.enemy !== true) continue;
      if (!u.online || !u.weaponBase) continue;
      let a = agg.get(u.weaponBase);
      if (!a) {
        a = { base: u.weaponBase, name: u.weapon, kills: 0, score: 0, carriers: 0, gs: 0 };
        agg.set(u.weaponBase, a);
      }
      a.kills += u.kills || 0;
      a.score += u.score || 0;
      a.gs += u.gearScore || 0;
      a.carriers++;
    }
    return Array.from(agg.values()).sort(
      (x, y) =>
        y.kills - x.kills ||
        y.score - x.score ||
        y.carriers - x.carriers ||
        y.gs - x.gs ||
        (x.base < y.base ? -1 : 1),
    );
  };
})();
