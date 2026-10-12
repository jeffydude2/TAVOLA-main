// If config.js is missing the menu still shows; data pages will say the database can't be reached.
const API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';

async function api(path, options = {}) {
  const res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Something went wrong. Try again.');
  return body;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const addr = (r) => [r.address?.building, r.address?.street, r.address?.zipcode].filter(Boolean).join(' ') || 'No address on file';
const fmt = (n) => Number(n).toLocaleString('en-US');

function toast(message) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

// Search stays reachable from the home page buttons, so the nav matches the design.
const NAV = [
  ['index.html', 'Home'], ['restaurants.html', 'Restaurants'],
  ['boroughs.html', 'Boroughs'], ['top-rated.html', 'Top rated']
];

const LOGO = `
  <svg viewBox="0 0 125 60" aria-hidden="true" focusable="false">
    <ellipse cx="62.5" cy="30" rx="61" ry="29" fill="#fff"/>
    <circle cx="32" cy="30" r="15" fill="#F6B04A"/>
    <circle cx="93" cy="30" r="15" fill="#F6B04A"/>
    <circle cx="62.5" cy="30" r="21" fill="#FDBE5C"/>
  </svg>`;

function renderShell() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="bar">
      <a class="brand" href="index.html" aria-label="Tavola home">${LOGO}<span>Tavola</span></a>
      <nav aria-label="Primary">${NAV.map(([h, l]) => `<a href="${h}" ${h === page ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
      <a class="btn primary" href="restaurants.html?add=1">Add restaurant</a>
    </div>`;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap foot">
      <div><strong>Tavola</strong><p>Find, add and manage restaurants stored in MongoDB Atlas.</p>
        <span class="status" id="status"><i></i><span>Connecting</span></span></div>
      <div><span class="tag">Contact</span><p><button class="linkbtn" id="copyMail" type="button">hello@tavola.app</button></p></div>
      <div><span class="tag">Location</span><p>Angeles City, PH<br><span class="small">GMT+8</span></p></div>
    </div>`;
  document.body.prepend(header);
  document.body.append(footer);
  document.getElementById('copyMail').addEventListener('click', () => {
    navigator.clipboard?.writeText('hello@tavola.app').catch(() => {});
    toast('Copied to clipboard!');
  });
  api('/health').then(() => setStatus(true)).catch(() => setStatus(false));
}

function setStatus(ok) {
  const s = document.getElementById('status');
  s.classList.toggle('off', !ok);
  s.lastElementChild.textContent = ok ? 'Database live' : 'Database offline';
  if (!ok) {
    document.querySelectorAll('.loading td, .loading-note, .hint').forEach((el) => {
      el.textContent = "Can't reach the database. Start your backend server, then refresh the page.";
    });
  }
}

function fillSelect(sel, items, placeholder) {
  sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') + items.map((i) => `<option>${esc(i)}</option>`).join('');
}

function resultCards(rows) {
  if (!rows.length) return '<p class="empty">No restaurants match. Try a different name, cuisine or borough.</p>';
  return `<ul class="results">${rows.map((r) => `
    <li class="card"><span class="tag">${esc(r.borough)}</span>
    <h3>${esc(r.name)}</h3><p class="muted">${esc(r.cuisine)}</p><p class="small">${esc(addr(r))}</p></li>`).join('')}</ul>`;
}

document.addEventListener('DOMContentLoaded', renderShell);
