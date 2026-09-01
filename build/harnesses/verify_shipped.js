// מריץ את discover() המשוגר מול כל הבאנדלים, ומוודא שהתוצאה לבילד הנוכחי
// תואמת ל-SEED שב-garage/names.js.

const fs = require("fs");
const path = require("path");

const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";
const DIR = "c:/Users/User/Documents/programming/Tanki Extensions/research";

// טוענים את קבצי הגילוי המשוגרים כמו שהם, בסדר של ה-manifest
const vm = require("vm");
const DISCOVER_FILES = [
  "parse.js",
  "state.js",
  "send.js",
  "actions.js",
  "index.js",
];
const dctx = vm.createContext({ console });
vm.runInContext("globalThis.window = globalThis;", dctx);
for (const f of DISCOVER_FILES) {
  vm.runInContext(
    fs.readFileSync(path.join(EXT, "features/combos/discovery", f), "utf8"),
    dctx,
    { filename: f },
  );
}
const discover = vm.runInContext(
  "window.TankiQoL.GarageDiscover.discover",
  dctx,
);

const REQUIRED_STATE = ["mountedItems", "items", "isLoaded", "currentCategory"];
const REQUIRED_ITEM = ["id", "name", "category", "mounted", "mountIndex"];

// ה-SEED מתוך garage/names.js
const stateSrc = fs.readFileSync(
  path.join(EXT, "features/combos/discovery/game/names.js"),
  "utf8",
);
const seedStart = stateSrc.indexOf("const SEED = {");
const seed = eval(
  "(" +
    stateSrc.slice(
      stateSrc.indexOf("{", seedStart),
      stateSrc.indexOf("\n  };", seedStart) + 4,
    ) +
    ")",
);

