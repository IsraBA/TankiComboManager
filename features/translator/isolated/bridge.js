// features/translator/isolated/bridge.js  [ISOLATED world]

// הקובץ היחיד בפיצ'ר עם chrome.*: מסנכרן הגדרות ומעביר בקשות תרגום.
// הפרוטוקול המלא: CLAUDE.mds/translator.md

(function () {
  const STORAGE_KEY = 'translator';

  const DEFAULTS = {
    enabled: true,          // התרגום הוא כל הפואנטה -> דלוק כברירת מחדל
    showOriginal: false,    // false = מציג תרגומים; מתהפך ב-Alt+T / בכפתור
    targetLang: 'en',       // קוד ISO; נבחר בהגדרות בתוך המשחק
  };

  // בסיס למיזוג בכתיבה, כדי שכתיבות מהירות לא ידרכו זו על זו
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

  // נתיבים ש-MAIN צריך ולא יכול לחשב לבד; MAIN מוסיף '<lang>.svg'
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
