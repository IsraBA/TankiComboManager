# Architecture

## Three execution contexts, and why

Chrome content scripts run in an **ISOLATED** JS world by default. That is fine
for DOM work, but two things need more:

- Hooking the game's own objects (`Object.prototype` traps, dispatching the
  game's Redux actions) only works in the page's **MAIN** world, which has no
  `chrome.*`.
- In MV3 a content-script `fetch` is still subject to the page's CORS policy, so
  the translation call can't live in a content script at all — it goes to the
  **service worker**, the only context allowed to read cross-origin responses for
  hosts in `host_permissions`.

| Context | Who runs there | Has |
|---|---|---|
| ISOLATED | all of combos (DOM + discovery + bridge), translator `isolated/` | `chrome.storage`, `chrome.runtime`; no access to page JS |
| MAIN | `features/combos/main/garage/*`, `features/translator/main/*` | the page `window`; no `chrome.*` |
| Service worker | `background.js` | `fetch` with `host_permissions` |

The two worlds talk over `window.postMessage`, every message tagged (`__cmb` for
combos, `__ct` for the translator) with a direction (`i2m` / `m2i`) and a
`ready` handshake covering the race where one side broadcasts before the other's
listeners exist.

## Namespaces

Content scripts can't use ES modules, so modules share namespace objects on
`window`. Each world has its own `window`, so the same name can exist twice.

| Namespace | World(s) | Holds |
|---|---|---|
| `window.TankiQoL` | ISOLATED (combos) + MAIN (translator) | the shared components (`.Switch`, `.Select`, `.Drawer`), and in ISOLATED every combos module (`.DOM`, `.ViewRenderer`, `.GarageBridge`, `.GarageDiscover`, …) |
| `window.__CT` | MAIN | translator internals: `.settings`, `.translate`, `.skip`, `.bidi`, `.rebuild()` |
| `window.__CMB` | MAIN | garage hook: `.read()`, `.index()`, `.log()`, `.names()`, `.state()`, `.debug`, and `.internals` (shared by the `main/garage/` files) |
| `__CT_*` | MAIN | translator console helpers — see `debugging.md` |

## manifest.json — 6 content-script blocks

JSON has no comments, so the reasoning lives here. **Do not merge these blocks.**

| # | Contents | `run_at` | World | Why separate |
|---|---|---|---|---|
| 0 | **all CSS** | `document_start` | n/a | CSS is not world-scoped, so one block serves both features. Early injection avoids a flash of unstyled injected UI. Array order = cascade order. |
| 1 | translator `isolated/` | `document_start` | ISOLATED | The only place with `chrome.*`. Must start early so bundle discovery finishes before the user enters a battle. |
| 2 | combos `isolated/` (discovery + bridge) | `document_start` | ISOLATED | Same reason for the garage hook: discovery must finish before the garage opens. Also defines `TankiQoL.GarageBridge`, which block 5 uses. |
| 3 | combos `main/garage/` | `document_start` | MAIN | Needs the page's own `window` for the `Object.prototype` traps. Must be `document_start` — the state is built later, but the trap has to be armed first. |
| 4 | translator `main/` | `document_start` | MAIN | Same, for the chat HUD. |
| 5 | combos (DOM side) | `document_idle` | ISOLATED (default) | Pure DOM work that only makes sense once the page exists. Its internal order is the dependency chain below. |

`shared/components/switch.js` and `select.js` appear in **both** block 4 and
block 5. Not a mistake: JS worlds don't share a `window`, so each world needs its
own copy.

Blocks 2 and 5 are both combos and both ISOLATED but must stay separate: block 2
is the bridge to the game's internals and has to be armed at `document_start`,
block 5 can't run until the page exists.

## Load order

Scripts load in the exact order listed. **A file that isn't in the manifest never
loads.** Within block 5 the order is:

1. `shared/components/` — no dependencies
2. `features/combos/lib/` (constants, utils, language) — no dependencies
3. `features/combos/core/` (cleaner, migrator, navigator, scanners, equippers,
   savers, loaders, helpers, randomizer) — depend on lib
4. `features/combos/ui/` — base file first, then its mixins (`ui/card/*` after
   `combo_card_renderer.js`, `ui/view/*` after `view_renderer.js`)
5. `features/combos/main.js` — always last, orchestrates everything

Block 3 (`main/garage/`) ends with `boot.js`, which arms the traps once every
other file has defined its half of `__CMB.internals`.

## Storage layout

**One storage key per feature.** `chrome.storage` is a single flat namespace, so
a feature must not scatter loose generic keys into it.

