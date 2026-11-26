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

  // Превращаем обычную ссылку Google Диска в прямую ссылку на изображение
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

  // Защита: если Google gviz вернул лист Settings, не рисуем его как карточки
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

function renderCards(container, list) {
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div class="standings-empty">В этом сезоне карточек пока нет.</div>';
    return;
  }

  container.innerHTML = list
    .map((p) => {
      const hasTitle = p.titles > 0 || Boolean(p.titleNote);
      const badgeText = p.titleNote || (p.titles > 0 ? `×${p.titles} CHAMPION` : '');

      return `
        <article class="hof-card ${hasTitle ? 'is-champion' : ''}">
          <div class="hof-card__poster">
            <span class="hof-card__season">SEASON ${p.season}</span>
            ${hasTitle ? `<span class="hof-card__crown">🏆 ${badgeText}</span>` : ''}
            <img src="${resolveCardImage(p.image)}" alt="${p.driver}" loading="lazy" />
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