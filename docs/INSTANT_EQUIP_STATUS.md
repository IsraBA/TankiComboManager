# Instant equip — working state & handoff

> Working note for the in-progress ROADMAP feature 2 (instant combo equipment).
> Everything here was verified live in-game unless explicitly marked otherwise.
> `docs/` never ships (see PACKAGING.md). Delete this file when the feature lands
> and the knowledge has moved into `CLAUDE.md` + `../../research/CLAUDE.md`.

## Where we are

**Reading is done and shipped.** The save button saves instantly from game state
(`core/instant_saver.js`), no DOM walking. See CLAUDE.md → "Feature: Combos".

**Writing a base item is proven live.** `__CMB_TRY_NATIVE(id)` mounts a turret
with zero flicker: the server persists it, the local state updates, the item goes
green in the list, AND the 3D tank preview follows. No manual bootstrap, no user
action needed.

**Writing protections is implemented and verified offline — awaiting a live
test.** `__CMB_TRY_PROTECTIONS([id|null ×4])` applies a full 4-slot state with
the diff optimisation intact. 13 offline checks pass, including running the
shipped module against a fake game state (`test_apply_protections.js`).

**Nothing in the equip path is wired to the UI yet.** The Equip button (now: a
click anywhere on the combo card) still runs the old DOM equipper
(`core/combo_loader.js` → `equippers/`). That is deliberate — see "Next steps".

## How the write path works (the whole story)

Equipping an item natively = **dispatch the game's own mount action**, then
**dispatch the game's own select action**. Both go through the game's store.

```
mountViaAction(rawItem, needServer)
  ├─ store.uap( new <MountAction>(rawItem, true) )   → local state + server send
  └─ selectItem(rawItem)
       └─ store.uap( new <SelectAction>(rawItem.id) ) → 3D tank preview refresh
```

Why two actions: **the 3D model is driven by item SELECTION, not by mounting.**
In the game's own flow the user clicks an item (select → model changes) and only
then presses Equip. Mounting alone leaves the model on the previous item. This
was the single hardest thing to find; do not "simplify" it away.

### The action taxonomy (verified on all 8 bundles)

Every garage write comes in **two layers**, and knowing which is which is the
whole game:

| public **thunk** (what the UI dispatches) | what it does | **low-level** action it dispatches |
|---|---|---|
| `GarageItemMounted(item, needServerMount)` | checks the mount restriction; then, for turret/hull, also loads that item's devices | the plain 2-field mount action + `GarageLoadDevicesIfNotLoaded` |
| `GarageResistanceMount(resistance, index)` | unmounts whatever occupies `index`; special-cases the universal module | `GarageResistanceUnMount` + `GarageApplyResistanceMount` |

**We dispatch the low-level actions, not the thunks** — and the reason is
mechanical, not stylistic: only the low-level actions are **subscribed** by a
controller, and a subscription holds a KClass that points at the constructor.
That is what makes them findable at runtime by class name. Thunks appear in no
registry at all, so there is no path to their constructors from the object graph.

Consequence: anything the thunk does beyond dispatching, we must do ourselves.
For protections that is "free the slot first" (implemented). The thunk's other
branch — a **universal** module (a resistance whose properties include
`ALL_RESISTANCE`) unmounts *everything* — we deliberately do not replicate: the
game needs it because its UI mounts one module at a time with no idea of the
final state, while we always apply the full 4-slot target, so anything unwanted
is already removed by the unmount pass.

### Protections

```
applyProtections([id|null ×4])
  ├─ compare the current SET of mounted modules against the wanted SET
  │    mounted and wanted      → leave it exactly where it is
  │    mounted, not wanted     → unmount
  │    wanted, not mounted     → mount into a slot that will be free
  ├─ pass 1: every unmount        GarageResistanceUnMount(item, true)
  └─ pass 2: every mount          GarageApplyResistanceMount(item, slot, true)
```

**The comparison is by set, not by slot** — this is the one thing to get right.
The four slots are interchangeable and carry no meaning in the game: what matters
is *which* modules are on, not in what order. So a combo holding exactly the
modules you already have, in a different order, produces **zero** actions.

The saved slot index is still used, but only as a *preference* when placing a
module that genuinely has to be mounted: it goes to its combo slot if that slot
will be free, otherwise to the first free one. Modules that stay never move, so
after equipping, the garage order can differ from the combo card's. That is the
same behaviour the DOM equipper has always had.

> This was a real bug, caught by the user on the first live run: the first
> version compared slot-by-slot, which turned a pure reorder of the same four
> modules into 8 pointless actions. The old `equippers/protection_equipper.js`
> had it right all along — it always compared sets.

Unmounts run before mounts because a resistance lives in exactly one slot, so an
occupied slot has to be freed before it can be filled. `needServerUnmount` /
`needServerMount` are the same "tell the server" flag as on the base-item mount;
passing `false` makes any of these a purely local, traffic-free probe.

No select action is dispatched for protections — the 4 slots are plain UI bound
to state, not the 3D model.

### The four captured objects (all via `Object.prototype` setter traps)

