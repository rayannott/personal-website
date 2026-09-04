/**
 * 3D Card tilt, flip, and spring-back logic.
 *
 * Click handling lives on the container (outside the preserve-3d context)
 * to avoid 3D hit-testing issues. Pointer-events are toggled on each card
 * face so only the currently visible face is interactive.
 *
 * The normalised pointer position is published as --mx / --my / --edge-hue
 * on the container; the holographic sheen, specular spot and prismatic edge
 * glow are driven from those custom properties entirely in CSS.
 */

(function () {
  "use strict";

  var container = document.getElementById("card-container");
  var card = document.getElementById("card");
  var frontFace = document.querySelector(".card-front");
  var backFace = document.querySelector(".card-back");
  var copyEmailBtn = document.querySelector(".copy-email-btn");

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // With reduced motion the card neither tilts nor eases into the flip.
  var MAX_TILT = reduceMotion ? 0 : 20;
  var TILT_EASE = reduceMotion ? 1 : 0.08;
  var FLIP_EASE = reduceMotion ? 1 : 0.06;

  var isFlipped = false;
  var rafId = null;

  var targetRotX = 0;
  var targetRotY = 0;
  var currentRotX = 0;
  var currentRotY = 0;

  var targetFlipY = 0;
  var currentFlipY = 0;

  function setFaceInteractivity() {
    frontFace.style.pointerEvents = isFlipped ? "none" : "auto";
    backFace.style.pointerEvents = isFlipped ? "auto" : "none";
  }

  function setPointerVars(x, y) {
    var style = container.style;
    style.setProperty("--mx", String(x));
    style.setProperty("--my", String(y));
    style.setProperty(
      "--edge-hue",
      Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + "deg"
    );
  }

  function setupCopyEmail() {
    if (!copyEmailBtn) return;

    copyEmailBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!navigator.clipboard) return;

      var btn = this;
      navigator.clipboard.writeText(btn.dataset.email).then(function () {
        btn.classList.add("copied");
        setTimeout(function () {
          btn.classList.remove("copied");
        }, 1500);
      });
    });
  }

  function toggleFlip() {
    isFlipped = !isFlipped;
    targetFlipY = isFlipped ? 180 : 0;
    card.classList.toggle("is-flipped", isFlipped);
    setFaceInteractivity();

    // The face being hidden goes visibility:hidden, which drops focus to the
    // body. If the flip came from a flip-hint, hand focus to its counterpart
    // on the face now turning towards the viewer.
    var active = document.activeElement;
    if (active && active.classList.contains("flip-hint")) {
      var hint = (isFlipped ? backFace : frontFace).querySelector(".flip-hint");
      if (hint) hint.focus();
    }

    startAnimation();
  }

  // Shared by the mouse and touch paths: both map a viewport point onto the
  // card and spring the tilt towards it.
  function tiltFrom(clientX, clientY) {
    var rect = container.getBoundingClientRect();
    var x = (clientX - rect.left) / rect.width;
    var y = (clientY - rect.top) / rect.height;

    targetRotY = (x - 0.5) * MAX_TILT * 2;
    targetRotX = -(y - 0.5) * MAX_TILT * 2;

    setPointerVars(x, y);
    startAnimation();
  }

  function resetTilt() {
    targetRotX = 0;
    targetRotY = 0;
    setPointerVars(0.5, 0.5);
    startAnimation();
  }

  // ── Input ──────────────────────────────────

  container.addEventListener("click", function (e) {
    // If the user clicked a link, let the browser handle it normally.
    // The flip-hint button's click bubbles here and flips the card.
    if (e.target.closest("a")) return;
    toggleFlip();
  });

  container.addEventListener("mousemove", function (e) {
    tiltFrom(e.clientX, e.clientY);
  });

  container.addEventListener("mouseleave", resetTilt);

  container.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      tiltFrom(touch.clientX, touch.clientY);
    },
    { passive: false }
  );

  container.addEventListener("touchend", resetTilt);

  // ── Animation loop ─────────────────────────

  function startAnimation() {
    if (rafId) return;
    rafId = requestAnimationFrame(animate);
  }

  function render() {
    card.style.transform =
      "rotateX(" +
      currentRotX +
      "deg) rotateY(" +
      (currentRotY + currentFlipY) +
      "deg)";
  }

  function animate() {
    currentRotX += (targetRotX - currentRotX) * TILT_EASE;
    currentRotY += (targetRotY - currentRotY) * TILT_EASE;
    currentFlipY += (targetFlipY - currentFlipY) * FLIP_EASE;

    var settled =
      Math.abs(currentRotX - targetRotX) < 0.01 &&
      Math.abs(currentRotY - targetRotY) < 0.01 &&
      Math.abs(currentFlipY - targetFlipY) < 0.1;

    // Settling releases the loop even while the pointer is still over the
    // card; the next mousemove restarts it.
    if (settled) {
      currentRotX = targetRotX;
      currentRotY = targetRotY;
      currentFlipY = targetFlipY;
      render();
      rafId = null;
      return;
    }

    render();
    rafId = requestAnimationFrame(animate);
  }

  setFaceInteractivity();
  setupCopyEmail();
  setPointerVars(0.5, 0.5);
  render();
})();
