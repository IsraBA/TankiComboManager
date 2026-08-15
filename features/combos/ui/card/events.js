// features/combos/ui/card/events.js

// אירועי הכרטיס: מחיקה, מצב עריכה, הסרת פריטים ולחיצה שמציידת.

(function () {
  "use strict";

  const DRAG_THRESHOLD_PX = 5;

  Object.assign(window.TankiQoL.ComboCardRenderer, {
    bindComboCardEvents(card, combo, viewRenderer) {
      this._bindCardButtons(card, combo, viewRenderer);
      this._bindTitleEditing(card, combo, viewRenderer);
      this._bindItemClicks(card, combo, viewRenderer);
    },

    _bindCardButtons(card, combo, viewRenderer) {
      const LM = window.TankiQoL.LanguageManager;

      const deleteBtn = card.querySelector(".cme_delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this._editingCombos.delete(combo.id);
          viewRenderer.deleteCombo(combo.id, combo.name);
        };
      }

      // מתג מצב עריכה; ה-CSS נשען על הקלאס cme_editing
      const editBtn = card.querySelector(".cme_combo-edit-btn");
      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation();
          const editing = card.classList.toggle("cme_editing");
          if (editing) this._editingCombos.add(combo.id);
          else this._editingCombos.delete(combo.id);
          editBtn.title = LM.getUIText(editing ? "doneEditing" : "editCombo");
        };
      }
    },

    _bindItemClicks(card, combo, viewRenderer) {
      // הסרת פריט רק במצב עריכה; אחרת האירוע מבעבע לכרטיס ומצייד
      const removableItems = card.querySelectorAll(".cme_combo-item-removable");
      removableItems.forEach((item) => {
        item.onclick = (e) => {
          if (!card.classList.contains("cme_editing")) return;
          e.stopPropagation();
          const itemType = item.getAttribute("data-item-type");
          if (itemType) {
            viewRenderer.removeItemFromCombo(combo.id, itemType);
          }
        };
      });

      // גרירה מזוהה לפי תזוזת העכבר ולא לפי אירועי drag, כי דפדפנים
      // לא עקביים בשאלה אם click נורה אחרי גרירה.
      let downX = 0;
      let downY = 0;
      card.addEventListener("mousedown", (e) => {
        downX = e.clientX;
        downY = e.clientY;
      });

      card.onclick = (e) => {
        if (card.classList.contains("cme_editing")) return;
        if (
          e.target.closest(".cme_combo-title") ||
          e.target.closest(".cme_delete-btn") ||
          e.target.closest(".cme_combo-edit-btn")
        ) {
          return;
        }
        const moved =
          Math.abs(e.clientX - downX) > DRAG_THRESHOLD_PX ||
          Math.abs(e.clientY - downY) > DRAG_THRESHOLD_PX;
        if (moved) return;

        viewRenderer.equipCombo(combo);
      };
    },
  });
})();
