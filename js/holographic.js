/**
 * Holographic sheen, specular highlight, and prismatic edge glow.
 *
 * Listens for the custom "cardtilt" event dispatched by card.js and
 * updates gradient positions, specular spot, and edge hue in sync.
 */

(function () {
  "use strict";

  var holoOverlays = document.querySelectorAll(".card-front .holo-overlay");
  var specularHighlights = document.querySelectorAll(".card-front .specular-highlight");
  var edgeGlow = document.querySelector(".card-edge-glow");

  window.addEventListener("cardtilt", function (e) {
    var x = e.detail.x;
    var y = e.detail.y;

    holoOverlays.forEach(function (overlay) {
      var ex = x;
      overlay.style.backgroundPosition = (ex * 100) + "% " + (y * 100) + "%";
    });

    specularHighlights.forEach(function (hl) {
      var ex = x;
      hl.style.background =
        "radial-gradient(circle at " +
        (ex * 100) + "% " + (y * 100) +
        "%, rgba(255,255,255,0.2) 0%, transparent 55%)";
    });

    if (edgeGlow) {
      var angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);
      edgeGlow.style.setProperty("--edge-hue", angle + "deg");
    }
  });
})();
