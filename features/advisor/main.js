// features/advisor/main.js

// מפעיל את פאנל ההגנות המומלצות ברגע שהמוסך על המסך.

(function () {
  "use strict";

  // אותו קצב כמו של הקומבואים
  const CHECK_MS = 300;

  function inGarage() {
    const DOM = window.TankiQoL.DOM;
    if (!DOM || !DOM.MENU_CONTAINER) return false;
    return !!document.querySelector(DOM.MENU_CONTAINER);
  }

  let running = false;
  setInterval(() => {
    const panel = window.TankiQoL.AdvisorPanel;
    if (!panel) return;
    const here = inGarage();
    if (here && !running) {
      running = true;
      panel.start();
    } else if (!here && running) {
      running = false;
      panel.stop();
    }
  }, CHECK_MS);
})();
