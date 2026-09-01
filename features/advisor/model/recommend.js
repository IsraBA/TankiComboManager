// features/advisor/model/recommend.js

// טהור: דירוג תותחי האויב + מלאי המודולים -> ההגנות המומלצות.
// בלי chrome, בלי DOM, בלי אובייקטי משחק. הרציונל: CLAUDE.mds/advisor.md

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  const SLOT_COUNT = 4;

  // turrets: [{base, kills, score, carriers, gs}] — כבר מדורג
  // modules: [{id, name, resistance, percent, owned, image?}]
  // mounted: מזהי ההגנות המורכבות כרגע
  //
  // מחזירה {ordered, equip, armadillo, equipped}:
  //   ordered  — כל הדירוג, בלי ארמדילו
  //   equip    — מה שהכפתור מצייד
  //   equipped — לחיצה לא תשנה כלום
  function recommend(input) {
    const M = window.TankiQoL.AdvisorResistanceMap;
    const turrets = (input && input.turrets) || [];
    const modules = (input && input.modules) || [];
    const slots = (input && input.slots) || SLOT_COUNT;
    const mounted = (input && input.mounted) || [];

    // מודול כשיר: בבעלות, ומעל רף השידרוג
    const byResistance = new Map();
    let armadillo = null;
    for (const m of modules) {
      if (!m || !m.resistance) continue;
      if (m.owned !== true) continue;
      if (!(m.percent >= M.MIN_PERCENT)) continue;
      if (m.resistance === M.ARMADILLO) {
        armadillo = m;
        continue;
      }
      if (!M.isRecommendable(m.resistance)) continue;
      // עותק כפול של אותו סוג -> המשודרג מנצח
      const prev = byResistance.get(m.resistance);
      if (!prev || m.percent > prev.percent) byResistance.set(m.resistance, m);
    }

    // הדירוג מתורגם למודולים; תותח בלי מודול כשיר מדולג וממשיכים ברשימה
    const ordered = [];
    const taken = new Set();
    for (const t of turrets) {
      const res = M.forTurret(t.base);
      if (!res || taken.has(res)) continue;
      const mod = byResistance.get(res);
      if (!mod) continue;
      taken.add(res);
      ordered.push({
        id: mod.id,
        name: mod.name,
        image: mod.image || null,
        resistance: res,
        percent: mod.percent,
        kills: t.kills || 0,
        carriers: t.carriers || 0,
      });
    }

    const room = armadillo ? slots - 1 : slots;
    const equip = ordered.slice(0, Math.max(0, room));
    if (armadillo) {
      /* ארמדילו ראשון — נוסף אחרי החיתוך כדי לא לתפוס מקום בדירוג */
      equip.unshift({
        id: armadillo.id,
        name: armadillo.name,
        image: armadillo.image || null,
        resistance: M.ARMADILLO,
        percent: armadillo.percent,
        kills: null,
        carriers: null,
      });
    }

    // השוואה קבועה, כמו בכל מקום אחר: אותה קבוצה בדיוק, בלי משמעות לחריץ.
    // עודף מורכב הוא הבדל אמיתי — ההצטיידות הייתה מסירה אותו.
    const have = new Set(mounted.filter((x) => x != null).map(String));
    const equipped =
      equip.length > 0 &&
      have.size === equip.length &&
      equip.every((m) => have.has(String(m.id)));

    return { ordered, equip, armadillo: !!armadillo, equipped };
  }

  window.TankiQoL.AdvisorRecommend = { recommend, SLOT_COUNT };
})();
