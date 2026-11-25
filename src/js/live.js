import '../sass/style.scss';

const CIRCUITS = {
  'au-1953': {
    name: 'Albert Park Circuit · Melbourne',
    meta: '5,303 км · 16 поворотов · SuzQ F1 2018',
    center: [144.9683, -37.8497],
    zoom: 14.3,
    keywords: ['melbourne', 'albert_park', 'australia'],
  },
  'es-1991': {
    name: 'Circuit de Barcelona-Catalunya',
    meta: '4,657 км · 16 поворотов · SuzQ F1 2018',
    center: [2.2569, 41.5700],
    zoom: 14.5,
    keywords: ['barcelona', 'catalunya', 'spain'],
  },
  'bh-2002': {
    name: 'Bahrain International Circuit',
    meta: '5,412 км · 15 поворотов · SuzQ F1 2018',
    center: [50.5106, 26.0325],
    zoom: 14.4,
    keywords: ['bahrain', 'sakhir'],
  },
  'ca-1978': {
    name: 'Circuit Gilles-Villeneuve',
    meta: '4,361 км · 14 поворотов · SuzQ F1 2018',
    center: [-73.5228, 45.5000],
    zoom: 14.4,
    keywords: ['montreal', 'canada', 'gilles'],
  },
  'at-1969': {
    name: 'Red Bull Ring · Spielberg',
    meta: '4,318 км · 10 поворотов · SuzQ F1 2018',
    center: [14.7647, 47.2197],
    zoom: 14.7,
    keywords: ['red_bull_ring', 'spielberg', 'austria', 'a1'],
  },
  'gb-1948': {
    name: 'Silverstone Circuit',
    meta: '5,891 км · 18 поворотов · SuzQ F1 2018',
    center: [-1.0169, 52.0786],
    zoom: 14.2,
    keywords: ['silverstone', 'britain'],
  },
  'de-1932': {
    name: 'Hockenheimring',
    meta: '4,574 км · 17 поворотов · SuzQ F1 2018',
    center: [8.5658, 49.3278],
    zoom: 14.5,
    keywords: ['hockenheim', 'germany'],
  },
  'be-1925': {
    name: 'Circuit de Spa-Francorchamps',
    meta: '7,004 км · 19 поворотов · SuzQ F1 2018',
    center: [5.9714, 50.4372],
    zoom: 13.7,
    keywords: ['spa', 'francorchamps', 'belgium'],
  },
  'ru-2014': {
    name: 'Sochi Autodrom',
    meta: '5,848 км · 18 поворотов · SuzQ F1 2018',
    center: [39.9578, 43.4057],
    zoom: 14.2,
    keywords: ['sochi', 'russia'],
  },
  'us-2012': {
    name: 'Circuit of the Americas (COTA)',
    meta: '5,513 км · 20 поворотов · SuzQ F1 2018',
    center: [-97.6411, 30.1328],
    zoom: 14.2,
    keywords: ['cota', 'austin', 'americas', 'usa'],
  },
  'ae-2009': {
    name: 'Yas Marina Circuit',
    meta: '5,281 км · 16 поворотов · SuzQ F1 2018',
    center: [54.6031, 24.4672],
    zoom: 14.3,
    keywords: ['yas', 'abu_dhabi', 'marina'],
  },
};

const FALLBACK_MELBOURNE_COORDS = [
  [144.9683, -37.8497], [144.9718, -37.8475], [144.9746, -37.8458], [144.9752, -37.8467],
  [144.9722, -37.8493], [144.9704, -37.8520], [144.9688, -37.8548], [144.9665, -37.8562],
  [144.9642, -37.8549], [144.9628, -37.8525], [144.9645, -37.8505], [144.9668, -37.8502],
  [144.9683, -37.8497],
];

