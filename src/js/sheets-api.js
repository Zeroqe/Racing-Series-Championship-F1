export const LEAGUE_CONFIG = {
  SHEET_ID: '1ER-QEv5aYk0x1dqV8YI4yi02GpcAOiffPIjqbBNjOpA',
  CALENDAR_TAB: 'Calendar',
  SETTINGS_TAB: 'Settings',
  DISCORD_INVITE: 'https://discord.com',
  SERVER_JOIN_URL: 'https://acstuff.ru/s/q:race/online/join?ip=51.77.43.82&httpPort=18814',
  CACHE_TTL_MS: 15 * 1000, // 15 секунд, чтобы правки в таблице применялись почти сразу
};

export const FALLBACK_SETTINGS = {
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

const DEMO_DATA = {
  Drivers_Public: [
    { driver: 'Kovalenko', team: 'Ferrari', penalty: 0, total: 25 },
    { driver: 'Voronov', team: 'Mercedes', penalty: 0, total: 18 },
  ],
  Constructors: [
    { team: 'Ferrari', total: 25 },
    { team: 'Mercedes', total: 18 },
  ],
  Stewards: [],
};

export function isUsingDemoData() {
  return !LEAGUE_CONFIG.SHEET_ID || LEAGUE_CONFIG.SHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
}

export async function fetchSheetTab(tabName) {
  if (isUsingDemoData() && DEMO_DATA[tabName]) {
    return DEMO_DATA[tabName];
  }

  const cacheKey = `rcs_v3_sheet_${tabName}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { timestamp, rows } = JSON.parse(cached);
      if (Date.now() - timestamp < LEAGUE_CONFIG.CACHE_TTL_MS) {
        return rows;
      }
    } catch {
      // Игнорируем битый кэш
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${LEAGUE_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tabName)}`;
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
      const obj = { _cells: [] };
      row.c.forEach((cell, idx) => {
        const val = cell ? (cell.v ?? '') : '';
        obj._cells[idx] = val;
        const key = cols[idx];
        if (key) obj[key] = val;
      });
      return obj;
    })
    .filter((item) => item._cells.some((val) => val !== '' && val !== null));

  sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), rows }));
  return rows;
}

export function normalizeSettings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { ...FALLBACK_SETTINGS };

  // Если gviz не распознал заголовки и вернул строку заголовков первой строкой данных — пропускаем её
  const firstRowCells = (rows[0]?._cells || []).map((v) => String(v || '').trim().toLowerCase());
  const isHeaderRow =
    firstRowCells[0] === 'дата старта' ||
    firstRowCells[1] === 'статус сервера' ||
    firstRowCells[3] === 'ссылка на discord';

  const dataRows = isHeaderRow ? rows.slice(1) : rows;
  const first = dataRows[0];
  if (!first) return { ...FALLBACK_SETTINGS };

  const cells = first._cells || [];
  const pick = (colIndex, ...keys) => {
    for (const k of keys) {
      const val = first[k];
      if (val !== undefined && String(val).trim() !== '') return String(val).trim();
    }
    if (cells[colIndex] !== undefined && String(cells[colIndex]).trim() !== '') {
      return String(cells[colIndex]).trim();
    }
    return '';
  };

  // Поддержка вертикального формата key / value на случай старой схемы
  if (cells.length === 2 && ('key' in first || first[0] === 'next_race_date')) {
    const map = {};
    dataRows.forEach((r) => {
      const k = String(r.key ?? r._cells?.[0] ?? '').trim().toLowerCase();
      if (k) map[k] = String(r.value ?? r._cells?.[1] ?? '').trim();
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

  // Горизонтальная таблица Settings: A(0)..H(7)
  return {
    nextRaceDate: pick(0, 'дата старта', 'next_race_date') || FALLBACK_SETTINGS.nextRaceDate,
    serverStatus: pick(1, 'статус сервера', 'server_status') || FALLBACK_SETTINGS.serverStatus,
    serverSub: pick(2, 'подпись статуса', 'server_sub') || FALLBACK_SETTINGS.serverSub,
    discordLink: pick(3, 'ссылка на discord', 'discord_link') || FALLBACK_SETTINGS.discordLink,
    serverLink: pick(4, 'ссылка на сервер', 'server_link') || FALLBACK_SETTINGS.serverLink,
    tickerText: pick(5, 'бегущая строка', 'ticker_text') || FALLBACK_SETTINGS.tickerText,
    modsText: pick(6, 'моды и сборка', 'mods_text') || FALLBACK_SETTINGS.modsText,
    rulesSummary: pick(7, 'регламент и пит-стопы', 'rules_summary') || FALLBACK_SETTINGS.rulesSummary,
  };
}

export function applyGlobalSettingsToDom(settings) {
  LEAGUE_CONFIG.DISCORD_INVITE = settings.discordLink;
  LEAGUE_CONFIG.SERVER_JOIN_URL = settings.serverLink;

  // 1. Все ссылки на Discord на любой странице
  document.querySelectorAll('a[href*="discord"], .btn--discord').forEach((link) => {
    link.setAttribute('href', settings.discordLink);
  });

  // 2. Все ссылки входа на сервер Assetto Corsa
  document.querySelectorAll('a[href*="acstuff.ru"]').forEach((link) => {
    link.setAttribute('href', settings.serverLink);
  });

  // 3. Бегущая строка на любой странице
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

  // 4. Карточка статуса сервера (GREEN FLAG / RED FLAG / SAFETY CAR / MAINTENANCE)
  document.querySelectorAll('.status-card').forEach((card) => {
    const labelEl = card.querySelector('.status-card__label');
    if (!labelEl) return;
    if (labelEl.textContent.trim().toUpperCase().includes('СТАТУС СЕРВЕРА')) {
      const valEl = card.querySelector('.status-card__value');
      const subEl = card.querySelector('.status-card__sub');
      const flag = settings.serverStatus.trim().toUpperCase();

      if (valEl) {
        valEl.textContent = flag;
        valEl.classList.remove('status-card__value--green', 'status-card__value--accent');
        valEl.classList.add(flag.includes('GREEN') ? 'status-card__value--green' : 'status-card__value--accent');
      }
      if (subEl && settings.serverSub) {
        subEl.textContent = settings.serverSub;
      }
    }
  });
}

export async function syncGlobalSettings() {
  applyGlobalSettingsToDom(FALLBACK_SETTINGS);
  if (isUsingDemoData()) return FALLBACK_SETTINGS;

  try {
    const rows = await fetchSheetTab(LEAGUE_CONFIG.SETTINGS_TAB);
    const settings = normalizeSettings(rows);
    applyGlobalSettingsToDom(settings);
    return settings;
  } catch (err) {
    console.warn('Не удалось загрузить Settings, используются резервные настройки:', err);
    return FALLBACK_SETTINGS;
  }
}