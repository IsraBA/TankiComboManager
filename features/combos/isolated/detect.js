// features/combos/isolated/detect.js  [ISOLATED world]

// מגלה מהבאנדל החי את השמות הממוזערים של מצב המוסך (Garage state) ושל מחלקת
// הפריט (GarageItem), ושולח אותם לעולם MAIN. אותה תבנית בדיוק כמו
// features/translator/isolated/detect.js — ראה CLAUDE.md, "Cross-build self-location".
//
// למה זה עובד, וטוב יותר מגילוי מבני רגיל:
// קוטלין מייצר לכל data class מתודת toString שמכילה את שמות השדות **כמחרוזות
// מפורשות**, לצד השם הממוזער שלהם. כלומר בבאנדל מופיע ממש:
//
//   ld(MB).toString=function(){return"Garage(itemsOnDepot="+bd(this.tpz_1)+
//                              ", mountedItems="+bd(this.vpz_1)+ ...
//
// אז במקום לנחש דפוסי קוד, אנחנו קוראים מיפוי ישיר: שם סמנטי -> שם ממוזער.
// המחרוזות האלה שורדות מיניפיקציה כי הן חלק מהפלט של toString.
//
// עוגנים (אומתו על 8 באנדלים — ראה הטבלה ב-CLAUDE.md):
//   - מחלקת ה-state = ה-toString היחיד שפותח ב-"Garage(" ומכיל "mountedItems=".
//   - מחלקת הפריט   = ה-toString היחיד שפותח ב-"GarageItem(".
//   - שדה הלכידה    = השדה **האחרון** ברשימת השדות של ה-state. ה-ctor כותב את
//     השדות בדיוק בסדר של ה-toString (אומת ב-8/8), ולכן ברגע שהשדה האחרון
//     נכתב האובייקט כבר מאוכלס במלואו — אותו לקח מהלכידה של Scorpion.
//
// התוצאה נשמרת ב-chrome.storage.local לפי כתובת הבאנדל (שמכילה את hash הגרסה,
// כך ש-cache ישן לא יכול להיות תקוע). אם הגילוי נכשל, garage_state.js נשען על
// שמות ה-seed שלו; אם גם הם לא מתאימים לבילד הרץ, ה-trap פשוט לא יאומת אף פעם
// (לא מזיק) ויידרש עדכון ידני של הדפוסים כאן.

