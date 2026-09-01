// בדיקת התיקונים: areProtectionsEqual (שם-קודם) + extractIconFileName (מזהה CDN).
// טוענים את הקבצים האמיתיים עם stubs ובודקים את כל הקומבינציות בין הדורות.

const fs = require("fs");
const path = require("path");
const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";

global.window = { TankiQoL: { DOM: {}, Utils: {} } };
eval(
  fs.readFileSync(
    path.join(EXT, "features/combos/dom/scanners/protection_scanner.js"),
    "utf8",
  ),
);
eval(
  fs.readFileSync(
    path.join(
      EXT,
      "features/combos/equip/old/equippers/protection_equipper.js",
    ),
    "utf8",
  ),
);

const PS = global.window.TankiQoL.ProtectionScanner;
const PE = global.window.TankiQoL.ProtectionEquipper;

// --- נתונים אמיתיים משני הדורות ---
const domArmadillo = {
  name: "ARMADILLO",
  image: "https://tankionline.com/play/static/images/Armadillo.a1b2c3.svg",
};
const domDolphin = {
  name: "DOLPHIN",
  image: "https://tankionline.com/play/static/images/Dolphin.d4e5f6.svg",
};
const gen2Armadillo = {
  id: "1931009789037",
  name: "Armadillo ",
  image:
    "https://s.eu.tankionline.com/604/26145/330/227/30205431416443/image.svg",
  lvl: 0,
};
const gen2Dolphin = {
  id: "1931009789005",
  name: "Dolphin",
  image:
    "https://s.eu.tankionline.com/604/26145/330/246/30205431417375/image.svg",
  lvl: 6,
};
const gen2ArmadilloCopy = { ...gen2Armadillo };
const noName1 = {
  image: "https://tankionline.com/play/static/images/Wolf.aaa.svg",
};
const noName2 = { image: "https://cdn.example/play/Wolf.aaa.svg" };
const noNameCdn1 = {
  image: "https://s.eu.tankionline.com/1/2/3/4/111/image.svg",
};
const noNameCdn2 = {
  image: "https://s.eu.tankionline.com/1/2/3/4/222/image.svg",
};

const assert = (cond, msg) => {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("OK  ", msg);
};

// extractIconFileName
assert(
  PS.extractIconFileName(
    "https://tankionline.com/play/static/images/Railgun.e2aea740.svg",
  ) === "Railgun.e2aea740.svg",
  "extract: DOM icon unchanged",
);
assert(
  PS.extractIconFileName(gen2Armadillo.image) === "30205431416443/image.svg",
  "extract: CDN image.svg gets unique dir prefix",
);
assert(
  PS.extractIconFileName(gen2Armadillo.image) !==
    PS.extractIconFileName(gen2Dolphin.image),
  "extract: two CDN protections differ",
);
assert(PS.extractIconFileName("nope") === null, "extract: junk -> null");

// דור-1 מול דור-1 (רגרסיה)
assert(
  PE.areProtectionsEqual(domArmadillo, { ...domArmadillo }) === true,
  "gen1==gen1 same",
);
assert(
  PE.areProtectionsEqual(domArmadillo, domDolphin) === false,
  "gen1!=gen1 different",
);

// דור-2 מול דור-2 (הדדופ שקרס)
assert(
  PE.areProtectionsEqual(gen2Armadillo, gen2ArmadilloCopy) === true,
  "gen2==gen2 same",
);
assert(
  PE.areProtectionsEqual(gen2Armadillo, gen2Dolphin) === false,
  "gen2!=gen2 different (was TRUE before the fix!)",
);

// דור-2 מול DOM (הבאג המדווח)
assert(
  PE.areProtectionsEqual(gen2Armadillo, domArmadillo) === true,
  "gen2==DOM same protection (was FALSE before the fix!)",
);
assert(
  PE.areProtectionsEqual(gen2Armadillo, domDolphin) === false,
  "gen2!=DOM different",
);

// בלי שמות — נופל לתמונות
assert(
  PE.areProtectionsEqual(noName1, noName2) === true,
  "no names, same icon file -> equal",
);
assert(
  PE.areProtectionsEqual(noNameCdn1, noNameCdn2) === false,
  "no names, different CDN ids -> different",
);
assert(PE.areProtectionsEqual(null, null) === true, "null==null");
assert(PE.areProtectionsEqual(gen2Armadillo, null) === false, "x!=null");

// הסימולציה המלאה של הזרימה שנשברה: דדופ + חישוב פעולות
const current = [
  domArmadillo,
  domDolphin,
  {
    name: "OWL",
    image: "https://tankionline.com/play/static/images/Owl.o1.svg",
  },
  {
    name: "WOLF",
    image: "https://tankionline.com/play/static/images/Wolf.w1.svg",
  },
];
const desired = [
  gen2Armadillo,
  gen2Dolphin,
  {
    id: "1931009789023",
    name: "Owl",
    image:
      "https://s.eu.tankionline.com/604/26145/330/226/30205431417315/image.svg",
  },
  {
    id: "1931009789035",
    name: "Wolf",
    image:
      "https://s.eu.tankionline.com/604/26145/330/223/30205431417763/image.svg",
  },
];
const actions = PE.calculateProtectionActions(current, desired);
console.log("actions for identical loadout:", JSON.stringify(actions));
assert(
  actions.length === 0,
  "same loadout in both generations -> NO actions (was 4 removes + 1 equip before)",
);

// ומקרה של שינוי אמיתי: קומבו רוצה WOLF במקום OWL בלבד? (החלפת אחת)
const desired2 = [gen2Armadillo, gen2Dolphin, null, desired[3]];
const actions2 = PE.calculateProtectionActions(current, desired2);
const kinds2 = actions2
  .map((a) => a.type + ":" + (a.protection.name || "").trim().toUpperCase())
  .sort();
console.log("actions for one removed slot:", kinds2);
assert(
  kinds2.length === 1 && kinds2[0] === "remove:OWL",
  "one differing slot -> exactly one remove",
);
