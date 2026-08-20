// ---------- footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- live timecode readout (decorative, hero) ----------
const tcEl = document.getElementById('liveTimecode');
let frame = 0;
function tick() {
  frame++;
  const totalSeconds = Math.floor(frame / 24);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  const f = String(frame % 24).padStart(2, '0');
  tcEl.textContent = `${h}:${m}:${s}:${f}`;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------- particle simulation (canvas) ----------
// A lightweight ember/spark field drifting behind the hero — a nod to
// FX simulation work (this is literally a tiny particle sim).
(function particleField() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, particles;
  const COLORS = ['rgba(0,194,168,', 'rgba(255,106,61,'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vy: -(Math.random() * 0.35 + 0.08),
      vx: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.5 + 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      flicker: Math.random() * Math.PI * 2
    };
  }

  function init() {
    resize();
    const count = Math.min(90, Math.floor((w * h) / 18000));
    particles = Array.from({ length: count }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y += p.vy;
      p.x += p.vx;
      p.flicker += 0.02;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));

      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + a.toFixed(3) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();

  if (!reduceMotion) {
    requestAnimationFrame(draw);
  } else {
    draw(); // draw one static frame only
  }
})();

// ---------- glitch-scramble hero title on load ----------
(function glitchIntro() {
  const lines = document.querySelectorAll('.hero__title-line');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@01';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !lines.length) return;

  lines.forEach((line, i) => {
    const finalText = line.dataset.text || line.textContent;
    let frameCount = 0;
    const totalFrames = 14;
    const startDelay = i * 120;

    line.classList.add('is-glitching');

    setTimeout(() => {
      const interval = setInterval(() => {
        frameCount++;
        const revealCount = Math.floor((frameCount / totalFrames) * finalText.length);
        let display = '';
        for (let c = 0; c < finalText.length; c++) {
          if (finalText[c] === ' ') { display += ' '; continue; }
          display += c < revealCount
            ? finalText[c]
            : chars[Math.floor(Math.random() * chars.length)];
        }
        line.textContent = display;

        if (frameCount >= totalFrames) {
          clearInterval(interval);
          line.textContent = finalText;
          line.classList.remove('is-glitching');
        }
      }, 45);
    }, startDelay);
  });
})();

// ---------- scroll reveal for sections ----------
(function scrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(t => observer.observe(t));
})();

// ---------- render video grid ----------
const grid = document.getElementById('videoGrid');

function playIcon() {
  return `<svg viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="21" stroke="white" stroke-opacity="0.85"/>
    <path d="M18 15L30 22L18 29V15Z" fill="white"/>
  </svg>`;
}

function renderGrid() {
  const list = (typeof VIDEOS !== 'undefined') ? VIDEOS : [];

  if (!list.length) {
    grid.innerHTML = `<div class="grid__empty">No videos yet — add entries to videos.js to populate your reel.</div>`;
    return;
  }

  grid.innerHTML = list.map((v, i) => `
    <article class="card" tabindex="0" data-index="${i}" aria-label="Play ${v.title}">
      <div class="card__media">
        <img src="${v.thumb || ''}" alt="" loading="lazy"
             onerror="this.style.display='none'">
        <video muted loop playsinline preload="none" data-src="${v.file}"></video>
        <div class="card__scan"></div>
        <div class="card__play">${playIcon()}</div>
      </div>
      <div class="card__info">
        <div class="card__meta">
          <span class="card__category">${v.category || ''}</span>
          <span class="card__year">${v.year || ''}</span>
        </div>
        <h3 class="card__title">${v.title}</h3>
        <p class="card__desc">${v.description || ''}</p>
      </div>
    </article>
  `).join('');

  // hover-to-preview: lazy-load the video src only when needed
  grid.querySelectorAll('.card').forEach(card => {
    const videoEl = card.querySelector('video');
    let loaded = false;

    const loadAndPlay = () => {
      if (!loaded) {
        videoEl.src = videoEl.dataset.src;
        loaded = true;
      }
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
    };
    const stop = () => { videoEl.pause(); };

    card.addEventListener('mouseenter', loadAndPlay);
    card.addEventListener('mouseleave', stop);

    card.addEventListener('click', () => openLightbox(card.dataset.index));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(card.dataset.index);
      }
    });
  });
}

// ---------- lightbox ----------
const lightbox = document.getElementById('lightbox');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(index) {
  const v = VIDEOS[index];
  if (!v) return;
  lightboxVideo.src = v.file;
  lightbox.classList.add('is-open');
  lightboxVideo.play().catch(() => {});
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.load();
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

renderGrid();