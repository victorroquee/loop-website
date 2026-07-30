/* ============================================================
   LOOP — Globo-grafo interativo (hero)
   Rede de nós numa esfera. Auto-rotação + parallax que segue o
   mouse. Cores da marca (azul #5badf5 → roxo #ba5bf5).
   Discreto: pointer-events:none, pausa fora da tela, respeita
   prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  const canvas = document.getElementById("netGlobe");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- cores da marca ---- */
  const C1 = [91, 173, 245];   // azul
  const C2 = [186, 91, 245];   // roxo
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (t) =>
    "rgb(" + Math.round(lerp(C1[0], C2[0], t)) + "," +
             Math.round(lerp(C1[1], C2[1], t)) + "," +
             Math.round(lerp(C1[2], C2[2], t)) + ")";

  /* ---- pontos numa esfera (fibonacci) ---- */
  const N = 94;
  const pts = [];
  const GR = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = GR * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    pts.push({ x, y, z, t: (x + 1) / 2 });   // t = tom no gradiente
  }

  /* ---- arestas: liga vizinhos próximos (grafo) ---- */
  const edges = [];
  const TH = 0.56;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < TH) edges.push([i, j, d]);
    }
  }

  let W = 0, H = 0, dpr = 1, R = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.37;
  }

  /* ---- rotação: base + alvo (mouse) com easing ---- */
  let yaw = 0.5, pitch = -0.12, tyaw = 0.5, tpitch = -0.12;
  if (!reduce) {
    window.addEventListener("mousemove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tyaw = 0.5 + nx * 1.0;
      tpitch = -0.12 + ny * 0.55;
    }, { passive: true });
  }

  const FOV = 3.2;
  function project(p) {
    const cx = Math.cos(yaw), sx = Math.sin(yaw);
    const x1 = p.x * cx - p.z * sx;
    const z1 = p.x * sx + p.z * cx;
    const cy = Math.cos(pitch), sy = Math.sin(pitch);
    const y1 = p.y * cy - z1 * sy;
    const z2 = p.y * sy + z1 * cy;
    const s = FOV / (FOV - z2);
    return { x: W / 2 + x1 * R * s, y: H / 2 + y1 * R * s, z: z2, s };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // glow central suave
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R * 1.7);
    g.addColorStop(0, "rgba(123,140,240,0.10)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const P = new Array(N);
    for (let i = 0; i < N; i++) P[i] = project(pts[i]);

    // arestas
    ctx.lineWidth = 0.65;
    for (let e = 0; e < edges.length; e++) {
      const [i, j, d] = edges[e];
      const a = P[i], b = P[j];
      const depth = (a.z + b.z) / 2;
      const al = Math.max(0, (depth + 1) / 2) * 0.5 * (1 - (d / TH) * 0.55);
      if (al <= 0.012) continue;
      ctx.strokeStyle = "rgba(120,140,235," + al.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // nós (do fundo pra frente)
    const order = P.map((_, i) => i).sort((i, k) => P[i].z - P[k].z);
    for (let o = 0; o < order.length; o++) {
      const i = order[o], p = P[i];
      const depth = (p.z + 1) / 2;
      const rad = Math.max(0.5, (1.0 + depth * 2.3) * p.s * 0.7);
      ctx.globalAlpha = 0.22 + depth * 0.78;
      ctx.fillStyle = mix(pts[i].t);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let raf = null, running = false;
  function loop() {
    yaw += (tyaw - yaw) * 0.045 + 0.0016;
    pitch += (tpitch - pitch) * 0.045;
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (running || reduce) return; running = true; loop(); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  function init() {
    resize();
    if (reduce) { draw(); return; }         // estático
    start();
  }

  // pausa quando o hero sai da tela (economia de CPU)
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => (en.isIntersecting ? start() : stop()));
    }, { threshold: 0.01 });
    io.observe(canvas);
  }

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); if (reduce) draw(); }, 150);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
