// features/combos/view/scroll.js

// גלילה אופקית של רשימת הקומבואים וניהול נראות החיצים.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    _bindScrolling() {
      const combosContainer = this.viewElement.querySelector(
        "#combos-grid-container",
      );
      const arrowLeft = this.viewElement.querySelector(".cme_arrowLeft");
      const arrowRight = this.viewElement.querySelector(".cme_arrowRight");

      if (combosContainer) {
        // המרת גלילת גלגלת אנכית לגלילה אופקית
        combosContainer.addEventListener(
          "wheel",
          (e) => {
            if (e.deltaX !== 0) {
              return;
            }
            if (e.deltaY !== 0) {
              e.preventDefault();
              combosContainer.scrollLeft += e.deltaY;
              this.updateArrowsVisibility(
                combosContainer,
                arrowLeft,
                arrowRight,
              );
            }
          },
          { passive: false },
        );

        combosContainer.addEventListener("scroll", () => {
          this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
        });

        window.addEventListener("resize", () => {
          this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
        });
      }

      if (arrowLeft) {
        arrowLeft.onclick = () => {
          if (combosContainer) {
            const scrollAmount = combosContainer.clientWidth * 0.5;
            combosContainer.scrollBy({
              left: -scrollAmount,
              behavior: "smooth",
            });
          }
        };
      }

      if (arrowRight) {
        arrowRight.onclick = () => {
          if (combosContainer) {
            const scrollAmount = combosContainer.clientWidth * 0.5;
            combosContainer.scrollBy({
              left: scrollAmount,
              behavior: "smooth",
            });
          }
        };
      }
    },

    // חץ מופיע רק אם יש לאן לגלול בכיוון שלו
    updateArrowsVisibility(container, arrowLeft, arrowRight) {
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (arrowLeft) {
        arrowLeft.style.opacity = scrollLeft > 10 ? "1" : "0";
      }
      if (arrowRight) {
        arrowRight.style.opacity = scrollLeft < maxScrollLeft - 10 ? "1" : "0";
      }
    },
  });
})();
