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
  const CACHE_VERSION = 2;
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

  // מאתר data class לפי השם הסמנטי שלו ומחזיר את מפת השדות שלו.
  // הלכידה כוללת כבר את השדה הראשון (התבנית עוצרת מיד אחרי הסוגר הפותח),
  // ולכן אפשר להעביר את הגוף כמו שהוא.
  function dataClassFields(src, name) {
    const m = new RegExp('[\\w$]+\\([\\w$]+\\)\\.toString=function\\(\\)\\{return"' +
      escapeRe(name) + '\\((.*?)"\\}').exec(src);
    return m ? parseFields(m[1]) : null;
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

    // כתובת התמונה: אובייקט ה-preview לא מחזיק מחרוזת אלא מתודה שבונה כתובת
    // CDN. מאתרים את שם המתודה משימוש אמיתי בקוד (`<preview>.<method>()`),
    // ומצליבים מול ה-accessor שהריפלקשן קורא לו "url" — שתי דרכים עצמאיות
    // שמסכימות בכל הבילדים שנבדקו.
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
