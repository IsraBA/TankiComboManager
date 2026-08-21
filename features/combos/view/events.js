// features/combos/view/events.js

// חיבור אירועי התצוגה: כפתורים, מתגי ההגדרות ומקש Enter לשמירה.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    bindEvents() {
      this._bindButtons();
      this._bindSwitches();
      this._bindScrolling();
      this._bindEnterKey();
    },

    _bindButtons() {
      const saveBtn = this.viewElement.querySelector("#cme_save-combo-btn");
      if (saveBtn) {
        saveBtn.onclick = async () => {
          // שמירה ממצב המשחק; ComboSaver הישן נשאר בקוד אך לא מחווט
          if (window.TankiQoL.InstantSaver) {
            const result =
              await window.TankiQoL.InstantSaver.saveCurrentCombo();
            if (result && result.ok) this.loadAndRenderCombos();
          }
        };
      }

      const surpriseMeBtn = this.viewElement.querySelector(
        "#cme_surprise-me-btn",
      );
      if (surpriseMeBtn) {
        surpriseMeBtn.onclick = async () => {
          if (window.TankiQoL.Randomizer) {
            await window.TankiQoL.Randomizer.run();
          }
        };
      }

      // הגלגל יושב בתוך כפתור SURPRISE ME, ולכן חייב stopPropagation
      const gearIcon = this.viewElement.querySelector(
        "#cme_randomizer-settings-gear",
      );
      if (gearIcon) {
        gearIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          if (window.TankiQoL.RandomizerSettings) {
            window.TankiQoL.RandomizerSettings.init();
            window.TankiQoL.RandomizerSettings.show();
          }
        });
      }

      const importBtn = this.viewElement.querySelector("#cme_import-btn");
      if (importBtn) {
        importBtn.onclick = () => {
          if (window.TankiQoL.ImportExport) {
            window.TankiQoL.ImportExport.importCombos();
          }
        };
      }

      const exportBtn = this.viewElement.querySelector("#cme_export-btn");
      if (exportBtn) {
        exportBtn.onclick = () => {
          if (window.TankiQoL.ImportExport) {
            window.TankiQoL.ImportExport.exportCombos();
          }
        };
      }
    },

    _bindSwitches() {
      const autoOpenContainer = this.viewElement.querySelector(
        "#cme_auto-open-switch-container",
      );
      if (autoOpenContainer && window.TankiQoL.Switch) {
        const LM = window.TankiQoL.LanguageManager;
        chrome.storage.local.get(["autoOpenCombosOnGarageEntry"], (result) => {
          const shouldAutoOpen = result.autoOpenCombosOnGarageEntry !== false;
          const autoOpenSwitch = window.TankiQoL.Switch.create({
            id: "cme_auto-open-switch",
            label: LM
              ? LM.getUIText("autoOpenCheckbox")
              : "Auto-open Combos tab",
            checked: shouldAutoOpen,
            onChange: (isChecked) => {
              chrome.storage.local.set({
                autoOpenCombosOnGarageEntry: isChecked,
              });
            },
          });
          autoOpenContainer.appendChild(autoOpenSwitch);
        });
      }

      const equipProtectionsContainer = this.viewElement.querySelector(
        "#cme_equip-protections-switch-container",
      );
      if (equipProtectionsContainer && window.TankiQoL.Switch) {
        const LM = window.TankiQoL.LanguageManager;
        chrome.storage.local.get(["equipProtectionsOnLoad"], (result) => {
          const shouldEquipProtections =
            result.equipProtectionsOnLoad !== false;
          this._applyProtectionsDimState(shouldEquipProtections);
          const equipProtectionsSwitch = window.TankiQoL.Switch.create({
            id: "cme_equip-protections-switch",
            label: LM
              ? LM.getUIText("equipProtectionsCheckbox")
              : "Equip protections",
            checked: shouldEquipProtections,
            onChange: (isChecked) => {
              chrome.storage.local.set({
                equipProtectionsOnLoad: isChecked,
              });
              this._applyProtectionsDimState(isChecked);
            },
          });
          equipProtectionsContainer.appendChild(equipProtectionsSwitch);
        });
      }
    },

    _bindEnterKey() {
      this.enterKeyHandler = (e) => {
        if (!this.viewElement || this.viewElement.style.display === "none") {
          return;
        }

        // לא לחטוף Enter בזמן עריכת שם קומבו
        const activeElement = document.activeElement;
        if (activeElement && activeElement.isContentEditable) {
          return;
        }

        if (e.key === "Enter") {
          const saveBtn = this.viewElement.querySelector("#cme_save-combo-btn");
          if (saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            saveBtn.click();
          }
        }
      };

      document.addEventListener("keydown", this.enterKeyHandler);
    },

    // עמעום אייקוני ההגנות בכרטיסים כשההתייחסות להגנות כבויה
    _applyProtectionsDimState(equipProtectionsEnabled) {
      if (!this.viewElement) return;
      this.viewElement.classList.toggle(
        "cme_protections-disabled",
        !equipProtectionsEnabled,
      );
    },
  });
})();
