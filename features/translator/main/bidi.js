// features/translator/main/bidi.js  [MAIN world]

// המרת טקסט מסדר לוגי לסדר ויזואלי, כי לקנבס של המשחק אין bidi.
// המגבלות (שבירת שורות, עיצוב ערבית): CLAUDE.mds/translator.md

(function () {
    'use strict';
    const NS = (window.__CT = window.__CT || {});

    // כל בלוקי ה-RTL: עברית, ערבית, סורית, תאנה, נ'קו, שומרונית ועוד,
    // כולל צורות התצוגה (presentation forms)
    const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    // אות או ספרה שאינה RTL = תו "חזק" שמאל-לימין (לטינית, קירילית, ספרות...)
    const STRONG_LTR_RE = /[\p{L}\p{N}]/u;
    // סימן צירוף (ניקוד וכד') — נשאר צמוד לתו הבסיס שלו בזמן היפוך
    const MARK_RE = /\p{M}/u;

    // סוגריים "מוראים": מתחלפים בבן-זוגם בתוך ריצה שהתהפכה, כדי שימשיכו
    // לפנות לכיוון הנכון
    const MIRROR = {
        '(': ')', ')': '(', '[': ']', ']': '[',
        '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«'
    };

    // מפרק לאשכולות: תו בסיס + סימני הצירוף שאחריו. for..of עובר לפי
    // נקודות קוד, כך שזוגות surrogate (אימוג'י) לא נשברים בהיפוך.
    function clusters(text) {
        const out = [];
        for (const cp of text) {
            if (out.length && MARK_RE.test(cp)) out[out.length - 1] += cp;
            else out.push(cp);
        }
        return out;
    }

    // סיווג אשכול: R = ימין-לשמאל, L = שמאל-לימין, N = נייטרלי (רווח, פיסוק)
    function classOf(c) {
        if (RTL_RE.test(c)) return 'R';
        if (STRONG_LTR_RE.test(c)) return 'L';
        return 'N';
    }

    // היפוך ריצת RTL, כולל שיקוף סוגריים
    function reverseRun(cs) {
        let out = '';
        for (let i = cs.length - 1; i >= 0; i--) {
            const c = cs[i];
            out += MIRROR[c] || c;
        }
        return out;
    }

    // ההמרה עצמה: סדר לוגי -> סדר ויזואלי. טקסט בלי תווי RTL חוזר כמות
    // שהוא (אותה מחרוזת, ===), אז העלות להודעות רגילות היא בדיקת regex אחת.
    function toVisual(text) {
        if (typeof text !== 'string' || !text || !RTL_RE.test(text)) return text;

        const cs = clusters(text);
        const cls = cs.map(classOf);

        // כיוון הבסיס = כיוון התו החזק הראשון (כמו זיהוי כיוון פסקה ב-UBA)
        let base = 'R';
        for (let i = 0; i < cls.length; i++) {
            if (cls[i] !== 'N') { base = cls[i]; break; }
        }

        // נייטרלים: רצף נייטרלי בין שתי ריצות מאותו כיוון מקבל את כיוונן;
        // בכל מקרה אחר (גבול בין כיוונים / קצה הטקסט) — את כיוון הבסיס
        let prev = base;
        for (let i = 0; i < cls.length; i++) {
            if (cls[i] !== 'N') { prev = cls[i]; continue; }
            let j = i;
            while (j < cls.length && cls[j] === 'N') j++;
            const next = j < cls.length ? cls[j] : base;
            const dir = prev === next ? prev : base;
            for (let k = i; k < j; k++) cls[k] = dir;
            i = j - 1;
        }

        // איחוד לריצות רצופות מאותו כיוון
        const runs = [];
        for (let i = 0; i < cs.length; i++) {
            if (runs.length && runs[runs.length - 1].dir === cls[i]) {
                runs[runs.length - 1].cs.push(cs[i]);
            } else {
                runs.push({ dir: cls[i], cs: [cs[i]] });
            }
        }

        // פלט ויזואלי: בבסיס RTL סדר הריצות מתהפך; ריצות R מתהפכות
        // פנימית, ריצות L נשארות כסדרן
        if (base === 'R') runs.reverse();
        let out = '';
        for (const r of runs) out += r.dir === 'R' ? reverseRun(r.cs) : r.cs.join('');
        return out;
    }

    NS.bidi = {
        toVisual,
        hasRtl: function (t) { return typeof t === 'string' && RTL_RE.test(t); }
    };
})();
