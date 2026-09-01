// features/translator/main/settings.js  [MAIN world]

// Settings store: chrome.storage is the single source of truth.
// set() asks ISOLATED to write; the echo back updates state here.

(function () {
  const NS = (window.__CT = window.__CT || {});

  const state = {
    enabled: true,
    showOriginal: false,
    targetLang: 'en',
    config: null,   // paths from ISOLATED (e.g. { flagsBase }); see bridge.js
    // True once the first chrome.storage payload has arrived. Modules that
    // should only react to real settings (not the pre-load defaults) can gate
    // on this.
    ready: false,
  };

  const listeners = new Set();

  function emit() {
    for (const fn of listeners) {
      try { fn(state); }
      catch (e) { console.error('[ct] settings listener threw:', e); }
    }
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || !m.__ct || m.dir !== 'i2m') return;
    if (m.action === 'settings') {
      Object.assign(state, m.payload);
      state.ready = true;
    } else if (m.action === 'config') {
      state.config = m.payload;
    } else {
      return;
    }
    emit();
  });

  NS.settings = {
    get() { return { ...state }; },
    subscribe(fn) {
      listeners.add(fn);
      fn(state);  // fire immediately with current state
      return () => listeners.delete(fn);
    },
    // Request a settings change. Writes go to storage via ISOLATED, then echo
    // back through the listener above — keeping storage the single source of
    // truth (so the in-game controls and the toggle button never disagree).
    set(partial) {
      window.postMessage({ __ct: true, dir: 'm2i', action: 'set', payload: partial }, '*');
    },
  };

  // Tell ISOLATED we're ready, in case its initial broadcast fired before this
  // listener was installed.
  window.postMessage({ __ct: true, dir: 'm2i', action: 'ready' }, '*');
})();
