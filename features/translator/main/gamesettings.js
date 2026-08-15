// features/translator/main/gamesettings.js  [MAIN world]

// מזריק מתג שפה ומתג הפעלה למסך ההגדרות של המשחק.
// למה גובה הבלוק נדרס: ראה ההערה ליד השורה עצמה.

(function () {
  "use strict";

  const NS = (window.__CT = window.__CT || {});
  // הקומפוננטות המשותפות (shared/components) יושבות על window.TankiQoL
  const Components = (window.TankiQoL = window.TankiQoL || {});

  // Semantic class of the settings block (stable across builds, unlike ksc-*).
  const BLOCK_SELECTOR = '[class*="GameSettingsStyle-gameSettingsBlock"]';
  const MARKER_ID = "cme-game-settings";

  // הרשימה היחידה של השפות; לכל value יש דגל בשם זהה תחת assets/flags/
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

    // לבלוק יש height ו-min-height קבועים של 21em, ולכן תוכן נוסף גולש
    // ורוכב על מה שמתחתיו. height:auto + flex-shrink:0 פותרים; נדרס
    // מחדש בכל קריאה, כי רינדור של המשחק מנקה את הסגנונות שלנו.
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
