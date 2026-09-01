# Tanki Online — Combos & QoL — Agent Guide

A Chrome extension (Manifest V3) of quality-of-life tools for
[Tanki Online](https://tankionline.com). Published on the Chrome Web Store with
500+ users.

| Feature        | What it does                                               | Where it lives         |
| -------------- | ---------------------------------------------------------- | ---------------------- |
| **Combos**     | Save full equipment setups and equip them in one click     | `features/combos/`     |
| **Translator** | Translates foreign battle chat in place on the game canvas | `features/translator/` |
| **Advisor**    | Recommends protections mid-battle, from the enemy team      | `features/advisor/`    |

Combos and the translator are almost completely independent: different screens,
different JS worlds, different storage areas. They share only the UI components
in `shared/`. Keep it that way — a new feature is a new folder under
`features/`, not additions to an existing one. The advisor is the one deliberate
exception: it will equip through combos' own path rather than reimplement it, so
it depends on combos and **never the reverse**.

## Read this first

The detailed docs live in **`CLAUDE.mds/`**, one file per area. Read
**`CLAUDE.mds/README.md`** and pull only the file your task needs — that index
says exactly which one that is. Do not load them all.

## Critical rules (these apply to every task)

1. **Never guess game HTML or CSS.** The extension manipulates Tanki's live DOM
   and hooks its live code. If the existing code doesn't already show the
   structure or styling you need, check `HTML-examples/` and then **ask the
   developer** for the exact snippet. Game CSS hashes (`ksc-13574`) rotate every
   build and must never be used; semantic classes
   (`GameSettingsStyle-gameSettingsBlock`) are stable and may anchor.
2. **Comments are short.** Up to **10 words** per comment, up to **20 words** in
   a file header. A comment says _why_, never _what the next line does_. Long
   explanations belong in `CLAUDE.mds/`, not in the code — see
   `CLAUDE.mds/conventions.md`.
3. **Comments in Hebrew**, file starts with its own path, one file = one
   responsibility, target ≤150 lines. Vanilla JS only — no libraries, no build
   step. Details and the rest of the conventions: `CLAUDE.mds/conventions.md`.
4. **Load order in `manifest.json` is sacred.** Scripts load in the listed order;
   a file that isn't listed never loads. See `CLAUDE.mds/architecture.md`.
5. **Never delete working code to replace it.** Build the new path beside the old
   one, rewire to it, and move the old one into an `old/` folder next to it
   (`save/old/`, `equip/old/` are exactly this).
6. **Ship only what runs.** `CLAUDE.md`, `CLAUDE.mds/`, `docs/`, `HTML-examples/`
   and `build/` never go into the store zip — `docs/PACKAGING.md` is the source
   of truth and `build/make-zip.ps1` enforces it.
7. **Keep the docs current.** Structure changes go into
   `CLAUDE.mds/architecture.md`; anything a future agent would otherwise have to
   re-derive goes into the matching `CLAUDE.mds/` file.
8. **Every round of edits ends the same way**, release or not: update the
   harnesses in `build/harnesses/`, run them all, then run `build/make-zip.ps1`.
   The full checklist is in `CLAUDE.mds/conventions.md` — do not skip it because
   the change looked small.

## Quick facts

- **Three execution contexts**: ISOLATED world (most of combos + the translator's
  bridge/detect, has `chrome.*`), MAIN world (the game hooks, shares the page
  `window`), and the service worker (`background.js`, the only place allowed to
  read cross-origin responses).
- **Combos folders follow the flow**, not the file type: `discovery/`, `bridge/`,
  `capture/`, `save/`, `view/`, `equip/`, `migration/`, `randomizer/`, `dom/`.
  One rule keeps the worlds straight: **anything under a `game/` folder runs in
  MAIN**, everything else in ISOLATED.
- **Namespaces**: `window.TankiQoL` (ISOLATED, and the shared components in
  MAIN), `window.__CT` (translator internals, MAIN), `window.__CMB` (garage hook,
  MAIN), `window.__ADV` (battle probe, MAIN).
- **CSS prefix**: every class the extension creates starts with `cme_`.
- **Storage**: one key per feature. `savedCombos` and friends in `local`,
  `translator` in `sync`.
- **Testing** is the offline harnesses in `build/harnesses/` (`node <file>.js`,
  see rule 8) plus a manual pass in the game — the checklist is in
  `CLAUDE.mds/store.md`. Anything needing a real account or a live battle is
  manual-only.

## Repository layout

```
.
├── manifest.json          # 7 content-script blocks — see architecture.md
├── background.js          # service worker: the cross-origin translation fetch
├── CLAUDE.md              # this file
├── CLAUDE.mds/            # the detailed docs (start at README.md)
├── docs/                  # PACKAGING.md, PRIVACY.md, STORE.md
├── build/make-zip.ps1     # builds the store zip
├── build/harnesses/       # the offline checks — plain `node <file>.js`
├── shared/                # icons.js + components (drawer / switch / select)
├── features/combos/       # the combos feature — one folder per flow stage
├── features/advisor/      # recommended protections — recon / model / view
├── features/translator/   # the translator feature
├── assets/                # icons
└── HTML-examples/         # real game HTML & CSS samples (reference, never shipped)
```
