// נקודת הכניסה להצטיידות מהכרטיס (view/combo_actions.js): מי מצייד,
// מתי חוסמים, ולאן מנווטים בסוף. הכל מזויף חוץ מהקובץ הנבדק.

const fs = require("fs");
const vm = require("vm");
const BASE =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL/features/combos/";

const calls = [];

const ctx = vm.createContext({
  console: { log() {}, warn() {}, error() {} },
  chrome: { storage: { local: { get(k, cb) { cb({}); } } } },
  Promise,
  setTimeout,
});
vm.runInContext(
  "globalThis.window = globalThis; window.TankiQoL = { ViewRenderer: {} };",
  ctx,
);
vm.runInContext(fs.readFileSync(BASE + "view/combo_actions.js", "utf8"), ctx, {
  filename: "combo_actions.js",
});

const T = ctx.window.TankiQoL;
const VR = T.ViewRenderer;

T.InstantLoader = {
  async equipCombo() {
    calls.push("instant");
    return { ok: true };
  },
};
T.ComboLoader = {
  async equipCombo() {
    calls.push("legacy");
  },
};
T.TabNavigator = {
  async navigateToTab(key) {
    calls.push("nav:" + key);
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

async function run(setup) {
  calls.length = 0;
  VR.cooldownActive = false;
  if (setup) setup();
  await VR.equipCombo({ id: 1, data: {} });
  return calls.slice();
}

(async () => {
  // המסלול הרגיל: מציידים ואז נוחתים בכרטיסיית ההגנות
  check("equipping ends on the Protection tab", await run(), [
    "instant",
    "nav:Protection",
  ]);

  // ה-cooldown חוסם — וגם לא מנווט, כדי שהמשתמש לא יאבד את הרשימה
  check(
    "a cooldown blocks the equip and the navigation",
    await run(() => { VR.cooldownActive = true; }),
    [],
  );

  // בלי המסלול המיידי נופלים לישן, שמנווט בעצמו — הניווט עדיין חסין לכפילות
  const saved = T.InstantLoader;
  check(
    "without the instant path the legacy one runs, and we still navigate",
    await run(() => { T.InstantLoader = null; }),
    ["legacy", "nav:Protection"],
  );
  T.InstantLoader = saved;

  // אין TabNavigator (נטען אחרינו / נעלם) -> מציידים בלי להתפוצץ
  const nav = T.TabNavigator;
  check(
    "a missing TabNavigator does not break equipping",
    await run(() => { T.TabNavigator = null; }),
    ["instant"],
  );
  T.TabNavigator = nav;

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})();
