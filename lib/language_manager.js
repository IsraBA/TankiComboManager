// lib/language_manager.js

// מנהל שפות - מזהה את השפה הנוכחית ומספק את השמות המדויקים של הכרטיסיות
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    // הגדרת שפות נתמכות
    const LANGUAGES = {
        en: {
            code: 'en',
            name: 'English',
            garageText: 'GARAGE', // הטקסט שמופיע בראש המוסך
            equipButtonText: 'equip', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Turrets',
                Hulls: 'Hulls',
                Grenades: 'Grenades',
                Drones: 'Drones',
                Protection: 'Protection',
                Supplies: 'Supplies',
                Paints: 'Paints'
            }
        },
        ru: {
            code: 'ru',
            name: 'Russian',
            garageText: 'ГАРАЖ', // הטקסט שמופיע בראש המוסך
            equipButtonText: 'установить', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Пушки',
                Hulls: 'Корпуса',
                Grenades: 'Гранаты',
                Drones: 'Дроны',
                Protection: 'Защита',
                Supplies: 'Припасы',
                Paints: 'Краски'
            }
        },
        es: {
            code: 'es',
            name: 'Spanish',
            garageText: 'GARAJE', // הטקסט שמופיע בראש המוסך
            equipButtonText: 'equipar', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Torretas',
                Hulls: 'Cascos',
                Grenades: 'Granadas',
                Drones: 'Dron',
                Protection: 'Protección',
                Supplies: 'Suministros',
                Paints: 'Pintura'
            }
        },
        pl: {
            code: 'pl',
            name: 'Polish',
            garageText: 'HANGAR', // הטקסט שמופיע בראש המוסך
            equipButtonText: 'wyposaż', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Wieże',
                Hulls: 'Kadłuby',
                Grenades: 'Granaty',
                Drones: 'Drony',
                Protection: 'Ochrona',
                Supplies: 'Zaopatrzenie',
                Paints: 'Farby'
            }
        },
        pt: {
            code: 'pt',
            name: 'Portuguese',
            garageText: 'GARAGEM', // הטקסט שמופיע בראש המוסך
            equipButtonText: 'equipar', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Torretas',
                Hulls: 'Carrocerias',
                Grenades: 'Granadas',
                Drones: 'Drone',
                Protection: 'Proteção',
                Supplies: 'Suprimentos',
                Paints: 'Pintura'
            }
        },
        de: {
            code: 'de',
            name: 'German',
            garageText: 'GARAGE', // הטקסט שמופיע בראש המוסך (זהה לאנגלית)
            equipButtonText: 'ausstatten', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Waffen',
                Hulls: 'Untersätze',
                Grenades: 'Granaten',
                Drones: 'Drohnen',
                Protection: 'Schutz',
                Supplies: 'Versorgungen',
                Paints: 'Farben'
            }
        },
        fr: {
            code: 'fr',
            name: 'French',
            garageText: 'GARAGE', // הטקסט שמופיע בראש המוסך (זהה לאנגלית וגרמנית)
            equipButtonText: 'équiper', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: 'Tourelles',
                Hulls: 'Tanks',
                Grenades: 'Grenades',
                Drones: 'Drone',
                Protection: 'Protection',
                Supplies: 'Ravitaillements',
                Paints: 'Peinture'
            }
        },
        ja: {
            code: 'ja',
            name: 'Japanese',
            garageText: 'ガレージ', // הטקסט שמופיע בראש המוסך
            equipButtonText: '装備', // הטקסט של כפתור ה-equip
            tabs: {
                Turrets: '砲塔',
                Hulls: '車体',
                Grenades: 'グレネード',
                Drones: 'ドローン',
                Protection: '保護',
                Supplies: '支援物資',
                Paints: '塗装'
            }
        }
        // ניתן להוסיף עוד שפות כאן בקלות
    };

    window.TankiComboManager.LanguageManager = {
        currentLanguage: null,
        detectedLanguageCode: null,

        // זיהוי השפה הנוכחית לפי הטקסט ב-BreadcrumbsComponentStyle-rootTitle span + 3 הכרטיסיות הראשונות
        detectLanguage() {
            const DOM = window.TankiComboManager.DOM;

            // חיפוש הטקסט ב-BreadcrumbsComponentStyle-rootTitle span
            const rootTitle = document.querySelector(DOM.GARAGE_ROOT_TITLE);

            if (!rootTitle) {
                // console.warn('[LanguageManager] GARAGE_ROOT_TITLE not found, defaulting to English');
                this.currentLanguage = LANGUAGES.en;
                this.detectedLanguageCode = 'en';
                return this.currentLanguage;
            }

            const garageText = rootTitle.textContent?.trim() || '';
            const garageTextUpper = garageText.toUpperCase();

            // איסוף 3 הכרטיסיות הראשונות מהדף (Turrets, Hulls, Grenades)
            const menuContainer = document.querySelector(DOM.MENU_CONTAINER);
            let pageTabs = [];
            
            if (menuContainer) {
                const tabs = menuContainer.querySelectorAll(`.${DOM.TAB_ITEM_CLASS}`);
                const tabTexts = Array.from(tabs)
                    .map(tab => tab.textContent?.trim() || '')
                    .filter(text => text && !text.toUpperCase().includes('COMBOS'))
                    .slice(0, 3); // רק 3 הראשונות
                
                pageTabs = tabTexts.map(text => text.toUpperCase());
            }

            // ניסיון לזהות שפה לפי הטקסט של GARAGE + הכרטיסיות
            let bestMatch = null;
            let bestMatchScore = 0;

            for (const [langCode, langData] of Object.entries(LANGUAGES)) {
                const langGarageText = langData.garageText.toUpperCase();
                let score = 0;

                // בדיקת garageText (1 נקודה)
                if (garageTextUpper === langGarageText) {
                    score += 1;
                }

                // בדיקת 3 הכרטיסיות הראשונות (3 נקודות - אחת לכל כרטיסייה)
                if (pageTabs.length > 0) {
                    const langTabs = [
                        langData.tabs.Turrets.toUpperCase(),
                        langData.tabs.Hulls.toUpperCase(),
                        langData.tabs.Grenades.toUpperCase()
                    ];

                    for (let i = 0; i < Math.min(pageTabs.length, langTabs.length); i++) {
                        if (pageTabs[i] === langTabs[i]) {
                            score += 1;
                        }
                    }
                }

                // אם יש התאמה מלאה (garageText + כל 3 הכרטיסיות) - זו השפה הנכונה
                if (score === 4) {
                    this.currentLanguage = langData;
                    this.detectedLanguageCode = langCode;
                    // console.log(`[LanguageManager] Detected language: ${langData.name} (${langCode}) from "${garageText}" and tabs`);
                    return this.currentLanguage;
                }

                // שמירת ההתאמה הטובה ביותר
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatch = { langData, langCode };
                }
            }

            // אם יש התאמה טובה (לפחות garageText או 2 כרטיסיות), נשתמש בה
            if (bestMatch && bestMatchScore >= 2) {
                this.currentLanguage = bestMatch.langData;
                this.detectedLanguageCode = bestMatch.langCode;
                // console.log(`[LanguageManager] Detected language: ${bestMatch.langData.name} (${bestMatch.langCode}) with score ${bestMatchScore}`);
                return this.currentLanguage;
            }

            // אם לא זיהינו שפה, נשתמש באנגלית כברירת מחדל
            // console.warn(`[LanguageManager] Could not detect language from "${garageText}", defaulting to English`);
            this.currentLanguage = LANGUAGES.en;
            this.detectedLanguageCode = 'en';
            return this.currentLanguage;
        },

        // קבלת השפה הנוכחית (עם זיהוי אוטומטי אם עדיין לא זוהה)
        getCurrentLanguage() {
            if (!this.currentLanguage) {
                this.detectLanguage();
            }
            return this.currentLanguage;
        },

        // קבלת קוד השפה הנוכחית
        getCurrentLanguageCode() {
            if (!this.detectedLanguageCode) {
                this.detectLanguage();
            }
            return this.detectedLanguageCode;
        },

        // קבלת שם כרטיסייה לפי מפתח (Turrets, Hulls, וכו')
        getTabName(key) {
            const lang = this.getCurrentLanguage();
            return lang.tabs[key] || key;
        },

        // קבלת כל שמות הכרטיסיות
        getAllTabNames() {
            const lang = this.getCurrentLanguage();
            return lang.tabs;
        },

        // קבלת הטקסט של כפתור ה-equip בשפה הנוכחית
        getEquipButtonText() {
            const lang = this.getCurrentLanguage();
            return lang.equipButtonText || 'equip';
        },

        // בדיקה אם שפה נתמכת
        isLanguageSupported(langCode) {
            return LANGUAGES.hasOwnProperty(langCode);
        },

        // קבלת נתוני שפה לפי קוד
        getLanguageByCode(langCode) {
            return LANGUAGES[langCode] || LANGUAGES.en;
        },

        // איפוס (לצורך זיהוי מחדש)
        reset() {
            this.currentLanguage = null;
            this.detectedLanguageCode = null;
        }
    };
})();