/**
 * Holographic sheen, specular highlight, and prismatic edge glow.
 *
 * Listens for the custom "cardtilt" event dispatched by card.js and
 * updates gradient positions, specular spot, and edge hue in sync.
 */

(function () {
  "use strict";

  var holoOverlays = document.querySelectorAll(".holo-overlay");
  var specularHighlights = document.querySelectorAll(".specular-highlight");
  var edgeGlow = document.querySelector(".card-edge-glow");

  window.addEventListener("cardtilt", function (e) {
    var x = e.detail.x;
    var y = e.detail.y;

    holoOverlays.forEach(function (overlay) {
      overlay.style.backgroundPosition = (x * 100) + "% " + (y * 100) + "%";
    });

    specularHighlights.forEach(function (hl) {
      hl.style.background =
        "radial-gradient(circle at " +
        (x * 100) + "% " + (y * 100) +
        "%, rgba(255,255,255,0.2) 0%, transparent 55%)";
    });

    if (edgeGlow) {
      edgeGlow.style.setProperty("--edge-hue", ((x - 0.5) * 360) + "deg");
    }
  });
})();
