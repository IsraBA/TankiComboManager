// בודק את המיגרציה **המשוגרת** (migration/combo_migrator.js): השלמת מזהים
// לקומבואים ישנים, בלי לשבור כלום ובלי לנחש.

const fs = require("fs");
const vm = require("vm");
const BASE =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL/features/combos/";

// --- אחסון מזויף + גשר מזויף ---
let stored = { savedCombos: [] };
let writes = 0;
let indexCalls = 0;
let indexPayload = null;

const ctx = vm.createContext({
  console,
  chrome: {
    storage: {
      local: {
        get(keys, cb) {
          cb(JSON.parse(JSON.stringify(stored)));
        },
        set(obj, cb) {
          writes++;
          Object.assign(stored, JSON.parse(JSON.stringify(obj)));
          if (cb) cb();
        },
      },
    },
  },
  setTimeout,
  clearTimeout,
  Promise,
});
vm.runInContext("globalThis.window = globalThis;", ctx);

vm.runInContext(fs.readFileSync(BASE + "lib/utils.js", "utf8"), ctx, {
  filename: "utils.js",
});
vm.runInContext(
  fs.readFileSync(BASE + "migration/migrator_match.js", "utf8"),
  ctx,
  { filename: "migrator_match.js" },
);
vm.runInContext(
  fs.readFileSync(BASE + "migration/combo_migrator.js", "utf8"),
  ctx,
  { filename: "combo_migrator.js" },
);

// גשר מזויף: מחזיר את האינדקס שהבדיקה מגדירה
ctx.window.TankiQoL.GarageBridge = {
  readIndex() {
    indexCalls++;
    return Promise.resolve(indexPayload);
  },
};

