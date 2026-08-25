// features/advisor/recon/game/report.js  [MAIN world]

// POC זמני: פירוק מצב הקרב לאובייקטים מסודרים והדפסתם. יוסר בהמשך.

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

  // ---- פתרון שמות דרך ה-state של המוסך ----

  let gCache = { state: null };
  function garage() {
    const C = W.__CMB && W.__CMB.internals;
    if (!C || !C.latestState || !C.collect || !C.D) return null;
    if (gCache.state !== C.latestState) {
      try {
        const col = C.collect(C.latestState);
        gCache = { state: C.latestState, col, D: C.D };
      } catch (e) {
        return null;
      }
    }
    return gCache.col ? gCache : null;
  }

  function itemName(idStr) {
    const g = garage();
    if (!g || !idStr) return null;
    const it = g.col.byId.get(String(idStr));
    return it ? I.cell(it[g.D.itemFields.name]) : null;
  }

  function deviceName(idStr) {
    const g = garage();
    if (!g || !idStr || !g.D.deviceFields) return null;
    for (const d of g.col.devices) {
      if (I.cell(d[g.D.deviceFields.id]) === String(idStr)) {
        return I.cell(d[g.D.deviceFields.name]);
      }
    }
    return null;
  }

  // ---- בניית השחקנים והדפסה ----

  I.buildUsers = function () {
    const o = I.roster;
    if (!o) return [];
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
        weapon: itemName(tok(t, 'weaponId')) || itemName(tok(t, 'weaponBaseId')) || tok(t, 'weaponBaseId'),
        weaponAugment: deviceName(tok(t, 'weaponDeviceId')) || tok(t, 'weaponDeviceId'),
        hull: itemName(tok(t, 'hullId')) || itemName(tok(t, 'hullBaseId')) || tok(t, 'hullBaseId'),
        hullAugment: deviceName(tok(t, 'hullDeviceId')) || tok(t, 'hullDeviceId'),
        resistances: resistances(rs),
      });
    }
    // אויבים קודם, בתוך כל קבוצה לפי ניקוד יורד
    users.sort(
      (a, b) =>
        (b.enemy === true) - (a.enemy === true) ||
        (b.score || 0) - (a.score || 0),
    );
    return users;
  };

  I.printRoster = function (why) {
    const users = I.buildUsers();
    if (!users.length) return;
    // אויבים בלבד; לפני זיהוי עצמי אין חלוקה ומראים הכל
    const known = users.some((u) => u.enemy != null);
    const rows = users
      .filter((u) => (known ? u.enemy === true : true) && u.online)
      .map((u) => ({
        name: u.name,
        turret: u.weapon,
        turretAugment: u.weaponAugment,
        score: u.score,
      }));
    if (!rows.length) return;
    let head = '[ADV] ' + why;
    const b = I.battle;
    const bm = b && I.fieldMap(b);
    if (bm) {
      head +=
        ' @ ' +
        (I.cell(b[bm.mapNameWithoutMode]) || I.cell(b[bm.mapName])) +
        ' (' + I.cell(b[bm.mode]) + ')';
    }
    if (!known) head += ' [self unknown — all players]';
    console.log(head);
    console.table(rows);
  };

  // ---- הדפסה חד-פעמית מהמוסך (ציד הקישור רובה<->הגנה) ----

  // דגל ולא clearInterval בלבד: המשחק עוטף טיימרים והביטול לא אמין
  let propsDone = false;
  const propsTimer = setInterval(() => {
    if (propsDone) return;
    const g = garage();
    if (!g) return;
    const C = W.__CMB.internals;
    const IF = g.D.itemFields;
    const moduleMap = {};
    const weapons = {};
    for (const it of g.col.items) {
      const cat = I.cell(it[IF.category]);
      const name = I.cell(it[IF.name]);
      if (cat === 'RESISTANCE_MODULE') {
        if (name in moduleMap) continue;
        // ההגנה שהמודול נותן יושבת על upgradeableParams שלו
        const x = (I.cell(it) || '').match(/property = ([A-Z_]+_RESISTANCE)/);
        moduleMap[name] = x ? x[1] : null;
      } else if (cat === 'WEAPON') {
        // משפחה אחת לכל baseItemId — ה-Mk-ים חולקים אותו
        const base = C.baseItemIdOf ? C.baseItemIdOf(it) : null;
        if (base && !(base in weapons)) weapons[base] = name;
      }
    }
    // ה-state ההתחלתי ריק; מחכים למוסך אמיתי
    if (!Object.keys(moduleMap).length) return;
    propsDone = true;
    try { clearInterval(propsTimer); } catch (e) { /* עטוף */ }
    // מחרוזות ולא אובייקטים — כדי שהעתקה מהקונסול תשמר אותן
    console.log('[ADV] module -> resistance: ' + JSON.stringify(moduleMap, null, 1));
    console.log('[ADV] weapon baseId -> name: ' + JSON.stringify(weapons, null, 1));
  }, 2000);
})();
