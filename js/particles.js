/**
 * Canvas-based particle system with proximity lines and mouse interaction.
 *
 * Renders floating dots that connect when near each other and gently
 * repel from the mouse cursor.
 */

(function () {
  "use strict";

  var canvas = document.getElementById("particles-canvas");
  var ctx = canvas.getContext("2d");

  var PARTICLE_COUNT = 100;
  var MAX_PARTICLES = 220;
  var CONNECTION_DISTANCE = 120;
  var MOUSE_RADIUS = 150;
  var MOUSE_REPEL_FORCE = 0.02;
  var PARTICLE_COLOR = "rgba(180, 180, 220, ";
  var LINE_COLOR = "rgba(140, 140, 200, ";
  var CONSTELLATION_SIZE = 14;
  var CONSTELLATION_RADIUS = 50;

  var particles = [];
  var mouse = { x: -9999, y: -9999 };
  var width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    };
  }

  function createParticleAt(x, y) {
    var angle = Math.random() * Math.PI * 2;
    var distance = Math.random() * CONSTELLATION_RADIUS;
    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1.5 + 0.5,
    };
  }

  function trimParticles() {
    if (particles.length <= MAX_PARTICLES) return;
    particles.splice(0, particles.length - MAX_PARTICLES);
  }

  function spawnConstellation(x, y) {
    for (var i = 0; i < CONSTELLATION_SIZE; i++) {
      particles.push(createParticleAt(x, y));
    }
    trimParticles();
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Mouse repulsion
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * MOUSE_REPEL_FORCE;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Damping
      p.vx *= 0.995;
      p.vy *= 0.995;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE_COLOR + (0.3 + p.r * 0.15) + ")";
      ctx.fill();

      // Draw connections to nearby particles (only forward to avoid duplication)
      for (var j = i + 1; j < particles.length; j++) {
        var p2 = particles[j];
        var ddx = p.x - p2.x;
        var ddy = p.y - p2.y;
        var d = ddx * ddx + ddy * ddy;
        if (d < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
          var alpha = 1 - Math.sqrt(d) / CONNECTION_DISTANCE;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = LINE_COLOR + (alpha * 0.15) + ")";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  // Track mouse globally for particle interaction
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener("mouseleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest("#card-container")) return;
    spawnConstellation(e.clientX, e.clientY);
  });

  window.addEventListener("resize", function () {
    resize();
  });

  init();
  animate();
})();
