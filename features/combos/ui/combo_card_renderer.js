// features/combos/ui/combo_card_renderer.js

// קובץ זה אחראי ליצירת כרטיסי קומבו בודדים
(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  window.TankiQoL.ComboCardRenderer = {
    // אילו קומבואים נמצאים כרגע במצב עריכה, לפי id.
    // חייב לחיות מחוץ לאלמנט הכרטיס: הסרת פריט כותבת ל-storage ואז מרנדרת
    // מחדש את כל הרשימה, כך שהכרטיס עצמו (והקלאס שעליו) נזרק. בלי זה מצב
    // העריכה היה נסגר אחרי כל הסרה בודדת.
    _editingCombos: new Set(),

    // יצירת כרטיס קומבו בודד
    createComboCard(combo, index, viewRenderer) {
      const LM = window.TankiQoL.LanguageManager;
      const card = document.createElement("div");
      card.className = "cme_combo-card";
      card.setAttribute("data-combo-id", combo.id);

      // שחזור מצב העריכה אחרי רינדור מחדש
      const isEditing = this._editingCombos.has(combo.id);
      if (isEditing) card.classList.add("cme_editing");

      // יצירת 4 השורות (עם בדיקת פריטים מוסרים)
      const rowsHTML = this.createRowsHTML(
        combo.data,
        combo.removedItems || {},
      );

      // כפתור מחיקה
      const deleteBtnHTML = `
                <div class="cme_delete-btn" title="${LM.getUIText("deleteCombo")}"></div>
            `;

      // כפתור עריכה — מכניס/מוציא את הכרטיס ממצב עריכה (שבו מופיעים ה-X-ים
      // להסרת פריטים). שני האייקונים מוזרקים יחד וה-CSS מציג את הנכון לפי
      // המצב: עיפרון כברירת מחדל, V במצב עריכה.
      //
      // הסגנון מחקה את אייקון ה-X של המשחק (iconDelete.svg): קנבס 24×24,
      // צורה **מלאה** בלבן (לא stroke), חדה וזוויתית לגמרי. גם מצבי הצבע
      // מגיעים משם — לבן ב-25% שקיפות שהופך ללבן מלא ב-hover (במשחק אלה שני
      // קבצים, אצלנו אותו SVG עם opacity ב-CSS). ראה combo_card.css.
      //
      // שני האייקונים מכוילים ל-X: **עובי רצועה זהה (3√2 ≈ 4.24 יחידות)
      // ותפוסה של כל הקנבס 24×24**. שים לב ש-V בשתי זרועות ב-45° לא יכול
      // להגיע לגובה 24 בתוך רוחב 24 (הזרוע הארוכה לבדה תדרוש 24 רוחב), ולכן
      // הזרוע הארוכה שלו תלולה יותר (~55°) — זו הדרך היחידה לקבל גם גובה מלא
      // וגם עובי זהה. אל תנסו להשיג את זה עם transform: scale — הוא מנפח גם
      // את העובי, וזה מה שגרם ל-V להיראות שמן ליד ה-X.
      const editBtnHTML = `
                <div class="cme_combo-edit-btn" title="${LM.getUIText(isEditing ? "doneEditing" : "editCombo")}">
                    <svg class="cme_combo-edit-icon cme_combo-edit-icon-pencil" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 16.5L7.5 20.5L0 24L3.5 16.5ZM3.5 16.5L16.5 3.5L20.5 7.5L7.5 20.5L3.5 16.5ZM18 2L20 0L24 4L22 6L18 2Z" fill="white"/>
                    </svg>
                    <svg class="cme_combo-edit-icon cme_combo-edit-icon-check" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 11.96L8.46 17.41L20.51 0L24 2.41L9.05 24L0 14.96Z" fill="white"/>
                    </svg>
                </div>
            `;

      // כותרת הקומבו (ללא רקע כהה)
      const titleHTML = `
                <div class="cme_combo-title">
                    <h1 contenteditable="true" spellcheck="false">${combo.name || `COMBO ${index + 1}`}</h1>
                </div>
            `;

      card.innerHTML = `
                <div class="cme_combo-preview-container">
                    ${titleHTML}
                    <div class="cme_combo-rows">
                        ${rowsHTML}
                    </div>
                    ${editBtnHTML}
                    ${deleteBtnHTML}
                </div>
            `;

      // חיבור אירועים
      this.bindComboCardEvents(card, combo, viewRenderer);

      // הפיכת הכרטיס לניתן לגרירה
      if (window.TankiQoL.ComboDragHandler) {
        window.TankiQoL.ComboDragHandler.makeCardDraggable(
          card,
          combo.id,
        );
      }

      return card;
    },

    // יצירת 4 השורות
    createRowsHTML(data, removedItems = {}) {
      // שורה ראשונה: 2 ריבועים - drone ו-grenade
      const droneImage =
        data.drone && data.drone.image && !removedItems.drone
          ? data.drone.image
          : null;
      const grenadeImage =
        data.grenade && data.grenade.image && !removedItems.grenade
          ? data.grenade.image
          : null;
      const hasDroneButNoImage =
        data.drone && !removedItems.drone && !droneImage;
      const hasGrenadeButNoImage =
        data.grenade && !removedItems.grenade && !grenadeImage;
      const isDroneRemoved = removedItems.drone;
      const isGrenadeRemoved = removedItems.grenade;

      const row1HTML = `
                <div class="cme_combo-row cme_combo-row-1">
                    <div class="cme_combo-square">
                        ${isDroneRemoved ? `<span class="cme_combo-item-name">NO DRONE</span>` : data.drone && data.drone.name && !removedItems.drone ? `<span class="cme_combo-item-name">${data.drone.name}</span>` : ""}
                        ${droneImage ? this.createRemovableItemHTML("drone", droneImage, data.drone.name || "Drone", "cme_combo-drone-image") : hasDroneButNoImage ? '<span class="cme_combo-no-item">NO DRONE</span>' : ""}
                    </div>
                    <div class="cme_combo-square">
                        ${isGrenadeRemoved ? `<span class="cme_combo-item-name">NO GRENADE</span>` : data.grenade && data.grenade.name && !removedItems.grenade ? `<span class="cme_combo-item-name">${data.grenade.name}</span>` : ""}
                        ${grenadeImage ? this.createRemovableItemHTML("grenade", grenadeImage, data.grenade.name || "Grenade", "cme_combo-grenade-image") : hasGrenadeButNoImage ? '<span class="cme_combo-no-item">NO GRENADE</span>' : ""}
                    </div>
                </div>
            `;

      // שורה שניה: מלבן עם turret, ובפינה השמאלית התחתונה תגי האוגמנט
      // ואפקט הירייה.
      // הסקין (אם יש) מחליף את תמונת התותח. הוא **אינו** פריט נפרד להסרה:
      // הסרת התותח מסירה את כל מה שבגזרה שלו — סקין, אוגמנט ואפקט ירייה.
      const isTurretRemoved = removedItems.turret;
      const activeTurret = data.turret && !isTurretRemoved ? data.turret : null;
      const turretImage = activeTurret
        ? (data.turretSkin && data.turretSkin.image) || activeTurret.image || null
        : null;
      const turretAugmentImage =
        !isTurretRemoved &&
        data.turretAugment &&
        data.turretAugment.image &&
        !removedItems.turretAugment
          ? data.turretAugment.image
          : null;
      const hasTurretButNoImage = activeTurret && !turretImage;

      const row2HTML = `
                <div class="cme_combo-row cme_combo-row-2">
                    <div class="cme_combo-rectangle">
                        ${isTurretRemoved ? `<span class="cme_combo-item-name">NO TURRET</span>` : data.turret && data.turret.name ? `<span class="cme_combo-item-name">${data.turret.name}</span>` : ""}
                        ${turretImage ? this.createRemovableItemHTML("turret", turretImage, data.turret.name || "Turret", "cme_combo-turret-image") : hasTurretButNoImage ? '<span class="cme_combo-no-item">NO TURRET</span>' : ""}
                        ${this.createBadgesHTML([
                          turretAugmentImage
                            ? this.createBadgeHTML("turretAugment", turretAugmentImage, data.turretAugment.name || "Turret Augment")
                            : "",
                        ])}
                        <!-- אפקט הירייה (turretShotFx) נשמר ומוצמד לקומבו, אבל
                             מוסתר בכוונה מהכרטיס: הוא מוחל תמיד ואי אפשר לבטלו.
                             הוא עדיין נגרר עם התותח — הסרת התותח מסירה גם אותו. -->
                    </div>
                </div>
            `;

      // שורה שלישית: מלבן עם hull (או הסקין שלו) + תג האוגמנט
      const isHullRemoved = removedItems.hull;
      const activeHull = data.hull && !isHullRemoved ? data.hull : null;
      const hullImage = activeHull
        ? (data.hullSkin && data.hullSkin.image) || activeHull.image || null
        : null;
      const hullAugmentImage =
        !isHullRemoved &&
        data.hullAugment &&
        data.hullAugment.image &&
        !removedItems.hullAugment
          ? data.hullAugment.image
          : null;
      const hasHullButNoImage = activeHull && !hullImage;

      const row3HTML = `
                <div class="cme_combo-row cme_combo-row-3">
                    <div class="cme_combo-rectangle">
                        ${isHullRemoved ? `<span class="cme_combo-item-name">NO HULL</span>` : data.hull && data.hull.name ? `<span class="cme_combo-item-name">${data.hull.name}</span>` : ""}
                        ${hullImage ? this.createRemovableItemHTML("hull", hullImage, data.hull.name || "Hull", "cme_combo-hull-image") : hasHullButNoImage ? '<span class="cme_combo-no-item">NO HULL</span>' : ""}
                        ${this.createBadgesHTML([
                          hullAugmentImage
                            ? this.createBadgeHTML("hullAugment", hullAugmentImage, data.hullAugment.name || "Hull Augment")
                            : "",
                        ])}
                    </div>
                </div>
            `;

      // שורה רביעית: ריבוע הצבע + מלבן 4 ההגנות
      const protections =
        data.protection && Array.isArray(data.protection)
          ? data.protection
          : [];
      const isPaintRemoved = removedItems.paint;
      const paintImage =
        data.paint && data.paint.image && !isPaintRemoved
          ? data.paint.image
          : null;

      // יצירת 4 פריטי הגנה
      const removedProtections = removedItems.protection || [];

      let protectionsHTML = "";
      if (protections.length === 0) {
        // אין הגנות בכלל - מציגים "NO PROTECTIONS"
        protectionsHTML =
          '<span class="cme_combo-no-item">NO PROTECTIONS</span>';
      } else {
        // יש הגנות - מציגים ריבועים (ריקים אם הוסרו)
        const protectionItems = [];
        for (let i = 0; i < 4; i++) {
          const protection = protections[i] || null;
          const isRemoved = removedProtections.includes(i);
          const protectionImage =
            protection && protection.image && !isRemoved
              ? protection.image
              : null;
          const protectionName =
            protection && protection.name ? protection.name : null;
          const isEmpty = !protectionImage;
          protectionItems.push(`
                        <div class="cme_combo-protection-item ${isEmpty ? "cme_combo-protection-item-empty" : ""}">
                            ${protectionImage ? this.createRemovableItemHTML(`protection_${i}`, protectionImage, protectionName || `Protection ${i + 1}`, "") : ""}
                        </div>
                    `);
        }
        protectionsHTML = protectionItems.join("");
      }

      // ריבוע הצבע — יושב במקום שבו היה כפתור ה-EQUIP (שהוסר: הצטיידות
      // נעשית עכשיו בלחיצה על הכרטיס עצמו), ומוצג תמיד ולא רק ב-hover.
      // כשאין צבע (קומבו ישן) או שהוא הוסר — כיתוב "NO PAINT" בסגנון של
      // NO HULL / NO DRONE, כלומר התווית הלבנה (cme_combo-item-name) ולא
      // הטקסט האפור של NO PROTECTIONS. ה-CSS מבטל לה את המיקום המוחלט
      // בתוך ריבוע הצבע כדי שתשב במרכז.
      const paintSquareHTML = `
                <div class="cme_combo-paint-square">
                    ${paintImage ? this.createRemovableItemHTML("paint", paintImage, data.paint.name || "Paint", "") : '<span class="cme_combo-item-name">NO PAINT</span>'}
                </div>
            `;

      const row4HTML = `
                <div class="cme_combo-row cme_combo-row-4">
                    ${paintSquareHTML}
                    <div class="cme_combo-protections">
                        ${protectionsHTML}
                    </div>
                </div>
            `;

      return row1HTML + row2HTML + row3HTML + row4HTML;
    },

    // עטיפת שורת התגים בפינה השמאלית התחתונה של מלבן (אוגמנט, אפקט ירייה).
    // מקבלת מערך של HTML-ים ומסננת ריקים; אם לא נשאר כלום — לא מרנדרת כלום.
    createBadgesHTML(badges) {
      const items = badges.filter(Boolean);
      if (!items.length) return "";
      return `<div class="cme_combo-badges">${items.join("")}</div>`;
    },

    // תג בודד (אוגמנט / אפקט ירייה) — ניתן להסרה כמו כל פריט אחר
    createBadgeHTML(itemType, imageSrc, altText) {
      return `
                <div class="cme_combo-augment-badge">
                    ${this.createRemovableItemHTML(itemType, imageSrc, altText, "")}
                </div>
            `;
    },

    // יצירת HTML לפריט שניתן להסיר
    createRemovableItemHTML(itemType, imageSrc, altText, imageClass) {
      // קביעת גודל האיקס לפי סוג הפריט
      let iconSizeClass = "";
      if (itemType === "turret" || itemType === "hull") {
        iconSizeClass = "cme_combo-item-remove-icon-large";
      } else if (itemType === "drone" || itemType === "grenade") {
        iconSizeClass = "cme_combo-item-remove-icon-small";
      }

      return `
                <div class="cme_combo-item-removable" data-item-type="${itemType}">
                    <img src="${imageSrc}" alt="${altText}" class="${imageClass}" onerror="this.style.display='none';">
                    <svg class="cme_combo-item-remove-icon ${iconSizeClass}" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            `;
    },

    // יצירת כרטיס זמני לתוצאת רנדום — ללא עריכה/מחיקה/drag, עם מסגרת ירוקה
    createTemporaryCard(comboData) {
      const LM = window.TankiQoL.LanguageManager;
      const card = document.createElement("div");
      card.className = "cme_combo-card cme_combo-card-temporary";
      card.setAttribute("data-temporary", "true");

      // יצירת 4 השורות (ללא removedItems)
      const rowsHTML = this.createRowsHTML(comboData, {});

      // כותרת — "RANDOM COMBO" לא ניתנת לעריכה
      const titleHTML = `
                <div class="cme_combo-title cme_combo-title-temporary">
                    <h1>${LM ? LM.getUIText("randomCombo") : "RANDOM COMBO"}</h1>
                </div>
            `;

      card.innerHTML = `
                <div class="cme_combo-preview-container">
                    ${titleHTML}
                    <div class="cme_combo-rows">
                        ${rowsHTML}
                    </div>
                </div>
            `;

      // אין אירועים של עריכה/מחיקה/הסרת פריטים — הכרטיס רק לצפייה

      return card;
    },

    // חיבור אירועים לכרטיס קומבו
    bindComboCardEvents(card, combo, viewRenderer) {
      const LM = window.TankiQoL.LanguageManager;

      // כפתור מחיקה
      const deleteBtn = card.querySelector(".cme_delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this._editingCombos.delete(combo.id);
          viewRenderer.deleteCombo(combo.id, combo.name);
        };
      }

      // כפתור עריכה — מתג בין מצב רגיל (לחיצה = הצטיידות) למצב עריכה
      // (לחיצה על פריט = הסרתו). ה-CSS נשען על הקלאס cme_editing, והמצב
      // נשמר ב-_editingCombos כדי לשרוד את הרינדור מחדש שאחרי כל הסרה.
      const editBtn = card.querySelector(".cme_combo-edit-btn");
      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation();
          const editing = card.classList.toggle("cme_editing");
          if (editing) this._editingCombos.add(combo.id);
          else this._editingCombos.delete(combo.id);
          editBtn.title = LM.getUIText(editing ? "doneEditing" : "editCombo");
        };
      }

      // עריכת שם הקומבו
      const titleElement = card.querySelector(".cme_combo-title h1");
      if (titleElement) {
        const MAX_NAME_LENGTH = 15;

        // פונקציה לבדיקת אורך השם
        const enforceMaxLength = (element) => {
          const text = element.textContent;
          if (text.length > MAX_NAME_LENGTH) {
            element.textContent = text.substring(0, MAX_NAME_LENGTH);
            // החזרת הקורסור לסוף הטקסט
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        };

        titleElement.onblur = (e) => {
          const newName = e.target.textContent
            .trim()
            .substring(0, MAX_NAME_LENGTH);
          if (newName && newName !== combo.name) {
            viewRenderer.renameCombo(combo.id, newName);
          }
          // עדכון הטקסט אם הוא חתוך
          if (e.target.textContent.trim().length > MAX_NAME_LENGTH) {
            e.target.textContent = newName;
          }
        };
        titleElement.onkeydown = (e) => {
          // מונע מהמשחק לקבל את אירועי המקלדת
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            e.target.blur();
          }
          // מונע הקלדה אם הגענו למקסימום (חוץ מכפתורי בקרה)
          const text = e.target.textContent;
          if (
            text.length >= MAX_NAME_LENGTH &&
            ![
              "Backspace",
              "Delete",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
              "Tab",
              "Enter",
              "Escape",
            ].includes(e.key) &&
            !e.ctrlKey &&
            !e.metaKey
          ) {
            e.preventDefault();
          }
        };
        // מונע התפשטות של כל אירועי המקלדת למשחק
        titleElement.onkeyup = (e) => {
          e.stopPropagation();
        };
        titleElement.onkeypress = (e) => {
          e.stopPropagation();
        };
        titleElement.onclick = (e) => {
          e.stopPropagation();
        };
        // מונע התפשטות גם באירועי focus ו-input
        titleElement.onfocus = (e) => {
          e.stopPropagation();
        };
        titleElement.oninput = (e) => {
          e.stopPropagation();
          enforceMaxLength(e.target);
        };
        // מונע הדבקה של טקסט ארוך מדי
        titleElement.onpaste = (e) => {
          e.stopPropagation();
          e.preventDefault();
          const pastedText = (e.clipboardData || window.clipboardData).getData(
            "text",
          );
          const currentText = e.target.textContent;
          const selection = window.getSelection();
          const range =
            selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

          if (range) {
            range.deleteContents();
            const textNode = document.createTextNode(
              pastedText.substring(
                0,
                MAX_NAME_LENGTH - currentText.length + range.toString().length,
              ),
            );
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            const newText = (currentText + pastedText).substring(
              0,
              MAX_NAME_LENGTH,
            );
            e.target.textContent = newText;
          }
          enforceMaxLength(e.target);
        };
      }

      // טיפול בלחיצה על פריטים להסרה — פעיל רק במצב עריכה.
      // מחוץ למצב עריכה לא עוצרים את האירוע, כדי שיבעבע לכרטיס ויצייד.
      const removableItems = card.querySelectorAll(".cme_combo-item-removable");
      removableItems.forEach((item) => {
        item.onclick = (e) => {
          if (!card.classList.contains("cme_editing")) return;
          e.stopPropagation();
          const itemType = item.getAttribute("data-item-type");
          if (itemType) {
            viewRenderer.removeItemFromCombo(combo.id, itemType);
          }
        };
      });

      // לחיצה על הכרטיס = הצטיידות בקומבו.
      // שלושה סייגים:
      //   1. לא במצב עריכה (שם הלחיצות מיועדות להסרת פריטים).
      //   2. לא בשורה העליונה (שם, מחיקה, עריכה) — היא לא חלק משטח הלחיצה.
      //   3. לא כשהמשתמש בעצם *גרר* את הכרטיס לסידור מחדש. מזהים לפי תזוזת
      //      העכבר בין ה-mousedown ל-click: תזוזה מעבר לסף = גרירה, לא לחיצה.
      //      (לא נשענים על אירועי ה-drag עצמם, כי דפדפנים לא עקביים לגבי
      //      השאלה אם click נורה אחרי גרירה.)
      const DRAG_THRESHOLD_PX = 5;
      let downX = 0;
      let downY = 0;
      card.addEventListener("mousedown", (e) => {
        downX = e.clientX;
        downY = e.clientY;
      });

      card.onclick = (e) => {
        if (card.classList.contains("cme_editing")) return;
        if (
          e.target.closest(".cme_combo-title") ||
          e.target.closest(".cme_delete-btn") ||
          e.target.closest(".cme_combo-edit-btn")
        ) {
          return;
        }
        const moved =
          Math.abs(e.clientX - downX) > DRAG_THRESHOLD_PX ||
          Math.abs(e.clientY - downY) > DRAG_THRESHOLD_PX;
        if (moved) return;

        viewRenderer.equipCombo(combo);
      };
    },
  };
})();
