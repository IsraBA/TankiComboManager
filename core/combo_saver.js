// core/combo_saver.js

// זה הקובץ שעושה את הקסם. הוא עובר כל כרטיסייה, מחכה, בודק מה מצויד, נכנס לאוגמנטים, שומר, וחוזר.
// core/combo_saver.js
(function() {
    'use strict';

    const DOM = window.TankiComboManager.DOM;
    const Utils = window.TankiComboManager.Utils;

    window.TankiComboManager.ComboSaver = {
        
        // פונקציה ראשית שנקראת בלחיצת כפתור
        async saveCurrentCombo() {
            Utils.log("Starting to scan equipment...");
            
            // אובייקט שיחזיק את התוצאות
            const currentCombo = {
                turret: null,
                turretAugment: null,
                // hull: null,      // נפעיל כשיהיה HTML
                // hullAugment: null
            };

            try {
                // 1. סריקת תותח (אנחנו מניחים שזה הטאב הראשון או שאנחנו מנווטים אליו)
                await this.navigateToTab('Turrets');
                currentCombo.turret = this.scanMainItem();
                
                // 2. סריקת אוגמנט תותח
                currentCombo.turretAugment = await this.scanAugment();

                // כאן בעתיד נוסיף:
                // await this.navigateToTab('Hulls');
                // currentCombo.hull = this.scanMainItem();
                // currentCombo.hullAugment = await this.scanAugment();

                // שמירה ל-localStorage
                this.saveToStorage(currentCombo);
                
                Utils.log("Scan complete!", currentCombo);
                alert("Combo Saved! Check Console for details.");

            } catch (error) {
                console.error("[ComboManager] Error during save:", error);
                alert("Error saving combo. See console.");
            }
        },

        // מעבר לטאב לפי טקסט
        async navigateToTab(tabName) {
            const tabs = document.querySelectorAll(DOM.TAB_ITEM_CLASS);
            let targetTab = null;

            for (let tab of tabs) {
                if (tab.innerText.toLowerCase().includes(tabName.toLowerCase())) {
                    targetTab = tab;
                    break;
                }
            }

            if (targetTab) {
                targetTab.click();
                Utils.log(`Mapsd to ${tabName}, waiting for render...`);
                // המתנה קריטית לטעינת ה-HTML של הטאב
                await Utils.sleep(1500); // שניה וחצי זה זמן בטוח להתחלה
            } else {
                throw new Error(`Tab ${tabName} not found!`);
            }
        },

        // פונקציה לזיהוי פריט ראשי (תותח/גוף)
        scanMainItem() {
            // אנחנו בודקים אם הכפתור "Equipped" קיים בדף
            const equippedBtn = document.querySelector(DOM.ITEM_IS_EQUIPPED_BTN);
            
            if (equippedBtn) {
                // אם הכפתור קיים, סימן שהפריט שמוצג כרגע הוא המצויד
                const nameEl = document.querySelector(DOM.ITEM_NAME_TEXT);
                if (nameEl) {
                    return Utils.cleanItemName(nameEl.innerText);
                }
            }
            // הערה: הלוגיקה הזו נכונה אם המשחק מציג תמיד את הפריט המצויד כשנכנסים לטאב.
            // אם לא, נצטרך לרוץ על הגריד למטה. לפי מה שאני מכיר בטנקי, כשנכנסים לטאב הוא מראה את מה שעליך.
            return "Unknown/Not Found";
        },

        // פונקציה לזיהוי אוגמנט (דורשת כניסה לתפריט משנה)
        async scanAugment() {
            const openBtn = document.querySelector(DOM.OPEN_AUGMENTS_BTN);
            if (!openBtn) {
                Utils.log("No augment button found (maybe user has no augments?)");
                return "None";
            }

            // כניסה למסך אוגמנטים
            openBtn.click();
            await Utils.sleep(300); // המתנה לפתיחת החלון

            let equippedAugmentName = "None";

            // חיפוש האייקון של "Equipped" בתוך הגריד
            const mountIcon = document.querySelector(DOM.AUGMENT_EQUIPPED_ICON);
            
            if (mountIcon) {
                // מצאנו את האייקון, עכשיו צריך למצוא את השם שנמצא באותו "תא"
                // אנחנו עולים למעלה לאבא המשותף (התא) ואז מחפשים את השם
                const parentCell = mountIcon.closest(DOM.AUGMENT_CELL); // שימוש ב-closest זה הכי בטוח
                if (parentCell) {
                    const nameEl = parentCell.querySelector(DOM.AUGMENT_NAME);
                    if (nameEl) {
                        equippedAugmentName = nameEl.innerText;
                    }
                }
            } else {
                // אם לא מצאנו אייקון mount, אולי "Standard settings" נבחר?
                // בדרך כלל לסטנדרט אין אייקון mount, אז נניח שזה זה.
                equippedAugmentName = "Standard";
            }

            // יציאה ממסך האוגמנטים (חזרה לתותח)
            const backBtn = document.querySelector(DOM.BACK_BUTTON);
            if (backBtn) {
                backBtn.click();
                await Utils.sleep(300); // המתנה קצרה ליציאה
            }

            return equippedAugmentName;
        },

        saveToStorage(comboData) {
            // שליפת קומבואים קיימים
            chrome.storage.local.get(['savedCombos'], (result) => {
                let combos = result.savedCombos || [];
                
                const newCombo = {
                    id: Date.now(), // מזהה ייחודי
                    name: `Combo ${combos.length + 1}`,
                    data: comboData,
                    date: new Date().toLocaleDateString()
                };

                combos.push(newCombo);

                chrome.storage.local.set({ savedCombos: combos }, () => {
                    Utils.log("Combo saved to localStorage:", newCombo);
                });
            });
        }
    };
})();