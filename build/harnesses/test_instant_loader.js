// בודק את האקוויפר המשוגר (equip/instant_loader.js): מה בדיוק נשלח לעולם
// MAIN, ומתי נופלים ל-DOM. עולם MAIN והאקוויפרים הישנים מזויפים.

const fs = require("fs");
const vm = require("vm");
const BASE =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL/features/combos/";

let settings = { equipProtectionsOnLoad: true };
let sent = null; // ה-desired האחרון שנשלח ל-MAIN
let applyResult = null; // מה ש-MAIN יחזיר
const domCalls = []; // קריאות לאקוויפרים הישנים

const ctx = vm.createContext({
  console: { log() {}, warn() {}, error() {} },
  chrome: {
    storage: {
      local: {
        get(keys, cb) {
          cb(settings);
        },
      },
    },
  },
  Promise,
  setTimeout,
});
vm.runInContext("globalThis.window = globalThis;", ctx);
vm.runInContext(
  fs.readFileSync(BASE + "equip/instant_loader.js", "utf8"),
  ctx,
  { filename: "instant_loader.js" },
);

const T = ctx.window.TankiQoL;
T.GarageBridge = {
  applyCombo(desired) {
    sent = desired;
    return Promise.resolve(applyResult);
  },
};
T.BaseItemEquipper = {
  equipItem(i, tab, type) {
    domCalls.push("base:" + type);
  },
};
T.AugmentEquipper = {
  equipAugment(a, tab) {
    domCalls.push("aug:" + tab);
  },
};
T.ProtectionEquipper = {
  equipProtection(p, rm) {
    domCalls.push("prot:" + rm.join(","));
  },
};
T.ComboLoader = {
  equipCombo() {
    domCalls.push("WHOLE COMBO");
  },
};

let failures = 0;
function check(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) {
    console.log("        got : " + JSON.stringify(got));
    console.log("        want: " + JSON.stringify(want));
    failures++;
  }
}

const COMBO = {
  id: 1,
  name: "test",
  data: {
    turret: { id: "t1", baseItemId: "t0", name: "Thunder" },
    turretAugment: { id: "a1", baseItemId: "t0", name: "Noise" },
    turretSkin: { id: "s1", name: "Gold" },
    hull: { id: "h1", baseItemId: "h0", name: "Crusader" },
    hullAugment: { id: "a2", baseItemId: "h0", name: "Excelsior" },
    grenade: { id: "g1", baseItemId: "g0", name: "Bomb" },
    drone: { id: "d1", baseItemId: "d0", name: "Crisis" },
    paint: { id: "p1", baseItemId: "p0", name: "Green" },
    protection: [
      { id: "r1", baseItemId: "r1", name: "Armadillo" },
      { id: "r2", baseItemId: "r2", name: "Wolf" },
      { id: "r3", baseItemId: "r3", name: "Panther" },
      null,
    ],
  },
};

async function run(combo, result, opts) {
  sent = null;
  domCalls.length = 0;
  settings = Object.assign({ equipProtectionsOnLoad: true }, opts || {});
  applyResult = result || { ok: true, results: [], ms: 12 };
  const r = await T.InstantLoader.equipCombo(JSON.parse(JSON.stringify(combo)));
  return { r, sent, domCalls: domCalls.slice() };
}