(function () {
  const BUNDLE_URL_RE = /\/main\.[A-Za-z0-9]+\.js(?:[?#]|$)/;

  // גרסת הסכמה של תוצאת הגילוי, והיא חלק ממפתח ה-cache. **חובה להעלות אותה
  // בכל פעם שמוסיפים/משנים שדה בפלט של discover()** — אחרת cache שנשמר ע"י
  // גרסה קודמת של הקוד ייטען כמו שהוא, יידרס את ה-SEED ב-garage_state.js
  // (שדווקא כן מלא), וכל השדות החדשים יחזרו null. זה בדיוק הבאג שקרה כשנוספו
  // modificationFields/urlMethod/upgradeFields/deviceFields: הבאנדל לא התחלף,
  // ולכן ה-cache הישן והחסר נטען במקום גילוי מחודש.
  const CACHE_VERSION = 9;
  const CACHE_PREFIX = 'garageConstants:v' + CACHE_VERSION + ':';

  // ניקוי מפתחות מגרסאות סכמה קודמות (וגם של באנדלים ישנים מאותה משפחה),
  // כדי שה-storage לא יצבור זבל לאורך זמן.
  function cleanupStaleCaches() {
    try {
      chrome.storage.local.get(null, (all) => {
        const stale = Object.keys(all).filter(
          (k) => k.startsWith('garageConstants:') && !k.startsWith(CACHE_PREFIX)
        );
        if (stale.length) chrome.storage.local.remove(stale);
      });
    } catch (e) { /* ניקוי הוא best-effort בלבד */ }
  }

  // שדות שחייבים להימצא כדי שנחשיב את הגילוי כמוצלח
  const REQUIRED_STATE = ['mountedItems', 'items', 'isLoaded', 'currentCategory'];
  const REQUIRED_ITEM = ['id', 'name', 'category', 'mounted', 'mountIndex'];

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function findBundleUrl() {
    for (const s of document.scripts) {
      if (s.src && BUNDLE_URL_RE.test(s.src)) return s.src;
    }
    return null;
  }

  function waitForBundleUrl(timeoutMs) {
    return new Promise((resolve, reject) => {
      const initial = findBundleUrl();
      if (initial) return resolve(initial);

      const observer = new MutationObserver(() => {
        const url = findBundleUrl();
        if (url) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(url);
        }
      });
      observer.observe(document.documentElement || document, { childList: true, subtree: true });

      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error('bundle URL not found within ' + timeoutMs + 'ms'));
      }, timeoutMs);
    });
  }

  // חילוץ זוגות  שם-סמנטי -> שם-ממוזער  מתוך גוף ה-toString.
  // מטפל גם בעטיפות כמו bd(...) / xg(...) שקוטלין מוסיפה לאוספים ולשדות nullable.
  function parseFields(body) {
    const map = {};
    const re = /([A-Za-z0-9]+)="\+(?:[\w$]+\()*this\.([\w$]+_1)/g;
    let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
  }

  // אותו דבר, אבל למחלקות פרוטוקול (סיומת CC), שה-toString שלהן בנוי אחרת:
  //   "ModificationCC [" + "baseItemId = " + this.xxx_1 + " " + ...
  function parseCcFields(body) {
    const map = {};
    const re = /([A-Za-z0-9]+) = "\+this\.([\w$]+_1)/g;
    let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
  }

  // מאתר data class לפי השם הסמנטי שלו ומחזיר את **שם המחלקה הממוזער** ואת
  // מפת השדות שלו. הלכידה כוללת כבר את השדה הראשון (התבנית עוצרת מיד אחרי
  // הסוגר הפותח), ולכן אפשר להעביר את הגוף כמו שהוא.
  // שם המחלקה נדרש לכל פעולה שנרצה **לבנות** בזמן ריצה: ה-reducer של המשחק
  // בודק instanceof, ולכן צריך את המחלקה עצמה ולא רק את שמות השדות.
  function dataClass(src, name) {
    const m = new RegExp('[\\w$]+\\(([\\w$]+)\\)\\.toString=function\\(\\)\\{return"' +
      escapeRe(name) + '\\((.*?)"\\}').exec(src);
    return m ? { cls: m[1], fields: parseFields(m[2]) } : null;
  }
  function dataClassFields(src, name) {
    const d = dataClass(src, name);
    return d ? d.fields : null;
  }

  // --- גילוי מסלול השליחה לשרת (הרכבה מיידית, בלי ריצוד) ---
  //
  // כדי להרכיב פריט המשחק שולח פקודת mountItem לשרת, והשרת מחזיר אישור
  // שמעדכן את ה-state (ולכן את ה-UI). אנחנו רוצים לקרוא לאותה פונקציית
  // שליחה בדיוק — לא לזייף פרוטוקול: המשחק מקודד, מצפין ושולח בעצמו.
  //
  // שני אובייקטים נדרשים, שניהם נלכדים ב-Object.prototype trap:
  //   * ה-proxy של המוסך — עליו יושבת מתודת השליחה של mountItem.
  //   * ה-Space — מרשם הישויות, ממיר מזהה פריט לישות הרשת שהפקודה מקבלת.
  //
  // העוגן ל-proxy הוא **ה-hash של הפקודה** (‎595500642/251373796‎). הוא נגזר
  // משם הפקודה ולכן קבוע בין בילדים — אומת שהוא מופיע בדיוק פעם אחת בכל
  // אחד מ-8 הבאנדלים. העוגן ל-Space הוא מחרוזת שגיאה מילולית ששורדת
  // מיניפיקציה ("has been unloaded from space").
  // stateFields/itemFields מגיעים מ-discover() — נדרשים לעוגן פעולת הבחירה
  function discoverSend(src, stateFields, itemFields) {
    const out = {};

    // ה-ctor של ה-proxy הוא זה שמכיל את ה-hash של mountItem
    const hm = /new [\w$]+\(595500642,\s*251373796\)/.exec(src);
    if (!hm) return null;
    const ctorStart = src.lastIndexOf('function ', hm.index);
    const ctorHead = /^function ([\w$]+)\(\)\{/.exec(src.slice(ctorStart, hm.index + 10));
    if (!ctorHead) return null;
    out.proxyClass = ctorHead[1];

    const ctorBody = src.slice(ctorStart, src.indexOf('}', hm.index));
    const fields = [...ctorBody.matchAll(/this\.([\w$]+_1)=/g)].map((m) => m[1]);
    if (!fields.length) return null;
    out.proxyTrapField = fields[fields.length - 1];   // אחרון => מאוכלס במלואו

    const hashField = /this\.([\w$]+_1)=new [\w$]+\(595500642,\s*251373796\)/.exec(ctorBody);
    if (!hashField) return null;

    // מתודת השליחה = זו שבונה פקודה עם ה-hash של mountItem
    const sm = new RegExp(
      '[\\w$]+\\(' + escapeRe(out.proxyClass) + '\\)\\.([\\w$]+)=function\\(t\\)\\{' +
      'this\\.([\\w$]+_1)\\.[\\w$]+\\(this\\.([\\w$]+_1),t\\);' +
      'var n=new [\\w$]+\\([^,]*,this\\.' + escapeRe(hashField[1]) + ',this\\.\\3\\)').exec(src);
    if (!sm) return null;
    out.proxyMountMethod = sm[1];
    out.proxyMethods = [...src.matchAll(new RegExp(
      '[\\w$]+\\(' + escapeRe(out.proxyClass) + '\\)\\.([\\w$]+)=function', 'g'))].map((m) => m[1]);

    // השדה שמקשר את ה-proxy חזרה לקונטרולר של המוסך (שמחזיק את ה-store)
    const back = new RegExp('=[\\w$]+\\([\\w$]+\\(' + escapeRe(out.proxyClass) + '\\)\\),' +
      escapeRe(out.proxyClass) + '\\.call\\([\\w$]+\\),[\\w$]+\\.([\\w$]+_1)=[\\w$]+,').exec(src);
    if (back) out.proxyCcField = back[1];

    // שדות **פעולת ההרכבה הפנימית** של המשחק. היא זו שעושה את שני הדברים:
    // מעדכנת את ה-state המקומי *וגם* מפעילה את השליחה לשרת — ולכן היא היעד
    // האמיתי, במקום התזמור הידני שלנו.
    // העוגן: ה-handler של הקונטרולר, שמזוהה דרך שם פקודת ההרכבה שגילינו:
    //   function(n){ if(n.<needServer>){ var i=…(…(n.<item>.<id>)); …<MOUNT>(i) } … }
    const h = new RegExp(
      'function\\((\\w+)\\)\\{if\\(\\1\\.([\\w$]+_1)\\)\\{var (\\w+)=[\\w$]+\\(' +
      '[\\w$]+\\(\\)\\.[\\w$]+\\(\\)\\.[\\w$]+\\(\\)\\.[\\w$]+\\(\\1\\.([\\w$]+_1)\\.[\\w$]+_1\\)\\);' +
      '[\\w$]+\\.[\\w$]+\\(\\)\\.' + escapeRe(out.proxyMountMethod) + '\\(\\3\\)').exec(src);
    if (h) {
      out.actionNeedServerField = h[2];
      out.actionItemField = h[4];
      // אימות צולב: קיים ctor עם בדיוק שני השדות האלה ובסדר הזה
      const ctor = new RegExp('function ([\\w$]+)\\(t,n\\)\\{this\\.' + escapeRe(out.actionItemField) +
        '=t,this\\.' + escapeRe(out.actionNeedServerField) + '=n\\}').exec(src);
      if (ctor) out.mountActionClass = ctor[1];
      else { delete out.actionNeedServerField; delete out.actionItemField; }
    }

    // **פעולת "בחר פריט במוסך"** — היא זו שמעדכנת את מודל התלת-ממד במוסך,
    // ולא ההרכבה. בזרימה הרגילה במשחק הלחיצה על הפריט בוחרת אותו (והמודל
    // מתעדכן), ורק אחר כך ה-Equip מרכיב. לכן אחרי הרכבה תכנותית צריך גם
    // לשגר בחירה, אחרת המודל נשאר על הפריט הקודם.
    // עוגן: thunk עם שדה יחיד, שגופו מאתר את הפריט לפי מזהה ובודק קטגוריה.
    if (itemFields.category && stateFields.items) {
      const head = new RegExp(
        'function ([\\w$]+)\\(t\\)\\{var n;[\\w$]+\\.call\\(this,\\(n=t,function\\(t\\)\\{var i;' +
        'if\\(null!=n\\)\\{var r=t\\.[\\w$]+_1\\.[\\w$]+_1\\.' + escapeRe(stateFields.items) +
        '\\.[\\w$]+\\(n\\);\\(\\(i=r\\.' + escapeRe(itemFields.category) + '\\)\\.equals\\(').exec(src);
      if (head) {
        const tail = /\)\),this\.([\w$]+_1)=t\}/.exec(src.slice(head.index, head.index + 1200));
        if (tail) {
          out.selectActionClass = head[1];
          out.selectItemIdField = tail[1];
        }
      }
    }

    // ה-Space: מזוהה לפי הודעת השגיאה של מתודת ה"שלוף-או-זרוק"
    const sa = /([\w$]+)\(([\w$]+)\)\.([\w$]+)=function\(t\)\{var n,i=this\.([\w$]+)\(t\);if\(null==i\)throw n=this\.([\w$]+_1)\.h1\(t\)\?"Object "\+t\.toString\(\)\+" has been unloaded from space "/.exec(src);
    if (!sa) return null;
    out.spaceClass = sa[2];
    out.spaceEnsureMethod = sa[3];
    out.spaceLookupMethod = sa[4];   // מזהה -> ישות

    // שם המחלקה חוזר בכמה מודולים — בוחרים את ההגדרה הקרובה ביותר לעוגן
    const ctorRe = new RegExp('function ' + escapeRe(out.spaceClass) + '\\([^)]*\\)\\{', 'g');
    let best = null, bestDist = Infinity, mm;
    while ((mm = ctorRe.exec(src)) !== null) {
      const d = Math.abs(mm.index - sa.index);
      if (d < bestDist) { bestDist = d; best = mm; }
    }
    if (!best) return null;
    const sBody = src.slice(best.index, src.indexOf('}function', best.index));
    const sFields = [...sBody.matchAll(/this\.([\w$]+_1)=/g)].map((m) => m[1]);
    if (!sFields.length) return null;
    out.spaceTrapField = sFields[sFields.length - 1];

    // --- מנגנון ההקשר (context stack) ---
    // פקודה יוצאת ממוענת לישות שנמצאת "בהקשר" ברגע השליחה. המשחק תמיד עוטף:
    //   ctx.push(ישות) -> שליחה -> ctx.pop()
    // ובלי זה נזרקת השגיאה "GameObject in context is null" — שהיא גם העוגן
    // המושלם לגילוי, כי היא מחרוזת מילולית ששורדת מיניפיקציה.
    const g = /([\w$]+)\(([\w$]+)\)\.([\w$]+)=function\(\)\{var t=this\.([\w$]+_1);if\(null==t\)throw [\w$]+\("GameObject in context is null"\)/.exec(src);
    if (!g) return out;
    const helper = g[1];
    out.ctxClass = g[2];
    out.ctxGetMethod = g[3];
    out.ctxCurrentField = g[4];

    const push = new RegExp(escapeRe(helper) + '\\(' + escapeRe(out.ctxClass) +
      '\\)\\.([\\w$]+)=function\\(t\\)\\{this\\.([\\w$]+_1)\\.[\\w$]+\\(this\\.' +
      escapeRe(out.ctxCurrentField) + '\\),this\\.' + escapeRe(out.ctxCurrentField) + '=t\\}').exec(src);
    if (!push) return out;
    out.ctxPushMethod = push[1];
    const stackField = push[2];

    const pop = new RegExp(escapeRe(helper) + '\\(' + escapeRe(out.ctxClass) +
      '\\)\\.([\\w$]+)=function\\(\\)\\{if\\(this\\.' + escapeRe(stackField) + '\\.[\\w$]+\\(\\)\\)throw').exec(src);
    if (!pop) return out;
    out.ctxPopMethod = pop[1];

    const ctxCtor = new RegExp('function ' + escapeRe(out.ctxClass) + '\\(\\)\\{[\\w$]+=this,this\\.' +
      escapeRe(stackField) + '=[^;]*?\\}').exec(src);
    if (!ctxCtor) return out;
    const cFields = [...ctxCtor[0].matchAll(/this\.([\w$]+_1)=/g)].map((m) => m[1]);
    out.ctxTrapField = cFields[cFields.length - 1];

    return out;
  }

  // --- גילוי פעולת החלת הסקין ---
  //
  // סקינים אינם פריט מורכב רגיל (ניסינו — לא עובד). הם מערכת בצורת
  // האוגמנטים: פעולה דו-ארגומנטית (סקין, פריט) שמעדכנת את הפריט *וגם*
  // נשלחת לשרת דרך קונטרולר ייעודי. אין לה toString — היא לא data class —
  // ולכן צריך עוגן מבני.
  //
  // העוגן: ה-reducer מייצר עותק של GarageItem שבו **רק** השדה mountedSkin
  // משתנה, כלומר בקוד מופיע  copy(VOID ×30, skin.id). ספירת ה-VOID היא
  // שמזהה איזה שדה נכתב, והמספר עצמו נגזר מסדר השדות ב-toString של
  // GarageItem — שאותו כבר גילינו, אז אין כאן שום מספר קסם.
  // (השדה שאחריו הוא mountedShotSkin, ואותה תבנית תמצא גם אותו. אפקט
  //  הירייה הוסר מהפיצ'ר, ולכן לא מגלים אותו.)
  function discoverSkinMount(src, itemFields, itemToStringBody) {
    const names = [...itemToStringBody.matchAll(/([A-Za-z0-9]+)="\+/g)].map((m) => m[1]);
    const skinPos = names.indexOf('mountedSkin');
    if (skinPos < 0 || !itemFields.id) return null;

    // שם ה-VOID של קוטלין מתחלף בין בילדים, ולכן לא מקודדים אותו: דורשים
    // רק שכל הארגומנטים שלפני יהיו אותו מזהה בדיוק.
    const re = new RegExp('\\{return t\\.[\\w$]+\\(((?:[\\w$]+,)+)([\\w$]+)\\.' +
      escapeRe(itemFields.id) + '\\)\\}', 'g');
    let hit = null, voidName = null, m;
    while ((m = re.exec(src)) !== null) {
      const toks = m[1].split(',').filter(Boolean);
      if (toks.length !== skinPos) continue;
      if (new Set(toks).size !== 1) continue;
      hit = m; voidName = toks[0]; break;
    }
    if (!hit) return null;

    // המתודה העוטפת
    const seg = src.slice(Math.max(0, hit.index - 500), hit.index);
    const decls = [...seg.matchAll(/\)\.([\w$]+)=function\(t,n\)\{/g)];
    if (!decls.length) return null;
    const method = decls[decls.length - 1][1];

    // ענף ה-reducer שקורא לה — משם המחלקה ושני השדות
    const br = new RegExp('instanceof ([\\w$]+)\\)[\\w$]+=[\\w$]+\\.[\\w$]+\\((?:' +
      escapeRe(voidName) + ',)+[\\w$]+\\.[\\w$]+_1\\.' + escapeRe(method) +
      '\\(t\\.([\\w$]+_1),t\\.([\\w$]+_1)\\)').exec(src);
    if (!br) return null;

    // אימות צולב: ה-ctor כותב בדיוק את שני השדות, בסדר הזה
    const ctor = new RegExp('function ' + escapeRe(br[1]) + '\\(t,n\\)\\{[\\w$]+\\.call\\(this,n\\.' +
      escapeRe(itemFields.id) + '\\),this\\.' + escapeRe(br[2]) + '=t,this\\.' +
      escapeRe(br[3]) + '=n\\}').exec(src);
    if (!ctor) return null;

    return { skinMountClass: br[1], skinMountFields: { skin: br[2], item: br[3] } };
  }

  function discover(src) {
    // --- מחלקת ה-state של המוסך ---
    const stateRe = /[\w$]+\(([\w$]+)\)\.toString=function\(\)\{return"Garage\((.*?)"\}/g;
    let stateMatch = null;
    let m;
    while ((m = stateRe.exec(src)) !== null) {
      if (!m[2].includes('mountedItems=')) continue;
      if (stateMatch) return null;   // יותר ממחלקה אחת -> לא בטוח, עדיף להיכשל
      stateMatch = m;
    }
    if (!stateMatch) return null;

    const stateClass = stateMatch[1];
    const stateFields = parseFields('itemsOnDepot=' + stateMatch[2]);
    for (const f of REQUIRED_STATE) if (!stateFields[f]) return null;

    // --- מחלקת הפריט ---
    const itemRe = /[\w$]+\(([\w$]+)\)\.toString=function\(\)\{return"GarageItem\((.*?)"\}/g;
    let itemMatch = null;
    while ((m = itemRe.exec(src)) !== null) {
      if (itemMatch) return null;
      itemMatch = m;
    }
    if (!itemMatch) return null;

    const itemClass = itemMatch[1];
    const itemFields = parseFields('id=' + itemMatch[2]);
    for (const f of REQUIRED_ITEM) if (!itemFields[f]) return null;

    // --- שדה הלכידה: השדה האחרון שה-ctor של ה-state כותב ---
    // מוודאים שה-ctor אכן כותב את השדות בסדר של ה-toString, ולא מסתמכים על כך
    // בעיוורון: אוספים השמות עוקבות כל עוד הן שייכות לרשימת השדות המוכרת.
    const order = Object.values(stateFields);
    const known = new Set(order);
    const cm = new RegExp('function ' + escapeRe(stateClass) + '\\([^)]*\\)\\{').exec(src);
    if (!cm) return null;

    const tail = src.slice(cm.index, cm.index + 6000);
    const seq = [];
    for (const a of tail.matchAll(/this\.([\w$]+_1)=/g)) {
      if (!known.has(a[1])) { if (seq.length) break; continue; }
      seq.push(a[1]);
    }
    const trapField = seq[seq.length - 1];
    // הבדיקה הקריטית: השדה האחרון שנכתב הוא באמת האחרון ברשימה. אם לא —
    // מבנה ה-ctor השתנה, ולכידה עליו עלולה לתפוס אובייקט חלקי.
    if (!trapField || trapField !== order[order.length - 1]) return null;

    const out = { stateClass, itemClass, trapField, stateFields, itemFields };

    // --- מכאן והלאה: תוספות. כישלון באחת מהן לא מפיל את הגילוי הבסיסי,
    // --- הוא רק משאיר את השדה המתאים ריק בלוג.

    // רמת ה-Mk. שים לב: למחלקה יש גם modificationCount (כמה Mk קיימים לפריט)
    // וגם modificationIndex (איזה מורכב בפועל) — רק השני הוא מה שאנחנו רוצים.
    const mcc = /toString=function\(\)\{var t="ModificationCC \[";return(.*?)\}/.exec(src);
    if (mcc) out.modificationFields = parseCcFields(mcc[1]);

    // המיקרו-אפגרייד ("LVL-X"): currentLevel על UpgradableItemParams.
    const upgradeFields = dataClassFields(src, 'UpgradableItemParams');
    if (upgradeFields && upgradeFields.currentLevel) {
      out.upgradeFields = upgradeFields;
      // הרמה המקסימלית מגיעה ממתודה. מאתרים אותה דרך מתודת ה"האם במקסימום",
      // שגופה הוא בדיוק  currentLevel === maxLevel()  — עוגן חד-משמעי.
      const mx = new RegExp('\\.[\\w$]+=function\\(\\)\\{return this\\.' +
        escapeRe(upgradeFields.currentLevel) + '===this\\.([\\w$]+)\\(\\)\\}').exec(src);
      if (mx) out.maxLevelMethod = mx[1];
    }

    // האוגמנטים. במשחק הם נקראים Devices, ולכל אחד יש דגל installed ו-baseItemId
    // שמקשר אותו לתותח/גוף שעליו הוא מורכב.
    const deviceFields = dataClassFields(src, 'GarageDevice');
    if (deviceFields && deviceFields.installed) out.deviceFields = deviceFields;

    // --- פעולות ההגנות (Resistance modules) ---
    //
    // גם פעולות ה-Redux של המשחק הן data classes, ולכן ה-toString שלהן הוא
    // עוגן ישיר בדיוק כמו של Garage/GarageItem — אין כאן שום זיהוי מבני.
    //
    // הטקסונומיה (אומתה על 8/8 באנדלים): לכל פעולה יש **thunk ציבורי** שהוא
    // מה שה-UI משגר, ומתחתיו **פעולה "נמוכה"** שהריוסר צורך ושאליה מנוי גם
    // ה-subscriber ששולח לשרת:
    //
    //   GarageResistanceMount(resistance, index)   [thunk]
    //        -> GarageResistanceUnMount(מה שהיה בחריץ)      [נמוכה]
    //        -> GarageApplyResistanceMount(resistance, index) [נמוכה]
    //
    // אנחנו משגרים את הנמוכות. הסיבה מעשית: רק הן **מנויות**, והרישום מחזיק
    // KClass שמצביע על הבנאי — ולכן רק אותן אפשר לאתר בזמן ריצה לפי שם.
    // (ה-thunks אינם מנויים בשום מקום, ולכן אינם נגישים מגרף האובייקטים.)
    // שמות ה-thunks נשמרים בכל זאת — לתיעוד ולשימוש עתידי אם ייתפסו במלכודת.
    const resistUn = dataClass(src, 'GarageResistanceUnMount');
    if (resistUn && resistUn.fields.resistance && resistUn.fields.needServerUnmount) {
      out.resistUnmountClass = resistUn.cls;
      out.resistUnmountFields = resistUn.fields;
    }
    const resistApply = dataClass(src, 'GarageApplyResistanceMount');
    if (resistApply && resistApply.fields.resistance &&
        resistApply.fields.index && resistApply.fields.needServerMount) {
      out.resistApplyClass = resistApply.cls;
      out.resistApplyFields = resistApply.fields;
    }
    const resistMount = dataClass(src, 'GarageResistanceMount');
    if (resistMount && resistMount.fields.resistance && resistMount.fields.index) {
      out.resistMountClass = resistMount.cls;
      out.resistMountFields = resistMount.fields;
    }
    // ה-thunk של הרכבת פריט רגיל. הוא עושה שלושה דברים מעבר לפעולה הנמוכה
    // שאנחנו כבר משגרים: מכבד את מגבלת ההחלפה (delayMountTimeMs), משגר את
    // הפעולה הנמוכה, ולתותח/גוף גם טוען את רשימת האוגמנטים של הפריט.
    const mountThunk = dataClass(src, 'GarageItemMounted');
    if (mountThunk && mountThunk.fields.item && mountThunk.fields.needServerMount) {
      out.mountThunkClass = mountThunk.cls;
      out.mountThunkFields = mountThunk.fields;
    }

    // --- פעולות האוגמנטים (במשחק: Devices) ---
    //
    // כאן שתי הפעולות שאנחנו צריכים הן ממילא הנמוכות, ושתיהן מעדכנות מקומית
    // *וגם* שולחות לשרת — ההתקנה אפילו נקראת כך במפורש. (ההבדל מההגנות:
    // שם ה-thunk הוא שעושה את העבודה, וכאן אין thunk באמצע.)
    //   GarageInsertDeviceClientAndServer(device, item)
    //   GarageRemoveDevice(device, item)
    // המשחק תמיד מסיר את המותקן לפני שהוא מתקין אחר — לתותח/גוף יש אוגמנט
    // אחד בלבד — ולכן גם אנחנו.
    const insertDev = dataClass(src, 'GarageInsertDeviceClientAndServer');
    if (insertDev && insertDev.fields.device && insertDev.fields.item) {
      out.deviceInsertClass = insertDev.cls;
      out.deviceInsertFields = insertDev.fields;
    }
    const removeDev = dataClass(src, 'GarageRemoveDevice');
    if (removeDev && removeDev.fields.device && removeDev.fields.item) {
      out.deviceRemoveClass = removeDev.cls;
      out.deviceRemoveFields = removeDev.fields;
    }
    // בקשת טעינה של רשימת האוגמנטים לפריט. רשימות האוגמנטים נטענות בעצלות
    // לפי baseItemId, ולכן אוגמנט של פריט שמסכו לא נפתח מעולם עלול פשוט לא
    // להימצא ב-state. לא בשימוש עדיין — מגלים אותו כדי שיהיה זמין אם המקרה
    // הזה יופיע בפועל.
    const loadDev = dataClass(src, 'GarageLoadAvailableDevices');
    if (loadDev && loadDev.fields.itemId) {
      out.deviceLoadClass = loadDev.cls;
      out.deviceLoadFields = loadDev.fields;
    }

    // --- החלת סקין ---
    const skin = discoverSkinMount(src, itemFields, 'id=' + itemMatch[2]);
    if (skin) Object.assign(out, skin);

    // כתובת התמונה: אובייקט ה-preview לא מחזיק מחרוזת אלא מתודה שבונה כתובת
    // CDN. מאתרים את שם המתודה משימוש אמיתי בקוד (`<preview>.<method>()`),
    // ומצליבים מול ה-accessor שהריפלקשן קורא לו "url" — שתי דרכים עצמאיות
    // שמסכימות בכל הבילדים שנבדקו.
    // מסלול השליחה לשרת (להרכבה מיידית). אופציונלי כמו שאר התוספות.
    const send = discoverSend(src, stateFields, itemFields);
    if (send) Object.assign(out, send);

    if (itemFields.preview) {
      const counts = {};
      const useRe = new RegExp('\\.' + escapeRe(itemFields.preview) + '\\.([\\w$]+)\\(\\)', 'g');
      let u;
      while ((u = useRe.exec(src)) !== null) counts[u[1]] = (counts[u[1]] || 0) + 1;
      const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const anchor = /\)\.([\w$]+)=function\(\)\{var t=this\.[\w$]+_1;if\(null!=t\)return t;[\w$]+\("url"\)\}/.exec(src);
      out.urlMethod = best || (anchor ? anchor[1] : undefined);
      if (best && anchor && best !== anchor[1]) out.urlMethodAmbiguous = true;
    }

    return out;
  }

  function send(action, payload) {
    window.postMessage({ __cmb: true, dir: 'i2m', action, payload }, '*');
  }

  function loadCached(cacheKey) {
    return new Promise((resolve) => {
      chrome.storage.local.get([cacheKey], (got) => resolve(got[cacheKey] || null));
    });
  }

  let lastConstants = null;   // נשמר כדי לשלוח מחדש ב-handshake של 'ready'

  (async function run() {
    cleanupStaleCaches();

    let url;
    try {
      url = await waitForBundleUrl(30000);
    } catch (e) {
      console.warn('[combos] detect:', e.message);
      return;
    }
    const cacheKey = CACHE_PREFIX + url;

    let constants = await loadCached(cacheKey);
    if (!constants) {
      try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        constants = discover(text);
        if (constants) chrome.storage.local.set({ [cacheKey]: constants });
      } catch (e) {
        console.error('[combos] detect: fetch/parse failed:', e);
      }
    }

    if (!constants) {
      console.warn('[combos] could not auto-detect garage-state names for bundle', url,
        '— falling back to the seed names in garage_state.js (may be inert if this ' +
        'build differs). See CLAUDE.md.');
      return;
    }
    lastConstants = constants;
    send('garageConstants', constants);
    console.log('[combos] detect: discovered garage-state names for this build.');
  })();

  // שליחה מחדש כש-MAIN מכריז מוכנות (מכסה את המקרה שהגילוי הסתיים לפני
  // שה-listeners של MAIN הותקנו).
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'm2i') return;
    if (m.action === 'ready' && lastConstants) send('garageConstants', lastConstants);
  });
})();
