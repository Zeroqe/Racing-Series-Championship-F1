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