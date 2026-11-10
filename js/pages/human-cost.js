// The human cost: incident log, geographic map, footprint charts and exposure estimator.
import { boot, prefersReducedMotion } from '../core.js';
import { icon, esc, sourceLinks, SCALE } from '../ui.js';
import { makeGraph, developersReached, rankLabel } from '../reach.js';

let D, H, M, G;
const nodeOf = (id) => M.nodes.find((n) => n.id === id);
const nodeName = (id) => nodeOf(id)?.label || id;
const fmt = (n) => (n == null ? '–' : Number(n).toLocaleString('en-GB'));
const SEV = { high: { colour: '#E55F53', label: 'Severe harm', fill: true }, moderate: { colour: '#B78024', label: 'Moderate harm', fill: false } };
// Brighter versions for the lighter map background.
const GEO_SEV = { high: '#FF6F61', moderate: '#F2B134' };

/* ---------- Totals ---------- */

// Minimum deaths at a site: the larger of (a) dated incidents that are counted and (b) a source's own
// aggregate for the site. Never the sum of both, because aggregates already include dated incidents.
function loggedKilled(node) {
  return H.incidents.filter((i) => i.node === node && i.counted !== false).reduce((a, i) => a + (i.killed || 0), 0);
}
function killedBy(node) {
  const agg = H.siteTotals.find((t) => t.node === node && t.aggregate);
  return Math.max(loggedKilled(node), agg ? agg.killed_min || 0 : 0);
}
function totalKilled() {
  return [...new Set(H.incidents.map((i) => i.node))].reduce((a, n) => a + killedBy(n), 0);
}
function sitesWithHarm() {
  const ids = [...new Set(H.incidents.map((i) => i.node))];
  return ids.map((id) => ({ id, killed: killedBy(id), n: H.incidents.filter((i) => i.node === id).length })).sort((a, b) => b.killed - a.killed || b.n - a.n);
}

function renderHeader() {
  const killed = totalKilled();
  const y0 = Math.min(...H.incidents.filter((i) => i.killed && i.counted !== false).map((i) => i.year).filter(Boolean));
  const forced = new Set(H.incidents.filter((i) => /forced labour|child labour/.test(i.type)).map((i) => i.node));
  const sites = new Set(H.incidents.map((i) => i.node));
  document.getElementById('hc-title').textContent = `At least ${fmt(killed)} people killed in fusion's supply chains since ${y0}`;
  document.getElementById('hc-lead').textContent = `Counted at the mines and plants that supply fusion's magnets and reactor parts. ${H.lead}`;
  document.getElementById('hc-caveat').innerHTML = `${icon('alert', 'icon icon--sm')} ${esc(H.caveat)}`;
  document.getElementById('hc-stats').innerHTML = `
    <div class="stat stat--accent"><dt>${fmt(killed)}</dt><dd>people documented killed (minimum), counting each death once.</dd></div>
    <div class="stat"><dt>${fmt(H.incidents.length)}</dt><dd>dated incidents of harm logged, each with its source.</dd></div>
    <div class="stat"><dt>${fmt(forced.size)}</dt><dd>sites where forced or child labour is documented.</dd></div>
    <div class="stat"><dt>${fmt(sites.size)}</dt><dd>mines and plants with documented harm, out of the places this site traces.</dd></div>`;
  const recent = H.incidents.filter((i) => i.counted !== false && i.year >= 2022).reduce((a, i) => a + (i.killed || 0), 0);
  const dated = H.incidents.filter((i) => i.counted !== false).reduce((a, i) => a + (i.killed || 0), 0);
  document.getElementById('tl-title').textContent = `${Math.round((recent / dated) * 100)}% of documented deaths happened in 2022 or later.`;
  const top = sitesWithHarm()[0];
  document.getElementById('site-title').textContent = `${nodeName(top.id)} has the most documented deaths: at least ${fmt(top.killed)}.`;
}

/* ---------- Geographic map ---------- */

const REGIONS = [
  { id: 'world', label: 'World', center: [40, 20], scale: 1 },
  { id: 'myanmar', label: 'Kachin and Shan, Myanmar', center: [98.6, 23.6], scale: 16 },
  { id: 'china', label: 'China and East Asia', center: [112, 28], scale: 4 },
  { id: 'africa', label: 'Great Lakes, Africa', center: [29, -2], scale: 7 },
  { id: 'indonesia', label: 'Indonesia', center: [122, -2], scale: 4 },
  { id: 'americas', label: 'Americas', center: [-80, 5], scale: 2 },
];
const geo = { region: 'world', routes: false, buyers: true, world: null, selected: null, t: null, zoom: null, proj: null };
const GW = 1000, GH = 520;

