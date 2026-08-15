# Code conventions

## Comments

**Up to 10 words per comment. Up to 20 words in a file header.** That is a hard
budget, not a guideline.

- A comment explains **why**, or names a non-obvious trap. It never narrates what
  the next line already says.
- Anything that needs a paragraph is not a comment — it is documentation. Put it
  in the matching `CLAUDE.mds/` file and, if the code needs a pointer, write one
  short line: `// הרציונל: CLAUDE.mds/combos.md`.
- Comments are **in Hebrew**. (The translator's files were written in English as
  a separate project; new code in them should be Hebrew, existing English text
  may stay.)
- Keep the one-line section separators (`// ---- הגנות ----`). They are cheap and
  make a long file scannable.
- **No commented-out code.** Git remembers it.
- **The extension prints nothing at runtime.** No `console.log`, no
  `console.warn`. The only permitted call is **`console.error`, and only for an
  unexpected total failure** — a thrown exception, or a piece of the game's DOM
  we depend on being absent (e.g. a garage tab that isn't there). Anything that
  can legitimately happen — the user doesn't own an item, a combo has no
  protections, a slot fell back to the DOM path — is **not** an error and is not
  logged. Return a value and let the caller decide.

Why the budget: this codebase went through a phase of 30-line block comments
that duplicated the docs, drifted from them, and buried the code. If a future
change makes a comment wrong, the comment is the bug.

## Files

- Every file starts with **its own path**, then one short line saying what it is:
  ```javascript
  // features/combos/core/scanners/protection_scanner.js

  // סורק את מודולי ההגנה המורכבים כרגע
  ```
  For a file that runs in a specific JS world, note it on the path line:
  `// features/translator/main/chat.js  [MAIN world]`.
- **One file, one responsibility. Target ≤150 lines.** A little over is fine; a
  file that keeps growing is telling you it holds two things.
- Scanners only read, equippers only write, navigators only move, UI modules
  render and bind, core modules hold logic.
- A new feature is a new folder under `features/`. Only genuinely cross-feature
  code goes in `shared/`, and nothing in `shared/` may *require* a feature.
  (Known soft spot: `drawer.js` reads its close-button label from
  `TankiQoL.LanguageManager` and falls back to `"Close"`. Safe today because the
  drawer is only loaded in the combos block; if another feature needs it, pass
  the label in as an option instead of deepening that dependency.)
- Adding a file means adding it to `manifest.json` in the right position — see
  `architecture.md`.

## Splitting a big module

Two patterns are already in use; prefer them over inventing a third.

- **Object mixins** (UI): the base file creates the namespace object, and each
  extra file does `Object.assign(window.TankiQoL.ViewRenderer, { … })`. Call
  sites and `this` are unchanged. See `ui/view/` and `ui/card/`.
- **Shared internals object** (the MAIN-world garage hook): every file does
  `const I = (NS.internals = NS.internals || {})` and hangs its state and
  functions there, reading `I.x` at call time so load order only has to satisfy
  *runtime* dependencies. See `main/garage/`.

## JavaScript

- **Vanilla JS only.** No frameworks, no libraries, no build step. Content
  scripts can't use ES modules, so modules share namespace objects on `window`
  (see `architecture.md`).
- Every module is an IIFE singleton:
  ```javascript
  (function () {
      'use strict';
      window.TankiQoL = window.TankiQoL || {};
      // ... private ...
      window.TankiQoL.ModuleName = { publicMethod };
  })();
  ```
- Core operations (save, load, equip) use **async/await**; `chrome.storage` calls
  use the **callback** API — keep that consistent.
- **Graceful degradation**: log a warning and continue. If an item can't be found
  or equipped, skip it and move on. Never block the user, never alert.
- Prefer `NavigationHelpers.waitForDOMChange()` (MutationObserver + debounce)
  over fixed `setTimeout` delays. Short `sleep()` (≤50 ms) is fine where a game
  animation genuinely needs time.

## UI and styling

- **All extension CSS classes are prefixed `cme_`** — collisions with Tanki's own
  classes and with other extensions are real (users do run several).
- New UI must look native: same colors, fonts, hover effects, transitions,
  spacing. When the existing code doesn't cover it, ask for the game's exact CSS
  (rule 1 in `../CLAUDE.md`).
- User-facing strings go through `LanguageManager.getUIText()` and must be added
  to **all 11 languages**. The English → key fallback is a safety net, not a
  licence to skip translations.

## Editing files in bulk

The source is **UTF-8 without BOM and full of Hebrew comments**. Windows
PowerShell 5.1 reads such a file as ANSI, so a `Get-Content` → `Set-Content`
round-trip silently double-encodes every Hebrew character (it happened; 11 files
turned to mojibake in one command). If you must rewrite files from a script, be
explicit in both directions:

```powershell
$utf8 = New-Object System.Text.UTF8Encoding($false)   # no BOM
$raw  = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($path, $new, $utf8)
```

Preserve the file's existing line endings, and check afterwards: a file
containing `×` followed by another high byte is corrupted. Prefer the editing
tools over scripted rewrites whenever the change is small enough.

## Git

- Commit messages in English, descriptive body, and:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- Run `build/make-zip.ps1` at the end of a round of edits (manually — not from a
  hook).
