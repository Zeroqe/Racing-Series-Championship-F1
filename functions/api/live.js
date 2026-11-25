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

function normalizeDrivers(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const name = item.name || item.DriverName || item.driver;
      if (!name) return false;
      const car = item.car && typeof item.car === 'object' ? item.car : item;
      if (String(car.status || '').toLowerCase() === 'gone') return false;
      if (item.active === false || item.connected === false) return false;
      if ('onMap' in car || 'speed' in car || 'moving' in car) {
        return Boolean(car.onMap) || Boolean(car.moving) || Number(car.speed || 0) > 0;
      }
      return true;
    })
    .map((item, idx) => {
      const car = item.car && typeof item.car === 'object' ? item.car : item;
      const name = String(item.name || item.DriverName || item.driver).trim();
      const model = String(car.model || car.modelName || item.model || item.carModel || '');
      const { team, color } = mapCarToTeam(model);
      const sectors = Array.isArray(car.sectors) ? car.sectors : [item.s1, item.s2, item.s3];

      const rawProg = Number(car.progress ?? item.progress ?? item.spline ?? 0);
      const progress = Number.isFinite(rawProg) ? (rawProg > 1 ? rawProg / 100 : rawProg) : 0;
      const speed = Math.round(Number(car.speed ?? item.kmh ?? item.speedKmh ?? 0));

      return {
        id: `${name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '_')}_${item.id ?? idx}`,
        name,
        team,
        color,
        lap: Number(car.laps ?? item.lap ?? 0),
        progress,
        best: cleanTimingValue(car.bestLap ?? item.best),
        last: cleanTimingValue(car.lastLap ?? item.last),
        s1: cleanTimingValue(sectors[0]),
        s2: cleanTimingValue(sectors[1]),
        s3: cleanTimingValue(sectors[2]),
        kmh: speed,
        tyre: String(item.tyre ?? car.tyre ?? 'S').slice(0, 1).toUpperCase(),
        inPit: Boolean(item.inPit ?? car.inPit ?? (car.onMap === false)),
      };
    });
}

async function fetchJsonSafe(url, timeoutMs = 2500) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RCSF1-Autonomous/1.0)',
        Accept: 'application/json',
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const secret = context?.env?.TELEMETRY_SECRET;
  const authHeader = context?.request?.headers?.get('Authorization') || '';
  if (secret && authHeader !== `Bearer ${secret}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const snapshot = {
    updatedAt: Date.now(),
    online: body.online !== false,
    serverName: body.serverName || 'RSC F1 2018',
    trackRaw: body.trackRaw || body.track || '',
    sessionType: String(body.sessionType || body.session || 'PRACTICE').toUpperCase(),
    clients: Number(body.clients ?? (Array.isArray(body.drivers) ? body.drivers.length : 0)),
    maxClients: Number(body.maxClients ?? 19),
    drivers: normalizeDrivers(body.drivers || body.players || []),
  };

  if (context?.env?.LIVE_KV) {
    await context.env.LIVE_KV.put('latest_snapshot', JSON.stringify(snapshot), {
      expirationTtl: 300,
    });
  }

  return jsonResponse({ ok: true, driversCount: snapshot.drivers.length });
}

export async function onRequestGet(context) {
  const feedUrl = context?.env?.TELEMETRY_FEED_URL;
  const kv = context?.env?.LIVE_KV;

  if (kv) {
    const rawKv = await kv.get('latest_snapshot');
    if (rawKv) {
      try {
        const parsed = JSON.parse(rawKv);
        if (Date.now() - Number(parsed.updatedAt || 0) < 20000) {
          return jsonResponse(parsed);
        }
      } catch {
        // Игнорируем битый кэш
      }
    }
  }

  if (feedUrl) {
    const feedData = await fetchJsonSafe(feedUrl, 4000);
    if (feedData) {
      const drivers = normalizeDrivers(feedData.drivers || feedData.players || []);
      const sessionRaw =
        (typeof feedData.session === 'object' && feedData.session !== null
          ? (feedData.session.name || feedData.session.type)
          : feedData.session) || feedData.sessionType;

      return jsonResponse({
        online: Boolean(feedData.online ?? feedData.running ?? true),
        serverName: feedData.serverName || 'RSC F1 2018',
        trackRaw: feedData.trackRaw || feedData.trackName || feedData.track || '',
        sessionType: sessionRaw ? String(sessionRaw).toUpperCase() : 'PRACTICE',
        clients: Number(drivers.length > 0 ? drivers.length : (feedData.clients ?? 0)),
        maxClients: Number(feedData.maxClients ?? feedData.slots ?? 19),
        cars: Array.isArray(feedData.cars) ? feedData.cars : [],
        drivers,
      });
    }
  }

  const info = await fetchJsonSafe(AC_INFO_URL, 2000);
  if (info) {
    const rawCars = Array.isArray(info.cars) ? info.cars : [];
    const leagueCars = rawCars.filter((c) => typeof c === 'string' && c.toLowerCase().includes('f1_'));
    return jsonResponse({
      online: true,
      serverName: info.name || 'RSC F1 2018',
      trackRaw: info.track || '',
      sessionType: SESSION_NAMES[info.session] || 'PRACTICE',
      clients: Number(info.clients ?? 0),
      maxClients: Number(info.maxclients ?? 19),
      cars: leagueCars,
      drivers: [],
    });
  }

  return jsonResponse({
    online: false,
    serverName: 'RSC F1 2018',
    trackRaw: '',
    sessionType: 'STANDBY',
    clients: 0,
    maxClients: 19,
    cars: [],
    drivers: [],
  });
}