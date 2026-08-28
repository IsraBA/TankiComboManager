// features/advisor/view/protection_panel.js

// מזריק את ההגנות המומלצות לכרטיסיית ההגנות, ומצייד בלחיצה.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // כל סלקטורי המשחק חיים ב-lib/constants.js; נטען לפנינו
  const DOM = window.TankiQoL.DOM;
  const COLUMN = DOM.PROTECTION_COLUMN;
  const EQUIP_BLOCK = DOM.PROTECTION_EQUIP_BLOCK;

  const ROOT_ID = "cme_adv-root";
  const POLL_MS = 1000;

  let timer = null;
  let observer = null;
  let nudge = null;
  let lastSig = null;
  let equipping = false;

  // ---- הזרקה ----

  function mount(node) {
    const column = document.querySelector(COLUMN);
    if (!column || !column.querySelector(EQUIP_BLOCK)) return false;
    column.appendChild(node);
    return true;
  }

  function remove() {
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();
    lastSig = null;
  }

  // ---- הצטיידות ----

  async function equipRecommended(rec) {
    if (equipping || !rec.equip.length) return;
    equipping = true;
    const root = document.getElementById(ROOT_ID);
    if (root) root.classList.add("cme_adv-busy");
    try {
      const loader = window.TankiQoL.InstantLoader;
      if (!loader) return;
      const protection = [null, null, null, null];
      rec.equip.slice(0, 4).forEach((m, i) => {
        protection[i] = { id: m.id, baseItemId: m.id, name: m.name, image: m.image };
      });
      // כאן הכל הגנות, ולכן ההעדפה הכללית נדרסת
      await loader.equipCombo(
        { id: -1, name: "recommended", data: { protection }, removedItems: {} },
        { forceProtections: true },
      );
    } catch (e) {
      console.error("[Advisor] equipping the recommendation failed", e);
    } finally {
      equipping = false;
      if (root) root.classList.remove("cme_adv-busy");
    }
  }

  // ---- מחזור חיים ----

  async function refresh() {
    if (!document.querySelector(COLUMN)) {
      remove();
      return;
    }
    const bridge = window.TankiQoL.AdvisorBridge;
    const model = window.TankiQoL.AdvisorRecommend;
    const render = window.TankiQoL.AdvisorPanelRender;
    if (!bridge || !model || !render) return;

    const state = await bridge.readState();
    // אין קרב או שהמוסך חוסם — אותה בדיקה שהקומבואים עושים
    if (!state || !state.ok || !state.inBattle || state.cooling) {
      remove();
      return;
    }

    render.harvestIcons();
    const rec = model.recommend({
      turrets: state.turrets,
      modules: state.modules,
      mounted: state.mounted,
    });
    if (!rec.equip.length) {
      remove();
      return;
    }

    // האייקונים מגיעים מה-DOM, ולכן הם חלק מהחתימה
    const sig = rec.equip.map((m) => m.id + ":" + render.iconFor(m)).join("|") +
                "#" + rec.ordered.map((m) => m.id).join(",") +
                "#" + rec.equipped;
    const existing = document.getElementById(ROOT_ID);
    if (existing && sig === lastSig) return;

    const node = render.build(rec, ROOT_ID, () => equipRecommended(rec));
    if (existing) existing.replaceWith(node);
    else if (!mount(node)) return;
    lastSig = sig;
  }

  window.TankiQoL.AdvisorPanel = {
    start() {
      if (timer) return;
      timer = setInterval(() => {
        refresh().catch(() => { /* סבב אחד נכשל; הבא ינסה שוב */ });
      }, POLL_MS);
      // מעבר לכרטיסייה או רינדור של המשחק — מרעננים מיד ולא בסקר הבא
      observer = new MutationObserver(() => {
        if (document.getElementById(ROOT_ID)) return;
        if (!document.querySelector(COLUMN)) return;
        lastSig = null;
        if (nudge) return;
        nudge = setTimeout(() => {
          nudge = null;
          refresh().catch(() => {});
        }, 50);
      });
      // על ה-wrapper של המוסך ולא על body, כמו ה-hide_guard
      const wrapper = document.querySelector(DOM.GARAGE_WRAPPER);
      observer.observe(wrapper || document.body, { childList: true, subtree: true });
      refresh().catch(() => {});
    },

    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (nudge) clearTimeout(nudge);
      nudge = null;
      if (observer) observer.disconnect();
      observer = null;
      remove();
    },
  };
})();
