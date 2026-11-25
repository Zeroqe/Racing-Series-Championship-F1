const ACSM_LIVE_JSON_URL = 'https://pl.assettohosting.com:60814/live.json';
const AC_INFO_URL = 'http://51.77.43.82:18814/INFO';

const SESSION_NAMES = {
  0: 'BOOKING / LOBBY',
  1: 'PRACTICE',
  2: 'QUALIFYING',
  3: 'RACE',
};

function mapCarToTeam(carModel = '') {
  const m = String(carModel).toLowerCase();
  if (m.includes('ferrari') || m.includes('sf71')) return { team: 'Scuderia Ferrari', color: '#ef4444' };
  if (m.includes('mercedes') || m.includes('w09')) return { team: 'Mercedes AMG', color: '#14b8a6' };
  if (m.includes('redbull') || m.includes('red_bull') || m.includes('rb14')) return { team: 'Red Bull Racing', color: '#3b82f6' };
  if (m.includes('mclaren') || m.includes('mcl33')) return { team: 'McLaren F1', color: '#f97316' };
  if (m.includes('renault') || m.includes('rs18')) return { team: 'Renault F1', color: '#eab308' };
  if (m.includes('force') || m.includes('vjm11')) return { team: 'Force India', color: '#ec4899' };
  if (m.includes('haas') || m.includes('vf')) return { team: 'Haas F1', color: '#9ca3af' };
  if (m.includes('sauber') || m.includes('c37')) return { team: 'Alfa Romeo Sauber', color: '#dc2626' };
  if (m.includes('toro') || m.includes('str13')) return { team: 'Toro Rosso', color: '#2563eb' };
  if (m.includes('williams') || m.includes('fw41')) return { team: 'Williams Racing', color: '#38bdf8' };
  return { team: 'RCS F1', color: '#ff2a2a' };
}

function cleanTimingValue(val) {
  if (val === undefined || val === null) return '—';
  const s = String(val).trim();
  if (!s || s === '0' || s === '0:00.000' || s === '-' || s === '—') return '—';
  return s;
}

async function fetchJson(url, extraHeaders = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RCSF1-Telemetry/1.0)',
        Accept: 'application/json, text/plain, */*',
        ...extraHeaders,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractActiveDrivers(liveJson) {
  const players = Array.isArray(liveJson?.players) ? liveJson.players : [];

  return players
    .filter((p) => {
      if (!p || typeof p !== 'object' || !p.name) return false;
      const car = p.car || {};
      const isGone = String(car.status || '').toLowerCase() === 'gone';
      const isActive = Boolean(car.onMap) || Boolean(car.moving) || Number(car.speed || 0) > 0;
      return !isGone && isActive;
    })
    .map((p, idx) => {
      const car = p.car || {};
      const name = String(p.name).trim();
      const model = String(car.model || car.modelName || p.model || '');
      const { team, color } = mapCarToTeam(model);
      const sectors = Array.isArray(car.sectors) ? car.sectors : [];

      const rawProg = Number(car.progress ?? 0);
      const progress = Number.isFinite(rawProg) ? (rawProg > 1 ? rawProg / 100 : rawProg) : 0;

      return {
        id: `${name.toLowerCase().replace(/\s+/g, '_')}_${p.id ?? idx}`,
        name,
        team,
        color,
        lap: Number(car.laps ?? 0),
        progress,
        best: cleanTimingValue(car.bestLap),
        last: cleanTimingValue(car.lastLap),
        s1: cleanTimingValue(sectors[0]),
        s2: cleanTimingValue(sectors[1]),
        s3: cleanTimingValue(sectors[2]),
        kmh: Math.round(Number(car.speed ?? 0)),
        tyre: 'W',
        inPit: !Boolean(car.onMap),
      };
    });
}

export async function onRequestGet(context) {
  const cookieHeader = context?.env?.ACSM_COOKIE ? { Cookie: context.env.ACSM_COOKIE } : {};

  const [liveJson, info] = await Promise.all([
    fetchJson(ACSM_LIVE_JSON_URL, cookieHeader),
    fetchJson(AC_INFO_URL),
  ]);

  if (!liveJson && !info) {
    return new Response(
      JSON.stringify({
        online: false,
        serverName: 'RSC F1 2018',
        trackRaw: '',
        sessionType: 'OFFLINE',
        clients: 0,
        maxClients: 19,
        cars: [],
        drivers: [],
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const drivers = extractActiveDrivers(liveJson);
  const rawCars = Array.isArray(info?.cars) ? info.cars : [];
  const leagueCars = rawCars.filter((c) => typeof c === 'string' && c.toLowerCase().includes('f1_'));

  const isOnline = Boolean(liveJson?.online ?? liveJson?.running ?? Boolean(info));
  const sessionRaw = liveJson?.name || liveJson?.type;
  const sessionType = sessionRaw
    ? String(sessionRaw).toUpperCase()
    : (SESSION_NAMES[info?.session] || 'PRACTICE');

  const clients = Number(
    drivers.length > 0
      ? drivers.length
      : (liveJson?.clients ?? info?.clients ?? 0)
  );
  const maxClients = Number(liveJson?.slots ?? info?.maxclients ?? 19);

  const payload = {
    online: isOnline,
    serverName: info?.name || 'RSC F1 2018',
    trackRaw: liveJson?.trackName || liveJson?.track || info?.track || '',
    weatherName: liveJson?.weatherName || '',
    sessionType,
    clients,
    maxClients,
    cars: leagueCars,
    drivers,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}