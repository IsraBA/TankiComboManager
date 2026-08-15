// features/translator/main/translate.js  [MAIN world]

// request(text, lang) -> Promise<{text, lang}>. Per-session cache, hard
// timeout, and the fetch itself runs in the service worker.

(function () {
  const NS = (window.__CT = window.__CT || {});

  // MAIN-side timeout must exceed the SW worst case (3 backends x 8s each) so
  // we only reject here when the whole chain is genuinely dead.
  const REQUEST_TIMEOUT_MS = 26000;

  const cache = new Map();     // key -> {text, lang}
  const pending = new Map();   // id -> {resolve, reject, timer, key}
  let seq = 0;

  function keyOf(text, targetLang) { return targetLang + '\n' + text; }

  function request(text, targetLang) {
    const key = keyOf(text, targetLang);
    if (cache.has(key)) return Promise.resolve(cache.get(key));

    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('translate timeout'));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer, key });
      window.postMessage({
        __ct: true, dir: 'm2i', action: 'translate',
        payload: { id, text, targetLang },
      }, '*');
    });
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__ct || m.dir !== 'i2m' || m.action !== 'translateResult') return;
    const p = pending.get(m.payload.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(m.payload.id);
    if (m.payload.ok) {
      const res = { text: m.payload.text, lang: m.payload.lang || null };
      cache.set(p.key, res);
      p.resolve(res);
    } else {
      p.reject(new Error(m.payload.error || 'translate failed'));
    }
  });

  NS.translate = { request, cache };
})();
