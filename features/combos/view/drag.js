// features/combos/view/drag.js

// חיבור אירועי הגרירה לקונטיינר הכרטיסים, פעם אחת לכל קונטיינר.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    initDragHandler() {
      if (this.dragHandlerInitialized) return;

      if (window.TankiQoL.ComboDragHandler) {
        window.TankiQoL.ComboDragHandler.init(this);
        this.dragHandlerInitialized = true;
      }
    },

    // נקרא אחרי כל רינדור; הדגל על הקונטיינר מונע listeners כפולים
    bindDragEvents(container) {
      if (!container) return;

      const dragHandler = window.TankiQoL.ComboDragHandler;
      if (!dragHandler) return;

      if (!container._dragEventsAdded) {
        container.addEventListener("dragover", (e) => {
          dragHandler.handleDragOver(e, container);
        });
        container.addEventListener("drop", (e) => {
          dragHandler.handleDrop(e, container);
        });
        container.addEventListener("dragenter", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        container.addEventListener("dragleave", (e) => {
          e.preventDefault();
        });

        container._dragEventsAdded = true;
      }
    },
  });
})();
