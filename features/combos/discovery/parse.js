// features/combos/discovery/parse.js  [ISOLATED world]

// קריאת מיפוי "שם סמנטי -> שם ממוזער" מתוך ה-toString שקוטלין מייצרת.
//
// זה העוגן שמייתר ניחוש דפוסי קוד: לכל data class יש toString שמכיל את שמות
// השדות כמחרוזות מפורשות, למשל
//   ld(MB).toString=function(){return"Garage(itemsOnDepot="+bd(this.tpz_1)+ …

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};
  const GD = (window.TankiQoL.GarageDiscover = window.TankiQoL.GarageDiscover || {});

  GD.escapeRe = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

  // מטפל גם בעטיפות כמו bd(...) שקוטלין מוסיפה לאוספים ולשדות nullable
  GD.parseFields = function (body) {
    const map = {};
    const re = /([A-Za-z0-9]+)="\+(?:[\w$]+\()*this\.([\w$]+_1)/g;
    let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
  };

  // מחלקות פרוטוקול (סיומת CC) בנויות אחרת: "baseItemId = "+this.xxx_1
  GD.parseCcFields = function (body) {
    const map = {};
    const re = /([A-Za-z0-9]+) = "\+this\.([\w$]+_1)/g;
    let m;
    while ((m = re.exec(body)) !== null) map[m[1]] = m[2];
    return map;
  };

  // שם המחלקה נדרש לכל פעולה שנרצה לבנות: ה-reducer בודק instanceof
  GD.dataClass = function (src, name) {
    const m = new RegExp('[\\w$]+\\(([\\w$]+)\\)\\.toString=function\\(\\)\\{return"' +
      GD.escapeRe(name) + '\\((.*?)"\\}').exec(src);
    return m ? { cls: m[1], fields: GD.parseFields(m[2]) } : null;
  };

  GD.dataClassFields = function (src, name) {
    const d = GD.dataClass(src, name);
    return d ? d.fields : null;
  };
})();