function geoNodes() {
  const harm = new Set(H.incidents.map((i) => i.node));
  return H.coords.map((c) => {
    const n = nodeOf(c.node);
    if (!n) return null;
    const isHarm = harm.has(c.node) || ['mine'].includes(n.kind) && ['high', 'moderate'].includes(n.harm);
    return { ...c, n, isHarm, killed: killedBy(c.node) };
  }).filter(Boolean);
}

async function initGeo() {
  const svg = d3.select('#geo-svg').attr('viewBox', `0 0 ${GW} ${GH}`);
  try {
    const topo = await d3.json('vendor/countries-110m.json');
    geo.world = topojson.feature(topo, topo.objects.countries);
  } catch (e) { geo.world = { type: 'FeatureCollection', features: [] }; }
  geo.proj = d3.geoNaturalEarth1().scale(175).center(REGIONS[0].center).translate([GW / 2, GH / 2]);
  geo.t = d3.zoomIdentity;
  // Wheel zooms only with Ctrl/Cmd (trackpad pinch sends this), so the page still scrolls normally.
  geo.zoom = d3.zoom().scaleExtent([1, 40]).translateExtent([[-100, -60], [GW + 100, GH + 60]])
    .filter((ev) => (ev.type === 'wheel' ? ev.ctrlKey || ev.metaKey : !ev.button))
    .on('zoom', (ev) => { geo.t = ev.transform; placeGeo(); });
  svg.call(geo.zoom);
  document.querySelector('.geo-zoom').addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]'); if (!b) return;
    const tr = svg.transition().duration(prefersReducedMotion() ? 0 : 350);
    if (b.dataset.zoom === 'in') tr.call(geo.zoom.scaleBy, 1.8);
    else if (b.dataset.zoom === 'out') tr.call(geo.zoom.scaleBy, 1 / 1.8);
    else zoomToRegion('world');
  });
  drawGeo();
}

function zoomToRegion(id) {
  geo.region = id;
  document.querySelectorAll('[data-region]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.region === id)));
  const reg = REGIONS.find((r) => r.id === id);
  const [cx, cy] = geo.proj(reg.center);
  const t = d3.zoomIdentity.translate(GW / 2, GH / 2).scale(reg.scale).translate(-cx, -cy);
  d3.select('#geo-svg').transition().duration(prefersReducedMotion() ? 0 : 700).call(geo.zoom.transform, t);
}

function drawGeo() {
  const svg = d3.select('#geo-svg');
  const proj = geo.proj, path = d3.geoPath(proj);
  const pts = geoNodes().filter((p) => p.isHarm || geo.buyers);
  geo.pts = pts;
  geo.xy = new Map(pts.map((p) => [p.node, proj([p.lon, p.lat])]));
  geo.r = d3.scaleSqrt().domain([0, d3.max(pts, (p) => p.killed) || 1]).range([6, 26]);
  const r = geo.r;
  svg.selectAll('g').remove();
  const base = svg.append('g').attr('class', 'geo-base');
  base.append('path').attr('class', 'geo-grat').attr('d', path(d3.geoGraticule10()));
  base.append('g').attr('class', 'geo-land').selectAll('path').data(geo.world.features).join('path').attr('d', path);
  // USGS-mapped rare earth leaching tanks in Myanmar (0.05° cells), shown once zoomed in on Myanmar.
  if (H.tanks) {
    const maxT = d3.max(H.tanks.cells, (c) => c.tanks);
    const rr = d3.scaleSqrt().domain([1, maxT]).range([2, 11]);
    svg.append('g').attr('class', 'geo-tanks').selectAll('circle').data(H.tanks.cells).join('circle')
      .attr('r', (c) => rr(c.tanks))
      .append('title').text((c) => `${c.tanks} leaching tanks mapped by USGS (images ${c.first}–${c.last})`);
  }
  if (geo.routes) {
    const ids = new Set(pts.map((p) => p.node));
    const edges = M.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
    svg.append('g').attr('class', 'geo-routes').selectAll('path').data(edges).join('path')
      .attr('class', (e) => `geo-route geo-route--${e.status}`);
  }
  const g = svg.append('g').attr('class', 'geo-points');
  const tip = document.getElementById('geo-tip');
  const show = (ev, p) => {
    tip.hidden = false;
    tip.innerHTML = '';
    const v = document.createElement('span'); v.className = 'tooltip__label';
    v.textContent = p.isHarm ? `${fmt(p.killed)} killed (minimum)` : (p.n.kind === 'developer' ? 'Fusion developer' : 'Processor or maker');
    const l = document.createElement('span'); l.className = 'tooltip__fn'; l.textContent = `${p.n.label} · ${p.place || p.n.country || ''}`;
    tip.append(v, l);
    const box = document.querySelector('.geo-figure').getBoundingClientRect();
    tip.style.left = `${Math.min(ev.clientX - box.left + 14, box.width - 240)}px`;
    tip.style.top = `${ev.clientY - box.top + 14}px`;
  };
  const hide = () => { tip.hidden = true; };
  const key = (ev, p) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectGeo(p.node); } };
  // Buyers and processors: small squares.
  g.selectAll('rect').data(pts.filter((p) => !p.isHarm)).join('rect')
    .attr('class', (p) => `geo-sq geo-sq--${p.n.kind}${geo.selected === p.node ? ' is-sel' : ''}`)
    .attr('width', 9).attr('height', 9)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', (p) => `${p.n.label}. Show details.`)
    .on('pointermove', show).on('pointerleave', hide).on('click', (ev, p) => selectGeo(p.node)).on('keydown', key);
  // Harm sites: circles. Severe = solid, moderate = open ring (shape, not only colour).
  const harmPts = pts.filter((p) => p.isHarm).sort((a, b) => b.killed - a.killed);
  const sev = (p) => (p.n.harm === 'high' ? 'high' : 'moderate');
  const gc = g.selectAll('g.geo-site').data(harmPts).join('g').attr('class', (p) => `geo-site geo-site--${sev(p)}${geo.selected === p.node ? ' is-sel' : ''}`)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', (p) => `${p.n.label}: ${SEV[sev(p)].label}, at least ${p.killed} killed. Show details.`)
    .on('pointermove', show).on('pointerleave', hide).on('click', (ev, p) => selectGeo(p.node)).on('keydown', key);
  gc.append('circle').attr('class', 'geo-hit').attr('r', (p) => Math.max(14, r(p.killed)));
  gc.append('circle').attr('class', 'geo-dot').attr('r', (p) => r(p.killed));
  gc.append('text').attr('class', 'geo-label').attr('x', (p) => r(p.killed) + 6).attr('y', 4).text((p) => p.n.label);
  placeGeo();

  document.getElementById('geo-legend').innerHTML = `
    <span><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="${GEO_SEV.high}" stroke="#FFE2DE" stroke-width="1.5"/></svg>Severe harm (solid)</span>
    <span><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="${GEO_SEV.moderate}" stroke-width="2.5"/></svg>Moderate harm (ring)</span>
    <span><svg width="16" height="16" aria-hidden="true"><rect x="4" y="4" width="8" height="8" fill="#C9D3DD"/></svg>Processor or maker</span>
    <span><svg width="16" height="16" aria-hidden="true"><rect x="4" y="4" width="8" height="8" fill="#8DB8FF"/></svg>Fusion developer</span>
    <span>Circle size: people documented killed</span>
    ${H.tanks ? `<span><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" class="geo-tank-key"/></svg>Rare earth leaching tanks (USGS satellite survey), shown when zoomed in on Myanmar</span>` : ''}`;
}

