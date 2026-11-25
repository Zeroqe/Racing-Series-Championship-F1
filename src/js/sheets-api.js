export const LEAGUE_CONFIG = {
  SHEET_ID: '1ER-QEv5aYk0x1dqV8YI4yi02GpcAOiffPIjqbBNjOpA',
  DISCORD_INVITE: 'https://discord.com',
  CACHE_TTL_MS: 2 * 60 * 1000,
};

const DEMO_DATA = {
  Settings: [
    { key: 'next_race_date', value: '2026-11-29T20:00:00+02:00' },
  ],
  Calendar: [
    { round: 'ROUND 01', code: 'BHR', title: 'Гран-при Бахрейна', circuit: 'Бахрейн', date: '21–22 ноября', status: 'finished' },
    { round: 'ROUND 02', code: 'ESP', title: 'Гран-при Испании', circuit: 'Каталунья', date: '28–29 ноября', status: 'upcoming' },
    { round: 'ROUND 03', code: 'CAN', title: 'Гран-при Канады', circuit: 'Монреаль', date: '5–6 декабря', status: 'upcoming' },
    { round: 'ROUND 04', code: 'AUT', title: 'Гран-при Австрии', circuit: 'Шпильберг', date: '12–13 декабря', status: 'upcoming' },
    { round: 'ROUND 05', code: 'GBR', title: 'Гран-при Великобритании', circuit: 'Сильверстоун', date: '19–20 декабря', status: 'upcoming' },
    { round: 'ROUND 06', code: 'GER', title: 'Гран-при Германии', circuit: 'Хоккенхаймринг', date: '26–27 декабря', status: 'upcoming' },
    { round: 'ROUND 07', code: 'BEL', title: 'Гран-при Бельгии', circuit: 'Спа-Франкоршам', date: '9–10 января', status: 'upcoming' },
    { round: 'ROUND 08', code: 'RUS', title: 'Гран-при России', circuit: 'Сочи', date: '16–17 января', status: 'upcoming' },
    { round: 'ROUND 09', code: 'USA', title: 'Гран-при США', circuit: 'Остин (COTA)', date: '23–24 января', status: 'upcoming' },
    { round: 'ROUND 10', code: 'UAE', title: 'Гран-при Абу-Даби', circuit: 'Абу-Даби', date: '30–31 января', status: 'upcoming' },
  ],
  Drivers_Public: [
    { driver: 'Kovalenko', team: 'Ferrari', penalty: 0, total: 25 },
    { driver: 'Voronov', team: 'Mercedes', penalty: 0, total: 18 },
    { driver: 'Sokolov', team: 'Red Bull', penalty: 0, total: 15 },
    { driver: 'Belov', team: 'McLaren', penalty: 0, total: 12 },
    { driver: 'Morozov', team: 'Renault', penalty: 0, total: 10 },
  ],
  Constructors: [
    { team: 'Ferrari', total: 25 },
    { team: 'Mercedes', total: 18 },
    { team: 'Red Bull', total: 15 },
    { team: 'McLaren', total: 12 },
    { team: 'Renault', total: 10 },
  ],
  Stewards: [
    {
      round: 'Round 01 · Бахрейн',
      driver: 'Morozov',
      reason: 'Пункт 2 — Нарушение границ трассы (4 колеса за белой линией)',
      verdict: '+5 СЕК',
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

  const cacheKey = `rcs_v2_sheet_${tabName}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { timestamp, rows } = JSON.parse(cached);
    if (Date.now() - timestamp < LEAGUE_CONFIG.CACHE_TTL_MS) {
      return rows;
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${LEAGUE_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tabName)}`;
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

export async function getLeagueData() {
  const [settingsRows, calendar, standings] = await Promise.all([
    fetchSheetTab('Settings'),
    fetchSheetTab('Calendar'),
    fetchSheetTab('Drivers_Public'),
  ]);

  const settings = {};
  settingsRows.forEach((row) => {
    if (row.key) settings[row.key] = row.value;
  });

  return { settings, calendar, standings };
}