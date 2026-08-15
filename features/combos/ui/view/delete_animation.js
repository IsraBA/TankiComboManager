// features/combos/ui/view/delete_animation.js

// אנימציית גריסת הכרטיס: רעידה, פירוק לרצועות, ואז קריסת העמודה.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    playDeleteAnimation(card, column, callback) {
      const STRIP_COUNT = 7;

      card.classList.add("cme_shake");

      setTimeout(() => {
        const cardRect = card.getBoundingClientRect();
        const computedFontSize = getComputedStyle(card).fontSize;
        const strips = [];

        for (let i = 0; i < STRIP_COUNT; i++) {
          const stripEl = card.cloneNode(true);
          const topPercent = (i / STRIP_COUNT) * 100;
          const bottomPercent = ((STRIP_COUNT - i - 1) / STRIP_COUNT) * 100;

          stripEl.style.cssText = `
                        position: fixed;
                        top: ${cardRect.top}px;
                        left: ${cardRect.left}px;
                        width: ${cardRect.width}px;
                        height: ${cardRect.height}px;
                        clip-path: inset(${topPercent}% 0 ${bottomPercent}% 0);
                        pointer-events: none;
                        z-index: 99999;
                        margin: 0;
                        font-size: ${computedFontSize};
                        will-change: transform, opacity;
                        transition: transform 0.55s cubic-bezier(.22,.61,.36,1), opacity 0.45s ease-out;
                        transition-delay: ${i * 0.035}s;
                    `;
          stripEl.classList.add("cme_shred-strip");
          stripEl.classList.remove("cme_shake");

          document.body.appendChild(stripEl);
          strips.push(stripEl);
        }

        card.style.visibility = "hidden";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            strips.forEach((strip, i) => {
              const direction = i % 2 === 0 ? 1 : -1;
              const translateX = direction * (30 + Math.random() * 70);
              const translateY = 15 + Math.random() * 45;
              const rotate = direction * (2 + Math.random() * 10);

              strip.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
              strip.style.opacity = "0";
            });
          });
        });

        const totalAnimTime = STRIP_COUNT * 35 + 550;
        setTimeout(() => {
          strips.forEach((s) => s.remove());
          column.classList.add("cme_column-collapsing");

          setTimeout(callback, 320);
        }, totalAnimTime);
      }, 300);   // המתנה לסיום הרעידה
    },
  });
})();
