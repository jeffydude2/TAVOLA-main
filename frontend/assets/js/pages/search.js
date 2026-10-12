(async function () {
  const form = document.getElementById('searchForm');
  const out = document.getElementById('out');
  const summary = document.getElementById('summary');
  const sel = form.elements.cuisine;

  try { fillSelect(sel, await api('/meta/cuisines'), 'All cuisines'); }
  catch (e) { fillSelect(sel, [], 'All cuisines'); }

  async function run() {
    const q = form.elements.q.value.trim();
    const cuisine = sel.value;
    if (!q && !cuisine) {
      summary.innerHTML = '&nbsp;';
      out.innerHTML = '<p class="hint">Type a restaurant name or pick a cuisine, then press Search.</p>';
      return;
    }
    out.innerHTML = '<p class="hint">Searching...</p>';
    try {
      const p = new URLSearchParams({ limit: 40 });
      if (q) p.set('q', q);
      if (cuisine) p.set('cuisine', cuisine);
      const res = await api('/restaurants?' + p);
      summary.textContent = `${fmt(res.total)} result${res.total === 1 ? '' : 's'}` +
        (res.total > res.data.length ? `, showing first ${res.data.length}` : '');
      out.innerHTML = resultCards(res.data);
    } catch (e) {
      summary.innerHTML = '&nbsp;';
      out.innerHTML = `<p class="empty">${esc(e.message)}</p>`;
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  document.getElementById('clear').addEventListener('click', () => { form.reset(); run(); });
})();
