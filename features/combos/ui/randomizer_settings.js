// features/combos/ui/randomizer_settings.js

// מנהל את מגירת ההגדרות של הרנדומייזר
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.RandomizerSettings = {
    drawer: null,
    initialized: false,

    // אלמנטים של ההגדרות
    modeSelect: null,
    categorySwitches: {},
    advancedSwitches: {},
    fullRandomContent: null,

    // אתחול — יוצר את הדרוור פעם אחת
    init() {
      if (this.initialized) return;

      const LM = window.TankiQoL.LanguageManager;
      const Drawer = window.TankiQoL.Drawer;
      const Switch = window.TankiQoL.Switch;
      const Select = window.TankiQoL.Select;
      const Randomizer = window.TankiQoL.Randomizer;

      if (!Drawer || !Switch || !Select || !Randomizer) {
        return;
      }

      // יצירת הדרוור
      this.drawer = Drawer.create({
        id: "cme_randomizer-drawer",
        title: LM ? LM.getUIText("randomizerSettings") : "RANDOMIZER SETTINGS",
        imgSrc:
          "https://s.eu.tankionline.com/static/images/imgModal.7d37b918.png",
      });

      // בניית התוכן
      this._buildContent(LM, Switch, Select, Randomizer);

      this.initialized = true;
    },

    // בניית תוכן ההגדרות
    _buildContent(LM, Switch, Select, Randomizer) {
      const content = document.createElement("div");

      // --- סלקט מצב ---
      this.modeSelect = Select.create({
        id: "cme_randomizer-mode-select",
        label: LM ? LM.getUIText("randomizerMode") : "Mode",
        options: [
          {
            value: "full_random",
            text: LM ? LM.getUIText("randomizerModeFullRandom") : "Full random",
          },
          {
            value: "from_saved",
            text: LM
              ? LM.getUIText("randomizerModeFromSaved")
              : "From saved combos",
          },
        ],
        selected: "full_random",
        onChange: (value) => {
          this._onModeChange(value);
          this._saveCurrentSettings(Randomizer);
        },
      });
      content.appendChild(this.modeSelect);

      // --- כל התוכן שרלוונטי רק ל-full random ---
      this.fullRandomContent = document.createElement("div");
      this.fullRandomContent.id = "cme_randomizer-full-random-content";

      // --- קו מפריד ---
      this.fullRandomContent.appendChild(this._createSeparator());

      // --- סקשיין קטגוריות (כולל augments) ---
      const catTitle = document.createElement("h3");
      catTitle.className = "cme_randomizer-section-title";
      catTitle.textContent = LM
        ? LM.getUIText("randomizerCategories")
        : "Categories";
      this.fullRandomContent.appendChild(catTitle);

      // switches לקטגוריות — 2 בשורה, augments צמודים לקטגוריה שלהם
      const categoryRows = [
        [
          { key: "turrets", labelKey: "randomizerTurrets", default: true },
          {
            key: "turretAugment",
            labelKey: "randomizerTurretAugment",
            default: true,
          },
        ],
        [
          { key: "hulls", labelKey: "randomizerHulls", default: true },
          {
            key: "hullAugment",
            labelKey: "randomizerHullAugment",
            default: false,
          },
        ],
        [
          { key: "grenades", labelKey: "randomizerGrenades", default: true },
          { key: "drones", labelKey: "randomizerDrones", default: true },
        ],
      ];

      categoryRows.forEach((rowItems) => {
        const row = document.createElement("div");
        row.className = "cme_randomizer-switches-row";
        rowItems.forEach((cat) => {
          const sw = Switch.create({
            id: `cme_randomizer-cat-${cat.key}`,
            label: LM ? LM.getUIText(cat.labelKey) : cat.key,
            checked: cat.default,
            onChange: () => this._saveCurrentSettings(Randomizer),
          });
          this.categorySwitches[cat.key] = sw;
          row.appendChild(sw);
        });
        this.fullRandomContent.appendChild(row);
      });

      // --- קו מפריד ---
      this.fullRandomContent.appendChild(this._createSeparator());

      // --- סקשיין הגדרות נוספות ---
      const advTitle = document.createElement("h3");
      advTitle.className = "cme_randomizer-section-title";
      advTitle.textContent = LM
        ? LM.getUIText("randomizerAdvanced")
        : "Advanced";
      this.fullRandomContent.appendChild(advTitle);

      const advancedKeys = [
        {
          key: "legendaryOnly",
          labelKey: "randomizerLegendaryOnly",
          default: true,
        },
        {
          key: "maxEquipmentOnly",
          labelKey: "randomizerMaxEquipmentOnly",
          default: true,
        },
        {
          key: "excludeBrutus",
          labelKey: "randomizerExcludeBrutus",
          default: true,
        },
        {
          key: "excludeTsarGrenade",
          labelKey: "randomizerExcludeTsarGrenade",
          default: true,
        },
      ];

      let advRow = null;
      advancedKeys.forEach((adv, i) => {
        if (i % 2 === 0) {
          advRow = document.createElement("div");
          advRow.className = "cme_randomizer-switches-row";
          this.fullRandomContent.appendChild(advRow);
        }
        const sw = Switch.create({
          id: `cme_randomizer-adv-${adv.key}`,
          label: LM ? LM.getUIText(adv.labelKey) : adv.key,
          checked: adv.default,
          onChange: () => this._saveCurrentSettings(Randomizer),
        });
        this.advancedSwitches[adv.key] = sw;
        advRow.appendChild(sw);
      });

      content.appendChild(this.fullRandomContent);

      // הגדרת התוכן בדרוור
      this.drawer.setContentElement(content);
    },

    // יצירת קו מפריד
    _createSeparator() {
      const sep = document.createElement("div");
      sep.className = "cme_randomizer-separator";
      return sep;
    },

    // טיפול בשינוי מצב — הסתרה/הצגה של כל התוכן של full random
    _onModeChange(mode) {
      if (!this.fullRandomContent) return;
      if (mode === "from_saved") {
        this.fullRandomContent.classList.add("cme_randomizer-section-hidden");
      } else {
        this.fullRandomContent.classList.remove(
          "cme_randomizer-section-hidden",
        );
      }
    },

    // שמירת ההגדרות הנוכחיות ל-storage
    _saveCurrentSettings(Randomizer) {
      const settings = {
        mode: this.modeSelect._getValue(),
        categories: {},
        advanced: {},
      };

      // קטגוריות (כולל augments)
      for (const key in this.categorySwitches) {
        settings.categories[key] = this.categorySwitches[key]._getChecked();
      }

      // הגדרות מתקדמות
      for (const key in this.advancedSwitches) {
        settings.advanced[key] = this.advancedSwitches[key]._getChecked();
      }

      Randomizer.saveSettings(settings);
    },

    // עדכון ה-UI לפי הגדרות שנטענו מ-storage
    _applySettings(settings) {
      // עדכון מצב
      if (this.modeSelect) {
        this.modeSelect._setValue(settings.mode);
        this._onModeChange(settings.mode);
      }

      // עדכון קטגוריות
      if (settings.categories) {
        for (const key in settings.categories) {
          if (this.categorySwitches[key]) {
            this.categorySwitches[key]._setChecked(settings.categories[key]);
          }
        }
      }

      // עדכון הגדרות מתקדמות
      if (settings.advanced) {
        for (const key in settings.advanced) {
          if (this.advancedSwitches[key]) {
            this.advancedSwitches[key]._setChecked(settings.advanced[key]);
          }
        }
      }
    },

    // פתיחת מגירת ההגדרות
    async show() {
      if (!this.initialized) this.init();
      if (!this.drawer) return;

      // טעינת הגדרות מ-storage ועדכון ה-UI
      const Randomizer = window.TankiQoL.Randomizer;
      if (Randomizer) {
        const settings = await Randomizer.loadSettings();
        this._applySettings(settings);
      }

      this.drawer.show();
    },

    // סגירת מגירת ההגדרות
    hide() {
      if (this.drawer) {
        this.drawer.hide();
      }
    },
  };
})();
