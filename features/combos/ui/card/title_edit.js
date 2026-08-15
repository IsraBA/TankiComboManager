// features/combos/ui/card/title_edit.js

// עריכת שם הקומבו: הגבלת אורך, ובלימת כל אירועי המקלדת מהמשחק.

(function () {
  "use strict";

  const MAX_NAME_LENGTH = 15;

  Object.assign(window.TankiQoL.ComboCardRenderer, {
    _bindTitleEditing(card, combo, viewRenderer) {
      const titleElement = card.querySelector(".cme_combo-title h1");
      if (!titleElement) return;

      // חיתוך לאורך המרבי והחזרת הסמן לסוף
      const enforceMaxLength = (element) => {
        const text = element.textContent;
        if (text.length > MAX_NAME_LENGTH) {
          element.textContent = text.substring(0, MAX_NAME_LENGTH);
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(element);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      };

      titleElement.onblur = (e) => {
        const newName = e.target.textContent
          .trim()
          .substring(0, MAX_NAME_LENGTH);
        if (newName && newName !== combo.name) {
          viewRenderer.renameCombo(combo.id, newName);
        }
        if (e.target.textContent.trim().length > MAX_NAME_LENGTH) {
          e.target.textContent = newName;
        }
      };

      titleElement.onkeydown = (e) => {
        e.stopPropagation();   // שהמשחק לא יקבל את ההקלדה
        if (e.key === "Enter") {
          e.preventDefault();
          e.target.blur();
        }
        // חסימת הקלדה במקסימום, מלבד מקשי בקרה
        const text = e.target.textContent;
        if (
          text.length >= MAX_NAME_LENGTH &&
          ![
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
            "Tab",
            "Enter",
            "Escape",
          ].includes(e.key) &&
          !e.ctrlKey &&
          !e.metaKey
        ) {
          e.preventDefault();
        }
      };

      titleElement.onkeyup = (e) => e.stopPropagation();
      titleElement.onkeypress = (e) => e.stopPropagation();
      titleElement.onclick = (e) => e.stopPropagation();
      titleElement.onfocus = (e) => e.stopPropagation();
      titleElement.oninput = (e) => {
        e.stopPropagation();
        enforceMaxLength(e.target);
      };

      // הדבקה: חותכים לאורך המותר במקום לדחות
      titleElement.onpaste = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData(
          "text",
        );
        const currentText = e.target.textContent;
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        if (range) {
          range.deleteContents();
          const textNode = document.createTextNode(
            pastedText.substring(
              0,
              MAX_NAME_LENGTH - currentText.length + range.toString().length,
            ),
          );
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          e.target.textContent = (currentText + pastedText).substring(
            0,
            MAX_NAME_LENGTH,
          );
        }
        enforceMaxLength(e.target);
      };
    },
  });
})();
