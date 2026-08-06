# Packaging for the Chrome Web Store

**This file is the single source of truth for what goes into the uploaded ZIP.**
`build/make-zip.ps1` implements it. If you are an agent asked to "create a ZIP of
the extension", just run the script:

```powershell
powershell -ExecutionPolicy Bypass -File build/make-zip.ps1
```

It writes `build/dist/tanki-combos-qol-v<version>.zip` (version read from
`manifest.json`), prints the file list it packed, and fails loudly if anything on
the deny-list slipped in. Do not hand-roll a zip instead — the point of the script
is that the exclusions can't be forgotten.

## Why exclusions matter

Everything inside the uploaded package is readable by Chrome Web Store reviewers
and by anyone who unpacks the extension. Our internal docs contain the
reverse-engineering trail of Tanki's minified bundle, notes on how we hook the
game's render code, and a frank discussion of the risk that Google or Tanki
objects to this extension. **None of that should be distributed.** The privacy
policy is served from its hosted URL, not from inside the package.

## What ships

| Path | Why |
|---|---|
| `manifest.json` | required |
| `background.js` | service worker (translation fetch) |
| `shared/**` | UI components loaded by both features |
| `features/**` | both features' code, CSS, and the flag SVGs (the flags **are** loaded at runtime by the in-game language dropdown, via `web_accessible_resources`) |
| `assets/icons/icon16.png`, `icon48.png`, `icon128.png` | the three icon sizes the manifest declares |

## What must NOT ship

| Path | Reason |
|---|---|
| `CLAUDE.md` | internal agent guide: reverse-engineering trail, hooking details, CWS-risk discussion |
| `docs/**` | `PACKAGING.md` (this file), `STORE.md` (internal dashboard notes), `PRIVACY.md` (belongs at its hosted URL) |
| `build/**` | the packaging script itself |
| `HTML-examples/**` | captured game HTML/CSS samples — dev reference only, and large |
| `README.md` | public on GitHub already; not needed at runtime |
| `.git/**`, `.gitignore`, `.vscode/**` | version control / editor config |
| `assets/icons/icon.png`, `assets/icons/source-icon.png` | unreferenced legacy/master art |
| `assets/translate-icon.svg` | source art only — the toggle button's copy is inlined in `features/translator/main/toggle.js`, so nothing fetches this file at runtime |

## Before uploading — checklist

- [ ] **Bump `version` in `manifest.json`.** CWS rejects a re-upload of an
      existing version.
- [ ] Load unpacked and run the full manual test pass in `CLAUDE.md` → "Testing"
      (both features).
- [ ] Run the script and skim its printed file list.
- [ ] Host `docs/PRIVACY.md` publicly (GitHub Pages / Gist) and put that URL in
      the dashboard's **Privacy policy URL** field — mandatory now that the
      extension transfers chat text to a translation service.
- [ ] Update the dashboard's **Privacy practices** tab and permission
      justifications — every field's text is prepared in `docs/STORE.md`.
- [ ] Remember that the new `host_permissions` make Chrome **disable the
      extension for existing users until they re-approve**. Expect support
      questions right after the update rolls out; consider mentioning it in the
      listing's "What's new".
