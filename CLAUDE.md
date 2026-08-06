# Tanki Online — Combos & QoL — Agent Guide

## Project Overview

A Chrome extension (Manifest V3) of quality-of-life tools for
[Tanki Online](https://tankionline.com). Published on the Chrome Web Store with
500+ users. Two features today, built to take more:

| Feature | What it does | Where it lives | Arena |
|---|---|---|---|
| **Combos** | Save full equipment setups and equip them in one click | `features/combos/` | Garage + lobby, via DOM manipulation |
| **Translator** | Translates foreign battle chat in place on the game canvas | `features/translator/` | Battle chat, via hooks into the game's own render code |

The two features are almost completely independent: different screens, different
JS worlds, different storage areas. They share only the UI components in
`shared/`. Keep it that way — a new feature should be a new folder under
`features/`, not additions to an existing one.

> History: the translator started life as a separate extension
> (`../../Chat-Translator-Extension`, now absorbed) that was going to be sold for
> ~$2. That was dropped in favour of shipping it free inside this extension. There
> is no payment/licensing code anywhere, by design.

## Project Structure

```
.
├── manifest.json                 # 4 content-script blocks — see "Manifest layout"
├── background.js                 # service worker: the cross-origin translation fetch
├── CLAUDE.md                     # this file
├── README.md                     # public-facing project readme
├── docs/
│   ├── PACKAGING.md              # WHAT GOES IN THE STORE ZIP — read before zipping
│   ├── PRIVACY.md                # the public privacy policy (must be hosted at a URL)
│   └── STORE.md                  # paste-ready texts for the CWS dashboard
├── build/
│   └── make-zip.ps1              # builds the store zip (implements PACKAGING.md)
├── shared/
│   └── components/               # native-styled UI components, used by both features
│       ├── drawer.js/.css        # side panel + overlay
│       ├── switch.js/.css        # toggle switch (game settings style)
│       └── select.js/.css        # dropdown (game DropDownStyle), optional flag images
├── features/
│   ├── combos/
│   │   ├── main.js               # entry point — MutationObserver orchestrator
│   │   ├── styles.css            # main combo-view styles
│   │   ├── combo_card.css        # combo card styles
│   │   ├── lib/
│   │   │   ├── constants.js      # centralized DOM selectors and config values
│   │   │   ├── utils.js          # shared utility functions
│   │   │   └── language_manager.js  # auto-detects game language from UI text
│   │   ├── core/
│   │   │   ├── combo_saver.js    # scans current equipment and saves to storage
│   │   │   ├── combo_loader.js   # reads saved combo and equips items
│   │   │   ├── combo_cleaner.js  # cleans up stale/invalid combo data
│   │   │   ├── tab_navigator.js  # navigates between garage tabs (incl. COMBOS)
│   │   │   ├── navigation_helpers.js  # smart DOM waiting (MutationObserver-based)
│   │   │   ├── auto_navigator.js # auto-navigates to combos tab when relevant
│   │   │   ├── scanners/         # base_item, augment, protection, paint — READ only
│   │   │   ├── equippers/        # base_item, augment, protection — WRITE only
│   │   │   └── randomizer/       # randomizer, random_from_saved, random_full, item_list_scanner
│   │   └── ui/
│   │       ├── menu_injector.js  # injects the "COMBOS" tab into the garage menu
│   │       ├── view_renderer.js  # renders the combo list view, binds events
│   │       ├── combo_card_renderer.js   # combo cards with item previews
│   │       ├── combo_drag_handler.js    # drag-and-drop reordering
│   │       ├── delete_combo_modal.js/.css
│   │       ├── lobby_button_injector.js # quick-access button in the lobby
│   │       ├── lobby_shortcut_handler.js# keyboard shortcut (C key) in lobby
│   │       ├── lobby_button.css
│   │       ├── randomizer_settings.js/.css  # randomizer settings drawer
│   │       └── import_export.js/.css        # import/export combos
│   └── translator/
│       ├── isolated/             # [ISOLATED world] the only chrome.* access
│       │   ├── bridge.js         # storage sync + translate relay to the SW
│       │   └── detect.js         # parses the game bundle -> discovers HUD names
│       ├── main/                 # [MAIN world] shares the page window
│       │   ├── settings.js       # __CT.settings (subscribe/get/set)
│       │   ├── skiplist.js       # __CT.skip — no-translate universal slang
│       │   ├── translate.js      # __CT.translate — request over the bridge, cache, timeout
│       │   ├── chat.js           # THE CORE: capture, intercept, rebuild, display
│       │   ├── gamesettings.js/.css  # injects controls into the game's Settings screen
│       │   └── toggle.js         # in-battle toggle button (inlined icon) + Alt+T
│       └── assets/flags/*.svg    # language flags (web_accessible_resources)
├── assets/
│   ├── icons/                    # extension icons (16/48/128) + the source art
│   └── translate-icon.svg        # source of the translator button glyph
└── HTML-examples/                # real game HTML & CSS samples (see Rule 1)
```

## Critical Rules

### 1. Never Guess Game HTML or CSS

The extension manipulates Tanki Online's live DOM and hooks its live code.
**When developing a feature that requires knowledge of the game's current HTML
structure and it's not clear from the existing code how to do it — ask the
developer for the relevant HTML snippet.** Do not guess selectors or HTML
structure.

The same applies to styling: the extension is designed to look **native and
seamless** within the game — not like an obvious third-party addition. **When a
feature needs to visually match the game's look and feel, and the existing code
doesn't already show how that element is styled — ask the developer for the exact
CSS from the game**, including hover effects, transitions, colors, fonts, and any
other visual details. Never guess how game elements are styled.

**Reference: `HTML-examples/`** — real HTML and CSS samples captured from the
game's UI, organized by category (turrets, hulls, augments, settings, …). Check
the relevant folder there first before asking the developer.

**Important: game CSS classes are auto-generated** — the game regenerates its CSS
class names on each build (e.g. `ksc-13574`). They change frequently and **must
never be used directly in extension code**. Create `cme_`-prefixed classes that
replicate the game's exact styling instead. *Semantic* game classes (e.g.
`GameSettingsStyle-gameSettingsBlock`) are stable and may be used as anchors.

