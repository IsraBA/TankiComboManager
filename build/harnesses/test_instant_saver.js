// בדיקת אופליין ל-instant_saver.js: מריצים את הקובץ האמיתי עם stubs של
// window/chrome, מזינים fixture שנבנה מהלוג החי של המשתמש, ובודקים את
// הרשומה שנכתבה ל"storage".

const fs = require("fs");
const path = require("path");
const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";

// --- fixture: בדיוק מה ש-garage_state.readCombo מחזיר (מהבדיקה החיה) ---
const FIXTURE = {
  ok: true,
  combo: {
    turret: {
      slot: "turret",
      category: "WEAPON",
      id: "920009630987",
      baseItemId: "920009630987",
      name: "Firebird",
      mountIndex: 0,
      mk: 5,
      lvl: 1,
      lvlMax: 11,
      image: "https://cdn/turret.webp",
      owned: true,
      augment: {
        id: "1931009779132",
        baseItemId: "920009631011",
        name: "Pulsar",
        category: "DEVICE",
        image: "https://cdn/pulsar.svg",
      },
      skin: {
        id: "5551",
        name: "Old Skin Firebird Demonic",
        category: "SKIN",
        image: "https://cdn/skin.webp",
      },
      shotSkin: {
        id: "5552",
        name: "Magma",
        category: "SKINS_SHOT",
        image: "https://cdn/magma.svg",
      },
    },
    turretAugment: {
      id: "1931009779132",
      baseItemId: "920009631011",
      name: "Pulsar",
      category: "DEVICE",
      image: "https://cdn/pulsar.svg",
    },
    turretSkin: {
      id: "5551",
      name: "Old Skin Firebird Demonic",
      category: "SKIN",
      image: "https://cdn/skin.webp",
    },
    turretShotFx: {
      id: "5552",
      name: "Magma",
      category: "SKINS_SHOT",
      image: "https://cdn/magma.svg",
    },
    hull: {
      slot: "hull",
      category: "ARMOR",
      id: "921009687070",
      baseItemId: "921009687000",
      name: "Hopper",
      mountIndex: 0,
      mk: 5,
      lvl: 2,
      lvlMax: 11,
      image: "https://cdn/hopper.webp",
      owned: true,
      augment: {
        id: "9991",
        name: "Lifeguard",
        image: "https://cdn/lifeguard.svg",
      },
      skin: null,
      shotSkin: null,
    },
    hullAugment: {
      id: "9991",
      name: "Lifeguard",
      image: "https://cdn/lifeguard.svg",
    },
    hullSkin: null,
    grenade: {
      category: "BAZOOKA",
      id: "1931009780014",
      baseItemId: "1931009780000",
      name: "Bomb",
      mountIndex: 0,
      mk: 1,
      lvl: 2,
      lvlMax: 3,
      image: "https://cdn/bomb.webp",
    },
    drone: {
      category: "DRONE",
      id: "920009671854",
      baseItemId: "920009671800",
      name: "Crisis",
      mountIndex: 0,
      mk: null,
      lvl: 20,
      lvlMax: 20,
      image: "https://cdn/crisis.webp",
    },
    paint: {
      category: "PAINT",
      id: "931009768023",
      baseItemId: "931009768023",
      name: "Red smoke",
      mountIndex: 0,
      mk: null,
      lvl: 0,
      image: "https://cdn/paint.webp",
    },
    protection: [
      {
        category: "RESISTANCE_MODULE",
        id: "1931009789037",
        baseItemId: "1931009789037",
        name: "Armadillo ",
        mountIndex: 0,
        lvl: 0,
        image: "https://cdn/armadillo.svg",
      },
      {
        category: "RESISTANCE_MODULE",
        id: "1931009789005",
        baseItemId: "1931009789005",
        name: "Dolphin",
        mountIndex: 1,
        lvl: 6,
        image: "https://cdn/dolphin.svg",
      },
      {
        category: "RESISTANCE_MODULE",
        id: "1931009789023",
        baseItemId: "1931009789023",
        name: "Owl",
        mountIndex: 2,
        lvl: 5,
        image: "https://cdn/owl.svg",
      },
      {
        category: "RESISTANCE_MODULE",
        id: "1931009789035",
        baseItemId: "1931009789035",
        name: "Wolf",
        mountIndex: 3,
        lvl: 6,
        image: "https://cdn/wolf.svg",
      },
    ],
  },
  stats: { mountedCount: 12 },
};

