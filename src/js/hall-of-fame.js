import '../sass/style.scss';
import { fetchSheetTab, LEAGUE_CONFIG, syncGlobalSettings } from './sheets-api.js';

const FALLBACK_HOF = [
  {
    season: '2018',
    driver: 'Kimi Raikkonen',
    team: 'Scuderia Ferrari',
    number: '7',
    image: 'raikkonen.jpg',
    wins: 1,
    podiums: 3,
    poles: 0,
    titles: 0,
    titleNote: '',
    order: 1,
  },
  {
    season: '2018',
    driver: 'Valtteri Bottas',
    team: 'Mercedes-AMG',
    number: '77',
    image: 'bottas.jpg',
    wins: 0,
    podiums: 1,
    poles: 0,
    titles: 0,
    titleNote: '',
    order: 2,
  },
  {
    season: '2018',
    driver: 'Daniel Ricciardo',
    team: 'Red Bull Racing',
    number: '3',
    image: 'ricciardo.jpg',
    wins: 1,
    podiums: 2,
    poles: 1,
    titles: 0,
    titleNote: '',
    order: 3,
  },
  {
    season: '2012',
    driver: 'Lewis Hamilton',
    team: 'Mercedes-AMG',
    number: '44',
    image: 'hamilton.jpg',
    wins: 6,
    podiums: 12,
    poles: 3,
    titles: 1,
    titleNote: 'Чемпион 2012',
    order: 1,
  },
];

function resolveCardImage(img) {
  const val = String(img || '').trim();
  if (!val) return '/cards/placeholder.jpg';

  if (val.includes('drive.google.com')) {
    const match = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || val.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
    }
  }

  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')) {
    return val;
  }

  return `/cards/${val}`;
}

function normalizeHallOfFame(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const looksLikeSettings = rows.some((r) => {
    const raw = JSON.stringify(r).toLowerCase();
    return (
      raw.includes('green flag') ||
      raw.includes('red flag') ||
      raw.includes('discord.gg') ||
      raw.includes('acstuff.ru')
    );
  });
  if (looksLikeSettings) return [];

  return rows
    .filter((r) => {
      const season = String(r.season ?? r._cells?.[0] ?? '').trim();
      const driver = String(r.driver ?? r._cells?.[1] ?? '').trim();
      return /^(19|20)\d{2}$/.test(season) && Boolean(driver);
    })
    .map((r, idx) => {
      const c = r._cells || [];
      return {
        season: String(r.season ?? c[0] ?? '2018').trim(),
        driver: String(r.driver ?? c[1] ?? '').trim(),
        team: String(r.team ?? c[2] ?? '').trim(),
        number: String(r.number ?? c[3] ?? '').trim(),
        image: String(r.image ?? c[4] ?? '').trim(),
        wins: Number(r.wins ?? c[5] ?? 0) || 0,
        podiums: Number(r.podiums ?? c[6] ?? 0) || 0,
        poles: Number(r.poles ?? c[7] ?? 0) || 0,
        titles: Number(r.titles ?? c[8] ?? 0) || 0,
        titleNote: String(r.title_note ?? c[9] ?? '').trim(),
        order: Number(r.order ?? c[10] ?? idx + 1) || idx + 1,
      };
    })
    .sort((a, b) => Number(b.season) - Number(a.season) || a.order - b.order);
}

function initPosterInspect(container) {
  if (!container) return;

  container.querySelectorAll('.hof-card__poster').forEach((poster) => {
    const card = poster.closest('.hof-card');
    const img = poster.querySelector('img');
    const glare = poster.querySelector('.hof-card__glare');

    poster.addEventListener('mousemove', (e) => {
      const rect = poster.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * 22;
      const rotateX = (0.5 - py) * 22;

      if (card) card.style.zIndex = '5';

      poster.style.transition = 'transform 0.08s ease-out, box-shadow 0.2s ease';
      poster.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.06, 1.06, 1.06)`;
      poster.style.zIndex = '6';

      if (img) {
        img.style.transition = 'transform 0.08s ease-out';
        img.style.transform = `scale(1.08) translate(${((0.5 - px) * 10).toFixed(1)}px, ${((0.5 - py) * 10).toFixed(1)}px)`;
      }

      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.07) 40%, transparent 72%)`;
      }
    });

    poster.addEventListener('mouseleave', () => {
      if (card) card.style.zIndex = '';

      poster.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease';
      poster.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      poster.style.zIndex = '';

      if (img) {
        img.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
        img.style.transform = 'scale(1) translate(0px, 0px)';
      }

      if (glare) {
        glare.style.opacity = '0';
      }
    });
  });
}

function ensureCardModal() {
  let modal = document.getElementById('hofModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'hofModal';
  modal.className = 'hof-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="hof-modal__backdrop" data-close-modal></div>
    <div class="hof-modal__dialog" role="dialog" aria-modal="true">
      <button class="hof-modal__close" type="button" aria-label="Закрыть" data-close-modal>✕</button>
      <div class="hof-modal__stage" id="hofModalStage"></div>
      <p class="hof-modal__hint">Води или зажми мышкой, чтобы осмотреть фотку • ESC — закрыть</p>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeCardModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeCardModal();
    }
  });

  return modal;
}