// השדות שאנחנו מצפים לקבל, כולל התוספות
const EXTRAS = {
  modificationFields: ["baseItemId", "modificationIndex"],
  upgradeFields: ["currentLevel"],
  deviceFields: [
    "id",
    "baseItemId",
    "installed",
    "name",
    "previewImage",
    "infinityLifetimeItem",
  ],
  // פעולות הכתיבה של ההגנות
  resistUnmountFields: ["resistance", "needServerUnmount"],
  resistApplyFields: ["resistance", "index", "needServerMount"],
  resistMountFields: ["resistance", "index"],
  mountThunkFields: ["item", "needServerMount"],
  // פעולות האוגמנטים
  deviceInsertFields: ["device", "item"],
  deviceRemoveFields: ["device", "item"],
  deviceLoadFields: ["itemId"],
  skinMountFields: ["skin", "item"],
};

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

  const problems = [];
  REQUIRED_STATE.forEach((k) => {
    if (!r.stateFields[k]) problems.push("state." + k);
  });
  // ה-cooldown קיים במשחק שנים; בלעדיו נצייד בזמן חסימה והשרת ידחה
  ["delayMountTimeMs", "unlockedProtectionSlots"].forEach((k) => {
    if (!r.stateFields[k]) problems.push("state." + k);
  });
  REQUIRED_ITEM.forEach((k) => {
    if (!r.itemFields[k]) problems.push("item." + k);
  });
  [
    "preview",
    "modification",
    "upgradeableParams",
    "mountedSkin",
    "mountedShotSkin",
    "skinPreview",
  ].forEach((k) => {
    if (!r.itemFields[k]) problems.push("item." + k);
  });
  for (const grp of Object.keys(EXTRAS)) {
    if (!r[grp]) {
      problems.push(grp + " MISSING");
      continue;
    }
    EXTRAS[grp].forEach((k) => {
      if (!r[grp][k]) problems.push(grp + "." + k);
    });
  }
  if (!r.maxLevelMethod) problems.push("maxLevelMethod");
  if (!r.isMaxedMethod) problems.push("isMaxedMethod");
  // הרנדומייזר: נדירות, מלאי, וכמה דרגות Mk קיימות לסוג
  ["rarity", "count", "countable", "availableSkins"].forEach((k) => {
    if (!r.itemFields[k]) problems.push("item." + k);
  });
  if (!r.deviceFields || !r.deviceFields.rarity) problems.push("deviceFields.rarity");
  if (!r.modificationFields || !r.modificationFields.modificationCount) {
    problems.push("modificationFields.modificationCount");
  }
  if (!r.urlMethod) problems.push("urlMethod");
  // מסלול השליחה לשרת
  [
    "proxyTrapField",
    "proxyMountMethod",
    "proxyCcField",
    "actionItemField",
    "actionNeedServerField",
    "selectActionClass",
    "selectItemIdField",
    "resistUnmountClass",
    "resistApplyClass",
    "resistMountClass",
    "mountThunkClass",
    "deviceInsertClass",
    "deviceRemoveClass",
    "deviceLoadClass",
    "skinMountClass",
  ].forEach((k) => {
    if (!r[k]) problems.push(k);
  });
  if (r.proxyMethods && r.proxyMethods.length < 2)
    problems.push("proxyMethods too few");

  const ok = problems.length === 0;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${b} (${ms}ms) trap=${r.trapField} url=${r.urlMethod} maxLvl=${r.maxLevelMethod}()` +
      `\n       mk=modification.${r.modificationFields ? r.modificationFields.modificationIndex : "?"}` +
      `  lvl=upgradeableParams.${r.upgradeFields ? r.upgradeFields.currentLevel : "?"}` +
      `  augment.installed=${r.deviceFields ? r.deviceFields.installed : "?"}` +
      `\n       resist: apply=${r.resistApplyClass} unmount=${r.resistUnmountClass}` +
      `  thunks: mount=${r.resistMountClass} item=${r.mountThunkClass}` +
      `
       device: insert=${r.deviceInsertClass} remove=${r.deviceRemoveClass} load=${r.deviceLoadClass}`,
  );
  if (problems.length) console.log("       problems:", problems.join(", "));
  ok ? pass++ : fail++;

  if (b === "main.1327298e.js") {
    const mismatches = [];
    const cmp = (label, a, c) => {
      if (a !== c) mismatches.push(`${label}: seed=${a} real=${c}`);
    };
    [
      "trapField",
      "urlMethod",
      "maxLevelMethod",
      "proxyTrapField",
      "proxyMountMethod",
      "proxyCcField",
      "mountActionClass",
      "selectActionClass",
      "selectItemIdField",
      "resistApplyClass",
      "resistUnmountClass",
      "resistMountClass",
      "mountThunkClass",
      "deviceInsertClass",
      "deviceRemoveClass",
      "deviceLoadClass",
      "skinMountClass",
    ].forEach((k) => cmp(k, seed[k], r[k]));
    cmp(
      "proxyMethods",
      (seed.proxyMethods || []).join(","),
      (r.proxyMethods || []).join(","),
    );
    for (const k of Object.keys(seed.stateFields))
      cmp("state." + k, seed.stateFields[k], r.stateFields[k]);
    for (const k of Object.keys(seed.itemFields))
      cmp("item." + k, seed.itemFields[k], r.itemFields[k]);
    for (const grp of [
      "modificationFields",
      "upgradeFields",
      "deviceFields",
      "resistApplyFields",
      "resistUnmountFields",
      "resistMountFields",
      "mountThunkFields",
      "deviceInsertFields",
      "deviceRemoveFields",
      "deviceLoadFields",
      "skinMountFields",
    ]) {
      for (const k of Object.keys(seed[grp] || {}))
        cmp(grp + "." + k, seed[grp][k], (r[grp] || {})[k]);
    }
    console.log(
      `       SEED matches this build: ${mismatches.length ? "NO !!" : "YES"}`,
    );
    mismatches.forEach((x) => console.log("         " + x));
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