### 2. Keep Code Modular and Clear

- Each file has a single, well-defined responsibility.
- Scanners only read; equippers only write; navigators only move.
- UI modules handle rendering and events; core modules handle logic.
- A new feature = a new folder under `features/`. Only genuinely cross-feature
  code goes in `shared/` — do not "share" something speculatively (this is why
  `utils.js` and `constants.js` are still combos-only: nothing else uses them).
- Nothing in `shared/` may *require* a feature. One soft spot to be aware of:
  `drawer.js` reads its close-button label from `TankiQoL.LanguageManager` (a
  combos module) and falls back to `"Close"` when it's absent. That's safe today
  because the drawer is only loaded in the combos block, but if a future feature
  needs the drawer, pass the label in as an option rather than deepening that
  dependency.

### 3. Hebrew Comments

Add short, descriptive comments **in Hebrew** before code sections explaining
what they do. (The translator's files were written in English as a separate
project and are being converted opportunistically — new code in them should be
Hebrew.)

### 4. File Header Convention

Every file must start with its own path, then a one-line description:
```javascript
// features/combos/core/scanners/paint_scanner.js

// סורק את הצבע/סקין המורכב כרגע על הטנק
```
For files that run in a specific JS world, note it on the path line:
```javascript
// features/translator/main/chat.js  [MAIN world]
```

### 5. No External Libraries

This project intentionally uses **vanilla JavaScript only**. Do not introduce any
external frameworks, libraries, or build tools.

### 6. Load Order in manifest.json is Sacred

Scripts load in the exact order listed in `manifest.json`. Dependencies must load
before the modules that use them. Within the combos block the order is:

