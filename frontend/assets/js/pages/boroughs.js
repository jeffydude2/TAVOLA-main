(async function () {
  const groups = document.getElementById('groups');
  const list = document.getElementById('list');
  const title = document.getElementById('listTitle');
  try {
    const rows = (await api('/stats/boroughs')).filter((r) => r.borough && r.borough !== 'Missing');
    groups.innerHTML = rows.map((r) => `
      <button class="group" type="button" data-b="${esc(r.borough)}">
        <span class="big">${fmt(r.total)}</span>
        <h3>${esc(r.borough)}</h3>
        <span class="small">${fmt(r.cuisineCount)} cuisines</span>
      </button>`).join('');
  } catch (e) {
    groups.innerHTML = `<p class="loading-note">${esc(e.message)}</p>`;
    return;
  }

  groups.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.group');
    if (!btn) return;
    groups.querySelectorAll('.group').forEach((g) => g.classList.toggle('active', g === btn));
    const b = btn.dataset.b;
    title.textContent = b;
    list.innerHTML = '<p class="hint">Loading...</p>';
    try {
      const res = await api('/restaurants?limit=60&borough=' + encodeURIComponent(b));
      title.textContent = `${b} (${fmt(res.total)} restaurants${res.total > res.data.length ? ', showing first ' + res.data.length : ''})`;
      list.innerHTML = resultCards(res.data);
    } catch (e) {
      list.innerHTML = `<p class="empty">${esc(e.message)}</p>`;
    }
  });
})();
