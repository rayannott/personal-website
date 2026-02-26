/**
 * 3D Card tilt, flip, and spring-back logic.
 *
 * Click handler is on the container (outside the preserve-3d context)
 * to avoid 3D hit-testing issues. Pointer-events are toggled on each
 * card face so only the currently visible face is interactive.
 */

(function () {
  "use strict";

  var container = document.getElementById("card-container");
  var card = document.getElementById("card");
  var frontFace = document.querySelector(".card-front");
  var backFace = document.querySelector(".card-back");
  var copyEmailBtn = document.querySelector(".copy-email-btn");

  var MAX_TILT = 20;
  var TILT_EASE = 0.08;
  var FLIP_EASE = 0.06;

  var isFlipped = false;
  var hovering = false;
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

  function dispatchCardTilt(x, y, rotX, rotY) {
    window.dispatchEvent(
      new CustomEvent("cardtilt", {
        detail: { x: x, y: y, rotX: rotX, rotY: rotY },
      })
    );
  }

  setFaceInteractivity();
  setupCopyEmail();

  // ── Flip handling on the container (outside 3D context) ──

  container.addEventListener("click", function (e) {
    // If the user clicked a link, let the browser handle it normally
    if (e.target.closest("a")) return;

    isFlipped = !isFlipped;
    targetFlipY = isFlipped ? 180 : 0;
    card.classList.toggle("is-flipped", isFlipped);
    setFaceInteractivity();
    startAnimation();
  });

  // ── Mouse tracking ──────────────────────────

  container.addEventListener("mouseenter", function () {
    hovering = true;
    startAnimation();
  });

  container.addEventListener("mousemove", function (e) {
    var rect = container.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;
    var y = (e.clientY - rect.top) / rect.height;

    targetRotY = (x - 0.5) * MAX_TILT * 2;
    targetRotX = -(y - 0.5) * MAX_TILT * 2;

    dispatchCardTilt(x, y, targetRotX, targetRotY);
  });

  container.addEventListener("mouseleave", function () {
    hovering = false;
    targetRotX = 0;
    targetRotY = 0;
    dispatchCardTilt(0.5, 0.5, 0, 0);
  });

  // ── Touch tracking ─────────────────────────

  container.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = container.getBoundingClientRect();
      var x = (touch.clientX - rect.left) / rect.width;
      var y = (touch.clientY - rect.top) / rect.height;

      targetRotY = (x - 0.5) * MAX_TILT * 2;
      targetRotX = -(y - 0.5) * MAX_TILT * 2;
      hovering = true;
      startAnimation();

      dispatchCardTilt(x, y, targetRotX, targetRotY);
    },
    { passive: false }
  );

  container.addEventListener("touchend", function () {
    hovering = false;
    targetRotX = 0;
    targetRotY = 0;
    dispatchCardTilt(0.5, 0.5, 0, 0);
  });

  // ── Animation loop ─────────────────────────

  function startAnimation() {
    if (rafId) return;
    rafId = requestAnimationFrame(animate);
  }

  function animate() {
    currentRotX += (targetRotX - currentRotX) * TILT_EASE;
    currentRotY += (targetRotY - currentRotY) * TILT_EASE;
    currentFlipY += (targetFlipY - currentFlipY) * FLIP_EASE;

    var totalRotY = currentRotY + currentFlipY;
    card.style.transform =
      "rotateX(" + currentRotX + "deg) rotateY(" + totalRotY + "deg)";

    var tiltSettled =
      Math.abs(currentRotX - targetRotX) < 0.01 &&
      Math.abs(currentRotY - targetRotY) < 0.01;
    var flipSettled = Math.abs(currentFlipY - targetFlipY) < 0.1;

    if (!hovering && tiltSettled && flipSettled) {
      currentRotX = targetRotX;
      currentRotY = targetRotY;
      currentFlipY = targetFlipY;
      card.style.transform =
        "rotateX(" +
        currentRotX +
        "deg) rotateY(" +
        (currentRotY + currentFlipY) +
        "deg)";
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(animate);
  }

  startAnimation();
})();