| What | Why it's needed | Validation |
|---|---|---|
| `Garage` state | read the loadout | has every known state field |
| garage server proxy | holds the `mountItem` send method | prototype has all 4 send methods |
| Space (entity registry) | maps item id → network entity | prototype has lookup + ensure methods |
| context stack | addresses outgoing commands | prototype has push/get/pop |

### Discovery anchors (all verified on all 8 bundles in `../../research/`)

Run the harnesses after ANY change to `discover()` — see "Harnesses" below.

- **Garage state / GarageItem** — Kotlin `toString` spells out field names as
  literal strings. Direct `semantic → minified` map.
- **garage proxy** — anchored on the **mountItem command hash**
  `new X(595500642, 251373796)`. That hash derives from the command name and is
  therefore build-stable: it appears **exactly once** in every one of the 8
  bundles. Strongest anchor in the project.
- **Space** — anchored on the literal error string
  `"has been unloaded from space"`.
- **context stack** — anchored on the literal error string
  `"GameObject in context is null"`.
- **mount action** — anchored on the controller's own handler, which is located
  via the already-discovered mount send-method name. Cross-checked against a
  constructor with exactly the two expected fields.
- **select action** — a thunk whose body looks up the item by id and checks its
  category; matched head-then-tail (a single rigid regex only matched one build).
- **the resistance actions** — the easiest anchor in the whole project: the
  Redux actions are Kotlin **data classes**, so each one's `toString` spells out
  its own field names, exactly like `Garage` and `GarageItem`. `dataClass()`
  returns both the minified class name and the field map, and nothing structural
  is involved. `GarageApplyResistanceMount` vs `GarageApplyResistanceMountOnBuy`
  are disambiguated by the literal `(` the pattern requires after the name.

### Getting the action classes at runtime (no user action required)

The reducer checks `instanceof`, so we need the real classes.

1. **Traps** on each action's ctor field capture a template if the game happens
   to create one. The **select** action is captured this way automatically (the
   game dispatches it on garage load). The **mount** action is not — the game
   only creates it when something is actually mounted.
2. **Resolution by class name** (`resolveMountActionProto`) closes that gap: the
   discovery knows the class *name*, minified names are function declarations,
   so a bounded walk of the object graph finds a function with exactly that name.
   Validated by **constructing a probe instance and checking the fields took the
   values we passed** — an instance that is built and never dispatched has no
   side effects, so the validation itself is safe.

### Addressing (only needed for the raw send path, kept as reference)

Outgoing commands are addressed to whatever entity is in the context stack. The
game always wraps `push(garageEntity) → send → pop()`. `mountItemById()` still
implements that raw path; it works server-side but does **not** update the UI,
which is exactly why the action path above exists. Keep it — it is the proof
that the send layer works, and a fallback if the action path ever breaks.

The garage entity is learned by wrapping the proxy's send methods: whatever is in
context when the game itself sends a garage command is by definition correct.

## Console API (page console, MAIN world)

```js
__CMB_READ()              // print the current loadout (read-only)
__CMB_STATE()             // captures, discovered names, debug counters
__CMB_DIAG()              // garage-entity + action-template diagnostics
__CMB_TRY_NATIVE(id)      // base item: local + server + 3D preview  ← proven live
__CMB_TRY_LOCAL(id)       // local state only — sends NOTHING out (safe probe)
__CMB_TRY_MOUNT(id)       // raw send path (server only, UI stays stale)

__CMB_PROTECTIONS()               // the 4 slots + every owned module, with ids
__CMB_TRY_PROTECTIONS([a,b,c,d])  // apply a full 4-slot state (ids or null)
__CMB_TRY_PROT_MOUNT(id, slot)    // one slot, no diff, no slot clearing
__CMB_TRY_PROT_UNMOUNT(id)        // remove one module

__CMB.read() / .state() / .names() / .protections() / .applyProtections() / .debug
```

Every protection probe prints the slot table before and 1 s after, so the state
is its own verification.

## Harnesses (scratchpad — recreate if the session is gone)

They extract the **shipped** `discover()` out of `isolated/detect.js` and run it
against every bundle in `../../research/`, then diff the current build's result
against the SEED in `main/garage_state.js`. This has caught two real bugs already
(a stale cache overwriting the seed; a ReferenceError that silently killed all
discovery). **Always run after touching `discover()`.**

- `verify_shipped.js` — the main one, all fields, 8/8 must pass + SEED match.
- `test_action.js`, `test_select.js`, `test_context.js`, `test_send_discovery.js`,
  `test_resistance.js` — focused anchor tests, useful when adding a new anchor.
- `test_taxonomy.js` — cross-validates the two-layer model: that the public
  thunk really does dispatch the low-level action we send, on every build.
- `test_apply_protections.js` — a different animal: it loads the **shipped**
  `garage_state.js` into a `vm` sandbox with a fake game state (fake store, fake
  proxy, fake action constructors) and asserts the actual dispatches. This is
  what proves the diff optimisation without touching the game.
