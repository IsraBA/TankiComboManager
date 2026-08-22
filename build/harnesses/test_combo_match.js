// "האם הקומבו כבר מצויד" (equip/combo_match.js). נטען עם instant_loader
// האמיתי, כי ההשוואה נשענת על buildDesired שלו.

const fs = require("fs");
const vm = require("vm");
const BASE =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL/features/combos/";

const ctx = vm.createContext({
  console,
  chrome: {
    storage: {
      local: {
        get(k, cb) {
          cb({});
        },
      },
    },
  },
  Promise,
  setTimeout,
});
vm.runInContext("globalThis.window = globalThis;", ctx);
for (const f of ["equip/instant_loader.js", "equip/combo_match.js"]) {
  vm.runInContext(fs.readFileSync(BASE + f, "utf8"), ctx, {
    filename: f.split("/").pop(),
  });
}
const M = ctx.window.TankiQoL.ComboMatch;

let failures = 0;
function check(label, got, want) {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) {
    console.log("        got : " + got + "   want: " + want);
    failures++;
  }
}

const T = (base, id, name) => ({ baseItemId: base, id, name });
const P = (base, name) => ({ baseItemId: base, id: base + "-1", name });

// המצב הנוכחי, בצורה ש-readCombo מחזיר
const CURRENT = {
  turret: T("tb", "t7", "THUNDER"),
  hull: T("hb", "h7", "HORNET"),
  grenade: T("gb", "g3", "BOMB"),
  drone: T("db", "d1", "CRISIS"),
  paint: T("pb", "p1", "Red smoke"),
  turretAugment: { id: "a1", baseItemId: "tb", name: "Pulsar" },
  hullAugment: null,
  turretSkin: { id: "k1", name: "Thunder Legacy" },
  hullSkin: null,
  protection: [P("x", "OWL"), P("y", "DOLPHIN")],
};

const combo = (data, removed) => ({ id: 1, data, removedItems: removed || {} });

// ---- הבסיס ----
check(
  "an identical combo is equipped",
  M.isEquipped(
    combo({ turret: T("tb", "t7", "THUNDER"), hull: T("hb", "h7", "HORNET") }),
    CURRENT,
  ),
  true,
);
check(
  "a different turret is not",
  M.isEquipped(combo({ turret: T("rb", "r7", "RAILGUN") }), CURRENT),
  false,
);

// ---- Mk ----
// הקומבו נשמר ב-Mk5 ומצייד את הגבוהה שבבעלות, ולכן ההשוואה לפי משפחה
check(
  "a combo saved at another Mk still counts as equipped",
  M.isEquipped(
    combo({ turret: { baseItemId: "tb", id: "t5", name: "THUNDER", mk: 5 } }),
    CURRENT,
  ),
  true,
);

// ---- דור-1: שם בלבד ----
check(
  "a gen-1 combo matches by name",
  M.isEquipped(combo({ turret: { name: "thunder" } }), CURRENT),
  true,
);
check(
  "…and a gen-1 name that differs does not",
  M.isEquipped(combo({ turret: { name: "railgun" } }), CURRENT),
  false,
);

// ---- אוגמנטים וסקינים: לפי מזהה ----
// ה-baseItemId של אוגמנט הוא התותח שלו, ולכן אינו מזהה אותו
check(
  "an augment is compared by id, not by its owner",
  M.isEquipped(
    combo({ turretAugment: { id: "a2", baseItemId: "tb", name: "Overdrive" } }),
    CURRENT,
  ),
  false,
);
check(
  "the installed augment matches",
  M.isEquipped(
    combo({ turretAugment: { id: "a1", baseItemId: "tb", name: "Pulsar" } }),
    CURRENT,
  ),
  true,
);
check(
  "a skin that is not applied is not equipped",
  M.isEquipped(combo({ turretSkin: { id: "k9", name: "Other" } }), CURRENT),
  false,
);

// ---- הגנות כקבוצה ----
check(
  "the same protections in another order are equipped",
  M.isEquipped(
    combo({ protection: [null, P("y", "DOLPHIN"), null, P("x", "OWL")] }),
    CURRENT,
  ),
  true,
);
check(
  "an extra protection is not",
  M.isEquipped(
    combo({
      protection: [P("x", "OWL"), P("y", "DOLPHIN"), P("z", "WOLF"), null],
    }),
    CURRENT,
  ),
  false,
);
check(
  "one protection short is not",
  M.isEquipped(
    combo({ protection: [P("x", "OWL"), null, null, null] }),
    CURRENT,
  ),
  false,
);
check(
  "a gen-1 compacted protection list still compares as a set",
  M.isEquipped(
    combo({ protection: [{ name: "dolphin" }, { name: "owl" }] }),
    CURRENT,
  ),
  true,
);
check(
  "no protections at all does not match two mounted ones",
  M.isEquipped(
    combo({
      turret: T("tb", "t7", "THUNDER"),
      protection: [null, null, null, null],
    }),
    CURRENT,
  ),
  false,
);

// ---- protection:null = אל תיגע ----
check(
  "a combo with no protection key ignores them",
  M.isEquipped(combo({ turret: T("tb", "t7", "THUNDER") }), CURRENT),
  true,
);
check(
  "protections switched off ignores them too",
  M.isEquipped(
    combo({
      turret: T("tb", "t7", "THUNDER"),
      protection: [P("z", "WOLF"), null, null, null],
    }),
    CURRENT,
    false,
  ),
  true,
);

// ---- removedItems ----
check(
  "a removed slot is not compared",
  M.isEquipped(
    combo(
      { turret: T("rb", "r7", "RAILGUN"), hull: T("hb", "h7", "HORNET") },
      { turret: true },
    ),
    CURRENT,
  ),
  true,
);
// הסרת הגנה פירושה שהיא תפורק, ולכן חייבת להיעדר עכשיו
check(
  "a removed protection must actually be absent",
  M.isEquipped(
    combo(
      { protection: [P("x", "OWL"), P("y", "DOLPHIN"), null, null] },
      { protection: [1] },
    ),
    CURRENT,
  ),
  false,
);

// ---- פריט שאינו בבעלות ----
// הוא לעולם אינו המורכב, ולכן נופל מעצמו
check(
  "an item the account does not own can never match",
  M.isEquipped(combo({ turret: T("zz", "z1", "SHAFT") }), CURRENT),
  false,
);

// ---- חוסן ----
check("no current state is not equipped", M.isEquipped(combo({}), null), false);
check(
  "an empty combo is trivially equipped",
  M.isEquipped(combo({}), CURRENT),
  true,
);

console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
process.exit(failures ? 1 : 0);
