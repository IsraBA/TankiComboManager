// shared/components/switch.js

// קומפוננטת מתג (toggle switch) בסגנון הגדרות המשחק
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.Switch = {
    // יצירת מתג חדש
    create(options = {}) {
      const id = options.id || "cme_switch-" + Date.now();
      const label = options.label || "";
      const checked = options.checked !== undefined ? options.checked : false;
      const onChange = options.onChange || null;

      // שורה ראשית
      const row = document.createElement("div");
      row.className = "cme_switch-row";
      row.id = id;
      row.dataset.checked = String(checked);

      // מסלול (track)
      const track = document.createElement("span");
      track.className = "cme_switch-track";
      track.dataset.checked = String(checked);

      // תווית
      const labelEl = document.createElement("div");
      labelEl.className = "cme_switch-label";
      const labelSpan = document.createElement("span");
      labelSpan.textContent = label;
      labelEl.appendChild(labelSpan);

      // לחיצה על המסלול או על התווית מחליפה מצב
      function toggle() {
        const newState = track.dataset.checked !== "true";
        track.dataset.checked = String(newState);
        row.dataset.checked = String(newState);
        if (onChange) onChange(newState);
      }

      track.addEventListener("click", toggle);
      labelEl.addEventListener("click", toggle);

      row.appendChild(track);
      row.appendChild(labelEl);

      // API לעדכון מצב מבחוץ
      row._setChecked = function (value) {
        track.dataset.checked = String(value);
        row.dataset.checked = String(value);
      };

      row._getChecked = function () {
        return track.dataset.checked === "true";
      };

      return row;
    },
  };
})();
