// מריץ את גילוי שדות הקרב של ה-advisor מול כל הבאנדלים,
// ומוודא שהתוצאה לבילד הנוכחי תואמת ל-SEED שב-probe.js.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";
const DIR = "c:/Users/User/Documents/programming/Tanki Extensions/research";
const CURRENT_BUILD = "main.f1de53fa.js";

// discover() המשוגר, כמו שהוא
const ctx = vm.createContext({ console });
vm.runInContext("globalThis.window = globalThis;", ctx);
vm.runInContext(
  fs.readFileSync(path.join(EXT, "features/advisor/recon/discover.js"), "utf8"),
  ctx,
  { filename: "discover.js" },
);
const discover = vm.runInContext("window.TankiQoL.AdvisorDiscover.discover", ctx);

// ה-SEED מתוך probe.js
const probeSrc = fs.readFileSync(
  path.join(EXT, "features/advisor/recon/game/probe.js"),
  "utf8",
);
const seedStart = probeSrc.indexOf("const SEED = {");
const seed = eval(
  "(" +
    probeSrc.slice(
      probeSrc.indexOf("{", seedStart),
      probeSrc.indexOf("};", seedStart) + 1,
    ) +
    ")",
);

const KEYS = ["battleUsers", "battleStatistics", "localBattleUserState", "user"];

let pass = 0,
  fail = 0;
for (const b of fs
  .readdirSync(DIR)
  .filter((f) => /^main\.[a-f0-9]+\.js$/.test(f))) {
  const src = fs.readFileSync(path.join(DIR, b), "utf8");
  const t0 = Date.now();
  const r = discover(src);
  const ms = Date.now() - t0;

  if (!r) {
    console.log(`FAIL ${b}: discover() returned null`);
    fail++;
    continue;
  }
  const missing = KEYS.filter((k) => !r[k]);
  const ok = missing.length === 0;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${b} (${ms}ms) ` +
      KEYS.map((k) => `${k}=${r[k]}`).join(" "),
  );
  if (missing.length) console.log("       missing:", missing.join(", "));
  ok ? pass++ : fail++;

  if (b === CURRENT_BUILD) {
    const mismatches = KEYS.filter((k) => seed[k] !== r[k]).map(
      (k) => `${k}: seed=${seed[k]} real=${r[k]}`,
    );
    console.log(
      `       SEED matches this build: ${mismatches.length ? "NO !!" : "YES"}`,
    );
    mismatches.forEach((x) => console.log("         " + x));
    if (mismatches.length) fail++;
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
