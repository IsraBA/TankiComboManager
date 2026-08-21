// features/combos/view/view_renderer.js

// בסיס תצוגת הקומבואים: יצירת ה-view, המתנה לאלמנטים, הצגה והסתרה.
// שאר היכולות נוספות כ-mixins מתוך view/ (ראה סדר הטעינה ב-manifest).

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ViewRenderer = {
    viewElement: null,
    enterKeyHandler: null,
    dragHandlerInitialized: false,
    temporaryCardColumn: null,

    async init() {
      const LanguageManager = window.TankiQoL.LanguageManager;
      if (LanguageManager) {
        LanguageManager.detectLanguage();
      }

      const garageMenuContainer = document.querySelector(
        DOM.GARAGE_MENU_CONTAINER,
      );
      if (!garageMenuContainer) return;

      // האלמנט כבר קיים — לוודא רק שהוא במקום הנכון
      let existingElement = document.getElementById("combo-manager-view");

      if (existingElement) {
        this.viewElement = existingElement;
        const parent = garageMenuContainer.parentNode;
        if (parent && existingElement.parentNode === parent) {
          const menuIndex = Array.from(parent.children).indexOf(
            garageMenuContainer,
          );
          const viewIndex = Array.from(parent.children).indexOf(
            existingElement,
          );
          if (viewIndex <= menuIndex) {
            garageMenuContainer.insertAdjacentElement(
              "afterend",
              existingElement,
            );
          }
        } else {
          garageMenuContainer.insertAdjacentElement(
            "afterend",
            existingElement,
          );
        }
        if (!this.dragHandlerInitialized) {
          this.initDragHandler();
        }
        return;
      }

      this.viewElement = document.createElement("div");
      this.viewElement.id = "combo-manager-view";
      this.viewElement.className = "cme_container";
      this.viewElement.style.display = "none";

      const htmlContent = await this.loadViewHTML();
      this.viewElement.innerHTML = htmlContent;

      garageMenuContainer.insertAdjacentElement("afterend", this.viewElement);

      this.bindEvents();
      this.initDragHandler();
      this.ensureAllCombosHaveOrder();
    },

    // המתנה לאלמנט בתוך ה-view בלי sleep
    waitForElementInView(selector, timeout = 5000) {
      return new Promise((resolve) => {
        if (!this.viewElement) {
          resolve(null);
          return;
        }

        const existing = this.viewElement.querySelector(selector);
        if (existing) {
          resolve(existing);
          return;
        }

        const observer = new MutationObserver((mutations, obs) => {
          if (!this.viewElement) return;
          const found = this.viewElement.querySelector(selector);
          if (found) {
            obs.disconnect();
            clearTimeout(timeoutId);
            resolve(found);
          }
        });

        observer.observe(this.viewElement, { childList: true, subtree: true });

        const timeoutId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    },

    show() {
      if (this.viewElement) {
        this.viewElement.style.display = "flex";
        this.loadAndRenderCombos();
      }

      this.hideGameContent();
      this.startHideGuard();
      this.startCooldownGuard();
    },

    // המשחק מרנדר מחדש ומאבד את ההסתרה, ולכן זה נקרא גם מהשומר
    hideGameContent() {
      const elementsToHide = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
      elementsToHide.forEach((el) => (el.style.display = "none"));
      this.keepTankPreviewAlive(true);
    },

    hide() {
      this.stopHideGuard();
      this.stopCooldownGuard();
      if (this.viewElement) this.viewElement.style.display = "none";

      this.removeTemporaryCard();

      const elementsToRestore = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
      elementsToRestore.forEach((el) => (el.style.display = ""));
      this.keepTankPreviewAlive(false);
      const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
      if (tankCanvas) {
        tankCanvas.style.removeProperty("display");
      }

      // מאזין ה-Enter נשאר מותקן ובודק בעצמו אם ה-view גלוי
    },
  };
})();
