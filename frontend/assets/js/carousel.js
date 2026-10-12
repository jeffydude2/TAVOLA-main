/* Tavola - "Dishes worth finding" carousel
   - Plates glide around the ellipse; the dish name rolls in the same direction,
     on the same duration and easing (--cd in styles.css), so they land together.
   - Auto-advances. Pauses on mouse hover, keyboard focus, hidden tab and when
     scrolled off-screen. Never auto-plays with prefers-reduced-motion.
   - Click a plate, use the arrow keys, or swipe to move by hand. */
(function () {
  'use strict';

  var root = document.querySelector('.carousel');
  var caption = document.getElementById('dishCaption');
  if (!root || !caption) return;

  var items = Array.prototype.slice.call(root.querySelectorAll('.dish-item'));
  var N = items.length;
  if (N < 3) return;

  var INTERVAL = 4200; // ms between automatic changes (starts after the glide ends)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var active = 0;
  items.forEach(function (el, i) {
    if (el.getAttribute('data-pos') === '0') active = i;
  });

  /* ---------- caption: rolling text ---------- */
  var duration = (function () {
    var v = getComputedStyle(caption).getPropertyValue('--cd').trim();
    var n = parseFloat(v);
    if (isNaN(n)) return 800;
    return /ms$/.test(v) ? n : n * 1000;
  })();

  function nameOf(i) { return items[i].getAttribute('data-name') || ''; }

  caption.removeAttribute('aria-live');
  caption.textContent = '';

  var viewport = document.createElement('span');
  viewport.className = 'cap-viewport';
  viewport.setAttribute('aria-hidden', 'true');

  var current = document.createElement('span');
  current.className = 'cap-line';
  current.textContent = nameOf(active);
  viewport.appendChild(current);

  // Screen readers hear the name only when a person changes it, not on every auto-advance.
  var live = document.createElement('span');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  live.textContent = nameOf(active);

  caption.appendChild(viewport);
  caption.appendChild(live);

  function setCaption(name, dir, animate) {
    if (!animate) { current.textContent = name; return; }
    var y = dir >= 0 ? '125%' : '-125%';
    var leaving = current;
    var incoming = document.createElement('span');
    incoming.className = 'cap-line is-entering';
    incoming.style.setProperty('--cap-y', y);
    incoming.textContent = name;
    viewport.appendChild(incoming);
    void incoming.offsetWidth; // commit the start state before transitioning
    leaving.style.setProperty('--cap-y', y);
    leaving.classList.add('is-leaving');
    incoming.classList.remove('is-entering');
    current = incoming;
    setTimeout(function () {
      if (leaving.parentNode) leaving.parentNode.removeChild(leaving);
    }, duration + 80);
  }

  /* ---------- plates ---------- */
  function offset(i) {
    var d = ((i - active) % N + N) % N;
    if (d > N / 2) d -= N;
    return d;
  }

  function layout() {
    items.forEach(function (el, i) {
      var d = offset(i);
      var visible = Math.abs(d) <= 2;
      el.setAttribute('data-pos', Math.abs(d) <= 3 ? String(d) : 'hidden');
      el.style.setProperty('--d', d);
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      el.tabIndex = visible ? 0 : -1;
      if (d === 0) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  function go(delta, byUser) {
    if (!delta) return;
    active = ((active + delta) % N + N) % N;
    layout();
    setCaption(nameOf(active), delta > 0 ? 1 : -1, !reduce.matches);
    if (byUser) {
      live.textContent = nameOf(active);
      // keep keyboard focus on a plate that is still visible
      if (root.contains(document.activeElement)) {
        items[active].focus({ preventScroll: true });
      }
    }
    restart();
  }

  /* ---------- autoplay ---------- */
  var timer = null;
  var holds = {};
  function holding() { for (var k in holds) if (holds[k]) return true; return false; }
  function restart() {
    clearTimeout(timer);
    if (!reduce.matches && !holding()) {
      timer = setTimeout(function () { go(1, false); }, INTERVAL);
    }
  }
  function hold(key) { holds[key] = true; restart(); }
  function release(key) { holds[key] = false; restart(); }

  root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold('hover'); });
  root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release('hover'); });
  root.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches(':focus-visible')) hold('focus');
  });
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) release('focus');
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hold('tab'); else release('tab');
  });
  if ('IntersectionObserver' in window) {
    holds.offscreen = true;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) release('offscreen'); else hold('offscreen');
      });
    }, { threshold: 0.35 }).observe(root);
  }
  if (reduce.addEventListener) reduce.addEventListener('change', restart);

  /* ---------- manual control ---------- */
  items.forEach(function (el, i) {
    el.addEventListener('click', function () {
      var d = offset(i);
      if (d !== 0 && Math.abs(d) <= 2) go(d, true);
    });
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1, true); }
  });

  var startX = null, swiped = false;
  root.addEventListener('pointerdown', function (e) { startX = e.clientX; swiped = false; });
  root.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 48) { swiped = true; go(dx < 0 ? 1 : -1, true); }
  });
  root.addEventListener('pointercancel', function () { startX = null; });
  root.addEventListener('click', function (e) {
    if (swiped) { swiped = false; e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  /* ---------- start ---------- */
  root.classList.add('is-init'); // place everything without animating on page load
  layout();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      root.classList.remove('is-init');
      restart();
    });
  });
})();