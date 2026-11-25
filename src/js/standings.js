import '../sass/style.scss';
import { fetchSheetTab } from './sheets-api.js';

function posBadge(i) {
  const pos = i + 1;
  const cls = pos <= 3 ? ` pos-badge--${pos}` : '';
  return `<span class="pos-badge${cls}">${pos}</span>`;
}

function renderDrivers(rows) {
  const tbody = document.getElementById('driversTbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="standings-empty">Таблица пилотов пока пуста.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((r, i) => {
      const pen = Number(r.penalty) || 0;
      return `
        <tr>
          <td class="col-pos">${posBadge(i)}</td>
          <td class="st-driver">${r.driver || '—'}</td>
          <td class="st-team">${r.team || 'Частник'}</td>
          <td class="col-num">${pen > 0 ? `<span class="st-penalty">-${pen}</span>` : '0'}</td>
          <td class="col-pts">${r.total ?? 0}</td>
        </tr>
      `;
    })
    .join('');
}

function renderConstructors(rows) {
  const tbody = document.getElementById('constructorsTbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="standings-empty">Командный зачёт пока пуст.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map(
      (r, i) => `
      <tr>
        <td class="col-pos">${posBadge(i)}</td>
        <td class="st-driver">${r.team || '—'}</td>
        <td class="col-pts">${r.total ?? 0}</td>
      </tr>
    `
    )
    .join('');
}

function renderStewards(rows) {
  const list = document.getElementById('stewardsList');
  if (!rows.length) {
    list.innerHTML = '<div class="standings-empty">Нарушений и вердиктов пока не зафиксировано.</div>';
    return;
  }

  list.innerHTML = rows
    .map(
      (r) => `
      <div class="steward-item">
        <div>
          <div class="steward-item__round">${r.round || 'ЭТАП'}</div>
          <div class="steward-item__driver">${r.driver || 'Пилот'}</div>
          <div class="steward-item__reason">${r.reason || ''}</div>
        </div>
        <div class="steward-item__verdict">${r.verdict || 'БЕЗ ШТРАФА'}</div>
      </div>
    `
    )
    .join('');
}

document.getElementById('burgerBtn')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('is-open');
});

document.querySelectorAll('#standingsTabs .filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#standingsTabs .filter-btn').forEach((b) => b.classList.remove('is-active'));
    document.querySelectorAll('.standings-panel').forEach((p) => p.classList.remove('is-active'));

    btn.classList.add('is-active');
    document.getElementById(`panel-${btn.dataset.tab}`)?.classList.add('is-active');
  });
});

(async () => {
  try {
    const [drivers, constructors, stewards] = await Promise.all([
      fetchSheetTab('Drivers_Public'),
      fetchSheetTab('Constructors'),
      fetchSheetTab('Stewards'),
    ]);
    renderDrivers(drivers);
    renderConstructors(constructors);
    renderStewards(stewards);
  } catch (e) {
    console.error(e);
  }
})();