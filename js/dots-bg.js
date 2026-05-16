/**
 * Rising dots background animation
 */
(function () {
  "use strict";
  const canvas = document.getElementById("dots-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let dots = [];
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.floor((w * h) / 12000);
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.2,
      speed: 0.25 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 0.3,
    }));
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const theme = document.documentElement.getAttribute("data-theme");
    ctx.fillStyle =
      theme === "dark" || theme === "midnight"
        ? "rgba(255,255,255,0.06)"
        : "rgba(20,20,20,0.07)";
    dots.forEach((d) => {
      d.y -= d.speed;
      d.x += d.drift;
      if (d.y < -8) {
        d.y = h + 8;
        d.x = Math.random() * w;
      }
      if (d.x < 0) d.x = w;
      if (d.x > w) d.x = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  loop();
})();
