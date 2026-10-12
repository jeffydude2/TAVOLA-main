(async function () {
  const rows = document.getElementById('rows');
  const sel = document.getElementById('borough');

  try { fillSelect(sel, await api('/meta/boroughs'), 'All boroughs'); } catch (e) { /* status bar will show it */ }

  async function load() {
    rows.innerHTML = '<tr class="loading"><td colspan="5">Loading top rated restaurants...</td></tr>';
    try {
      const data = await api('/stats/top-rated?limit=10' + (sel.value ? '&borough=' + encodeURIComponent(sel.value) : ''));
      rows.innerHTML = data.length
        ? data.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.cuisine)}</td><td>${esc(r.borough)}</td><td><b>${esc(r.avgScore)}</b> <span class="small">(${r.gradeCount} inspections)</span></td></tr>`).join('')
        : '<tr><td colspan="5" class="empty">No restaurants found.</td></tr>';
    } catch (e) {
      rows.innerHTML = `<tr class="loading"><td colspan="5">${esc(e.message)}</td></tr>`;
    }
  }
  sel.addEventListener('change', load);
  load();
})();
