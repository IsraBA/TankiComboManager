# Feature: Advisor — recommended protections (POC)

**Status: reconnaissance.** `features/advisor/recon/game/` captures the battle
state and prints it; nothing is recommended, no UI, no equipping. The files are
marked POC and are meant to be deleted or rewritten once the model lands.

## The problem it solves

Mid-battle, players run to the garage to swap protections against the enemy
team's strongest turrets, then run back. Doing it well means having read the Tab
scoreboard carefully *before* entering the garage — which players routinely
forget, and then they pick badly and carry that for the rest of the battle. The
advisor reads what the client already knows and recommends the four modules
worth wearing.

## Designed to grow into full combo recommendation

The long-term plan is a "recommended combo" card in the combos tab, taking map
size, mode, enemy protections and the player's inventory into account. Two
structural decisions keep that cheap, and both must be preserved:

- **The output is combo-shaped** — the same object as `savedCombos[].data`.
  Today only `protection`; later the full set of slots. That makes "Equip all"
  literally `InstantLoader.equipCombo({data})`, inheriting the cooldown guard,
  the loading ring, protections-as-a-set and the Mk resolution for free, and
  makes the future card a `ComboCardRenderer` on a synthetic combo.
- **Facts and opinions are separate.** The snapshot holds only what the game
  says; the model holds every judgement. Growing means adding fields to the
  snapshot and rules to the scorer, never restructuring. The model must stay
  pure — no `chrome`, no DOM, no game objects — so a harness can run invented
  battles through it.

## What the battle state gives us

Four MAIN-world traps, same technique as the garage hook (last field the
constructor writes, validated by the class name inside its own `toString`).
Field names are read at runtime out of each object's `toString`, so only the
four trap fields are pinned to a build.

| class | trap field (1327298e) | what it carries |
|---|---|---|
| `BattleUsers` | `rq4_1` | the roster: `uids`, `teams`, `stats`, `gearScores`, `tankInfo`, `tankResistance`, `onlineUsers` |
| `BattleStatistics` | `ipw_1` | `mapName`, `mode`, `battleFormat`, **`isReArmorEnabled`**, `scoreLimit`, `battleLoaded` |
| `LocalBattleUserState` | `sq2_1` | **`weaponResistanceProperty`**, **`isReArmorTemporaryDisabled`** |
| `User` | `fqi_1` | our own profile — `id` identifies "me", and from that, who is an enemy |

Measured facts, each of which cost a round to learn:

- **`UserBattleStat` is a dead end.** It looks like exactly the Tab row we want
  and is never constructed, not even after pressing Tab. `BattleUsers` is the
  real source and it is populated without Tab ever being opened.
- **The battle state survives entering the garage mid-battle.** No snapshot
  mechanism is needed — the objects stay live while the player is in the garage,
  which is precisely when the recommendation is consumed.
- **`tankInfo` empties out temporarily** — on death, and while in the garage.
  Reading it naively yields `weapon: null` for everyone exactly when it matters
  most, so the probe caches equipment per player and falls back to the cache.
  Change detection compares against the cache too, or an empty-then-refilled
  map would read as "everyone changed equipment".
- **`teams` is absolute** (`TEAM_A` / `TEAM_B`), better than a relative
  "enemy" flag. `uids` keeps players who left; `onlineUsers` is real presence.
- **The three re-arm regimes are all readable**: `isReArmorEnabled` (may you
  swap at all in this battle), `isReArmorTemporaryDisabled` (have you already
  used your one swap), and the garage's own `delayMountTimeMs` cooldown.
- **`weaponResistanceProperty` tracks the turret you are actually holding**,
  live — it flipped to `TERMINATOR_RESISTANCE` when the player became a
  juggernaut in a special mode and back on death. It is the game telling us its
  own turret→resistance mapping for one turret at a time.

Enemy `tankInfo` carries `weaponBaseId`, `hullBaseId`, `weaponDeviceId` and
`hullDeviceId` — turret, hull and **both augments** — in the same id space as
the garage, so `__CMB`'s index resolves them to names. `tankResistance` even
gives each enemy's own modules with percentages, which the full-combo version
will want.

## Module → resistance

19 modules. The **game itself** states each module's resistance enum inside the
module item's `upgradeableParams` (`property = SHAFT_RESISTANCE` on Eagle), so
that half needs no table and no language assumptions.

