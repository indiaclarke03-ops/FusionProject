// Risk tracer: follow a mine, smelter or mineral downstream to fusion developers, or a developer upstream to harm sites.
import { boot, announce } from '../core.js';
import { icon, esc, sourceLinks, SCALE } from '../ui.js';
import { makeGraph, reach, routes, EVIDENCE, BY_RANK, KIND_LABEL, UPSTREAM_KINDS, rankLabel } from '../reach.js';

let D, G;
const st = { dir: 'down', start: 'y-kachin', mineral: null, focus: null, route: 0 };
const DEFAULT = { down: 'y-kachin', up: 'dev-cfs' };

const harmKey = (n) => (['high', 'moderate'].includes(n?.harm) ? n.harm : 'unknown');
export function harmMark(n, size = 12) {
  const k = harmKey(n), c = SCALE.people[k].colour, r = size / 2 - 1.5;
  const shape = k === 'high' ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${c}"/>`
    : k === 'moderate' ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r - 0.5}" fill="none" stroke="${c}" stroke-width="2"/>`
      : `<circle cx="${size / 2}" cy="${size / 2}" r="${r / 2}" fill="#8E8A82"/>`;
  return `<svg class="hmark" width="${size}" height="${size}" aria-hidden="true">${shape}</svg>`;
}
const evGlyph = (status, w = 26) => {
  const e = EVIDENCE[status];
  return `<svg class="evglyph" width="${w}" height="10" aria-hidden="true"><line x1="1" y1="5" x2="${w - 1}" y2="5" stroke-dasharray="${e.dash}" stroke-width="${e.width + 0.6}"/></svg>`;
};
const evTag = (rank) => { const k = BY_RANK[rank]; return `<span class="evtag evtag--${k}">${evGlyph(k)}${esc(EVIDENCE[k].short)}</span>`; };
const name = (id) => G.node(id)?.label || id;

function startIds() {
  if (st.mineral) return G.M.nodes.filter((n) => n.kind === 'mine' && (n.materials || []).includes(st.mineral)).map((n) => n.id);
  return [st.start];
}
function startLabel() {
  if (st.mineral) return `every ${D.chains.materials[st.mineral]?.name.toLowerCase() || st.mineral} mine on this site`;
  return name(st.start);
}

/* ---------- controls ---------- */

