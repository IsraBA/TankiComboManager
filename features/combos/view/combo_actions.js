// features/combos/view/combo_actions.js

// פעולות על קומבו: מחיקה, שינוי שם, הצטיידות והסרת פריט.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    deleteCombo(comboId, comboName) {
      const DeleteModal = window.TankiQoL.DeleteComboModal;
      if (!DeleteModal) return;

      DeleteModal.show(comboId, comboName, (confirmedComboId) => {
        const removeFromStorage = () => {
          chrome.storage.local.get(["savedCombos"], (result) => {
            let combos = result.savedCombos || [];
            combos = combos.filter((c) => c.id !== confirmedComboId);

            chrome.storage.local.set({ savedCombos: combos }, () => {
              this.loadAndRenderCombos();
            });
          });
        };

        const card = this.viewElement.querySelector(
          `.cme_combo-card[data-combo-id="${confirmedComboId}"]`,
        );
        const column = card
          ? card.closest(".cme_flexSpaceBetweenAlignCenterColumn")
          : null;

        if (card && column) {
          this.playDeleteAnimation(card, column, removeFromStorage);
        } else {
          removeFromStorage();
        }
      });
    },

    renameCombo(comboId, newName) {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        const combo = combos.find((c) => c.id === comboId);
        if (combo) {
          combo.name = newName;
          chrome.storage.local.set({ savedCombos: combos });
        }
      });
    },

    // נקודת הכניסה היחידה להצטיידות מהכרטיס.
    // המסלול המיידי נופל ל-DOM בעצמו, ברמת הפריט הבודד.
    async equipCombo(combo) {
      // המשחק חוסם החלפת ציוד; השרת ידחה כל מסלול, כולל ה-DOM
      if (this.cooldownActive) return;

      // הלואדר מסמן שהשיגור רץ, לא שהמודל התלת-ממדי סיים להתעדכן
      const card = this.viewElement
        ? this.viewElement.querySelector(
            '.cme_combo-card[data-combo-id="' + combo.id + '"]',
          )
        : null;
      if (card) card.classList.add("cme_equipping");

      try {
        const InstantLoader = window.TankiQoL.InstantLoader;
        if (InstantLoader) {
          await InstantLoader.equipCombo(combo);
        } else if (window.TankiQoL.ComboLoader) {
          await window.TankiQoL.ComboLoader.equipCombo(combo);
        }
      } finally {
        if (card) card.classList.remove("cme_equipping");
      }

      // המסלול הישן סיים כאן מאז ומתמיד; המיידי לא זז, ולכן מנווטים כאן
      const nav = window.TankiQoL.TabNavigator;
      if (nav) await nav.navigateToTab("Protection");
    },

    removeItemFromCombo(comboId, itemType) {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        const combo = combos.find((c) => c.id === comboId);
        if (!combo) return;

        if (!combo.removedItems) {
          combo.removedItems = {};
        }

        // הגנות מגיעות כ-protection_0, protection_1 וכו'
        if (itemType.startsWith("protection_")) {
          const protectionIndex = parseInt(itemType.split("_")[1]);
          if (!combo.removedItems.protection) {
            combo.removedItems.protection = [];
          }
          if (!combo.removedItems.protection.includes(protectionIndex)) {
            combo.removedItems.protection.push(protectionIndex);
          }
        } else {
          combo.removedItems[itemType] = true;

          // הסרת התותח/גוף מורידה איתה את האוגמנט שלו
          if (itemType === "turret") {
            combo.removedItems.turretAugment = true;
          }
          if (itemType === "hull") {
            combo.removedItems.hullAugment = true;
          }
        }

        chrome.storage.local.set({ savedCombos: combos }, () => {
          const ComboCleaner = window.TankiQoL.ComboCleaner;
          if (ComboCleaner && ComboCleaner.removeEmptyCombos) {
            ComboCleaner.removeEmptyCombos(() => {
              this.loadAndRenderCombos();
            });
          } else {
            this.loadAndRenderCombos();
          }
        });
      });
    },
  });
})();