1. `shared/components/` — no dependencies
2. `features/combos/lib/` (constants, utils, language) — no dependencies
3. `features/combos/core/` (cleaner, navigator, scanners, equippers, saver,
   loader, helpers, randomizer) — depend on lib
4. `features/combos/ui/` (injectors, renderers, handlers) — depend on core + lib
5. `features/combos/main.js` — always last, orchestrates everything

When adding a file, insert it in the correct position AND add it to
`manifest.json`. A file that isn't in the manifest simply never loads.

### 7. Keep CLAUDE.md Up to Date

When changing the project structure (adding, removing, or renaming
files/folders), **update the structure tree and any other affected section
here**.

### 8. Never Ship Internal Docs

`CLAUDE.md`, `docs/`, `HTML-examples/`, and `build/` must **never** go into the
store zip — they contain the reverse-engineering trail and frank risk
discussions, and anything in the package is readable by reviewers and by anyone
who unpacks the extension. See **`docs/PACKAGING.md`**, which is the single
source of truth for what ships; `build/make-zip.ps1` implements it.

## Manifest layout (4 content-script blocks)

JSON has no comments, so the reasoning lives here. Do not merge these blocks —
each exists for a specific reason.

| # | Contents | `run_at` | World | Why separate |
|---|---|---|---|---|
| 0 | **all CSS** | `document_start` | n/a | CSS is not world-scoped, so one block serves both features. Early injection avoids any flash of unstyled injected UI. Array order = cascade order. |
| 1 | translator `isolated/` | `document_start` | ISOLATED | The only place with `chrome.*`. Must start early so bundle discovery finishes before the user enters a battle. |
| 2 | translator `main/` | `document_start` | MAIN | Needs the page's own `window` to install the `Object.prototype` trap that captures the chat HUD. Must be `document_start` — the HUD is built later, but the trap has to be armed first. |
| 3 | combos | `document_idle` | ISOLATED (default) | Pure DOM work that only makes sense once the page exists. Its internal order is the sacred dependency chain (Rule 6). |

`shared/components/switch.js` and `select.js` appear in **both** block 2 and
block 3. That is not a mistake: JS worlds do not share a `window`, so each world
needs its own copy of the component code (see "Namespaces" below).

## Architecture

### Two JS worlds, and why

Chrome content scripts run in an ISOLATED JS world by default. That is fine for
DOM work (combos), but the translator has to install a hook on the page's own
`Object.prototype`, which only works in the page's MAIN world. And in MV3 a
content-script `fetch` is subject to the page's CORS policy, so the translation
call can't live in a content script at all. Hence three execution contexts:

- **ISOLATED world**: combos (everything), translator `bridge.js` + `detect.js`.
  Has `chrome.storage` / `chrome.runtime`. No access to the page's JS.
- **MAIN world**: translator `main/*`. Shares the page `window`, installs the
  prototype hooks, owns the canvas takeover + in-game UI. No `chrome.*` access.
- **Service worker** (`background.js`): the only context allowed to read
  cross-origin translation responses (via `host_permissions`). Does the fetch.

### Namespaces

Content scripts can't use ES modules, so modules share namespace objects on
`window`. Because each world has its own `window`, the same name can exist twice
without conflict.

| Namespace | World(s) | Holds |
|---|---|---|
| `window.TankiQoL` | ISOLATED (combos) + MAIN (translator) | The **shared components** (`TankiQoL.Switch`, `.Select`, `.Drawer`), and in ISOLATED also every combos module (`TankiQoL.DOM`, `.MenuInjector`, `.ViewRenderer`, `.ComboSaver`, …) |
| `window.__CT` | MAIN | Translator internals: `__CT.settings`, `.translate`, `.skip`, `.rebuild()` |
| `__CT_*` globals | MAIN | Translator console debug helpers (see "Debugging") |

Every module follows this pattern:
```javascript
(function () {
    'use strict';
    window.TankiQoL = window.TankiQoL || {};

    // ... private functions ...

    window.TankiQoL.ModuleName = {
        publicMethod1,
        publicMethod2
    };
})();
```
All modules are singletons; access others via `window.TankiQoL.OtherModule`.

