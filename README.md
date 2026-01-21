# Tanki Online Pro Combo Manager

<div align="center">
  <img src="icons/icon128.png" alt="Tanki Online Pro Combo Manager" width="128" height="128">

  **Advanced Browser Extension for Tanki Online Equipment Management**

  [![Version](https://img.shields.io/badge/version-2.0-blue.svg)](manifest.json)
  [![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)](manifest.json)
  [![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

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
- [License](#-license)

---

## 🎯 Overview

**Tanki Online Pro Combo Manager** is a sophisticated browser extension designed to enhance the Tanki Online gaming experience by providing advanced equipment management capabilities. The extension allows players to save, organize, and quickly switch between different equipment combinations (combos), eliminating the tedious process of manually equipping items through multiple menus.

### What Problem Does It Solve?

In Tanki Online, players often need to switch between different equipment setups (turrets, hulls, drones, grenades, augments, and protection modules) for various game modes and strategies. Manually navigating through multiple tabs and menus to change equipment is time-consuming and inefficient. This extension automates and streamlines the entire process.

### Key Benefits

- **Time-Saving**: Switch between complete equipment setups in seconds
- **Organization**: Manage unlimited equipment combinations with custom names
- **Automation**: Automated tab navigation and equipment detection
- **Multi-Language Support**: Works with all Tanki Online language settings
- **User-Friendly**: Intuitive drag-and-drop interface with keyboard shortcuts

---

## ✨ Features

### Core Functionality

#### 🎮 Combo Management

- **Save Current Setup**: Automatically scans and saves your entire current equipment configuration
- **Load Combos**: One-click equipment of saved combos with automated navigation
- **Unlimited Storage**: Save as many combos as you need using Chrome's local storage
- **Smart Detection**: Automatically detects equipped items, augments, and protection modules

#### 🎨 Advanced UI

- **Custom Combo Cards**: Visual representation of each combo with all equipment displayed
- **Drag & Drop Reordering**: Organize combos by dragging them into your preferred order
- **Item Preview Images**: See all equipment items in your combo at a glance
- **Real-time Updates**: UI updates automatically when combos are saved or loaded

#### ⚡ Quick Access

- **Lobby Integration**: Quick access button in the garage lobby screen
- **Keyboard Shortcuts**: Press `C` key in lobby to open combo manager
- **Garage Menu Tab**: New "COMBOS" tab integrated into the garage menu
- **Context-Aware**: Only appears in relevant screens (garage/lobby)

#### 🔧 Powerful Features

- **Augment Support**: Manages turret and hull augments (modifications)
- **Protection Modules**: Full support for all 4 protection module slots with resistance types
- **Drone & Grenade Support**: Manages special equipment items
- **Language Detection**: Automatically adapts to your game's language settings
- **Item Removal**: Mark items as removed from combos for partial equipment changes

### Equipment Coverage

The extension manages all major equipment categories:

| Category             | Description                          | Special Features                     |
| -------------------- | ------------------------------------ | ------------------------------------ |
| **Turrets**    | Main weapon (e.g., Hammer, Railgun)  | Includes augment support             |
| **Hulls**      | Tank chassis (e.g., Hunter, Mammoth) | Includes augment support             |
| **Drones**     | Support units                        | Special name cleaning for variations |
| **Grenades**   | Tactical equipment                   | Full integration                     |
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
   git clone https://github.com/yourusername/TankiComboManager.git
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

### Design Philosophy

The Tanki Combo Manager follows a **modular architecture** with clear separation of concerns. The codebase is organized into distinct layers:

1. **Core Layer**: Business logic for scanning, saving, loading, and navigation
2. **UI Layer**: User interface components and interaction handlers
3. **Library Layer**: Shared utilities, constants, and language management

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

**Purpose**: Orchestrates the scanning and saving of the current equipment setup

**Key Functions**:

- `saveCurrentCombo()`: Main entry point that coordinates all scanning operations
- `saveToStorage(comboData)`: Persists combo data to Chrome storage with metadata

**Process**:

1. Navigates to each equipment tab (Turrets → Hulls → Grenades → Drones → Protection)
2. Invokes appropriate scanner for each category
3. Collects all data into a single combo object
4. Saves to Chrome local storage with timestamp and auto-generated name

#### `combo_loader.js`

**Purpose**: Automates the equipment process for saved combos

**Key Functions**:

- `equipCombo(combo)`: Main entry point that coordinates all equipping operations
- `findItemInList(itemName)`: Searches equipment lists for specific items
- `isItemPurchased(item)`: Validates item ownership before attempting to equip
- `clickEquipButton()`: Simulates clicks on equip buttons with language support

**Features**:

- Smart item searching with name normalization
- Ownership verification to prevent errors
- Skips items marked as "removed" in combos
- Coordinate-based clicking for reliable interaction

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

**Scans**: Turrets, Hulls, Grenades, Drones

**Logic**:

1. Looks for "Equipped" button indicator
2. Extracts item name from DOM
3. Cleans name (removes Mk levels, special characters)
4. Returns standardized item name

**Special Features**:

- `cleanDroneName()`: Removes drone variations (e.g., "Light" → base name)
- Multi-language support via LanguageManager

#### `augment_scanner.js`

**Scans**: Turret and Hull augments

**Process**:

1. Clicks augment button to open augment selection screen
2. Waits for augment grid to load
3. Searches for equipped augment icon
4. Extracts augment name
5. Clicks back button to return
6. Handles "Standard Settings" default augment

#### `protection_scanner.js`

**Scans**: All 4 protection module slots

**Advanced Logic**:

- Detects equipped modules by checking for active/mounted indicators
- Extracts module name (e.g., "Spider-0")
- Determines resistance types (e.g., Firebird, Freeze, Twins, Railgun) from icons
- Returns array of 4 slots with module data or `null` for empty slots

### 3. Equipper Modules

#### `base_item_equipper.js`

**Equips**: Turrets, Hulls, Grenades, Drones

**Process**:

1. Navigates to appropriate tab
2. Searches equipment list for matching item
3. Verifies item ownership
4. Clicks item to view details
5. Clicks "Equip" button
6. Waits for equipment confirmation

**Error Handling**:

- Logs warnings for unowned items
- Continues with next item on failure

#### `augment_equipper.js`

**Equips**: Turret and Hull augments

**Process**:

1. Opens augment selection screen
2. Finds target augment in grid
3. Verifies ownership
4. Clicks augment to equip
5. Returns to main screen

**Special Cases**:

- Handles "Standard Settings" augment
- Supports partial name matching

#### `protection_equipper.js`

**Equips**: All 4 protection module slots

**Complex Logic**:

1. Opens protection selection screen
2. Iterates through each slot in the combo
3. For equipped slots: finds and clicks matching module
4. For empty slots: removes currently equipped module
5. Verifies resistance types match expected values

**Challenges Solved**:

- Managing 4 slots with potential overlaps
- Removing modules (clicking on already equipped item)
- Ensuring correct resistance types are equipped

### 4. UI Layer

#### `menu_injector.js`

**Purpose**: Adds the "COMBOS" tab to the garage menu

**Key Features**:

- Checks for existing tab to prevent duplicates
- Matches game's styling perfectly
- Adds event listeners for tab activation
- Manages active state classes
- Monitors exit buttons to hide combo view

#### `view_renderer.js`

**Purpose**: Renders the main combo management interface

**Responsibilities**:

- Creates main combo view container
- Renders "Save Current Combo" button
- Displays list of all saved combos
- Manages view visibility based on active tab
- Handles combo deletion confirmations

#### `combo_card_renderer.js`

**Purpose**: Renders individual combo cards (most complex UI component)

**Features**:

- Displays combo name (editable on click)
- Shows all equipment images with proper styling
- Renders augment badges
- Displays protection modules with resistance types
- "Equip" button with event handler
- "Delete" button with confirmation
- Remove item (×) buttons for individual items
- Date created badge

**Image Handling**:

- Searches through equipment lists to find correct image URLs
- Caches images for performance
- Falls back to default images if not found

#### `combo_drag_handler.js`

**Purpose**: Implements drag-and-drop reordering

**Logic**:

1. Adds drag event listeners to all combo cards
2. Tracks drag start, drag over, and drop events
3. Visually indicates drag position with CSS classes
4. Updates combo `order` property in storage
5. Re-renders combo list in new order

**User Experience**:

- Smooth visual feedback during drag
- Snap-to-position animation
- Touch device support

#### `lobby_button_injector.js`

**Purpose**: Adds quick-access button in garage lobby

**Features**:

- Detects when player is in lobby (not in battle)
- Creates styled button with equipment previews
- Dynamically extracts equipment images from lobby
- Navigates to garage and opens COMBOS tab on click
- Self-removes when leaving lobby

#### `lobby_shortcut_handler.js`

**Purpose**: Handles 'C' key press shortcut

**Logic**:

- Only activates when in relevant screens (lobby/garage)
- Prevents conflicts with game's own shortcuts
- Opens COMBOS tab when pressed
- Automatically enables/disables based on screen context

### 5. Library Layer

#### `constants.js`

**Purpose**: Central repository for all DOM selectors and game constants

**Contents**:

- 50+ DOM selectors organized by category
- Menu container classes
- Tab identification classes
- Item preview selectors
- Button selectors
- Screen detection indicators

**Benefits**:

- Single source of truth for all selectors
- Easy maintenance when game updates
- Prevents hardcoded selectors throughout codebase

#### `utils.js`

**Purpose**: Reusable utility functions

**Key Functions**:

- `sleep(ms)`: Async delay for timing control
- `cleanItemName(rawName)`: Normalizes item names (removes Mk, levels, special chars)
- `waitForCondition(condition, timeout)`: Polls until condition is true
- `dispatchClickEvents(element)`: Simulates realistic user clicks

#### `language_manager.js`

**Purpose**: Multi-language support for UI text

**Features**:

- Detects current game language from garage title
- Provides translated strings for buttons ("Equip", "Delete", etc.)
- Returns language codes for combo metadata
- Supports: English, Russian, and other Tanki languages

**Why It's Needed**:

- Tanki Online is available in multiple languages
- DOM text content changes based on language
- Extension must adapt to find correct buttons and labels

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
| **PointerEvents**        | Simulating realistic user interactions     |
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

**Purpose**: Creates isolated namespace, prevents global scope pollution

#### 2. Async/Await Pattern

```javascript
async saveCurrentCombo() {
    await TabNavigator.navigateToTab('Turrets');
    const turret = BaseItemScanner.scanItem();
    await TabNavigator.navigateToTab('Hulls');
    // ...
}
```

**Purpose**: Sequential operations with proper timing control

#### 3. Observer Pattern

```javascript
const observer = new MutationObserver(() => {
    runInitLogic();
});
observer.observe(document.body, { childList: true, subtree: true });
```

**Purpose**: Reactive updates when DOM changes (tab switches, UI updates)

#### 4. Factory Pattern

```javascript
ComboCardRenderer.createComboCard(combo) {
    // Returns fully configured combo card element
}
```

**Purpose**: Consistent creation of complex UI elements

### Critical Implementation Details

#### Timing & Synchronization

The extension must carefully time its operations to match Tanki Online's UI loading:

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

To interact with Tanki Online's React-based UI, the extension simulates realistic user events:

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
   git clone https://github.com/yourusername/TankiComboManager.git
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

### Code Style Guidelines

```javascript
// Use IIFE pattern for modules
(function () {
    'use strict';
  
    // Constants at top
    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;
  
    // Register module
    window.TankiComboManager.ModuleName = {
  
        // Public methods with clear comments
        async publicMethod() {
            // Implementation
        },
  
        // Private-style methods (not truly private, just convention)
        _internalMethod() {
            // Implementation
        }
    };
})();
```

### Testing Checklist

Before submitting changes, verify:

- [ ] Extension loads without errors
- [ ] COMBOS tab appears in garage menu
- [ ] Save Current Combo works
- [ ] Load Combo works (all item types)
- [ ] Drag & drop reordering works
- [ ] Delete combo works
- [ ] Lobby button appears and functions
- [ ] 'C' key shortcut works
- [ ] Multi-language support works
- [ ] No console errors
- [ ] Performance is acceptable

### Common Issues & Solutions

**Issue**: Extension doesn't inject COMBOS tab

- **Solution**: Check if Tanki Online UI has changed, update DOM selectors in `constants.js`

**Issue**: Items not equipping correctly

- **Solution**: Verify item names are cleaned properly in `utils.js`, check ownership detection

**Issue**: Timing problems (clicks not registering)

- **Solution**: Adjust `sleep()` durations in equipper/navigator modules

**Issue**: Observer causing performance issues

- **Solution**: Increase debounce timeout, narrow observation scope

### Debugging Tools

```javascript
// Enable verbose logging
window.TankiComboManager.DEBUG = true;

// Inspect saved combos
chrome.storage.local.get(['savedCombos'], (result) => {
    console.log(result.savedCombos);
});

// Clear all combos (testing)
chrome.storage.local.remove('savedCombos');

// Monitor mutations
const observer = new MutationObserver((mutations) => {
    console.log('Mutations:', mutations);
});
observer.observe(document.body, { childList: true, subtree: true });
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Describe your idea in an issue
3. **Submit Pull Requests**: Fix bugs or implement features
4. **Improve Documentation**: Help make docs clearer
5. **Translate**: Add support for more languages

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following code style guidelines
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request with description of changes

### Contribution Guidelines

- Follow existing code patterns and style
- Add comments for complex logic
- Update README if adding features
- Test on both English and non-English Tanki Online versions
- Ensure no console errors
- Keep performance in mind

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 🙏 Acknowledgments

- **Tanki Online**: For creating an amazing game
- **Chrome Extensions API**: For powerful extension capabilities
- **Community**: For feedback and feature suggestions

---

### Version History

#### v2.0 (Current)

- ✅ Complete rewrite with modular architecture
- ✅ Automated tab navigation
- ✅ Protection module support (4 slots)
- ✅ Augment management
- ✅ Drag & drop reordering
- ✅ Lobby integration
- ✅ Keyboard shortcuts
- ✅ Multi-language support
- ✅ Remove items feature

#### v1.0 (Legacy)

- Basic save/load functionality
- Manual tab navigation required
- Limited equipment support

---

<div align="center">

  **Made with ❤️ for the Tanki Online Community**

  [Report Bug](https://github.com/yourusername/TankiComboManager/issues) ·
  [Request Feature](https://github.com/yourusername/TankiComboManager/issues) ·
  [Documentation](https://github.com/yourusername/TankiComboManager/wiki)

</div>
