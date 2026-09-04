/**
 * Canvas-based particle system with proximity lines and mouse interaction.
 *
 * Renders floating dots that connect when near each other and gently
 * repel from the mouse cursor.
 *
 * Dots and connection lines are accumulated into a small number of Path2D
 * buckets keyed by opacity, so a frame issues a couple of dozen draw calls
 * instead of one per particle plus one per connection.
 */

(function () {
  "use strict";

  var canvas = document.getElementById("particles-canvas");
  var ctx = canvas.getContext("2d");

  var PARTICLE_COUNT = 100;
  var MAX_PARTICLES = 220;
  var CONNECTION_DISTANCE = 120;
  var CONNECTION_DISTANCE_SQ = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
  var MOUSE_RADIUS = 150;
  var MOUSE_REPEL_FORCE = 0.02;
  var PARTICLE_COLOR = "rgba(180, 180, 220, ";
  var LINE_COLOR = "rgba(140, 140, 200, ";
  var CONSTELLATION_SIZE = 14;
  var CONSTELLATION_RADIUS = 50;
  var MIN_RADIUS = 0.5;
  var MAX_RADIUS = 2;
  var BUCKETS = 8;
  var MAX_DPR = 2;
  var TAU = Math.PI * 2;

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // One pre-built colour string per opacity bucket, so the render loop
  // never concatenates a style.
  var lineStyles = [];
  var dotStyles = [];
  for (var b = 0; b < BUCKETS; b++) {
    var t = (b + 0.5) / BUCKETS;
    lineStyles.push(LINE_COLOR + t * 0.15 + ")");
    dotStyles.push(
      PARTICLE_COLOR +
        (0.3 + (MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS)) * 0.15) +
        ")"
    );
  }

  var particles = [];
  var mouse = { x: -9999, y: -9999 };
  var width, height;

  function resize() {
    // Back the canvas at device resolution so dots and hairlines stay sharp
    // on HiDPI screens, then draw in CSS pixels as before.
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    var angle = Math.random() * TAU;
    var distance = Math.random() * CONSTELLATION_RADIUS;
    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1.5 + 0.5,
    };
  }

  // Trim from just past the ambient field rather than from the front, so
  // repeated clicks retire old constellation particles instead of slowly
  // replacing the calm background with fast-moving ones.
  function trimParticles() {
    var excess = particles.length - MAX_PARTICLES;
    if (excess > 0) particles.splice(PARTICLE_COUNT, excess);
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

  function update() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Mouse repulsion
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        var force =
          ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_REPEL_FORCE;
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
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
    }
  }

  function bucketOf(t) {
    var i = (t * BUCKETS) | 0;
    return i < 0 ? 0 : i >= BUCKETS ? BUCKETS - 1 : i;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    var lines = new Array(BUCKETS);
    var dots = new Array(BUCKETS);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      var db = bucketOf((p.r - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS));
      var dot = dots[db] || (dots[db] = new Path2D());
      // moveTo before arc keeps consecutive dots from being joined by a line.
      dot.moveTo(p.x + p.r, p.y);
      dot.arc(p.x, p.y, p.r, 0, TAU);

      // Only look forward, so each pair is considered once.
      for (var j = i + 1; j < particles.length; j++) {
        var p2 = particles[j];
        var ddx = p.x - p2.x;
        var ddy = p.y - p2.y;
        var d = ddx * ddx + ddy * ddy;
        if (d >= CONNECTION_DISTANCE_SQ) continue;

        var lb = bucketOf(1 - Math.sqrt(d) / CONNECTION_DISTANCE);
        var line = lines[lb] || (lines[lb] = new Path2D());
        line.moveTo(p.x, p.y);
        line.lineTo(p2.x, p2.y);
      }
    }

    ctx.lineWidth = 0.5;
    for (var l = 0; l < BUCKETS; l++) {
      if (!lines[l]) continue;
      ctx.strokeStyle = lineStyles[l];
      ctx.stroke(lines[l]);
    }

    for (var k = 0; k < BUCKETS; k++) {
      if (!dots[k]) continue;
      ctx.fillStyle = dotStyles[k];
      ctx.fill(dots[k]);
    }
  }

  function frame() {
    update();
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", function () {
    resize();
    if (reduceMotion) draw();
  });

  init();

  if (reduceMotion) {
    // Static starfield: no loop, no cursor interaction, no click spawns.
    draw();
    return;
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

  frame();
})();
