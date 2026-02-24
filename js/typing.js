/**
 * Typing animation for the title element.
 *
 * Reveals the title text character by character after the card
 * entrance animation finishes, with a blinking cursor.
 */

(function () {
  "use strict";

  var titleEl = document.querySelector(".title");
  if (!titleEl) return;

  var fullText = titleEl.textContent;
  var charIndex = 0;
  var CHAR_DELAY = 70;
  var ENTRANCE_WAIT = 1100;

  titleEl.textContent = "";
  titleEl.classList.add("typing-cursor");

  setTimeout(function typeChar() {
    if (charIndex < fullText.length) {
      titleEl.textContent += fullText[charIndex];
      charIndex++;
      setTimeout(typeChar, CHAR_DELAY);
    } else {
      setTimeout(function () {
        titleEl.classList.remove("typing-cursor");
      }, 2000);
    }
  }, ENTRANCE_WAIT);
})();
