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
            garageText: 'GARAGE',
            equipButtonText: 'equip',
            tabs: {
                Turrets: 'Turrets',
                Hulls: 'Hulls',
                Grenades: 'Grenades',
                Drones: 'Drones',
                Protection: 'Protection',
                Supplies: 'Supplies',
                Paints: 'Paints'
            },
            ui: {
                comboManager: 'Combo Manager',
                specialExtension: 'Special Extension',
                description: 'Streamline your garage experience by instantly saving your current equipment loadout and equipping your favorite combos with a single click.',
                proTipLabel: 'Pro Tip:',
                proTip1: 'Consider saving your combos with Armadillo protection only, so when switching loadouts in battle you can quickly select your desired protections without having to manually remove unwanted ones that the combo automatically equipped.',
                proTip2Label: 'Pro Tip 2:',
                proTip2: 'Organize your combo list by dragging combo cards to place your most frequently used combos at the top for instant access.',
                autoOpenCheckbox: 'Open Combos tab automatically when entering garage',
                saveCombo: 'SAVE COMBO',
                equipCombo: 'EQUIP',
                deleteCombo: 'Delete combo',
                noSavedCombos: 'No saved combos yet',
                clickToSave: 'Click "SAVE COMBO" to save your first combo!',
                deleteConfirm: 'Are you sure you want to delete this combo?'
            }
        },
        ru: {
            code: 'ru',
            name: 'Russian',
            garageText: 'ГАРАЖ',
            equipButtonText: 'установить',
            tabs: {
                Turrets: 'Пушки',
                Hulls: 'Корпуса',
                Grenades: 'Гранаты',
                Drones: 'Дроны',
                Protection: 'Защита',
                Supplies: 'Припасы',
                Paints: 'Краски'
            },
            ui: {
                comboManager: 'Менеджер комбо',
                specialExtension: 'Специальное расширение',
                description: 'Упростите работу с гаражом, мгновенно сохраняя текущую комплектацию и применяя любимые комбо одним щелчком мыши.',
                proTipLabel: 'Совет:',
                proTip1: 'Рекомендуется сохранять комбо только с защитой Броненосец, чтобы в бою можно было быстро выбрать нужную защиту, не удаляя вручную ненужную, которую комбо автоматически установило.',
                proTip2Label: 'Совет 2:',
                proTip2: 'Организуйте список комбо, перетаскивая карточки комбо, чтобы разместить наиболее часто используемые комбо вверху для быстрого доступа.',
                autoOpenCheckbox: 'Автоматически открывать вкладку Комбо при входе в гараж',
                saveCombo: 'СОХРАНИТЬ КОМБО',
                equipCombo: 'УСТАНОВИТЬ',
                deleteCombo: 'Удалить комбо',
                noSavedCombos: 'Нет сохраненных комбо',
                clickToSave: 'Нажмите "СОХРАНИТЬ КОМБО" чтобы сохранить первое комбо!',
                deleteConfirm: 'Вы уверены, что хотите удалить это комбо?'
            }
        },
        es: {
            code: 'es',
            name: 'Spanish',
            garageText: 'GARAJE',
            equipButtonText: 'equipar',
            tabs: {
                Turrets: 'Torretas',
                Hulls: 'Cascos',
                Grenades: 'Granadas',
                Drones: 'Dron',
                Protection: 'Protección',
                Supplies: 'Suministros',
                Paints: 'Pintura'
            },
            ui: {
                comboManager: 'Gestor de Combos',
                specialExtension: 'Extensión Especial',
                description: 'Optimiza tu experiencia en el garaje guardando instantáneamente tu configuración de equipo actual y equipando tus combos favoritos con un solo clic.',
                proTipLabel: 'Consejo:',
                proTip1: 'Considera guardar tus combos solo con protección Armadillo, para que al cambiar configuraciones en batalla puedas seleccionar rápidamente tus protecciones deseadas sin tener que eliminar manualmente las no deseadas que el combo equipó automáticamente.',
                proTip2Label: 'Consejo 2:',
                proTip2: 'Organiza tu lista de combos arrastrando las tarjetas de combo para colocar tus combos más utilizados en la parte superior para un acceso instantáneo.',
                autoOpenCheckbox: 'Abrir pestaña Combos automáticamente al entrar al garaje',
                saveCombo: 'GUARDAR COMBO',
                equipCombo: 'EQUIPAR',
                deleteCombo: 'Eliminar combo',
                noSavedCombos: 'No hay combos guardados aún',
                clickToSave: 'Haz clic en "GUARDAR COMBO" para guardar tu primer combo!',
                deleteConfirm: '¿Estás seguro de que quieres eliminar este combo?'
            }
        },
        pl: {
            code: 'pl',
            name: 'Polish',
            garageText: 'HANGAR',
            equipButtonText: 'wyposaż',
            tabs: {
                Turrets: 'Wieże',
                Hulls: 'Kadłuby',
                Grenades: 'Granaty',
                Drones: 'Drony',
                Protection: 'Ochrona',
                Supplies: 'Zaopatrzenie',
                Paints: 'Farby'
            },
            ui: {
                comboManager: 'Menedżer Combo',
                specialExtension: 'Specjalne Rozszerzenie',
                description: 'Usprawnij swoje doświadczenie w hangarze, błyskawicznie zapisując aktualny zestaw wyposażenia i wyposażając ulubione combo jednym kliknięciem.',
                proTipLabel: 'Wskazówka:',
                proTip1: 'Rozważ zapisywanie swoich combo tylko z ochroną Pancernik, aby podczas zmiany zestawów w bitwie móc szybko wybrać pożądane ochrony bez konieczności ręcznego usuwania niechcianych, które combo automatycznie założyło.',
                proTip2Label: 'Wskazówka 2:',
                proTip2: 'Uporządkuj swoją listę combo, przeciągając karty combo, aby umieścić najczęściej używane combo na górze dla natychmiastowego dostępu.',
                autoOpenCheckbox: 'Automatycznie otwieraj zakładkę Combo po wejściu do hangaru',
                saveCombo: 'ZAPISZ COMBO',
                equipCombo: 'WYPOSAŻ',
                deleteCombo: 'Usuń combo',
                noSavedCombos: 'Brak zapisanych combo',
                clickToSave: 'Kliknij "ZAPISZ COMBO" aby zapisać pierwsze combo!',
                deleteConfirm: 'Czy na pewno chcesz usunąć to combo?'
            }
        },
        pt: {
            code: 'pt',
            name: 'Portuguese',
            garageText: 'GARAGEM',
            equipButtonText: 'equipar',
            tabs: {
                Turrets: 'Torretas',
                Hulls: 'Carrocerias',
                Grenades: 'Granadas',
                Drones: 'Drone',
                Protection: 'Proteção',
                Supplies: 'Suprimentos',
                Paints: 'Pintura'
            },
            ui: {
                comboManager: 'Gerenciador de Combos',
                specialExtension: 'Extensão Especial',
                description: 'Simplifique sua experiência na garagem salvando instantaneamente sua configuração de equipamento atual e equipando seus combos favoritos com um único clique.',
                proTipLabel: 'Dica:',
                proTip1: 'Considere salvar seus combos apenas com proteção Armadillo, para que ao trocar configurações em batalha você possa selecionar rapidamente suas proteções desejadas sem precisar remover manualmente as indesejadas que o combo equipou automaticamente.',
                proTip2Label: 'Dica 2:',
                proTip2: 'Organize sua lista de combos arrastando os cartões de combo para colocar seus combos mais usados no topo para acesso instantâneo.',
                autoOpenCheckbox: 'Abrir aba Combos automaticamente ao entrar na garagem',
                saveCombo: 'SALVAR COMBO',
                equipCombo: 'EQUIPAR',
                deleteCombo: 'Excluir combo',
                noSavedCombos: 'Nenhum combo salvo ainda',
                clickToSave: 'Clique em "SALVAR COMBO" para salvar seu primeiro combo!',
                deleteConfirm: 'Tem certeza de que deseja excluir este combo?'
            }
        },
        de: {
            code: 'de',
            name: 'German',
            garageText: 'GARAGE',
            equipButtonText: 'ausstatten',
            tabs: {
                Turrets: 'Waffen',
                Hulls: 'Untersätze',
                Grenades: 'Granaten',
                Drones: 'Drohnen',
                Protection: 'Schutz',
                Supplies: 'Versorgungen',
                Paints: 'Farben'
            },
            ui: {
                comboManager: 'Combo-Manager',
                specialExtension: 'Spezielle Erweiterung',
                description: 'Optimieren Sie Ihr Garagenerlebnis, indem Sie Ihre aktuelle Ausrüstungskonfiguration sofort speichern und Ihre Lieblingscombos mit einem einzigen Klick ausrüsten.',
                proTipLabel: 'Profi-Tipp:',
                proTip1: 'Erwägen Sie, Ihre Combos nur mit Armadillo-Schutz zu speichern, damit Sie im Kampf beim Wechseln der Konfigurationen schnell Ihre gewünschten Schutzmodule auswählen können, ohne die unerwünschten manuell entfernen zu müssen, die das Combo automatisch ausgerüstet hat.',
                proTip2Label: 'Profi-Tipp 2:',
                proTip2: 'Organisieren Sie Ihre Combo-Liste, indem Sie Combo-Karten ziehen, um Ihre am häufigsten verwendeten Combos für sofortigen Zugriff oben zu platzieren.',
                autoOpenCheckbox: 'Combos-Tab automatisch beim Betreten der Garage öffnen',
                saveCombo: 'COMBO SPEICHERN',
                equipCombo: 'AUSSTATTEN',
                deleteCombo: 'Combo löschen',
                noSavedCombos: 'Noch keine Combos gespeichert',
                clickToSave: 'Klicken Sie auf "COMBO SPEICHERN" um Ihr erstes Combo zu speichern!',
                deleteConfirm: 'Sind Sie sicher, dass Sie dieses Combo löschen möchten?'
            }
        },
        fr: {
            code: 'fr',
            name: 'French',
            garageText: 'GARAGE',
            equipButtonText: 'équiper',
            tabs: {
                Turrets: 'Tourelles',
                Hulls: 'Tanks',
                Grenades: 'Grenades',
                Drones: 'Drone',
                Protection: 'Protection',
                Supplies: 'Ravitaillements',
                Paints: 'Peinture'
            },
            ui: {
                comboManager: 'Gestionnaire de Combos',
                specialExtension: 'Extension Spéciale',
                description: 'Simplifiez votre expérience de garage en sauvegardant instantanément votre configuration d\'équipement actuelle et en équipant vos combos préférés en un seul clic.',
                proTipLabel: 'Conseil Pro:',
                proTip1: 'Envisagez de sauvegarder vos combos uniquement avec la protection Armadillo, afin de pouvoir sélectionner rapidement vos protections souhaitées lors du changement de configurations en bataille sans avoir à supprimer manuellement celles indésirables que le combo a automatiquement équipées.',
                proTip2Label: 'Conseil Pro 2:',
                proTip2: 'Organisez votre liste de combos en faisant glisser les cartes de combo pour placer vos combos les plus utilisés en haut pour un accès instantané.',
                autoOpenCheckbox: 'Ouvrir automatiquement l\'onglet Combos en entrant dans le garage',
                saveCombo: 'SAUVEGARDER COMBO',
                equipCombo: 'ÉQUIPER',
                deleteCombo: 'Supprimer combo',
                noSavedCombos: 'Aucun combo sauvegardé',
                clickToSave: 'Cliquez sur "SAUVEGARDER COMBO" pour sauvegarder votre premier combo!',
                deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce combo?'
            }
        },
        ja: {
            code: 'ja',
            name: 'Japanese',
            garageText: 'ガレージ',
            equipButtonText: '装備',
            tabs: {
                Turrets: '砲塔',
                Hulls: '車体',
                Grenades: 'グレネード',
                Drones: 'ドローン',
                Protection: '保護',
                Supplies: '支援物資',
                Paints: '塗装'
            },
            ui: {
                comboManager: 'コンボマネージャー',
                specialExtension: '特別拡張機能',
                description: 'ガレージ体験を効率化し、現在の装備構成を即座に保存し、お気に入りのコンボをワンクリックで装備できます。',
                proTipLabel: 'プロのヒント:',
                proTip1: 'アルマジロ保護のみでコンボを保存することを検討してください。戦闘中に構成を切り替える際、コンボが自動的に装備した不要なものを手動で削除する必要なく、希望の保護を素早く選択できます。',
                proTip2Label: 'プロのヒント2:',
                proTip2: 'コンボカードをドラッグしてコンボリストを整理し、最もよく使用するコンボを上部に配置して即座にアクセスできるようにします。',
                autoOpenCheckbox: 'ガレージに入ったときに自動的にコンボタブを開く',
                saveCombo: 'コンボを保存',
                equipCombo: '装備',
                deleteCombo: 'コンボを削除',
                noSavedCombos: '保存されたコンボはまだありません',
                clickToSave: '「コンボを保存」をクリックして最初のコンボを保存してください！',
                deleteConfirm: 'このコンボを削除してもよろしいですか？'
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

        // קבלת טקסט UI לפי מפתח
        getUIText(key) {
            const lang = this.getCurrentLanguage();
            return lang.ui?.[key] || key;
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