(async function () {
  try {
    const [o, rows] = await Promise.all([api('/overview'), api('/stats/boroughs')]);
    document.getElementById('m-total').textContent = fmt(o.total);
    document.getElementById('m-cuisines').textContent = fmt(o.cuisines);
    document.getElementById('m-boroughs').textContent = fmt(o.boroughs);

    const max = Math.max(...rows.map((r) => r.total), 1);
    document.getElementById('bars').innerHTML = rows.map((r) => `
      <div class="bar-row"><span>${esc(r.borough)}</span>
        <div class="track"><div style="width:${(r.total / max) * 100}%"></div></div>
        <b>${fmt(r.total)}</b></div>`).join('');
  } catch (e) {
    document.getElementById('bars').innerHTML = `<p class="hint">${esc(e.message)}</p>`;
  }
})();
