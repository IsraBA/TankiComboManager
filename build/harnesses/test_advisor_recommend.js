// build/harnesses/test_advisor_recommend.js
//
// מריץ את מודל ההמלצה כפי שהוא נשלח, על קרבות מומצאים.
// node build/harnesses/test_advisor_recommend.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(
  'c:', 'Users', 'User', 'Documents', 'programming', 'Tanki Extensions',
  'Combos Extension', 'TankiCombosQoL',
);

const FILES = [
  'features/advisor/model/resistance_map.js',
  'features/advisor/model/recommend.js',
];

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('OK   ' + label); }
  else { fail++; console.log('FAIL ' + label); }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('OK   ' + label); }
  else { fail++; console.log('FAIL ' + label + '\n       want ' + e + '\n       got  ' + a); }
}

// ---- טעינת המודולים הנשלחים ----

const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of FILES) {
  const p = path.join(ROOT, f);
  vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}
const R = ctx.window.TankiQoL.AdvisorRecommend;
const MAP = ctx.window.TankiQoL.AdvisorResistanceMap;
ok(!!R && typeof R.recommend === 'function', 'the shipped model loaded');

// ---- מזהי תותחים אמיתיים ----

const T = {
  smoky: '920009630969',
  railgun: '920009631011',
  shaft: '920009631158',
  isida: '920009630913',
  thunder: '920009631123',
  twins: '920009630997',
  hammer: '920009631046',
  vulcan: '920009631144',
  unknown: '999999999999',
};

eq(MAP.forTurret(T.hammer), 'SHOTGUN_RESISTANCE', 'Hammer maps to shotgun, not "hammer"');
eq(MAP.forTurret(T.vulcan), 'MACHINE_GUN_RESISTANCE', 'Vulcan maps to machine gun');
eq(MAP.forTurret(T.isida), 'ISIS_RESISTANCE', 'Isida maps to ISIS');
eq(MAP.forTurret(T.unknown), null, 'an unknown turret maps to nothing');
ok(!MAP.isRecommendable('MINE_RESISTANCE'), 'mine protection is never recommended');
ok(!MAP.isRecommendable('CRITICAL_RESISTANCE'), 'Armadillo is not in the ordered list');
ok(!MAP.isRecommendable('ALL_RESISTANCE'), 'unique modules are out of scope');

// ---- מלאי מודולים ----

function mod(name, resistance, percent, owned) {
  return { id: 'm-' + name, name, resistance, percent, owned: owned !== false };
}
// גראג' משודרג במלואו, כולל ארמדילו
const FULL = [
  mod('Dolphin', 'SMOKY_RESISTANCE', 50),
  mod('Falcon', 'RAILGUN_RESISTANCE', 50),
  mod('Eagle', 'SHAFT_RESISTANCE', 50),
  mod('Ocelot', 'ISIS_RESISTANCE', 50),
  mod('Grizzly', 'THUNDER_RESISTANCE', 50),
  mod('Panther', 'TWINS_RESISTANCE', 50),
  mod('Wolf', 'SHOTGUN_RESISTANCE', 50),
  mod('Shark', 'MACHINE_GUN_RESISTANCE', 50),
  mod('Spider', 'MINE_RESISTANCE', 50),
  mod('Armadillo', 'CRITICAL_RESISTANCE', 50),
];
const NO_ARMA = FULL.filter((m) => m.resistance !== 'CRITICAL_RESISTANCE');

function turret(base, kills, carriers) {
  return { base, kills, score: kills * 15, carriers: carriers || 1, gs: 6000 };
}
const names = (list) => list.map((x) => x.name);

// ---- ארמדילו תופס חריץ, ונשארים שלושה ----

let r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10, 2), turret(T.shaft, 7), turret(T.isida, 6), turret(T.thunder, 5)],
  modules: FULL,
});
eq(names(r.equip), ['Armadillo', 'Dolphin', 'Falcon', 'Eagle'], 'with Armadillo: it leads and three follow');
ok(r.armadillo === true, '…and it is reported as worn');
eq(names(r.ordered).slice(0, 3), ['Dolphin', 'Falcon', 'Eagle'], 'the ordered row excludes Armadillo');
ok(r.ordered.length === 5, 'the ordered row holds every recommendable turret, not just four');

// ---- בלי ארמדילו: ארבע הגנות ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10, 2), turret(T.shaft, 7), turret(T.isida, 6), turret(T.thunder, 5)],
  modules: NO_ARMA,
});
eq(names(r.equip), ['Dolphin', 'Falcon', 'Eagle', 'Ocelot'], 'without Armadillo: four turret protections');
ok(r.armadillo === false, '…and it is reported as absent');

// ---- ארמדילו לא משודרג: לא נספר, ואז ארבע ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7), turret(T.isida, 6)],
  modules: NO_ARMA.concat([mod('Armadillo', 'CRITICAL_RESISTANCE', 25)]),
});
eq(names(r.equip), ['Dolphin', 'Falcon', 'Eagle', 'Ocelot'], 'Armadillo at 25% frees the slot for a fourth turret');

// ---- רף השידרוג: מדלגים וממשיכים ברשימה, לא משאירים חריץ ריק ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7), turret(T.isida, 6), turret(T.thunder, 5)],
  modules: NO_ARMA.map((m) => (m.resistance === 'RAILGUN_RESISTANCE' ? mod('Falcon', 'RAILGUN_RESISTANCE', 20) : m)),
});
eq(names(r.equip), ['Dolphin', 'Eagle', 'Ocelot', 'Grizzly'], 'a 20% module is skipped and the next turret takes the slot');
ok(!names(r.ordered).includes('Falcon'), '…and it never appears in the ordered row either');