### Storage layout

**Convention: one storage key per feature.** `chrome.storage` is a single flat
namespace shared by the whole extension, so a feature must not scatter loose
generic keys like `enabled` into it. New features: use one key holding an object.

| Area | Key | Owner | Contents |
|---|---|---|---|
| `local` | `savedCombos` | combos | the combo array (see below) |
| `local` | `equipProtectionsOnLoad` | combos | bool — include protections when equipping |
| `local` | `autoOpenCombosOnGarageEntry` | combos | bool |
| `local` | `randomizerSettings` | combos | randomizer options object |
| `local` | `hudConstants:<bundle url>` | translator | cached per-build discovery result (`detect.js`) |
| `sync` | `translator` | translator | `{ enabled, showOriginal, targetLang }` |

Combos data is larger and device-specific, so it uses `local`. Translator
preferences are tiny and worth syncing across the user's devices, so they use
`sync`. The keys are in different areas *and* differently named — no collision.

`savedCombos` entry shape:
```javascript
{
    id: Number,              // timestamp-based unique ID
    name: String,            // user-editable combo name
    date: String,            // locale date string
    order: Number,           // display order (0 = top)
    language: String,        // language code at save time
    data: {
        turret:        { name, image },
        turretAugment: { name, image },
        hull:          { name, image },
        hullAugment:   { name, image },
        grenade:       { name, image },
        drone:         { name, image },
        protection:    [{ name, image }, ...]  // 4 slots
    },
    removedItems: {}         // optional: items to skip during equip
}
```

### CSS class prefix

All extension CSS classes use the **`cme_`** prefix to avoid collisions with
Tanki's own classes (and with other extensions — users do run several). The
prefix predates the rename and now simply means "ours"; it is used
project-wide, in both features. Always use it for new classes.

### Native Look & Feel

New UI must visually match the game — same colors, fonts, hover effects,
transitions, and layout patterns. When existing code doesn't cover the styling of
a new element, ask the developer for the game's exact CSS before implementing
(Rule 1).

## Feature: Combos

### Centralized DOM selectors

All selectors for the game's DOM live in `features/combos/lib/constants.js` as
`window.TankiQoL.DOM`. When the game updates its HTML/class names, only that file
changes. **Never hardcode game selectors elsewhere.**

### Smart waiting (not fixed delays)

Use `NavigationHelpers.waitForDOMChange()` (MutationObserver + debounce) instead
of `setTimeout` with fixed delays, so the extension survives varying load times.
Only use short `sleep()` calls (≤50 ms) where game animations need time.

### Language support

`LanguageManager` auto-detects the game language from UI text (11 languages). Use
`LanguageManager.getUIText()`, `getEquipButtonText()`, and `getTabName()` for any
user-facing or game-matching strings. Never hardcode language-specific text.

### Async patterns and error handling

Core operations (save, load, equip) use **async/await**. Chrome storage calls use
the callback API (not promisified) — keep this consistent. Errors use **graceful
degradation**: log a warning and continue. If an item can't be found or equipped,
skip it and move on. Never block the user or show alerts for non-critical errors.

## Feature: Translator

What it does:

| Behaviour | Detail |
|---|---|
| Foreign message shown instantly | the original text is drawn immediately, so chat never lags |
| Braille spinner while translating | `⠋⠙⠹…` appended until the translation returns |
| Swap to translation | `[<SRC>] » <translation>` in the target language |
| No prefix when source == target | nothing to translate |
| Universal slang verbatim | `gg`, `ez`, `noob`, `hahaha`, … never hit the API (`skiplist.js`) |
| Toggle original↔translation | in-game button (next to the chat alert button) + Alt+T, persisted |
| Target language | native-styled dropdown injected into the game's Settings screen (default English) |

There is **no browser popup**: the toolbar icon only carries the icon, and
everything is configured in-game.