The turret half comes from the wiki table below. **Do not map turret names to
enum names by string similarity** — six of them do not match:

| turret | enum |
|---|---|
| Isida | `ISIS_RESISTANCE` |
| Scorpion | `SCORPIO_RESISTANCE` |
| Vulcan | `MACHINE_GUN_RESISTANCE` |
| Hammer | `SHOTGUN_RESISTANCE` |
| Striker | `ROCKET_LAUNCHER_RESISTANCE` |
| Magnum | `ARTILLERY_RESISTANCE` |

Instead, compose: the game gives module→enum, the table gives module→turret,
and the two together give turret→enum with nothing guessed. The result is then
keyed on **`baseItemId`**, numeric and language-independent, because the turret
names the state returns are localized.

| module | protects from | module | protects from | module | protects from |
|---|---|---|---|---|---|
| Fox | Firebird | Lion | Ricochet | Vulture | Scorpion |
| Badger | Freeze | Shark | Vulcan | Griffin | Magnum |
| Ocelot | Isida | Dolphin | Smoky | Falcon | Railgun |
| Weasel | Tesla | Orka | Striker | Owl | Gauss |
| Wolf | Hammer | Grizzly | Thunder | Eagle | Shaft |
| Panther | Twins | Raven | Tsunami | Spider | Mine |

There is **exactly one module per turret**: 19 modules minus Armadillo
(critical) and Spider (mines) leaves 17, and the garage holds 17 turret
families. A turret with no module would be a new turret, and it is worth
noticing if that count ever stops matching.

### The composed table

Turret `baseItemId` → resistance enum. The ids are what enemy `tankInfo`
reports directly, so nothing is resolved through a localized name at runtime.

| baseItemId | turret | enum |
|---|---|---|
| 920009630983 | Firebird | `FIREBIRD_RESISTANCE` |
| 920009631074 | Freeze | `FREEZE_RESISTANCE` |
| 920009630913 | Isida | `ISIS_RESISTANCE` |
| 921009714084 | Tesla | `TESLA_RESISTANCE` |
| 920009631046 | Hammer | `SHOTGUN_RESISTANCE` |
| 920009630997 | Twins | `TWINS_RESISTANCE` |
| 920009631088 | Ricochet | `RICOCHET_RESISTANCE` |
| 920009631144 | Vulcan | `MACHINE_GUN_RESISTANCE` |
| 920009630969 | Smoky | `SMOKY_RESISTANCE` |
| 920009630990 | Striker | `ROCKET_LAUNCHER_RESISTANCE` |
| 920009631123 | Thunder | `THUNDER_RESISTANCE` |
| 1931009780251 | Tsunami | `TSUNAMI_RESISTANCE` |
| 931009771122 | Scorpion | `SCORPIO_RESISTANCE` |
| 920009630976 | Magnum | `ARTILLERY_RESISTANCE` |
| 920009631011 | Railgun | `RAILGUN_RESISTANCE` |
| 920009631151 | Gauss | `GAUSS_RESISTANCE` |
| 920009631158 | Shaft | `SHAFT_RESISTANCE` |

Verified two ways against a captured battle: every module's enum came from the
game and matched the wiki table on all 19, including the six that do not match
by name; and every turret id observed on an enemy resolved to the expected name
on the same player, 16 for 16. The one apparent contradiction was a player who
genuinely swapped turret mid-battle (Hammer → Isida), which an ordered trace
confirmed — worth knowing, because a set-based check reports that as a
mismatch.

`TERMINATOR_RESISTANCE` exists and belongs to the juggernaut, which is not a
garage turret and has no module. `ALL_RESISTANCE` is the unique modules.

## Product rules

- **Armadillo protects against critical damage** (`CRITICAL_RESISTANCE`) and is
  the most valuable module in the game. If the player owns it **above 35%**, it
  is always recommended in the first slot, and the other three go to the enemy's
  turrets and augments.
- **Spider (mine protection) is never recommended.** It guards against mines
  rather than any turret, so it falls outside the model.
- **Unique modules (Spectrum and friends) are out of scope.** They occupy all
  four slots and almost nobody owns one.
- Some enemy augments are support/healing, which makes taking a protection
  against that turret pointless. A short hard-coded list, deliberately left for
  last.