- `test_instant_saver.js`, `test_card_render.js`, `test_protection_equal.js` —
  the save/render/equality side.

All of them are plain `node <file>` with no arguments; all 13 must pass.

## Hard-won lessons (do not regress)

1. **`Object.create` is wrong for actions.** Some actions are *thunks* — their
   behaviour is a closure built in the constructor. `Object.create` skips the
   constructor and yields an empty shell that dispatches successfully and does
   nothing. Always build via `new proto.constructor(...)` (`buildAction`).
2. **Traps fire mid-constructor.** The object already carries base-class fields
   at that moment, so "it must have exactly N own fields" style validation always
   fails. Compare `constructor.name` against the discovered class name instead.
3. **Bump `CACHE_VERSION` in `detect.js`** whenever `discover()`'s output shape
   changes. The cache is keyed by bundle URL; without the version bump an old
   result loads and silently overwrites the seed, blanking every new field.
4. **Never send an unidentified command.** `hcn()` was sent on a guess that "no
   arguments ⇒ probably refresh". It is not a refresh; it is the client's reply
   to a server-initiated garage reload, and sending it out of band made the game
   load garage data that isn't the user's. Identify first.
5. **`modificationIndex` is 0-based**, the garage shows 1-based. And it is NOT
   `modificationCount` (that one is constant per item type).
6. **Augments are "Devices"** — the word "augment" does not exist in the bundle.
   `installed` persists per turret/hull whether mounted or not, so most installed
   devices belong to unmounted items. That's normal, not a join failure.
7. The **mount restriction** (`delayMountTimeMs`) is a deadline timestamp, not a
   rate limit; normally 0. The server enforces it regardless, so we check it only
   to fail fast with a clear message. There is no per-mount cooldown.

## Next steps, in the order the user asked for

### 0. Remove the shot-effect slot entirely — **DONE**

"אפקט ירייה … פשוט נתעלם ממנו לגמרי." `turretShotFx` is gone from the saver, the
state reader's combo object, the cleaner, the card, the cascade and the docs. The
per-item `shotSkin` read stays (it costs nothing and `res.mounted` still exposes
it). Saved combos are untouched — a stale `turretShotFx` key is simply ignored,
and the card renders nothing for it.

### 1. Protections — **DONE and confirmed live**

Implemented as `applyProtections()` in `main/garage_state.js`, reachable from the
console as `__CMB_TRY_PROTECTIONS`. See "Protections" above for the shape. Both
action constructors resolve by name with no manual bootstrap; the change persists
across a refresh; no flicker; no tab visit.

The diff from `equippers/protection_equipper.js` is preserved with the same
set-based semantics, now keyed on **ids** rather than names — which makes
`areProtectionsEqual` unnecessary on this path (it stays for the DOM fallback,
which still needs it).

### 2. Prove augments

Devices system: `GarageInsertDeviceClientAndServer(device, item)`,
`GarageRemoveDevice(device, item)` — both are data classes, so the same
`dataClass()` anchor applies and discovery is a two-line addition. Join a device
to its item by `baseItemId`.

The one real risk is **lazy loading**: `GarageLoadDevicesIfNotLoaded(item)` is
what the base-item mount thunk fires for turret/hull, and we do not fire it
because we dispatch the low-level mount instead. So a device may simply be absent
from state until that item's screen has been opened. Two ways out, decide when
testing: dispatch `GarageLoadDevicesIfNotLoaded` ourselves (it is a plain data
class → discoverable and subscribable, so probably resolvable by name), or find
the mount thunk via a trap and use it. `mountThunkClass` is already discovered
and in the SEED either way.

### 3. Then build the equipper

Only after 1 and 2 are proven live. Suggested shape: `core/instant_loader.js`
(new file, mirrors `instant_saver.js`), wired into `ViewRenderer.equipCombo` —
the single entry point, now triggered by a click anywhere on the combo card
except its top row. Keep `core/combo_loader.js` in the tree, wired to nothing,
as the automatic fallback if the native path fails (gen-2 combos still carry
`name`/`image`, so the DOM equipper can equip them; it just can't do the
decorative slots).

Order matters inside a combo: mount the base item before its augment.

## UI changes already made (by another agent) that the equipper must respect

- Click anywhere on the card = equip (except the top row); drag is distinguished
  by a 5px mouse-move threshold.
- `removedItems` now also carries `paint`, and removing a turret cascades to
  `turretAugment`. Removing a hull cascades to `hullAugment`.
- Skins are not separately removable — they ride along with their base item, so
  skip them when the base item is removed.
- A combo containing only decorative items is legitimate and is not auto-deleted,
  so the equipper must handle a combo with no tank parts at all.

## Git state

Branch `feature/instant-equip`, three commits landed:

- `9eaed05` state reader / POC
- `7b7a12d` instant save (gen-2 combos) + the protection-equality fix
- `ed6ca8a` the combo-card rework (click to equip, edit mode, new slots)

Uncommitted: the whole write path — `main/garage_state.js`, `isolated/detect.js`
— plus the shot-fx removal across the feature, and this file. Nothing pushed.
