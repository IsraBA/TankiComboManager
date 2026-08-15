# Store, packaging and testing

## Chrome Web Store

The extension is published and has 500+ users, so store hygiene matters.

- The extension changes how a third-party page behaves, which reviewers read
  closely. Describe it plainly and accurately: the listing text and the
  permission justifications in `docs/STORE.md` are written to match what the code
  actually does, and **must be updated whenever the code's behaviour changes**.
  An accurate description is also the extension's best defence if anyone asks
  what it does.
- The translator **sends chat text to a third-party translation service**, so the
  dashboard's Privacy practices tab must declare *website content* and *personal
  communications*, and a hosted privacy-policy URL is **mandatory**. The
  paste-ready texts are in `docs/STORE.md`; the policy itself is
  `docs/PRIVACY.md`, served from the public GitHub repo — its URL is the one in
  the CWS listing, so edits there go live immediately.
- Adding hosts to `host_permissions` is a privilege increase, so **Chrome
  disables the extension for every existing user until they re-approve it**. That
  was a deliberate, accepted trade-off for the translation hosts — don't "fix" it
  by making them optional without asking the developer.
- **Bump `version` in `manifest.json` for every upload**; CWS rejects re-uploads
  of the same version.

## Packaging

`docs/PACKAGING.md` is the single source of truth for what ships;
`build/make-zip.ps1` implements it and refuses to build if anything forbidden
slips in.

`CLAUDE.md`, `CLAUDE.mds/`, `docs/`, `HTML-examples/` and `build/` **never** go
into the zip. The package contains exactly the files the extension loads and
nothing else: it keeps the upload small, and it keeps what a reviewer inspects
identical to what actually executes. (The repository is public, so this is about
a clean package, not secrecy — `HTML-examples/` alone is several MB of
development reference no user needs.)

Run it from the project root at the end of a round of edits:

```
powershell -ExecutionPolicy Bypass -File build/make-zip.ps1
```

The zip lands in `build/dist/tanki-combos-qol-v<version>.zip`.

## Testing (manual)

1. `chrome://extensions/` → enable Developer Mode.
2. "Load unpacked" → select this directory.
3. Open [Tanki Online](https://tankionline.com) and sign in.
4. **Combos**: enter the garage; the COMBOS tab appears; save a combo; equip it
   (should be instant, no tab walking, no flicker); reorder by drag; delete;
   randomizer; import/export; the `C` shortcut in the lobby. Check that the 3D
   tank model still renders, survives a window resize, and can be drag-rotated
   while the combos tab is open.
5. **Translator**: enter a battle; foreign chat should show original → spinner →
   `[SRC] » translation`. Check the toggle button next to the chat alert button
   and Alt+T. Open the game's Settings screen and confirm the injected toggle +
   language dropdown are there and styled natively. Resize / toggle fullscreen
   and confirm no duplicate chat lines.
6. After code changes: click the refresh icon on the extension card, then reload
   the game tab.

Before any release, also run the offline harnesses (`debugging.md`) — they cover
the discovery and write logic that manual testing can only sample.