const TYRE_META = {
  WET: { letter: 'W', label: 'Wet', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)', border: '#38bdf8' },
  INTER: { letter: 'I', label: 'Inter', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.16)', border: '#22c55e' },
  SOFT: { letter: 'S', label: 'Soft', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', border: '#ef4444' },
  MEDIUM: { letter: 'M', label: 'Medium', color: '#eab308', bg: 'rgba(234, 179, 8, 0.16)', border: '#eab308' },
  HARD: { letter: 'H', label: 'Hard', color: '#f8fafc', bg: 'rgba(248, 250, 252, 0.14)', border: '#cbd5e1' },
};

function renderTyreBadge(tyreRaw = 'WET') {
  const key = String(tyreRaw || 'WET').trim().toUpperCase();
  const meta = TYRE_META[key] || TYRE_META.WET;

  return `
    <span
      title="${meta.label}"
      style="
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:2px 8px 2px 3px;
        border-radius:999px;
        background:${meta.bg};
        border:1px solid ${meta.border};
        color:${meta.color};
        font-size:11px;
        font-weight:700;
        letter-spacing:0.03em;
        line-height:1.2;
      "
    >
      <span
        style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:18px;
          height:18px;
          border-radius:50%;
          background:#0b0f17;
          border:2px solid ${meta.border};
          color:${meta.color};
          font-size:10px;
          font-weight:800;
        "
      >${meta.letter}</span>
      <span>${key}</span>
    </span>
  `;
}

function getShortCode(driver) {
  if (driver?.code) return String(driver.code).trim().toUpperCase().slice(0, 3);
  const raw = String(driver?.name || '').trim();
  if (!raw) return 'DRV';
  const parts = raw.split(/\s+/);
  const surname = parts[parts.length - 1];
  return surname.slice(0, 3).toUpperCase();
}

const DEMO_BOTS_ENABLED = true;

function createDummyDrivers() {
  const roster = [
    { id: 'bot-ham', code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes AMG Petronas F1 Team', color: '#14b8a6', tyre: 'WET', lap: 14, best: '1:28.910', last: '1:29.540', s1: '29.62', s2: '24.89', s3: '35.03', kmh: 291, inPit: false, pace: 0.000195 },
    { id: 'bot-bot', code: 'BOT', name: 'Valtteri Bottas', team: 'Mercedes AMG Petronas F1 Team', color: '#2dd4bf', tyre: 'WET', lap: 14, best: '1:29.180', last: '1:29.812', s1: '29.75', s2: '24.98', s3: '35.08', kmh: 288, inPit: false, pace: 0.000193 },
    { id: 'bot-vet', code: 'VET', name: 'Sebastian Vettel', team: 'Scuderia Ferrari', color: '#ef4444', tyre: 'WET', lap: 14, best: '1:29.045', last: '1:29.690', s1: '29.68', s2: '24.94', s3: '35.07', kmh: 289, inPit: false, pace: 0.000194 },
    { id: 'bot-rai', code: 'RAI', name: 'Kimi Raikkonen', team: 'Scuderia Ferrari', color: '#f87171', tyre: 'INTER', lap: 14, best: '1:29.320', last: '1:29.985', s1: '29.82', s2: '25.05', s3: '35.11', kmh: 286, inPit: false, pace: 0.000191 },
    { id: 'bot-ver', code: 'VER', name: 'Max Verstappen', team: 'Aston Martin Red Bull Racing', color: '#3b82f6', tyre: 'WET', lap: 14, best: '1:29.112', last: '1:29.744', s1: '29.70', s2: '24.96', s3: '35.08', kmh: 290, inPit: false, pace: 0.000192 },
    { id: 'bot-ric', code: 'RIC', name: 'Daniel Ricciardo', team: 'Aston Martin Red Bull Racing', color: '#60a5fa', tyre: 'INTER', lap: 14, best: '1:29.402', last: '1:30.104', s1: '29.89', s2: '25.09', s3: '35.12', kmh: 285, inPit: false, pace: 0.000190 },
    { id: 'bot-alo', code: 'ALO', name: 'Fernando Alonso', team: 'McLaren F1 Team', color: '#f97316', tyre: 'INTER', lap: 13, best: '1:29.780', last: '1:30.490', s1: '30.04', s2: '25.21', s3: '35.24', kmh: 281, inPit: false, pace: 0.000187 },
    { id: 'bot-van', code: 'VAN', name: 'Stoffel Vandoorne', team: 'McLaren F1 Team', color: '#fb923c', tyre: 'WET', lap: 13, best: '1:30.120', last: '1:30.890', s1: '30.19', s2: '25.34', s3: '35.36', kmh: 277, inPit: false, pace: 0.000184 },
    { id: 'bot-oco', code: 'OCO', name: 'Esteban Ocon', team: 'Sahara Force India F1 Team', color: '#f472b6', tyre: 'WET', lap: 13, best: '1:29.940', last: '1:30.670', s1: '30.10', s2: '25.27', s3: '35.30', kmh: 279, inPit: false, pace: 0.000186 },
    { id: 'bot-per', code: 'PER', name: 'Sergio Perez', team: 'Sahara Force India F1 Team', color: '#ec4899', tyre: 'INTER', lap: 13, best: '1:30.015', last: '1:30.745', s1: '30.12', s2: '25.30', s3: '35.32', kmh: 278, inPit: false, pace: 0.000185 },
    { id: 'bot-hul', code: 'HUL', name: 'Nico Hulkenberg', team: 'Renault Sport F1 Team', color: '#eab308', tyre: 'WET', lap: 13, best: '1:29.865', last: '1:30.580', s1: '30.07', s2: '25.24', s3: '35.27', kmh: 280, inPit: false, pace: 0.000186 },
    { id: 'bot-sai', code: 'SAI', name: 'Carlos Sainz', team: 'Renault Sport F1 Team', color: '#facc15', tyre: 'INTER', lap: 13, best: '1:30.050', last: '1:30.790', s1: '30.15', s2: '25.31', s3: '35.33', kmh: 0, inPit: true, pitTimerMs: 12000, pace: 0.000185 },
    { id: 'bot-mag', code: 'MAG', name: 'Kevin Magnussen', team: 'Haas F1 Team', color: '#a855f7', tyre: 'WET', lap: 13, best: '1:30.240', last: '1:31.010', s1: '30.26', s2: '25.41', s3: '35.34', kmh: 276, inPit: false, pace: 0.000183 },
    { id: 'bot-gro', code: 'GRO', name: 'Romain Grosjean', team: 'Haas F1 Team', color: '#c084fc', tyre: 'WET', lap: 13, best: '1:30.380', last: '1:31.140', s1: '30.32', s2: '25.45', s3: '35.37', kmh: 275, inPit: false, pace: 0.000182 },
    { id: 'bot-gas', code: 'GAS', name: 'Pierre Gasly', team: 'Red Bull Toro Rosso Honda', color: '#818cf8', tyre: 'INTER', lap: 13, best: '1:30.290', last: '1:31.060', s1: '30.28', s2: '25.40', s3: '35.38', kmh: 276, inPit: false, pace: 0.000183 },
    { id: 'bot-har', code: 'HAR', name: 'Brendon Hartley', team: 'Red Bull Toro Rosso Honda', color: '#6366f1', tyre: 'WET', lap: 12, best: '1:30.690', last: '1:31.490', s1: '30.46', s2: '25.58', s3: '35.45', kmh: 272, inPit: false, pace: 0.000179 },
    { id: 'bot-eri', code: 'ERI', name: 'Marcus Ericsson', team: 'Alfa Romeo Sauber F1 Team', color: '#22c55e', tyre: 'WET', lap: 12, best: '1:30.780', last: '1:31.580', s1: '30.51', s2: '25.61', s3: '35.46', kmh: 271, inPit: false, pace: 0.000178 },
    { id: 'bot-lec', code: 'LEC', name: 'Charles Leclerc', team: 'Alfa Romeo Sauber F1 Team', color: '#4ade80', tyre: 'INTER', lap: 13, best: '1:30.190', last: '1:30.940', s1: '30.21', s2: '25.36', s3: '35.37', kmh: 277, inPit: false, pace: 0.000184 },
    { id: 'bot-str', code: 'STR', name: 'Lance Stroll', team: 'Williams Martini Racing', color: '#38bdf8', tyre: 'WET', lap: 12, best: '1:30.890', last: '1:31.710', s1: '30.56', s2: '25.66', s3: '35.49', kmh: 270, inPit: false, pace: 0.000177 },
    { id: 'bot-sir', code: 'SIR', name: 'Sergey Sirotkin', team: 'Williams Martini Racing', color: '#7dd3fc', tyre: 'WET', lap: 12, best: '1:30.960', last: '1:31.820', s1: '30.60', s2: '25.69', s3: '35.53', kmh: 269, inPit: false, pace: 0.000176 },
  ];

  const total = roster.length;
  return roster.map((d, idx) => ({
    ...d,
    progress: Number((((total - idx) / (total + 1)) * 0.94 + 0.03).toFixed(4)),
  }));
}

let map = null;
let currentCircuitId = document.getElementById('trackSelect')?.value || 'au-1953';
let trackPolyline = [];
let cumulativeLengths = [];
let totalTrackLength = 0;
let showLabels = true;
let followMode = false;
let selectedDriverId = null;
let dummyDrivers = createDummyDrivers();
let activeDrivers = DEMO_BOTS_ENABLED ? dummyDrivers : [];
let isLiveFeedActive = false;

const carMarkers = new Map();
const sectorMarkers = [];

function detectCircuitByRawName(rawTrack = '') {
  const lower = rawTrack.toLowerCase();
  for (const [id, info] of Object.entries(CIRCUITS)) {
    if (info.keywords.some((kw) => lower.includes(kw))) return id;
  }
  return null;
}

function buildTrackSpline(coords) {
  trackPolyline = coords;
  cumulativeLengths = [0];
  let sum = 0;
  for (let i = 1; i < coords.length; i++) {
    sum += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    cumulativeLengths.push(sum);
  }
  totalTrackLength = sum || 1;
}

function getCoordsAtProgress(t) {
  if (!trackPolyline.length) return [144.9683, -37.8497];
  const norm = ((t % 1) + 1) % 1;
  const targetDist = norm * totalTrackLength;

  let idx = 1;
  while (idx < cumulativeLengths.length - 1 && cumulativeLengths[idx] < targetDist) {
    idx++;
  }

  const prevDist = cumulativeLengths[idx - 1];
  const segLen = cumulativeLengths[idx] - prevDist || 1e-9;
  const ratio = (targetDist - prevDist) / segLen;

  const p1 = trackPolyline[idx - 1];
  const p2 = trackPolyline[idx];
  return [p1[0] + (p2[0] - p1[0]) * ratio, p1[1] + (p2[1] - p1[1]) * ratio];
}

function sliceTrackByRatio(startRatio, endRatio) {
  const steps = 60;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = startRatio + ((endRatio - startRatio) * i) / steps;
    pts.push(getCoordsAtProgress(t));
  }
  return pts;
}

async function fetchCircuitGeoJSON(circuitId) {
  try {
    const url = `https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${circuitId}.geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('GeoJSON not found');
    const data = await res.json();
    const coords = data.features[0].geometry.coordinates;
    if (coords && coords.length > 5) return coords;
  } catch {
    // Используем запасной контур
  }
  return FALLBACK_MELBOURNE_COORDS;
}

function renderTrackLayers() {
  if (!map || !map.isStyleLoaded()) return;

  const sectors = [
    { id: 'sector-1', coords: sliceTrackByRatio(0, 0.333), color: '#ff2a2a' },
    { id: 'sector-2', coords: sliceTrackByRatio(0.333, 0.666), color: '#38bdf8' },
    { id: 'sector-3', coords: sliceTrackByRatio(0.666, 1.0), color: '#f59e0b' },
  ];

  sectors.forEach((sec) => {
    const geo = { type: 'Feature', geometry: { type: 'LineString', coordinates: sec.coords } };
    if (map.getSource(sec.id)) {
      map.getSource(sec.id).setData(geo);
    } else {
      map.addSource(sec.id, { type: 'geojson', data: geo });
      map.addLayer({
        id: `${sec.id}-glow`,
        type: 'line',
        source: sec.id,
        paint: { 'line-color': sec.color, 'line-width': 11, 'line-opacity': 0.32, 'line-blur': 6 },
      });
      map.addLayer({
        id: `${sec.id}-core`,
        type: 'line',
        source: sec.id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': sec.color, 'line-width': 3.5, 'line-opacity': 0.95 },
      });
    }
  });

  sectorMarkers.forEach((m) => m.remove());
  sectorMarkers.length = 0;

  [
    { label: 'S1', cls: 's1', pos: 0.16 },
    { label: 'S2', cls: 's2', pos: 0.50 },
    { label: 'S3', cls: 's3', pos: 0.83 },
  ].forEach((b) => {
    const el = document.createElement('div');
    el.className = `sector-badge sector-badge--${b.cls}`;
    el.textContent = b.label;
    sectorMarkers.push(
      new window.maplibregl.Marker({ element: el }).setLngLat(getCoordsAtProgress(b.pos)).addTo(map)
    );
  });
}

function syncCarMarkers() {
  if (!map) return;
  const activeIds = new Set(activeDrivers.map((d) => d.id));

  for (const [id, item] of carMarkers.entries()) {
    if (!activeIds.has(id)) {
      item.marker.remove();
      carMarkers.delete(id);
    }
  }

  activeDrivers.forEach((d) => {
    const shortTag = getShortCode(d);
    if (!carMarkers.has(d.id)) {
      const el = document.createElement('div');
      el.className = 'car-marker';
      el.style.color = d.color;
      el.innerHTML = `
        <span class="car-marker__dot" style="background:${d.color}"></span>
        <span class="car-marker__tag">${shortTag}</span>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDriver(d.id);
      });

      const marker = new window.maplibregl.Marker({ element: el, anchor: 'left' })
        .setLngLat(getCoordsAtProgress(d.progress))
        .addTo(map);
      carMarkers.set(d.id, { marker, el });
    } else {
      const tag = carMarkers.get(d.id).el.querySelector('.car-marker__tag');
      if (tag) tag.textContent = shortTag;
    }
  });

  updateUIState();
}