// Re-position everything for the current zoom. Land scales; markers keep their size.
function placeGeo() {
  const t = geo.t, k = t.k;
  const svg = d3.select('#geo-svg');
  svg.select('.geo-base').attr('transform', t);
  const at = (id) => t.apply(geo.xy.get(id));
  svg.selectAll('.geo-tanks circle')
    .attr('cx', (c) => t.applyX(geo.proj([c.lon + 0.025, c.lat + 0.025])[0])).attr('cy', (c) => t.applyY(geo.proj([c.lon + 0.025, c.lat + 0.025])[1]));
  svg.select('.geo-tanks').attr('display', k >= 6 ? null : 'none');
  svg.selectAll('.geo-route').attr('d', (e) => {
    const a = at(e.from), b = at(e.to);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.18;
    return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  });
  svg.selectAll('.geo-sq').attr('x', (p) => at(p.node)[0] - 4.5).attr('y', (p) => at(p.node)[1] - 4.5);
  svg.selectAll('.geo-site').attr('transform', (p) => `translate(${at(p.node)})`);
  // Label the biggest sites in view; more labels as you zoom in.
  const inView = (p) => { const [x, y] = at(p.node); return x > 0 && x < GW && y > 0 && y < GH; };
  const max = k < 2 ? 4 : k < 6 ? 7 : 14;
  let shown = 0;
  const boxes = [];
  const clash = (x, y, w) => boxes.some((bx) => Math.abs(bx.y - y) < 15 && x < bx.x + bx.w && bx.x < x + w);
  svg.selectAll('.geo-site').each(function (p) {
    const [x, y] = at(p.node), w = p.n.label.length * 6.4, x0 = x + geo.r(p.killed) + 6;
    const on = (inView(p) && (p.killed > 0 || k >= 3) && shown < max && !clash(x0, y, w)) || geo.selected === p.node;
    if (on) { shown += 1; boxes.push({ x: x0, y, w }); }
    d3.select(this).select('.geo-label').attr('display', on ? null : 'none');
  });
}

