const AC_INFO_URL = 'http://51.77.43.82:18814/INFO';
const ACSM_LIVE_JSON_URL = 'https://pl.assettohosting.com:60814/live.json';

const SESSION_NAMES = {
  0: 'BOOKING / LOBBY',
  1: 'PRACTICE',
  2: 'QUALIFYING',
  3: 'RACE',
};

function formatLapTime(ms) {
  if (!ms || ms <= 0 || ms > 3600000) return '—';
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function formatSectorTime(ms) {
  if (!ms || ms <= 0 || ms > 600000) return '—';
  const secs = Math.floor(ms / 1000);
  const millis = Math.floor(ms % 1000);
  return `${secs}.${String(millis).padStart(3, '0')}`;
}

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

async function fetchJson(url, extraHeaders = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RCSF1-Telemetry/1.0)',
        Accept: 'application/json',
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

function extractDrivers(liveJson) {
  if (!liveJson || typeof liveJson !== 'object') return [];

  const candidate =
    liveJson.drivers ||
    liveJson.Drivers ||
    liveJson.cars ||
    liveJson.Cars ||
    liveJson.players ||
    liveJson.Players ||
    liveJson.ConnectedDrivers ||
    [];

  const list = Array.isArray(candidate)
    ? candidate
    : typeof candidate === 'object' && candidate !== null
      ? Object.values(candidate)
      : [];

  return list
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const name = item.name || item.DriverName || item.driver || item.Name || item.CarInfo?.DriverName;
      const connected = item.connected ?? item.Connected ?? item.isConnected ?? true;
      return Boolean(name) && connected !== false;
    })
    .map((item, idx) => {
      const name = String(item.name || item.DriverName || item.driver || item.Name || item.CarInfo?.DriverName || `Driver ${idx + 1}`).trim();
      const model = String(item.car || item.CarModel || item.carModel || item.Model || item.CarInfo?.CarModel || '');
      const { team, color } = mapCarToTeam(model);

      const rawProgress =
        item.progress ??
        item.spline ??
        item.SplinePosition ??
        item.NormalizedSplinePosition ??
        item.NormalisedSplinePosition ??
        item.pos ??
        0;
      const progressNum = Number(rawProgress);
      const progress = Number.isFinite(progressNum)
        ? (progressNum > 1 ? progressNum / 100 : progressNum)
        : 0;

      const splits = item.splits || item.LastLapSplits || item.CurrentLapSplits || item.Splits || [];

      return {
        id: `${name.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
        name,
        team,
        color,
        lap: Number(item.lap ?? item.LapCount ?? item.NumLaps ?? item.Laps ?? 0),
        progress,
        best: typeof item.best === 'string' ? item.best : formatLapTime(item.BestLap ?? item.bestLap),
        last: typeof item.last === 'string' ? item.last : formatLapTime(item.LastLap ?? item.lastLap),
        s1: typeof item.s1 === 'string' ? item.s1 : formatSectorTime(item.S1 ?? splits[0]),
        s2: typeof item.s2 === 'string' ? item.s2 : formatSectorTime(item.S2 ?? splits[1]),
        s3: typeof item.s3 === 'string' ? item.s3 : formatSectorTime(item.S3 ?? splits[2]),
        kmh: Math.round(Number(item.kmh ?? item.speed ?? item.SpeedKmh ?? item.Speed ?? 0)),
        tyre: String(item.tyre ?? item.TyreCompound ?? item.Tyres ?? 'S').slice(0, 1).toUpperCase(),
        inPit: Boolean(item.inPit ?? item.IsInPit ?? item.InPitLane ?? item.InPit ?? false),
      };
    });
}

export async function onRequestGet(context) {
  const cookieHeader = context?.env?.ACSM_COOKIE ? { Cookie: context.env.ACSM_COOKIE } : {};

  const [info, liveJson] = await Promise.all([
    fetchJson(AC_INFO_URL),
    fetchJson(ACSM_LIVE_JSON_URL, cookieHeader),
  ]);

  if (!info && !liveJson) {
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

  const drivers = extractDrivers(liveJson);
  const rawCars = Array.isArray(info?.cars) ? info.cars : [];
  const leagueCars = rawCars.filter((c) => typeof c === 'string' && c.toLowerCase().includes('f1_'));

  const sessionVal = liveJson?.session ?? liveJson?.sessionType ?? info?.session;
  const sessionType =
    typeof sessionVal === 'string'
      ? sessionVal.toUpperCase()
      : SESSION_NAMES[sessionVal] || 'PRACTICE';

  const clients = Number(
    drivers.length > 0
      ? drivers.length
      : (liveJson?.clients ?? liveJson?.playersCount ?? info?.clients ?? 0)
  );
  const maxClients = Number(liveJson?.maxClients ?? liveJson?.maxclients ?? info?.maxclients ?? 19);

  const payload = {
    online: true,
    serverName: liveJson?.serverName || info?.name || 'RSC F1 2018',
    trackRaw: liveJson?.track || info?.track || '',
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