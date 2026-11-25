import "../sass/style.scss";
import {
  LEAGUE_CONFIG,
  FALLBACK_SETTINGS,
  fetchSheetTab,
  normalizeSettings,
  applyGlobalSettingsToDom,
  isUsingDemoData,
} from "./sheets-api.js";

const FALLBACK_RACES_DATA = [
  { round: 'ROUND 01', code: 'AUS', title: 'Гран-при Австралии (дождевая)', circuit: 'Мельбурн', date: '27 ноября (пт, вечер)', status: 'next' },
  { round: 'ROUND 02', code: 'ESP', title: 'Гран-при Испании', circuit: 'Каталунья', date: '28–29 ноября', status: 'upcoming' },
  { round: 'ROUND 03', code: 'CAN', title: 'Гран-при Канады', circuit: 'Монреаль', date: '5–6 декабря', status: 'upcoming' },
  { round: 'ROUND 04', code: 'AUT', title: 'Гран-при Австрии', circuit: 'Шпильберг', date: '12–13 декабря', status: 'upcoming' },
  { round: 'ROUND 05', code: 'GBR', title: 'Гран-при Великобритании', circuit: 'Сильверстоун', date: '19–20 декабря', status: 'upcoming' },
  { round: 'ROUND 06', code: 'GER', title: 'Гран-при Германии', circuit: 'Хоккенхаймринг', date: '26–27 декабря', status: 'upcoming' },
  { round: 'ROUND 07', code: 'BEL', title: 'Гран-при Бельгии', circuit: 'Спа-Франкоршам', date: '9–10 января', status: 'upcoming' },
  { round: 'ROUND 08', code: 'RUS', title: 'Гран-при России', circuit: 'Сочи', date: '16–17 января', status: 'upcoming' },
  { round: 'ROUND 09', code: 'USA', title: 'Гран-при США', circuit: 'Остин (COTA)', date: '23–24 января', status: 'upcoming' },
  { round: 'ROUND 10', code: 'UAE', title: 'Гран-при Абу-Даби', circuit: 'Абу-Даби', date: '30–31 января', status: 'upcoming' },
];

let currentSettings = { ...FALLBACK_SETTINGS };
let racesData = [...FALLBACK_RACES_DATA];
let currentFilter = 'all';
let countdownIntervalId = null;

const calendarGrid = document.getElementById('calendarGrid');
const filterButtons = document.querySelectorAll('#calendarFilters .filter-btn');

function normalizeRaces(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .filter((r) => r.title || r.circuit)
    .map((r, idx) => {
      const rawStatus = String(r.status || 'upcoming').trim().toLowerCase();
      const status =
        rawStatus === 'next' || rawStatus === 'finished' || rawStatus === 'upcoming'
          ? rawStatus
          : 'upcoming';

      return {
        round: String(r.round || `ROUND ${String(idx + 1).padStart(2, '0')}`).trim(),
        code: String(r.code || '').trim().toUpperCase(),
        title: String(r.title || '').trim(),
        circuit: String(r.circuit || '').trim(),
        date: String(r.date || '').trim(),
        status,
      };
    });
}

function applyIndexDetails(settings) {
  currentSettings = settings;
  applyGlobalSettingsToDom(settings);

  const nextRace = racesData.find((r) => r.status === 'next') || racesData[0];
  const countdownSub = document.querySelector('#raceCountdown')?.parentElement?.querySelector('.status-card__sub');
  if (countdownSub && nextRace) {
    countdownSub.textContent = `${nextRace.round} · ${nextRace.circuit} (${nextRace.date})`;
  }

  const nextRaceTitle = document.querySelector('.next-race-card__title');
  const nextRaceMeta = document.querySelector('.next-race-card__meta');
  const nextRaceDate = document.querySelector('.next-race-card__date');
  if (nextRace && nextRaceTitle) {
    nextRaceTitle.textContent = `${nextRace.title} · ${nextRace.circuit}`;
  }
  if (nextRace && nextRaceMeta) {
    nextRaceMeta.textContent = `${nextRace.round} · ${settings.modsText}`;
  }
  if (nextRace && nextRaceDate) {
    nextRaceDate.textContent = nextRace.date;
  }

  document.querySelectorAll('.next-race-card__specs > div').forEach((row) => {
    const label = (row.querySelector('span')?.textContent || '').toLowerCase();
    const strong = row.querySelector('strong');
    if (!strong) return;
    if (label.includes('болид')) {
      strong.textContent = settings.modsText;
    } else if (label.includes('пит') || label.includes('топлив') || label.includes('реглам')) {
      strong.textContent = settings.rulesSummary;
    }
  });
}

function renderCalendar(filter = currentFilter) {
  if (!calendarGrid) return;
  currentFilter = filter;

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

function updateCountdown() {
  const el = document.getElementById('raceCountdown');
  if (!el) return;

  const parsedTarget = Date.parse(currentSettings.nextRaceDate);
  const targetDate = Number.isNaN(parsedTarget)
    ? new Date(FALLBACK_SETTINGS.nextRaceDate).getTime()
    : parsedTarget;

  const diff = targetDate - Date.now();
  if (diff <= 0) {
    el.textContent = 'LIVE NOW';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  el.textContent = `${String(days).padStart(2, '0')}д ${String(hours).padStart(2, '0')}ч ${String(mins).padStart(2, '0')}м`;
}

async function initLeagueFromSheet() {
  renderCalendar(currentFilter);
  applyIndexDetails(currentSettings);
  updateCountdown();

  if (countdownIntervalId) clearInterval(countdownIntervalId);
  countdownIntervalId = setInterval(updateCountdown, 60000);

  if (isUsingDemoData()) return;

  try {
    const [calendarRows, settingsRows] = await Promise.all([
      fetchSheetTab(LEAGUE_CONFIG.CALENDAR_TAB).catch(() => []),
      fetchSheetTab(LEAGUE_CONFIG.SETTINGS_TAB).catch(() => []),
    ]);

    const normalizedRaces = normalizeRaces(calendarRows);
    if (normalizedRaces.length > 0) {
      racesData = normalizedRaces;
      renderCalendar(currentFilter);
    }

    const normalizedSettings = normalizeSettings(settingsRows);
    applyIndexDetails(normalizedSettings);
    updateCountdown();
  } catch (err) {
    console.warn('Ошибка синхронизации с таблицей:', err);
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderCalendar(btn.dataset.filter);
  });
});

initLeagueFromSheet();

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