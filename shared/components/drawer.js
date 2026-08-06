// shared/components/drawer.js

// קומפוננטת מגירה (drawer) גנרית — פאנל צדדי עם overlay
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.Drawer = {
    // יצירת מופע drawer חדש
    create(options = {}) {
      const id = options.id || "cme_drawer-" + Date.now();
      const title = options.title || "";
      const onClose = options.onClose || null;
      const imgSrc = options.imgSrc || null;

      let rootElement = null;
      let overlayElement = null;
      let panelElement = null;
      let contentElement = null;
      let escapeHandler = null;
      let isOpen = false;

      // בניית ה-DOM של הדרוור
      function build() {
        if (rootElement) return;

        rootElement = document.createElement("div");
        rootElement.id = id;
        rootElement.style.display = "none";

        // אוברליי
        overlayElement = document.createElement("div");
        overlayElement.className = "cme_drawer-overlay";
        rootElement.appendChild(overlayElement);

        // פאנל
        panelElement = document.createElement("div");
        panelElement.className = "cme_drawer-panel";
        rootElement.appendChild(panelElement);

        // כותרת
        const header = document.createElement("div");
        header.className = "cme_drawer-header";

        const titleEl = document.createElement("div");
        titleEl.className = "cme_drawer-title";
        const titleSpan = document.createElement("span");
        titleSpan.textContent = title;
        titleEl.appendChild(titleSpan);
        header.appendChild(titleEl);

        // קונטיינר ימני — Z badge + כפתור סגירה X (צמודים)
        const rightGroup = document.createElement("div");
        rightGroup.className = "cme_drawer-header-right";

        const hotkeyBadge = document.createElement("div");
        hotkeyBadge.className = "cme_drawer-hotkey";
        hotkeyBadge.textContent = "Z";
        rightGroup.appendChild(hotkeyBadge);

        const closeBtn = document.createElement("div");
        closeBtn.className = "cme_drawer-close";
        closeBtn.addEventListener("click", hide);
        rightGroup.appendChild(closeBtn);

        header.appendChild(rightGroup);

        panelElement.appendChild(header);

        // תמונה (אם ניתנה)
        if (imgSrc) {
          const imageContainer = document.createElement("div");
          imageContainer.className = "cme_drawer-image";
          const img = document.createElement("img");
          img.src = imgSrc;
          imageContainer.appendChild(img);
          panelElement.appendChild(imageContainer);
        }

        // אזור תוכן
        contentElement = document.createElement("div");
        contentElement.className = "cme_drawer-content";
        panelElement.appendChild(contentElement);

        // פוטר עם כפתור Close
        const footer = document.createElement("div");
        footer.className = "cme_drawer-footer";
        const closeFooterBtn = document.createElement("div");
        closeFooterBtn.className = "cme_drawer-close-btn";
        const closeBtnSpan = document.createElement("span");
        const LM = window.TankiQoL.LanguageManager;
        closeBtnSpan.textContent = LM
          ? LM.getUIText("randomizerClose")
          : "Close";
        closeFooterBtn.appendChild(closeBtnSpan);
        closeFooterBtn.addEventListener("click", hide);
        footer.appendChild(closeFooterBtn);
        panelElement.appendChild(footer);

        // לחיצה על overlay סוגרת
        overlayElement.addEventListener("click", hide);

        // מניעת סגירה בלחיצה על הפאנל עצמו
        panelElement.addEventListener("click", (e) => {
          e.stopPropagation();
        });

        document.body.appendChild(rootElement);
      }

      // פתיחת הדרוור
      function show() {
        if (isOpen) return;

        build();
        rootElement.style.display = "block";
        isOpen = true;

        // האזנה ל-ESC ו-Z
        escapeHandler = (e) => {
          // לא סוגרים אם אנחנו בתוך input/select
          if (
            e.target.tagName === "INPUT" ||
            e.target.tagName === "TEXTAREA" ||
            e.target.isContentEditable
          ) {
            return;
          }
          const keyCode = e.code || e.keyCode;
          if (
            e.key === "Escape" ||
            keyCode === "Escape" ||
            keyCode === 27 ||
            keyCode === "KeyZ" ||
            keyCode === 90
          ) {
            e.preventDefault();
            e.stopPropagation();
            hide();
          }
        };
        document.addEventListener("keydown", escapeHandler, true);
      }

      // סגירת הדרוור
      function hide() {
        if (!isOpen) return;

        if (rootElement) {
          rootElement.style.display = "none";
        }
        isOpen = false;

        // ניקוי event listener
        if (escapeHandler) {
          document.removeEventListener("keydown", escapeHandler, true);
          escapeHandler = null;
        }

        if (onClose) onClose();
      }

      // הגדרת תוכן (HTML string)
      function setContent(html) {
        build();
        contentElement.innerHTML = html;
      }

      // הגדרת תוכן (אלמנט DOM)
      function setContentElement(element) {
        build();
        contentElement.innerHTML = "";
        contentElement.appendChild(element);
      }

      return {
        show,
        hide,
        setContent,
        setContentElement,
        get element() {
          return rootElement;
        },
        get contentElement() {
          return contentElement;
        },
        get isOpen() {
          return isOpen;
        },
      };
    },
  };
})();
