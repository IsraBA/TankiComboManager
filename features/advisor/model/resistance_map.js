// features/advisor/model/resistance_map.js

// מזהה משפחת תותח -> סוג ההגנה מפניו. הרציונל: CLAUDE.mds/advisor.md

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // הורכב מהמיפוי שהמשחק עצמו נותן על המודולים ומהטבלה של הוויקי.
  // מזהים ולא שמות: שמות הפריטים מגיעים מתורגמים.
  const TURRET_TO_RESISTANCE = {
    920009630983: "FIREBIRD_RESISTANCE", // Firebird
    920009631074: "FREEZE_RESISTANCE", // Freeze
    920009630913: "ISIS_RESISTANCE", // Isida
    921009714084: "TESLA_RESISTANCE", // Tesla
    920009631046: "SHOTGUN_RESISTANCE", // Hammer
    920009630997: "TWINS_RESISTANCE", // Twins
    920009631088: "RICOCHET_RESISTANCE", // Ricochet
    920009631144: "MACHINE_GUN_RESISTANCE", // Vulcan
    920009630969: "SMOKY_RESISTANCE", // Smoky
    920009630990: "ROCKET_LAUNCHER_RESISTANCE", // Striker
    920009631123: "THUNDER_RESISTANCE", // Thunder
    1931009780251: "TSUNAMI_RESISTANCE", // Tsunami
    931009771122: "SCORPIO_RESISTANCE", // Scorpion
    920009630976: "ARTILLERY_RESISTANCE", // Magnum
    920009631011: "RAILGUN_RESISTANCE", // Railgun
    920009631151: "GAUSS_RESISTANCE", // Gauss
    920009631158: "SHAFT_RESISTANCE", // Shaft
  };

  // ארמדילו בנפרד; מוקש וייחודיים — מחוצה לסקופ
  const ARMADILLO = "CRITICAL_RESISTANCE";
  const NEVER_RECOMMENDED = {
    MINE_RESISTANCE: true,
    ALL_RESISTANCE: true,
    TERMINATOR_RESISTANCE: true,
  };

  // 30% ומטה נחשב לא משודרג ולא מומלץ לעולם
  const MIN_PERCENT = 30;

  window.TankiQoL.AdvisorResistanceMap = {
    ARMADILLO,
    MIN_PERCENT,

    // תותח לא מוכר (חדש במשחק, או הג'אגרנאוט) -> null
    forTurret(baseItemId) {
      if (baseItemId == null) return null;
      return TURRET_TO_RESISTANCE[String(baseItemId)] || null;
    },

    isRecommendable(resistance) {
      if (!resistance || resistance === ARMADILLO) return false;
      return !NEVER_RECOMMENDED[resistance];
    },
  };
})();
