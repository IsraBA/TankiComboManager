// features/combos/view/card/combo_drag_handler.js

// מודול זה מטפל ב-drag and drop של כרטיסי קומבו
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ComboDragHandler = {
    draggedCard: null,
    draggedComboId: null,
    dropIndicator: null,
    scrollInterval: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hasMoved: false, // האם הכרטיס זז מספיק כדי להחשיב את זה כגרירה

    init(viewRenderer) {
      this.viewRenderer = viewRenderer;
      this.createDropIndicator();
    },

    // יצירת האינדיקטור שיראה איפה הכרטיס ישוחרר
    createDropIndicator() {
      if (this.dropIndicator) {
        return;
      }

      // יצירת column wrapper לאינדיקטור (כמו שאר ה-columns)
      const indicatorWrapper = document.createElement("div");
      indicatorWrapper.className =
        "cme_flexSpaceBetweenAlignCenterColumn cme_drop-indicator-wrapper";
      indicatorWrapper.style.width = "0.5em";
      indicatorWrapper.style.flexShrink = "0";
      indicatorWrapper.style.display = "none";
      indicatorWrapper.style.pointerEvents = "none"; // כדי שלא יפריע ל-drag events

      // האינדיקטור עצמו
      const indicator = document.createElement("div");
      indicator.className = "cme_drop-indicator";

      indicatorWrapper.appendChild(indicator);
      this.dropIndicator = indicatorWrapper;
    },

    // הוספת drag events לכרטיס קומבו
    makeCardDraggable(card, comboId) {
      card.setAttribute("draggable", "true");
      card.setAttribute("data-combo-id", comboId);


      // dragstart - התחלת הגרירה
      card.addEventListener("dragstart", (e) =>
        this.handleDragStart(e, card, comboId),
      );

      // dragend - סיום הגרירה
      card.addEventListener("dragend", (e) => this.handleDragEnd(e, card));

      // גוררים מכל הכרטיס חוץ מהשורה העליונה, שהיא אזור פעולות
      const preventDragElements = card.querySelectorAll(`
                .cme_combo-title,
                .cme_combo-edit-btn,
                .cme_delete-btn
            `);

      // משתנה לעקוב אם יש mousedown פעיל
      let mouseDownActive = false;

      preventDragElements.forEach((el) => {
        el.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          card.setAttribute("draggable", "false");
          mouseDownActive = true;
        });

        el.addEventListener("mouseup", () => {
          card.setAttribute("draggable", "true");
          mouseDownActive = false;
        });

        el.addEventListener("mouseleave", () => {
          // אם עזבנו את האלמנט בזמן שיש mousedown, נחזיר draggable=true
          if (mouseDownActive) {
            card.setAttribute("draggable", "true");
            mouseDownActive = false;
          }
        });
      });

      // וידוא נוסף - global mouseup מחזיר draggable=true
      const globalMouseUpHandler = () => {
        if (card.getAttribute("draggable") === "false") {
          card.setAttribute("draggable", "true");
        }
      };

      // שמירת ה-handler כדי שנוכל להסיר אותו אם צריך
      card._globalMouseUpHandler = globalMouseUpHandler;
      document.addEventListener("mouseup", globalMouseUpHandler);
    },

    handleDragStart(e, card, comboId) {
      // השורה העליונה אינה אזור גרירה
      const target = e.target;
      if (
        target.closest(".cme_combo-title") ||
        target.closest(".cme_combo-edit-btn") ||
        target.closest(".cme_delete-btn")
      ) {
        e.preventDefault();
        return;
      }

      // בדיקה שהכותרת לא בעריכה
      const titleElement = card.querySelector(".cme_combo-title h1");
      if (titleElement && document.activeElement === titleElement) {
        e.preventDefault();
        return;
      }

      this.isDragging = true;
      this.hasMoved = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.draggedCard = card;
      this.draggedComboId = comboId;

      // הוספת קלאס לכרטיס הנגרר
      card.classList.add("cme_dragging");

      // הוספת קלאס גם ל-column
      const column = card.closest(".cme_flexSpaceBetweenAlignCenterColumn");
      if (column) {
        column.classList.add("cme_dragging");
      }

      // הגדרת תמונת הגרירה (ghost image)
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", card.innerHTML);
      }

      // הוספת האינדיקטור לקונטיינר אם הוא עדיין לא שם
      const container = this.viewRenderer.viewElement.querySelector(
        "#combos-grid-container",
      );
      if (container && this.dropIndicator) {
        if (!container.contains(this.dropIndicator)) {
          container.appendChild(this.dropIndicator);
        }
      }

      // התחלת בדיקה לגלילה אוטומטית
      this.startAutoScroll(container);
    },

    handleDragEnd(e, card) {

      // נשתמש ב-setTimeout כדי לתת ל-drop event להתבצע לפני שמאפסים
      setTimeout(() => {
        this.isDragging = false;

        // הסרת הקלאס של גרירה
        card.classList.remove("cme_dragging");

        // הסרת הקלאס גם מה-column
        const column = card.closest(".cme_flexSpaceBetweenAlignCenterColumn");
        if (column) {
          column.classList.remove("cme_dragging");
        }

        // הסתרת האינדיקטור (אבל לא הסרה מה-DOM)
        if (this.dropIndicator) {
          this.dropIndicator.style.display = "none";
        }

        // עצירת הגלילה האוטומטית
        this.stopAutoScroll();

        // איפוס המשתנים
        this.draggedCard = null;
        this.draggedComboId = null;
        this.hasMoved = false;
      }, 50);
    },

    // טיפול ב-dragover על הקונטיינר
    handleDragOver(e, container) {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      // לוג רק פעם אחת לכל כמה קריאות כדי לא לספאם
      if (!this._lastLogTime || Date.now() - this._lastLogTime > 500) {
        this._lastLogTime = Date.now();
      }

      if (!this.isDragging || !this.draggedCard) {
        return;
      }

      this.hasMoved = true;

      const afterElement = this.getDragAfterElement(container, e.clientX);

      if (afterElement == null) {
        // הוספה בסוף
        this.showDropIndicator(container, null);
      } else {
        // הוספה לפני האלמנט
        this.showDropIndicator(container, afterElement);
      }
    },

    // טיפול ב-drop על הקונטיינר
    handleDrop(e, container) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.draggedCard) {
        return;
      }

      if (!this.hasMoved) {
        return;
      }

      // מציאת ה-column של הכרטיס הנגרר
      const draggedColumn = this.draggedCard.closest(
        ".cme_flexSpaceBetweenAlignCenterColumn",
      );
      if (!draggedColumn) {
        console.error("[ComboDragHandler] Could not find dragged column");
        return;
      }

      const afterElement = this.getDragAfterElement(container, e.clientX);


      // הזזת ה-column ב-DOM (לא רק הכרטיס)
      if (afterElement == null) {
        container.appendChild(draggedColumn);
      } else {
        container.insertBefore(draggedColumn, afterElement);
      }

      // עדכון הסדר ב-storage
      this.updateComboOrder(container);

      // הסתרת האינדיקטור
      if (this.dropIndicator) {
        this.dropIndicator.style.display = "none";
      }
    },

    // מציאת האלמנט שאחריו צריך להכניס
    getDragAfterElement(container, x) {
      // קבלת כל העמודות (columns) שלא נגררות כרגע ולא האינדיקטור
      const draggableElements = [
        ...container.querySelectorAll(".cme_flexSpaceBetweenAlignCenterColumn"),
      ].filter((col) => {
        // לא לספור את האינדיקטור
        if (col.classList.contains("cme_drop-indicator-wrapper")) return false;

        const card = col.querySelector(".cme_combo-card");
        return card && !card.classList.contains("cme_dragging");
      });

      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = x - box.left - box.width / 2;

          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY },
      ).element;
    },

    // הצגת האינדיקטור
    showDropIndicator(container, beforeElement) {
      if (!this.dropIndicator) {
        return;
      }

      // אם האינדיקטור לא בתוך הקונטיינר, נוסיף אותו
      if (!container.contains(this.dropIndicator)) {
        if (beforeElement) {
          container.insertBefore(this.dropIndicator, beforeElement);
        } else {
          container.appendChild(this.dropIndicator);
        }
      } else {
        // האינדיקטור כבר בקונטיינר, רק נזיז אותו
        if (beforeElement && this.dropIndicator.nextSibling !== beforeElement) {
          container.insertBefore(this.dropIndicator, beforeElement);
        } else if (
          !beforeElement &&
          this.dropIndicator !== container.lastChild
        ) {
          container.appendChild(this.dropIndicator);
        }
      }

      // הצגת האינדיקטור
      this.dropIndicator.style.display = "flex";
    },

    // עדכון הסדר ב-storage
    updateComboOrder(container) {
      const columns = [
        ...container.querySelectorAll(".cme_flexSpaceBetweenAlignCenterColumn"),
      ];
      const orderedIds = columns
        .map((col) => {
          const card = col.querySelector(".cme_combo-card");
          return card ? card.getAttribute("data-combo-id") : null;
        })
        .filter((id) => id !== null);

      // שליפת הקומבואים ועדכון ה-order שלהם
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];

        // עדכון ה-order לפי המיקום החדש
        orderedIds.forEach((id, index) => {
          const combo = combos.find((c) => c.id.toString() === id);
          if (combo) {
            combo.order = index;
          }
        });

        // מיון לפי order
        combos.sort((a, b) => (a.order || 0) - (b.order || 0));

        chrome.storage.local.set({ savedCombos: combos }, () => {

          // מחיקה אוטומטית של קומבואים ריקים
          const ComboCleaner = window.TankiQoL.ComboCleaner;
          if (ComboCleaner && ComboCleaner.removeEmptyCombos) {
            ComboCleaner.removeEmptyCombos();
          }
        });
      });
    },

    // גלילה אוטומטית כשמגיעים לקצוות
    startAutoScroll(container) {
      if (!container) return;

      this.scrollInterval = setInterval(() => {
        if (!this.isDragging) {
          this.stopAutoScroll();
          return;
        }

        const rect = container.getBoundingClientRect();
        const scrollEdgeSize = 100; // פיקסלים מהקצה שמתחילה גלילה
        const scrollSpeed = 10; // מהירות הגלילה

        // קבלת מיקום העכבר
        const mouseX = this.currentMouseX;
        if (mouseX === undefined) return;

        // בדיקה אם העכבר בקצה שמאלי
        if (mouseX < rect.left + scrollEdgeSize) {
          container.scrollLeft -= scrollSpeed;
        }

        // בדיקה אם העכבר בקצה ימני
        if (mouseX > rect.right - scrollEdgeSize) {
          container.scrollLeft += scrollSpeed;
        }
      }, 16); // ~60fps

      // מאזין לתנועת העכבר כדי לדעת את המיקום
      document.addEventListener("dragover", this.trackMousePosition);
    },

    stopAutoScroll() {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
      }
      document.removeEventListener("dragover", this.trackMousePosition);
    },

    // מעקב אחרי מיקום העכבר
    trackMousePosition: function (e) {
      if (window.TankiQoL.ComboDragHandler) {
        window.TankiQoL.ComboDragHandler.currentMouseX = e.clientX;
      }
    },
  };
})();
