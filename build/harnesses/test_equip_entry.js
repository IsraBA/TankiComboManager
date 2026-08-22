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
T.GarageBridge = {
  async selectMountedPaint() {
    calls.push("selectPaint");
    return { ok: true };
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
  // המסלול הרגיל: מציידים, נוחתים בהגנות, ורק אז מחזירים את בחירת
  // הצבע — הניווט דורס אותה, ולכן הסדר הזה הוא התיקון עצמו
  check("equipping ends on the Protection tab, then restores the paint", await run(), [
    "instant",
    "nav:Protection",
    "selectPaint",
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
    ["legacy", "nav:Protection", "selectPaint"],
  );
  T.InstantLoader = saved;

  // אין TabNavigator (נטען אחרינו / נעלם) -> מציידים בלי להתפוצץ
  const nav = T.TabNavigator;
  check(
    "a missing TabNavigator does not break equipping",
    await run(() => { T.TabNavigator = null; }),
    ["instant", "selectPaint"],
  );
  T.TabNavigator = nav;

  // הבחירה מחדש היא קוסמטיקה בלבד; כשל בה לא אמור להפיל הצטיידות
  const bridge = T.GarageBridge;
  T.GarageBridge = {
    async selectMountedPaint() { throw new Error('bridge is down'); },
  };
  check(
    "a failing paint re-select does not break equipping",
    await run(),
    ["instant", "nav:Protection"],
  );
  T.GarageBridge = bridge;

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})();
