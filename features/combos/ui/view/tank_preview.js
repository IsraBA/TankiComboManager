// features/combos/ui/view/tank_preview.js

// שמירה על תצוגת הטנק המסתובבת בזמן שהכרטיסייה שלנו פתוחה.
//
// המשחק מודד את #tankPreviewContainer כדי למקם את המודל, ולכן המארח חייב
// להישאר עם תיבה אמיתית — אב ב-display:none מאפס אותה, וכל מדידה מחדש
// (שינוי גודל, החלפת צבע) מעלימה את המודל וגם הורגת את הגרירה.
// לכן מוציאים את המארח מהזרימה במקום להסתירו, ומסתירים רק את האחים
// שלאורך המסלול אל התצוגה — גנרי, בלי לנקוב בשמות מחלקות של טאבים.

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;

  Object.assign(window.TankiQoL.ViewRenderer, {
    keepTankPreviewAlive(active) {
      const wrapper = document.querySelector(DOM.GARAGE_WRAPPER);
      if (!wrapper) return;
      const hosts = document.querySelectorAll(DOM.PREVIEW_HOSTS);

      // כל מה שהסתרנו מסומן, ולכן אין צורך לזכור רשימות
      document.querySelectorAll("[data-cme-preview-hidden]").forEach((el) => {
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

        host.style.position = "absolute";
        host.style.top = "0";
        host.style.left = "0";
        host.style.margin = "0";
        host.style.zIndex = "0";

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
