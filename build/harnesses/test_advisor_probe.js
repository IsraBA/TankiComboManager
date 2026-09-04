// מריץ את probe.js המשוגר ב-sandbox ומאמת את חימוש המלכודות:
// ה-SEED תופס מיד, השמות שהגילוי שולח תופסים גם הם, וגם כשהגילוי
// מחזיר שם שה-SEED כבר חימש עבור מחלקה אחרת — הצלבה שהייתה
// מוחקת את הלכידה בשקט, כי מלכודת קיימת פשוט דולגה.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL/features/advisor/recon/";

let failures = 0;
function ok(label, cond) {
  console.log((cond ? "OK  " : "FAIL") + "   " + label);
  if (!cond) failures++;
}

// עולם MAIN מזויף: אין DOM, רק הודעות
const ctx = vm.createContext({ console });
vm.runInContext(
  `
  globalThis.window = globalThis;
  globalThis.__posted = [];
  globalThis.__listeners = [];
  window.addEventListener = function (t, fn) { if (t === 'message') __listeners.push(fn); };
  window.postMessage = function (m) { __posted.push(m); };
`,
  ctx,
);
for (const f of ["game/report.js", "game/probe.js"]) {
  vm.runInContext(fs.readFileSync(BASE + f, "utf8"), ctx, {
    filename: f.split("/").pop(),
  });
}

// אובייקט קרב מזויף: הפרוטוטייפ נושא toString בצורת קוטלין,
// שהוא כל מה ש-looksLike ו-fieldMap קוראים
vm.runInContext(
  `
  globalThis.__fake = function (className) {
    const proto = {};
    proto.toString = new Function(
      'return "' + className + '(uids="+this.uu_1+", tankInfo="+this.tt_1+")"'
    );
    return Object.create(proto);
  };
  globalThis.__write = function (o, field) { o[field] = 'x'; };
`,
  ctx,
);

const D = vm.runInContext("__ADV.debug", ctx);
const seed = vm.runInContext(
  "Array.from(__ADV.internals.armed.keys())",
  ctx,
);

ok("the SEED armed all four fields", seed.length === 4);
ok(
  "probe announced ready, so detect.js can re-send",
  vm.runInContext("__posted.some((m) => m.action === 'ready')", ctx),
);
ok("nothing captured before any object exists", D.rosterCaptures === 0);

// --- ה-SEED תופס ---
vm.runInContext(
  `
  const S = Array.from(__ADV.internals.armed.entries());
  // השדה שחומש עם הסמן של BattleUsers
  globalThis.__seedRoster = S.find(([, l]) =>
    l.some((e) => e.marker.indexOf('BattleUsers') !== -1))[0];
  globalThis.__seedBattle = S.find(([, l]) =>
    l.some((e) => e.marker.indexOf('BattleStatistics') !== -1))[0];
  __write(__fake('BattleUsers'), __seedRoster);
`,
  ctx,
);
ok(
  "a SEED-named BattleUsers is captured",
  vm.runInContext("__ADV.debug.rosterCaptures", ctx) === 1,
);
ok(
  "…and the roster object was kept",
  vm.runInContext("!!__ADV.internals.roster", ctx),
);
ok(
  "…with no error along the way",
  vm.runInContext("__ADV.debug.lastError", ctx) === null,
);

// --- מלכודת לא מגיבה למחלקה זרה ---
vm.runInContext(`__write(__fake('GarageItem'), __seedRoster);`, ctx);
ok(
  "a stranger class on the same field is ignored",
  vm.runInContext("__ADV.debug.rosterCaptures", ctx) === 1,
);

// --- הגילוי מצליב שמות: BattleUsers מקבל את השדה של BattleStatistics ---
const swapped = vm.runInContext(
  `
  const fields = {
    battleUsers: __seedBattle,          // ההצלבה
    battleStatistics: 'zz9_1',
    localBattleUserState: 'yy9_1',
    user: 'xx9_1',
  };
  __listeners.forEach((fn) => fn({
    source: window,
    data: { __adv: true, dir: 'i2m', action: 'advisorFields', payload: fields },
  }));
  __ADV.debug.discovered;
`,
  ctx,
);
ok("the discovered names were accepted", swapped === true);
ok(
  "the crossed field now listens for BattleUsers too",
  vm.runInContext(
    "__ADV.internals.armed.get(__seedBattle).length === 2",
    ctx,
  ),
);

vm.runInContext(`__write(__fake('BattleUsers'), __seedBattle);`, ctx);
ok(
  "a BattleUsers on the crossed field IS captured (the silent-loss bug)",
  vm.runInContext("__ADV.debug.rosterCaptures", ctx) === 2,
);
vm.runInContext(`__write(__fake('BattleStatistics'), __seedBattle);`, ctx);
ok(
  "…and the field still captures its original class",
  vm.runInContext("__ADV.debug.battleCaptures", ctx) === 1,
);

// --- שמות חדשים לגמרי, כמו בילד עתידי ---
vm.runInContext(`__write(__fake('LocalBattleUserState'), 'yy9_1');`, ctx);
ok(
  "a newly discovered field arms and captures",
  vm.runInContext("__ADV.debug.localCaptures", ctx) === 1,
);

// --- קלט אשפה לא מחמש כלום ---
const before = vm.runInContext("__ADV.internals.armed.size", ctx);
vm.runInContext(
  `
  __listeners.forEach((fn) => fn({
    source: window,
    data: { __adv: true, dir: 'i2m', action: 'advisorFields',
            payload: { battleUsers: 'not a field', user: 42 } },
  }));
`,
  ctx,
);
ok(
  "malformed discovered names are refused",
  vm.runInContext("__ADV.internals.armed.size", ctx) === before,
);

// --- שדה תפוס בידי מלכודת זרה לא נדרס ---
vm.runInContext(
  `
  Object.defineProperty(Object.prototype, 'foreign_1', {
    configurable: true, enumerable: false,
    get() { return undefined; }, set(v) { globalThis.__foreignSaw = v; },
  });
  __listeners.forEach((fn) => fn({
    source: window,
    data: { __adv: true, dir: 'i2m', action: 'advisorFields',
            payload: { battleUsers: 'foreign_1', battleStatistics: 'zz9_1',
                       localBattleUserState: 'yy9_1', user: 'xx9_1' } },
  }));
`,
  ctx,
);
ok(
  "a field owned by a foreign trap is left alone",
  vm.runInContext("__ADV.debug.skipped", ctx) === 1 &&
    !vm.runInContext("__ADV.internals.armed.has('foreign_1')", ctx),
);

console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
process.exit(failures ? 1 : 0);