function closeCardModal() {
  const modal = document.getElementById('hofModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function bindModalPosterInspect(poster) {
  if (!poster) return;
  const glare = poster.querySelector('.hof-card__glare');
  const img = poster.querySelector('img');

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const applyTilt = (rotateX, rotateY, px, py, scale = 1.04) => {
    poster.style.transition = 'transform 0.08s ease-out, box-shadow 0.2s ease';
    poster.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (img) {
      img.style.transition = 'transform 0.08s ease-out';
      img.style.transform = `scale(1.08) translate(${((0.5 - px) * 14).toFixed(1)}px, ${((0.5 - py) * 14).toFixed(1)}px)`;
    }

    if (glare) {
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 74%)`;
    }
  };

  const resetTilt = () => {
    poster.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease';
    poster.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

    if (img) {
      img.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      img.style.transform = 'scale(1) translate(0px, 0px)';
    }

    if (glare) {
      glare.style.opacity = '0';
    }
  };

  poster.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    poster.setPointerCapture?.(e.pointerId);
  });

  poster.addEventListener('pointermove', (e) => {
    const rect = poster.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    if (isDragging) {
      const dx = Math.max(-1, Math.min(1, (e.clientX - startX) / (rect.width * 0.6)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - startY) / (rect.height * 0.6)));
      applyTilt(-dy * 26, dx * 26, px, py, 1.06);
    } else if (e.pointerType === 'mouse') {
      const rotateY = (px - 0.5) * 26;
      const rotateX = (0.5 - py) * 26;
      applyTilt(rotateX, rotateY, px, py, 1.04);
    }
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    resetTilt();
  };

  poster.addEventListener('pointerup', endDrag);
  poster.addEventListener('pointercancel', endDrag);
  poster.addEventListener('mouseleave', () => {
    isDragging = false;
    resetTilt();
  });
}

function openCardModal(p) {
  if (!p) return;
  const modal = ensureCardModal();
  const stage = modal.querySelector('#hofModalStage');
  const hasTitle = p.titles > 0 || Boolean(p.titleNote);
  const badgeText = p.titleNote || (p.titles > 0 ? `×${p.titles} CHAMPION` : '');

  stage.innerHTML = `
    <div class="hof-poster-modal ${hasTitle ? 'is-champion' : ''}">
      <span class="hof-card__season">SEASON ${p.season}</span>
      ${hasTitle ? `<span class="hof-card__crown">🏆 ${badgeText}</span>` : ''}
      <img src="${resolveCardImage(p.image)}" alt="${p.driver}" />
      <span class="hof-card__glare"></span>
    </div>
  `;

  bindModalPosterInspect(stage.querySelector('.hof-poster-modal'));

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function renderCards(container, list) {
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div class="standings-empty">В этом сезоне карточек пока нет.</div>';
    return;
  }

  container.innerHTML = list
    .map((p, idx) => {
      const hasTitle = p.titles > 0 || Boolean(p.titleNote);
      const badgeText = p.titleNote || (p.titles > 0 ? `×${p.titles} CHAMPION` : '');

      return `
        <article class="hof-card ${hasTitle ? 'is-champion' : ''}" data-card-index="${idx}">
          <div class="hof-card__poster" title="Нажми, чтобы осмотреть фотку">
            <span class="hof-card__season">SEASON ${p.season}</span>
            ${hasTitle ? `<span class="hof-card__crown">🏆 ${badgeText}</span>` : ''}
            <img src="${resolveCardImage(p.image)}" alt="${p.driver}" loading="lazy" />
            <span class="hof-card__glare"></span>
          </div>

          <div class="hof-card__body">
            <div class="hof-card__head">
              <div>
                <h3 class="hof-card__name">${p.driver}</h3>
                <p class="hof-card__team">${p.team}</p>
              </div>
              ${p.number ? `<span class="hof-card__num">#${p.number}</span>` : ''}
            </div>

            <div class="hof-card__stats">
              <div class="hof-stat">
                <strong>${p.wins}</strong>
                <span>WINS</span>
              </div>
              <div class="hof-stat">
                <strong>${p.podiums}</strong>
                <span>PODIUMS</span>
              </div>
              <div class="hof-stat">
                <strong>${p.poles}</strong>
                <span>POLES</span>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  initPosterInspect(container);

  container.querySelectorAll('.hof-card__poster').forEach((posterEl) => {
    posterEl.addEventListener('click', () => {
      const cardEl = posterEl.closest('.hof-card');
      const idx = Number(cardEl?.dataset.cardIndex);
      if (!Number.isNaN(idx) && list[idx]) {
        openCardModal(list[idx]);
      }
    });
  });
}

function buildSeasonFilters(filtersEl, allItems, onSelect) {
  if (!filtersEl) return;

  const seasons = [...new Set(allItems.map((i) => i.season).filter(Boolean))].sort(
    (a, b) => Number(b) - Number(a)
  );

  filtersEl.innerHTML = [
    `<button class="filter-btn is-active" data-season="all">Все сезоны</button>`,
    ...seasons.map((s) => `<button class="filter-btn" data-season="${s}">Сезон ${s}</button>`),
  ].join('');

  filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      onSelect(btn.dataset.season);
    });
  });
}

(async () => {
  syncGlobalSettings();

  document.getElementById('burgerBtn')?.addEventListener('click', () => {
    document.getElementById('mainNav')?.classList.toggle('is-open');
  });

  const gridEl = document.getElementById('hofFullGrid');
  const filtersEl = document.getElementById('hofSeasonFilters');
  if (!gridEl) return;

  let items = [...FALLBACK_HOF];
  try {
    const rows = await fetchSheetTab(LEAGUE_CONFIG.HALL_OF_FAME_TAB || 'HallOfFame');
    const parsed = normalizeHallOfFame(rows);
    if (parsed.length > 0) items = parsed;
  } catch {
    // Используем резервные карточки
  }

  buildSeasonFilters(filtersEl, items, (season) => {
    const filtered = season === 'all' ? items : items.filter((i) => i.season === season);
    renderCards(gridEl, filtered);
  });

  renderCards(gridEl, items);
})();