function selectDriver(driverId) {
  selectedDriverId = selectedDriverId === driverId ? null : driverId;
  if (selectedDriverId) {
    followMode = true;
    document.getElementById('btnCamFollow')?.classList.add('is-active');
  }
  updateUIState();
  renderTimingTables();
}

function updateUIState() {
  const focusLabel = document.getElementById('hudFocusLabel');
  const selected = activeDrivers.find((d) => d.id === selectedDriverId);

  if (focusLabel) {
    if (followMode && selected) focusLabel.textContent = `Камера: За ${getShortCode(selected)}`;
    else if (followMode) focusLabel.textContent = 'Камера: За лидером';
    else focusLabel.textContent = 'Камера: Свободная';
  }

  carMarkers.forEach(({ el }, id) => {
    const isSel = id === selectedDriverId;
    const isDim = selectedDriverId && !isSel;
    el.classList.toggle('is-selected', isSel);
    el.classList.toggle('is-dimmed', isDim);

    const tag = el.querySelector('.car-marker__tag');
    if (tag) tag.style.display = showLabels || isSel ? 'inline-block' : 'none';
  });
}

function renderTimingTables() {
  const countEl = document.getElementById('liveActiveCount');
  const miniList = document.getElementById('miniTowerList');
  const fullBody = document.getElementById('fullTimingBody');

  if (!activeDrivers.length) {
    if (countEl) countEl.textContent = '0 на трассе';
    if (miniList) miniList.innerHTML = '<div style="padding:20px;color:#8b92a5;font-size:0.85rem;">На трассе пока никого</div>';
    if (fullBody) fullBody.innerHTML = '<tr><td colspan="13" style="padding:24px;text-align:center;color:#8b92a5;">Живых пилотов на трассе сейчас нет</td></tr>';
    return;
  }

  const sorted = [...activeDrivers].sort((a, b) => (b.lap + b.progress) - (a.lap + a.progress));
  const leader = sorted[0];
  if (countEl) countEl.textContent = `${sorted.length} на трассе${isLiveFeedActive ? '' : ' · демо'}`;

  if (miniList) {
    miniList.innerHTML = sorted
      .map((d, idx) => {
        const shortTag = getShortCode(d);
        const diff = (leader.lap + leader.progress) - (d.lap + d.progress);
        const gap = idx === 0 ? 'LEADER' : `+${Math.max(0.1, diff * 88.0).toFixed(1)}s`;
        return `
          <div class="mini-row ${d.id === selectedDriverId ? 'is-selected' : ''}" data-id="${d.id}">
            <div class="mini-row__left">
              <span class="mini-row__pos">${idx + 1}</span>
              <span class="mini-row__bar" style="background:${d.color}"></span>
              <span>${shortTag}</span>
            </div>
            <span class="mini-row__gap">${d.inPit ? 'IN PIT' : gap}</span>
          </div>
        `;
      })
      .join('');

    miniList.querySelectorAll('.mini-row').forEach((row) => {
      row.addEventListener('click', () => selectDriver(row.dataset.id));
    });
  }

  if (fullBody) {
    fullBody.innerHTML = sorted
      .map((d, idx) => {
        const shortTag = getShortCode(d);
        const diff = (leader.lap + leader.progress) - (d.lap + d.progress);
        const gap = idx === 0 ? '—' : `+${Math.max(0.05, diff * 88.0).toFixed(3)}`;
        const statusText = d.inPit ? 'IN PIT' : 'ON TRACK';

        return `
          <tr class="${d.id === selectedDriverId ? 'is-selected' : ''}" data-id="${d.id}">
            <td class="lt-pos">${idx + 1}</td>
            <td>
              <div class="lt-driver-cell">
                <span class="lt-team-bar" style="background:${d.color}"></span>
                <strong>${shortTag}</strong>
                <span class="lt-muted">${d.name}</span>
              </div>
            </td>
            <td class="lt-muted">${d.team}</td>
            <td class="lt-mono">${d.lap}</td>
            <td class="lt-mono ${idx === 0 ? 'lt-purple' : ''}">${d.best}</td>
            <td class="lt-mono">${d.last}</td>
            <td class="lt-mono">${d.s1}</td>
            <td class="lt-mono">${d.s2}</td>
            <td class="lt-mono">${d.s3}</td>
            <td class="lt-mono lt-muted">${gap}</td>
            <td class="lt-mono">${d.kmh} км/ч</td>
            <td>${renderTyreBadge(d.tyre)}</td>
            <td><span class="status-pill">${statusText}</span></td>
          </tr>
        `;
      })
      .join('');

    fullBody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => selectDriver(row.dataset.id));
    });
  }
}

