// features/combos/isolated/discover/index.js  [ISOLATED world]

// מרכיב את הגילוי המלא: הליבה חובה, וכל השאר תוספות שכישלונן אינו מפיל.

(function () {
  'use strict';
  window.TankiQoL = window.TankiQoL || {};
  const GD = (window.TankiQoL.GarageDiscover = window.TankiQoL.GarageDiscover || {});

  GD.discover = function (src) {
    const core = GD.discoverState(src);
    if (!core) return null;

    const { stateFields, itemFields, itemBody } = core;
    const out = { trapField: core.trapField, stateFields, itemFields };

    Object.assign(out, GD.discoverReadExtras(src, itemFields));
    Object.assign(out, GD.discoverActions(src));

    const skin = GD.discoverSkinMount(src, itemFields, itemBody);
    if (skin) Object.assign(out, skin);

    const send = GD.discoverSend(src, stateFields, itemFields);
    if (send) Object.assign(out, send);

    return out;
  };
})();
