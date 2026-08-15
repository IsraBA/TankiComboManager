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
│   ├── PRIVACY.md                # the public privacy policy — served from GitHub (public repo);
│   │                             #   its URL is the one in the CWS listing, so edits here go live
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
│   │   ├── isolated/             # [ISOLATED world] the link to the MAIN-world game hook
│   │   │   ├── detect.js         # parses the game bundle -> discovers garage-state names
│   │   │   └── bridge.js         # TankiQoL.GarageBridge.readCombo() — relay to MAIN
│   │   ├── main/                 # [MAIN world] shares the page window
│   │   │   └── garage_state.js   # captures the game's garage state; reads the mounted loadout
│   │   ├── lib/
│   │   │   ├── constants.js      # centralized DOM selectors and config values
│   │   │   ├── utils.js          # shared utility functions
│   │   │   └── language_manager.js  # auto-detects game language from UI text
│   │   ├── core/
│   │   │   ├── instant_saver.js  # THE save path: reads the loadout from game state, saves instantly
│   │   │   ├── combo_saver.js    # LEGACY save path (DOM tab-walk) — kept, wired to nothing
│   │   │   ├── instant_loader.js # THE equip path: dispatches the game's own actions
│   │   │   ├── combo_loader.js   # LEGACY equip path (DOM) — kept, used as a per-slot fallback
│   │   │   ├── combo_cleaner.js  # cleans up stale/invalid combo data
│   │   │   ├── combo_migrator.js # backfills ids on old combos, in the background
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
│       │   ├── bidi.js           # __CT.bidi — RTL logical→visual order (the game canvas has no bidi)
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

### 8. Ship Only What Runs

`CLAUDE.md`, `docs/`, `HTML-examples/`, and `build/` must **never** go into the
store zip. The package should contain exactly the files the extension loads and
nothing else: it keeps the upload small, and it keeps what a reviewer inspects
identical to what actually executes. (The repository is public, so this is about
a clean package, not about secrecy — `HTML-examples/` alone is several MB of
development reference that no user ever needs.) See **`docs/PACKAGING.md`**, the
single source of truth for what ships; `build/make-zip.ps1` implements it and
refuses to build if any of it slips in.

## Manifest layout (6 content-script blocks)

JSON has no comments, so the reasoning lives here. Do not merge these blocks —
each exists for a specific reason.

| # | Contents | `run_at` | World | Why separate |
|---|---|---|---|---|
| 0 | **all CSS** | `document_start` | n/a | CSS is not world-scoped, so one block serves both features. Early injection avoids any flash of unstyled injected UI. Array order = cascade order. |
| 1 | translator `isolated/` | `document_start` | ISOLATED | The only place with `chrome.*`. Must start early so bundle discovery finishes before the user enters a battle. |
| 2 | combos `isolated/` | `document_start` | ISOLATED | Same reason, for the garage-state hook: discovery must finish before the user opens the garage. Also defines `TankiQoL.GarageBridge`, which block 5 uses. |
| 3 | combos `main/` | `document_start` | MAIN | Needs the page's own `window` for the `Object.prototype` trap that captures the garage state. Must be `document_start` — the state is built later, but the trap has to be armed first. |
| 4 | translator `main/` | `document_start` | MAIN | Same reason, for the chat HUD. |
| 5 | combos (DOM side) | `document_idle` | ISOLATED (default) | Pure DOM work that only makes sense once the page exists. Its internal order is the sacred dependency chain (Rule 6). |

`shared/components/switch.js` and `select.js` appear in **both** block 4 and
block 5. That is not a mistake: JS worlds do not share a `window`, so each world
needs its own copy of the component code (see "Namespaces" below).

Blocks 2 and 5 are both combos and both ISOLATED, but they are not the same
thing and must not be merged: block 2 is the bridge to the game's internals and
has to be armed at `document_start`, while block 5 is the DOM feature and can't
run until the page exists.

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
| `window.TankiQoL` | ISOLATED (combos) + MAIN (translator) | The **shared components** (`TankiQoL.Switch`, `.Select`, `.Drawer`), and in ISOLATED also every combos module (`TankiQoL.DOM`, `.MenuInjector`, `.ViewRenderer`, `.ComboSaver`, `.GarageBridge`, …) |
| `window.__CT` | MAIN | Translator internals: `__CT.settings`, `.translate`, `.skip`, `.rebuild()` |
| `window.__CMB` | MAIN | Combos game hook: `__CMB.read()`, `.log()`, `.names()`, `.state()`, `.debug` |
| `__CT_*` / `__CMB_*` globals | MAIN | Console debug helpers (see "Debugging") |

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

