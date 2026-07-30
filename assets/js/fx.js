/* ============================================================
   LOOP — FX (interações premium, inspiradas em BRQ/WeMe)
   - Barra de progresso de scroll
   - Marquees infinitos (clona a track p/ loop perfeito)
   - Vídeo de fundo em loop + fallback de mesh-gradient animado
   - Spotlight que segue o cursor nos cards
   - Botões magnéticos
   Tudo com respeito a prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Scroll progress ---------------- */
  const bar = document.getElementById("scrollProgress");
  if (bar) {
    const upd = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    upd();
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
  }

  /* ---------------- Marquees infinitos ---------------- */
  document.querySelectorAll("[data-marquee]").forEach((m) => {
    const track = m.querySelector(".marquee-track");
    if (!track) return;
    // duplica o conteúdo até cobrir 2x a largura (loop sem emenda)
    const original = Array.from(track.children);
    const dupe = () => original.forEach((el) => {
      const c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      track.appendChild(c);
    });
    dupe();
    // se ainda for estreito, duplica mais uma vez
    if (track.scrollWidth < m.clientWidth * 2) dupe();
    const speed = parseFloat(m.getAttribute("data-speed")) || 34;
    track.style.setProperty("--marquee-dur", speed + "s");
    if (reduce) track.style.animation = "none";
  });

  /* ---------------- Mesh-gradient animado (fundo vivo) ---------------- */
  function mesh(canvas) {
    const ctx = canvas.getContext("2d");
    const COLORS = [[91, 173, 245], [186, 91, 245], [126, 134, 245], [70, 200, 230]];
    let W = 0, H = 0, dpr = 1, blobs = [], raf = null, running = false, tick = 0;
    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = Math.max(W, H);
      blobs = COLORS.map((c, i) => ({
        c,
        ox: (0.2 + 0.2 * i) * W, oy: (i % 2 ? 0.3 : 0.7) * H,
        r: base * (0.42 + i * 0.10),
        a: i * 1.7, sp: 0.0024 + i * 0.0011, amp: 0.18 + i * 0.03,
      }));
    }
    function draw() {
      tick++;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        b.a += b.sp;
        const x = b.ox + Math.cos(b.a) * W * b.amp;
        const y = b.oy + Math.sin(b.a * 0.9) * H * b.amp;
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, "rgba(" + b.c[0] + "," + b.c[1] + "," + b.c[2] + ",0.42)");
        g.addColorStop(1, "rgba(" + b.c[0] + "," + b.c[1] + "," + b.c[2] + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
    function loop() { draw(); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduce) return; running = true; loop(); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    resize();
    draw(); // primeiro quadro (também é o estado estático p/ reduced-motion)
    if ("IntersectionObserver" in window && !reduce) {
      new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())),
        { threshold: 0.01 }).observe(canvas);
    } else start();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(); }, 160); });
  }

  /* ---------------- Cover: vídeo de fundo OU mesh ---------------- */
  document.querySelectorAll(".cover").forEach((cover) => {
    const video = cover.querySelector(".cover-video");
    const canvas = cover.querySelector(".cover-mesh");
    const src = video && video.getAttribute("data-src");
    if (src) {
      video.src = src;
      video.load();
      const onready = () => { cover.classList.add("has-video"); };
      video.addEventListener("loadeddata", onready, { once: true });
      const p = video.play && video.play();
      if (p && p.catch) p.catch(() => {}); // autoplay pode ser bloqueado; mesh continua
    }
    if (canvas) mesh(canvas); // sempre roda (fica de fundo/fallback)
  });

  /* ---------------- Spotlight nos cards ---------------- */
  if (!reduce && window.matchMedia("(hover:hover)").matches) {
    document.querySelectorAll(".svc, .prod, .shot").forEach((card) => {
      card.classList.add("spotlight");
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });

    /* ---------------- Botões magnéticos ---------------- */
    document.querySelectorAll(".magnetic, .btn--lg").forEach((btn) => {
      const strength = 0.25;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * strength).toFixed(1) + "px," + (dy * strength).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }
})();