function tollText(i) {
  return [i.killed != null && `${fmt(i.killed)} killed`, i.injured != null && `${fmt(i.injured)} injured`, i.missing != null && `${fmt(i.missing)} missing`, i.affected_desc || (i.affected != null && `${fmt(i.affected)} affected`)].filter(Boolean).join(' · ');
}
function incidentHtml(i, { showPlace = true } = {}) {
  const counts = tollText(i);
  const toll = i.killed ? `${fmt(i.killed)} killed` : (i.type || '');
  return `<li><details class="inc">
    <summary>
      <time class="inc__date">${esc(i.date)}</time>
      <span><span class="inc__what">${esc(i.summary)}</span>${showPlace ? `<span class="inc__where">${esc(i.place || nodeName(i.node))}</span>` : ''}</span>
      <span class="inc__toll${i.killed && i.counted !== false ? ' inc__toll--k' : ''}">${esc(toll)}</span>
    </summary>
    <div class="inc__body">
      <p class="incident__meta">${esc(i.type)}${i.counts_are && counts ? ` · <span class="incident__basis">counts are ${esc(i.counts_are)}</span>` : ''}</p>
      ${counts ? `<p class="incident__counts">${esc(counts)}</p>` : ''}
      ${i.counted === false ? `<p class="incident__nc">Not added to totals: ${esc(i.notCounted)}</p>` : ''}
      ${i.cause ? `<p class="map-detail__muted">Cause or perpetrator: ${esc(i.cause)}</p>` : ''}
      ${i.quote ? `<blockquote class="incident__quote">“${esc(i.quote)}”</blockquote>` : ''}
      ${sourceLinks(i.sources, D.sourceIndex)}
    </div>
  </details></li>`;
}

// Where a site's metal could end up: fusion developers reachable downstream, graded by weakest link.
function reachHtml(id) {
  const devs = developersReached(G, [id]);
  const link = `<a class="btn-link" href="risk.html#from=${encodeURIComponent(id)}">Open in the risk tracer${icon('arrowRight', 'icon icon--sm')}</a>`;
  if (!devs.length) return `<div class="reach"><p class="reach__h">Where its metal could go</p><p class="map-detail__muted">No route to a fusion developer found in the records.</p>${link}</div>`;
  return `<div class="reach"><p class="reach__h">Where its metal could go</p>
    <ul>${devs.map((d) => `<li><span>${esc(d.label)}</span><span class="evtag">${esc(rankLabel(d.rank).short)}</span></li>`).join('')}</ul>
    <p class="map-detail__muted">Graded by the weakest link on the strongest route.</p>${link}</div>`;
}

