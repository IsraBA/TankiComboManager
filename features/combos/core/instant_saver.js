// features/combos/core/instant_saver.js

// שמירה מיידית של הקומבו הנוכחי — קורא את הציוד ישירות ממצב המשחק (דרך
// GarageBridge -> ההוק בעולם MAIN) ושומר, בלי לנווט בין טאבים ובלי לגעת
// ב-DOM. זה המסלול שמחווט לכפתור השמירה; המסלול הישן (combo_saver.js,
// שסורק את ה-DOM טאב-טאב) נשאר בקוד אך לא מחווט לכלום — בכוונה.
//
// מבנה הרשומה הנשמרת (רשומות "דור 2"):
//   * id — מזהה הפריט של המשחק. **המפתח הקנוני**: לא תלוי שפה, שורד שינוי
//     שם, ומדויק עד רמת ה-Mk. זה מה שההחלה המיידית העתידית תשתמש בו.
//   * name + image — snapshot לתצוגה בכרטיסים, וגם מה שמאפשר לאקוויפר
//     ה-DOM הישן (ה-fallback) להחיל גם קומבואים חדשים.
//   * mk / lvl — לתצוגה עתידית; לא בשימוש כרגע.
//   * חריצים חדשים: paint, turretSkin, turretShotFx, hullSkin — נשמרים
//     מהיום, ה-UI של הכרטיסים יעודכן להציגם בשלב נפרד.
// רשומות ישנות (name+image בלבד, ללא id) נשארות תקפות — כל הצרכנים
// סובלניים למפתחות חסרים.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // --- מיפוי פריט מהקורא (garage_state.js) לצורת האחסון ---

  // פריט רגיל: id+name+image תמיד; mk/lvl רק כשקיימים (חוסך רעש באחסון)
  function pickItem(it) {
    if (!it) return null;
    const out = {
      id: it.id || null,
      name: it.name || null,
      image: it.image || null,
    };
    if (it.mk != null) out.mk = it.mk;
    if (it.lvl != null) out.lvl = it.lvl;
    return out;
  }

  // פריט דקורטיבי/אוגמנט: אין לו mk/lvl
  function pickPlain(it) {
    if (!it) return null;
    return {
      id: it.id || null,
      name: it.name || null,
      image: it.image || null,
    };
  }

  // ההגנות נשמרות פוזיציונלית לפי mountIndex (4 חריצים, null בחריץ ריק) —
  // בניגוד לסורק הישן שדחס אותן לפי הסדר. כך סדר החריצים האמיתי נשמר.
  function pickProtections(list) {
    const slots = [null, null, null, null];
    let any = false;
    for (const p of list || []) {
      const idx = typeof p.mountIndex === 'number' ? p.mountIndex : -1;
      if (idx >= 0 && idx < 4) {
        slots[idx] = pickItem(p);
        any = true;
      }
    }
    // אין אף הגנה -> null, כמו שהסורק הישן החזיר (הכרטיס מציג "NO PROTECTIONS")
    return any ? slots : null;
  }

  function buildComboData(read) {
    const c = read.combo;
    return {
      turret: pickItem(c.turret),
      turretAugment: pickPlain(c.turretAugment),
      turretSkin: pickPlain(c.turretSkin),
      turretShotFx: pickPlain(c.turretShotFx),
      hull: pickItem(c.hull),
      hullAugment: pickPlain(c.hullAugment),
      hullSkin: pickPlain(c.hullSkin),
      grenade: pickItem(c.grenade),
      drone: pickItem(c.drone),
      paint: pickPlain(c.paint),
      protection: pickProtections(c.protection),
    };
  }

  window.TankiQoL.InstantSaver = {
    // שמירת הקומבו הנוכחי ממצב המשחק. מחזירה Promise עם {ok, combo|error};
    // הקורא (view_renderer) מרענן את התצוגה על ok.
    async saveCurrentCombo() {
      const bridge = window.TankiQoL.GarageBridge;
      if (!bridge) {
        return { ok: false, error: 'GarageBridge not loaded' };
      }

      let read;
      try {
        read = await bridge.readCombo();
      } catch (e) {
        return { ok: false, error: String(e) };
      }
      if (!read || !read.ok) {
        // המצב הנפוץ: ה-state עוד לא נתפס (למשל לפני כניסה ראשונה למוסך)
        return { ok: false, error: (read && read.error) || 'no response from game hook' };
      }

      const data = buildComboData(read);

      // הגנה מרשומות זבל: לא שומרים קומבו שאין בו אף פריט עיקרי
      // (state ריק/ישן). ההגנות לבדן לא מספיקות כי בלי טנק אין קומבו.
      if (!data.turret && !data.hull && !data.grenade && !data.drone) {
        return { ok: false, error: 'read returned no mounted core items — not saving' };
      }

      return new Promise((resolve) => {
        chrome.storage.local.get(['savedCombos'], (result) => {
          const combos = result.savedCombos || [];

          // קומבו חדש ראשון ברשימה — כל השאר יורדים מקום (כמו במסלול הישן)
          combos.forEach((combo) => {
            if (combo.order !== undefined) combo.order += 1;
          });

          const LanguageManager = window.TankiQoL.LanguageManager;
          const newCombo = {
            id: Date.now(),
            name: `Combo ${combos.length + 1}`,
            data,
            date: new Date().toLocaleDateString(),
            order: 0,
            language: LanguageManager
              ? LanguageManager.getCurrentLanguageCode()
              : 'en',
          };

          combos.push(newCombo);
          chrome.storage.local.set({ savedCombos: combos }, () => {
            resolve({ ok: true, combo: newCombo });
          });
        });
      });
    },
  };
})();
