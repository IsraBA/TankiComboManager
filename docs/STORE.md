# Chrome Web Store dashboard — paste-ready texts

Internal cheat sheet for the Developer Dashboard. Everything here is meant to be
copied into a dashboard field. **This file never ships** — see `PACKAGING.md`.

The extension is already published with 500+ users, so this is an *update*, not a
new listing. The update adds the chat-translation feature, which changes three
things the dashboard cares about: the name, the permissions, and — for the first
time — the fact that user data is transferred to a third party.

## 1. Read this first: what changes for existing users

Adding `translate.googleapis.com` and the Lingva hosts to `host_permissions` is a
**privilege increase**. Chrome's behaviour on such an update is not negotiable:

- The update installs silently in the background, then Chrome **disables the
  extension** for every existing user.
- Nothing pops up. The only signal is a badge on the toolbar's puzzle icon; the
  user must open it and click **"Accept permissions"** (or "Enable") to get the
  extension back.

This was a deliberate, accepted trade-off (the alternative — optional permissions
plus an opt-in popup — was considered and rejected as too much complexity). Plan
for it:

- Mention it in the listing / "What's new": *"This update adds chat translation.
  Chrome will ask you to approve the new permission — click the extensions (puzzle)
  icon and accept, and the extension will be back to normal."*
- Expect a burst of "it stopped working" reviews/emails right after rollout. The
  answer is the sentence above.

## 2. The "Store listing" tab

**Name** and **Summary** are taken from `manifest.json` (`name` / `description`)
and update themselves when the new package is uploaded — nothing to type. The
summary is 131 of the allowed 132 characters, so if you ever edit the manifest
description, re-check that it still fits.

**Category:** Games. **Language:** English.

### Detailed description

⚠️ The description that was live described a combos-only extension and stated
"Does not work in battles". That is **no longer true** — chat translation runs in
battle. Replace the whole field with the text below (891 of 16,000 chars).

Keep it short. Nobody reads a wall of marketing copy on a store page, and the
screenshots carry the detail anyway.

```
COMBOS
Save a full garage setup - turret, hull, both augments, drone, grenade, protections - and equip it again in one click. Name and reorder your combos, skip individual slots, import/export, or let the randomizer choose. Open it from the garage menu, or press C in the lobby.

CHAT TRANSLATION
Foreign battle chat, translated in place on the game screen. Pick your language in the game's Settings. Alt+T switches back to the original, and you can turn translation off entirely - combos keep working.

Free, no ads, no account, no automation and no gameplay advantage. Your combos stay in your browser; the only thing that ever leaves it is the text of a message being translated.

Updating from an older version? Chrome disables the extension until you approve the new permission - click the puzzle icon in your toolbar and accept. Once, and you're done.

Bugs or ideas - Discord: isra760
```

