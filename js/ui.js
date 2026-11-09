// Shared rendering helpers: icons, evidence badges, source links, colour scales.

export const ICONS = {
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  stop: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  merge: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
}

export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Evidence levels. Each has a distinct glyph so the level never relies on colour alone.
const EVIDENCE_GLYPH = {
  documented: '<circle cx="6" cy="6" r="4.5" fill="currentColor"/>',
  likely: '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor"/>',
  hypothesis: '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  'not-researched': '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>',
  'no-evidence': '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 6h5" stroke="currentColor" stroke-width="1.5"/>',
};

export const EVIDENCE_LABEL = {
  documented: 'Documented',
  likely: 'Likely pathway',
  hypothesis: 'Hypothesis',
  'not-researched': 'Not yet researched',
  'no-evidence': 'No evidence found',
};

export function evidenceBadge(ev, levels) {
  const level = ev.level;
  const label = levels?.[level]?.label || EVIDENCE_LABEL[level] || level;
  const meaning = levels?.[level]?.meaning || '';
  const scope = ev.scope ? `<span class="badge__scope">${esc(ev.scope)}</span>` : '';
  return `<span class="badge badge--${esc(level)}" title="${esc(meaning)}">` +
    `<svg class="badge__glyph" aria-hidden="true" viewBox="0 0 12 12">${EVIDENCE_GLYPH[level] || ''}</svg>` +
    `<span class="badge__label">${esc(label)}</span>${scope}</span>`;
}

export function sourceLabel(src) {
  return src.date ? `${src.publisher}, ${src.date}` : src.publisher;
}

// Source links are always visible: publisher + year, linking straight to the document.
export function sourceLinks(ids, sourceIndex, { sourceNeeded = false } = {}) {
  const items = (ids || []).map((id) => {
    const s = sourceIndex.get(id);
    if (!s) return `<li class="src src--missing">${esc(id)}: missing from sources.json</li>`;
    return `<li class="src"><a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">` +
      `<span class="src__id">${esc(s.id)}</span> ${esc(sourceLabel(s))}${icon('external', 'icon icon--sm')}` +
      `<span class="visually-hidden"> (opens in a new tab)</span></a></li>`;
  });
  if (sourceNeeded) items.push(`<li class="src src--needed">${icon('alert', 'icon icon--sm')} Source needed</li>`);
  if (!items.length) return '';
  return `<ul class="src-list">${items.join('')}</ul>`;
}

// Fill [data-cite="S1 S2"] spans with inline source links.
export function fillCitations(root, sourceIndex) {
  root.querySelectorAll('[data-cite]').forEach((el) => {
    const ids = el.dataset.cite.split(/\s+/).filter(Boolean);
    el.classList.add('cite');
    el.innerHTML = ids.map((id) => {
      const s = sourceIndex.get(id);
      if (!s) return esc(id);
      return `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">[${esc(sourceLabel(s))}]</a>`;
    }).join(' ');
  });
}

// Colour scales. Security lens = supply risk on the sequential blue ramp.
// People lens = harm severity on danger/warning; unknown stays neutral grey.
export const RATING_ORDER = { high: 3, moderate: 2, low: 1, unknown: 0 };

export const SCALE = {
  security: {
    high: { colour: '#6EA4FF', label: 'High supply risk' },
    moderate: { colour: '#2F5FC4', label: 'Moderate supply risk' },
    low: { colour: '#1C2B48', label: 'Low supply risk' },
    unknown: { colour: '#3A3731', label: 'Not assessed' },
  },
  people: {
    high: { colour: '#E55F53', label: 'Severe harm' },
    moderate: { colour: '#B78024', label: 'Moderate harm' },
    low: { colour: '#4A9B5E', label: 'No major harm found' },
    unknown: { colour: '#3A3731', label: 'No documented harm' },
  },
};

export function ratingKey(lens) {
  return lens === 'security' ? 'supply' : 'harm';
}

export function allStages(material) {
  const stages = [...(material.stages || [])];
  (material.routes || []).forEach((r) => stages.push(...r.stages));
  return stages;
}

export function maxRating(stages, lens) {
  const key = ratingKey(lens);
  let best = 'unknown';
  stages.forEach((s) => {
    const r = s.rating?.[key] || 'unknown';
    if (RATING_ORDER[r] > RATING_ORDER[best]) best = r;
  });
  return best;
}

export function renderFooter(site) {
  const el = document.getElementById('footer');
  if (!el) return;
  const date = site?.lastUpdated
    ? new Date(`${site.lastUpdated}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const links = [
    '<li><a href="method.html">Method &amp; limits</a></li>',
    '<li><a href="policy.html">Policy brief</a></li>',
    '<li><a href="solution.html">The solution</a></li>',
    site?.repoUrl ? `<li><a href="${esc(site.repoUrl)}" rel="noopener">GitHub repository</a></li>` : '',
  ].join('');
  el.innerHTML = `
    <div>
      <p class="site-footer__title">The Magnet Problem</p>
      <p class="site-footer__meta">${site?.course ? `${esc(site.course)} · ` : ''}Iteration ${esc(site?.iteration ?? 1)}${date ? ` · Last updated ${esc(date)}` : ''}</p>
    </div>
    <ul class="site-footer__links">${links}</ul>`;
}

// Sayari evidence: each entity links to the Sayari graph and is labelled confirmed vs inferred,
// following Sayari's own labelling (record-backed vs modelled/possible links).
// A screening line with nothing adverse in it is shown neutrally, not as a warning.
function isCleanWatch(text) {
  return /^(not sanctioned[;,.]?\s*)?((no watchlist hits|watchlist \(1 hop\): no hits)\.?)?$/i.test(text.trim());
}

export function sayariBlock(items) {
  if (!items || !items.length) return '';
  const li = items.map((e) => {
    const status = e.link_status === 'confirmed' ? 'confirmed' : 'inferred';
    const name = e.entity_url
      ? `<a href="${esc(e.entity_url)}" target="_blank" rel="noopener">${esc(e.name)}${icon('external', 'icon icon--sm')}<span class="visually-hidden"> (Sayari, opens in a new tab)</span></a>`
      : esc(e.name);
    return `<li class="sayari__item">
      <p class="sayari__name">${name}${e.country ? `<span class="sayari__country">${esc(e.country)}</span>` : ''}<span class="chip chip--${status}" title="${status === 'confirmed' ? 'Backed by a source record such as a shipment or registry filing' : 'Modelled or possible link; not backed by a direct record'}">${status === 'confirmed' ? 'Confirmed' : 'Inferred'}</span></p>
      ${e.role ? `<p class="sayari__role">${esc(e.role)}</p>` : ''}
      ${e.basis ? `<p class="sayari__basis">${esc(e.basis)}</p>` : ''}
      ${e.watchlist ? (isCleanWatch(e.watchlist)
        ? `<p class="sayari__clean">${esc(e.watchlist)}</p>`
        : `<p class="sayari__watch">${icon('alert', 'icon icon--sm')}${esc(e.watchlist)}</p>`) : ''}
    </li>`;
  }).join('');
  return `<div class="sayari"><p class="sayari__label">Sayari evidence</p><ul class="sayari__list">${li}</ul></div>`;
}