async function switchCircuit(circuitId) {
  currentCircuitId = circuitId;
  const info = CIRCUITS[circuitId] || CIRCUITS['au-1953'];
  document.getElementById('hudTrackName').textContent = info.name;
  document.getElementById('hudTrackMeta').textContent = info.meta;

  const select = document.getElementById('trackSelect');
  if (select && select.value !== circuitId) select.value = circuitId;

  const coords = await fetchCircuitGeoJSON(circuitId);
  buildTrackSpline(coords);
  renderTrackLayers();

  if (map) {
    map.flyTo({ center: info.center, zoom: info.zoom, pitch: 56, bearing: -22, duration: 1400 });
  }
}

async function pollLiveServer() {
  try {
    const res = await fetch('/api/live');
    if (!res.ok) throw new Error('API not OK');
    const data = await res.json();

    const statusEl = document.querySelector('.live-server-box__status span:last-child');
    const descEl = document.querySelector('.live-server-box__desc');

    if (data.online) {
      if (statusEl) {
        statusEl.textContent = data.clients > 0
          ? `СЕРВЕР RCS F1 · ${data.sessionType} (${data.clients}/${data.maxClients})`
          : `СЕРВЕР СВОБОДЕН · ${data.sessionType} (0/${data.maxClients})`;
      }

      const detectedTrack = detectCircuitByRawName(data.trackRaw);
      if (detectedTrack && detectedTrack !== currentCircuitId) {
        await switchCircuit(detectedTrack);
      }

      if (Array.isArray(data.drivers) && data.drivers.length > 0) {
        isLiveFeedActive = true;
        activeDrivers = data.drivers;
        if (descEl) {
          descEl.textContent = `Живая телеметрия с сервера · На трассе ${data.drivers.length} пилот(ов).`;
        }
        syncCarMarkers();
        renderTimingTables();
        return;
      }
    } else if (statusEl) {
      statusEl.textContent = 'СЕРВЕР ОФФЛАЙН · ДЕМО-РЕЖИМ';
    }

    isLiveFeedActive = false;
    activeDrivers = DEMO_BOTS_ENABLED ? dummyDrivers : [];
    if (descEl) {
      descEl.textContent = DEMO_BOTS_ENABLED
        ? 'Сервер пуст или недоступен — на карте идут 20 тестовых пилотов F1 2018.'
        : 'Живых пилотов на трассе сейчас нет.';
    }
    syncCarMarkers();
    renderTimingTables();
  } catch {
    isLiveFeedActive = false;
    activeDrivers = DEMO_BOTS_ENABLED ? dummyDrivers : [];
    syncCarMarkers();
    renderTimingTables();
  }
}

