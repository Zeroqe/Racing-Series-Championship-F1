import "../sass/style.scss";

export const LEAGUE_CONFIG = {
  // Вставь сюда ID таблицы из адресной строки (между /d/ и /edit)
  SHEET_ID: '1ER-QEv5aYk0x1dqV8YI4yi02GpcAOiffPIjqbBNjOpA',
  CALENDAR_TAB: 'Calendar',
  SETTINGS_TAB: 'Settings',
  DISCORD_INVITE: 'https://discord.com',
  SERVER_JOIN_URL: 'https://acstuff.ru/s/q:race/online/join?ip=51.77.43.82&httpPort=18814',
  CACHE_TTL_MS: 2 * 60 * 1000, // кэш на 2 минуты
};

const FALLBACK_SETTINGS = {
  nextRaceDate: '2026-11-27T20:00:00+02:00',
  serverStatus: 'GREEN FLAG',
  serverSub: 'Тренировочный сервер открыт',
  discordLink: 'https://discord.com',
  serverLink: 'https://acstuff.ru/s/q:race/online/join?ip=51.77.43.82&httpPort=18814',
  tickerText:
    'Racing Series Championship F1 • Сервер: RSC F1 2018 (Melbourne) • Этап 1: дождевая Австралия (пт вечер) • Этап 2: Каталунья',
  modsText: 'SuzQ F1 2018 (S2) / CSP 0.3.2-preview2 / Sol 2.2.9',
  rulesSummary: '~50 кругов · В дождь 2 типа шин не обязательны, пит-стоп обязателен · Без дозаправок · 20 болидов',
};

const FALLBACK_RACES_DATA = [
  {
    round: 'ROUND 01',
    code: 'AUS',
    title: 'Гран-при Австралии (дождевая)',
    circuit: 'Мельбурн',
    date: '27 ноября (пт, вечер)',
    status: 'next',
  },
  {
    round: 'ROUND 02',
    code: 'ESP',
    title: 'Гран-при Испании',
    circuit: 'Каталунья',
    date: '28–29 ноября',
    status: 'upcoming',
  },
  {
    round: 'ROUND 03',
    code: 'CAN',
    title: 'Гран-при Канады',
    circuit: 'Монреаль',
    date: '5–6 декабря',
    status: 'upcoming',
  },
  {
    round: 'ROUND 04',
    code: 'AUT',
    title: 'Гран-при Австрии',
    circuit: 'Шпильберг',
    date: '12–13 декабря',
    status: 'upcoming',
  },
  {
    round: 'ROUND 05',
    code: 'GBR',
    title: 'Гран-при Великобритании',
    circuit: 'Сильверстоун',
    date: '19–20 декабря',
    status: 'upcoming',
  },
  {
    round: 'ROUND 06',
    code: 'GER',
    title: 'Гран-при Германии',
    circuit: 'Хоккенхаймринг',
    date: '26–27 декабря',
    status: 'upcoming',
  },
  {
    round: 'ROUND 07',
    code: 'BEL',
    title: 'Гран-при Бельгии',
    circuit: 'Спа-Франкоршам',
    date: '9–10 января',
    status: 'upcoming',
  },
  {
    round: 'ROUND 08',
    code: 'RUS',
    title: 'Гран-при России',
    circuit: 'Сочи',
    date: '16–17 января',
    status: 'upcoming',
  },
  {
    round: 'ROUND 09',
    code: 'USA',
    title: 'Гран-при США',
    circuit: 'Остин (COTA)',
    date: '23–24 января',
    status: 'upcoming',
  },
  {
    round: 'ROUND 10',
    code: 'UAE',
    title: 'Гран-при Абу-Даби',
    circuit: 'Абу-Даби',
    date: '30–31 января',
    status: 'upcoming',
  },
];

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
      round: 'ROUND 02 • Каталунья',
      driver: 'Nikita Morozov',
      reason: 'Пункт 4.2 — Выдавливание соперника за пределы трассы',
      verdict: '+5 СЕК / -5 ОЧКОВ',
    },
    {
      round: 'ROUND 01 • Мельбурн',
      driver: 'Dmitry Sokolov',
      reason: 'Пункт 3.1 — Срезка трассы с получением преимущества',
      verdict: '-2 ОЧКА',
    },
  ],
};

let currentSettings = { ...FALLBACK_SETTINGS };
let racesData = [...FALLBACK_RACES_DATA];
let currentFilter = 'all';
let countdownIntervalId = null;

const calendarGrid = document.getElementById('calendarGrid');
const filterButtons = document.querySelectorAll('#calendarFilters .filter-btn');

export function isUsingDemoData() {
  return !LEAGUE_CONFIG.SHEET_ID || LEAGUE_CONFIG.SHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
}