// --- האינדקס: כל מה שבמצב המוסך, כולל מה שאינו בבעלות ---
const own = (o) => Object.assign({ owned: true }, o);
const INDEX = {
  ok: true,
  items: [
    own({
      id: "101",
      baseItemId: "100",
      name: "Firebird",
      category: "WEAPON",
      mk: 6,
    }),
    own({
      id: "201",
      baseItemId: "200",
      name: "Hornet",
      category: "ARMOR",
      mk: 4,
    }),
    own({
      id: "301",
      baseItemId: "300",
      name: "Hunter",
      category: "ARMOR",
      mk: 2,
    }),
    own({
      id: "401",
      baseItemId: "400",
      name: "Kinetic",
      category: "DRONE",
      mk: null,
    }),
    own({
      id: "501",
      baseItemId: "500",
      name: "XT",
      category: "BAZOOKA",
      mk: null,
    }),
    own({
      id: "601",
      baseItemId: "600",
      name: "Green",
      category: "PAINT",
      mk: null,
    }),
    own({
      id: "701",
      baseItemId: "700",
      name: "Railgun",
      category: "RESISTANCE_MODULE",
      mk: null,
    }),
    own({
      id: "801",
      baseItemId: "800",
      name: "Isida",
      category: "RESISTANCE_MODULE",
      mk: null,
    }),
    own({
      id: "901",
      baseItemId: "900",
      name: "Gold",
      category: "SKIN",
      mk: null,
    }),
    // עמימות אמיתית: אותו שם, **משפחות שונות**
    own({
      id: "a01",
      baseItemId: "a00",
      name: "Twin",
      category: "WEAPON",
      mk: 1,
    }),
    own({
      id: "a02",
      baseItemId: "a10",
      name: "Twin",
      category: "WEAPON",
      mk: 1,
    }),
    // לא עמימות: כל דרגות ה-Mk של אותו פריט, שחולקות baseItemId. זה המצב
    // האמיתי במשחק (7 "THUNDER" באינדקס). כאן דרגה 5 היא הגבוהה שבבעלות,
    // ודרגה 6 קיימת אך לא נקנתה — כך שהבחירה חייבת לעצור ב-5.
    own({
      id: "b01",
      baseItemId: "b00",
      name: "Thunder",
      category: "WEAPON",
      mk: 1,
    }),
    own({
      id: "b02",
      baseItemId: "b00",
      name: "Thunder",
      category: "WEAPON",
      mk: 2,
    }),
    own({
      id: "b05",
      baseItemId: "b00",
      name: "Thunder",
      category: "WEAPON",
      mk: 5,
    }),
    own({
      id: "b03",
      baseItemId: "b00",
      name: "Thunder",
      category: "WEAPON",
      mk: 3,
    }),
    {
      id: "b06",
      baseItemId: "b00",
      name: "Thunder",
      category: "WEAPON",
      mk: 6,
      owned: false,
    },
    // משפחה שלמה שאינה בבעלות — קיימת במוסך למכירה
    {
      id: "c01",
      baseItemId: "c00",
      name: "Dictator",
      category: "ARMOR",
      mk: 1,
      owned: false,
    },
    {
      id: "c04",
      baseItemId: "c00",
      name: "Dictator",
      category: "ARMOR",
      mk: 4,
      owned: false,
    },
  ],
  devices: [
    { id: "d01", baseItemId: "100", name: "Pulsar" },
    { id: "d02", baseItemId: "200", name: "Shield" },
  ],
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

function run(combos, payload) {
  stored = { savedCombos: JSON.parse(JSON.stringify(combos)) };
  writes = 0;
  indexCalls = 0;
  indexPayload = payload === undefined ? INDEX : payload;
  return new Promise((resolve) => {
    ctx.window.TankiQoL.ComboMigrator.backfillIds((n) => {
      setTimeout(
        () => resolve({ n, combos: stored.savedCombos, writes, indexCalls }),
        0,
      );
    });
  });
}

(async function () {
  // 1. קומבו דור 1 טיפוסי: שם ותמונה בלבד
  let r = await run([
    {
      id: 1,
      name: "Old",
      data: {
        turret: { name: "FIREBIRD MK5", image: "x.svg" },
        hull: { name: "HORNET", image: "y.svg" },
        turretAugment: { name: "PULSAR", image: "p.svg" },
        protection: [
          { name: "RAILGUN", image: "r.svg" },
          { name: "ISIDA", image: "i.svg" },
        ],
      },
    },
  ]);
  const d = r.combos[0].data;
  check(
    "gen-1 turret resolved (Mk stripped, current Mk picked)",
    [d.turret.id, d.turret.baseItemId],
    ["101", "100"],
  );
  check(
    "  … the display snapshot is untouched",
    [d.turret.name, d.turret.image],
    ["FIREBIRD MK5", "x.svg"],
  );
  check("gen-1 hull resolved", [d.hull.id, d.hull.baseItemId], ["201", "200"]);
  check(
    "gen-1 augment resolved via its owner",
    [d.turretAugment.id, d.turretAugment.baseItemId],
    ["d01", "100"],
  );
  check(
    "gen-1 protections resolved",
    [d.protection[0].id, d.protection[1].id],
    ["701", "801"],
  );
  check("one write", r.writes, 1);
  check("reported 1 combo changed", r.n, 1);

  // 2. שנייה: כבר שלם -> אפס גשר, אפס כתיבה
  r = await run(r.combos);
  check("already complete: no bridge call", r.indexCalls, 0);
  check("  … and no write", r.writes, 0);

  // 3. קומבו דור 2 שנשמר לפני שנוסף baseItemId
  r = await run([
    { id: 2, data: { turret: { id: "101", name: "Firebird", image: "x" } } },
  ]);
  check(
    "gen-2 with id only gets baseItemId",
    r.combos[0].data.turret.baseItemId,
    "100",
  );

  // 4. id שכבר לא בבעלות (שודרג מאז) -> נפתר מחדש לפי השם
  r = await run([
    { id: 3, data: { turret: { id: "099", name: "Firebird", image: "x" } } },
  ]);
  check(
    "a stale id is re-resolved to the owned one",
    [r.combos[0].data.turret.id, r.combos[0].data.turret.baseItemId],
    ["101", "100"],
  );

  // 5. פריט שאינו קיים במוסך כלל -> נשאר כמו שהוא, בלי לנחש
  r = await run([{ id: 4, data: { turret: { name: "SHAFT", image: "x" } } }]);
  check(
    "an item the game does not know is left alone",
    r.combos[0].data.turret,
    { name: "SHAFT", image: "x" },
  );
  check("  … and nothing is written", r.writes, 0);

  // 5b. פריט שקיים במוסך אך **אינו בבעלות** (קומבו שיובא מחשבון אחר):
  //     המזהה הוא עובדה על המשחק, ולכן כן משלימים אותו
  r = await run([
    {
      id: 41,
      data: {
        turret: { name: "FIREBIRD", image: "a" }, // בבעלות
        hull: { name: "DICTATOR", image: "b" }, // לא בבעלות, אך קיים
        drone: { id: "zzz", name: "NOPE", image: "c" }, // id זר, לא קיים
      },
    },
  ]);
  check(
    "an imported combo resolves what it can",
    r.combos[0].data.turret.id,
    "101",
  );
  check(
    "  … resolves an unowned but known item too",
    [r.combos[0].data.hull.id, r.combos[0].data.hull.baseItemId],
    ["c01", "c00"],
  );
  check(
    "  … and leaves a genuinely unknown id alone",
    r.combos[0].data.drone.baseItemId,
    undefined,
  );

  // 6. עמימות אמיתית (שתי משפחות תחת אותו שם) -> לא מנחשים
  r = await run([{ id: 5, data: { turret: { name: "TWIN", image: "x" } } }]);
  check(
    "a genuinely ambiguous name is not guessed",
    r.combos[0].data.turret.id,
    undefined,
  );

  // 6b. **המקרה שנשבר חי**: כל דרגות ה-Mk באותו שם. זו משפחה אחת ולא
  //     עמימות — בוחרים את ה-Mk הגבוהה ביותר **שבבעלות** (5, לא 6).
  r = await run([
    { id: 51, data: { turret: { name: "THUNDER MK3", image: "x" } } },
  ]);
  check(
    "all Mk levels of one item are not ambiguous",
    [r.combos[0].data.turret.id, r.combos[0].data.turret.baseItemId],
    ["b05", "b00"],
  );

  // 6c. אותו דבר כשה-id השמור הוא Mk ישן שעדיין בבעלות
  r = await run([
    { id: 52, data: { turret: { id: "b02", name: "Thunder", image: "x" } } },
  ]);
  check(
    "a stale-but-owned Mk still resolves its family",
    r.combos[0].data.turret.baseItemId,
    "b00",
  );

  // 7. חריצים דקורטיביים
  r = await run([
    {
      id: 6,
      data: {
        paint: { name: "GREEN", image: "g" },
        turretSkin: { name: "GOLD", image: "s" },
      },
    },
  ]);
  check("paint resolved", r.combos[0].data.paint.id, "601");
  check("skin resolved", r.combos[0].data.turretSkin.id, "901");

  // 8. אוגמנט בלי הפריט שלו -> אין למה לקשור, נשאר
  r = await run([
    { id: 7, data: { turretAugment: { name: "PULSAR", image: "p" } } },
  ]);
  check(
    "an augment with no owner is left alone",
    r.combos[0].data.turretAugment.id,
    undefined,
  );

  // 9. ה-state עוד לא נתפס -> לא נוגעים בכלום, ננסה שוב בפעם הבאה
  r = await run(
    [{ id: 8, data: { turret: { name: "FIREBIRD", image: "x" } } }],
    { ok: false, error: "garage state not captured yet" },
  );
  check("state not captured: nothing written", r.writes, 0);
  check(
    "  … and the combo is untouched",
    r.combos[0].data.turret.id,
    undefined,
  );

  // 10. חריץ ריק / null לא מפיל כלום
  r = await run([
    {
      id: 9,
      data: {
        turret: null,
        hull: { name: "HORNET", image: "y" },
        protection: null,
      },
    },
  ]);
  check("null slots are skipped safely", r.combos[0].data.hull.id, "201");

  console.log(
    failures ? `\n${failures} check(s) FAILED` : "\nall checks passed",
  );
  process.exit(failures ? 1 : 0);
})();
