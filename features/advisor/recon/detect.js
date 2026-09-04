// features/advisor/recon/detect.js  [ISOLATED world]

// מריץ את גילוי שדות הקרב על הבאנדל החי, שומר במטמון ושולח לעולם MAIN.

(function () {
  'use strict';

  const BUNDLE_URL_RE = /\/main\.[A-Za-z0-9]+\.js(?:[?#]|$)/;

  // גרסת הסכמה, חלק ממפתח המטמון. להעלות בכל שינוי בפלט של discover()
  const CACHE_VERSION = 1;
  const CACHE_PREFIX = 'advisorFields:v' + CACHE_VERSION + ':';

  // ניקוי מפתחות מגרסאות סכמה קודמות, שה-storage לא יצבור זבל
  function cleanupStaleCaches() {
    try {
      chrome.storage.local.get(null, (all) => {
        const stale = Object.keys(all).filter(
          (k) => k.startsWith('advisorFields:') && !k.startsWith(CACHE_PREFIX)
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

  function send(fields) {
    window.postMessage({ __adv: true, dir: 'i2m', action: 'advisorFields', payload: fields }, '*');
  }

  function loadCached(cacheKey) {
    return new Promise((resolve) => {
      chrome.storage.local.get([cacheKey], (got) => resolve(got[cacheKey] || null));
    });
  }

  let lastFields = null;   // נשמר כדי לשלוח מחדש ב-handshake של 'ready'

  (async function run() {
    cleanupStaleCaches();

    let url;
    try {
      url = await waitForBundleUrl(30000);
    } catch (e) {
      return;   // הבאנדל לא נמצא בזמן
    }
    const cacheKey = CACHE_PREFIX + url;

    let fields = await loadCached(cacheKey);
    if (!fields) {
      try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        fields = window.TankiQoL.AdvisorDiscover.discover(await res.text());
        if (fields) chrome.storage.local.set({ [cacheKey]: fields });
      } catch (e) {
        console.error('[advisor] detect: fetch/parse failed:', e);
      }
    }

    // בלי גילוי נשארים על ה-SEED שב-recon/game/probe.js
    if (!fields) return;
    lastFields = fields;
    send(fields);
  })();

  // שליחה מחדש כש-MAIN מכריז מוכנות (הגילוי עלול להסתיים לפניו)
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__adv || m.dir !== 'm2i') return;
    if (m.action === 'ready' && lastFields) send(lastFields);
  });
})();
