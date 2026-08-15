// features/combos/isolated/detect.js  [ISOLATED world]

// מריץ את הגילוי על הבאנדל החי, שומר במטמון לפי כתובתו ושולח לעולם MAIN.

(function () {
  'use strict';

  const BUNDLE_URL_RE = /\/main\.[A-Za-z0-9]+\.js(?:[?#]|$)/;

  // גרסת הסכמה של תוצאת הגילוי, וחלק ממפתח המטמון. **חובה להעלות אותה בכל
  // שינוי בפלט של discover()** — אחרת מטמון ישן וחסר נטען, דורס את ה-SEED
  // שדווקא מלא, וכל שדה חדש חוזר null. זה קרה בפועל.
  const CACHE_VERSION = 9;
  const CACHE_PREFIX = 'garageConstants:v' + CACHE_VERSION + ':';

  // ניקוי מפתחות מגרסאות סכמה קודמות, שה-storage לא יצבור זבל
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
      return;   // הבאנדל לא נמצא בזמן
    }
    const cacheKey = CACHE_PREFIX + url;

    let constants = await loadCached(cacheKey);
    if (!constants) {
      try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        constants = window.TankiQoL.GarageDiscover.discover(await res.text());
        if (constants) chrome.storage.local.set({ [cacheKey]: constants });
      } catch (e) {
        console.error('[combos] detect: fetch/parse failed:', e);
      }
    }

    // בלי גילוי נשארים על ה-seed שב-garage/names.js
    if (!constants) return;
    lastConstants = constants;
    send('garageConstants', constants);
  })();

  // שליחה מחדש כש-MAIN מכריז מוכנות (הגילוי עלול להסתיים לפניו)
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__cmb || m.dir !== 'm2i') return;
    if (m.action === 'ready' && lastConstants) send('garageConstants', lastConstants);
  });
})();
