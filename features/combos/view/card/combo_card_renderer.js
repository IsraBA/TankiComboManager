// features/combos/view/card/combo_card_renderer.js

// בסיס כרטיס הקומבו: הרכבת הכרטיס עצמו והכרטיס הזמני של הרנדום.
// השורות והאירועים נוספים כ-mixins מתוך view/card/.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ComboCardRenderer = {
    // מצב עריכה לפי id. מחוץ לאלמנט, כי הסרת פריט מרנדרת את הכרטיס מחדש.
    _editingCombos: new Set(),

    createComboCard(combo, index, viewRenderer) {
      const LM = window.TankiQoL.LanguageManager;
      const card = document.createElement("div");
      card.className = "cme_combo-card";
      card.setAttribute("data-combo-id", combo.id);

      const isEditing = this._editingCombos.has(combo.id);
      if (isEditing) card.classList.add("cme_editing");

      const rowsHTML = this.createRowsHTML(
        combo.data,
        combo.removedItems || {},
      );

      const deleteBtnHTML = `
                <div class="cme_delete-btn" title="${LM.getUIText("deleteCombo")}"></div>
            `;

      // שני האייקונים מוזרקים וה-CSS מציג את הנכון לפי המצב. מכוילים
      // לאייקון ה-X של המשחק: צורה מלאה, קנבס 24×24, ואותו עובי רצועה.
      // ה-V תלול יותר כי ב-45° הוא לא מגיע לגובה מלא — לא להגדיל ב-scale.
      // החיתוך השטוח בכיפוף מחקה את הצומת המפוסל של ה-X של המשחק.
      const editBtnHTML = `
                <div class="cme_combo-edit-btn" title="${LM.getUIText(isEditing ? "doneEditing" : "editCombo")}">
                    <svg class="cme_combo-edit-icon cme_combo-edit-icon-pencil" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 16.5L7.5 20.5L0 24L3.5 16.5ZM3.5 16.5L16.5 3.5L20.5 7.5L7.5 20.5L3.5 16.5ZM18 2L20 0L24 4L22 6L18 2Z" fill="white"/>
                    </svg>
                    ${window.TankiQoL.Icons.check("cme_combo-edit-icon cme_combo-edit-icon-check")}
                </div>
            `;

      const titleHTML = `
                <div class="cme_combo-title">
                    <h1 contenteditable="true" spellcheck="false">${combo.name || `COMBO ${index + 1}`}</h1>
                </div>
            `;

      card.innerHTML = `
                <div class="cme_combo-preview-container">
                    ${titleHTML}
                    <div class="cme_combo-rows">
                        ${rowsHTML}
                    </div>
                    ${editBtnHTML}
                    ${deleteBtnHTML}
                </div>
            `;

      this.bindComboCardEvents(card, combo, viewRenderer);

      if (window.TankiQoL.ComboDragHandler) {
        window.TankiQoL.ComboDragHandler.makeCardDraggable(card, combo.id);
      }

      return card;
    },

    // כרטיס תוצאת רנדום: לצפייה בלבד, בלי עריכה/מחיקה/גרירה
    createTemporaryCard(comboData) {
      const LM = window.TankiQoL.LanguageManager;
      const card = document.createElement("div");
      card.className = "cme_combo-card cme_combo-card-temporary";
      card.setAttribute("data-temporary", "true");

      const rowsHTML = this.createRowsHTML(comboData, {});

      const titleHTML = `
                <div class="cme_combo-title cme_combo-title-temporary">
                    <h1>${LM ? LM.getUIText("randomCombo") : "RANDOM COMBO"}</h1>
                </div>
            `;

      card.innerHTML = `
                <div class="cme_combo-preview-container">
                    ${titleHTML}
                    <div class="cme_combo-rows">
                        ${rowsHTML}
                    </div>
                </div>
            `;

      return card;
    },
  };
})();
