// features/translator/isolated/detect.js  [ISOLATED world]

// Auto-detect the chat-HUD minified names from the bundle (ISOLATED world).
//
// Tanki rebuilds the game bundle every few weeks and every minified name of
// the battle-chat HUD class, its render methods, its ring counters, and its
// vertical-offset object all rotate. This module finds them by parsing the
// bundle source, so we don't hand-edit constants each build. It mirrors
// Shaft-Extension-V2/content/detect.js; the discovery logic is ported verbatim
// from the research userscript's discover(), verified across 5 builds
// (bcae4cb9 / c4428a58 / e76a162c / a81c6ab2 / 41560f11).
//
// Anchors (all stable across those builds):
//   - append fn  = the `NAME(this,": ",` call (the "name: text" separator) in
//     the player render methods -> the glyph-append fn.
//   - HUD class + proto-set helper (`s$`/`_q`/`sk` — can contain `$`, so
//     `[\w$]+`) = a single-arg render method body that reaches
//     `<appendFn>(this,": ",`.
//   - finalize free-fn tail: resets per-line x, advances y by 23, bumps the
//     visible-count and ring write-pointer -> offset field + its two sub-fields
//     + count + write-pointer + (walk back for) the finalize fn name.
//   - evict method = `<helper>(<class>).<m>=function(){if(this.<count><1)return`
//     with the count matching the finalize's (sanity check).
//   - render methods = single-arg (`function(t){`) methods on the class whose
//     body calls BOTH the append fn and the finalize fn. (The resize method
//     also calls them but takes two args, so the single-arg filter excludes it.)
//
// The MAIN-world chat.js seeds the latest-known names so it works even if this
// fetch fails; when discovery succeeds we send the running build's names and
// chat.js arms the discovered trap too. Result is cached in chrome.storage.local
// keyed by bundle URL (which includes the build hash).
//
// If detection fails (Tanki restructures the chat HUD), log a clear warning;
// chat.js falls back to its seed, and if that seed doesn't match the running
// build the trap simply never validates (harmless) — a manual pattern update
// here is then needed. See CLAUDE.md "When a build breaks it".

(function () {
  const BUNDLE_URL_RE = /\/main\.[A-Za-z0-9]+\.js(?:[?#]|$)/;
  const CACHE_PREFIX = 'hudConstants:';

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

  // Ported verbatim from the research userscript's discover(). Returns the
  // HUD name-set or null. Field names match what chat.js expects.
  function discover(src) {
    const ID = '[\\w$]+';
    const esc = escapeRe;

    const app = src.match(/([\w$]+)\(this,": ",/);
    if (!app) return null;
    const appendFn = app[1];

    const cm = src.match(new RegExp('(' + ID + ')\\((' + ID + ')\\)\\.' + ID +
      '=function\\(t\\)\\{[^{}]*' + esc(appendFn) + '\\(this,": ",'));
    if (!cm) return null;
    const helper = cm[1], cls = cm[2];

    const fin = src.match(/t\.([\w$]+)\.([\w$]+)=0;var ([\w$]+)=t\.\1;\3\.([\w$]+)=\3\.\4\+23,t\.([\w$]+)=t\.\5\+1\|0,t\.([\w$]+)=t\.\6\+1\|0/);
    if (!fin) return null;
    const offset = fin[1], ySub = fin[2], zSub = fin[4], count = fin[5], ptr = fin[6];

    const tailIdx = src.indexOf(fin[0]);
    const back = src.slice(Math.max(0, tailIdx - 600), tailIdx);
    const decls = [...back.matchAll(new RegExp('function (' + ID + ')\\(t\\)\\{', 'g'))];
    const finalizeFn = decls.length ? decls[decls.length - 1][1] : null;
    if (!finalizeFn) return null;

    const em = src.match(new RegExp(esc(helper) + '\\(' + esc(cls) + '\\)\\.(' + ID +
      ')=function\\(\\)\\{if\\(this\\.(' + ID + ')<1\\)return'));
    if (!em || em[2] !== count) return null;  // sanity: evict count == finalize count
    const evict = em[1];

    const names = [...src.matchAll(new RegExp(esc(helper) + '\\(' + esc(cls) +
      '\\)\\.(' + ID + ')=function\\(t\\)\\{', 'g'))].map((x) => x[1]);
    const renderMethods = [];
    for (const nm of names) {
      const start = src.indexOf(helper + '(' + cls + ').' + nm + '=function(t){');
      const body = src.slice(start, start + 800);
      if (body.includes(appendFn + '(this,') && body.includes(finalizeFn + '(this)')) {
        renderMethods.push(nm);
      }
    }
    if (!renderMethods.length) return null;

    return { helper, cls, appendFn, finalizeFn, offset, ySub, zSub, count, ptr, evict, renderMethods };
  }

  function send(action, payload) {
    window.postMessage({ __ct: true, dir: 'i2m', action, payload }, '*');
  }

  function loadCached(cacheKey) {
    return new Promise((resolve) => {
      chrome.storage.local.get([cacheKey], (got) => resolve(got[cacheKey] || null));
    });
  }

  let lastConstants = null;  // kept so we can re-send on the MAIN 'ready' handshake

  (async function run() {
    let url;
    try {
      url = await waitForBundleUrl(30000);
    } catch (e) {
      console.warn('[ct] detect:', e.message);
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
        console.error('[ct] detect: fetch/parse failed:', e);
      }
    }

    if (!constants) {
      console.warn('[ct] could not auto-detect chat-HUD names for bundle', url,
        '— translation will rely on chat.js seed names (may be inert if this ' +
        'build differs). Manual pattern update may be needed. See CLAUDE.md.');
      return;
    }
    lastConstants = constants;
    send('hudConstants', constants);
    console.log('[ct] detect: discovered chat-HUD names for this build.');
  })();

  // Re-send on MAIN ready (covers detect finishing before MAIN's listeners).
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__ct || m.dir !== 'm2i') return;
    if (m.action === 'ready' && lastConstants) send('hudConstants', lastConstants);
  });
})();
