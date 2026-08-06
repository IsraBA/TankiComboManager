// features/translator/isolated/bridge.js  [ISOLATED world]
//
// הגשר של פיצ'ר התרגום — הקובץ היחיד בפיצ'ר עם גישה ל-chrome.*
// שני תפקידים:
//   1. מסנכרן את ההגדרות מ/אל chrome.storage.sync עבור מודולי עולם MAIN,
//      שיכולים לתפוס את המשחק אבל לא יכולים לגשת ל-chrome.*
//   2. מעביר בקשות תרגום מ-MAIN אל ה-service worker (המקום היחיד שמורשה
//      לבצע את ה-fetch החוצה — ראה background.js)
//
// פרוטוקול: window.postMessage, כל הודעה מתויגת `__ct` עם כיוון
// (`i2m` = isolated->main, `m2i` = main->isolated). אותו תכנון כמו הגשר של
// Shaft-Extension-V2; ההסבר על ה-handshake של `ready` נמצא ב-CLAUDE.md שלו.
//
// אחסון: כל ההגדרות של הפיצ'ר יושבות תחת מפתח storage אחד (`translator`)
// כאובייקט. זו הקונבנציה בתוסף — מפתח אחד לכל פיצ'ר — כדי שמפתחות של
// פיצ'רים שונים לא יתנגשו במרחב השמות הגלובלי של chrome.storage, ובלי
// לזהם את שמות ההגדרות בתוך הפיצ'ר עצמו (הם נשארים enabled / showOriginal
// / targetLang). ראה CLAUDE.md, "Storage layout".

(function () {
  const STORAGE_KEY = 'translator';

  const DEFAULTS = {
    enabled: true,          // התרגום הוא כל הפואנטה -> דלוק כברירת מחדל
    showOriginal: false,    // false = מציג תרגומים; מתהפך ב-Alt+T / בכפתור
    targetLang: 'en',       // קוד ISO; נבחר בהגדרות בתוך המשחק
  };

  // עותק מקומי של ההגדרות הנוכחיות. מתעדכן מה-storage ומ-onChanged, ומשמש
  // כבסיס למיזוג בכתיבה — כך אין צורך ב-get לפני כל set (ושתי כתיבות
  // מהירות ברצף, למשל ספאם של Alt+T, לא דורכות אחת על השנייה).
  let current = { ...DEFAULTS };

  function send(action, payload) {
    window.postMessage({ __ct: true, dir: 'i2m', action, payload }, '*');
  }

  function broadcastSettings() {
    chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULTS }, (items) => {
      current = { ...DEFAULTS, ...(items[STORAGE_KEY] || {}) };
      send('settings', current);
    });
  }

  // Config = נתיבים ש-MAIN צריך אבל לא יכול לחשב לבד (אין לו chrome.*).
  // flagsBase היא תיקיית ה-chrome-extension:// של קבצי הדגלים; MAIN בונה כל
  // כתובת כ-flagsBase + '<lang>.svg'. הדגלים מוצהרים ב-web_accessible_resources
  // כדי שהדף יורשה לטעון אותם. (האייקון של כפתור התרגום מוטמע ישירות
  // ב-toggle.js, ולכן אין מה להביא בשבילו.)
  const CONFIG = {
    flagsBase: chrome.runtime.getURL('features/translator/assets/flags/'),
  };
  function broadcastConfig() { send('config', CONFIG); }

  // דחיפת המצב הנוכחי מיד. ייתכן ש-MAIN עוד לא מאזין — ה-handshake של
  // 'ready' למטה מכסה את התחרות הזאת.
  broadcastSettings();
  broadcastConfig();

  // עדכונים חיים (Alt+T, הכפתור בקרב, פאנל ההגדרות) נכתבים ל-storage;
  // מהדהדים את השינוי חזרה ל-MAIN.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes[STORAGE_KEY]) return;
    current = { ...DEFAULTS, ...(changes[STORAGE_KEY].newValue || {}) };
    send('settings', current);
  });

  // הודעות נכנסות מ-MAIN.
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__ct || m.dir !== 'm2i') return;

    if (m.action === 'ready') {
      broadcastSettings();
      broadcastConfig();
    } else if (m.action === 'set') {
      // מיזוג לתוך האובייקט הקיים — ה-payload הוא תמיד חלקי.
      current = { ...current, ...(m.payload || {}) };
      chrome.storage.sync.set({ [STORAGE_KEY]: current });
    } else if (m.action === 'translate') {
      // העברה ל-service worker, ואז החזרת התוצאה ל-MAIN לפי אותו id.
      // אם ה-SW לא זמין (למשל באמצע restart) עונים בכל זאת, כדי שה-Promise
      // בצד MAIN לא ייתקע עד ה-timeout שלו.
      const { id, text, targetLang } = m.payload || {};
      try {
        chrome.runtime.sendMessage({ type: 'translate', text, targetLang }, (resp) => {
          if (chrome.runtime.lastError) {
            send('translateResult', { id, ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          send('translateResult', Object.assign({ id }, resp || { ok: false, error: 'no response' }));
        });
      } catch (err) {
        send('translateResult', { id, ok: false, error: String(err) });
      }
    }
  });
})();
