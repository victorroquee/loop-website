/* ============================================================
   LOOP — interações
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Header: estado no scroll ---------- */
  const header = document.getElementById("header");
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Ano no footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up dos números ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const formatBR = (n) => n.toLocaleString("pt-BR");

  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute("data-count"));
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    const useLocale = el.hasAttribute("data-locale");
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const val = Math.round(target * eased);
      el.textContent = prefix + (useLocale ? formatBR(val) : val.toLocaleString("pt-BR")) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatBR(target) + suffix;
    };
    requestAnimationFrame(tick);
  };

  if (reduce || !("IntersectionObserver" in window)) {
    counters.forEach((el) => {
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      el.textContent = prefix + formatBR(parseFloat(el.getAttribute("data-count"))) + suffix;
    });
  } else {
    const co = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- Reel: carrega o vídeo só ao clicar (performance) ---------- */
  document.querySelectorAll(".reel").forEach((reel) => {
    const load = () => {
      const url = reel.getAttribute("data-video");
      if (!url) return; // ainda é placeholder, sem vídeo definido
      if (reel.classList.contains("is-playing")) return;
      const media = reel.querySelector(".reel-media");
      let el;
      if (/\.(mp4|webm)(\?|$)/i.test(url)) {
        el = document.createElement("video");
        el.src = url; el.controls = true; el.autoplay = true; el.playsInline = true;
      } else {
        el = document.createElement("iframe");
        el.src = url + (url.includes("?") ? "&" : "?") + "autoplay=1";
        el.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
        el.setAttribute("allowfullscreen", "");
      }
      media.appendChild(el);
      reel.classList.add("is-playing");
    };
    reel.addEventListener("click", load);
    reel.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); load(); }
    });
  });
})();
