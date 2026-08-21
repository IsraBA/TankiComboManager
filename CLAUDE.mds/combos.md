# Feature: Combos

Save the full equipment setup and re-equip it in one click. Saving and equipping
both run against the game's own state (`garage-native.md`); the DOM path is a
fallback.

## Centralized selectors

All selectors for the game's DOM live in `features/combos/lib/constants.js` as
`window.TankiQoL.DOM`. When the game updates its HTML, only that file changes.
**Never hardcode a game selector anywhere else.** If the combos feature breaks
after a game update, it is almost always a selector.

## Stored data

`chrome.storage.local.savedCombos` — an array of:

```javascript
{
    id: Number,              // timestamp-based unique ID
    name: String,            // user-editable
    date: String,            // locale date string
    order: Number,           // display order (0 = top)
    language: String,        // language code at save time
    data: { ... },           // below
    removedItems: {}         // optional: slots to skip when equipping
}
```

**Two generations coexist and every consumer must tolerate missing keys.**

Gen-2 `data` (what `instant_saver.js` writes):

```javascript
data: {
    turret:         { id, baseItemId, name, image, mk?, lvl? },
    turretAugment:  { id, baseItemId, name, image },
    turretSkin:     { id, name, image },
    hull:           { id, baseItemId, name, image, mk?, lvl? },
    hullAugment:    { id, baseItemId, name, image },
    hullSkin:       { id, name, image },
    grenade:        { id, baseItemId, name, image, mk?, lvl? },
    drone:          { id, baseItemId, name, image, lvl? },
    paint:          { id, baseItemId, name, image },
    protection:     [{ id, baseItemId, name, image, lvl? } | null, ×4]  // POSITIONAL by mountIndex
}
```

- **`baseItemId` is the key equipping works from.** Each Mk is a separate item
  with its own `id` and the user owns *all* of them, so a combo saved at Mk5 must
  not equip Mk5 after they upgrade. Equipping resolves `baseItemId → the highest
  owned Mk at that moment`, which is exactly what the game does: it offers no Mk
  choice, it always equips your top grade.
- **`id`** is the exact item that was mounted at save time — a convenient
  snapshot for logs, deliberately *not* used to equip.
- **Augments are the exception**: an augment's `baseItemId` points at the
  turret/hull it belongs to, so it isn't unique. There, `id` is the key.
- **`name` + `image` are a display snapshot**: what the cards render, and what
  keeps the legacy DOM equipper able to equip gen-2 combos (its matching is
  name-based, case-insensitive).
- **Protection equality is name-first** (`areProtectionsEqual`). Gen-2 images are
  CDN previews that all end in `image.svg`, while the DOM scan stores uniquely
  named icon files — the two are never comparable by image. Comparing images
  first is exactly the bug that made gen-2 combos skip their protections.
  `extractIconFileName` also prefixes a generic `image.svg` with its unique CDN
  path segment so image comparison stays discriminating where it is still used.
- Gen-1 `data` (DOM-scanned): same slots minus the decorative ones and the ids —
  `{ name, image }` per item, protections compacted (no positional nulls). Gen-1
  entries stay valid forever.
- **The turret's shot effect is deliberately not a slot.** It is readable (the
  state reader still exposes `shotSkin`) but a product decision keeps it out of
  combos: not saved, not rendered, not equipped. Combos saved before that
  decision may still carry a `turretShotFx` key; it is simply ignored, which is
  why nothing migrates it away.

## Backfilling ids on old combos (`core/combo_migrator.js`)

Runs on every combo-list load, **after** rendering and without blocking it — the
migration changes nothing that is displayed. It asks the MAIN world for a flat
index of the garage (`GarageBridge.readIndex()`) and resolves `name → id` for any
slot that lacks one.

Deliberately **not** a one-shot flag in storage: import/export means a gen-1
combo can arrive at any time and a flag would already be set. An idempotent scan
covers that for free — once everything has ids it is an in-memory check that
returns immediately, touching neither the bridge nor storage.

Four rules keep it from doing damage:

- **Nothing is deleted.** `id`/`baseItemId` are added *beside* the existing
  `name`/`image`. An unresolved slot is left exactly as it was and keeps working
  through the DOM path.
- **Items that aren't owned are resolved too.** An id is a fact about the game,
  not about the user, and the garage carries unowned items anyway (they're on
  sale). A combo imported from another account resolves fully, and if the item is
  ever bought it just works. Equipping is what refuses unowned items.
- **Mk levels are a family, not an ambiguity.** The user owns *every* Mk of an
  item, each a separate item id, so "THUNDER" legitimately returns seven
  candidates — all sharing one `baseItemId`. Real ambiguity is two *different*
  `baseItemId`s under one name, and that is refused. From a family, the highest
  **owned** Mk is stored as `id` (lowest if none are owned; equipping won't rely
  on it anyway).
- **Augments** are matched inside their owner's `baseItemId`, so the turret/hull
  slot must resolve first.

Known limitation: names were saved in whatever language the user played in. If
the game language changed since, matching fails and there is nothing to translate
from — that combo stays on the DOM path.

## Combo card: interaction model

The card has **two modes**, and almost every interaction rule follows from that:

| | normal mode | edit mode (`.cme_editing`) |
|---|---|---|
| click anywhere on the card | equips the combo | nothing (clicks are for removal) |
| click an item | equips (the click bubbles up) | removes that item |
| item hover | nothing | red tint + × icon |
| pencil button | enters edit mode | (shows a ✓) leaves edit mode |

