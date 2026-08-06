// features/translator/main/chat.js  [MAIN world]

// Battle-chat takeover + in-place translation (MAIN world). THE CORE MODULE.
//
// The battle chat is drawn to the WebGL canvas as positioned glyph meshes.
// There is no "edit message" API, so to change displayed text we TAKE OVER:
// clear the chat and replay messages through the game's own render methods
// with the text we want. (Validated in research: mutating a render arg's text
// before the original call changes what's drawn, and a full clear+replay
// rebuild works even out of tick — which is how an async translation returns.)
//
// Pipeline: engine renders a message -> our wrapper records it + shows it
// (original + braille spinner while translating) -> translation returns ->
// debounced REBUILD (clear + replay last N with current display text).
//
// ENGINE RESIZE REPLAY dedup: on every resize/fullscreen change the engine
// blanks the chat and re-emits the last <=max stored messages through the SAME
// render methods (fresh arg objects). We detect this (a render call arriving
// while the visible-line count is 0 although we still hold records) and adopt
// the replayed args instead of re-recording -> no duplicated lines.
//
// Consumes __CT.settings (enabled / showOriginal / targetLang), __CT.translate
// (network via the SW), and __CT.skip (no-translate slang). All the minified
// HUD names are DISCOVERED per build by features/translator/isolated/detect.js and delivered as a
// `hudConstants` message; the seed below only bootstraps the latest-known build
// and the trap so nothing is inert during the discovery fetch.
//
// See CLAUDE.md for the full canvas render model, the historical duplicate-line
// bugs this code is shaped around, and the recovery procedure when a build
// breaks detection.

