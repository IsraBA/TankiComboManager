# Tanki Online Combo Manager — Agent Guide

## Project Overview

A Chrome extension (Manifest V3) for [Tanki Online](https://tankionline.com) that lets players save and load full equipment setups ("combos") with one click. It injects UI into the game's garage and lobby screens via content scripts and manipulates the DOM to scan equipped items and equip saved combos.

## Project Structure

```
TankiComboManager/
├── manifest.json              # Extension manifest — defines load order (critical!)
├── main.js                    # Entry point — MutationObserver orchestrator
├── lib/
│   ├── constants.js           # Centralized DOM selectors and config values
│   ├── utils.js               # Shared utility functions
│   └── language_manager.js    # Auto-detects game language from UI text
├── core/
│   ├── combo_saver.js         # Scans current equipment and saves to storage
│   ├── combo_loader.js        # Reads saved combo and equips items
│   ├── combo_cleaner.js       # Cleans up stale/invalid combo data
│   ├── tab_navigator.js       # Navigates between garage tabs (including COMBOS tab)
│   ├── navigation_helpers.js  # Smart DOM waiting (MutationObserver-based)
│   ├── auto_navigator.js      # Auto-navigates to combos tab when relevant
│   ├── scanners/
│   │   ├── base_item_scanner.js     # Scans turrets, hulls, grenades, drones
│   │   ├── augment_scanner.js       # Scans augments (modifications)
│   │   ├── protection_scanner.js    # Scans 4 protection module slots
│   │   └── paint_scanner.js         # Scans equipped paint/skin
│   ├── equippers/
│   │   ├── base_item_equipper.js    # Equips turrets, hulls, grenades, drones
│   │   ├── augment_equipper.js      # Equips augments
│   │   └── protection_equipper.js   # Equips protection modules
│   └── randomizer/
│       ├── randomizer.js            # Randomizer orchestrator — loads settings, delegates to mode
│       ├── random_from_saved.js     # Picks random saved combo and equips it
│       ├── random_full.js           # Full random algorithm — navigates tabs, picks items
│       └── item_list_scanner.js     # Scans all purchased items/augments in current tab
├── ui/
│   ├── menu_injector.js       # Injects "COMBOS" tab into garage menu
│   ├── view_renderer.js       # Renders combo list view, binds events
│   ├── combo_card_renderer.js # Renders individual combo cards with item previews
│   ├── combo_drag_handler.js  # Drag-and-drop reordering of combos
│   ├── delete_combo_modal.js  # Deletion confirmation modal with animation
│   ├── lobby_button_injector.js  # Injects quick-access button in lobby
│   ├── lobby_shortcut_handler.js # Keyboard shortcut (C key) in lobby
│   ├── randomizer_settings.js    # Randomizer settings drawer content
│   ├── randomizer_settings.css   # Randomizer settings drawer styles
│   ├── import_export.js          # Import/export combos logic and modals
│   ├── import_export.css         # Import/export button and modal styles
│   └── components/
│       ├── drawer/
│       │   ├── drawer.js            # Generic drawer component (side panel + overlay)
│       │   └── drawer.css           # Drawer styles
│       ├── switch/
│       │   ├── switch.js            # Toggle switch component (game settings style)
│       │   └── switch.css           # Switch styles
│       └── select/
│           ├── select.js            # Dropdown component (game DropDownStyle)
│           └── select.css           # Select styles
├── styles.css                 # Main extension styles
├── combo_card.css             # Combo card styles
├── ui/
│   ├── lobby_button.css       # Lobby button styles
│   └── delete_combo_modal.css # Delete modal styles
└── HTML-examples/             # Game HTML & CSS samples (see Rule 1)
    ├── augment/
    ├── drawer/
    ├── drones/
    ├── grenades/
    ├── hulls/
    ├── protection/
    ├── settings/
    └── turrets/
```

## Critical Rules

### 1. Never Guess Game HTML or CSS

The extension manipulates Tanki Online's live DOM. **When developing a feature that requires knowledge of the game's current HTML structure and it's not clear from the existing code how to do it — ask the developer for the relevant HTML snippet.** Do not guess selectors or HTML structure.

The same applies to styling: the extension is designed to look **native and seamless** within the game — not like an obvious third-party addition. **When a feature needs to visually match the game's look and feel, and the existing code doesn't already show how that element is styled — ask the developer for the exact CSS from the game**, including hover effects, transitions, colors, fonts, and any other visual details. Never guess how game elements are styled.

**Reference: `HTML-examples/`** — This directory contains real HTML and CSS samples captured from the game's UI, organized by category (turrets, hulls, augments, etc.). When you need to understand how a game element is structured or styled, **check the relevant folder in `HTML-examples/` first** before asking the developer. These samples can answer many questions about the game's DOM structure, layout patterns, and visual styling.

**Important: game CSS classes are auto-generated** — The game dynamically generates its CSS class names on each build (e.g., `ksc-13574`). These class names change frequently and **must never be used directly in extension code**. Instead, create new classes with the `cme_` prefix that replicate the game's exact styling (colors, fonts, hover effects, transitions, etc.) by inspecting the computed styles in the `HTML-examples/` samples.

### 2. Keep Code Modular and Clear

- Each file has a single, well-defined responsibility.
- Scanners only read; equippers only write; navigators only move.
- UI modules handle rendering and events; core modules handle logic.

### 3. Hebrew Comments

Add short, descriptive comments **in Hebrew** before code sections explaining what they do.

### 4. File Header Convention

Every new file must start with:
```javascript
// path/to/file.js

// תיאור קצר של מה הקובץ עושה
```
For example:
```javascript
// core/scanners/paint_scanner.js

// סורק את הצבע/סקין המורכב כרגע על הטנק
```

### 5. No External Libraries

This project intentionally uses **vanilla JavaScript only**. Do not introduce any external frameworks, libraries, or build tools.

### 6. Load Order in manifest.json is Sacred

Scripts load as content scripts in the exact order listed in `manifest.json`. Dependencies must load before the modules that use them. **Do not reorder entries without understanding the dependency chain:**
1. `lib/` (constants, utils, language) — no dependencies
2. `core/` (cleaner, navigator, scanners, equippers, saver, loader, helpers) — depend on lib
3. `ui/` (injectors, renderers, handlers) — depend on core + lib
4. `main.js` — always last, orchestrates everything

When adding a new file, insert it in the correct position and add it to `manifest.json`.

### 7. Keep CLAUDE.md Up to Date

When making changes to the project structure (adding, removing, or renaming files/folders), **update the project structure tree and any other relevant sections in this file** to reflect the new state.

## Architecture Patterns

### Module Pattern (IIFE + Namespace)

Every module follows this exact pattern:
```javascript
(function () {
    'use strict';
    window.TankiComboManager = window.TankiComboManager || {};

    // ... private functions ...

    window.TankiComboManager.ModuleName = {
        publicMethod1,
        publicMethod2
    };
})();
```
All components are singletons on the `window.TankiComboManager` namespace. Access other modules via `window.TankiComboManager.OtherModule`.

### Centralized DOM Selectors

All CSS selectors for the game's DOM are defined in `lib/constants.js` as `window.TankiComboManager.DOM`. When the game updates its HTML/class names, only this file needs to change. **Never hardcode game selectors elsewhere.**

### Smart Waiting (Not Fixed Delays)

Use `NavigationHelpers.waitForDOMChange()` (MutationObserver + debounce) instead of `setTimeout` with fixed delays. This makes the extension resilient to varying load times. Only use short `sleep()` calls (≤50ms) where game animations need time to complete.

### CSS Class Prefix

All extension CSS classes use the `cme_` prefix (Combo Manager Extension) to avoid collisions with Tanki's own classes. Always use this prefix for new classes.

### Native Look & Feel

The extension's UI is designed to blend seamlessly with Tanki Online's interface. New UI elements must visually match the game's existing style — same colors, fonts, hover effects, transitions, and layout patterns. When existing code doesn't cover the styling of a new element, ask the developer for the game's exact CSS before implementing.

### Language Support

`LanguageManager` auto-detects the game language from UI text (supports 11 languages). Use `LanguageManager.getUIText()`, `getEquipButtonText()`, and `getTabName()` for any user-facing or game-matching strings. Never hardcode language-specific text.

### Chrome Storage Format

Combos are stored in `chrome.storage.local` under the key `savedCombos` as an array:
```javascript
{
    id: Number,              // timestamp-based unique ID
    name: String,            // user-editable combo name
    date: String,            // locale date string
    order: Number,           // display order (0 = top)
    language: String,        // language code at save time
    data: {
        turret:        { name, image },
        turretAugment: { name, image },
        hull:          { name, image },
        hullAugment:   { name, image },
        grenade:       { name, image },
        drone:         { name, image },
        protection:    [{ name, image }, ...]  // 4 slots
    },
    removedItems: {}         // optional: items to skip during equip
}
```

### Async Patterns

Core operations (save, load, equip) use **async/await** with Promises. Chrome storage calls use the callback API (not promisified). Keep this consistent.

### Error Handling

The extension uses **graceful degradation**: log warnings to console but continue execution. If an item can't be found or equipped, skip it and move on. Never block the user or show alerts for non-critical errors.

## Testing

There are no automated tests. To test changes:
1. Go to `chrome://extensions/` and enable Developer Mode
2. Click "Load unpacked" and select the project directory
3. Open [Tanki Online](https://tankionline.com), enter the garage
4. Test the specific feature you changed
5. After code changes, click the refresh icon on the extension card and reload the game tab