- **The top row is not part of the card's click surface** — the name, the pencil
  and the delete button live there, and it is also the one area you cannot drag
  from. Everything below both equips on click and drags to reorder.
- **Click vs drag** is decided by mouse travel between `mousedown` and `click`
  (5 px), not by drag events — browsers disagree about whether a `click` fires
  after a drag, so the geometric test is the reliable one.
- There is **no EQUIP button**; the paint square took its place in row 4 and is
  always visible (the button only appeared on hover).
- **Skins are display-only**: `turretSkin` / `hullSkin` replace the turret/hull
  *image* on the card. They are not separately removable — removing the turret
  takes its whole area with it, which is why `removeItemFromCombo` cascades
  `turret → turretAugment`.
- **Edit state lives in `ComboCardRenderer._editingCombos`** (a Set of combo ids),
  not on the element: removing an item writes to storage and re-renders the whole
  list, which throws the element away. Keeping the flag outside is what stops
  edit mode from closing after every removal.
- The pencil/check icons are **inline SVGs copied in style from the game's own
  `iconDelete.svg`**: 24×24, sharp filled white shapes (no strokes), 25% opacity
  and 100% on hover. The opacity sits on the `<svg>`, not the button, because the
  button already animates its own opacity for the card-hover reveal and the two
  would multiply.
- `ComboCleaner.isComboEmpty` counts paint as real content (a combo that only
  changes your paint is legitimate) but **not** skins, since a combo with only
  skins left would equip nothing.

## The tank preview

The garage's rotating 3D model is measured from `#tankPreviewContainer`. If any
ancestor is `display:none` its box is 0×0, and then every re-measure (window
resize, a paint change, any state change) blanks the model until you leave and
re-enter the tab; a hidden element also gets no mouse events, so drag-to-rotate
dies with it.

So the combos view never hides the preview's host. `keepTankPreviewAlive()`
(`ui/view/tank_preview.js`) takes the host out of flow (absolute, under our
layer) and hides only the **siblings along the path** from the preview up to the
host — generically, without naming per-tab classes. Each tab type has a different
host (`PREVIEW_HOSTS` in `constants.js`).

## Hiding the game's content, and keeping it hidden

`ViewRenderer.show()` hides the game's tab content — `hideGameContent()`:
`ELEMENTS_TO_HIDE` plus `keepTankPreviewAlive(true)` — with **inline styles on the
elements that exist at that moment**. That is not enough on its own, because the
game's content is React-rendered and arrives, or comes back, later:

- `safeActivateComboTab` clicks **Paints** and waits 1 ms before activating our
  tab, so the paints screen mounts *after* `show()` already ran. Nothing hid it,
  and it stayed visible under the combos view (the whole paints tab — description,
  Equip button, the paint list). Symptom: entering the garage with
  auto-open on, intermittently.
- Any later re-render (equipping a combo, changing a paint) throws the hidden
  nodes away and builds new ones, which come back without our `display:none`.

So `ui/view/hide_guard.js` keeps a `MutationObserver` alive for exactly as long as
the view is visible and re-applies `hideGameContent()` to whatever appeared. Four
things make it cheap and safe:

- **It observes `GARAGE_WRAPPER`, not `document.body`** — the wrapper doesn't
  exist in battle, and `main.js` also calls `stopHideGuard()` when it detects we
  left the garage/lobby. There is no observer outside the combos view.
- **`childList` only.** Our own hiding is a `style`/`dataset` change, so it can
  never re-trigger the observer. No loop, and no wasted callbacks.
- **The re-apply is synchronous inside the callback**, which runs before the
  browser paints — the late content is never drawn for even one frame, so there is
  no flash. Do not wrap it in `setTimeout`.
- **Mutations that are entirely inside our own view are skipped** (`isOwnMutation`)
  — rendering the combo list is the noisiest source of mutations and needs no
  re-hiding.

`keepTankPreviewAlive` is idempotent by design (everything it hides is marked
`data-cme-preview-hidden` and unmarked on the next run) and both its queries are
scoped to the wrapper, which is what makes calling it on every mutation batch
affordable.

Historical note: `safeActivateComboTab` used to work around the same race by
setting `display:none` directly on `.PaintsCollectionComponentStyle-containerPaints`
after a 150 ms delay. That is a **preview host** — see above for why hiding it
blanks the 3D model and kills drag-to-rotate — and it was set *without* the
`data-cme-preview-hidden` mark, so nothing ever cleaned it up. The guard replaces
it; don't bring it back.

## Languages

`LanguageManager` auto-detects the game language from UI text (11 languages). Use
`getUIText()`, `getEquipButtonText()` and `getTabName()` for any user-facing or
game-matching string; never hardcode language-specific text. `getUIText` falls
back **English → the key itself**, so a half-added key shows readable text
instead of leaking a variable name.

Combos are filtered by language: the list only shows combos whose `language`
matches the current one (a combo with no `language` is assumed English).

## The legacy DOM path

`combo_saver.js` (save) and `combo_loader.js` + `equippers/` + `scanners/`
(equip) work by **simulating the user**: navigate a tab, find the item by its
displayed name, click it, click Equip, wait. That is why they are slow and
visibly walk the UI.

- The **saver** is wired to nothing. Kept deliberately.
- The **loader** is still used, as the per-slot fallback when a native dispatch
  fails, and for a whole combo if the native path is unavailable entirely.
- It cannot equip the decorative slots (paint, skins) — the game's UI has no
  "equip" for them in the same sense, so those are native-only.
