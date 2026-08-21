// features/combos/ui/view/hide_guard.js

// מחיל מחדש את ההסתרה על תוכן שהמשחק מרנדר אחרי שהכרטיסייה נפתחה
// הרציונל: CLAUDE.mds/combos.md

(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;

  Object.assign(window.TankiQoL.ViewRenderer, {
    hideGuardObserver: null,

    startHideGuard() {
      if (this.hideGuardObserver) return;

      // בלי המוסך אין מה לשמור, וגם אין על מה לצפות
      const wrapper = document.querySelector(DOM.GARAGE_WRAPPER);
      if (!wrapper) return;

      this.hideGuardObserver = new MutationObserver((mutations) => {
        // התצוגה נסגרה בדרך שלא עברה ב-hide()
        if (!this.isViewVisible()) {
          this.stopHideGuard();
          return;
        }
        if (this.isOwnMutation(mutations)) return;
        // סינכרוני, ולכן התוכן החדש לא נצבע אפילו לפריים אחד
        this.hideGameContent();
      });

      // childList בלבד: שינויי ה-style שלנו לא מחזירים אותנו לכאן
      this.hideGuardObserver.observe(wrapper, {
        childList: true,
        subtree: true,
      });
    },

    stopHideGuard() {
      if (!this.hideGuardObserver) return;
      this.hideGuardObserver.disconnect();
      this.hideGuardObserver = null;
    },

    isViewVisible() {
      return (
        !!this.viewElement &&
        this.viewElement.style.display !== "none" &&
        document.contains(this.viewElement)
      );
    },

    // רינדור הכרטיסים שלנו לא מצריך הסתרה מחדש
    isOwnMutation(mutations) {
      const view = this.viewElement;
      if (!view) return false;
      return mutations.every((m) => view.contains(m.target));
    },
  });
})();
