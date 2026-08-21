// שכבת התצוגה חייבת להיות שקופה לעכבר, אחרת הטנק שמתחתיה לא ניתן לגרירה.
// זו בדיקת CSS טקסטואלית בלבד: ההתנהגות עצמה נבדקת רק בדפדפן.

const fs = require("fs");
const path = require("path");
const EXT =
  "c:/Users/User/Documents/programming/Tanki Extensions/Combos Extension/TankiCombosQoL";

const css = fs.readFileSync(
  path.join(EXT, "features/combos/styles.css"),
  "utf8",
);
const html = fs.readFileSync(
  path.join(EXT, "features/combos/view/template.js"),
  "utf8",
);
const preview = fs.readFileSync(
  path.join(EXT, "features/combos/view/tank_preview.js"),
  "utf8",
);

let failed = 0;
function ok(name, cond) {
  console.log((cond ? "OK  " : "FAIL") + "   " + name);
  if (!cond) failed++;
}

// גוף כלל ה-CSS של הסלקטור, בלי בלוקי media שמכילים אותו שוב
function ruleBody(selector) {
  const i = css.indexOf(selector + " {");
  if (i === -1) return null;
  return css.slice(i, css.indexOf("}", i));
}

function pointerEvents(selector) {
  const body = ruleBody(selector);
  if (!body) return "(no such rule)";
  const m = body.match(/pointer-events:\s*([a-z]+)/);
  return m ? m[1] : "(not set)";
}

// --- השכבה עצמה ---
const root = ruleBody("#combo-manager-view") || "";
ok(
  "the view root is transparent to the mouse",
  pointerEvents("#combo-manager-view") === "none",
);

// הקנבס ותיבת הגרירה שניהם ב-z-index 1, ולכן חייבים לדרג את עצמנו מעליהם
const rootZ = Number((root.match(/z-index:\s*(\d+)/) || [])[1]);
ok("the view outranks the game's drag box (z-index >= 2)", rootZ >= 2);

// z-index על המארח הופך אותו להקשר ערימה וכולא את תיבת הגרירה מתחת לקנבס.
// זה היה הבאג: המודל נראה, ולא הגיב לגרירה.
ok(
  "keepTankPreviewAlive does not stack the preview host",
  !/host\.style\.zIndex\s*=/.test(preview),
);
ok(
  "…but it still clears a stale inline z-index",
  /"z-index"/.test(preview),
);

// --- האזורים שחייבים להישאר לחיצים ---
const INTERACTIVE = [
  [".cme_descriptionBlockCollection", "the settings switches"],
  [".cme_TanksPartComponentStyle-tankPartUpgrades", "save / surprise / IO"],
  [".cme_itemsListContainer", "the combo cards and arrows"],
];
for (const [sel, what] of INTERACTIVE) {
  ok(sel + " stays clickable — " + what, pointerEvents(sel) === "auto");
}

// כל אלמנט אינטראקטיבי בתבנית חייב לשבת באחד מהאזורים שהחזירו pointer-events.
// אחרת הוא נטען, נראה תקין, ופשוט לא מגיב.
const REGION_ROOTS = [
  "cme_descriptionBlockCollection",
  "cme_TanksPartComponentStyle-tankPartUpgrades",
  "cme_itemsListContainer",
];
const regionStarts = REGION_ROOTS.map((c) => html.indexOf(c)).filter(
  (i) => i !== -1,
);
const firstRegion = Math.min(...regionStarts);

const interactiveIds = [...html.matchAll(/id="(cme_[\w-]*(btn|gear|switch)[\w-]*)"/g)]
  .map((m) => ({ id: m[1], at: m.index }));

ok("the template still has interactive elements", interactiveIds.length >= 5);
for (const { id, at } of interactiveIds) {
  ok("#" + id + " sits inside a clickable region", at > firstRegion);
}

// המארח הריק שהועתק מהמשחק אסור שיחזיר לעצמו pointer-events
ok(
  "the copied preview box does not grab the mouse back",
  pointerEvents(".cme_tankPreview") !== "auto",
);

// ---- ה-cooldown ----
// styles.css מדרג כפתורים ב-#id.class.class כדי לגבור על המשחק. כלל
// שמסתיר אותם חייב להיות חזק לפחות כמותו, אחרת הוא פשוט לא נכנס.
// הערות מכילות נקודות ("styles.css") ומזייפות את ספירת המחלקות
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const cooldownCss = strip(
  fs.readFileSync(path.join(EXT, "features/combos/view/cooldown.css"), "utf8"),
);
const mainCss = strip(css);

// כל הכללים שהסלקטור שלהם נוגע בכפתור ומגדירים לו display
function displayRules(src) {
  const out = [];
  for (const m of src.matchAll(/([^{}]*#cme_surprise-me-btn[^{}]*)\{([^}]*)\}/g)) {
    const d = /(?:^|;)\s*display:\s*([a-z-]+)/.exec(m[2]);
    if (d) out.push({ classes: (m[1].match(/\./g) || []).length, display: d[1] });
  }
  return out;
}

const shows = displayRules(mainCss);
const hides = displayRules(cooldownCss).filter((r) => r.display === "none");
ok("SURPRISE ME has a cooldown rule that hides it", hides.length > 0);
ok("…and styles.css really does set it visible", shows.length > 0);

const strongestShow = Math.max(0, ...shows.map((r) => r.classes));
const strongestHide = Math.max(0, ...hides.map((r) => r.classes));
ok(
  "…and the hide outweighs it (" + strongestHide + " vs " + strongestShow + " classes)",
  strongestHide >= strongestShow,
);

// הבלוק ממורכז ב-inset+margin, ולכן חייב מארח relative
ok(
  "the cooldown block is centred, not stacked in a column",
  /\.cme_cooldown-block\s*\{[^}]*inset:\s*0/.test(cooldownCss) &&
    /\.cme_cooldown-block\s*\{[^}]*margin:\s*auto/.test(cooldownCss),
);
ok(
  "…and its host is the relative block, not the button column",
  /cme_commonBlockForDescriptionAndButton/.test(
    fs.readFileSync(path.join(EXT, "features/combos/view/cooldown_guard.js"), "utf8"),
  ),
);

console.log(failed ? "\n" + failed + " FAILED" : "\nall checks passed");
process.exit(failed ? 1 : 0);
