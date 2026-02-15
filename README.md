# Tanki Online Pro Combo Manager

<div align="center">
  <img src="icons/icon128.png" alt="Tanki Online Pro Combo Manager" width="128" height="128">

  **Browser extension for Tanki Online equipment management**

  [![Version](https://img.shields.io/badge/version-2.0-blue.svg)](manifest.json)
  [![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)](manifest.json)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Architecture](#-project-architecture)
- [Core Components](#-core-components)
- [Technical Details](#-technical-details)
- [Development](#-development)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Tanki Online Pro Combo Manager** is a browser extension for saving and loading full equipment setups (combos) in Tanki Online. Switching gear in the garage means opening many tabs and menus; this extension saves your current setup and equips a saved combo in one click.

---

## ✨ Features

### Core Functionality

#### 🎮 Combo Management

- Save current setup: scans and saves your full equipment configuration
- Load combos: one-click equip with automated tab navigation
- Storage in Chrome local storage; no limit on number of combos
- Detects equipped items, augments, and protection modules

#### 🎨 UI

- Combo cards show all equipment; drag and drop to reorder
- Item preview images on each card; UI refreshes when you save or load

#### ⚡ Quick Access

- "COMBOS" tab in the garage menu; quick-access button in lobby
- Press `C` in lobby to open the combo manager (only on garage/lobby screens)

#### 🔧 Other

- Turret and hull augments; all 4 protection slots with resistance types
- Drones and grenades; follows game language; optional "remove item" per slot for partial loads

### Equipment Coverage

The extension manages all major equipment categories:

| Category             | Description                          | Special Features                     |
| -------------------- | ------------------------------------ | ------------------------------------ |
| **Turrets**    | Main weapon (e.g., Hammer, Railgun)  | Includes augment support             |
| **Hulls**      | Tank chassis (e.g., Hunter, Mammoth) | Includes augment support             |
| **Drones**     | Support units                        | Special name cleaning for variations |
| **Grenades**   | Tactical equipment                   | Included                             |
| **Protection** | Defense modules (4 slots)            | Resistance type detection            |
| **Augments**   | Equipment modifications              | Separate management per turret/hull  |

---

## 🚀 Installation

### Prerequisites

- Google Chrome, Microsoft Edge, or any Chromium-based browser
- An active Tanki Online account
- Access to `*.tankionline.com`

### Installation Steps

#### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**

   ```bash
   git clone https://github.com/IsraBA/TankiComboManager.git
   cd TankiComboManager
   ```
2. **Open Chrome Extensions Page**

   - Navigate to `chrome://extensions/`
   - Or click: Menu → More Tools → Extensions
3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top right corner
4. **Load the Extension**

   - Click "Load unpacked"
   - Select the `TankiComboManager` folder
   - The extension icon should appear in your toolbar

#### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for easy installation.

### Verification

1. Visit [Tanki Online](https://tankionline.com)
2. Log in to your account
3. Navigate to the garage
4. You should see a new "COMBOS" tab in the garage menu

---

## 📖 Usage

### Getting Started

#### 1. Saving Your First Combo

1. **Equip Your Desired Setup**

   - In the Tanki Online garage, manually equip your desired turret, hull, drone, grenade, augments, and protection modules
2. **Open Combo Manager**

   - Click on the "COMBOS" tab in the garage menu
   - Or press `C` key while in the lobby
3. **Save Current Setup**

   - Click the "Save Current Combo" button
   - A new combo card will appear with your equipment
4. **Rename Your Combo**

   - Click on the combo name (e.g., "Combo 1")
   - Enter a descriptive name (e.g., "Sniper Setup")
   - Press Enter to save

#### 2. Loading a Combo

1. **Navigate to COMBOS Tab**

   - Open the garage and click "COMBOS" tab
2. **Select Your Combo**

   - Find the combo you want to equip
   - Click the "Equip" button on the combo card
3. **Automated Process**

   - The extension will automatically:
     - Navigate through all equipment tabs
     - Find and equip each item
     - Apply augments and protection modules
     - Return to the Protection tab when complete

#### 3. Managing Combos

**Reorder Combos**

- Click and hold a combo card
- Drag it to your desired position
- Release to drop

**Delete a Combo**

- Click the delete (×) button on the combo card
- Confirm deletion in the popup

**Remove Items from Combo**

- Click the (×) icon on individual item images within a combo card
- The item will be marked as "removed" and skipped during equipment
- Useful for partial combo changes

### Keyboard Shortcuts

| Key   | Action             | Context           |
| ----- | ------------------ | ----------------- |
| `C` | Open Combo Manager | Lobby screen only |

### Tips & Best Practices

1. **Organize by Game Mode**: Create combos for different game modes (TDM, CTF, CP)
2. **Name Descriptively**: Use clear names like "Siege Tank" or "Speed Raider"
3. **Check Ownership**: The extension will only equip items you own
4. **Update Combos**: Re-save combos after upgrading equipment to keep them current
5. **Drag to Prioritize**: Put your most-used combos at the top

---

## 🏗️ Project Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         main.js                              │
│              (Orchestrator & Initialization)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│   CORE LAYER    │            │    UI LAYER      │
│                 │            │                  │
│ • combo_saver   │◄──────────►│ • menu_injector  │
│ • combo_loader  │            │ • view_renderer  │
│ • scanners/     │            │ • combo_card     │
│ • equippers/    │            │ • drag_handler   │
│ • navigators    │            │ • lobby_button   │
└────────┬────────┘            └────────┬─────────┘
         │                              │
         │      ┌──────────────┐        │
         └─────►│  LIB LAYER   │◄───────┘
                │              │
                │ • constants  │
                │ • utils      │
                │ • language   │
                └──────────────┘
```

### Data Flow

#### Saving a Combo

```
User Click "Save" → ComboSaver.saveCurrentCombo()
  ↓
TabNavigator.navigateToTab('Turrets')
  ↓
BaseItemScanner.scanItem() → detects equipped turret
  ↓
AugmentScanner.scanAugment() → detects equipped augment
  ↓
[Repeat for: Hulls, Grenades, Drones, Protection]
  ↓
ComboSaver.saveToStorage() → chrome.storage.local
  ↓
ViewRenderer.renderCombos() → Update UI
```

#### Loading a Combo

```
User Click "Equip" → ComboLoader.equipCombo(combo)
  ↓
BaseItemEquipper.equipItem(turret) → navigate + find + click
  ↓
AugmentEquipper.equipAugment() → open augments + find + click
  ↓
[Repeat for: Hull, Grenade, Drone]
  ↓
ProtectionEquipper.equipProtection() → equip all 4 slots
  ↓
TabNavigator.navigateToTab('Protection') → return
```

---

## 📂 Project Structure

```
TankiComboManager/
│
├── manifest.json                 # Extension configuration (Manifest V3)
├── main.js                       # Entry point & orchestration logic
├── README.md                     # This file
│
├── icons/                        # Extension icons
│   ├── icon16.png               # Toolbar icon (16x16)
│   ├── icon48.png               # Extension page icon (48x48)
│   └── icon128.png              # Web store icon (128x128)
│
├── lib/                          # Shared libraries & utilities
│   ├── constants.js             # DOM selectors & game constants
│   ├── utils.js                 # Helper functions (sleep, clean names, etc.)
│   └── language_manager.js      # Multi-language support
│
├── core/                         # Core business logic
│   ├── combo_saver.js           # Saves current equipment to storage
│   ├── combo_loader.js          # Loads & equips saved combos
│   ├── tab_navigator.js         # Navigates between garage tabs
│   ├── navigation_helpers.js    # Shared navigation utilities
│   ├── auto_navigator.js        # Auto-navigates to COMBOS tab
│   │
│   ├── scanners/                # Equipment detection modules
│   │   ├── base_item_scanner.js    # Scans turrets, hulls, drones, grenades
│   │   ├── augment_scanner.js      # Scans augments (modifications)
│   │   ├── protection_scanner.js   # Scans protection modules
│   │   └── paint_scanner.js        # [Deprecated] Paint detection
│   │
│   └── equippers/               # Equipment installation modules
│       ├── base_item_equipper.js   # Equips turrets, hulls, drones, grenades
│       ├── augment_equipper.js     # Equips augments
│       └── protection_equipper.js  # Equips protection modules
│
├── ui/                           # User interface components
│   ├── menu_injector.js         # Injects COMBOS tab into garage menu
│   ├── view_renderer.js         # Renders main combo view & controls
│   ├── combo_card_renderer.js   # Renders individual combo cards
│   ├── combo_drag_handler.js    # Drag & drop reordering logic
│   ├── lobby_button_injector.js # Injects quick-access button in lobby
│   └── lobby_shortcut_handler.js# Handles 'C' key shortcut
│
└── styles/                       # CSS styling
    ├── styles.css               # Main combo view styles
    ├── combo_card.css           # Combo card styles
    └── lobby_button.css         # Lobby button styles
```

---

## 🔩 Core Components

### 1. Core Layer

#### `combo_saver.js`

Coordinates scanning and saving. Navigates each equipment tab (Turrets → Hulls → Grenades → Drones → Protection), runs the right scanner per category, builds one combo object, then `saveToStorage()` writes it to Chrome local storage with a timestamp and default name.

#### `combo_loader.js`

Runs the equip flow for a saved combo: `equipCombo(combo)` drives the equippers; `findItemInList()` and `isItemPurchased()` find and validate items; `clickEquipButton()` does language-aware clicks. Skips combo entries marked "removed"; uses coordinate-based clicks so the game UI reacts reliably.

#### Tab Navigation System

**`tab_navigator.js`**

- Handles navigation between main garage tabs (Turrets, Hulls, Grenades, Drones, Protection)
- Simulates user clicks with proper event dispatching
- Waits for tab content to load before proceeding

**`navigation_helpers.js`**

- Provides reusable navigation utilities
- `waitForElement()`: Waits for DOM elements with MutationObserver
- `navigateToCombosTab()`: Navigates to the COMBOS tab from any screen

**`auto_navigator.js`**

- Automatically redirects to COMBOS tab when entering garage
- Uses interval-based checking with smart detection

### 2. Scanner Modules

#### `base_item_scanner.js`

Scans turrets, hulls, grenades, drones: finds the "Equipped" indicator, reads the item name from the DOM, cleans it (Mk levels, special chars), returns a normalized name. `cleanDroneName()` strips drone variants (e.g. "Light"); LanguageManager handles multiple game languages.

#### `augment_scanner.js`

Turret and hull augments: opens the augment UI, waits for the grid, finds the equipped augment, reads its name, then goes back. Handles the "Standard Settings" default.

#### `protection_scanner.js`

All 4 protection slots: detects equipped modules via active/mounted state, reads names (e.g. "Spider-0") and resistance types (Firebird, Freeze, Twins, Railgun) from icons; returns an array of 4 entries (module or `null`).

### 3. Equipper Modules

#### `base_item_equipper.js`

Equips turrets, hulls, grenades, drones: goes to the right tab, finds the item in the list, checks ownership, opens details, clicks Equip, waits for confirmation. Logs a warning and continues if the item isn’t owned.

#### `augment_equipper.js`

Opens the augment screen, finds the augment in the grid, checks ownership, clicks to equip, then returns. Handles "Standard Settings" and partial name matches.

#### `protection_equipper.js`

Equips all 4 protection slots: opens the protection screen, walks each slot—finds and clicks the right module for filled slots, or removes the current module for empty ones—and checks resistance types. Handles overlaps and "remove" by clicking the already-equipped module.

### 4. UI Layer

#### `menu_injector.js`

Adds the "COMBOS" tab to the garage menu (no duplicates), matches game styling, handles tab activation and active state, and hides the combo view when exit is clicked.

#### `view_renderer.js`

Builds the main combo view: container, "Save Current Combo" button, list of combos, visibility tied to the active tab, and deletion confirmations.

#### `combo_card_renderer.js`

Renders each combo card: editable name, equipment images, augment badges, protection modules with resistance types, Equip/Delete and per-item remove (×) buttons, date badge. Resolves image URLs from equipment lists, caches them, falls back to defaults when missing.

#### `combo_drag_handler.js`

Drag-and-drop reorder: listeners on cards, drag start/over/drop, CSS for drop indicator, then updates `order` in storage and re-renders the list. Includes touch support.

#### `lobby_button_injector.js`

Shows a quick-access button in the lobby (when not in battle), with equipment previews from the lobby UI; click goes to garage and opens COMBOS. Removes itself when leaving lobby.

#### `lobby_shortcut_handler.js`

Listens for `C` on lobby/garage screens only, opens the COMBOS tab, and toggles based on context to avoid clashing with game shortcuts.

### 5. Library Layer

#### `constants.js`

Holds all DOM selectors and game constants (menus, tabs, item previews, buttons, screen detection). One place to update when the game UI changes.

#### `utils.js`

Helpers: `sleep(ms)`, `cleanItemName()` for normalizing names, `waitForCondition()` for polling, `dispatchClickEvents()` for triggering the game’s click handlers.

#### `language_manager.js`

Reads the game language from the garage title and supplies button strings ("Equip", "Delete", etc.) and language codes for combo metadata. Supports English, Russian, and other Tanki locales.

---

## 🔬 Technical Details

### Technologies Used

| Technology                     | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| **JavaScript (ES6+)**    | Core programming language                  |
| **Chrome Extension API** | Storage, permissions, content scripts      |
| **Manifest V3**          | Modern extension architecture              |
| **DOM Manipulation**     | Dynamic UI injection and scanning          |
| **MutationObserver**     | Detecting DOM changes for reactive updates |
| **PointerEvents**        | Simulating user clicks and pointer events  |
| **CSS3**                 | Styling and animations                     |

### Key Design Patterns

#### 1. IIFE (Immediately Invoked Function Expressions)

```javascript
(function () {
    'use strict';
    window.TankiComboManager = window.TankiComboManager || {};
    window.TankiComboManager.ComponentName = { /* ... */ };
})();
```

Isolates the namespace and avoids polluting the global scope.

#### 2. Async/Await Pattern

```javascript
async saveCurrentCombo() {
    await TabNavigator.navigateToTab('Turrets');
    const turret = BaseItemScanner.scanItem();
    await TabNavigator.navigateToTab('Hulls');
    // ...
}
```

Used for sequential steps with controlled timing.

#### 3. Observer Pattern

```javascript
const observer = new MutationObserver(() => {
    runInitLogic();
});
observer.observe(document.body, { childList: true, subtree: true });
```

Runs logic when the DOM changes (tabs, UI).

#### 4. Factory Pattern

```javascript
ComboCardRenderer.createComboCard(combo) {
    // Returns fully configured combo card element
}
```

Builds combo card elements in one place.

### Critical Implementation Details

#### Timing & Synchronization

Operations are timed to match the game’s UI loading:

```javascript
// Wait for tab content to load after navigation
await Utils.sleep(200);

// Wait for augment screen to appear
await NavigationHelpers.waitForElement(DOM.AUGMENT_CELL);

// Debounced observer to prevent excessive re-runs
let debounceTimeout;
observer = new MutationObserver(() => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(runInitLogic, 100);
});
```

#### Event Simulation

The game’s React UI is driven by simulated pointer and click events:

```javascript
const pointerDown = new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    clientX: centerX,
    clientY: centerY,
    isPrimary: true
});
element.dispatchEvent(pointerDown);
element.dispatchEvent(pointerUp);
element.dispatchEvent(clickEvent);
```

#### Storage Schema

```javascript
{
    savedCombos: [
        {
            id: 1234567890,              // Unique timestamp ID
            name: "Combo 1",             // User-editable name
            date: "1/9/2026",            // Creation date
            order: 0,                    // Display order (0 = top)
            language: "en",              // Language combo was saved in
            removedItems: {              // Optional: items to skip
                turret: false,
                protection: [false, false, true, false]
            },
            data: {
                turret: "HAMMER",
                turretAugment: "TRICKSTER",
                hull: "HUNTER",
                hullAugment: "SPEED BOOST",
                grenade: "MINE",
                drone: "HYPERION",
                protection: [
                    { name: "SPIDER-0", resistances: ["FIREBIRD", "FREEZE"] },
                    { name: "BARRIER-0", resistances: ["TWINS", "RAILGUN"] },
                    null,  // Empty slot
                    null   // Empty slot
                ]
            }
        }
    ]
}
```

### Performance Optimizations

1. **Lazy Loading**: Components only initialize when needed
2. **Event Delegation**: Single listeners on containers instead of per-item
3. **Debouncing**: Prevents excessive observer callbacks
4. **Caching**: Equipment images cached after first lookup
5. **Selective Observation**: Observer only active in relevant screens

### Security Considerations

- **Minimal Permissions**: Only requests `storage` permission
- **Host Restrictions**: Limited to `*.tankionline.com` domains
- **No External Requests**: All operations are local
- **Data Privacy**: Combos stored locally, never transmitted
- **No Code Injection**: Only DOM manipulation, no eval() or script injection

---

## 💻 Development

### Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/IsraBA/TankiComboManager.git
   cd TankiComboManager
   ```
2. **Install Development Tools** (Optional)

   ```bash
   # For code linting
   npm install -g eslint

   # For live reloading (manual)
   # Visit chrome://extensions and click reload icon
   ```
3. **Enable Developer Mode**

   - Open Chrome → Extensions → Enable "Developer mode"
   - Click "Load unpacked" → Select project folder

### Development Workflow

1. **Make Changes**

   - Edit any `.js` or `.css` files
   - Follow existing code style and patterns
2. **Test Changes**

   - Go to `chrome://extensions`
   - Click reload icon on "Tanki Online Pro Combo Manager"
   - Refresh Tanki Online page
   - Test functionality thoroughly
3. **Debug**

   - Open DevTools (F12) on Tanki Online page
   - Check Console for `[ComboManager]` logs
   - Use `debugger;` statements for breakpoints

### Code Style

Modules use the IIFE pattern and attach to `window.TankiComboManager`; constants (DOM, Utils) at the top, then the module object with its methods.

### Testing Checklist

Before submitting: extension loads, COMBOS tab appears, save/load work for all item types, drag-and-drop reorder works, delete works, lobby button and `C` shortcut work, no console errors.

### Common Issues

- **COMBOS tab missing**: Game UI may have changed; update selectors in `constants.js`.
- **Items not equipping**: Check name cleaning in `utils.js` and ownership detection.
- **Clicks not registering**: Tweak `sleep()` in equippers/navigators.
- **Observer too heavy**: Increase debounce or narrow the observed subtree.

### Debugging

```javascript
window.TankiComboManager.DEBUG = true;

chrome.storage.local.get(['savedCombos'], (result) => {
    console.log(result.savedCombos);
});

// Clear combos (testing)
chrome.storage.local.remove('savedCombos');
```

---

## 🤝 Contributing

Fork, create a branch, make your changes, run through the testing checklist, then open a PR. Match existing code style and, if you change UI or selectors, test in at least one non-English Tanki locale.

---

Thanks to Tanki Online and the Chrome Extensions platform.

---

### Version History

**v2.0** — Full rewrite: modular layout, automatic tab navigation, protection (4 slots) and augment support, drag-and-drop reorder, lobby button and `C` shortcut, multi-language, optional per-item removal.

**v1.0** — Basic save/load, manual tab switching, limited equipment.

---

[Issues](https://github.com/IsraBA/TankiComboManager/issues) · [Wiki](https://github.com/IsraBA/TankiComboManager/wiki)
