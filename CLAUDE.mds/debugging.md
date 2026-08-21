# Debugging

Combos DOM code runs in ISOLATED, so its logs appear in the page console as
`[ComboManager]` lines. The game hooks live in the page world, so use the **game
tab's** console (not the extension's DevTools) for everything below.

## Console surface

The extension logs **nothing** at runtime except `console.error` on a genuine
unexpected failure. What is left is data you can pull on demand from the game
tab's console — no printing, they return objects and the console renders them.

```js
// combos — the garage hook (MAIN world)
__CMB.read(); // the current loadout as read from game state
__CMB.index(); // the flat garage index (what the migrator consumes)
__CMB.state(); // the captured raw game state object (for poking around)
__CMB.names(); // the minified name-set in use for this build
__CMB.debug; // counters: captures, reads, dispatch counts, lastError, …

// combos — DOM side (ISOLATED)
chrome.storage.local.get(["savedCombos"], (r) => console.log(r.savedCombos));

// translator (MAIN world)
__CT_STATE(); // settings + discovered names + debug counters + capture status
__CT_DEBUG; // {discovered, captured, intercepts, translations, rebuilds,
//  replayAdopts, skipped, lastError, names, ...}
__CT_MSGS; // recorded messages (text, translation, lang, state, ...)
__CT_HUD; // the captured HUD instance (null until you enter a battle)
__CT_TOGGLE(); // flip all original<->translation
__CT_TOGGLE_LAST(); // flip the last translated message
__CT_SKIP_WORDS.add("foo"); // extend the no-translate slang set live
__CT_NOTR("some text"); // would this text be skipped?
```

The POC-era write probes (`__CMB_TRY_NATIVE`, `__CMB_PROTECTIONS`,
`__CMB_AUGMENTS`, `__CMB_TRY_SKIN`, …) were removed once the equip path shipped.
If you ever need to isolate a single failing slot again, call the internals
directly — they are all on `__CMB.internals` (e.g.
`__CMB.internals.applyProtections(['id1', null, null, null])`).

Note: `chrome.*` only exists in the ISOLATED world. In the page console (where
`__CMB` lives) `chrome.storage` is undefined — read storage from the extension's
own console context instead.

## Symptom → cause

| Symptom                                                                   | Likely cause                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `__CMB.state() === null` after opening the garage                         | the trap never validated: either discovery failed (`__CMB.debug.discovered === false`) or the game restructured its garage state                                                                 |
| a mounted item is missing from `__CMB.read().combo`                       | its category isn't in `CATEGORY_TO_SLOT` (`discovery/game/names.js`) — it will be sitting in `read().other` with its category name                                                               |
| a slot equips as `unavailable` although the user owns it                  | the item didn't resolve — check `baseItemId` on the stored combo (run the migrator) and `owned` in `__CMB.index()`                                                                               |
| an augment reports `unavailable` right after a refresh                    | its catalog hadn't loaded; `equip/game/device_catalog.js` should have requested it — check `debug.catalogRequests`                                                                               |
| equipping does nothing at all, no error                                   | an action was probably built with `Object.create` somewhere, or a ctor lookup returned a shell — every action must come from `new proto.constructor(...)`                                        |
| the combo count looks short / an owned item "missing"                     | the graph scan may have truncated: check `__CMB.debug.depthCut` and `.truncated`                                                                                                                 |
| the paints tab (or any tab's content) shows through under the combos view | the game rendered it after `show()` did its one-off hiding — the guard (`view/hide_guard.js`) is off: check `ViewRenderer.hideGuardObserver`, and that the file is in `manifest.json`            |
| the 3D tank is blank / won't drag while the combos view is open           | a preview host ended up `display:none` — look for an inline `display:none` on `PREVIEW_HOSTS` **without** `data-cme-preview-hidden`, which means something outside `keepTankPreviewAlive` hid it |
| `__CT_DEBUG.discovered === false` after a few seconds                     | `detect.js` couldn't parse the bundle — see the recovery procedure in `translator.md`                                                                                                            |
| `__CT_HUD === null` after entering a battle                               | the trap never validated: the offset field name is wrong                                                                                                                                         |
| translations missing but `intercepts` climbing                            | check `__CT_DEBUG.lastError` — likely the service-worker fetch failed                                                                                                                            |

## Offline harnesses

There is no test framework here. What exists is **`build/harnesses/`** — plain
`node <file>` scripts, no dependencies, that run the _shipped_ code offline
against the bundles in `../../../research/`. They live under `build/`, so they
never reach the store zip. 193 checks across 9 files:

- **`verify_shipped.js`** — loads `discovery/*.js` as shipped, runs
  `discover()` against every bundle in `research/`, and diffs the result for the
  current build against the seed in `discovery/game/names.js`. A stale seed or a
  broken regex fails loudly instead of silently degrading in-game. **Run it after
  any change to discovery, and bump `CACHE_VERSION` when the output shape
  changes.**
- **`test_write_path.js`** — loads every MAIN-world `game/` file into a `vm` sandbox
  with a fake store and state, then asserts which actions each write dispatches:
  the protection set-diff, augment ownership rejection, skins. The write logic is
  tested without touching the game.
- **`test_migrator.js`**, **`test_instant_loader.js`**, **`test_instant_saver.js`**,
  **`test_card_render.js`**, **`test_protection_equal.js`** — same idea for the
  ISOLATED-side modules (Mk families, imported combos, the fallback split, the
  card HTML for both data generations).
- **`test_view_layer.js`** — the odd one out: it reads `styles.css`,
  `template.js` and `tank_preview.js` as **text**, because what it guards is a
  stacking/hit-testing contract, not logic. The view must stay
  `pointer-events: none` and outrank the game's drag box, the preview host must
  not be given a `z-index`, and every interactive element must sit inside a
  region that takes pointer events back (see the tank-preview section of
  `combos.md`). It cannot tell you whether the layer actually behaves — only a
  browser can.

They hold **absolute paths** to this repo and to `research/`, so they run from
anywhere but break if either moves. When you split or move a source file, update
the file list at the top of the harness that loads it.
