// Shared page shell: navigation, footer, data loading, live announcements.
import { loadData, showLoadError } from './data.js';
import { esc, icon, fillCitations, renderFooter } from './ui.js';

export const NAV = [
  { id: 'home', href: 'index.html', label: 'Overview' },
  { id: 'reactor', href: 'reactor.html', label: 'The reactor' },
  { id: 'map', href: 'map.html', label: 'Systems map' },
  { id: 'human-cost', href: 'human-cost.html', label: 'Human cost' },
  { id: 'cases', href: 'cases.html', label: 'Case files' },
  { id: 'records', href: 'records.html', label: 'Trade records' },
  { id: 'scores', href: 'scores.html', label: 'Scores' },
  { id: 'solution', href: 'solution.html', label: 'The solution' },
  { id: 'policy', href: 'policy.html', label: 'Policy brief' },
  { id: 'method', href: 'method.html', label: 'Method' },
];

export function renderHeader(active) {
  const host = document.getElementById('site-header');
  if (!host) return;
  host.className = 'site-header';
  host.innerHTML = `
    <div class="wrap site-header__inner">
      <a class="site-header__title" href="index.html">The Magnet Problem</a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle__bars" aria-hidden="true"></span><span class="nav-toggle__label">Menu</span>
      </button>
      <nav aria-label="Site">
        <ul class="site-nav" id="site-nav">
          ${NAV.map((n) => `<li><a href="${n.href}"${n.id === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('')}
        </ul>
      </nav>
    </div>`;
  const btn = host.querySelector('.nav-toggle');
  const list = host.querySelector('.site-nav');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    list.classList.toggle('is-open', !open);
  });
}

// "Next" link at the foot of each page so the site reads as one story.
export function renderNext(active) {
  const host = document.getElementById('page-next');
  if (!host) return;
  const i = NAV.findIndex((n) => n.id === active);
  const next = NAV[i + 1];
  if (!next) { host.remove(); return; }
  host.innerHTML = `<a class="page-next" href="${next.href}"><span class="page-next__label">Next</span><span class="page-next__title">${esc(next.label)}</span>${icon('arrowRight')}</a>`;
}

export function announce(msg) {
  const live = document.getElementById('live');
  if (!live) return;
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 50);
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Boot a page: render the shell, load the data files it needs, then run the page.
export async function boot(active, keys, run) {
  renderHeader(active);
  renderNext(active);
  let D;
  try {
    D = await loadData([...new Set([...keys, 'sources', 'site'])]);
  } catch (err) {
    showLoadError(err);
    return;
  }
  try {
    await run(D);
  } finally {
    fillCitations(document, D.sourceIndex);
    renderFooter(D.site);
  }
}
