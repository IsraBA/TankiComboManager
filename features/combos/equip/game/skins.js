// features/combos/equip/game/skins.js  [MAIN world]

// סקין אינו פריט מורכב אלא מערכת בצורת אוגמנט: פעולת (סקין, פריט).

(function () {
  'use strict';

  const NS = (window.__CMB = window.__CMB || {});
  const I = (NS.internals = NS.internals || {});

  function resolveSkinProto() {
    if (I.skinMountProto) return true;
    const D = I.D;
    if (!I.latestState || !D.skinMountClass || !D.skinMountFields) return false;
    const F = D.skinMountFields;
    const IF = D.itemFields;
    const found = I.collect(I.latestState);
    // שני פריטים כלשהם מספיקים; ה-ctor קורא את המזהה של השני
    const a = found.items[0];
    const b = found.items.find((it) => it !== a) || a;
    if (!a) return false;

    const Ctor = I.resolveActionCtor(D.skinMountClass, (C) => {
      if (C.length !== 2) return false;
      const p = new C(a, b);
      return p[F.skin] === a && p[F.item] === b && b[IF.id] != null;
    });
    if (Ctor) { I.skinMountProto = Ctor.prototype; NS.debug.skinMountResolved = true; }
    return !!I.skinMountProto;
  }

  // אין "הסרת סקין" — תמיד מחליפים באחר. כבר מוחל -> אפס פעולות.
  I.applySkin = function (rawItem, skinId) {
    if (!I.latestState) return { ok: false, error: 'garage state not captured' };
    if (!rawItem) return { ok: false, error: 'no item given' };
    if (skinId == null) return { ok: true, changed: false, kept: null };
    if (!resolveSkinProto()) return { ok: false, error: 'skin action not available' };
    const si = I.findStore();
    if (!si) return { ok: false, error: 'could not reach the game store' };

    const IF = I.D.itemFields;
    const want = String(skinId);
    const currentId = IF.mountedSkin ? I.idToString(rawItem[IF.mountedSkin]) : null;
    if (currentId === want) return { ok: true, changed: false, kept: want };

    const skin = I.collect(I.latestState).byId.get(want);
    if (!skin) return { ok: false, error: 'skin not found in garage state: ' + want };
    if (I.enumName(skin[IF.category]) !== 'SKIN') {
      return { ok: false, error: 'item ' + want + ' is not a skin' };
    }

    try {
      si.store[si.dispatch](I.buildAction(I.skinMountProto, [skin, rawItem]));
      NS.debug.skinsApplied++;
    } catch (e) {
      NS.debug.lastError = String(e);
      return { ok: false, error: String(e) };
    }
    // הבחירה בפריט הבסיס היא מה שמזיז את מודל התלת-ממד
    const refreshed = I.selectItem(rawItem);
    return {
      ok: true, changed: true, previewRefreshed: refreshed,
      item: rawItem[IF.name], skin: skin[IF.name],
    };
  };
})();
