// features/combos/main/garage/protections.js  [MAIN world]

// הרכבת/הסרת מודולי הגנה, והחלת מצב מלא של 4 החריצים בהשוואה קבוצתית.

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  // פריט הגנה כלשהו, לאימות הבנאים
  function sampleResistance() {
    if (!I.latestState) return null;
    const F = I.D.itemFields;
    for (const it of I.collect(I.latestState).items) {
      if (I.enumName(it[F.category]) === 'RESISTANCE_MODULE') return it;
    }
    return null;
  }

  // המשחק מרכיב דרך thunk שמסיר ואז מחיל; אנחנו משגרים את שתי הנמוכות,
  // כי רק הן מנויות ולכן ניתנות לאיתור בזמן ריצה לפי שם.
  function resolveResistProtos() {
    if (I.resistApplyProto && I.resistUnmountProto) return true;
    const D = I.D;
    const sample = sampleResistance();
    if (!sample) return false;

    if (!I.resistApplyProto && D.resistApplyClass && D.resistApplyFields) {
      const F = D.resistApplyFields;
      // המופע הזה נבנה לאימות בלבד ולעולם לא משוגר
      const Ctor = I.resolveActionCtor(D.resistApplyClass, (C) => {
        if (C.length !== 3) return false;
        const p = new C(sample, 3, false);
        return p[F.resistance] === sample && p[F.index] === 3 &&
               p[F.needServerMount] === false;
      });
      if (Ctor) {
        I.resistApplyProto = Ctor.prototype;
        NS.debug.resistApplyResolved = true;
      }
    }
    if (!I.resistUnmountProto && D.resistUnmountClass && D.resistUnmountFields) {
      const F = D.resistUnmountFields;
      const Ctor = I.resolveActionCtor(D.resistUnmountClass, (C) => {
        if (C.length !== 2) return false;
        const p = new C(sample, false);
        return p[F.resistance] === sample && p[F.needServerUnmount] === false;
      });
      if (Ctor) {
        I.resistUnmountProto = Ctor.prototype;
        NS.debug.resistUnmountResolved = true;
      }
    }
    return !!(I.resistApplyProto && I.resistUnmountProto);
  }

  // 4 החריצים לפי mountIndex (null בריק). מקבל תוצאת collect קיימת.
  I.currentProtectionSlots = function (found) {
    const slots = [null, null, null, null];
    if (!I.latestState) return slots;
    const F = I.D.itemFields;
    for (const it of (found || I.collect(I.latestState)).items) {
      if (it[F.mounted] !== true) continue;
      if (I.enumName(it[F.category]) !== 'RESISTANCE_MODULE') continue;
      const idx = it[F.mountIndex];
      if (typeof idx === 'number' && idx >= 0 && idx < 4) slots[idx] = it;
    }
    return slots;
  };

  I.unmountProtection = function (rawItem) {
    if (!resolveResistProtos() || !I.resistUnmountProto) {
      return { ok: false, error: 'resistance unmount action not available' };
    }
    const si = I.findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };
    try {
      si.store[si.dispatch](I.buildAction(I.resistUnmountProto, [rawItem, true]));
      NS.debug.resistUnmountsSent++;
      return { ok: true };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  };

  I.mountProtection = function (rawItem, index) {
    if (!resolveResistProtos() || !I.resistApplyProto) {
      return { ok: false, error: 'resistance mount action not available' };
    }
    const si = I.findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };
    try {
      si.store[si.dispatch](I.buildAction(I.resistApplyProto, [rawItem, index, true]));
      NS.debug.resistMountsSent++;
      return { ok: true };
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
  };

  // מחיל מצב מלא של 4 חריצים (מזהים או null).
  //
  // ההשוואה היא **לפי קבוצה ולא לפי חריץ**: החריצים מתחלפים ביניהם ואין
  // להם משמעות, ולכן שינוי סדר בלבד לא מייצר ולו פעולה אחת. החריץ השמור
  // משמש רק כהעדפת שיבוץ. ההסרות לפני ההרכבות, כי חריץ תפוס חייב להתפנות.
  I.applyProtections = function (desiredIds) {
    if (!I.latestState) return { ok: false, error: 'garage state not captured' };
    if (!Array.isArray(desiredIds)) return { ok: false, error: 'expected an array of 4 ids/nulls' };

    const F = I.D.itemFields;
    // סריקה אחת לכל התכנון: גם מצב החריצים וגם חיפוש הפריטים הרצויים
    const found = I.collect(I.latestState);
    const current = I.currentProtectionSlots(found);

    const wantSet = new Set();
    const preferred = new Map();   // id -> החריץ שבו הוא מופיע בקומבו
    for (let i = 0; i < 4; i++) {
      if (desiredIds[i] == null) continue;
      const id = String(desiredIds[i]);
      if (!wantSet.has(id)) { wantSet.add(id); preferred.set(id, i); }
    }

    const mountedAt = new Map();
    for (let i = 0; i < 4; i++) {
      if (current[i]) mountedAt.set(I.idToString(current[i][F.id]), i);
    }

    const plan = { unmount: [], mount: [], unchanged: [] };

    // מורכב ולא רצוי -> הסרה; מורכב ורצוי -> נשאר במקומו
    for (const [id, slot] of mountedAt) {
      if (wantSet.has(id)) plan.unchanged.push({ slot, id });
      else plan.unmount.push({ slot, item: current[slot], id });
    }

    // רצוי ולא מורכב באף חריץ
    const toAdd = [];
    for (const id of wantSet) {
      if (mountedAt.has(id)) continue;
      const raw = found.byId.get(id);
      if (!raw) return { ok: false, error: 'protection id not found in garage state: ' + id };
      if (I.enumName(raw[F.category]) !== 'RESISTANCE_MODULE') {
        return { ok: false, error: 'item ' + id + ' is not a resistance module' };
      }
      toAdd.push({ id, item: raw, preferred: preferred.get(id) });
    }

    // החריצים שיהיו פנויים: הריקים עכשיו + אלה שמתפנים בהסרה
    const free = new Set();
    for (let i = 0; i < 4; i++) if (!current[i]) free.add(i);
    for (const u of plan.unmount) free.add(u.slot);

    // קודם מי שהחריץ המועדף שלו פנוי, אחרת אחד היה חוטף חריץ של אחר
    const ordered = toAdd.filter((a) => free.has(a.preferred))
      .concat(toAdd.filter((a) => !free.has(a.preferred)));
    for (const a of ordered) {
      let slot = free.has(a.preferred) ? a.preferred : null;
      if (slot === null) for (let i = 0; i < 4; i++) if (free.has(i)) { slot = i; break; }
      if (slot === null) {
        return { ok: false, error: 'no free protection slot for ' + a.item[F.name] };
      }
      free.delete(slot);
      plan.mount.push({ slot, item: a.item, id: a.id });
    }

    const errors = [];
    for (const u of plan.unmount) {
      const r = I.unmountProtection(u.item);
      if (!r.ok) errors.push('unmount slot ' + u.slot + ': ' + r.error);
    }
    for (const m of plan.mount) {
      const r = I.mountProtection(m.item, m.slot);
      if (!r.ok) errors.push('mount slot ' + m.slot + ': ' + r.error);
    }

    return {
      ok: errors.length === 0,
      errors,
      plan: {
        unmounted: plan.unmount.map((u) => ({ slot: u.slot, name: u.item[F.name] })),
        mounted: plan.mount.map((m) => ({ slot: m.slot, name: m.item[F.name] })),
        kept: plan.unchanged.map((u) => ({ slot: u.slot, name: current[u.slot][F.name] })),
        untouched: plan.unchanged.length,
      },
    };
  };
})();