(async function () {
  // 1. קומבו מלא -> נשלח הכל, אין נגיעה ב-DOM
  let o = await run(COMBO);
  check(
    "every slot is sent",
    Object.keys(o.sent).sort(),
    [
      "drone",
      "grenade",
      "hull",
      "hullAugment",
      "paint",
      "protection",
      "turret",
      "turretAugment",
      "turretSkin",
    ].sort(),
  );
  check(
    "protections sent positionally with the empty slot",
    o.sent.protection.map((p) => (p ? p.name : null)),
    ["Armadillo", "Wolf", "Panther", null],
  );
  check("no DOM involvement", o.domCalls, []);

  // 2. פריט שהמשתמש ביטל בכרטיס -> פשוט לא נשלח
  let c = JSON.parse(JSON.stringify(COMBO));
  c.removedItems = { turret: true, turretAugment: true };
  o = await run(c);
  check(
    "a removed item is not sent",
    [o.sent.turret, o.sent.turretAugment],
    [undefined, undefined],
  );
  check("  … and the rest still is", o.sent.hull.name, "Crusader");

  // 3. הגנה שבוטלה -> null בחריץ, כלומר היא תוסר בפועל. זו התנהגות
  //    מכוונת ושונה משאר החריצים.
  c = JSON.parse(JSON.stringify(COMBO));
  c.removedItems = { protection: [1] };
  o = await run(c);
  check(
    "a removed protection becomes an explicit empty slot",
    o.sent.protection.map((p) => (p ? p.name : null)),
    ["Armadillo", null, "Panther", null],
  );

  // 4. ההגדרה כבויה -> לא נוגעים בהגנות בכלל
  o = await run(COMBO, null, { equipProtectionsOnLoad: false });
  check("protections off: null means do not touch", o.sent.protection, null);

  // 5. קומבו בלי הגנות כלל -> גם כן "אל תיגע"
  c = JSON.parse(JSON.stringify(COMBO));
  delete c.data.protection;
  o = await run(c);
  check(
    "a combo with no protections does not touch them",
    o.sent.protection,
    null,
  );

  // 6. חריץ בודד נכשל -> fallback רק עליו
  o = await run(COMBO, {
    ok: false,
    results: [
      { slot: "turret", name: "Thunder", status: "failed", error: "boom" },
      { slot: "hull", name: "Crusader", status: "applied" },
    ],
  });
  check("one failed slot falls back alone", o.domCalls, ["base:Turret"]);
  check("  … and reports not-ok", o.r.ok, false);

  // 7. פריט שאינו בבעלות -> לא כשל, ולכן **אין** fallback
  o = await run(COMBO, {
    ok: true,
    results: [
      { slot: "drone", name: "Crisis", status: "unavailable" },
      { slot: "turret", name: "Thunder", status: "applied" },
    ],
  });
  check("an unavailable item does not trigger a fallback", o.domCalls, []);
  check("  … and is not treated as a failure", o.r.ok, true);

  // 8. אוגמנט והגנות שנכשלו -> ה-fallback הנכון לכל אחד
  o = await run(COMBO, {
    ok: false,
    results: [
      { slot: "turretAugment", status: "failed", error: "x" },
      { slot: "protection", status: "failed", error: "y" },
    ],
  });
  check("augment + protection fall back to their own equippers", o.domCalls, [
    "aug:Turrets",
    "prot:",
  ]);

  // 9. המסלול המיידי לא זמין בכלל -> הקומבו כולו ל-DOM
  o = await run(COMBO, { ok: false, error: "garage state not captured" });
  check("no native path at all: the whole combo falls back", o.domCalls, [
    "WHOLE COMBO",
  ]);

  // 10. אין גשר בכלל
  const saved = T.GarageBridge;
  T.GarageBridge = null;
  o = await run(COMBO);
  check("no bridge: the whole combo falls back", o.domCalls, ["WHOLE COMBO"]);
  T.GarageBridge = saved;

  // 11. חריץ דקורטיבי שנכשל -> אין ל-DOM מקבילה, לא נופלים
  o = await run(COMBO, {
    ok: false,
    results: [{ slot: "turretSkin", status: "failed", error: "z" }],
  });
  check(
    "a decorative slot has no DOM equivalent, so no fallback",
    o.domCalls,
    [],
  );

  // 12. cooldown: השרת דוחה כל מסלול, ולכן אסור ליפול ל-DOM
  o = await run(COMBO, { ok: false, cooldown: true, msLeft: 90000, results: [] });
  check("a cooldown does not drag the combo through the DOM", o.domCalls, []);
  check("  … and is reported as a cooldown, not a failure", o.r.cooldown, true);
  check("  … and does not claim success", o.r.ok, false);

  console.log(
    failures ? `\n${failures} check(s) FAILED` : "\nall checks passed",
  );
  process.exit(failures ? 1 : 0);
})();