// --- stubs ---
let stored = {
  savedCombos: [
    {
      id: 1,
      name: "Old combo",
      order: 0,
      data: { turret: { name: "RICOCHET", image: "x.png" } },
    },
  ],
};
global.window = {
  TankiQoL: {
    GarageBridge: { readCombo: async () => FIXTURE },
    LanguageManager: { getCurrentLanguageCode: () => "en" },
  },
};
global.chrome = {
  storage: {
    local: {
      get: (keys, cb) => cb({ savedCombos: stored.savedCombos }),
      set: (obj, cb) => {
        stored = { ...stored, ...obj };
        cb && cb();
      },
    },
  },
};

// --- טעינת הקובץ האמיתי ---
eval(
  fs.readFileSync(
    path.join(EXT, "features/combos/save/instant_saver.js"),
    "utf8",
  ),
);

(async () => {
  const res = await global.window.TankiQoL.InstantSaver.saveCurrentCombo();
  console.log("result ok:", res.ok);
  const saved = stored.savedCombos;
  console.log(
    "combos in storage:",
    saved.length,
    "| old combo order bumped:",
    saved[0].order === 1,
  );
  const d = saved[1].data;
  console.log("\nsaved data:");
  console.log(JSON.stringify(d, null, 1));

  // --- אימותים ---
  const assert = (cond, msg) => {
    if (!cond) {
      console.error("FAIL:", msg);
      process.exitCode = 1;
    } else console.log("OK  ", msg);
  };
  assert(
    saved[1].name === "Combo 2" &&
      saved[1].order === 0 &&
      saved[1].language === "en",
    "envelope (name/order/language)",
  );
  assert(
    d.turret.id === "920009630987" &&
      d.turret.name === "Firebird" &&
      d.turret.mk === 5 &&
      d.turret.lvl === 1,
    "turret with id+mk+lvl",
  );
  // baseItemId שורד שדרוג Mk, ולכן הוא המפתח שההצטיידות נשענת עליו
  assert(d.turret.baseItemId === "920009630987", "turret carries baseItemId");
  assert(
    d.hull.baseItemId != null && d.drone.baseItemId != null,
    "hull + drone carry baseItemId",
  );
  assert(d.protection[0].baseItemId != null, "protections carry baseItemId");
  assert(
    d.turretAugment.baseItemId === "920009631011",
    "augment baseItemId points at its owner",
  );
  assert(
    d.turretAugment.name === "Pulsar" && !("mk" in d.turretAugment),
    "augment plain",
  );
  // אפקט הירייה הוסר מהפיצ'ר (החלטה מוצרית): הקורא עדיין מחזיר אותו,
  // אבל השמירה מתעלמת ממנו לגמרי.
  assert(!("turretShotFx" in d), "turretShotFx is NOT saved");
  assert(d.hullSkin === null, "hullSkin null when none");
  assert(d.paint && d.paint.name === "Red smoke", "paint saved");
  assert(
    Array.isArray(d.protection) && d.protection.length === 4,
    "protection positional array of 4",
  );
  assert(
    d.protection[0].name === "Armadillo " && d.protection[3].name === "Wolf",
    "protection slot order by mountIndex",
  );
  assert(d.protection[1].lvl === 6, "protection lvl kept");
  assert(!("mk" in d.drone), "no mk key when null");

  // תאימות לאקוויפר הישן: יש name לכל פריט עיקרי
  assert(
    ["turret", "hull", "grenade", "drone"].every(
      (k) => typeof d[k].name === "string",
    ),
    "legacy equipper compat: names present",
  );

  // תרחיש כשל: state לא נתפס
  global.window.TankiQoL.GarageBridge.readCombo = async () => ({
    ok: false,
    error: "not captured",
  });
  const fail = await global.window.TankiQoL.InstantSaver.saveCurrentCombo();
  assert(
    fail.ok === false && stored.savedCombos.length === 2,
    "failed read -> nothing saved",
  );
})();