`savedCombos` entry shape — **two generations coexist**, every consumer must
tolerate missing keys (they all do today):

```javascript
{
    id: Number,              // timestamp-based unique ID
    name: String,            // user-editable combo name
    date: String,            // locale date string
    order: Number,           // display order (0 = top)
    language: String,        // language code at save time
    data: { ... },           // see below
    removedItems: {}         // optional: items to skip during equip
}
```

Gen-2 `data` (what `instant_saver.js` writes since the state-read save):

```javascript
data: {
    turret:         { id, baseItemId, name, image, mk?, lvl? },
    turretAugment:  { id, baseItemId, name, image },
    turretSkin:     { id, name, image },   // decorative — not rendered/equipped yet
    hull:           { id, baseItemId, name, image, mk?, lvl? },
    hullAugment:    { id, baseItemId, name, image },
    hullSkin:       { id, name, image },   // decorative — not rendered/equipped yet
    grenade:        { id, baseItemId, name, image, mk?, lvl? },
    drone:          { id, baseItemId, name, image, lvl? },
    paint:          { id, baseItemId, name, image },   // decorative — not rendered/equipped yet
    protection:     [{ id, baseItemId, name, image, lvl? } | null, ×4]  // POSITIONAL by mountIndex
}
```

- **`baseItemId` is the key equipping works from.** Each Mk is a separate item
  with its own `id`, and the user owns *all* of them — so a combo saved at Mk5
  must not equip Mk5 after they upgrade to Mk6. Equipping resolves
  `baseItemId → the highest owned Mk at that moment`, which is exactly what the
  game itself does: it offers no Mk choice, it always equips your top grade.
- **`id`** is the exact item that was mounted when the combo was saved — a
  convenient snapshot for logs, deliberately *not* used to equip, precisely
  because it would pin an outdated Mk.
- **The exception is augments**, where it is the other way round: an augment's
  `baseItemId` points at the turret/hull it belongs to, so it is not unique (one
  turret has many possible augments). There, `id` is the key.
- The game itself always takes a concrete item object, so a specific `id` is
  always what finally goes out — it is just resolved from live state at equip
  time rather than read from storage.
- **`name` + `image` are a display snapshot**: what the combo cards render, and
  what keeps the legacy DOM equipper able to equip gen-2 combos (its matching is
  name-based and case-insensitive).
- **Protection equality is name-first** (`areProtectionsEqual`): gen-2 images
  are CDN previews that all end in `image.svg`, while the DOM scan stores
  uniquely-named icon files — the two are never comparable by image. Comparing
  images first is exactly the bug that made gen-2 combos skip their protections.
  `extractIconFileName` also prefixes generic `image.svg` names with the unique
  CDN path segment so image comparison stays discriminating where it's still
  used.
- Gen-1 `data` (DOM-scanned): same slots minus the decorative ones and ids —
  `{ name, image }` per item, protections compacted (no positional nulls).
  Gen-1 entries stay valid forever, and `core/combo_migrator.js` backfills their
  ids in the background (see below).
- **The turret's shot effect is deliberately not a slot.** It is readable (the
  state reader still exposes `shotSkin` per item) but a product decision keeps it
  out of combos entirely — not saved, not rendered, not equipped. Combos saved
  before that decision may still carry a `turretShotFx` key; it is simply
  ignored, which is why nothing migrates it away.

### Backfilling ids on old combos (`core/combo_migrator.js`)

Runs on every combo-list load, **after** rendering and without blocking it — the
migration changes nothing that is displayed. It asks the MAIN world for a flat
index of everything the user owns (`GarageBridge.readIndex()`) and resolves
`name → id` for any slot that lacks one.

Deliberately **not** a one-shot flag in storage: import/export means a gen-1
combo can arrive at any time, and a flag would already be set. An idempotent scan
covers that for free and costs nothing — it is an in-memory check that returns
immediately once everything has ids, touching neither the bridge nor storage.

Three rules keep it from doing damage:

- **Nothing is deleted.** `id`/`baseItemId` are added *beside* the existing
  `name`/`image`. An unresolved slot is left exactly as it was and keeps working
  through the DOM path.
- **Only owned items are matched** — which is also what resolves the Mk
  ambiguity, since the user owns exactly one Mk of any item, so a Mk-stripped
  name has a single answer.