function selectGeo(id) {
  geo.selected = id;
  const n = nodeOf(id);
  const inc = H.incidents.filter((i) => i.node === id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const tot = H.siteTotals.find((t) => t.node === id);
  const c = H.coords.find((x) => x.node === id);
  const mat = (n.materials || []).find((m) => D.chains.materials[m]);
  document.getElementById('geo-detail').innerHTML = `
    <p class="map-detail__kind">${esc(c?.place || n.country || '')}</p>
    <h2 class="map-detail__title">${esc(n.label)}</h2>
    ${inc.length ? `<p class="map-detail__rating"><span class="swatch" style="background:${(SEV[n.harm] || SEV.moderate).colour}"></span>${fmt(killedBy(id))} killed (minimum) · ${inc.length} incident${inc.length > 1 ? 's' : ''}</p>` : `<p class="map-detail__muted">${esc(n.harmNote || 'No incidents of harm logged here.')}</p>`}
    ${tot ? `<p>${esc(tot.text)}</p>${tot.aggregate ? `<p class="map-detail__muted">The site total uses this source's own count (${fmt(tot.killed_min)}), which already includes the dated incidents below (${fmt(loggedKilled(id))} deaths).</p>` : ''}${sourceLinks(tot.sources, D.sourceIndex)}` : ''}
    ${reachHtml(id)}
    ${inc.length ? `<p class="map-detail__k">Incidents</p><ol class="incidents--rows">${inc.map((i) => incidentHtml(i, { showPlace: false })).join('')}</ol>` : ''}
    ${c ? `<p class="map-detail__muted">Location: ${esc(c.precision)}${c.note ? ` · ${esc(c.note)}` : ''}</p>` : ''}
    ${mat ? `<div class="map-detail__ctas"><a class="btn btn--ghost btn--sm" href="cases.html#${esc(mat)}">Case file</a><a class="btn-link" href="map.html#${esc(mat)}">On the systems map${icon('arrowRight', 'icon icon--sm')}</a></div>` : ''}`;
  drawGeo();
}

/* ---------- Site bars ---------- */

function renderSiteChart() {
  const rows = sitesWithHarm().filter((s) => s.killed > 0);
  const max = Math.max(...rows.map((r) => r.killed));
  document.getElementById('site-chart').innerHTML = rows.map((r) => {
    const n = nodeOf(r.id);
    const sev = n?.harm === 'high' ? 'high' : 'moderate';
    return `<div class="hbar__row" tabindex="0" title="${esc(nodeName(r.id))}: at least ${fmt(r.killed)} killed in ${r.n} incidents">
      <span class="hbar__label">${esc(nodeName(r.id))}</span>
      <span class="hbar__track"><span class="hbar__bar hbar__bar--${sev}" style="width:${Math.max(1, (r.killed / max) * 100)}%"></span></span>
      <span class="hbar__val">${fmt(r.killed)}</span>
    </div>`;
  }).join('');
  document.getElementById('site-table').innerHTML = `<table><thead><tr><th scope="col">Site</th><th scope="col">Killed (minimum)</th><th scope="col">Incidents</th></tr></thead><tbody>${sitesWithHarm().map((r) => `<tr><th scope="row">${esc(nodeName(r.id))}</th><td>${fmt(r.killed)}</td><td>${r.n}</td></tr>`).join('')}</tbody></table>`;
  document.querySelector('[data-table="sites"]').addEventListener('click', (e) => {
    const t = document.getElementById('site-table'); const c = document.getElementById('site-chart');
    const showTable = t.hidden; t.hidden = !showTable; c.hidden = showTable;
    e.target.textContent = showTable ? 'Show as chart' : 'Show as table';
  });
}

/* ---------- Timeline ---------- */

function renderTimeline() {
  const yMin = 1990;
  const inc = H.incidents.filter((i) => i.year && i.year >= yMin);
  const yMax = Math.max(...inc.map((i) => i.year));
  const sites = sitesWithHarm().map((s) => s.id).filter((id) => inc.some((i) => i.node === id));
  const W = 1000, rowH = 30, left = 230, right = 48, top = 30;
  const Hh = top + sites.length * rowH + 10;
  const x = (y) => left + ((y - yMin) / Math.max(1, yMax - yMin)) * (W - left - right);
  const maxK = Math.max(1, ...inc.map((i) => i.killed || 0));
  const rad = (k) => (k ? 5 + Math.sqrt(k / maxK) * 14 : 5);
  const ticks = []; for (let y = Math.ceil(yMin / 5) * 5; y <= yMax; y += 5) ticks.push(y);
  const jitter = {};
  const dots = inc.filter((i) => i.year >= yMin && sites.includes(i.node)).map((i) => {
    const key = `${i.node}-${i.year}`; jitter[key] = (jitter[key] || 0) + 1;
    const sev = nodeOf(i.node)?.harm === 'high' ? 'high' : 'moderate';
    const cx = x(i.year) + (jitter[key] - 1) * 7, cy = top + sites.indexOf(i.node) * rowH + rowH / 2;
    const solid = i.killed && i.counted !== false;
    return `<g class="tl-dot" tabindex="0" data-i="${esc(i.id)}"><circle class="tl-hit" cx="${cx}" cy="${cy}" r="12"/><circle cx="${cx}" cy="${cy}" r="${rad(i.killed)}" class="tl-mark tl-mark--${solid ? 'k' : 'o'} tl-mark--${sev}${i.counted === false ? ' tl-mark--nc' : ''}"/></g>`;
  }).join('');
  document.getElementById('tl-chart').innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" class="tl-svg" role="img" aria-label="Incidents of harm by year and site">
    ${ticks.map((t) => `<line class="tl-grid" x1="${x(t)}" x2="${x(t)}" y1="${top - 8}" y2="${Hh - 6}"/><text class="tl-tick" x="${x(t)}" y="${top - 14}" text-anchor="middle">${t}</text>`).join('')}
    ${sites.map((s, i) => `<text class="tl-row" x="${left - 12}" y="${top + i * rowH + rowH / 2 + 4}" text-anchor="end">${esc(nodeName(s).slice(0, 32))}</text><line class="tl-base" x1="${left}" x2="${W - right}" y1="${top + i * rowH + rowH / 2}" y2="${top + i * rowH + rowH / 2}"/>`).join('')}
    ${dots}</svg>`;
  const tip = document.getElementById('tl-tip');
  const host = document.getElementById('tl-chart');
  const show = (el, ev) => {
    const i = H.incidents.find((x2) => x2.id === el.dataset.i);
    tip.hidden = false; tip.innerHTML = '';
    const v = document.createElement('span'); v.className = 'tooltip__label'; v.textContent = i.killed ? `${fmt(i.killed)} killed${i.counted === false ? ' (not added to totals)' : ''}` : i.type;
    const l = document.createElement('span'); l.className = 'tooltip__fn'; l.textContent = `${i.date} · ${i.summary}`;
    tip.append(v, l);
    const box = host.parentElement.getBoundingClientRect();
    const rr = (ev?.clientX != null ? { x: ev.clientX, y: ev.clientY } : (() => { const b = el.getBoundingClientRect(); return { x: b.right, y: b.top }; })());
    tip.style.left = `${Math.min(rr.x - box.left + 12, box.width - 280)}px`;
    tip.style.top = `${rr.y - box.top + 12}px`;
  };
  host.addEventListener('pointermove', (e) => { const el = e.target.closest('.tl-dot'); if (el) show(el, e); else tip.hidden = true; });
  host.addEventListener('pointerleave', () => { tip.hidden = true; });
  host.addEventListener('focusin', (e) => { const el = e.target.closest('.tl-dot'); if (el) show(el); });
  host.addEventListener('focusout', () => { tip.hidden = true; });
}

/* ---------- Incident log ---------- */

function renderLog() {
  const siteSel = document.getElementById('log-site'), typeSel = document.getElementById('log-type');
  sitesWithHarm().forEach((s) => siteSel.insertAdjacentHTML('beforeend', `<option value="${esc(s.id)}">${esc(nodeName(s.id))}</option>`));
  [...new Set(H.incidents.map((i) => i.type))].sort().forEach((t) => typeSel.insertAdjacentHTML('beforeend', `<option>${esc(t)}</option>`));
  const draw = () => {
    const list = H.incidents.filter((i) => (!siteSel.value || i.node === siteSel.value) && (!typeSel.value || i.type === typeSel.value))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    document.getElementById('log-list').innerHTML = list.map((i) => incidentHtml(i)).join('');
    const k = list.filter((i) => i.counted !== false).reduce((a, i) => a + (i.killed || 0), 0);
    document.getElementById('log-count').textContent = `${list.length} incident${list.length === 1 ? '' : 's'} · ${fmt(k)} deaths in the dated incidents shown`;
  };
  siteSel.addEventListener('change', draw); typeSel.addEventListener('change', draw);
  draw();
  const killedAll = H.incidents.filter((i) => i.counted !== false).reduce((a, i) => a + (i.killed || 0), 0);
  document.getElementById('log-hint').textContent = `${H.incidents.length} incidents · ${fmt(killedAll)} deaths in dated incidents`;
  if (location.hash === '#log') document.getElementById('log-panel').open = true;
}

/* ---------- Footprint small multiples ---------- */

function lineChart(s) {
  const W = 460, Hh = 220, l = 54, r = 16, t = 16, b = 30;
  const clean = (arr) => (arr || []).filter((p) => p.y != null).sort((a, b2) => a.x - b2.x);
  const pts = clean(s.points), pts2 = clean(s.points2);
  const all = [...pts, ...pts2];
  const x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(...all.map((p) => p.x)), yMax = Math.max(...all.map((p) => p.y)) * 1.12;
  const X = (v) => l + ((v - x0) / Math.max(1, x1 - x0)) * (W - l - r);
  const Y = (v) => Hh - b - (v / yMax) * (Hh - t - b);
  const path = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' ');
  const yt = [0, yMax / 2, yMax].map((v) => Math.round(v));
  const short = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}m` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : `${v}`);
  const ptsSvg = (arr, cls, label) => arr.map((p) => `<g class="lc-pt" tabindex="0"><circle class="tl-hit" cx="${X(p.x)}" cy="${Y(p.y)}" r="12"/><circle class="lc-dot ${cls}" cx="${X(p.x)}" cy="${Y(p.y)}" r="4"/><title>${esc(`${label ? `${label}, ` : ''}${p.x}: ${fmt(p.y)} ${s.unit}${p.note ? ` (${p.note})` : ''}`)}</title></g>`).join('');
  const end = (arr, cls, label) => { const p = arr[arr.length - 1]; return `<text class="lc-end ${cls}" x="${X(p.x) - 6}" y="${Y(p.y) - 10}" text-anchor="end">${esc(label ? `${label} ${fmt(p.y)}` : fmt(p.y))}</text>`; };
  const ticksX = x1 - x0 > 4 ? [x0, Math.round((x0 + x1) / 2), x1] : [...new Set(all.map((p) => p.x))];
  return `<svg viewBox="0 0 ${W} ${Hh}" class="lc" role="img" aria-label="${esc(s.title)}">
    ${yt.map((v) => `<line class="tl-grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tl-tick" x="${l - 8}" y="${Y(v) + 4}" text-anchor="end">${short(v)}</text>`).join('')}
    ${ticksX.map((v) => `<text class="tl-tick" x="${X(v)}" y="${Hh - 8}" text-anchor="middle">${v}</text>`).join('')}
    ${pts2.length ? `<path class="lc-line lc-line--2" d="${path(pts2)}"/>` : ''}
    <path class="lc-line" d="${path(pts)}"/>
    ${pts2.length ? ptsSvg(pts2, 'lc-dot--2', s.label2) : ''}${ptsSvg(pts, '', s.label1)}
    ${pts2.length ? end(pts2, 'lc-end--2', s.label2) : ''}${end(pts, '', pts2.length ? s.label1 : '')}
  </svg>${pts2.length ? `<p class="lc-legend"><span><svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" class="lc-line"/></svg>${esc(s.label1)}</span><span><svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" class="lc-line lc-line--2"/></svg>${esc(s.label2)}</span></p>` : ''}`;
}

