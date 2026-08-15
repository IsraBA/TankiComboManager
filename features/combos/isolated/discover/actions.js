// features/combos/isolated/discover/actions.js  [ISOLATED world]

// גילוי פעולות הכתיבה: הגנות, אוגמנטים וסקין.
//
// לכל פעולה יש thunk ציבורי שה-UI משגר, ומתחתיו פעולה "נמוכה" שהריוסר צורך
// ושאליה מנוי גם ה-subscriber ששולח לשרת. אנחנו משגרים את הנמוכות, כי רק
// הן מנויות ולכן ניתנות לאיתור בזמן ריצה לפי שם. שמות ה-thunks לתיעוד.

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};
  const GD = (window.TankiQoL.GarageDiscover = window.TankiQoL.GarageDiscover || {});

  GD.discoverActions = function (src) {
    const out = {};

    const resistUn = GD.dataClass(src, 'GarageResistanceUnMount');
    if (resistUn && resistUn.fields.resistance && resistUn.fields.needServerUnmount) {
      out.resistUnmountClass = resistUn.cls;
      out.resistUnmountFields = resistUn.fields;
    }
    const resistApply = GD.dataClass(src, 'GarageApplyResistanceMount');
    if (resistApply && resistApply.fields.resistance &&
        resistApply.fields.index && resistApply.fields.needServerMount) {
      out.resistApplyClass = resistApply.cls;
      out.resistApplyFields = resistApply.fields;
    }
    const resistMount = GD.dataClass(src, 'GarageResistanceMount');
    if (resistMount && resistMount.fields.resistance && resistMount.fields.index) {
      out.resistMountClass = resistMount.cls;
      out.resistMountFields = resistMount.fields;
    }
    const mountThunk = GD.dataClass(src, 'GarageItemMounted');
    if (mountThunk && mountThunk.fields.item && mountThunk.fields.needServerMount) {
      out.mountThunkClass = mountThunk.cls;
      out.mountThunkFields = mountThunk.fields;
    }

    // אוגמנטים: כאן שתי הפעולות הן ממילא הנמוכות, בלי thunk באמצע
    const insertDev = GD.dataClass(src, 'GarageInsertDeviceClientAndServer');
    if (insertDev && insertDev.fields.device && insertDev.fields.item) {
      out.deviceInsertClass = insertDev.cls;
      out.deviceInsertFields = insertDev.fields;
    }
    const removeDev = GD.dataClass(src, 'GarageRemoveDevice');
    if (removeDev && removeDev.fields.device && removeDev.fields.item) {
      out.deviceRemoveClass = removeDev.cls;
      out.deviceRemoveFields = removeDev.fields;
    }
    // בקשת קטלוג האוגמנטים של פריט (נטען בעצלות לפי baseItemId)
    const loadDev = GD.dataClass(src, 'GarageLoadAvailableDevices');
    if (loadDev && loadDev.fields.itemId) {
      out.deviceLoadClass = loadDev.cls;
      out.deviceLoadFields = loadDev.fields;
    }

    return out;
  };

  // לפעולת הסקין אין toString (היא לא data class), ולכן העוגן מבני:
  // ה-reducer בונה עותק של GarageItem שבו רק mountedSkin משתנה, כלומר
  // copy(VOID ×N, skin.id) כאשר N הוא מיקום השדה ב-toString של הפריט.
  GD.discoverSkinMount = function (src, itemFields, itemToStringBody) {
    const escapeRe = GD.escapeRe;
    const names = [...itemToStringBody.matchAll(/([A-Za-z0-9]+)="\+/g)].map((m) => m[1]);
    const skinPos = names.indexOf('mountedSkin');
    if (skinPos < 0 || !itemFields.id) return null;

    // שם ה-VOID מתחלף בין בילדים — דורשים רק שכל הארגומנטים שלפני זהים
    const re = new RegExp('\\{return t\\.[\\w$]+\\(((?:[\\w$]+,)+)([\\w$]+)\\.' +
      escapeRe(itemFields.id) + '\\)\\}', 'g');
    let hit = null, voidName = null, m;
    while ((m = re.exec(src)) !== null) {
      const toks = m[1].split(',').filter(Boolean);
      if (toks.length !== skinPos) continue;
      if (new Set(toks).size !== 1) continue;
      hit = m; voidName = toks[0]; break;
    }
    if (!hit) return null;

    const seg = src.slice(Math.max(0, hit.index - 500), hit.index);
    const decls = [...seg.matchAll(/\)\.([\w$]+)=function\(t,n\)\{/g)];
    if (!decls.length) return null;
    const method = decls[decls.length - 1][1];

    // ענף ה-reducer שקורא לה — משם המחלקה ושני השדות
    const br = new RegExp('instanceof ([\\w$]+)\\)[\\w$]+=[\\w$]+\\.[\\w$]+\\((?:' +
      escapeRe(voidName) + ',)+[\\w$]+\\.[\\w$]+_1\\.' + escapeRe(method) +
      '\\(t\\.([\\w$]+_1),t\\.([\\w$]+_1)\\)').exec(src);
    if (!br) return null;

    // אימות צולב: ה-ctor כותב בדיוק את שני השדות, בסדר הזה
    const ctor = new RegExp('function ' + escapeRe(br[1]) + '\\(t,n\\)\\{[\\w$]+\\.call\\(this,n\\.' +
      escapeRe(itemFields.id) + '\\),this\\.' + escapeRe(br[2]) + '=t,this\\.' +
      escapeRe(br[3]) + '=n\\}').exec(src);
    if (!ctor) return null;

    return { skinMountClass: br[1], skinMountFields: { skin: br[2], item: br[3] } };
  };
})();