- **Ambiguity is refused.** Two candidates in the same category → no guess.

Known limitation: names were saved in whatever language the user played in. If
the game language changed since, matching fails and there is nothing to translate
from — that combo stays on the DOM path, exactly as it is today.

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

### Combo card: interaction model

The card has **two modes**, and almost every interaction rule follows from that:

| | normal mode | edit mode (`.cme_editing`) |
|---|---|---|
| click anywhere on the card | equips the combo | nothing (clicks are for removal) |
| click an item | equips (the click bubbles up) | removes that item |
| item hover | nothing | red tint + × icon |
| pencil button | enters edit mode | (shows a ✓) leaves edit mode |

- **The top row is not part of the card's click surface** — the name, the pencil
  and the delete button live there, and it is also the one area you cannot drag
  from. Everything below it both equips on click and drags to reorder.
- **Click vs drag** is decided by mouse travel between `mousedown` and `click`
  (5 px), not by drag events — browsers disagree about whether a `click` fires
  after a drag, so the geometric test is the reliable one.
- There is **no EQUIP button**; the paint square took its place in row 4 and is
  always visible (the button only appeared on hover).
- **Skins are display-only**: `turretSkin` / `hullSkin` replace the turret/hull
  *image* on the card. They are not separately removable — removing the turret
  takes its whole area with it (skin and augment), which is why
  `removeItemFromCombo` cascades `turret → turretAugment`.
- **Edit state lives in `ComboCardRenderer._editingCombos`** (a Set of combo
  ids), not on the card element: removing an item writes to storage and
  re-renders the whole list, which throws the element away. Keeping the flag
  outside is what stops edit mode from closing after every single removal.
- The pencil/check icons are **inline SVGs copied in style from the game's own
  `iconDelete.svg`**: 24×24, sharp filled white shapes (no strokes), shown at
  25% opacity and 100% on hover — the game ships that as two files, we use one
  SVG plus a CSS opacity swap. The opacity sits on the `<svg>`, not the button,
  because the button already animates its own opacity for the card-hover reveal
  and the two would multiply.
- `ComboCleaner.isComboEmpty` counts paint as real content (a combo that only
  changes your paint is legitimate) but **not** skins, since a combo with only
  skins left would equip nothing.

### Language support

`LanguageManager` auto-detects the game language from UI text (11 languages). Use
`LanguageManager.getUIText()`, `getEquipButtonText()`, and `getTabName()` for any
user-facing or game-matching strings. Never hardcode language-specific text.

`getUIText` falls back **English → the key itself**, so a half-added key shows
readable text instead of leaking a variable name. It is a safety net, not a
licence to skip translations: add every new key to all 11 languages.

### Async patterns and error handling

Core operations (save, load, equip) use **async/await**. Chrome storage calls use
the callback API (not promisified) — keep this consistent. Errors use **graceful
degradation**: log a warning and continue. If an item can't be found or equipped,
skip it and move on. Never block the user or show alerts for non-critical errors.

### Reading and writing the game's own state (ROADMAP feature 2 — DONE)

The equippers/scanners above work by **simulating the user**: navigate a tab,
find the item by its displayed name, click it, click Equip, wait. That is why
they are slow and visibly "walk" the UI. Since Aug 2026 they are the fallback
only — both saving and equipping run against the game's own model:

