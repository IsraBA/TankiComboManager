// shared/icons.js

// אייקונים שיותר מפיצ'ר אחד מצייר. מכוילים לאייקוני המשחק.

(function () {
  "use strict";

  window.TankiQoL = window.TankiQoL || {};

  // שני תת-מסלולים שנוגעים בנקודה אחת, עם חלל משולש ביניהם —
  // בדיוק כמו הנגיסה בזרוע של אייקון ה-X של המשחק.
  const CHECK_PATH =
    "M3 11.96L8.46 17.41L11.5 20.45L9.05 24L0 14.96Z" +
    "M8.46 17.41L13.61 17.41L24 2.41L20.51 0Z";

  window.TankiQoL.Icons = {
    CHECK_PATH,

    // הקורא מביא את המחלקות; המידות והצורה זהות בכל מקום
    check(className) {
      return (
        '<svg class="' + (className || "") + '" width="24" height="24"' +
        ' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill-rule="evenodd" clip-rule="evenodd" d="' + CHECK_PATH +
        '" fill="white"></path></svg>'
      );
    },
  };
})();
