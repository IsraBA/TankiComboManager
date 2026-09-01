// features/translator/main/toggle.js  [MAIN world]

// In-game toggle button + Alt+T; both flip showOriginal through storage.
// The icon is INLINED on purpose — a failed fetch would leave it invisible.

(function () {
  const NS = (window.__CT = window.__CT || {});

  const BTN_ID = "ct-translate-toggle";
  const CHAT_BAR_SELECTOR = '[class*="BattleChatComponentStyle-inputContainer"]';
  // OFF-state overlay: red slash across the icon (viewBox is 0 0 64 64).
  const SLASH = '<line x1="20" y1="44" x2="44" y2="20" stroke="#FF6666" ' +
    'stroke-width="3" stroke-linecap="round"/>';

  let showOriginal = false;
  let enabled = true;   // when the extension is off, the button is removed entirely

  // Inlined translate icon (viewBox 0 0 64 64), sized to fill the button box.
  // Game chat-button chrome (semi-transparent) — the original userscript's button
  // style, distinct from the opaque standalone extension icon.
  const ICON =
    '<svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" ' +
    'style="display:block">' +
    '<rect width="64" height="64" rx="8" fill="#1A1A1A" fill-opacity="0.5"/>' +
    '<rect x="0.5" y="0.5" width="63" height="63" rx="7.5" stroke="white" ' +
    'stroke-opacity="0.25"/>' +
    '<g transform="translate(16,16) scale(1.3333)" fill="#FFFFFF">' +
    '<path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>' +
    '</g></svg>';
  // ON = white glyph (translating). OFF = grey glyph (#FFFFFF is unique to the
  // glyph — the border uses the `white` keyword) + a red diagonal slash.
  const svgOn = ICON;
  const svgOff = ICON.replace("#FFFFFF", "#7E8C99").replace("</svg>", SLASH + "</svg>");

  function refreshButton(b) {
    const showingTr = !showOriginal;
    b.innerHTML = showingTr ? (svgOn || "") : (svgOff || "");
    b.title = showingTr
      ? "Chat translation: ON - click or Alt+T to show original"
      : "Chat translation: OFF - click or Alt+T to translate";
  }

  function updateToggleButtons() {
    try { const b = document.getElementById(BTN_ID); if (b) refreshButton(b); } catch (e) {}
  }

  function removeToggleButton() {
    try { const b = document.getElementById(BTN_ID); if (b) b.remove(); } catch (e) {}
  }

  function injectToggleButton() {
    try {
      if (!enabled) return;                       // extension off -> no button
      if (document.getElementById(BTN_ID)) return;
      const alertImg = document.querySelector('img[src*="chatAlert"]');
      const sibling = alertImg ? alertImg.parentElement : null;
      const parent = sibling ? sibling.parentElement : document.querySelector(CHAT_BAR_SELECTOR);
      if (!parent) return;
      const b = document.createElement("div");
      b.id = BTN_ID;
      b.style.cssText = "display:flex;align-items:center;justify-content:center;" +
        "width:4.25em;height:4.25em;margin-left:0.5em;cursor:pointer;" +
        "user-select:none;flex:0 0 auto";
      refreshButton(b);
      b.addEventListener("click", function (e) {
        e.stopPropagation(); e.preventDefault();
        NS.settings.set({ showOriginal: !showOriginal });
      }, true);
      if (sibling && sibling.nextSibling) parent.insertBefore(b, sibling.nextSibling);
      else parent.appendChild(b);
    } catch (e) { /* best-effort DOM injection */ }
  }

  // Sync local state + button chrome with storage. The button exists only while
  // the extension is enabled — turning it off removes the button (and Alt+T goes
  // inert), turning it back on re-injects it.
  NS.settings.subscribe((s) => {
    showOriginal = !!s.showOriginal;
    enabled = !!s.enabled;
    if (!enabled) removeToggleButton();
    else { injectToggleButton(); updateToggleButtons(); }
  });

  // The chat input bar mounts/unmounts as the user opens chat — re-inject.
  try {
    new MutationObserver(injectToggleButton)
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // Alt+T toggles (physical key code, layout-independent; works in battle
  // without freeing the mouse).
  try {
    document.addEventListener("keydown", function (e) {
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        if (!enabled) return;   // toggle is meaningless while the extension is off
        NS.settings.set({ showOriginal: !showOriginal });
      }
    }, true);
  } catch (e) {}
})();
