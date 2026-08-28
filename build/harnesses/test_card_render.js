// בדיקת רינדור הכרטיס: מריצים את combo_card_renderer.js האמיתי ובודקים את
// ה-HTML שנוצר לשני דורות הנתונים ולמצבי הסרה שונים.

const fs = require("fs");
const path = require("path");
const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";

global.window = {
  TankiQoL: { LanguageManager: { getUIText: (k) => "T:" + k } },
};
// הכרטיס מצייר את הוי מ-shared/icons.js
eval(fs.readFileSync(path.join(EXT, "shared/icons.js"), "utf8"));
for (const f of [
  "view/card/combo_card_renderer.js",
  "view/card/rows.js",
  "view/card/events.js",
  "view/card/title_edit.js",
]) {
  eval(fs.readFileSync(path.join(EXT, "features/combos", f), "utf8"));
}
const R = global.window.TankiQoL.ComboCardRenderer;

// גם את ה-cleaner, לבדיקת הפריטים הדקורטיביים
eval(
  fs.readFileSync(
    path.join(EXT, "features/combos/lib/combo_cleaner.js"),
    "utf8",
  ),
);
const C = global.window.TankiQoL.ComboCleaner;

const img = (n) => `https://cdn/${n}.webp`;

// דור 2 — מלא
const gen2 = {
  turret: { id: "1", name: "Firebird", image: img("turret") },
  turretAugment: { id: "2", name: "Pulsar", image: img("pulsar") },
  turretSkin: { id: "3", name: "Demonic", image: img("tskin") },
  turretShotFx: { id: "4", name: "Magma", image: img("magma") },
  hull: { id: "5", name: "Hopper", image: img("hull") },
  hullAugment: { id: "6", name: "Lifeguard", image: img("lifeguard") },
  hullSkin: { id: "7", name: "Legacy", image: img("hskin") },
  grenade: { id: "8", name: "Bomb", image: img("bomb") },
  drone: { id: "9", name: "Crisis", image: img("crisis") },
  paint: { id: "10", name: "Red smoke", image: img("paint") },
  protection: [
    { id: "11", name: "Armadillo", image: img("arm") },
    { id: "12", name: "Dolphin", image: img("dol") },
    null,
    null,
  ],
};

// דור 1 — קומבו ישן: אין ids, אין דקורטיביים
const gen1 = {
  turret: { name: "RICOCHET", image: img("ric") },
  turretAugment: { name: "STUN", image: img("stun") },
  hull: { name: "HORNET", image: img("hornet") },
  hullAugment: null,
  grenade: { name: "BOMB", image: img("b") },
  drone: { name: "CRISIS", image: img("c") },
  protection: [{ name: "OWL", image: img("owl") }],
};

const assert = (cond, msg) => {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("OK  ", msg);
};
const has = (html, s) => html.includes(s);

// --- דור 2, בלי הסרות ---
let h = R.createRowsHTML(gen2, {});
assert(
  has(h, img("tskin")) && !has(h, img("turret")),
  "gen2: turret shows SKIN image, not base image",
);
assert(
  has(h, img("hskin")) && !has(h, img("hull")),
  "gen2: hull shows SKIN image",
);
assert(
  !has(h, 'data-item-type="turretShotFx"') && !has(h, img("magma")),
  "gen2: a stale shot-fx key on an old combo renders nothing",
);
assert(has(h, "cme_combo-badges"), "gen2: badges row wrapper present");
assert(
  has(h, 'data-item-type="paint"') && has(h, img("paint")),
  "gen2: paint square rendered with image",
);
assert(!has(h, "NO PAINT"), "gen2: paint present -> no NO PAINT text");
assert(!has(h, "cme_combo-equip-btn"), "equip button gone from markup");
assert(has(h, ">Firebird<"), "gen2: turret NAME still shown (not skin name)");

// --- דור 2, הוסר התותח: סקין+אוגמנט+אפקט ירייה נעלמים איתו ---
h = R.createRowsHTML(gen2, {
  turret: true,
  turretAugment: true,
  turretShotFx: true,
});
assert(
  !has(h, img("tskin")) && !has(h, img("turret")),
  "turret removed -> no turret/skin image",
);
assert(!has(h, img("pulsar")), "turret removed -> no augment");
assert(has(h, "NO TURRET"), "turret removed -> NO TURRET label");
assert(has(h, img("hskin")), "turret removed -> hull side untouched");

// --- דור 2, הוסר הצבע ---
h = R.createRowsHTML(gen2, { paint: true });
assert(
  !has(h, img("paint")) && has(h, "NO PAINT"),
  "paint removed -> NO PAINT label",
);
assert(
  has(h, 'cme_combo-item-name">NO PAINT'),
  "paint removed -> NO PAINT uses the white label style (like NO HULL)",
);

// --- דור 1 (רגרסיה): חייב לרנדר בלי לקרוס, בלי דקורטיביים ---
h = R.createRowsHTML(gen1, {});
assert(has(h, img("ric")), "gen1: turret base image (no skin available)");
assert(has(h, img("stun")), "gen1: turret augment badge");
assert(!has(h, 'data-item-type="turretShotFx"'), "gen1: no shot fx badge");
assert(!has(h, 'data-item-type="paint"'), "gen1: no paint image");
assert(
  has(h, 'cme_combo-item-name">NO PAINT'),
  "gen1: NO PAINT placeholder in the white label style",
);
assert(
  !has(h, "paint-square-empty"),
  "gen1: no dashed empty-protection style on paint",
);
assert(has(h, img("owl")), "gen1: protections still render");

// --- כרטיס שלם: כפתורי עריכה/מחיקה ---
const card = { id: 1, name: "X", data: gen2 };
const stubDoc = {
  createElement: () => ({
    className: "",
    setAttribute() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    set innerHTML(v) {
      this._h = v;
    },
    get innerHTML() {
      return this._h;
    },
    addEventListener() {},
  }),
};
global.document = stubDoc;
const el = R.createComboCard(card, 0, {});
assert(has(el.innerHTML, "cme_combo-edit-btn"), "card: edit button present");
assert(
  has(el.innerHTML, "cme_combo-edit-icon-pencil") &&
    has(el.innerHTML, "cme_combo-edit-icon-check"),
  "card: both edit icons injected",
);
assert(has(el.innerHTML, "cme_delete-btn"), "card: delete button present");

// --- ComboCleaner: דקורטיביים שומרים על הקומבו ---
assert(
  C.isComboEmpty({ data: { paint: gen2.paint } }) === false,
  "cleaner: paint-only combo is NOT empty",
);
// אפקט ירייה אינו חריץ בקומבו יותר, ולכן קומבו ישן שנשאר רק איתו הוא ריק
assert(
  C.isComboEmpty({ data: { turretShotFx: gen2.turretShotFx } }) === true,
  "cleaner: a stale shotfx-only combo IS empty",
);
assert(
  C.isComboEmpty({ data: { turretSkin: gen2.turretSkin } }) === true,
  "cleaner: skin-only combo IS empty (skins equip nothing alone)",
);
assert(
  C.isComboEmpty({
    data: gen2,
    removedItems: { paint: true, turretShotFx: true },
  }) === false,
  "cleaner: still has core items",
);
assert(
  C.isComboEmpty({
    data: { paint: gen2.paint },
    removedItems: { paint: true },
  }) === true,
  "cleaner: removed paint -> empty",
);
assert(
  C.isComboEmpty({ data: gen1 }) === false,
  "cleaner: gen1 combo not empty",
);
