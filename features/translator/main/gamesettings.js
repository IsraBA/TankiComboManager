// features/translator/main/gamesettings.js  [MAIN world]

// Injects two native-styled controls into the game's Settings screen:
//   - a toggle that enables/disables the extension  -> setting `enabled`
//   - a dropdown to pick the translation language    -> setting `targetLang`
// Both use the adopted components (TankiQoL.Switch / TankiQoL.Select) and write through
// __CT.settings.set (single source of truth = chrome.storage). See CLAUDE.md
// "In-game settings panel".
//
// PLACEMENT: we inject INTO GameSettingsStyle-gameSettingsBlock (a semantic
// class, stable across builds — the rotating ksc-* hashes are never used), the
// Game tab's settings block, appended as its last child. That block ships with a
// FIXED height (21em, via ksc-195) and is already full, so a naive append
// overflows and rides over the content below it. The fix: override the block's
// height to `auto` (an inline style beats the ksc-* rule) so it grows with our
// section; its `min-height:21em` from the class stays, keeping the native
// minimum. The parent scrolling menu (SettingsComponentStyle-scrollingMenu) is
// `overflow: hidden scroll`, so the taller block just scrolls. No overlap.

(function () {
  "use strict";

  const NS = (window.__CT = window.__CT || {});
  // הקומפוננטות המשותפות (shared/components) יושבות על window.TankiQoL
  const Components = (window.TankiQoL = window.TankiQoL || {});

  // Semantic class of the settings block (stable across builds, unlike ksc-*).
  const BLOCK_SELECTOR = '[class*="GameSettingsStyle-gameSettingsBlock"]';
  const MARKER_ID = "cme-game-settings";

  // The languages offered for translation (this in-game dropdown is the only
  // place they're listed). Each row shows a flag + "Name, CODE" (e.g. "English, EN"),
  // matching the game's own language selector. `name` is the full English name;
  // the code is the value uppercased. Each value has a matching
  // features/translator/assets/flags/<value>.svg (see flagUrl()).
  const LANGS = [
    { value: "en", name: "English" },
    { value: "ru", name: "Russian" },
    { value: "es", name: "Spanish" },
    { value: "pt", name: "Portuguese" },
    { value: "de", name: "German" },
    { value: "fr", name: "French" },
    { value: "tr", name: "Turkish" },
    { value: "pl", name: "Polish" },
    { value: "uk", name: "Ukrainian" },
    { value: "ar", name: "Arabic" },
    { value: "it", name: "Italian" },
    { value: "nl", name: "Dutch" },
    { value: "ro", name: "Romanian" },
    { value: "he", name: "Hebrew" },
    { value: "zh", name: "Chinese" },
    { value: "ja", name: "Japanese" },
    { value: "ko", name: "Korean" },
    { value: "hi", name: "Hindi" },
    { value: "id", name: "Indonesian" },
    { value: "vi", name: "Vietnamese" },
  ];

  let current = { enabled: true, targetLang: "en" };
  let flagsBase = null;   // chrome-extension:// dir for flag SVGs (from config)
  let switchRow = null;   // the TankiQoL.Switch instance currently in the DOM
  let langSelect = null;  // the TankiQoL.Select instance currently in the DOM

  function flagUrl(value) { return flagsBase ? flagsBase + value + ".svg" : null; }

  // Build the dropdown options: flag + "Name, CODE" (e.g. "English, EN").
  function langOptions() {
    return LANGS.map((l) => ({
      value: l.value,
      text: l.name + ", " + l.value.toUpperCase(),
      flag: flagUrl(l.value),
    }));
  }

  // Builds a fresh container with the toggle + dropdown (rebuilt on each
  // injection because the block is torn down and recreated on screen changes).
  function buildContainer() {
    const c = document.createElement("div");
    c.id = MARKER_ID;
    c.className = "cme_gs-container";

    // Full-bleed divider + uppercase headline, mirroring the game's own
    // SettingsComponentStyle-borderLineOption / textHeadlineOptions sections.
    const divider = document.createElement("div");
    divider.className = "cme_gs-divider";
    c.appendChild(divider);

    const title = document.createElement("p");
    title.className = "cme_gs-title";
    title.textContent = "Chat Translator";
    c.appendChild(title);

    switchRow = Components.Switch.create({
      id: "cme-gs-enabled",
      label: "Chat translation",
      checked: current.enabled,
      onChange: (v) => NS.settings.set({ enabled: v }),
    });
    c.appendChild(switchRow);

    langSelect = Components.Select.create({
      id: "cme-gs-lang",
      label: "Translate chat into",
      options: langOptions(),
      selected: current.targetLang,
      onChange: (v) => NS.settings.set({ targetLang: v }),
    });
    c.appendChild(langSelect);

    return c;
  }

  // Aligns the controls to the current state (e.g. after a change from the
  // in-chat toggle button or Alt+T).
  function refreshControls() {
    if (switchRow && switchRow._getChecked() !== current.enabled) {
      switchRow._setChecked(current.enabled);
    }
    if (langSelect && langSelect._getValue() !== current.targetLang) {
      langSelect._setValue(current.targetLang);
    }
  }

  // Injects our section into the Game-tab settings block as its last child.
  // Idempotent. See PLACEMENT note above for the fixed-height override.
  function inject() {
    const block = document.querySelector(BLOCK_SELECTOR);
    if (!block) return;

    // The block is a flex item in a fixed-height scrolling flex column; its
    // class sets BOTH height:21em and min-height:21em. Once our + another
    // extension's content pushes it past 21em, flex-shrink (default 1) squeezes
    // the block back down to its 21em min-height, so the extra content overflows
    // and rides over the block below (that's the overlap, esp. with a
    // co-installed extension like Tanki Tweaks sharing this block). Fix:
    // height:auto so flex-basis follows the content, AND flex-shrink:0 so the
    // block never shrinks below that content. min-height:21em stays as the
    // native floor when there's little content. Inline beats the class rule;
    // re-asserted every call so a game re-render clearing our styles can't
    // reopen the overlap.
    if (block.style.height !== "auto") block.style.height = "auto";
    if (block.style.flexShrink !== "0") block.style.flexShrink = "0";

    if (block.querySelector("#" + MARKER_ID)) return;  // already injected
    block.appendChild(buildContainer());
    refreshControls();
  }

  // Track the settings state (chrome.storage) + config (flag base URL), and
  // align injected controls if any.
  NS.settings.subscribe((s) => {
    current = { enabled: !!s.enabled, targetLang: s.targetLang || "en" };

    // flagsBase arrives via config, possibly AFTER we've already injected a
    // flag-less dropdown. When it first lands, drop our section so the observer
    // re-injects it with flags. Fires at most once (null -> URL).
    const nb = (s.config && s.config.flagsBase) || null;
    if (nb && nb !== flagsBase) {
      flagsBase = nb;
      const existing = document.getElementById(MARKER_ID);
      if (existing) existing.remove();
    }
    refreshControls();
  });

  // The settings screen mounts/unmounts with navigation — re-inject on appearance.
  try {
    const mo = new MutationObserver(() => inject());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // Immediate injection attempt (in case settings are already open).
  inject();
})();