| Area | Key | Owner | Contents |
|---|---|---|---|
| `local` | `savedCombos` | combos | the combo array (shape in `combos.md`) |
| `local` | `equipProtectionsOnLoad` | combos | bool — include protections when equipping |
| `local` | `autoOpenCombosOnGarageEntry` | combos | bool |
| `local` | `randomizerSettings` | combos | randomizer options object |
| `local` | `garageConstants:v<N>:<bundle url>` | combos | cached per-build discovery result |
| `local` | `hudConstants:<bundle url>` | translator | cached per-build discovery result |
| `sync` | `translator` | translator | `{ enabled, showOriginal, targetLang }` |

Combos data is larger and device-specific → `local`. Translator preferences are
tiny and worth syncing across devices → `sync`. Different areas *and* different
names, so no collision.

## Source tree

```
features/combos/
├── main.js                    # MutationObserver orchestrator, always last
├── styles.css, combo_card.css
├── isolated/                  # [ISOLATED] the link to the MAIN-world hook
│   ├── discover/              #   bundle parsing, split by concern
│   │   ├── parse.js           #     toString -> {semantic: minified} maps
│   │   ├── state.js           #     state/item classes, trap field, read extras
│   │   ├── send.js            #     proxy, space, context, mount + select actions
│   │   ├── actions.js         #     resistance / device / skin write actions
│   │   └── index.js           #     discover() = compose the above
│   ├── detect.js              #   fetch the bundle, cache, send to MAIN
│   └── bridge.js              #   TankiQoL.GarageBridge — request/reply to MAIN
├── main/garage/               # [MAIN] the game hook (see garage-native.md)
│   ├── names.js               #   seed names + debug counters + applyNames
│   ├── kotlin.js              #   enum / Long / image / Mk / upgrade readers
│   ├── collect.js             #   structural scan of the state graph
│   ├── capture.js             #   the Object.prototype traps
│   ├── store.js               #   find the store, build actions, resolve ctors
│   ├── mount.js               #   mount an item + select it (3D model)
│   ├── protections.js         #   the 4 resistance slots, set-based diff
│   ├── devices.js             #   augments: install / remove, ownership
│   ├── device_catalog.js      #   lazy catalogs: request + wait
│   ├── skins.js               #   apply a turret/hull skin
│   ├── read.js                #   readCombo / readIndex
│   ├── apply.js               #   applyCombo — the whole-combo orchestrator
│   ├── bridge_main.js         #   MAIN side of the bridge
│   └── boot.js                #   arm the traps, announce ready
├── lib/
│   ├── constants.js           # every game DOM selector, in one place
│   ├── utils.js
│   └── language_manager.js    # 11 languages, auto-detected from the UI
├── core/
│   ├── instant_saver.js       # THE save path (game state)
│   ├── combo_saver.js         # LEGACY save path (DOM) — kept, wired to nothing
│   ├── instant_loader.js      # THE equip path (game actions)
│   ├── combo_loader.js        # LEGACY equip path (DOM) — per-slot fallback
│   ├── combo_migrator.js      # backfills ids on old combos, in the background
│   ├── migrator_match.js      #   its matching core (name → item, Mk families)
│   ├── combo_cleaner.js       # removes stale/empty combos
│   ├── tab_navigator.js       # navigates between garage tabs
│   ├── navigation_helpers.js  # MutationObserver-based waiting
│   ├── auto_navigator.js      # auto-opens the combos tab
│   ├── scanners/              # base_item, augment, protection — READ only
│   ├── equippers/             # base_item, augment, protection — WRITE only
│   └── randomizer/            # randomizer, random_from_saved, random_full, item_list_scanner
└── ui/
    ├── menu_injector.js       # injects the COMBOS tab
    ├── view_renderer.js       # the view object: init, show/hide
    ├── view/                  #   template, events, scroll, drag, combo_list,
    │                          #   combo_actions, delete_animation, tank_preview,
    │                          #   hide_guard
    ├── combo_card_renderer.js # the card object
    ├── card/                  #   rows, events, title_edit
    ├── combo_drag_handler.js  # drag-and-drop reordering
    ├── delete_combo_modal.js/.css
    ├── lobby_button_injector.js, lobby_shortcut_handler.js, lobby_button.css
    ├── randomizer_settings.js/.css
    └── import_export.js/.css

features/translator/
├── isolated/                  # [ISOLATED] the only chrome.* access
│   ├── bridge.js              #   storage sync + translate relay to the SW
│   └── detect.js              #   parses the bundle -> HUD names
├── main/                      # [MAIN]
│   ├── settings.js            #   __CT.settings (subscribe/get/set)
│   ├── skiplist.js            #   __CT.skip — no-translate slang
│   ├── translate.js           #   __CT.translate — request, cache, timeout
│   ├── bidi.js                #   __CT.bidi — RTL logical→visual
│   ├── chat.js                #   THE CORE: capture, intercept, rebuild
│   ├── gamesettings.js/.css   #   controls inside the game's Settings screen
│   └── toggle.js              #   in-battle toggle button + Alt+T
└── assets/flags/*.svg         # web_accessible_resources
```
