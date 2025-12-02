// core/scanners/protection_scanner.js
// סורק הגנה - מזהה את 4 מודולי ההגנה המצוידים ואת התמונות שלהם

(function () {
    'use strict';

    const DOM = window.TankiComboManager.DOM;

    window.TankiComboManager.ProtectionScanner = {

        // פונקציה לזיהוי 4 מודולי הגנה מצוידים
        scanProtection() {
            const protections = [];

            // סריקת 4 ההגנות המצוידות
            const mountedResists = document.querySelectorAll(DOM.PROTECTION_MOUNTED_RESIST);

            for (let resist of mountedResists) {
                // חיפוש אייקון התותח בהגנה מצוידת
                const iconImg = resist.querySelector(DOM.PROTECTION_RESISTANCE_ICON);
                if (iconImg && iconImg.src) {
                    // מציאת ההגנה ברשימה על פי התאמת האייקון
                    const protectionData = this.findProtectionByIconUrl(iconImg.src);
                    if (protectionData) {
                        protections.push(protectionData);
                    }
                }
            }

            return protections.length > 0 ? protections : null;
        },

        // פונקציה שמחפשת הגנה ברשימה לפי URL של האייקון
        findProtectionByIconUrl(mountedIconUrl) {
            // מחלצים רק את החלק האחרון של ה-URL (שם הקובץ)
            // לדוגמה: "/play/static/images/Railgun.e2aea740.svg" -> "Railgun.e2aea740.svg"
            const mountedIconFileName = this.extractIconFileName(mountedIconUrl);
            if (!mountedIconFileName) return null;

            // חיפוש כל הפריטים ברשימה
            const items = document.querySelectorAll(DOM.ITEM_LIST_CONTAINER);

            for (let item of items) {
                // חיפוש אייקון התותח ברשימה
                const resistanceIcon = item.querySelector(DOM.PROTECTION_LIST_RESISTANCE_ICON);
                if (resistanceIcon && resistanceIcon.src) {
                    const listIconFileName = this.extractIconFileName(resistanceIcon.src);

                    // השוואת שמות הקבצים
                    if (listIconFileName && listIconFileName === mountedIconFileName) {
                        // מצאנו התאמה! נחלץ את שם ההגנה והתמונה
                        const descriptionDevice = item.querySelector(DOM.ITEM_DESCRIPTION_DEVICE);
                        const nameSpan = descriptionDevice ? descriptionDevice.querySelector('span') : null;

                        if (nameSpan && resistanceIcon && resistanceIcon.src) {
                            const protectionName = nameSpan.innerText.trim().toUpperCase();
                            // התמונה היא האייקון SVG
                            const protectionImage = resistanceIcon.src;

                            return {
                                name: protectionName,
                                image: protectionImage
                            };
                        }
                    }
                }
            }

            return null;
        },

        // פונקציה שמחלצת את שם הקובץ מה-URL
        extractIconFileName(iconUrl) {
            if (!iconUrl) return null;
            // מחלץ את שם הקובץ מה-URL
            // לדוגמה: "/play/static/images/Railgun.e2aea740.svg" -> "Railgun.e2aea740.svg"
            // או: "https://tankionline.com/play/static/images/Railgun.e2aea740.svg" -> "Railgun.e2aea740.svg"
            const match = iconUrl.match(/\/([^\/]+\.svg)$/i);
            if (match && match[1]) {
                return match[1];
            }
            return null;
        }
    };
})();

