// features/combos/save/instant_saver.js

// שומר את הקומבו הנוכחי ממצב המשחק, בלי DOM ובלי ניווט. בלי fallback.
// מבנה הרשומה ומשמעות baseItemId: CLAUDE.mds/combos.md

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // פריט רגיל: mk/lvl נשמרים רק כשקיימים, שלא ייצבר רעש באחסון
  function pickItem(it) {
    if (!it) return null;
    const out = {
      id: it.id || null,
      baseItemId: it.baseItemId || null,
      name: it.name || null,
      image: it.image || null,
    };
    if (it.mk != null) out.mk = it.mk;
    if (it.lvl != null) out.lvl = it.lvl;
    return out;
  }

  // דקורטיבי/אוגמנט: בלי mk/lvl, ו-baseItemId רק למי שיש לו
  function pickPlain(it) {
    if (!it) return null;
    const out = {
      id: it.id || null,
      name: it.name || null,
      image: it.image || null,
    };
    if (it.baseItemId) out.baseItemId = it.baseItemId;
    return out;
  }

  // הגנות נשמרות פוזיציונלית לפי mountIndex, כדי לשמר את סדר החריצים
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
    // אין אף הגנה -> null, והכרטיס מציג "NO PROTECTIONS"
    return any ? slots : null;
  }

  function buildComboData(read) {
    const c = read.combo;
    return {
      turret: pickItem(c.turret),
      turretAugment: pickPlain(c.turretAugment),
      turretSkin: pickPlain(c.turretSkin),
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
    // מחזירה {ok, combo|error}; הקורא מרענן את התצוגה על ok
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
        // הנפוץ: ה-state עוד לא נתפס (לפני כניסה ראשונה למוסך)
        return { ok: false, error: (read && read.error) || 'no response from game hook' };
      }

      const data = buildComboData(read);

      // בלי אף פריט עיקרי אין קומבו — הגנה מרשומות זבל
      if (!data.turret && !data.hull && !data.grenade && !data.drone) {
        return { ok: false, error: 'read returned no mounted core items — not saving' };
      }

      return new Promise((resolve) => {
        chrome.storage.local.get(['savedCombos'], (result) => {
          let combos = result.savedCombos || [];

          // כפיל נמחק **באותה כתיבה** שיוצרת את החדש, אחרת הרשימה
          // הייתה מהבהבת. מבחוץ זה נראה כמו קפיצה לראש הרשימה.
          const Match = window.TankiQoL.ComboIdentity;
          let inheritedName = null;
          if (Match && Match.isSameCombo) {
            const dup = combos.find(
              (c) => Match.isSameCombo(c, { data, removedItems: {} }),
            );
            if (dup) {
              inheritedName = dup.name;   // השם של הישן שורד
              combos = combos.filter((c) => c !== dup);
            }
          }

          // קומבו חדש נכנס ראשון, וכל השאר יורדים מקום
          combos.forEach((combo) => {
            if (combo.order !== undefined) combo.order += 1;
          });

          const LanguageManager = window.TankiQoL.LanguageManager;
          const newCombo = {
            id: Date.now(),
            name: inheritedName || `Combo ${combos.length + 1}`,
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