Three things in there are not padding and should survive future edits: the
permission paragraph (a service notice — without it the update reads as "the
extension broke"), the one-line privacy statement (heads off "wait, you send my
chat where?"), and "no gameplay advantage" (it matters in a game community).

Two claims from the old description were deliberately dropped:

- *"Works only in the Garage & Lobby / Does not work in battles"* — false now. The
  replacement scopes the claim to the combo manager and describes exactly what
  the translator does in battle.
- *"Officially approved by Tanki"* — whatever approval was given covered a
  garage-only tool. Only put it back after confirming with them that it still
  covers an extension that reads and redraws battle chat.

### Screenshots (up to 5, 1280×800 or 640×400)

The listing has no translation screenshot yet, and that is the feature nobody has
seen. Worth capturing:

1. The COMBOS tab in the garage with several saved combo cards.
2. A combo being equipped, or the lobby quick-access button.
3. A foreign chat message translated, showing the `[RU] »` prefix.
4. The in-game settings panel (translation toggle + language dropdown with flags).

### Additional fields (currently empty — worth filling)

| Field | Value |
|---|---|
| Homepage URL | `https://github.com/IsraBA/TankiCombosQoL` |
| Support URL | `https://github.com/IsraBA/TankiCombosQoL/issues` |

Both are free credibility: they show the extension is open source and give users
somewhere to report bugs. The *official* URL field needs domain ownership proven
in Search Console — skip it. The promo images (440×280, 1400×560) are optional
and only affect featuring.

## 3. The "Privacy" tab, field by field

The dashboard's Privacy tab has **one** justification box for host permissions —
not one per host — so the text below covers all four hosts together. Each block
is sized to fit its 1,000-character limit.

### "Single purpose description"  (546 chars)

```
The single purpose of this extension is to improve the player's quality of life in Tanki Online, inside the game's own interface. It lets players save, manage and instantly switch between full garage equipment setups ("combos" of turrets, hulls, augments, drones, grenades and protections), and it translates the in-game battle chat into a language the player chooses, displayed in place on the game screen. Both functions serve the same purpose - reducing friction for the player inside a single game - and neither operates on any other website.
```

### "storage justification"  (455 chars)

```
The storage permission is used to save the user's own data: their saved garage combos (names, order, contents) and their preferences, including the chat translation on/off toggles and the chosen target language. Combos are stored locally in the browser; the few small preferences use Chrome's sync storage so they follow the user's own browser profile. No personal or sensitive data is collected, and none of this data is sent to us or to any third party.
```

### "Host permission justification"  (808 chars)

```
tankionline.com: the extension runs only on the Tanki Online game page. It needs page access to read which items are currently equipped, to inject its own UI into the garage, lobby and settings screens, and to read the game's own already-loaded script in order to locate the chat UI, which is minified and changes with every game update. That script is only read and parsed locally; nothing from it is transmitted.

translate.googleapis.com, lingva.lunar.icu, lingva.ml: to translate a battle-chat message, the text of that message is sent to a translation service and the result is displayed in place on the game screen. Only the message text and the user's chosen target language are sent. Lingva is a fallback used when the primary service is unavailable. The extension does not access any other websites.
```

### "Are you using remote code?"

Select **"No, I am not using remote code."** The extension fetches the game's own
script **as text and parses it** to find code locations; it never `eval`s or
executes fetched code, and loads no external scripts. The translation calls
return data (JSON), not code. Leave the justification box empty.

## 4. Data-use disclosure (same tab, "Data usage" section)

This is the part that **changes** with this update. Previously the extension
declared no data collection; that is no longer accurate, because chat text is now
transferred to a translation service. Declare honestly:

Tick these categories:

- **Website content** — YES. The text of chat messages is handled and is
  **transferred to a third party (the translation service) in order to provide the
  core feature**. This transfer is disclosed in the privacy policy and is
  necessary for the feature to function, which CWS permits.
- **Personal communications** — YES. Chat messages can be considered personal
  communications; disclose on the same "used only to provide the translation
  feature" basis.

Leave **unticked**: personally identifiable information, health, financial,
authentication, location, web history, user activity.

Then affirm the three required certifications — all three hold truthfully:

- *Not selling or transferring data to third parties for purposes unrelated to the
  item's single purpose* — the translation transfer **is** the purpose, so this
  holds.
- *Not using or transferring data to determine creditworthiness or for lending.*
- *Complying with the Developer Program Policies.*

**Privacy policy URL:** required now (it was previously allowed to be empty).
The repository is public and GitHub renders Markdown, so the policy is already
served — paste this, no hosting setup needed:

```
https://github.com/IsraBA/TankiCombosQoL/blob/main/docs/PRIVACY.md
```

It stays in sync automatically: editing `docs/PRIVACY.md` and pushing updates the
published policy. (If a cleaner page is ever wanted, enable GitHub Pages — but
note that publishing the whole `docs/` folder would also serve this file and
`PACKAGING.md` as web pages.)

## 5. Upload checklist

See `PACKAGING.md` → "Before uploading". In short: bump the version, run
`build/make-zip.ps1`, host the privacy policy, update the two dashboard tabs
above, upload the zip.