const GROWTH_FIRST = ['kachin-ree-area-crisisgroup', 'mm-share-china-ree-imports', 'rw-drc-tantalum-mine-usgs', 'id-nickel-mine-usgs'];
function growthCard(s) {
  return `
    <figure class="chart-card multiple">
      <figcaption><p class="chart-card__title">${esc(s.title)}</p><p class="chart-card__unit">${esc(s.unit)}</p></figcaption>
      ${lineChart(s)}
      ${s.caveat ? `<details class="chart-card__data"><summary>Caveat</summary><p class="chart-card__note">${esc(s.caveat)}</p></details>` : ''}
      ${sourceLinks(s.sources, D.sourceIndex)}
      <details class="chart-card__data"><summary>Data</summary><table><tbody>${s.points.map((p) => `<tr><th scope="row">${p.x}</th><td>${fmt(p.y)}${s.points2 ? ` (${esc(s.label1)})` : ''}</td><td>${esc(p.note || '')}</td></tr>`).join('')}${(s.points2 || []).map((p) => `<tr><th scope="row">${p.x}</th><td>${fmt(p.y)} (${esc(s.label2)})</td><td>${esc(p.note || '')}</td></tr>`).join('')}</tbody></table></details>
    </figure>`;
}
function renderGrowth() {
  const all = H.series.filter((s) => s.points.filter((p) => p.y != null).length >= 2);
  const first = GROWTH_FIRST.map((id) => all.find((s) => s.id === id)).filter(Boolean);
  const rest = all.filter((s) => !first.includes(s));
  document.getElementById('growth-charts').innerHTML = first.map(growthCard).join('');
  document.getElementById('growth-charts-more').innerHTML = rest.map(growthCard).join('');
  document.getElementById('growth-hint').textContent = `${rest.length} more: Myanmar exports, Shan State, tin, Rwanda, Morowali workforce, Grasberg`;
}

