// features/combos/view/template.js

// ה-HTML של תצוגת הקומבואים, נבנה לפי השפה הנוכחית.

(function () {
  "use strict";

  Object.assign(window.TankiQoL.ViewRenderer, {
    async loadViewHTML() {
      const LM = window.TankiQoL.LanguageManager;

      return `
<div class="cme_commonBlockForDescriptionAndButton">
    <div id="cme_tankPreviewContainer" class="cme_tankPreview"></div>
    <div class="cme_descriptionBlockCollection">
        <div class="cme_commonBlockDescriptionCollection cme_animatedBlurredLeftBlock">
            <div class="cme_headline">
                <h1>${LM.getUIText("comboManager")}</h1>
                <h3>${LM.getUIText("specialExtension")}</h3>
            </div>
            <div class="cme_PaintsCollectionComponentStyle-fullDescriptionPaint">
                <h3>${LM.getUIText("description")}</h3>
                <h3><strong>${LM.getUIText("proTipLabel")}</strong> ${LM.getUIText("proTip1")}</h3>
                <h3><strong>${LM.getUIText("proTip2Label")}</strong> ${LM.getUIText("proTip2")}</h3>

                <!-- Auto-Open Combos Switch -->
                <div id="cme_auto-open-switch-container" style="margin-top: 1em;"></div>
                <!-- Equip Protections Switch -->
                <div id="cme_equip-protections-switch-container" style="margin-top: 0em;"></div>
            </div>
        </div>
    </div>
    <div class="cme_TanksPartComponentStyle-tankPartUpgrades">
        <div id="cme_save-combo-btn" class="cme_commonBlockButton cme_bigActionButton" style="cursor: pointer;">
            <div class="cme_flexCenterAlignCenter cme_flexCenterAlignCenter_inner">
                <div class="cme_backgroundImage"></div>
            </div>
            <div class="cme_flexEndAlignEnd">
                <span class="Font-bold">${LM.getUIText("saveCombo")}</span>
            </div>
            <div class="cme_flexStartAlignStart">
                <h3 class="cme_hotkey">Enter</h3>
            </div>
        </div>
        <div id="cme_surprise-me-btn" class="cme_commonBlockButton cme_surpriseMeButton" style="cursor: pointer;">
            <div class="cme_flexCenterAlignCenter cme_flexCenterAlignCenter_inner">
                <div class="cme_backgroundImage"></div>
            </div>
            <div class="cme_flexEndAlignEnd">
                <span class="Font-bold">${LM.getUIText("surpriseMe")}</span>
            </div>
            <div id="cme_randomizer-settings-gear" class="cme_randomizer-gear" title="${LM.getUIText("randomizerSettings")}">
                <div class="cme_randomizer-gear-icon"></div>
                <span class="Font-bold cme_randomizer-gear-text">${LM.getUIText("randomizerSettings")}</span>
            </div>
        </div>
        <div class="cme_import-export-row">
            <div id="cme_import-btn" class="cme_import-export-btn">
                <div class="cme_import-export-icon"></div>
                <span class="Font-bold">${LM.getUIText("importCombos")}</span>
            </div>
            <div id="cme_export-btn" class="cme_import-export-btn">
                <div class="cme_import-export-icon cme_import-export-icon--export"></div>
                <span class="Font-bold">${LM.getUIText("exportCombos")}</span>
            </div>
        </div>
    </div>
</div>

<!-- Combos List Container -->
<div class="cme_itemsListContainer cme_appearFromBottom">
    <!-- Navigation Arrows (for future scrolling) -->
    <div class="cme_arrowLeft cme_flexCenterAlignCenter" style="opacity: 0;">
        <img src="/play/static/images/arrow.2552fe80.svg">
    </div>
    <div class="cme_arrowRight cme_flexCenterAlignCenter" style="opacity: 0;">
        <img src="/play/static/images/arrow.2552fe80.svg">
    </div>

    <!-- Combos Grid Container -->
    <div id="combos-grid-container" class="cme_itemsContainer">
    </div>
</div>
            `;
    },
  });
})();