const ORDER = {
  down: ['mine', 'trader', 'separator', 'smelter', 'refiner', 'alloy', 'component', 'magnet'],
  up: ['developer', 'magnet', 'component', 'alloy', 'refiner', 'smelter', 'separator', 'trader'],
};
function renderSelect() {
  const sel = document.getElementById('tr-start');
  sel.innerHTML = ORDER[st.dir].map((k) => {
    const ns = G.M.nodes.filter((n) => n.kind === k).sort((a, b) => a.label.localeCompare(b.label));
    if (!ns.length) return '';
    return `<optgroup label="${esc(KIND_LABEL[k])}">${ns.map((n) => `<option value="${esc(n.id)}"${n.id === st.start && !st.mineral ? ' selected' : ''}>${esc(n.label)}${n.country ? ` (${esc(n.country)})` : ''}</option>`).join('')}</optgroup>`;
  }).join('');
  if (st.mineral) sel.insertAdjacentHTML('afterbegin', `<option value="" selected>${esc(startLabel())}</option>`);
  document.getElementById('tr-minerals-wrap').hidden = st.dir !== 'down';
  document.querySelectorAll('[data-dir]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dir === st.dir)));
  document.querySelectorAll('[data-mineral]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mineral === st.mineral)));
}

function renderMinerals() {
  const mats = [...new Set(G.M.nodes.filter((n) => n.kind === 'mine').flatMap((n) => n.materials || []))].filter((m) => D.chains.materials[m]);
  document.getElementById('tr-minerals').innerHTML = mats.map((m) => `<button type="button" class="chip" data-mineral="${esc(m)}" aria-pressed="false">${esc(D.chains.materials[m].name)}</button>`).join('');
}

/* ---------- diagram ---------- */

const BW = 176, BH = 46, CW = 214, RH = 58, TOP = 34;
function diagram(nodeIds, edges, hot) {
  const ns = [...nodeIds].map((id) => G.node(id)).filter(Boolean);
  const stages = [...new Set(ns.map((n) => Number(n.stage)))].sort((a, b) => a - b);
  const col = new Map(stages.map((s, i) => [s, i]));
  const rows = {};
  ns.sort((a, b) => (a.lane || '').localeCompare(b.lane || '') || a.label.localeCompare(b.label)).forEach((n) => { (rows[n.stage] = rows[n.stage] || []).push(n); });
  const maxRows = Math.max(...Object.values(rows).map((r) => r.length));
  const H = TOP + maxRows * RH + 6, W = stages.length * CW - (CW - BW) + 8;
  const pos = new Map();
  Object.entries(rows).forEach(([s, arr]) => {
    const off = ((maxRows - arr.length) * RH) / 2;
    arr.forEach((n, i) => pos.set(n.id, { x: 4 + col.get(Number(s)) * CW, y: TOP + off + i * RH }));
  });
  const starts = new Set(startIds());
  const hotE = new Set((hot?.edges || []).map((e) => `${e.from}>${e.to}`));
  const hotN = new Set(hot?.nodes || []);
  const eSvg = edges.map((e) => {
    const a = pos.get(e.from), b = pos.get(e.to); if (!a || !b) return '';
    const x1 = a.x + BW, y1 = a.y + BH / 2, x2 = b.x, y2 = b.y + BH / 2, dx = Math.max(30, (x2 - x1) / 2);
    const ev = EVIDENCE[e.status] || EVIDENCE.hypothesis;
    const isHot = hotE.has(`${e.from}>${e.to}`);
    return `<path class="tr-edge${isHot ? ' is-hot' : hot ? ' is-dim' : ''}" d="M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}" stroke-dasharray="${ev.dash}" stroke-width="${ev.width}" marker-end="url(#tr-arrow)"><title>${esc(`${name(e.from)} → ${name(e.to)}: ${ev.label}${e.basis ? ` · ${e.basis}` : ''}`)}</title></path>`;
  }).join('');
  const nSvg = ns.map((n) => {
    const p = pos.get(n.id);
    const label = n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label;
    const k = harmKey(n);
    const cls = `tr-node${starts.has(n.id) ? ' is-start' : ''}${hot ? (hotN.has(n.id) ? ' is-hot' : ' is-dim') : ''}`;
    return `<g class="${cls}" transform="translate(${p.x} ${p.y})" data-node="${esc(n.id)}" tabindex="0" role="button" aria-label="${esc(`${n.label}, ${KIND_LABEL[n.kind] || n.kind}, ${SCALE.people[k].label}. Trace from here.`)}">
      <rect class="tr-node__box" width="${BW}" height="${BH}" rx="3"/>
      <rect width="4" height="${BH}" fill="${SCALE.people[k].colour}"/>
      <text class="tr-node__label" x="12" y="19">${esc(label)}</text>
      <text class="tr-node__sub" x="12" y="35">${esc(n.country || KIND_LABEL[n.kind] || '')}${n.blending ? ' · blending point' : ''}${(n.flags || []).includes('sanctioned') ? ' · sanctions link' : ''}</text>
      <title>${esc(`${n.label} · ${KIND_LABEL[n.kind] || n.kind} · ${SCALE.people[k].label}`)}</title>
    </g>`;
  }).join('');
  const heads = stages.map((s) => `<text class="tr-col" x="${4 + col.get(s) * CW}" y="16">${esc(G.M.stages[s] || '')}</text>`).join('');
  return `<svg class="tr-svg" viewBox="0 0 ${W} ${H}" width="${W}" role="group" aria-label="Routes from ${esc(startLabel())}">
    <defs><marker id="tr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="m-arrow"/></marker></defs>
    ${heads}<g>${eSvg}</g><g>${nSvg}</g></svg>`;
}

/* ---------- routes ---------- */

function routeHtml(r, i, open) {
  const chain = r.nodes.map((id, j) => {
    const e = r.edges[j - 1];
    const sep = j ? `<span class="rt__sep rt__sep--${esc(e.status)}" title="${esc(EVIDENCE[e.status]?.label)}">${evGlyph(e.status, 18)}</span>` : '';
    return `${sep}<span class="rt__node">${harmMark(G.node(id), 10)}${esc(name(id))}</span>`;
  }).join('');
  const weak = r.weakest[0];
  return `<li><details class="rt" data-route="${i}"${open ? ' open' : ''}>
    <summary><span class="rt__chain">${chain}</span><span class="rt__grade">${evTag(r.strength)}</span></summary>
    <div class="rt__body">
      ${r.strength < 3 && weak ? `<p class="rt__weak">Weakest link: <strong>${esc(name(weak.from))} → ${esc(name(weak.to))}</strong> (${esc(EVIDENCE[weak.status].short.toLowerCase())}). Confirming it would strengthen the whole route.</p>` : '<p class="rt__weak">Every link on this route is a confirmed record.</p>'}
      <ol class="rt__links">${r.edges.map((e) => `<li class="flow flow--${esc(e.status)}">
        <p class="flow__route">${esc(name(e.from))} ${icon('arrowRight', 'icon icon--sm')} ${esc(name(e.to))}</p>
        <p class="flow__what">${esc(e.label || '')}${e.basis ? ` · ${esc(e.basis)}` : ''}</p>
        <p class="flow__status">${evGlyph(e.status, 20)} ${esc(EVIDENCE[e.status]?.label)}</p>
        ${sourceLinks(e.sources, D.sourceIndex)}
      </li>`).join('')}</ol>
    </div>
  </details></li>`;
}

function stat(v, k) { return `<div class="stat"><dt>${v}</dt><dd>${k}</dd></div>`; }

function render() {
  const starts = startIds();
  const dir = st.dir;
  const r = reach(G, starts, dir);
  const all = routes(G, starts, dir);
  const toDev = all.filter((x) => G.node(x.nodes[x.nodes.length - 1])?.kind === 'developer');
  const sub = new Set([...starts, ...r.keys()]);
  const edges = G.edges.filter((e) => sub.has(e.from) && sub.has(e.to) && (dir === 'down' ? (starts.includes(e.from) || r.has(e.from)) : (starts.includes(e.to) || r.has(e.to))));
  const out = document.getElementById('tr-out');
  const ids = [...sub].map((id) => G.node(id)).filter(Boolean);
  const blends = ids.filter((n) => n.blending).length;
  const sanc = ids.filter((n) => (n.flags || []).includes('sanctioned')).length;

  let head, tiles, list, listTitle, rest;
  if (dir === 'down') {
    const devs = new Map();
    r.forEach((rank, id) => { const n = G.node(id); if (n?.kind === 'developer' && (!devs.has(n.label) || devs.get(n.label) < rank)) devs.set(n.label, rank); });
    const best = Math.max(-1, ...devs.values());
    const severeOn = ids.filter((n) => n.harm === 'high' && !starts.includes(n.id) && UPSTREAM_KINDS.includes(n.kind)).length;
    const shown = st.focus ? toDev.filter((x) => G.node(x.nodes[x.nodes.length - 1]).label === st.focus) : toDev;
    head = devs.size
      ? `Material from ${esc(startLabel())} could reach <strong>${devs.size} fusion developer${devs.size > 1 ? 's' : ''}</strong>. The strongest complete route is <strong>${esc(rankLabel(best).short.toLowerCase())}</strong>${best < 3 ? ', so the link into fusion is not proven' : ''}.`
      : `No route from ${esc(startLabel())} to a fusion developer was found in the records. The trail goes cold at the stages shown below.`;
    tiles = stat(devs.size, 'fusion developers it could reach')
      + stat(devs.size ? esc(rankLabel(best).short) : '–', 'evidence for the strongest complete route')
      + stat(blends, `blending point${blends === 1 ? '' : 's'} on the way, where origin is lost`)
      + stat(sanc + severeOn, `${sanc ? 'sanctions-linked or ' : ''}severe-harm site${sanc + severeOn === 1 ? '' : 's'} on the way`);
    listTitle = st.focus ? `Routes to ${esc(st.focus)}` : 'Routes to fusion developers, strongest first';
    list = shown;
    rest = all.length - toDev.length;
    if (devs.size) head += `<span class="tr-devs">${[...devs.entries()].sort((a, b) => b[1] - a[1]).map(([l, rank]) => `<button type="button" class="chip chip--sm" data-focus="${esc(l)}" aria-pressed="${st.focus === l}">${esc(l)} · ${esc(rankLabel(rank).short)}</button>`).join('')}</span>`;
  } else {
    const harm = [...r.entries()].map(([id, rank]) => ({ n: G.node(id), rank })).filter((x) => UPSTREAM_KINDS.includes(x.n?.kind) && ['high', 'moderate'].includes(x.n.harm));
    const sev = harm.filter((x) => x.n.harm === 'high');
    const bestSev = Math.max(-1, ...sev.map((x) => x.rank));
    head = harm.length
      ? `Behind ${esc(startLabel())} sit <strong>${harm.length} place${harm.length > 1 ? 's' : ''} with documented harm</strong>, ${sev.length} of them severe.${sev.length ? ` The strongest route from a severe-harm site is <strong>${esc(rankLabel(bestSev).short.toLowerCase())}</strong>.` : ''}`
      : `No place with documented harm was found upstream of ${esc(startLabel())} in the records.`;
    tiles = stat(sev.length, 'severe-harm sites upstream')
      + stat(harm.length - sev.length, 'moderate-harm sites upstream')
      + stat(sev.length ? esc(rankLabel(bestSev).short) : '–', 'evidence for the strongest route from a severe-harm site')
      + stat(blends, `blending point${blends === 1 ? '' : 's'} on the way, where origin is lost`);
    if (harm.length) head += `<span class="tr-devs">${harm.sort((a, b) => (b.n.harm === 'high') - (a.n.harm === 'high') || b.rank - a.rank).map((x) => `<button type="button" class="chip chip--sm" data-focus="${esc(x.n.id)}" aria-pressed="${st.focus === x.n.id}">${harmMark(x.n, 10)} ${esc(x.n.label)} · ${esc(rankLabel(x.rank).short)}</button>`).join('')}</span>`;
    const fromHarm = all.filter((x) => ['high', 'moderate'].includes(G.node(x.nodes[0])?.harm) || x.nodes.some((id) => UPSTREAM_KINDS.includes(G.node(id)?.kind) && ['high', 'moderate'].includes(G.node(id).harm)));
    list = st.focus ? all.filter((x) => x.nodes.includes(st.focus)) : fromHarm;
    listTitle = st.focus ? `Routes through ${esc(name(st.focus))}` : 'Routes from harm sites, strongest first';
    rest = all.length - fromHarm.length;
  }
  const hot = list[st.route] || list[0];
  const MAX = 8;
  out.innerHTML = `
    <p class="tr-head">${head}</p>
    <dl class="stats tr-stats">${tiles}</dl>
    <div class="tr-figure">
      <div class="tr-scroll" tabindex="0" role="region" aria-label="Route diagram">${diagram(sub, edges, hot)}</div>
      <p class="tr-key">${Object.entries(EVIDENCE).reverse().map(([k, e]) => `<span>${evGlyph(k)}${esc(e.label)}</span>`).join('')}<span>${harmMark({ harm: 'high' })} Severe harm</span><span>${harmMark({ harm: 'moderate' })} Moderate harm</span><span>Select a box to trace from there</span></p>
    </div>
    <h3 class="h3 tr-h">${listTitle} <span class="tr-count">${list.length}</span></h3>
    <ol class="routes">${list.slice(0, MAX).map((x, i) => routeHtml(x, i, i === st.route)).join('') || '<li class="map-detail__muted">No complete route found.</li>'}</ol>
    ${list.length > MAX ? `<details class="more"><summary>Show ${list.length - MAX} more route${list.length - MAX > 1 ? 's' : ''}</summary><ol class="routes">${list.slice(MAX).map((x, i) => routeHtml(x, i + MAX, false)).join('')}</ol></details>` : ''}
    ${rest > 0 && !st.focus ? `<p class="map-detail__muted">${rest} other route${rest > 1 ? 's' : ''} stop${rest > 1 ? '' : 's'} before ${dir === 'down' ? 'reaching a fusion developer' : 'reaching a harm site'}: the trail goes cold.</p>` : ''}
    <p class="tr-links"><a class="btn-link" href="map.html">See it on the systems map${icon('arrowRight', 'icon icon--sm')}</a> <a class="btn-link" href="solution.html#checker-title">Run the Supplier Check on a buyer${icon('arrowRight', 'icon icon--sm')}</a></p>`;
  st.list = list;
}

function setHash() {
  const h = st.mineral ? `mineral=${st.mineral}` : `${st.dir === 'down' ? 'from' : 'to'}=${st.start}`;
  history.replaceState(null, '', `#${h}${st.focus ? `&focus=${encodeURIComponent(st.focus)}` : ''}`);
}
function go(opts = {}) {
  Object.assign(st, { focus: null, route: 0 }, opts);
  renderSelect(); render(); setHash();
}

/* ---------- matrix ---------- */

const LANES = [
  { id: 'magnets', label: 'Magnets', lanes: ['hts', 'lts'] },
  { id: 'plasma', label: 'Divertor', lanes: ['plasma'] },
  { id: 'blanket', label: 'Blanket', lanes: ['blanket'] },
  { id: 'structure', label: 'Structure', lanes: ['structure'] },
  { id: 'all', label: 'Whole reactor', lanes: null },
];
let mxLane = 'magnets';
function renderMatrix() {
  const L = LANES.find((l) => l.id === mxLane);
  const inLane = (n) => !L.lanes || L.lanes.includes(n.lane);
  const rowsAll = G.M.nodes.filter((n) => UPSTREAM_KINDS.includes(n.kind) && ['high', 'moderate'].includes(n.harm) && inLane(n));
  const rows = rowsAll.map((n) => {
    const best = new Map();
    reach(G, [n.id], 'down').forEach((rank, id) => { const d = G.node(id); if (d?.kind === 'developer' && (!best.has(d.label) || best.get(d.label) < rank)) best.set(d.label, rank); });
    return { n, best };
  }).filter((x) => x.best.size)
    .sort((a, b) => (b.n.harm === 'high') - (a.n.harm === 'high') || Math.max(...b.best.values()) - Math.max(...a.best.values()) || b.best.size - a.best.size);
  const cols = [...new Set(rows.flatMap((x) => [...x.best.keys()]))]
    .sort((a, b) => rows.filter((x) => x.best.has(b)).length - rows.filter((x) => x.best.has(a)).length);
  document.getElementById('mx-table').innerHTML = `
    <caption class="visually-hidden">Strongest route evidence from each harm site to each fusion developer</caption>
    <thead><tr><th scope="col" class="matrix__corner">Harm site</th>${cols.map((c) => `<th scope="col"><span>${esc(c)}</span></th>`).join('')}</tr></thead>
    <tbody>${rows.map(({ n, best }) => `<tr>
      <th scope="row"><button type="button" class="matrix__site" data-from="${esc(n.id)}">${harmMark(n)}<span><span class="matrix__name">${esc(n.label)}</span><span class="matrix__kind">${esc(KIND_LABEL[n.kind])}</span></span></button></th>
      ${cols.map((c) => {
        if (!best.has(c)) return '<td class="matrix__none"><span aria-label="No route found">–</span></td>';
        const k = BY_RANK[best.get(c)];
        return `<td class="matrix__cell matrix__cell--${k}"><button type="button" data-from="${esc(n.id)}" data-dev="${esc(c)}" aria-label="${esc(`${n.label} to ${c}: ${EVIDENCE[k].label}. Open route.`)}">${evGlyph(k, 22)}<span>${esc(EVIDENCE[k].short)}</span></button></td>`;
      }).join('')}
    </tr>`).join('')}</tbody>`;
  document.getElementById('mx-key').innerHTML = `${rows.length} harm sites × ${cols.length} developers. ${harmMark({ harm: 'high' })} Severe harm · ${harmMark({ harm: 'moderate' })} Moderate harm. Cells show the evidence for the strongest route; “–” means no route was found in the records, which is not proof of none.`;
}

/* ---------- gaps ---------- */

function renderGaps() {
  const sev = G.M.nodes.filter((n) => UPSTREAM_KINDS.includes(n.kind) && n.harm === 'high');
  const tally = new Map();
  sev.forEach((s) => {
    routes(G, [s.id], 'down').filter((r) => G.node(r.nodes[r.nodes.length - 1])?.kind === 'developer').forEach((r) => {
      r.edges.filter((e) => e.status === 'inferred' || e.status === 'hypothesis').forEach((e) => {
        const k = `${e.from}>${e.to}`;
        if (!tally.has(k)) tally.set(k, { e, sites: new Set(), devs: new Set() });
        tally.get(k).sites.add(s.label); tally.get(k).devs.add(G.node(r.nodes[r.nodes.length - 1]).label);
      });
    });
  });
  const list = [...tally.values()].sort((a, b) => b.sites.size * 10 + b.devs.size - (a.sites.size * 10 + a.devs.size)).slice(0, 8);
  document.getElementById('gap-list').innerHTML = list.map(({ e, sites, devs }) => `<li class="gap">
    <p class="gap__link">${esc(name(e.from))} ${icon('arrowRight', 'icon icon--sm')} ${esc(name(e.to))} ${evTag(EVIDENCE[e.status].rank)}</p>
    <p class="gap__why">On routes from ${esc([...sites].join(', '))} to ${esc([...devs].join(', '))}.</p>
    ${e.basis ? `<p class="map-detail__muted">${esc(e.basis)}</p>` : ''}
    ${sourceLinks(e.sources, D.sourceIndex)}
  </li>`).join('');
}

/* ---------- boot ---------- */

boot('risk', ['chains', 'map'], (data) => {
  D = data; G = makeGraph(D.map);
  renderMinerals();
  // Read #from=id, #to=id, #mineral=x, &focus=label
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('to') && G.node(p.get('to'))) Object.assign(st, { dir: 'up', start: p.get('to') });
  else if (p.get('from') && G.node(p.get('from'))) Object.assign(st, { dir: 'down', start: p.get('from') });
  else if (p.get('mineral') && D.chains.materials[p.get('mineral')]) Object.assign(st, { dir: 'down', mineral: p.get('mineral') });
  if (p.get('focus')) st.focus = p.get('focus');
  renderSelect(); render();

  document.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
    if (st.dir === b.dataset.dir) return;
    go({ dir: b.dataset.dir, start: DEFAULT[b.dataset.dir], mineral: null });
    announce(b.dataset.dir === 'down' ? 'Tracing downstream.' : 'Tracing upstream.');
  }));
  document.getElementById('tr-start').addEventListener('change', (e) => { if (e.target.value) go({ start: e.target.value, mineral: null }); });
  document.getElementById('tr-minerals').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mineral]'); if (!b) return;
    go({ mineral: st.mineral === b.dataset.mineral ? null : b.dataset.mineral, dir: 'down' });
  });
  const out = document.getElementById('tr-out');
  out.addEventListener('click', (e) => {
    const f = e.target.closest('[data-focus]');
    if (f) { st.focus = st.focus === f.dataset.focus ? null : f.dataset.focus; st.route = 0; render(); setHash(); return; }
    const n = e.target.closest('.tr-node');
    if (n && !startIds().includes(n.dataset.node)) { go({ start: n.dataset.node, mineral: null }); announce(`Tracing from ${name(n.dataset.node)}.`); }
  });
  out.addEventListener('keydown', (e) => {
    const n = e.target.closest('.tr-node');
    if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  out.addEventListener('toggle', (e) => {
    const d = e.target.closest?.('.rt');
    if (d && d.open) {
      st.route = Number(d.dataset.route);
      const hot = st.list[st.route];
      const svgHost = out.querySelector('.tr-scroll');
      const r = reach(G, startIds(), st.dir);
      const sub = new Set([...startIds(), ...r.keys()]);
      const edges = G.edges.filter((x) => sub.has(x.from) && sub.has(x.to) && (st.dir === 'down' ? (startIds().includes(x.from) || r.has(x.from)) : (startIds().includes(x.to) || r.has(x.to))));
      svgHost.innerHTML = diagram(sub, edges, hot);
      out.querySelectorAll('.rt[open]').forEach((o) => { if (o !== d) o.open = false; });
    }
  }, true);

  renderMatrix();
  document.getElementById('mx-lanes').innerHTML = LANES.map((l) => `<button type="button" class="chip" data-mxlane="${l.id}" aria-pressed="${l.id === mxLane}">${esc(l.label)}</button>`).join('');
  document.getElementById('mx-lanes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mxlane]'); if (!b) return;
    mxLane = b.dataset.mxlane;
    document.querySelectorAll('[data-mxlane]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mxlane === mxLane)));
    renderMatrix();
  });
  document.getElementById('mx-table').addEventListener('click', (e) => {
    const b = e.target.closest('[data-from]'); if (!b) return;
    go({ dir: 'down', start: b.dataset.from, mineral: null, focus: b.dataset.dev || null });
    document.getElementById('tracer-h').parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  renderGaps();
});
