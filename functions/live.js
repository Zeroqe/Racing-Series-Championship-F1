const AC_SERVER_BASE = 'http://51.77.43.82:18814';

const SESSION_NAMES = {
  0: 'BOOKING',
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
  const m = carModel.toLowerCase();
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

async function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet() {
  const [info, timings] = await Promise.all([
    fetchWithTimeout(`${AC_SERVER_BASE}/INFO`),
    fetchWithTimeout(`${AC_SERVER_BASE}/api/live-timings`),
  ]);

  if (!info && !timings) {
    return new Response(
      JSON.stringify({
        online: false,
        serverName: 'RCS F1 Server',
        trackRaw: '',
        sessionType: 'OFFLINE',
        clients: 0,
        maxClients: 20,
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

  // Разбираем список пилотов, если ACSM отдаёт live-timings
  const rawCars =
    timings?.ConnectedDrivers ||
    timings?.Cars ||
    timings?.drivers ||
    [];

  const drivers = Array.isArray(rawCars)
    ? rawCars
        .filter((c) => c && (c.DriverName || c.CarInfo?.DriverName || c.name))
        .map((c, idx) => {
          const name = c.DriverName || c.CarInfo?.DriverName || c.name || `Driver ${idx + 1}`;
          const model = c.CarModel || c.CarInfo?.CarModel || c.car || '';
          const { team, color } = mapCarToTeam(model);
          const splits = c.LastLapSplits || c.Splits || [];

          return {
            id: `${name.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
            name,
            team,
            color,
            lap: Number(c.LapCount ?? c.Laps ?? 0),
            progress: Number(c.SplinePosition ?? c.NormalizedSplinePosition ?? 0),
            best: formatLapTime(c.BestLap),
            last: formatLapTime(c.LastLap),
            s1: formatSectorTime(splits[0]),
            s2: formatSectorTime(splits[1]),
            s3: formatSectorTime(splits[2]),
            kmh: Math.round(Number(c.SpeedKmh ?? c.TopSpeed ?? 0)),
            tyre: (c.TyreCompound || 'S').slice(0, 1).toUpperCase(),
            inPit: Boolean(c.IsInPit || c.InPitLane),
          };
        })
    : [];

  const payload = {
    online: true,
    serverName: info?.name || 'Racing Series Championship F1',
    trackRaw: info?.track || timings?.Track || '',
    sessionType: SESSION_NAMES[info?.session] || 'PRACTICE',
    clients: Number(info?.clients ?? drivers.length),
    maxClients: Number(info?.maxclients ?? 20),
    drivers,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}