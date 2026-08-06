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

## 2. Listing copy

**Name:** `Tanki Online — Combos & QoL`

**Short description (≤132 chars):**
> Save your Tanki Online combos and switch with one click — plus real-time battle
> chat translation, right on the game screen.

**Category:** Fun / Games

**Detailed description:**
> Quality-of-life tools for Tanki Online, in one extension.
>
> **⚙️ Combo manager**
> • Save your full setup — turret, hull, augments, drone, grenade, protections —
>   and equip it again with a single click.
> • A "COMBOS" tab right inside the garage, plus a quick-access button and the C
>   shortcut in the lobby.
> • Drag to reorder, rename, import/export, and a randomizer when you want the
>   game to pick for you.
> • Works in your game's language, and only ever equips items you own.
>
> **💬 Battle chat translation**
> • Foreign chat messages appear instantly, then swap to your language a moment
>   later — in place on the game screen, no second window.
> • Choose your language: English, Russian, Spanish, Portuguese, German, French,
>   Turkish, Polish and more.
> • The detected source language is shown (e.g. "[RU] »") so you always know what
>   was translated.
> • Universal gaming slang ("gg", "ez", "noob"…) is left as-is — no noise.
> • One tap, or Alt+T, switches the whole chat back to the original text.
> • Turn it off any time in the game's Settings screen; the combo manager keeps
>   working either way.
>
> No account, no ads. See the privacy policy for exactly what data is used (short
> version: your combos never leave your browser; only the text of a chat message
> you want translated is sent to a translation service).

**Screenshots to capture (1280×800 or 640×400):**
1. The COMBOS tab in the garage with several saved combo cards.
2. A combo being equipped / the lobby quick-access button.
3. A foreign chat message translated, showing the `[RU] »` prefix.
4. The in-game settings panel (translation toggle + language dropdown with flags).

## 3. Single-purpose statement

> The single purpose of this extension is to improve the player's quality of life
> in Tanki Online. It does this in the game's own interface: it lets players save,
> manage and instantly switch between full garage equipment setups ("combos"), and
> it translates the in-game battle chat into a language the player chooses,
> displayed in place on the game screen. Both functions serve the same purpose —
> reducing friction for the player inside a single game — and neither operates on
> any other website.

## 4. Permission justifications

| Field | Text to paste |
|---|---|
| `storage` | "Stores the user's own data locally: their saved equipment combos (names, order, contents) and their settings, including the chosen chat-translation language and on/off toggles. No personal or sensitive data is collected, and none of it is transmitted to us or to any third party." |
| Host `*://*.tankionline.com/*` | "The extension runs on the Tanki Online game page, which is the only site it works on. It needs page access to read which items are currently equipped, to inject its own UI (the COMBOS tab, lobby button, and the settings rows), and to read the game's own already-loaded script in order to locate the chat UI — which is minified and changes on every game update. The script is only parsed locally; nothing from it is transmitted." |
| Host `https://translate.googleapis.com/*` | "Sends the text of a battle-chat message to Google Translate to obtain its translation, which is then displayed in place on the game screen. Only the message text and the target language are sent." |
| Host `https://lingva.lunar.icu/*`, `https://lingva.ml/*` | "Fallback translation service (Lingva, a Google Translate proxy), used when the primary service is unavailable. Sends only the message text and the target language." |

**Remote code:** answer **No**. The extension fetches the game's own script **as
text and parses it** to find code locations; it never `eval`s or executes any
fetched code, and loads no external scripts. The translation calls return data
(JSON), not code.

## 5. Data-use disclosure ("Privacy practices" tab)

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
Host `docs/PRIVACY.md` publicly — GitHub Pages or a Gist both work — and paste
the URL. A URL is mandatory for any item that handles user data.

## 6. Upload checklist

See `PACKAGING.md` → "Before uploading". In short: bump the version, run
`build/make-zip.ps1`, host the privacy policy, update the two dashboard tabs
above, upload the zip.
