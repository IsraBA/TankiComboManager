// features/combos/view/combo_list.js

// טעינת הקומבואים מהאחסון, סינון לפי שפה, מיון ורינדור הכרטיסים.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    ensureAllCombosHaveOrder() {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        let needsUpdate = false;

        combos.forEach((combo, index) => {
          if (combo.order === undefined) {
            combo.order = index;
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          chrome.storage.local.set({ savedCombos: combos });
        }
      });
    },

    async loadAndRenderCombos() {
      // show() עשוי להיקרא בזמן ש-init עדיין טוען את ה-HTML
      const container = await this.waitForElementInView(
        "#combos-grid-container",
        7000,
      );

      if (!container) {
        console.error("[ComboManager] combos-grid-container not found in view!");
        return;
      }

      const ComboCleaner = window.TankiQoL.ComboCleaner;
      if (ComboCleaner && ComboCleaner.removeEmptyCombos) {
        ComboCleaner.removeEmptyCombos(() => {
          this._loadAndRenderCombosAfterCleanup(container);
          this._backfillIdsInBackground();
        });
      } else {
        this._loadAndRenderCombosAfterCleanup(container);
        this._backfillIdsInBackground();
      }
    },

    // השלמת מזהים לקומבואים ישנים — אחרי הרינדור ובלי לחסום אותו,
    // כי היא לא משנה כלום ממה שמוצג. best-effort בלבד.
    _backfillIdsInBackground() {
      const ComboMigrator = window.TankiQoL.ComboMigrator;
      if (!ComboMigrator || !ComboMigrator.backfillIds) return;
      try {
        ComboMigrator.backfillIds();
      } catch (e) { /* קומבו שלא הושלם נשאר על מסלול ה-DOM */ }
    },

    _loadAndRenderCombosAfterCleanup(container) {
      chrome.storage.local.get(["savedCombos"], (result) => {
        const combos = result.savedCombos || [];

        const LanguageManager = window.TankiQoL.LanguageManager;
        const currentLanguageCode = LanguageManager
          ? LanguageManager.getCurrentLanguageCode()
          : "en";

        // קומבו בלי שפה הוא ישן, ומניחים שנשמר באנגלית
        const filteredCombos = combos.filter((combo) => {
          const comboLanguage = combo.language || "en";
          return comboLanguage === currentLanguageCode;
        });

        // order קודם, ואם אין — לפי id (timestamp) מהחדש לישן
        const sortedCombos = filteredCombos.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return (b.id || 0) - (a.id || 0);
        });

        this.renderCombos(sortedCombos);
      });
    },

    renderCombos(combos) {
      const container = this.viewElement.querySelector(
        "#combos-grid-container",
      );
      if (!container) return;

      container.innerHTML = "";

      const arrowLeft = this.viewElement.querySelector(".cme_arrowLeft");
      const arrowRight = this.viewElement.querySelector(".cme_arrowRight");

      if (combos.length === 0) {
        const LM = window.TankiQoL.LanguageManager;
        container.innerHTML = `
                    <div class="cme_empty-state">
                        <h2>${LM.getUIText("noSavedCombos")}</h2>
                        <p>${LM.getUIText("clickToSave")}</p>
                    </div>
                `;
        this.updateArrowsVisibility(container, arrowLeft, arrowRight);
        return;
      }

      // כל קומבו ב-column משלו
      combos.forEach((combo, index) => {
        const currentColumn = document.createElement("div");
        currentColumn.className = "cme_flexSpaceBetweenAlignCenterColumn";
        container.appendChild(currentColumn);

        if (window.TankiQoL.ComboCardRenderer) {
          const comboCard = window.TankiQoL.ComboCardRenderer.createComboCard(
            combo,
            index,
            this,
          );
          currentColumn.appendChild(comboCard);
        }
      });

      setTimeout(() => {
        this.bindDragEvents(container);
      }, 100);

      // אחרי שהרינדור הסתיים
      setTimeout(() => {
        this.updateArrowsVisibility(container, arrowLeft, arrowRight);
      }, 0);
    },

    // כרטיס זמני עם תוצאת רנדום, בתחילת הרשימה
    // loading=true מדליק את אפקט ההצטיידות על הכרטיס הזמני.
    // נתונים זהים -> רק מחליפים קלאס, כדי שלא יהיה ריצוד.
    showTemporaryCard(comboData, loading) {
      const container = this.viewElement
        ? this.viewElement.querySelector("#combos-grid-container")
        : null;
      if (!container) return;

      const stamp = JSON.stringify(comboData);
      if (this.temporaryCardColumn && this._temporaryCardStamp === stamp) {
        const shown = this.temporaryCardColumn.querySelector(".cme_combo-card");
        if (shown) shown.classList.toggle("cme_equipping", !!loading);
        return;
      }

      this.removeTemporaryCard();

      const CardRenderer = window.TankiQoL.ComboCardRenderer;
      if (!CardRenderer || !CardRenderer.createTemporaryCard) return;

      const card = CardRenderer.createTemporaryCard(comboData);
      if (loading) card.classList.add("cme_equipping");
      this._temporaryCardStamp = stamp;

      const column = document.createElement("div");
      column.className =
        "cme_flexSpaceBetweenAlignCenterColumn cme_temporary-card-column";
      column.appendChild(card);

      container.insertBefore(column, container.firstChild);
      this.temporaryCardColumn = column;

      container.scrollLeft = 0;
    },

    removeTemporaryCard() {
      if (this.temporaryCardColumn) {
        this.temporaryCardColumn.remove();
        this.temporaryCardColumn = null;
      }
      this._temporaryCardStamp = null;
    },
  });
})();
