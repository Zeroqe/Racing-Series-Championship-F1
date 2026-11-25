import "../sass/style.scss";

// 1. Данные календаря чемпионата
const racesData = [
  { round: 'R01', code: 'AU', title: 'Australian Grand Prix', circuit: 'Albert Park Circuit', date: '18 окт · 20:00 EET', status: 'finished' },
  { round: 'R02', code: 'IT', title: 'Emilia Romagna Grand Prix', circuit: 'Autodromo Enzo e Dino Ferrari', date: '25 окт · 20:00 EET', status: 'finished' },
  { round: 'R03', code: 'AT', title: 'Austrian Grand Prix', circuit: 'Red Bull Ring', date: '08 ноя · 20:00 EET', status: 'finished' },
  { round: 'R04', code: 'BR', title: 'São Paulo Grand Prix', circuit: 'Autódromo José Carlos Pace', date: '15 ноя · 20:00 EET', status: 'finished' },
  { round: 'R05', code: 'BE', title: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', date: '29 ноя · 20:00 EET', status: 'next' },
  { round: 'R06', code: 'IT', title: 'Italian Grand Prix', circuit: 'Autodromo Nazionale di Monza', date: '06 дек · 20:00 EET', status: 'upcoming' },
  { round: 'R07', code: 'GB', title: 'British Grand Prix', circuit: 'Silverstone Circuit', date: '13 дек · 20:00 EET', status: 'upcoming' },
  { round: 'R08', code: 'JP', title: 'Japanese Grand Prix', circuit: 'Suzuka International Racing Course', date: '20 дек · 20:00 EET', status: 'upcoming' },
];

const calendarGrid = document.getElementById('calendarGrid');
const filterButtons = document.querySelectorAll('#calendarFilters .filter-btn');

function renderCalendar(filter = 'all') {
  if (!calendarGrid) return;

  const filtered = racesData.filter((race) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return race.status === 'upcoming' || race.status === 'next';
    return race.status === filter;
  });

  calendarGrid.innerHTML = filtered
    .map((race) => {
      const statusClass = race.status === 'next' ? 'is-next' : race.status === 'finished' ? 'is-finished' : '';
      const badge = race.status === 'next' ? 'NEXT' : race.status === 'finished' ? 'DONE' : race.round;

      return `
        <article class="race-card ${statusClass}">
          <div class="race-card__top">
            <span class="race-card__code">${race.code}</span>
            <span class="race-card__round">${badge}</span>
          </div>
          <h3 class="race-card__title">${race.title}</h3>
          <p class="race-card__circuit">${race.circuit}</p>
          <div class="race-card__date">🕒 ${race.date}</div>
        </article>
      `;
    })
    .join('');
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderCalendar(btn.dataset.filter);
  });
});

renderCalendar();

// 2. Живой таймер до ближайшего воскресенья 20:00 EET
function updateCountdown() {
  const el = document.getElementById('raceCountdown');
  if (!el) return;

  const targetDate = new Date('2026-11-29T20:00:00+02:00').getTime();
  const now = Date.now();
  const diff = targetDate - now;

  if (diff <= 0) {
    el.textContent = 'LIVE NOW';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  el.textContent = `${String(days).padStart(2, '0')}д ${String(hours).padStart(2, '0')}ч ${String(mins).padStart(2, '0')}м`;
}

updateCountdown();
setInterval(updateCountdown, 60000);

// 3. Мобильное меню
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');

if (burgerBtn && mainNav) {
  burgerBtn.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mainNav.classList.remove('is-open'));
  });
}

export const LEAGUE_CONFIG = {
  // Вставь сюда ID таблицы из адресной строки (между /d/ и /edit)
  SHEET_ID: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
  DISCORD_INVITE: 'https://discord.gg/your-invite-code',
  CACHE_TTL_MS: 2 * 60 * 1000, // кэш на 2 минуты
};

const DEMO_DATA = {
  Drivers_Public: [
    { driver: 'Alexey Voronov', team: 'Scuderia Rosso', penalty: 0, total: 68 },
    { driver: 'Maxim Kovalenko', team: 'Silver Arrows GP', penalty: 0, total: 54 },
    { driver: 'Dmitry Sokolov', team: 'Papaya Racing', penalty: 2, total: 43 },
    { driver: 'Artem Belov', team: 'Scuderia Rosso', penalty: 0, total: 31 },
    { driver: 'Nikita Morozov', team: 'Apex Motorsport', penalty: 5, total: 19 },
  ],
  Constructors: [
    { team: 'Scuderia Rosso', total: 99 },
    { team: 'Silver Arrows GP', total: 54 },
    { team: 'Papaya Racing', total: 43 },
    { team: 'Apex Motorsport', total: 19 },
  ],
  Stewards: [
    {
      round: 'Round 2 • Barcelona',
      driver: 'Nikita Morozov',
      reason: 'Пункт 4.2 — Выдавливание соперника за пределы трассы в Т1',
      verdict: '+5 СЕК / -5 ОЧКОВ',
    },
    {
      round: 'Round 1 • Melbourne',
      driver: 'Dmitry Sokolov',
      reason: 'Пункт 3.1 — Срезка шиканы с получением преимущества',
      verdict: '-2 ОЧКА',
    },
  ],
};

export function isUsingDemoData() {
  return !LEAGUE_CONFIG.SHEET_ID || LEAGUE_CONFIG.SHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
}

export async function fetchSheetTab(tabName) {
  if (isUsingDemoData()) {
    return DEMO_DATA[tabName] || [];
  }

  const cacheKey = `rcs_sheet_${tabName}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { timestamp, rows } = JSON.parse(cached);
    if (Date.now() - timestamp < LEAGUE_CONFIG.CACHE_TTL_MS) {
      return rows;
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${LEAGUE_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка загрузки вкладки ${tabName}`);

  const rawText = await res.text();
  const jsonStart = rawText.indexOf('{');
  const jsonEnd = rawText.lastIndexOf('}');
  const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));

  const cols = parsed.table.cols.map((c) => (c.label || '').trim().toLowerCase());
  const rows = parsed.table.rows
    .map((row) => {
      const obj = {};
      row.c.forEach((cell, idx) => {
        const key = cols[idx];
        if (!key) return;
        obj[key] = cell ? (cell.v ?? '') : '';
      });
      return obj;
    })
    .filter((item) => Object.values(item).some((val) => val !== ''));

  sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), rows }));
  return rows;
}