export async function fetchSheetTab(tabName) {
  if (isUsingDemoData() && DEMO_DATA[tabName]) {
    return DEMO_DATA[tabName];
  }

  const cacheKey = `rcs_sheet_${tabName}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { timestamp, rows } = JSON.parse(cached);
      if (Date.now() - timestamp < LEAGUE_CONFIG.CACHE_TTL_MS) {
        return rows;
      }
    } catch {
      // Игнорируем некорректный кэш
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${LEAGUE_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка загрузки вкладки ${tabName}`);

  const rawText = await res.text();
  const jsonStart = rawText.indexOf('{');
  const jsonEnd = rawText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Некорректный ответ таблицы для вкладки ${tabName}`);
  }

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

function normalizeSettings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { ...FALLBACK_SETTINGS };

  // Поддержка горизонтальной таблицы (строка параметров) и вертикальной key/value
  const first = rows[0] || {};
  const hasHorizontalCols =
    'дата старта' in first ||
    'статус сервера' in first ||
    'ссылка на discord' in first ||
    'бегущая строка' in first ||
    'next_race_date' in first;

  if (hasHorizontalCols) {
    const pick = (...keys) => {
      for (const k of keys) {
        const val = first[k];
        if (val !== undefined && String(val).trim() !== '') return String(val).trim();
      }
      return '';
    };

    return {
      nextRaceDate: pick('дата старта', 'next_race_date') || FALLBACK_SETTINGS.nextRaceDate,
      serverStatus: pick('статус сервера', 'server_status') || FALLBACK_SETTINGS.serverStatus,
      serverSub: pick('подпись статуса', 'server_sub') || FALLBACK_SETTINGS.serverSub,
      discordLink: pick('ссылка на discord', 'discord_link') || FALLBACK_SETTINGS.discordLink,
      serverLink: pick('ссылка на сервер', 'server_link') || FALLBACK_SETTINGS.serverLink,
      tickerText: pick('бегущая строка', 'ticker_text') || FALLBACK_SETTINGS.tickerText,
      modsText: pick('моды и сборка', 'mods_text') || FALLBACK_SETTINGS.modsText,
      rulesSummary: pick('регламент и пит-стопы', 'rules_summary') || FALLBACK_SETTINGS.rulesSummary,
    };
  }

  const map = {};
  rows.forEach((r) => {
    const k = String(r.key || '').trim().toLowerCase();
    if (k) map[k] = String(r.value ?? '').trim();
  });

  return {
    nextRaceDate: map.next_race_date || FALLBACK_SETTINGS.nextRaceDate,
    serverStatus: map.server_status || FALLBACK_SETTINGS.serverStatus,
    serverSub: map.server_sub || FALLBACK_SETTINGS.serverSub,
    discordLink: map.discord_link || FALLBACK_SETTINGS.discordLink,
    serverLink: map.server_link || FALLBACK_SETTINGS.serverLink,
    tickerText: map.ticker_text || FALLBACK_SETTINGS.tickerText,
    modsText: map.mods_text || FALLBACK_SETTINGS.modsText,
    rulesSummary: map.rules_summary || FALLBACK_SETTINGS.rulesSummary,
  };
}

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

function applySiteSettings(settings) {
  currentSettings = settings;
  LEAGUE_CONFIG.DISCORD_INVITE = settings.discordLink;
  LEAGUE_CONFIG.SERVER_JOIN_URL = settings.serverLink;

  // 1. Все ссылки на Discord на странице
  document.querySelectorAll('a[href*="discord"]').forEach((link) => {
    link.setAttribute('href', settings.discordLink);
  });

  // 2. Ссылка прямого входа на сервер (acstuff.ru)
  document.querySelectorAll('a[href*="acstuff.ru"]').forEach((link) => {
    link.setAttribute('href', settings.serverLink);
  });

  // 3. Бегущая строка
  const tickerTrack = document.querySelector('.ticker__track');
  if (tickerTrack && settings.tickerText) {
    const parts = settings.tickerText
      .split('•')
      .map((s) => s.trim())
      .filter(Boolean);
    const items = parts.length > 0 ? parts : [settings.tickerText];
    const singleLoop = items.map((txt) => `<span>${txt}</span>`).join('');
    tickerTrack.innerHTML = singleLoop + singleLoop;
  }

  // 4. Карточка статуса сервера (поддержка GREEN FLAG / RED FLAG / SAFETY CAR / MAINTENANCE)
  const statusCards = document.querySelectorAll('.status-card');
  statusCards.forEach((card) => {
    const labelEl = card.querySelector('.status-card__label');
    if (!labelEl) return;
    const labelText = labelEl.textContent.trim().toUpperCase();
    if (labelText.includes('СТАТУС СЕРВЕРА')) {
      const valEl = card.querySelector('.status-card__value');
      const subEl = card.querySelector('.status-card__sub');
      const normalizedFlag = settings.serverStatus.trim().toUpperCase();

      if (valEl) {
        valEl.textContent = normalizedFlag;
        valEl.classList.remove('status-card__value--green', 'status-card__value--accent');
        if (normalizedFlag.includes('GREEN')) {
          valEl.classList.add('status-card__value--green');
        } else {
          valEl.classList.add('status-card__value--accent');
        }
      }
      if (subEl && settings.serverSub) {
        subEl.textContent = settings.serverSub;
      }
    }
  });

  // 5. Карточка ближайшего этапа и краткие поля модов/регламента
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

  const specRows = document.querySelectorAll('.next-race-card__specs > div');
  specRows.forEach((row) => {
    const label = (row.querySelector('span')?.textContent || '').toLowerCase();
    const strong = row.querySelector('strong');
    if (!strong) return;
    if (label.includes('болит') || label.includes('болид')) {
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
  applySiteSettings(currentSettings);
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
    applySiteSettings(normalizedSettings);
    updateCountdown();
  } catch (err) {
    console.warn('Не удалось синхронизировать данные из таблицы, используются резервные значения:', err);
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

// Мобильное меню
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