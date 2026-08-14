// features/combos/ui/view_renderer.js

// קובץ זה אחראי ליצור את ה-HTML של הכרטיסיית קומבואים ולנהל את ההסתרה/הצגה.
(function () {
  "use strict";

  const DOM = window.TankiQoL.DOM;
  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ViewRenderer = {
    viewElement: null,
    enterKeyHandler: null,
    dragHandlerInitialized: false,
    temporaryCardColumn: null,

    async init() {
      // זיהוי השפה הנוכחית כשמתחילים
      const LanguageManager = window.TankiQoL.LanguageManager;
      if (LanguageManager) {
        LanguageManager.detectLanguage();
      }

      const garageMenuContainer = document.querySelector(
        DOM.GARAGE_MENU_CONTAINER,
      );
      if (!garageMenuContainer) return;

      // בדיקה אם האלמנט כבר קיים
      let existingElement = document.getElementById("combo-manager-view");

      if (existingElement) {
        this.viewElement = existingElement;
        // בדיקה אם האלמנט נמצא במקום הנכון (אחרי garageMenuContainer)
        const parent = garageMenuContainer.parentNode;
        if (parent && existingElement.parentNode === parent) {
          // בדיקה אם הסדר נכון
          const menuIndex = Array.from(parent.children).indexOf(
            garageMenuContainer,
          );
          const viewIndex = Array.from(parent.children).indexOf(
            existingElement,
          );
          if (viewIndex <= menuIndex) {
            // האלמנט לא במקום הנכון - הזז אותו
            garageMenuContainer.insertAdjacentElement(
              "afterend",
              existingElement,
            );
          }
        } else {
          // האלמנט לא באותו parent - הזז אותו
          garageMenuContainer.insertAdjacentElement(
            "afterend",
            existingElement,
          );
        }
        // אתחול drag handler אם עדיין לא אותחל
        if (!this.dragHandlerInitialized) {
          this.initDragHandler();
        }
        return;
      }

      this.viewElement = document.createElement("div");
      this.viewElement.id = "combo-manager-view";
      this.viewElement.className = "cme_container";
      this.viewElement.style.display = "none";

      // טעינת ה-HTML מהקובץ הנפרד
      const htmlContent = await this.loadViewHTML();
      this.viewElement.innerHTML = htmlContent;

      // הוספת ה-viewElement מתחת ל-garageMenuContainer
      garageMenuContainer.insertAdjacentElement("afterend", this.viewElement);

      // חיבור האירועים
      this.bindEvents();

      // אתחול drag handler
      this.initDragHandler();

      // וידוא שלכל הקומבואים יש order
      this.ensureAllCombosHaveOrder();
    },

    // המתנה לאלמנט בתוך ה-view (למשל #combos-grid-container) בלי sleep
    waitForElementInView(selector, timeout = 5000) {
      return new Promise((resolve) => {
        if (!this.viewElement) {
          resolve(null);
          return;
        }

        const existing = this.viewElement.querySelector(selector);
        if (existing) {
          resolve(existing);
          return;
        }

        const observer = new MutationObserver((mutations, obs) => {
          if (!this.viewElement) return;
          const found = this.viewElement.querySelector(selector);
          if (found) {
            obs.disconnect();
            clearTimeout(timeoutId);
            resolve(found);
          }
        });

        observer.observe(this.viewElement, { childList: true, subtree: true });

        const timeoutId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    },

    // טעינת ה-HTML של ה-view
    async loadViewHTML() {
      const LM = window.TankiQoL.LanguageManager;

      // יצירת HTML דינמי לפי השפה הנוכחית
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

    // וידוא שלכל הקומבואים יש order
    ensureAllCombosHaveOrder() {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        let needsUpdate = false;

        // בדיקה אם יש קומבואים בלי order
        combos.forEach((combo, index) => {
          if (combo.order === undefined) {
            combo.order = index;
            needsUpdate = true;
          }
        });

        // שמירה רק אם היה צורך בעדכון
        if (needsUpdate) {
          chrome.storage.local.set({ savedCombos: combos }, () => {
            // console.log('[ComboManager] Updated combos with order field');
          });
        }
      });
    },

    // אתחול drag handler
    initDragHandler() {
      if (this.dragHandlerInitialized) return;

      if (window.TankiQoL.ComboDragHandler) {
        window.TankiQoL.ComboDragHandler.init(this);
        this.dragHandlerInitialized = true;
      }
    },

    // חיבור drag events לקונטיינר - נקרא אחרי כל רינדור
    bindDragEvents(container) {
      if (!container) {
        console.warn("[ComboManager] No container provided to bindDragEvents");
        return;
      }

      const dragHandler = window.TankiQoL.ComboDragHandler;
      if (!dragHandler) {
        console.warn("[ComboManager] ComboDragHandler not available");
        return;
      }

      // הסרת listeners ישנים אם קיימים (כדי למנוע כפילויות)
      // שמירת reference ל-handlers כדי שנוכל להסיר אותם
      if (!container._dragEventsAdded) {
        const dragOverHandler = (e) => {
          dragHandler.handleDragOver(e, container);
        };
        const dropHandler = (e) => {
          dragHandler.handleDrop(e, container);
        };
        const dragEnterHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };

        container.addEventListener("dragover", dragOverHandler);
        container.addEventListener("drop", dropHandler);
        container.addEventListener("dragenter", dragEnterHandler);
        container.addEventListener("dragleave", (e) => {
          e.preventDefault();
        });

        container._dragEventsAdded = true;
        // console.log('[ComboManager] Drag events bound to container successfully');
        // console.log('[ComboManager] Container ID:', container.id);
      } else {
        // console.log('[ComboManager] Drag events already bound, skipping');
      }
    },

    bindEvents() {
      const saveBtn = this.viewElement.querySelector("#cme_save-combo-btn");
      if (saveBtn) {
        saveBtn.onclick = async () => {
          // שמירה מיידית ממצב המשחק (instant_saver) — החליפה את סריקת
          // ה-DOM הישנה (ComboSaver.saveCurrentCombo, שנשארה בקוד אך לא
          // מחווטת). אין ניווט טאבים: נשארים על מסך הקומבואים.
          if (window.TankiQoL.InstantSaver) {
            const result =
              await window.TankiQoL.InstantSaver.saveCurrentCombo();
            if (result && result.ok) {
              // רענון התצוגה אחרי השמירה
              this.loadAndRenderCombos();
            } else {
              console.warn(
                "[ComboManager] instant save failed:",
                result && result.error,
              );
            }
          } else {
            console.error("InstantSaver not loaded!");
          }
        };
      }

      // כפתור Surprise Me
      const surpriseMeBtn = this.viewElement.querySelector(
        "#cme_surprise-me-btn",
      );
      if (surpriseMeBtn) {
        surpriseMeBtn.onclick = async () => {
          if (window.TankiQoL.Randomizer) {
            await window.TankiQoL.Randomizer.run();
          }
        };
      }

      // אייקון הגדרות רנדומייזר (בתוך כפתור SURPRISE ME — צריך stopPropagation)
      const gearIcon = this.viewElement.querySelector(
        "#cme_randomizer-settings-gear",
      );
      if (gearIcon) {
        gearIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          if (window.TankiQoL.RandomizerSettings) {
            window.TankiQoL.RandomizerSettings.init();
            window.TankiQoL.RandomizerSettings.show();
          }
        });
      }

      // כפתורי ייבוא וייצוא
      const importBtn = this.viewElement.querySelector("#cme_import-btn");
      if (importBtn) {
        importBtn.onclick = () => {
          if (window.TankiQoL.ImportExport) {
            window.TankiQoL.ImportExport.importCombos();
          }
        };
      }

      const exportBtn = this.viewElement.querySelector("#cme_export-btn");
      if (exportBtn) {
        exportBtn.onclick = () => {
          if (window.TankiQoL.ImportExport) {
            window.TankiQoL.ImportExport.exportCombos();
          }
        };
      }

      // יצירת Switch לפתיחה אוטומטית של כרטיסיית קומבואים
      const autoOpenContainer = this.viewElement.querySelector(
        "#cme_auto-open-switch-container",
      );
      if (autoOpenContainer && window.TankiQoL.Switch) {
        const LM = window.TankiQoL.LanguageManager;
        chrome.storage.local.get(["autoOpenCombosOnGarageEntry"], (result) => {
          const shouldAutoOpen = result.autoOpenCombosOnGarageEntry !== false;
          const autoOpenSwitch = window.TankiQoL.Switch.create({
            id: "cme_auto-open-switch",
            label: LM
              ? LM.getUIText("autoOpenCheckbox")
              : "Auto-open Combos tab",
            checked: shouldAutoOpen,
            onChange: (isChecked) => {
              chrome.storage.local.set({
                autoOpenCombosOnGarageEntry: isChecked,
              });
            },
          });
          autoOpenContainer.appendChild(autoOpenSwitch);
        });
      }

      // יצירת Switch להחלטה אם להתייחס להגנות בעת הצטיידות בקומבו
      const equipProtectionsContainer = this.viewElement.querySelector(
        "#cme_equip-protections-switch-container",
      );
      if (equipProtectionsContainer && window.TankiQoL.Switch) {
        const LM = window.TankiQoL.LanguageManager;
        chrome.storage.local.get(["equipProtectionsOnLoad"], (result) => {
          const shouldEquipProtections =
            result.equipProtectionsOnLoad !== false;
          // עדכון מצב העמעום ההתחלתי של אייקוני ההגנות בכרטיסים
          this._applyProtectionsDimState(shouldEquipProtections);
          const equipProtectionsSwitch = window.TankiQoL.Switch.create(
            {
              id: "cme_equip-protections-switch",
              label: LM
                ? LM.getUIText("equipProtectionsCheckbox")
                : "Equip protections",
              checked: shouldEquipProtections,
              onChange: (isChecked) => {
                chrome.storage.local.set({
                  equipProtectionsOnLoad: isChecked,
                });
                this._applyProtectionsDimState(isChecked);
              },
            },
          );
          equipProtectionsContainer.appendChild(equipProtectionsSwitch);
        });
      }

      // הוספת גלילה אופקית עם גלגלת העכבר
      const combosContainer = this.viewElement.querySelector(
        "#combos-grid-container",
      );
      const arrowLeft = this.viewElement.querySelector(".cme_arrowLeft");
      const arrowRight = this.viewElement.querySelector(".cme_arrowRight");

      // גלילה אופקית אוטומטית עם גלגלת העכבר
      if (combosContainer) {
        // הוספת גלילה אופקית עם גלגלת העכבר
        combosContainer.addEventListener(
          "wheel",
          (e) => {
            // אם יש גלילה אופקית, נאפשר אותה כרגיל
            if (e.deltaX !== 0) {
              return;
            }
            // אם יש גלילה אנכית, נמיר אותה לאופקית
            if (e.deltaY !== 0) {
              e.preventDefault();
              combosContainer.scrollLeft += e.deltaY;
              this.updateArrowsVisibility(
                combosContainer,
                arrowLeft,
                arrowRight,
              );
            }
          },
          { passive: false },
        );

        // עדכון נראות החיצים כשגוללים
        combosContainer.addEventListener("scroll", () => {
          this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
        });

        // עדכון נראות החיצים כשמשנים גודל החלון
        window.addEventListener("resize", () => {
          this.updateArrowsVisibility(combosContainer, arrowLeft, arrowRight);
        });
      }

      // לחיצה על החצים
      if (arrowLeft) {
        arrowLeft.onclick = () => {
          if (combosContainer) {
            const scrollAmount = combosContainer.clientWidth * 0.5;
            combosContainer.scrollBy({
              left: -scrollAmount,
              behavior: "smooth",
            });
          }
        };
      }

      if (arrowRight) {
        arrowRight.onclick = () => {
          if (combosContainer) {
            const scrollAmount = combosContainer.clientWidth * 0.5;
            combosContainer.scrollBy({
              left: scrollAmount,
              behavior: "smooth",
            });
          }
        };
      }

      // הוספת מאזין Enter לכפתור שמירה
      this.enterKeyHandler = (e) => {
        // בדיקה שהתצוגה גלויה
        if (!this.viewElement || this.viewElement.style.display === "none") {
          return;
        }

        // בדיקה שהמשתמש לא בעריכה של שם קומבו
        const activeElement = document.activeElement;
        if (activeElement && activeElement.isContentEditable) {
          return;
        }

        // אם לחצו Enter, שמירת הקומבו
        if (e.key === "Enter") {
          const saveBtn = this.viewElement.querySelector("#cme_save-combo-btn");
          if (saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            saveBtn.click();
          }
        }
      };

      // הוספת המאזין לדוקומנט
      document.addEventListener("keydown", this.enterKeyHandler);
    },

    // עמעום אייקוני ההגנות בכרטיסים כשההתייחסות להגנות כבויה
    _applyProtectionsDimState(equipProtectionsEnabled) {
      if (!this.viewElement) return;
      this.viewElement.classList.toggle(
        "cme_protections-disabled",
        !equipProtectionsEnabled,
      );
    },

    // טעינת הקומבואים מ-storage והצגתם
    async loadAndRenderCombos() {
      // console.log("[ComboManager] loadAndRenderCombos called");
      // לפעמים show() נקרא בזמן ש-init עדיין טוען HTML; נחכה שה-container יופיע בתוך ה-view
      const container = await this.waitForElementInView(
        "#combos-grid-container",
        7000,
      );

      if (!container) {
        console.error(
          "[ComboManager] combos-grid-container not found in view!",
        );
        return;
      }

      // מחיקה אוטומטית של קומבואים ריקים לפני טעינה
      const ComboCleaner = window.TankiQoL.ComboCleaner;
      if (ComboCleaner && ComboCleaner.removeEmptyCombos) {
        ComboCleaner.removeEmptyCombos(() => {
          this._loadAndRenderCombosAfterCleanup(container);
        });
      } else {
        this._loadAndRenderCombosAfterCleanup(container);
      }
    },

    // פונקציה פנימית שטוענה ומציגה קומבואים (אחרי ניקוי)
    _loadAndRenderCombosAfterCleanup(container) {
      // console.log("[ComboManager] Container found, fetching combos from storage...");
      chrome.storage.local.get(["savedCombos"], (result) => {
        const combos = result.savedCombos || [];
        // console.log(`[ComboManager] Fetched ${combos.length} combos from storage`);

        // זיהוי השפה הנוכחית וסינון קומבואים שלא בשפה הנוכחית
        const LanguageManager = window.TankiQoL.LanguageManager;
        const currentLanguageCode = LanguageManager
          ? LanguageManager.getCurrentLanguageCode()
          : "en";

        // סינון קומבואים - רק אלה שנשמרו בשפה הנוכחית
        const filteredCombos = combos.filter((combo) => {
          // אם אין שפה שמורה, נניח שזה קומבו ישן באנגלית (תאימות לאחור)
          const comboLanguage = combo.language || "en";
          return comboLanguage === currentLanguageCode;
        });

        // מיון לפי order (אם קיים), אחרת לפי id (timestamp) מהחדש לישן
        const sortedCombos = filteredCombos.sort((a, b) => {
          // אם לשניהם יש order, נמיין לפי order
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // אם רק לאחד יש order, הוא יבוא ראשון
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          // אחרת, מיון לפי id (מהחדש לישן)
          return (b.id || 0) - (a.id || 0);
        });

        this.renderCombos(sortedCombos);
      });
    },

    // רינדור הקומבואים ל-DOM
    renderCombos(combos) {
      const container = this.viewElement.querySelector(
        "#combos-grid-container",
      );
      if (!container) {
        console.error("[ComboManager] renderCombos: Container not found!");
        return;
      }

      // console.log(`[ComboManager] Rendering ${combos.length} combos to container`);

      // ניקוי התוכן הקיים
      container.innerHTML = "";

      if (combos.length === 0) {
        const LM = window.TankiQoL.LanguageManager;
        container.innerHTML = `
                    <div class="cme_empty-state">
                        <h2>${LM.getUIText("noSavedCombos")}</h2>
                        <p>${LM.getUIText("clickToSave")}</p>
                    </div>
                `;
        // עדכון נראות החיצים - אין תוכן לגלול
        const arrowLeft = this.viewElement.querySelector(".cme_arrowLeft");
        const arrowRight = this.viewElement.querySelector(".cme_arrowRight");
        this.updateArrowsVisibility(container, arrowLeft, arrowRight);
        return;
      }

      // יצירת column לכל קומבו (כל קומבו ב-column נפרד)
      combos.forEach((combo, index) => {
        // יצירת column חדש לכל קומבו
        const currentColumn = document.createElement("div");
        currentColumn.className = "cme_flexSpaceBetweenAlignCenterColumn";
        container.appendChild(currentColumn);

        // יצירת כרטיס קומבו באמצעות ComboCardRenderer
        if (window.TankiQoL.ComboCardRenderer) {
          const comboCard =
            window.TankiQoL.ComboCardRenderer.createComboCard(
              combo,
              index,
              this,
            );
          currentColumn.appendChild(comboCard);
        } else {
          console.error("ComboCardRenderer not loaded!");
        }
      });

      // חיבור drag events אחרי הרינדור
      setTimeout(() => {
        this.bindDragEvents(container);
      }, 100);

      // עדכון נראות החיצים אחרי הרינדור
      const arrowLeft = this.viewElement.querySelector(".cme_arrowLeft");
      const arrowRight = this.viewElement.querySelector(".cme_arrowRight");
      // נשתמש ב-setTimeout כדי לוודא שהרינדור הסתיים
      setTimeout(() => {
        this.updateArrowsVisibility(container, arrowLeft, arrowRight);
      }, 0);
    },

    // עדכון נראות החיצים בהתאם למיקום הגלילה
    updateArrowsVisibility(container, arrowLeft, arrowRight) {
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      // חץ שמאלה - מופיע אם יש תוכן משמאל
      if (arrowLeft) {
        arrowLeft.style.opacity = scrollLeft > 10 ? "1" : "0";
      }

      // חץ ימינה - מופיע אם יש תוכן מימין
      if (arrowRight) {
        arrowRight.style.opacity = scrollLeft < maxScrollLeft - 10 ? "1" : "0";
      }
    },

    // מחיקת קומבו
    deleteCombo(comboId, comboName) {
      const DeleteModal = window.TankiQoL.DeleteComboModal;

      if (!DeleteModal) {
        console.error("[ComboManager] DeleteComboModal not loaded!");
        return;
      }

      // פתיחת המודל עם callback למחיקה
      DeleteModal.show(comboId, comboName, (confirmedComboId) => {
        const removeFromStorage = () => {
          chrome.storage.local.get(["savedCombos"], (result) => {
            let combos = result.savedCombos || [];
            combos = combos.filter((c) => c.id !== confirmedComboId);

            chrome.storage.local.set({ savedCombos: combos }, () => {
              this.loadAndRenderCombos();
            });
          });
        };

        // מציאת הכרטיס והעמודה לאנימציה
        const card = this.viewElement.querySelector(
          `.cme_combo-card[data-combo-id="${confirmedComboId}"]`,
        );
        const column = card
          ? card.closest(".cme_flexSpaceBetweenAlignCenterColumn")
          : null;

        if (card && column) {
          this.playDeleteAnimation(card, column, removeFromStorage);
        } else {
          removeFromStorage();
        }
      });
    },

    // אנימציית גריסה למחיקת קומבו
    playDeleteAnimation(card, column, callback) {
      const STRIP_COUNT = 7;

      // שלב 1: רעידה קצרה
      card.classList.add("cme_shake");

      setTimeout(() => {
        const cardRect = card.getBoundingClientRect();
        const computedFontSize = getComputedStyle(card).fontSize;
        const strips = [];

        // שלב 2: יצירת רצועות גריסה
        for (let i = 0; i < STRIP_COUNT; i++) {
          const stripEl = card.cloneNode(true);
          const topPercent = (i / STRIP_COUNT) * 100;
          const bottomPercent = ((STRIP_COUNT - i - 1) / STRIP_COUNT) * 100;

          stripEl.style.cssText = `
                        position: fixed;
                        top: ${cardRect.top}px;
                        left: ${cardRect.left}px;
                        width: ${cardRect.width}px;
                        height: ${cardRect.height}px;
                        clip-path: inset(${topPercent}% 0 ${bottomPercent}% 0);
                        pointer-events: none;
                        z-index: 99999;
                        margin: 0;
                        font-size: ${computedFontSize};
                        will-change: transform, opacity;
                        transition: transform 0.55s cubic-bezier(.22,.61,.36,1), opacity 0.45s ease-out;
                        transition-delay: ${i * 0.035}s;
                    `;
          stripEl.classList.add("cme_shred-strip");
          stripEl.classList.remove("cme_shake");

          document.body.appendChild(stripEl);
          strips.push(stripEl);
        }

        // הסתרת הכרטיס המקורי
        card.style.visibility = "hidden";

        // שלב 3: הנפשת הרצועות
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            strips.forEach((strip, i) => {
              const direction = i % 2 === 0 ? 1 : -1;
              const translateX = direction * (30 + Math.random() * 70);
              const translateY = 15 + Math.random() * 45;
              const rotate = direction * (2 + Math.random() * 10);

              strip.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
              strip.style.opacity = "0";
            });
          });
        });

        // שלב 4: קריסת העמודה וניקוי
        const totalAnimTime = STRIP_COUNT * 35 + 550;
        setTimeout(() => {
          strips.forEach((s) => s.remove());
          column.classList.add("cme_column-collapsing");

          setTimeout(callback, 320);
        }, totalAnimTime);
      }, 300); // המתנה לסיום הרעידה
    },

    // שינוי שם קומבו
    renameCombo(comboId, newName) {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        const combo = combos.find((c) => c.id === comboId);
        if (combo) {
          combo.name = newName;
          chrome.storage.local.set({ savedCombos: combos }, () => {
            // console.log(`[ComboManager] Combo ${comboId} renamed to "${newName}"`);
          });
        }
      });
    },

    // הצטיידות בקומבו
    async equipCombo(combo) {
      // console.log('[ComboManager] Equipping combo:', combo);
      if (window.TankiQoL.ComboLoader) {
        await window.TankiQoL.ComboLoader.equipCombo(combo);
      } else {
        console.error("ComboLoader not loaded!");
      }
    },

    // הסרת פריט מקומבו
    removeItemFromCombo(comboId, itemType) {
      chrome.storage.local.get(["savedCombos"], (result) => {
        let combos = result.savedCombos || [];
        const combo = combos.find((c) => c.id === comboId);
        if (!combo) return;

        // יצירת removedItems אם לא קיים
        if (!combo.removedItems) {
          combo.removedItems = {};
        }

        // סימון הפריט כהוסר
        // טיפול בפריטי הגנה - itemType הוא protection_0, protection_1 וכו'
        if (itemType.startsWith("protection_")) {
          const protectionIndex = parseInt(itemType.split("_")[1]);
          if (!combo.removedItems.protection) {
            combo.removedItems.protection = [];
          }
          if (!combo.removedItems.protection.includes(protectionIndex)) {
            combo.removedItems.protection.push(protectionIndex);
          }
        } else {
          // פריטים רגילים
          combo.removedItems[itemType] = true;

          // אם מסירים turret, גם האוגמנט שלו צריך להיות מוסר
          if (itemType === "turret") {
            combo.removedItems.turretAugment = true;
          }

          // אם מסירים hull, גם האוגמנט שלו צריך להיות מוסר
          if (itemType === "hull") {
            combo.removedItems.hullAugment = true;
          }
        }

        chrome.storage.local.set({ savedCombos: combos }, () => {
          // console.log(`[ComboManager] Item ${itemType} removed from combo ${comboId}`);

          // מחיקה אוטומטית של קומבואים ריקים
          const ComboCleaner = window.TankiQoL.ComboCleaner;
          if (ComboCleaner && ComboCleaner.removeEmptyCombos) {
            ComboCleaner.removeEmptyCombos(() => {
              this.loadAndRenderCombos();
            });
          } else {
            this.loadAndRenderCombos();
          }
        });
      });
    },

    show() {
      if (this.viewElement) {
        this.viewElement.style.display = "flex";

        // טעינת הקומבואים כשמציגים את התצוגה
        this.loadAndRenderCombos();
      }

      // הסתרת כל האלמנטים המפריעים
      const elementsToHide = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
      elementsToHide.forEach((el) => (el.style.display = "none"));
    },

    hide() {
      if (this.viewElement) this.viewElement.style.display = "none";

      // הסרת כרטיס זמני בעת יציאה מכרטיסיית COMBOS
      this.removeTemporaryCard();

      // החזרת כל האלמנטים שהסתרנו
      const elementsToRestore = document.querySelectorAll(DOM.ELEMENTS_TO_HIDE);
      elementsToRestore.forEach((el) => (el.style.display = ""));
      const tankCanvas = document.querySelector(DOM.TANK_PREVIEW_CANVAS);
      if (tankCanvas) {
        tankCanvas.style.removeProperty("display");
      }

      // הסרת מאזין Enter (אבל לא ממש מסירים אותו כי הוא צריך לעבוד גם כשה-view מוסתר)
      // המאזין בודק בעצמו אם ה-view גלוי
    },

    // הצגת כרטיס זמני עם תוצאת רנדום בתחילת רשימת הקומבואים
    showTemporaryCard(comboData) {
      const container = this.viewElement
        ? this.viewElement.querySelector("#combos-grid-container")
        : null;
      if (!container) return;

      // הסרת כרטיס זמני קודם אם קיים
      this.removeTemporaryCard();

      // יצירת הכרטיס הזמני
      const CardRenderer = window.TankiQoL.ComboCardRenderer;
      if (!CardRenderer || !CardRenderer.createTemporaryCard) return;

      const card = CardRenderer.createTemporaryCard(comboData);

      // עטיפה ב-column כמו שאר הכרטיסים
      const column = document.createElement("div");
      column.className =
        "cme_flexSpaceBetweenAlignCenterColumn cme_temporary-card-column";
      column.appendChild(card);

      // הוספה בתחילת הרשימה
      container.insertBefore(column, container.firstChild);
      this.temporaryCardColumn = column;

      // גלילה לתחילת הרשימה כדי לראות את הכרטיס
      container.scrollLeft = 0;
    },

    // הסרת הכרטיס הזמני
    removeTemporaryCard() {
      if (this.temporaryCardColumn) {
        this.temporaryCardColumn.remove();
        this.temporaryCardColumn = null;
      }
    },
  };
})();