/* ---------- Exposure estimator ---------- */

function renderExposure() {
  const E = H.exposure;
  document.getElementById('exp-intro').textContent = E.intro;
  document.getElementById('exp-method').textContent = E.method;
  const dev = document.getElementById('exp-device'), cnt = document.getElementById('exp-count'), out = document.getElementById('exp-count-out'), scen = document.getElementById('exp-scenario');
  dev.innerHTML = E.devices.map((d) => `<option value="${esc(d.id)}">${esc(d.label)}</option>`).join('');
  scen.innerHTML = '<option value="">None: use the slider</option>' + E.scenarios.map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
  const kg = (v) => (v >= 1000 ? `${fmt(+(v / 1000).toPrecision(3))} t` : `${fmt(+v.toPrecision(3))} kg`);
  const draw = () => {
    let d = E.devices.find((x) => x.id === dev.value);
    let n = Number(cnt.value);
    const s = E.scenarios.find((x) => x.id === scen.value);
    if (s) { d = E.devices.find((x) => x.id === s.device) || d; n = s.plants; dev.value = d.id; cnt.value = Math.min(100, n); }
    out.textContent = n;
    const rng = (lo, hi) => (Math.abs(hi - lo) < 1e-9 ? kg(lo) : `${kg(lo)}–${kg(hi)}`);
    const rows = Object.entries(d.materials).map(([mat, m]) => {
      const lo = (m.lo ?? m.kg) * n, mid = m.kg * n, hi = (m.hi ?? m.kg) * n;
      const shares = E.shares.filter((x) => x.material === mat).map((x) => ({ ...x, sev: nodeOf(x.node)?.harm === 'high', l: x.lo ?? x.pct, h: x.hi ?? x.pct }));
      const sum = (arr, k) => arr.reduce((a, x) => a + x[k], 0);
      const sevS = shares.filter((x) => x.sev);
      return { mat, lo, mid, hi, world: E.world[mat], shares,
        sev: sevS.length ? [lo * sum(sevS, 'l') / 100, hi * sum(sevS, 'h') / 100] : null,
        any: shares.length ? [lo * sum(shares, 'l') / 100, hi * sum(shares, 'h') / 100] : null };
    });
    document.getElementById('exp-out').innerHTML = `
      <p class="estimator__head">${esc(s ? s.label : `${n} × ${d.label}`)}</p>
      ${s?.note ? `<p class="map-detail__muted">${esc(s.note)}</p>${sourceLinks(s.sources, D.sourceIndex)}` : ''}
      <table class="exp-table"><thead><tr>
        <th scope="col">Material</th><th scope="col">Needed</th><th scope="col">Share of one year's world mining</th>
        <th scope="col">From places with severe harm</th><th scope="col">From places with any documented harm</th>
      </tr></thead><tbody>
      ${rows.map((r) => {
        const pctWorld = r.world ? (r.mid / 1000 / r.world.t) * 100 : null;
        const pw = pctWorld == null ? '–' : pctWorld < 0.001 ? '&lt; 0.001%' : `${+pctWorld.toPrecision(2)}%`;
        const where = (arr) => arr.map((x) => `${x.place} ${x.l === x.h ? x.l : `${x.l}–${x.h}`}%`).join('; ');
        return `<tr>
          <th scope="row">${esc(D.chains.materials[r.mat]?.name || r.mat)}</th>
          <td>${rng(r.lo, r.hi)}</td>
          <td>${pw}</td>
          <td>${r.sev ? `${rng(r.sev[0], r.sev[1])}<span class="exp-where">${esc(where(r.shares.filter((x) => x.sev)))}</span>` : '<span class="exp-where">None of the main sources</span>'}</td>
          <td>${r.any ? `${rng(r.any[0], r.any[1])}<span class="exp-where">${esc(where(r.shares))}</span>` : '–'}</td>
        </tr>`;
      }).join('')}
      </tbody></table>
      <p class="map-detail__muted">Ranges combine the range of material per device with the range of each place's share of world supply. They assume fusion buys at the world average; real exposure depends on which suppliers it uses, which no record yet shows.</p>`;
  };
  [dev, cnt].forEach((el) => el.addEventListener('input', () => { scen.value = ''; draw(); }));
  scen.addEventListener('change', draw);
  draw();
  document.getElementById('exp-assumptions').innerHTML = `
    <h3 class="h3">Material in each device</h3>
    ${E.devices.map((d) => `<div class="assump"><p class="assump__h">${esc(d.label)}</p>${d.note ? `<p class="map-detail__muted">${esc(d.note)}</p>` : ''}<ul>${Object.entries(d.materials).map(([mat, m]) => `<li><strong>${esc(D.chains.materials[mat]?.name || mat)}: ${kg(m.kg)} (${kg(m.lo ?? m.kg)}–${kg(m.hi ?? m.kg)})</strong>${m.calc ? ` · ${esc(m.calc)}` : ''} ${sourceLinks(m.sources, D.sourceIndex)}</li>`).join('')}</ul></div>`).join('')}
    <h3 class="h3">Supply from places with documented harm</h3>
    <ul>${E.shares.map((x) => `<li><strong>${esc(D.chains.materials[x.material]?.name || x.material)}, ${esc(x.place)}: ${x.lo != null ? `${x.lo}–${x.hi}` : x.pct}%</strong> · ${esc(x.basis)} ${sourceLinks(x.sources, D.sourceIndex)}</li>`).join('')}</ul>
    <h3 class="h3">World supply</h3>
    <ul>${Object.entries(E.world).map(([mat, w]) => `<li><strong>${esc(D.chains.materials[mat]?.name || mat)}: ${fmt(w.t)} t a year</strong>${w.basis ? ` · ${esc(w.basis)}` : ''} ${sourceLinks(w.sources, D.sourceIndex)}</li>`).join('')}</ul>`;
}

boot('human-cost', ['chains', 'map', 'human'], async (data) => {
  D = data; H = D.human; M = D.map; G = makeGraph(M);
  renderHeader();
  document.getElementById('geo-regions').innerHTML = REGIONS.map((r) => `<button type="button" class="chip" data-region="${r.id}" aria-pressed="${r.id === geo.region}">${esc(r.label)}</button>`).join('');
  document.getElementById('geo-regions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]'); if (!b) return;
    zoomToRegion(b.dataset.region);
  });
  document.getElementById('geo-routes').addEventListener('change', (e) => { geo.routes = e.target.checked; drawGeo(); });
  document.getElementById('geo-buyers').addEventListener('change', (e) => { geo.buyers = e.target.checked; drawGeo(); });
  await initGeo();
  renderSiteChart();
  renderTimeline();
  renderLog();
  renderGrowth();
  renderExposure();
});
