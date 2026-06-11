/* ============================================================
   Neuro Cyberspace — background & interactions
   ============================================================ */
document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   1. Neural network background (canvas)
   ------------------------------------------------------------ */
const canvas = document.querySelector("#neural-canvas");

if (canvas) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let nodes = [];
  let pulses = [];
  let rafId = null;
  let lastTime = 0;

  const LINK_DIST = 150;
  const FRAME_MIN = 1000 / 40; // cap ~40fps

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    initNodes();
  }

  function initNodes() {
    const count = Math.max(26, Math.min(80, Math.floor((width * height) / 26000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 1 + Math.random() * 1.6,
      hue: Math.random() < 0.78 ? "0, 229, 255" : "167, 139, 250",
    }));
    pulses = [];
  }

  function spawnPulse() {
    if (pulses.length > 5 || nodes.length < 2) return;
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    let best = null;
    let bestD = Infinity;
    for (const b of nodes) {
      if (b === a) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bestD && d < LINK_DIST * 1.2) {
        bestD = d;
        best = b;
      }
    }
    if (best) pulses.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.012 });
  }

  function drawEEG(time) {
    const rows = [
      ["rgba(0, 229, 255, 0.14)", 0.8, 16, 0],
      ["rgba(167, 139, 250, 0.1)", 0.88, 12, 2.2],
    ];
    rows.forEach(([stroke, yRatio, amp, phase]) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.6;
      for (let x = -10; x <= width + 10; x += 10) {
        const baseY = height * yRatio;
        const y =
          baseY +
          Math.sin(x * 0.016 + time * 0.0011 + phase) * amp +
          Math.sin(x * 0.041 + time * 0.0007) * (amp * 0.4);
        if (x === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  function drawFrame(time) {
    ctx.clearRect(0, 0, width, height);

    // links
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const o = (1 - d / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(0, 229, 255, ${o})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${n.hue}, 0.5)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // signal pulses (synapse firing)
    for (const p of pulses) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      const fade = Math.sin(p.t * Math.PI);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 7);
      grad.addColorStop(0, `rgba(0, 229, 255, ${0.85 * fade})`);
      grad.addColorStop(1, "rgba(0, 229, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEEG(time);
  }

  function step(time) {
    rafId = requestAnimationFrame(step);
    if (time - lastTime < FRAME_MIN) return;
    lastTime = time;

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = width + 20;
      if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20;
      if (n.y > height + 20) n.y = -20;
    }

    pulses = pulses.filter((p) => {
      p.t += p.speed * 16;
      return p.t < 1;
    });
    if (Math.random() < 0.03) spawnPulse();

    drawFrame(time);
  }

  function start() {
    if (rafId === null && !prefersReducedMotion) rafId = requestAnimationFrame(step);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  resize();
  window.addEventListener("resize", resize);

  if (prefersReducedMotion) {
    drawFrame(0); // single static frame
  } else {
    start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }
}

/* ------------------------------------------------------------
   2. Scroll progress bar
   ------------------------------------------------------------ */
const progressBar = document.querySelector("#scroll-progress-bar");

if (progressBar) {
  let ticking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.width = `${ratio * 100}%`;
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true },
  );
  updateProgress();
}

/* ------------------------------------------------------------
   3. Seamless skill marquee (duplicate track once)
   ------------------------------------------------------------ */
const track = document.querySelector("#ticker-track");

if (track && !prefersReducedMotion) {
  track.innerHTML += track.innerHTML;
}

/* ------------------------------------------------------------
   4. Reveal on scroll (with sibling stagger)
   ------------------------------------------------------------ */
const revealTargets = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && revealTargets.length > 0 && !prefersReducedMotion) {
  const groups = new Map();
  revealTargets.forEach((el) => {
    const parent = el.parentElement;
    const index = groups.get(parent) || 0;
    el.style.transitionDelay = `${Math.min(index, 5) * 90}ms`;
    groups.set(parent, index + 1);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

/* ------------------------------------------------------------
   5. Mobile nav (hamburger)
   ------------------------------------------------------------ */
const header = document.querySelector("#site-header");
const navToggle = document.querySelector("#nav-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (header && navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("nav-open")) {
      header.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    }
  });
}
