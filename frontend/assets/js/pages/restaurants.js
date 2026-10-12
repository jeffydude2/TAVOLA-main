(async function () {
  const rows = document.getElementById('rows');
  const fB = document.getElementById('fBorough');
  const fC = document.getElementById('fCuisine');
  const count = document.getElementById('count');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const pageInfo = document.getElementById('pageInfo');
  const dlg = document.getElementById('formDialog');
  const form = document.getElementById('restaurantForm');
  const formError = document.getElementById('formError');
  let page = 1, pages = 1, boroughs = [];

  try {
    const [b, c] = await Promise.all([api('/meta/boroughs'), api('/meta/cuisines')]);
    boroughs = b.filter((x) => x && x !== 'Missing');
    fillSelect(fB, boroughs, 'All boroughs');
    fillSelect(fC, c, 'All cuisines');
    fillSelect(form.elements.borough, boroughs);
  } catch (e) { /* status bar reports it */ }

  async function load() {
    rows.innerHTML = '<tr class="loading"><td colspan="5">Loading restaurants...</td></tr>';
    try {
      const p = new URLSearchParams({ page, limit: 15 });
      if (fB.value) p.set('borough', fB.value);
      if (fC.value) p.set('cuisine', fC.value);
      const res = await api('/restaurants?' + p);
      pages = res.pages;
      count.textContent = `${fmt(res.total)} restaurants`;
      pageInfo.textContent = `Page ${res.page} of ${fmt(res.pages)}`;
      prev.disabled = page <= 1;
      next.disabled = page >= pages;
      rows.innerHTML = res.data.length ? res.data.map((r) => `
        <tr><td>${esc(r.name)}</td><td>${esc(r.cuisine)}</td><td>${esc(r.borough)}</td><td>${esc(addr(r))}</td>
        <td class="actions"><button class="btn sm" data-edit="${esc(r._id)}" type="button">Edit</button>
        <button class="btn sm danger" data-del="${esc(r._id)}" data-name="${esc(r.name)}" type="button">Delete</button></td></tr>`).join('')
        : '<tr><td colspan="5" class="empty">No restaurants match these filters.</td></tr>';
    } catch (e) {
      rows.innerHTML = `<tr class="loading"><td colspan="5">${esc(e.message)}</td></tr>`;
    }
  }

  function openForm(r) {
    form.reset();
    formError.textContent = '';
    document.getElementById('dlgTitle').textContent = r ? 'Edit restaurant' : 'Add restaurant';
    const f = form.elements;
    f.id.value = r?._id || '';
    f.name.value = r?.name || '';
    f.cuisine.value = (r?.cuisine || '').trim();
    f.borough.value = r?.borough || boroughs[0] || '';
    f.building.value = r?.address?.building || '';
    f.street.value = r?.address?.street || '';
    f.zipcode.value = r?.address?.zipcode || '';
    dlg.showModal();
  }

  fB.addEventListener('change', () => { page = 1; load(); });
  fC.addEventListener('change', () => { page = 1; load(); });
  prev.addEventListener('click', () => { if (page > 1) { page--; load(); } });
  next.addEventListener('click', () => { if (page < pages) { page++; load(); } });
  document.getElementById('addBtn').addEventListener('click', () => openForm(null));
  document.getElementById('cancel').addEventListener('click', () => dlg.close());

  rows.addEventListener('click', async (ev) => {
    const ed = ev.target.closest('[data-edit]');
    const del = ev.target.closest('[data-del]');
    try {
      if (ed) openForm(await api('/restaurants/' + ed.dataset.edit));
      if (del && confirm(`Delete "${del.dataset.name}"? This cannot be undone.`)) {
        await api('/restaurants/' + del.dataset.del, { method: 'DELETE' });
        toast('Restaurant deleted.');
        load();
      }
    } catch (e) { toast(e.message); }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const id = f.id;
    delete f.id;
    try {
      await api(id ? '/restaurants/' + id : '/restaurants', { method: id ? 'PUT' : 'POST', body: JSON.stringify(f) });
      dlg.close();
      toast(id ? 'Restaurant updated.' : 'Restaurant added.');
      load();
    } catch (e) { formError.textContent = e.message; }
  });

  if (new URLSearchParams(location.search).get('add')) openForm(null);
  load();
})();