| Surface | Controls | File |
|---|---|---|
| In-battle toggle button + **Alt+T** | `showOriginal` | `main/toggle.js` |
| In-game settings panel (native-styled rows in the game's Settings screen) | `enabled`, `targetLang` | `main/gamesettings.js` |
| Console helpers | everything (debug) | `main/chat.js` |

Storage is the single source of truth. The button, Alt+T and the settings panel
all `set()` → storage → `onChanged` echoes back → everyone updates. No local
mutation, so nothing ever disagrees.

### Bridge protocol (every message tagged `__ct`, with a direction)

| Dir | action | payload | meaning |
|---|---|---|---|
| `i2m` | `settings` | `{enabled, showOriginal, targetLang}` | initial + on every storage change |
| `i2m` | `config` | `{flagsBase}` | paths MAIN can't resolve itself (it has no `chrome.*`) |
| `i2m` | `hudConstants` | discovered name-set | from `detect.js` once the bundle is parsed (or cached) |
| `i2m` | `translateResult` | `{id, ok, text, lang, error}` | reply to a translate request |
| `m2i` | `ready` | — | MAIN says its listeners are up; ISOLATED resends settings + config, detect resends hudConstants |
| `m2i` | `set` | partial settings | MAIN asks ISOLATED to write storage |
| `m2i` | `translate` | `{id, text, targetLang}` | MAIN asks for a translation |

The `ready` handshake covers the race where the ISOLATED scripts broadcast before
MAIN's `message` listeners exist. Same design as `../../Shaft-Extension-V2`.

### Translation flow

```
chat.js (MAIN)  --postMessage 'translate'-->  bridge.js (ISOLATED)
   ^                                              |
   |                                     chrome.runtime.sendMessage
   |                                              v
translate.js resolves the Promise        background.js (service worker)
   ^                                              |  fetch() with host_permissions
   |  <--postMessage 'translateResult'--          v
   +------------------------------------  Google (unofficial) -> Lingva fallback
```

- **`translate.js`** (MAIN) owns the per-session cache (keyed by
  `targetLang + '\n' + text`) and a hard request timeout, so a hung backend can
  never leave a message stuck on its spinner.
- **`background.js`** runs the backend chain: unofficial Google
  (`translate_a/single`, which reports the detected source language — that's why
  it's first) → Lingva instances (translation only, no source language).

The free chain is a **permanent** choice; there is no plan to move to a paid API.
Honest risk: the unofficial Google endpoint is not a supported API and could
change or rate-limit. If it dies, Lingva takes over automatically (the `[SRC]`
prefix becomes `[文]` because Lingva doesn't report the source language). To
add/replace a Lingva instance, edit `LINGVA_INSTANCES` in `background.js` **and**
add the host to `host_permissions` in `manifest.json`.

### MAIN-world API

```js
__CT.settings.get()                // {enabled, showOriginal, targetLang, config, ready}
__CT.settings.subscribe(fn)        // fn(state) now + on every change; returns unsubscribe
__CT.settings.set(partial)         // request a change (writes storage via the bridge)

__CT.translate.request(text, lang) // -> Promise<{text, lang}>; cached
__CT.translate.cache               // the Map (debug)

__CT.skip.shouldSkip(text)         // true if every word is universal slang
__CT.skip.words                    // the live Set (add words at runtime)

__CT.rebuild()                     // force a clear+replay rebuild (also __CT_REBUILD)

TankiQoL.Switch.create({label, checked, onChange})           // shared component
TankiQoL.Select.create({label, options, selected, onChange})  // shared component
```

### How the canvas hook works (distilled)

The battle chat is drawn to the WebGL canvas as positioned glyph meshes. **There
is no "edit message" API.** To change displayed text we take over: intercept the
HUD's per-channel render methods, and to apply an async translation we
**rebuild** — clear the visible lines and replay the last ≤8 messages through the
game's own render methods with the text we want.

1. **Capture** (`chat.js` `armTrap`): `Object.defineProperty(Object.prototype,
   <offset field>, {set})`. The HUD ctor writes `this.<offset> = new …`, hitting
   our setter with `this` = the live HUD. Validated structurally (`looksLikeHud`:
   the prototype must have all render methods + the evict method) so a wrong
   field never misfires. Re-captures every new HUD (each battle builds a fresh
   one).
2. **Intercept** (`wrapRenderMethod`): wrap the render methods on the
   **instance** (zero collateral). Each call: find the text (the longest
   top-level own string on the arg — structural, name-independent), record it,
   set the display text (original + spinner), fire a translation. On translation
   done → debounced rebuild.
3. **Rebuild** (`rebuildNow`): evict every visible line (exactly as the engine
   does when messages scroll off), then replay the last ≤8 records through the
   **prototype** methods (bypassing our instance wrapper → no re-record), setting
   each arg's text to the current display text.

#### Two bugs this code is deliberately shaped around (do not regress)

- **Manual offset reset = duplicate/ghost lines.** `rebuildNow` must NOT touch
  the ring pointer or vertical offset. The offset grows monotonically (the chat
  is a view that follows the bottom); zeroing it desyncs the meshes once a
  translated line wraps to a different line count. Only evict + replay; let the
  engine manage its counters.
- **Resize re-emits everything = duplicates.** On resize/fullscreen the engine
  blanks the chat and re-emits the last ≤max stored messages through the same
  render methods with fresh arg objects. The dedup: a render call arriving while
  the visible-line count is 0 although we still hold records means the canvas was
  just blanked, so what follows is a replay — we adopt the fresh args into
  existing records (matched by method + original text, in order) instead of
  re-recording. Time-bounded (1.5 s) so a stale queue can't swallow a real new
  message. `replayAdopts` counts it.

The full reverse-engineering trail — the canvas glyph-mesh render model, the
complete anchor derivation, every dead end — lives in **`../../research/CLAUDE.md`**
(sections "Battle chat translator" and "Canvas render model").

### Cross-build self-location (`detect.js`)

Every minified name in the game bundle rotates per build. `detect.js` fetches the
live bundle (same-origin, from the browser cache) and regexes out the HUD
name-set. Anchors (all in `discover()`, documented at the top of the file):

- **append fn** = the `NAME(this,": ",` call (the "name: text" separator).
- **HUD class + proto-set helper** (`s$`/`_q`/`sk`/`v$` — can contain `$`, so
  `[\w$]+`) = a single-arg render method body reaching `<appendFn>(this,": ",`.
- **finalize free-fn tail** (resets per-line x, advances y by 23, bumps count &
  write-pointer) → offset field + its two sub-fields + count + ptr + finalize fn.
- **evict** = `<helper>(<class>).<m>=function(){if(this.<count><1)return`, count
  matching finalize's (sanity check).
- **render methods** = single-arg methods on the class calling BOTH the append
  and finalize fns (the 2-arg resize method is excluded by the arity filter).

The trap field is the **offset object** (the ctor writes `this.<offset> = new …`).
`chat.js` seeds the latest-known build so it works during the discovery fetch;
discovery overrides it. The result is cached in `chrome.storage.local` keyed by
bundle URL (which contains the build hash, so a stale cache can't happen).
**Verified extraction on 7 bundles:**

| build | class | append | finalize | evict | offset | count | ptr |
|---|---|---|---|---|---|---|---|
| 009aa16b (seed) | `MAn` | `kAn` | `yAn` | `q1fr` | `k1fr_1` | `i1fr_1` | `j1fr_1` |
| c0feea5a | `OAn` | `kAn` | `yAn` | `m1fo` | `g1fo_1` | `e1fo_1` | `f1fo_1` |
| bcae4cb9 | `yRn` | `iRn` | `nRn` | `i1fo` | `c1fo_1` | `a1fo_1` | `b1fo_1` |
| c4428a58 | `zMn` | `cMn` | `aMn` | `d1ff` | `x1fe_1` | `v1fe_1` | `w1fe_1` |
| e76a162c | `zMn` | `cMn` | `aMn` | `w1fd` | `q1fd_1` | `o1fd_1` | `p1fd_1` |
| a81c6ab2 | `IMn` | `wMn` | `dMn` | `c1ff` | `w1fe_1` | `u1fe_1` | `v1fe_1` |
| 41560f11 | `EMn` | `vMn` | `lMn` | `n1fz` | `h1fz_1` | `f1fz_1` | `g1fz_1` |

### In-game settings panel (`gamesettings.js`)

Anchored on `[class*="GameSettingsStyle-gameSettingsBlock"]` (a **semantic** game
class, stable across builds — never the rotating `ksc-*` hashes) and appended as
the block's last child, re-injected via a MutationObserver when the settings
screen mounts. The block ships with a fixed height and is already full, so the
code overrides its height inline and pins `flex-shrink: 0` — see the long comment
in the file; that comment is load-bearing, don't delete it.

> **Verify-live caveat:** if the game renders more than one
> `GameSettingsStyle-gameSettingsBlock` at once, we inject into the first match.
> If it ever lands on the wrong tab, add a discriminator.

**Adding a language:** add it to `LANGS` in `gamesettings.js` (the single list)
and drop a matching flag SVG at `features/translator/assets/flags/<value>.svg`
(filename = the lang code, mapped to a country flag: `en`→gb, `pt`→br, `uk`→ua,
`ar`→sa, `he`→il, …; source: flag-icons, MIT).

### Toggle-button graphic + extension icons

`assets/translate-icon.svg` is a Material "translate" glyph on dark rounded
chrome. The toggle button's copy of it is **inlined in `toggle.js`** (the `ICON`
constant), which uses it for the ON state and derives OFF by recoloring the glyph
and appending a red slash. It was previously loaded over the bridge, but that
fetch could silently fail and leave an invisible button — inlining guarantees it
renders. **Keep the inline copy in sync with the SVG file.**

The extension icons are `assets/icons/icon{16,48,128}.png` (Chrome can't use SVG
for icons). To regenerate PNGs from an SVG on this machine (no cairosvg/rsvg/
ImageMagick installed; Chrome + Python-Pillow are):
```
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
  --disable-gpu --force-device-scale-factor=1 --default-background-color=00000000 \
  --screenshot=icon128.png --window-size=128,128 "file:///<abs>/<source>.svg"
# then downscale 128 -> 48,16 with Pillow (Image.LANCZOS)
```

### Known limitations / caveats

- **Slang stays verbatim regardless of target language.** A Russian-speaking user
  with `targetLang: 'ru'` still sees `gg`/`noob` in English — they're universal
  gaming terms. Adjust via `__CT_SKIP_WORDS` if a market complains.
- **Enabling mid-battle** re-translates only the currently visible messages, not
  scrolled-off history. Changing the target language re-translates the visible
  ones. Both by design (`refreshVisibleTranslations`).
- **Own messages are translated too** (English/target ones collapse to a no-op
  via the source==target / equality check). Hard-skipping own messages needs the
  local user's name/uid, which this extension doesn't capture.
- **Canvas glyphs**: `»` and `[文]` render from the game font atlas; confirm they
  aren't missing-boxes on a new build.

## Debugging

Combos runs in ISOLATED, so its logs appear in the page console as
`[ComboManager]` lines. The translator's hook lives in the page world, so check
it from the **game tab's** console (not the extension's DevTools):

```js
// combos
window.TankiQoL.DEBUG = true
chrome.storage.local.get(['savedCombos'], r => console.log(r.savedCombos))  // ISOLATED only

// translator
__CT_STATE()          // settings + discovered names + debug counters + capture status
__CT_DEBUG            // {discovered, captured, intercepts, translations, rebuilds,
                      //  replayAdopts, skipped, lastError, names, ...}
__CT_MSGS             // recorded messages (text, translation, lang, state, ...)
__CT_HUD              // the captured HUD instance (null until you enter a battle)
__CT_TOGGLE()         // flip all original<->translation
__CT_TOGGLE_LAST()    // flip the last translated message
__CT_SKIP_WORDS.add('foo')   // extend the no-translate slang set live
__CT_NOTR('some text')       // would this text be skipped?
```

- `__CT_DEBUG.discovered === false` after a few seconds → `detect.js` couldn't
  parse the bundle (see recovery below). The seed still covers the seed build.
- `__CT_HUD === null` after entering a battle → the trap never validated: the
  offset field name is wrong (detection bug or an architectural change).
- Translations missing but `intercepts` climbing → check `lastError`; likely the
  service worker fetch failed (all backends down / host_permissions issue).

## When a Tanki build breaks the translator (recovery procedure)

Symptom: after a Tanki update, chat stops translating.

1. Page console: `__CT_STATE()`. If `discovered:false`, detection failed.
2. Get the new bundle: `copy(Array.from(document.scripts).find(s =>
   /main\.[a-f0-9]+\.js/.test(s.src)).src)`, download it into
   `../../research/` as `main.<hash>.js`.
3. Run `discover()` from `detect.js` against the new bundle offline (extract the
   function into a scratch script and feed it the file contents). It prints the
   extracted name-set, or `null` if the regexes no longer match.
4. If it returns a set → detection logic is fine; the extension will self-locate
   live.
5. If it returns `null` → Tanki changed the chat HUD shape. Open the new bundle,
   find the chat render code (grep the `": "` separator, the `+23` line-advance,
   the `if(this.<count><1)return` evict), and update the anchors in `discover()`.
   Re-verify it extracts cleanly on the new build AND still on the old ones (the
   bundles in `../../research/` are the regression set). Then refresh the seed in
   `chat.js` and the table above.
6. If detection is fine but capture fails (`__CT_HUD` stays null in battle), the
   trap field (offset) is wrong — re-derive it from the ctor `this.<offset> =
   new …` and confirm `looksLikeHud` still matches.

The deep manual method (how the anchors were originally derived, the canvas model,
dead ends) is in `../../research/CLAUDE.md`.

If the **combos** feature breaks after a game update, it's almost always a
selector: update `features/combos/lib/constants.js`.

## Chrome Web Store notes

The extension is published and has 500+ users, so store hygiene matters:

- It **injects code into tankionline.com and reshapes the game's chat rendering**.
  That is the kind of "modifies a third-party site" behaviour CWS review and
  Tanki's ToS can object to. Be deliberate about listing wording.
- The translator **sends chat text to a third-party translation service**, so the
  dashboard's Privacy practices tab must declare *website content* and *personal
  communications*, and a hosted privacy-policy URL is **mandatory**. All the
  paste-ready texts are in `docs/STORE.md`; the policy itself is `docs/PRIVACY.md`.
- Adding the translation hosts to `host_permissions` is a privilege increase, so
  **Chrome disables the extension for every existing user until they re-approve
  it** (a badge on the toolbar puzzle icon, then "Accept permissions"). This was a
  deliberate, accepted trade-off — don't "fix" it by making the hosts optional
  without asking the developer.
- Bump `version` in `manifest.json` for every upload; CWS rejects re-uploads of
  the same version.

## Testing

There are no automated tests. To test changes:

1. Go to `chrome://extensions/` and enable Developer Mode.
2. Click "Load unpacked" and select this directory.
3. Open [Tanki Online](https://tankionline.com) and sign in.
4. **Combos**: enter the garage, check the COMBOS tab appears, save a combo, equip
   it, reorder by drag, delete, randomizer, import/export, the `C` shortcut in the
   lobby.
5. **Translator**: enter a battle; foreign chat should show original → spinner →
   `[SRC] » translation`. Check the toggle button next to the chat alert button
   and Alt+T. Open the game's Settings screen and confirm the injected toggle +
   language dropdown are there and styled natively. Resize the window / toggle
   fullscreen and confirm no duplicate chat lines.
6. After code changes, click the refresh icon on the extension card and reload the
   game tab.
