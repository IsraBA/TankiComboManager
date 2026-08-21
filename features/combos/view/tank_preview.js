// features/combos/view/tank_preview.js

// שמירה על תצוגת הטנק המסתובבת בזמן שהכרטיסייה שלנו פתוחה.
//
// #tankPreviewContainer הוא גם תיבת המדידה וגם משטח הגרירה של המשחק,
// ולכן חייב להישאר עם תיבה אמיתית ומעל הקנבס. הרציונל המלא:
// CLAUDE.mds/combos.md

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;

  Object.assign(window.TankiQoL.ViewRenderer, {
    keepTankPreviewAlive(active) {
      const wrapper = document.querySelector(DOM.GARAGE_WRAPPER);
      if (!wrapper) return;
      // מחפשים בתוך המוסך: השומר קורא לכאן על כל שינוי DOM
      const hosts = wrapper.querySelectorAll(DOM.PREVIEW_HOSTS);

      // כל מה שהסתרנו מסומן, ולכן אין צורך לזכור רשימות
      wrapper.querySelectorAll("[data-cme-preview-hidden]").forEach((el) => {
        el.style.removeProperty("display");
        delete el.dataset.cmePreviewHidden;
      });

      if (!active) {
        wrapper.style.removeProperty("position");
        hosts.forEach((host) => {
          for (const p of ["position", "top", "left", "margin", "z-index"]) {
            host.style.removeProperty(p);
          }
        });
        return;
      }

      // כדי שה-absolute יתמקם ביחס למוסך ולא לחלון
      wrapper.style.position = "relative";

      hosts.forEach((host) => {
        const preview = host.querySelector(DOM.TANK_PREVIEW);
        if (!preview) {
          // אין תצוגה במארח הזה — אין מה לשמר
          host.dataset.cmePreviewHidden = "1";
          host.style.display = "none";
          return;
        }

        // בלי z-index בכוונה: הוא היה יוצר הקשר ערימה וכולא את
        // #tankPreviewContainer מתחת לקנבס. התצוגה שלנו מדורגת מעליו.
        host.style.position = "absolute";
        host.style.top = "0";
        host.style.left = "0";
        host.style.margin = "0";

        // מטפסים מהתצוגה כלפי מעלה ומסתירים את האחים בכל רמה
        for (let el = preview; el && el !== host; el = el.parentElement) {
          const parent = el.parentElement;
          if (!parent) break;
          for (const sib of parent.children) {
            if (sib === el) continue;
            sib.dataset.cmePreviewHidden = "1";
            sib.style.display = "none";
          }
        }
      });
    },
  });
})();