function initMap() {
  if (!window.maplibregl) return;

  const initial = CIRCUITS[currentCircuitId] || CIRCUITS['au-1953'];
  map = new window.maplibregl.Map({
    container: 'map3d',
    center: initial.center,
    zoom: initial.zoom,
    pitch: 56,
    bearing: -22,
    attributionControl: false,
    style: {
      version: 8,
      sources: {
        esriSatellite: {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'esriSatellite',
          paint: { 'raster-brightness-max': 0.72, 'raster-saturation': -0.35, 'raster-contrast': 0.15 },
        },
      ],
    },
  });

  map.on('dragstart', () => {
    if (followMode) {
      followMode = false;
      document.getElementById('btnCamFollow')?.classList.remove('is-active');
      updateUIState();
    }
  });

  map.on('load', async () => {
    await switchCircuit(currentCircuitId);
    syncCarMarkers();
    startRenderLoop();
    pollLiveServer();
  });
}

function startRenderLoop() {
  let last = performance.now();

  function tick(now) {
    const dt = Math.min(50, now - last);
    last = now;

    if (!isLiveFeedActive && DEMO_BOTS_ENABLED) {
      const stepFactor = dt / 16.67;
      dummyDrivers.forEach((d, idx) => {
        if (d.inPit) {
          d.kmh = 0;
          if (typeof d.pitTimerMs === 'number') {
            d.pitTimerMs -= dt;
            if (d.pitTimerMs <= 0) {
              d.inPit = false;
              d.tyre = d.tyre === 'WET' ? 'INTER' : 'WET';
            }
          }
          return;
        }

        const wave = 1 + Math.sin(now / 1200 + idx * 1.3) * 0.02;
        d.progress += d.pace * wave * stepFactor;
        if (d.progress >= 1) {
          d.progress -= 1;
          d.lap += 1;
        }
        d.kmh = Math.round(274 + Math.sin(now / 450 + idx) * 14);
      });
    }

    activeDrivers.forEach((d) => {
      const item = carMarkers.get(d.id);
      if (item) {
        item.marker.setLngLat(getCoordsAtProgress(d.progress));
      }
    });

    if (followMode && map && activeDrivers.length) {
      const sorted = [...activeDrivers].sort((a, b) => (b.lap + b.progress) - (a.lap + a.progress));
      const target = activeDrivers.find((d) => d.id === selectedDriverId) || sorted[0];
      if (target) {
        map.jumpTo({ center: getCoordsAtProgress(target.progress) });
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.getElementById('burgerBtn')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('is-open');
});

document.getElementById('btnCam3D')?.addEventListener('click', () => {
  document.getElementById('btnCam3D')?.classList.add('is-active');
  document.getElementById('btnCamTop')?.classList.remove('is-active');
  map?.easeTo({ pitch: 56, bearing: -22, duration: 800 });
});

document.getElementById('btnCamTop')?.addEventListener('click', () => {
  document.getElementById('btnCamTop')?.classList.add('is-active');
  document.getElementById('btnCam3D')?.classList.remove('is-active');
  map?.easeTo({ pitch: 0, bearing: 0, duration: 800 });
});

document.getElementById('btnCamFollow')?.addEventListener('click', (e) => {
  followMode = !followMode;
  e.target.classList.toggle('is-active', followMode);
  updateUIState();
});

document.getElementById('btnFullscreen')?.addEventListener('click', () => {
  const ws = document.getElementById('liveWorkspace');
  if (!document.fullscreenElement) ws?.requestFullscreen?.();
  else document.exitFullscreen?.();
});

document.getElementById('toggleLabelsBtn')?.addEventListener('click', (e) => {
  showLabels = !showLabels;
  e.target.textContent = `Фамилии: ${showLabels ? 'ВКЛ' : 'ВЫКЛ'}`;
  e.target.classList.toggle('is-active', showLabels);
  updateUIState();
});

document.getElementById('trackSelect')?.addEventListener('change', (e) => {
  switchCircuit(e.target.value);
});

renderTimingTables();
initMap();
setInterval(renderTimingTables, 1500);
setInterval(pollLiveServer, 3000);