(function () {
  const W = window;
  const NS = (W.__CT = W.__CT || {});

  // ---- config ---------------------------------------------------------
  const MAX_VISIBLE = 8;            // chat shows ~8 lines
  const REBUILD_DEBOUNCE_MS = 120;  // coalesce bursts of translations
  const TR_ARROW = '» ';
  const REPLAY_WINDOW_MS = 1500;    // resize-replay match-queue lifetime
  // Pending-translation loader: a braille spinner appended to the original text
  // while the translation is in flight; removed once it returns.
  const LOADER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const LOADER_INTERVAL_MS = 80;

  // Active HUD name-set. Seeded with the latest known build (009aa16b) so we
  // work even before/without discovery; detect.js overrides it per build via
  // the `hudConstants` message. Field meanings: see detect.js / CLAUDE.md.
  // (ySub/zSub are discovered but unused by the current rebuild — kept for
  // parity with the discovered shape.)
  let D = {
    helper: 'v$', cls: 'MAn', appendFn: 'kAn', finalizeFn: 'yAn',
    offset: 'k1fr_1', ySub: 'o4r_1', zSub: 'p4r_1',
    count: 'i1fr_1', ptr: 'j1fr_1', evict: 'q1fr',
    renderMethods: ['n1fr', 'p1fr', 'm1fr', 'o1fr'],
  };

  // ---- live settings snapshot ----------------------------------------
  let S = { enabled: true, showOriginal: false, targetLang: 'en', ready: false };

  // ---- runtime / debug surfaces (kept identical to the research userscript)
  W.__CT_HUD = null;
  W.__CT_MSGS = [];   // [{method, arg, textKey, text, translation, lang, state, willTranslate, userShowOriginal, time}]
  W.__CT_DEBUG = {
    names: D, discovered: false, settings: S,
    captured: 0, wrappedMethods: [], intercepts: 0,
    translations: 0, rebuilds: 0, replayAdopts: 0, skipped: 0, lastError: null,
  };

  function ownKeys(o) { try { return Object.keys(o); } catch (_) { return []; } }
  function get(o, k) { try { return o[k]; } catch (_) { return undefined; } }
  function hasLetter(text) { return !!text && /\p{L}/u.test(text); }

  // Message text = the (longest) top-level own STRING on the render arg.
  function findTextKey(arg) {
    let bestK = null, bestLen = -1;
    for (const k of ownKeys(arg)) {
      const v = get(arg, k);
      if (typeof v === 'string' && v.length > bestLen) { bestK = k; bestLen = v.length; }
    }
    return bestK;
  }

  // ---- display text for a message ------------------------------------
  let loaderFrame = 0;
  function displayText(m) {
    if (!m.willTranslate) return m.text;
    const showOrig = m.userShowOriginal != null ? m.userShowOriginal : S.showOriginal;
    if (showOrig || !S.enabled) return m.text;   // original mode: clean
    if (m.state === 'done') {
      const tr = m.translation;
      const same = !tr || !tr.trim() ||
        tr.trim().toLowerCase() === (m.text || '').trim().toLowerCase();
      // Suppress when the detected source already equals the chosen target
      // (e.g. target=EN and the message was English) — nothing to translate.
      const srcIsTarget = m.lang && S.targetLang &&
        m.lang.toLowerCase() === S.targetLang.toLowerCase();
      if (same || srcIsTarget) return m.text;
      return (m.lang ? '[' + m.lang.toUpperCase() + '] ' : '[文] ') + TR_ARROW + tr;
    }
    return (m.text || '') + ' ' + LOADER_FRAMES[loaderFrame % LOADER_FRAMES.length]; // pending
  }

  // ---- translation dispatch ------------------------------------------
  function fireTranslate(m) {
    const lang = S.targetLang;
    NS.translate.request(m.text, lang).then((res) => {
      if (S.targetLang !== lang) return;   // target changed mid-flight; a newer request owns this msg
      m.translation = res.text; m.lang = res.lang; m.state = 'done';
      W.__CT_DEBUG.translations++;
      scheduleRebuild();
    }).catch((e) => {
      m.state = 'done';   // give up gracefully -> original stays shown
      W.__CT_DEBUG.lastError = 'translate: ' + e;
      scheduleRebuild();
    });
  }

  // Re-evaluate the visible messages after the user turns the extension on or
  // changes the target language. force=true (lang change) re-requests even
  // already-translated messages; force=false (enabled on) only starts ones not
  // yet translating. Slang stays verbatim in both cases.
  function refreshVisibleTranslations(force) {
    if (!S.enabled) return;
    for (const m of W.__CT_MSGS.slice(-MAX_VISIBLE)) {
      if (!hasLetter(m.text) || NS.skip.shouldSkip(m.text)) continue;
      if (!force && m.willTranslate) continue;
      m.willTranslate = true;
      m.translation = null; m.lang = null; m.state = 'pending';
      fireTranslate(m);
    }
    ensureLoaderAnim();
  }

  // ---- rebuild: clear + replay our model with current display text ----
  function rebuildNow() {
    const hud = W.__CT_HUD;
    if (!hud || !S.enabled) return;
    const proto = Object.getPrototypeOf(hud);
    try {
      // Clear by evicting every visible line, exactly as the engine does when
      // old messages scroll off. Do NOT manually reset the ring pointer or the
      // vertical offset (that was the v0.10 duplicate-lines bug) — the offset
      // grows monotonically, so poking it desyncs the meshes once a translated
      // message wraps to a different line count. Let the engine manage its own
      // counters; we only evict + replay (= native append).
      const evict = proto[D.evict];
      for (let i = 0; i < 60 && hud[D.count] > 0; i++) evict.call(hud);
      for (const m of W.__CT_MSGS.slice(-MAX_VISIBLE)) {
        if (m.textKey) { try { m.arg[m.textKey] = displayText(m); } catch (e) {} }
        try { proto[m.method].call(hud, m.arg); } catch (e) { W.__CT_DEBUG.lastError = String(e); }
      }
      W.__CT_DEBUG.rebuilds++;
    } catch (e) { W.__CT_DEBUG.lastError = String(e); }
  }

  let rebuildTimer = null;
  function scheduleRebuild() {
    if (rebuildTimer) return;
    rebuildTimer = setTimeout(() => { rebuildTimer = null; rebuildNow(); }, REBUILD_DEBOUNCE_MS);
  }
  NS.rebuild = rebuildNow;

  // ---- animated loader -----------------------------------------------
  // Runs while any visible message is still pending a translation; advances the
  // spinner frame and rebuilds. Stops once nothing is pending.
  let loaderTimer = null;
  function anyLoaderPending() {
    if (S.showOriginal || !S.enabled) return false;
    for (const m of W.__CT_MSGS.slice(-MAX_VISIBLE)) if (m.state === 'pending') return true;
    return false;
  }
  function ensureLoaderAnim() {
    if (loaderTimer || !anyLoaderPending()) return;
    loaderTimer = setInterval(() => {
      if (!anyLoaderPending()) { clearInterval(loaderTimer); loaderTimer = null; return; }
      loaderFrame = (loaderFrame + 1) % 1000000;
      rebuildNow();
    }, LOADER_INTERVAL_MS);
  }

  // ---- render-method interception ------------------------------------
  // Engine resize-replay dedup state: a queue of our records the engine is
  // expected to re-emit after blanking the chat (see header). Armed when a
  // render call arrives with the visible line count at 0 while we hold records;
  // matched entries are consumed front-to-front (the model replays oldest ->
  // newest). Time-bounded so a stale queue can't swallow a genuine new message.
  let replayQ = [];
  let replayT = 0;

  function wrapRenderMethod(hud, name) {
    const orig = hud[name];
    if (typeof orig !== 'function' || hud['__ct_wrapped_' + name]) return;
    try {
      Object.defineProperty(hud, name, {
        configurable: true, writable: true, enumerable: false,
        value: function (arg) {
          try {
            const textKey = arg && typeof arg === 'object' ? findTextKey(arg) : null;
            const original = textKey ? get(arg, textKey) : null;

            // -- engine resize-replay dedup ----------------------------
            if (replayQ.length && Date.now() - replayT > REPLAY_WINDOW_MS) replayQ = [];
            if (this[D.count] === 0 && W.__CT_MSGS.length) {
              // canvas was just blanked (resize): what follows is the engine
              // replaying the visible tail, not new messages.
              replayQ = W.__CT_MSGS.slice(-MAX_VISIBLE);
              replayT = Date.now();
            }
            if (replayQ.length) {
              const idx = replayQ.findIndex((e) => e.method === name && e.text === original);
              if (idx >= 0) {
                const entry = replayQ[idx];
                replayQ.splice(0, idx + 1);
                entry.arg = arg;
                entry.textKey = textKey;
                W.__CT_DEBUG.replayAdopts++;
                if (S.enabled && entry.willTranslate && textKey) {
                  try { arg[textKey] = displayText(entry); } catch (e) {}
                }
                if (entry.state === 'pending') ensureLoaderAnim();
                return orig.apply(this, arguments);
              }
            }

            const m = {
              method: name, arg, textKey, text: original,
              translation: null, lang: null, state: 'plain', willTranslate: false,
              userShowOriginal: null, time: Date.now(),
            };
            if (S.enabled && hasLetter(original) && !NS.skip.shouldSkip(original)) {
              m.willTranslate = true; m.state = 'pending';
            } else if (S.enabled && hasLetter(original)) {
              W.__CT_DEBUG.skipped++;   // universal slang: shown verbatim, no API call
            }
            W.__CT_MSGS.push(m);
            if (W.__CT_MSGS.length > 200) W.__CT_MSGS.shift();
            W.__CT_DEBUG.intercepts++;

            if (S.enabled && textKey && m.willTranslate) {
              try { arg[textKey] = displayText(m); } catch (e) {}
            }
            if (m.willTranslate) { ensureLoaderAnim(); fireTranslate(m); }
          } catch (e) { W.__CT_DEBUG.lastError = String(e); }
          return orig.apply(this, arguments);
        },
      });
      Object.defineProperty(hud, '__ct_wrapped_' + name, {
        value: true, enumerable: false, configurable: true,
      });
      W.__CT_DEBUG.wrappedMethods.push(name);
    } catch (e) { W.__CT_DEBUG.lastError = String(e); }
  }

  // A captured object is the chat HUD if its prototype has all the render
  // methods + the evict method (per the current name-set D).
  function looksLikeHud(o) {
    if (!o || typeof o !== 'object') return false;
    for (const m of D.renderMethods) if (typeof get(o, m) !== 'function') return false;
    return typeof get(o, D.evict) === 'function';
  }

  function captureHud(hud) {
    W.__CT_HUD = hud;
    W.__CT_MSGS = [];
    replayQ = [];
    W.__CT_DEBUG.captured++;
    W.__CT_DEBUG.wrappedMethods = [];
    D.renderMethods.forEach((m) => wrapRenderMethod(hud, m));
    console.log('[ct] battle-chat HUD captured; translating foreign messages. ' +
      'Toggle: Alt+T, the chat button, or __CT_TOGGLE().');
  }

  // ---- Object.prototype trap to grab the HUD on construction ----------
  // Trap the offset-object field (ctor writes `this.<offset> = new ...`).
  // (Re)capture on EVERY new HUD instance — a new battle creates a fresh HUD;
  // the previous capture would otherwise go stale.
  const armed = new Set();
  function armTrap(prop) {
    if (!prop || armed.has(prop)) return;
    armed.add(prop);
    try {
      Object.defineProperty(W.Object.prototype, prop, {
        configurable: true, enumerable: false,
        get() { return undefined; },
        set(v) {
          Object.defineProperty(this, prop, {
            value: v, writable: true, configurable: true, enumerable: true,
          });
          if (this !== W.__CT_HUD && looksLikeHud(this)) {
            try { captureHud(this); } catch (e) { W.__CT_DEBUG.lastError = String(e); }
          }
        },
      });
    } catch (e) { W.__CT_DEBUG.lastError = String(e); }
  }

  // ---- discovered names from detect.js -------------------------------
  function applyNames(d) {
    D = d;
    W.__CT_DEBUG.names = d;
    W.__CT_DEBUG.discovered = true;
    armTrap(d.offset);   // arm the discovered offset field too
    console.log('[ct] using discovered chat-HUD names for this build:', JSON.stringify(d));
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__ct || m.dir !== 'i2m' || m.action !== 'hudConstants') return;
    try { applyNames(m.payload); } catch (err) { W.__CT_DEBUG.lastError = String(err); }
  });

  // ---- settings reactions --------------------------------------------
  NS.settings.subscribe((s) => {
    const langChanged = (s.targetLang || 'en') !== S.targetLang;
    const enabledOn = !!s.enabled && !S.enabled;
    S = {
      enabled: !!s.enabled, showOriginal: !!s.showOriginal,
      targetLang: s.targetLang || 'en', ready: !!s.ready,
    };
    W.__CT_DEBUG.settings = S;
    W.__CT_SHOW_ORIGINAL = S.showOriginal;   // read-only mirror for research helpers
    W.__CT_ENABLED = S.enabled;
    if (!W.__CT_HUD) return;                  // nothing visible yet
    if (langChanged) refreshVisibleTranslations(true);
    else if (enabledOn) refreshVisibleTranslations(false);
    if (S.enabled && !S.showOriginal) ensureLoaderAnim();
    rebuildNow();
  });

  // ---- console / debug controls (parity with the research userscript) -
  W.__CT_TOGGLE = function () {
    NS.settings.set({ showOriginal: !S.showOriginal });
    return S.showOriginal ? 'translation' : 'original';  // value AFTER the pending flip
  };
  W.__CT_TOGGLE_MSG = function (i) {
    const m = W.__CT_MSGS[i];
    if (!m) { console.log('[ct] no message at index ' + i); return; }
    const cur = m.userShowOriginal != null ? m.userShowOriginal : S.showOriginal;
    m.userShowOriginal = !cur;
    rebuildNow();
    return m.userShowOriginal ? 'original' : 'translation';
  };
  W.__CT_TOGGLE_LAST = function () {
    for (let i = W.__CT_MSGS.length - 1; i >= 0; i--) {
      if (W.__CT_MSGS[i].willTranslate) return W.__CT_TOGGLE_MSG(i);
    }
    console.log('[ct] no translated message to toggle');
  };
  W.__CT_REBUILD = rebuildNow;
  W.__CT_STATE = function () {
    const s = {
      settings: S, names: D, debug: W.__CT_DEBUG,
      recorded: W.__CT_MSGS.length, captured: !!W.__CT_HUD,
    };
    console.log('[ct] state:', s);
    return s;
  };

  // ---- boot -----------------------------------------------------------
  armTrap(D.offset);   // instant coverage with the seeded (latest-known) names
  console.log('[ct] Tanki Chat Translator core armed (self-locating). Foreign ' +
    'messages show original (braille spinner) then swap to translation. Toggle ' +
    'with Alt+T, the chat button, or __CT_TOGGLE().');
})();
