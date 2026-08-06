// shared/components/select.js

// קומפוננטת dropdown בסגנון DropDownStyle של המשחק
//
// כל אפשרות היא { value, text, flag?, title? }. השדה flag (כתובת תמונה) מציג
// דגל קטן לפני הטקסט — גם בטריגר וגם בשורות הרשימה — בדיוק כמו בבורר השפה
// של המשחק (SettingsComponentStyle-dropdownPlaceholder: <img> + <span>).
// השדה title מוסיף tooltip בריחוף (למשל שם שפה מלא כשהטקסט הוא קוד קצר).
// שני השדות אופציונליים, ולכן שימושים ותיקים שלא מעבירים אותם עובדים כרגיל.
(function () {
  "use strict";

  const NS = (window.TankiQoL = window.TankiQoL || {});

  NS.Select = {
    // יצירת dropdown חדש
    create(options = {}) {
      const id = options.id || "cme_select-" + Date.now();
      const label = options.label || "";
      const selectOptions = options.options || [];
      const selected =
        options.selected ||
        (selectOptions.length > 0 ? selectOptions[0].value : "");
      const onChange = options.onChange || null;

      // קונטיינר ראשי
      const container = document.createElement("div");
      container.className = "cme_select-container";
      container.id = id;

      // תווית
      if (label) {
        const labelEl = document.createElement("h3");
        labelEl.className = "cme_select-label";
        labelEl.textContent = label;
        container.appendChild(labelEl);
      }

      // טריגר (כפתור הפתיחה)
      const trigger = document.createElement("div");
      trigger.className = "cme_select-trigger";

      const triggerText = document.createElement("div");
      triggerText.className = "cme_select-trigger-text";
      const triggerImg = document.createElement("img");
      triggerImg.className = "cme_select-flag";
      triggerImg.style.display = "none";
      const triggerSpan = document.createElement("span");
      triggerText.appendChild(triggerImg);
      triggerText.appendChild(triggerSpan);
      trigger.appendChild(triggerText);

      // שיקוף אפשרות (דגל + טקסט) אל תוך הטריגר
      function setTrigger(opt) {
        if (opt && opt.flag) {
          triggerImg.src = opt.flag;
          triggerImg.style.display = "";
        } else {
          triggerImg.removeAttribute("src");
          triggerImg.style.display = "none";
        }
        triggerSpan.textContent = opt ? opt.text : "";
      }

      const arrow = document.createElement("div");
      arrow.className = "cme_select-arrow";
      trigger.appendChild(arrow);

      container.appendChild(trigger);

      // רשימת אפשרויות — קונטיינר חיצוני + פנימי כמו במשחק
      const optionsList = document.createElement("div");
      optionsList.className = "cme_select-options";

      const optionsInner = document.createElement("div");
      optionsInner.className = "cme_select-options-inner";
      optionsList.appendChild(optionsInner);

      let currentValue = selected;

      // בניית אפשרויות
      function buildOptions() {
        optionsInner.innerHTML = "";
        selectOptions.forEach((opt) => {
          // מבנה: div > div.option > span
          const wrapper = document.createElement("div");

          const optionEl = document.createElement("div");
          optionEl.className = "cme_select-option";
          if (opt.value === currentValue) {
            optionEl.classList.add("cme_select-selected");
          }
          optionEl.dataset.value = opt.value;
          if (opt.title) optionEl.title = opt.title;
          if (opt.flag) {
            const optImg = document.createElement("img");
            optImg.className = "cme_select-flag";
            optImg.src = opt.flag;
            optionEl.appendChild(optImg);
          }
          const optSpan = document.createElement("span");
          optSpan.textContent = opt.text;
          optionEl.appendChild(optSpan);

          wrapper.appendChild(optionEl);

          wrapper.addEventListener("click", (e) => {
            e.stopPropagation();
            currentValue = opt.value;
            setTrigger(opt);
            closeDropdown();
            buildOptions();
            if (onChange) onChange(opt.value);
          });

          optionsInner.appendChild(wrapper);
        });
      }

      container.appendChild(optionsList);

      // עדכון הטריגר (דגל + טקסט) לפי הערך הנבחר
      setTrigger(selectOptions.find((o) => o.value === selected));

      buildOptions();

      // פתיחה/סגירה
      function toggleDropdown() {
        container.classList.toggle("cme_select-open");
      }

      function closeDropdown() {
        container.classList.remove("cme_select-open");
      }

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleDropdown();
      });

      // לחיצה מחוץ סוגרת
      document.addEventListener("click", () => {
        closeDropdown();
      });

      // API לעדכון מבחוץ
      container._setValue = function (value) {
        currentValue = value;
        setTrigger(selectOptions.find((o) => o.value === value));
        buildOptions();
      };

      container._getValue = function () {
        return currentValue;
      };

      return container;
    },
  };
})();