- **Save**: `core/instant_saver.js` → `GarageBridge.readCombo()` → storage. No
  tab navigation; the user never leaves the combos view. Deliberately NO
  fallback (user's call): if the state isn't captured, the save button warns in
  console and saves nothing.
- **Equip**: `core/instant_loader.js` → `GarageBridge.applyCombo()` →
  `main/garage_state.js` dispatches the game's own Redux actions. Zero flicker,
  server-persisted. Also used by random-from-saved.

How equipping is split: `instant_loader.js` (ISOLATED) decides **what** to
apply — it strips what the user removed on the card and honours
`equipProtectionsOnLoad` — and `garage_state.js` (MAIN) decides **how**, because
resolving a saved slot to a real item depends on live state (owned? which Mk?
already mounted?) which only exists there. One message out, a per-slot report
back. Order: base items → decorative → protections → augments, with a short
randomised pause between actions. Two distinct outcomes matter:

| result | meaning | what happens |
|---|---|---|
| `failed` | the native dispatch did not work | that **one slot** falls back to the DOM equipper |
| `unavailable` | this account does not own the item | skipped and reported — no fallback, since no path could equip it |

The short version of the write path: every garage change is a Redux action, and
those actions come in two layers — a public *thunk* the UI dispatches, and a
*low-level* action the reducer plus a server-sending subscriber consume. We build
and dispatch the low-level ones (always via `new proto.constructor(...)`, never
`Object.create` — some actions are thunks whose behaviour is a closure built in
the ctor, and a ctor-less shell dispatches fine and does nothing). Only
subscribed actions are locatable at runtime by class name; anything the thunk
does on top (freeing a protection slot, loading an item's device catalog) we do
ourselves. **The full write-path story — the action taxonomy, every discovery
anchor, and the ownership/lazy-loading traps — is in `../../research/CLAUDE.md`
under "Two layers of actions", "Augments (Devices)" and "Skins".**

Behaviours worth knowing when touching the equip path:

- Mounting alone does not move the 3D tank model — **the model follows item
  SELECTION**, so every native mount is followed by a select dispatch.
- Protections are compared **as a set** (the four slots are interchangeable);
  the saved slot index is only a placement preference. A reorder-only combo
  dispatches nothing.
- Augment ownership is checked **before** anything is dispatched (the remove
  runs first, so a late failure would strip the current augment). Device
  catalogs load lazily per item; the read path waits for them (capped), and the
  equip path requests a missing catalog itself, since the low-level mount skips
  the load the game's own thunk fires.
- Equipping resolves items by `baseItemId` → highest owned Mk *at equip time*;
  the DOM path can't equip the decorative slots (paint, skins).

How it works:

- The garage is a **Redux-style store**: one `Garage` state object holding
  `mountedItems`, `items`, `devices` and ~26 more fields. Every item in it is a
  `GarageItem` carrying `id`, `name`, `category`, `preview`, `owned`,
  **`mounted`** and **`mountIndex`**. So the current combo is simply every item
  with `mounted === true`, grouped by `category` — the same selection the game's
  own code performs. `mountIndex` is what separates the 4 protection slots.
- Four things are **not** plain fields on the item, and each was a separate
  find. Getting them wrong is easy, so they're spelled out here:

  | What | Where it lives | Trap to avoid |
  |---|---|---|
  | **Mk level** | `modification.modificationIndex`, **0-based** — the garage displays 1-based, so add 1 (verified live) | the same object also has `modificationCount` = *how many Mk levels that item has at all*. It looks like a level but is constant per item type — reading it reports e.g. "Mk7" for everything. |
  | **Micro-upgrade (`LVL-X`)** | `upgradeableParams.currentLevel`, max from a method on the same object (20 for drones, 45 for protections) | — |
  | **Augments** | the game calls them **Devices**: `GarageDevice` objects with `installed` + `baseItemId` | there is no "augment" string in the bundle. Match a device to its item by `baseItemId` (which for an upgraded item lives on `modification`, not on the item). And: **the game remembers one installed augment per turret/hull, mounted or not** — so most `installed:true` devices belong to unmounted items. That's normal, not a join failure. |
  | **Skins + shot effect** | `mountedSkin` / `mountedShotSkin` on the turret/hull are **skin-item IDs**; the skin items themselves are regular `GarageItem`s (categories `SKIN` / `SKINS_SHOT`) resolved via an id index built during the scan. Skin image = `skinPreview` with `preview` as fallback (same choice the game's UI code makes). | the IDs compare as Kotlin Longs — stringify both sides before comparing. |

- **Item images**: `preview` / `skinPreview` are not strings. Each is a resource
  object with a method that builds the CDN URL, so the URL has to be *called*,
  not read.
- `main/garage_state.js` (MAIN world) captures that state with the usual
  `Object.defineProperty(Object.prototype, <field>, {set})` trap, validated
  structurally (the object must carry every known state field). The state is
  recreated on every garage action (immutable store), so the trap stays installed
  and always holds the freshest instance. The trapped field is the **last** one
  the constructor writes, so at trap time the object is fully populated (the
  Scorpion lesson).
- Items are gathered by a **structural scan** of the state graph, collecting every
  object that carries all the `GarageItem` fields. Kotlin collections compile to
  internal classes whose iterator method names rotate per build; matching on the
  item's own shape sidesteps that entirely.

Confirmed live: turret, hull, drone, grenade, all four protections and the paint
read correctly (names, ids, slot order, Mk, LVL, images, and the mounted item's
augment). Grenade's category is **`BAZOOKA`**. The read also covers things the
DOM version never did — paint and turret/hull **skins** — so those can become
combo slots cheaply when the write half lands. It reads the turret's **shot
effect** too, but that one is deliberately not a combo slot (see the gen-2
data-shape notes above).

### Cross-build self-location (`isolated/detect.js`)

Same approach as the translator's detector, but with a better anchor. Kotlin emits
a `toString` for every data class that spells out **the field names as literal
strings** next to their minified names:

```
ld(MB).toString=function(){return"Garage(itemsOnDepot="+bd(this.tpz_1)+", mountedItems="+bd(this.vpz_1)+ …
```

So detection reads a direct `semantic name → minified name` map instead of
inferring it from code shape. Anchors:

- **state class** = the only `toString` starting `"Garage("` that contains
  `mountedItems=`.
- **item class** = the only `toString` starting `"GarageItem("`.
- **trap field** = the **last** field of the state's `toString`. The constructor
  assigns fields in exactly the `toString` order; detection verifies this rather
  than assuming it, and returns `null` if it ever stops holding.
- **`ModificationCC`** (Mk) — a protocol class, so its `toString` uses a
  different shape (`"name = "+this.x`) and needs its own tiny parser.
- **`UpgradableItemParams`** (micro-upgrade) → `currentLevel`. The **max** level
  is behind a method, found via the "am I maxed?" method whose whole body is
  `currentLevel === maxLevel()` — an unambiguous anchor.
- **`GarageDevice`** (augments) → `installed` / `baseItemId` / `previewImage`.
- **image URL method** — found two independent ways that are cross-checked: from
  real call sites (`<preview>.<method>()`) and from the accessor that reflection
  names `"url"`. They agree on every build tested; disagreement sets
  `urlMethodAmbiguous`.
- **the write actions** — the game's Redux actions are data classes too, so
  `dataClass()` reads each one's class name *and* field map straight out of its
  `toString`. `GarageResistanceUnMount`, `GarageApplyResistanceMount`,
  `GarageResistanceMount` and `GarageItemMounted` are all discovered this way.
  The class **name** matters as much as the fields here: the reducer branches on
  `instanceof`, so building an action means finding the real constructor.

Everything after the core four is **optional**: if one of these anchors breaks,
detection still succeeds and only that column goes blank, rather than the whole
feature going inert.

Cached in `chrome.storage.local` keyed by **schema version + bundle URL**
(`garageConstants:v<N>:<url>`). The version exists because of a real bug: adding
new fields to `discover()`'s output while an old-schema result was already cached
meant the cache loaded as-is and **overrode the seed** (which did have the new
fields) — every new column silently read null. **Bump `CACHE_VERSION` in
`detect.js` whenever `discover()`'s output shape changes.** Stale-prefix keys are
cleaned up on startup. `garage_state.js` seeds the latest-known build so it works
during the discovery fetch; discovery overrides it.
**Verified extraction on all 8 bundles in `../../research/`:**

| build | state class | item class | trap field | mountedItems | mounted | mountIndex |
|---|---|---|---|---|---|---|
| 1327298e (seed) | `MB` | `sB` | `vq0_1` | `vpz_1` | `tr3_1` | `ur3_1` |
| 009aa16b | `NB` | `eB` | `oq0_1` | `opz_1` | `lr3_1` | `mr3_1` |
| c0feea5a | `CB` | `JL` | `gpz_1` | `gpy_1` | `dr2_1` | `er2_1` |
| bcae4cb9 | `wB` | `ML` | `lpw_1` | `lpv_1` | `iqz_1` | `jqz_1` |
| c4428a58 | `lB` | `PL` | `lps_1` | `lpr_1` | `iqv_1` | `jqv_1` |
| a81c6ab2 | `cB` | `AL` | `lpr_1` | `lpq_1` | `iqu_1` | `jqu_1` |
| e76a162c | `cB` | `AL` | `upr_1` | `upq_1` | `rqu_1` | `squ_1` |
| 41560f11 | `fB` | `RD` | `qq7_1` | `qq6_1` | `nra_1` | `ora_1` |

The Mk / micro-upgrade / augment / image-URL anchors were verified on the same 8
bundles. The state class has had exactly 29 fields in every build checked, which
is a good sign the shape is stable. The deep research trail is in
`../../research/CLAUDE.md` under "Garage state".

> Re-verify after any change to `discover()`. The scratchpad harness
> (`verify_shipped.js` — session-local, recreate it if gone) extracts the
> **shipped** `discover()` out of `detect.js` and runs it against every bundle in
> `../../research/`, then diffs the result for the current build against the seed
> in `garage_state.js` — so a stale seed or a broken regex fails loudly instead of
> silently degrading in-game. A sibling harness (`test_write_path.js`) loads the
> shipped `garage_state.js` into a `vm` sandbox with a fake store/state and
> asserts which actions each write dispatches — the diff logic is tested there
> without touching the game.

## Feature: Translator

What it does:

| Behaviour | Detail |
|---|---|
| Foreign message shown instantly | the original text is drawn immediately, so chat never lags |
| Braille spinner while translating | `⠋⠙⠹…` appended until the translation returns |
| Swap to translation | `[<SRC>] » <translation>` in the target language |
| No prefix when source == target | nothing to translate |
| Universal slang verbatim | `gg`, `ez`, `noob`, `hahaha`, … never hit the API (`skiplist.js`) |
| RTL displayed correctly | the game's canvas renderer has **no bidi**, so Hebrew/Arabic arrives on screen reversed ("הרוק המ םולש"); every displayed text — originals, translations into RTL target languages, slang, "show original" mode — is converted logical→visual by `bidi.js` before drawing. Purely local, no API call. Gated on the translator's `enabled` toggle (it shares the render-intercept pipeline). |
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

__CT.bidi.toVisual(text)           // logical→visual RTL conversion; identity (===) for non-RTL text
__CT.bidi.hasRtl(text)             // does the text contain RTL characters?

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
- **Multi-line RTL messages read bottom-up.** `bidi.js` converts to visual order
  *before* the game wraps lines at its own width, so when a Hebrew/Arabic message
  wraps, the top line holds the END of the sentence. Each line itself reads
  correctly, and most chat messages are single-line. A true fix would mean
  replicating the engine's glyph-width wrapping — deliberately not done.
- **Arabic renders as isolated letterforms.** The RTL fix corrects the order, but
  the game's font atlas draws one glyph per codepoint with no contextual shaping
  (no ligatures/joining). Readable, not pretty. Hebrew is unaffected.

## Debugging

Combos runs in ISOLATED, so its logs appear in the page console as
`[ComboManager]` lines. The translator's hook lives in the page world, so check
it from the **game tab's** console (not the extension's DevTools):

```js
// combos
window.TankiQoL.DEBUG = true
chrome.storage.local.get(['savedCombos'], r => console.log(r.savedCombos))  // ISOLATED only

// combos — the garage-state hook (MAIN world, page console)
__CMB_READ()          // print the current loadout as read from game state
__CMB_STATE()         // captured?, discovered names, debug counters
__CMB_DIAG()          // garage-entity + action-template diagnostics
__CMB.read()          // the same read, as a plain object
__CMB.state()         // the captured raw game state object (for poking around)

// combos — write probes (bypass the card; useful to isolate a failing slot)
__CMB_TRY_NATIVE(id)          // mount a base item: local + server + 3D preview
__CMB_TRY_LOCAL(id)           // local state only — sends NOTHING out (safe probe)
__CMB_PROTECTIONS()           // the 4 slots + every owned module, with ids
__CMB_TRY_PROTECTIONS([a,b,c,d])  // apply a full 4-slot state (ids or null)
__CMB_AUGMENTS()              // installed + full catalog for mounted turret/hull, with owned flags
__CMB_TRY_AUGMENT(itemId, augId)  // install; null clears
__CMB_DECOR()                 // owned paints + skins, with ids
__CMB_TRY_SKIN(itemId, skinId)    // apply a skin to a turret/hull

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
- `__CMB_STATE().captured === false` after opening the garage → the trap never
  validated. Either detection failed (`debug.discovered === false`, check the
  `[combos] detect:` console warning) or the game restructured its garage state.
- `captured` is true but a slot reads `—` → that category isn't in
  `CATEGORY_TO_SLOT` in `garage_state.js`; the console log lists unmapped mounted
  items precisely so the missing category name is visible.

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

- The extension changes how a third-party page behaves, which reviewers read
  closely. Describe it plainly and accurately: the listing text and the
  permission justifications in `docs/STORE.md` are written to match what the code
  actually does, and they must be updated whenever the code's behaviour changes.
  An accurate description is also the extension's best defence if anyone asks
  what it does.
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
