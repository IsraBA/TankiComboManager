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
| MAIN | `features/combos/**/game/*`, `features/translator/main/*` | the page `window`; no `chrome.*` |
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
| `window.__CMB` | MAIN | garage hook: `.read()`, `.index()`, `.names()`, `.state()`, `.debug`, and `.internals` (shared by every `game/` file) |
| `__CT_*` | MAIN | translator console helpers — see `debugging.md` |

## manifest.json — 6 content-script blocks

JSON has no comments, so the reasoning lives here. **Do not merge these blocks.**

| # | Contents | `run_at` | World | Why separate |
|---|---|---|---|---|
| 0 | **all CSS** | `document_start` | n/a | CSS is not world-scoped, so one block serves both features. Early injection avoids a flash of unstyled injected UI. Array order = cascade order. |
| 1 | translator `isolated/` | `document_start` | ISOLATED | The only place with `chrome.*`. Must start early so bundle discovery finishes before the user enters a battle. |
| 2 | combos `discovery/` + `bridge/bridge.js` | `document_start` | ISOLATED | Same reason for the garage hook: discovery must finish before the garage opens. Also defines `TankiQoL.GarageBridge`, which block 5 uses. |
| 3 | every combos `game/` file | `document_start` | MAIN | Needs the page's own `window` for the `Object.prototype` traps. Must be `document_start` — the state is built later, but the trap has to be armed first. |
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
2. `features/combos/lib/` (constants, utils, language, cleaner) — no dependencies
3. `migration/`, `dom/`, `save/`, `equip/`, `randomizer/` — depend on lib
4. `features/combos/view/` — base file first, then its mixins (`view/card/*`
   after `combo_card_renderer.js`, `view/*.js` after `view_renderer.js`)
5. `features/combos/main.js` — always last, orchestrates everything

Block 3 (the MAIN-world files) ends with `discovery/game/boot.js`, which arms the
traps once every other file has defined its half of `__CMB.internals`.

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

**The folders follow the flow, not the JS world.** One rule keeps the worlds
straight: **anything under a `game/` folder runs in MAIN**, everything else in
ISOLATED.

```
features/combos/
├── main.js                    # MutationObserver orchestrator, always last
├── styles.css
├── lib/                       # no dependencies of their own
│   ├── constants.js           #   every game DOM selector, in one place
│   ├── utils.js
│   ├── language_manager.js    #   11 languages, auto-detected from the UI
│   └── combo_cleaner.js       #   removes stale/empty combos
│
├── discovery/                 # stage 0 — find this build's minified names
│   ├── parse.js               #   toString -> {semantic: minified} maps
│   ├── state.js               #   state/item classes, trap field, read extras
│   ├── send.js                #   the garage proxy, mount + select actions
│   ├── actions.js             #   resistance / device / skin write actions
│   ├── index.js               #   discover() = compose the above
│   ├── detect.js              #   fetch the bundle, cache, send to MAIN
│   └── game/
│       ├── names.js           #   seed names + debug counters + applyNames
│       └── boot.js            #   arm the traps, announce ready (loads last)
│
├── bridge/                    # the pipe between the worlds
│   ├── bridge.js              #   TankiQoL.GarageBridge — request/reply
│   └── game/bridge_main.js    #   the MAIN side
│
├── capture/game/              # stage 1 — hold the game's live state
│   ├── capture.js             #   the Object.prototype traps
│   ├── collect.js             #   structural scan of the state graph
│   └── kotlin.js              #   enum / Long / image / Mk / upgrade readers
│
├── save/                      # stage 2 — "save combo"
│   ├── instant_saver.js       #   THE save path
│   ├── game/read.js           #   readCombo / readIndex
│   └── old/combo_saver.js     #   LEGACY (DOM) — kept, wired to nothing
│
├── view/                      # stage 3 — the combos UI
│   ├── menu_injector.js       #   injects the COMBOS tab
│   ├── view_renderer.js       #   the view object: init, show/hide
│   ├── template · events · scroll · drag        #   its mixins
│   ├── combo_list · combo_actions · delete_animation
│   ├── tank_preview · hide_guard                #   keep the game's 3D view alive
│   ├── card/                  #   combo_card_renderer + rows, events, title_edit,
│   │                          #   combo_drag_handler, combo_card.css
│   ├── lobby/                 #   button, C shortcut, auto-open, lobby_button.css
│   └── panels/                #   delete modal, randomizer settings, import/export
│
├── equip/                     # stage 4 — clicking a combo
│   ├── instant_loader.js      #   decides WHAT to apply
│   ├── game/
│   │   ├── apply.js           #     decides HOW — the whole-combo orchestrator
│   │   ├── store.js           #     find the store, build actions, resolve ctors
│   │   ├── mount.js           #     mount an item + select it (3D model)
│   │   ├── protections.js     #     the 4 resistance slots, set-based diff
│   │   ├── devices.js         #     augments: install / remove, ownership
│   │   ├── device_catalog.js  #     lazy catalogs: request + wait
│   │   └── skins.js           #     apply a turret/hull skin
│   └── old/                   #   LEGACY (DOM) — per-slot fallback
│       ├── combo_loader.js
│       └── equippers/         #     base_item, augment, protection
│
├── migration/                 # stage 5 — backfill ids on old combos
│   ├── combo_migrator.js      #   runs on every combo-list load
│   └── migrator_match.js      #   name → item, Mk families
│
├── randomizer/                # randomizer, random_from_saved,
│                              # random_full, item_list_scanner
│
└── dom/                       # the DOM toolbox the old paths and random_full use
    ├── scanners/              #   base_item, augment, protection — READ only
    ├── tab_navigator.js       #   navigates between garage tabs
    └── navigation_helpers.js  #   MutationObserver-based waiting

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
