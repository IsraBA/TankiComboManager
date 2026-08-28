// features/advisor/view/panel_render.js

// בונה את ה-DOM של ההגנות המומלצות. הרציונל: CLAUDE.mds/advisor.md

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // כל סלקטורי המשחק חיים ב-lib/constants.js; נטען לפנינו
  const DOM = window.TankiQoL.DOM;

  // שם מודול -> כתובת אייקון, נקצר מרשימת ההגנות של המשחק
  const iconByName = new Map();

  function text(key) {
    const LM = window.TankiQoL.LanguageManager;
    return LM && LM.getUIText ? LM.getUIText(key) : key;
  }

  function harvestIcons() {
    for (const cell of document.querySelectorAll(DOM.ITEM_LIST_CONTAINER)) {
      const nameEl = cell.querySelector(DOM.ITEM_DESCRIPTION_DEVICE + " span");
      const iconEl = cell.querySelector(DOM.PROTECTION_LIST_RESISTANCE_ICON);
      if (!nameEl || !iconEl || !iconEl.src) continue;
      const name = (nameEl.textContent || "").trim();
      if (name) iconByName.set(name, iconEl.src);
    }
  }

  // גיבוי: האייקון מה-state, ואז תמונת הפריט
  function iconFor(mod) {
    const byName = iconByName.get((mod.name || "").trim());
    return byName || mod.icon || mod.preview || null;
  }

  function slotEl(mod) {
    // מחלקות המשחק נותנות מסגרת ומידות; שלנו מנטרלת hover
    const slot = document.createElement("div");
    slot.className = "cme_adv-slot " + DOM.PROTECTION_SLOT_CLASSES;
    const icon = document.createElement("div");
    icon.className = "cme_adv-slot-icon";
    const img = document.createElement("img");
    img.src = iconFor(mod) || "";
    img.alt = mod.name || "";
    icon.appendChild(img);
    slot.appendChild(icon);
    slot.title = (mod.name || "") + " — " + mod.percent + "%";
    return slot;
  }

  function orderRow(ordered) {
    const row = document.createElement("div");
    row.className = "cme_adv-order";
    for (const mod of ordered) {
      const img = document.createElement("img");
      img.className = "cme_adv-order-icon";
      img.src = iconFor(mod) || "";
      img.alt = mod.name || "";
      img.title = mod.name + " — " + mod.kills + " kills";
      row.appendChild(img);
    }
    return row;
  }

  // מבנה זהה לכפתור unequip all: תיבה עם סמן, ואז תווית
  function equipButton(onEquip) {
    const btn = document.createElement("div");
    btn.className = "cme_adv-equip " + DOM.PROTECTION_UNEQUIP_ROW_CLASS;
    const mark = document.createElement("div");
    mark.className = "cme_adv-equip-mark -borderRadius4px -boxShadowForButton";
    mark.innerHTML = window.TankiQoL.Icons.check("cme_adv-check");
    const label = document.createElement("span");
    label.className = "cme_adv-equip-label -medium";
    label.textContent = text("advisorEquipAll");
    btn.appendChild(mark);
    btn.appendChild(label);
    btn.addEventListener("click", onEquip);
    return btn;
  }

  window.TankiQoL.AdvisorPanelRender = {
    harvestIcons,
    iconFor,

    build(rec, rootId, onEquip) {
      const root = document.createElement("div");
      root.id = rootId;
      root.className = "cme_adv-root";

      const head = document.createElement("div");
      head.className = "cme_adv-headline";
      head.textContent = text("advisorHeadline");
      root.appendChild(head);

      if (rec.ordered.length) root.appendChild(orderRow(rec.ordered));

      // החריצים והכפתור זה לצד זה, כמו השורה של המשחק
      const main = document.createElement("div");
      main.className = "cme_adv-main";
      const slots = document.createElement("div");
      slots.className = "cme_adv-slots";
      for (const mod of rec.equip) slots.appendChild(slotEl(mod));
      main.appendChild(slots);
      // הכל כבר מורכב — לחיצה לא הייתה משנה דבר
      if (!rec.equipped) main.appendChild(equipButton(onEquip));
      root.appendChild(main);

      return root;
    },
  };
})();