r = R.recommend({
  turrets: [turret(T.smoky, 12)],
  modules: [mod('Dolphin', 'SMOKY_RESISTANCE', 30)],
});
eq(names(r.equip), ['Dolphin'], 'exactly 30% still counts');
r = R.recommend({
  turrets: [turret(T.smoky, 12)],
  modules: [mod('Dolphin', 'SMOKY_RESISTANCE', 29)],
});
eq(names(r.equip), [], 'just under the bar does not');

// ---- בעלות ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7), turret(T.isida, 6), turret(T.thunder, 5)],
  modules: NO_ARMA.map((m) => (m.resistance === 'SMOKY_RESISTANCE' ? mod('Dolphin', 'SMOKY_RESISTANCE', 50, false) : m)),
});
ok(!names(r.equip).includes('Dolphin'), 'a module the account does not own is never recommended');
eq(names(r.equip), ['Falcon', 'Eagle', 'Ocelot', 'Grizzly'], '…and the list simply continues');

// ---- מוקש וייחודיים מוחרגים גם כשהם משודרגים ----

r = R.recommend({
  turrets: [turret(T.smoky, 12)],
  modules: FULL.concat([mod('Spectrum', 'ALL_RESISTANCE', 50)]),
});
ok(!names(r.ordered).includes('Spider'), 'mine protection stays out of the ordered row');
ok(!names(r.equip).includes('Spectrum'), 'a unique module is never equipped by us');

// ---- תותח לא מוכר מדולג בלי להפיל את השאר ----

r = R.recommend({
  turrets: [turret(T.unknown, 99), turret(T.smoky, 12), turret(T.railgun, 3)],
  modules: NO_ARMA,
});
eq(names(r.equip), ['Dolphin', 'Falcon'], 'an unrecognised turret is skipped, the rest survive');

// ---- אין המלצה בכלל ----

eq(R.recommend({ turrets: [], modules: FULL }).ordered, [], 'no enemies -> nothing ordered');
eq(names(R.recommend({ turrets: [], modules: FULL }).equip), ['Armadillo'], 'no enemies but Armadillo is still worth wearing');
eq(R.recommend({}).equip, [], 'empty input does not throw');
eq(R.recommend({ turrets: [turret(T.smoky, 1)], modules: [] }).equip, [], 'an empty garage recommends nothing');

// ---- שני תותחים שממופים לאותה הגנה נספרים פעם אחת ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.smoky, 4)],
  modules: NO_ARMA,
});
eq(names(r.ordered), ['Dolphin'], 'the same resistance is not offered twice');

// ---- הסדר נשמר בדיוק כפי שהתקבל ----

r = R.recommend({
  turrets: [turret(T.thunder, 9), turret(T.smoky, 8), turret(T.railgun, 7)],
  modules: NO_ARMA,
});
eq(names(r.ordered), ['Grizzly', 'Dolphin', 'Falcon'], 'the model does not re-sort; ranking order is authoritative');

// ---- "כבר מצויד": הכפתור נעלם רק כשלחיצה לא תשנה דבר ----

const FOUR = {
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7), turret(T.isida, 6)],
  modules: NO_ARMA,
};
const ids = (r) => r.equip.map((m) => m.id);

r = R.recommend(FOUR);
eq(names(r.equip), ['Dolphin', 'Falcon', 'Eagle', 'Ocelot'], 'the four to equip');
ok(r.equipped === false, 'nothing mounted -> not equipped');

r = R.recommend(Object.assign({}, FOUR, { mounted: ids(R.recommend(FOUR)) }));
ok(r.equipped === true, 'exactly the recommended set -> equipped');

r = R.recommend(Object.assign({}, FOUR, {
  mounted: ids(R.recommend(FOUR)).slice().reverse(),
}));
ok(r.equipped === true, '…and slot order is irrelevant, as everywhere else');

r = R.recommend(Object.assign({}, FOUR, { mounted: ids(R.recommend(FOUR)).slice(0, 3) }));
ok(r.equipped === false, 'three of the four -> still something to do');

r = R.recommend(Object.assign({}, FOUR, {
  mounted: ids(R.recommend(FOUR)).slice(0, 3).concat(['m-Spider']),
}));
ok(r.equipped === false, 'a module we would unmount is a real difference');

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7)],
  modules: FULL,
  mounted: ['m-Armadillo', 'm-Dolphin', 'm-Falcon', 'm-Eagle'],
});
ok(r.equipped === true, 'Armadillo counts toward "already equipped" too');

// שלושה מומלצים בלבד, אבל ארבעה מורכבים: הרביעי היה מוסר בלחיצה
const THREE = {
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7)],
  modules: NO_ARMA,
};
eq(names(R.recommend(THREE).equip), ['Dolphin', 'Falcon', 'Eagle'], 'three recommended');
r = R.recommend(Object.assign({}, THREE, {
  mounted: ['m-Dolphin', 'm-Falcon', 'm-Eagle', 'm-Spider'],
}));
ok(r.equipped === false, 'all three mounted plus a fourth -> the button stays');

r = R.recommend({ turrets: [], modules: [], mounted: [] });
ok(r.equipped === false, 'no recommendation is not "already equipped"');

// ---- פחות חריצים (שחקן חדש) ----

r = R.recommend({
  turrets: [turret(T.smoky, 12), turret(T.railgun, 10), turret(T.shaft, 7)],
  modules: FULL,
  slots: 2,
});
eq(names(r.equip), ['Armadillo', 'Dolphin'], 'two slots: Armadillo plus one');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
