document.getElementById('year').textContent = new Date().getFullYear();

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