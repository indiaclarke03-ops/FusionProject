// Systems map: the fusion magnet supply chain as one network, mine (left) to fusion developer (right).
import { boot, announce } from '../core.js';
import { icon, esc, sourceLinks, SCALE } from '../ui.js';
import { initTrace, onLensChange, openMaterial, state } from '../trace.js';
import { makeGraph, reach, developersReached, harmUpstream, rankLabel } from '../reach.js';

let D, M, G;
const ui = { lane: 'magnets', policy: false, solution: false, selected: null, view: 'map' };

const COL_W = 230, NODE_W = 184, NODE_H = 58, ROW_H = 74, TOP = 64, LANE_GAP = 34, LEFT = 24;
const POLICY_H = 54;

const STATUS = {
  confirmed: { label: 'Confirmed record', dash: '', width: 2.2 },
  reported: { label: 'Reported by a credible source', dash: '', width: 1.4 },
  inferred: { label: 'Inferred from market structure or a model', dash: '6 5', width: 1.4 },
  hypothesis: { label: 'Hypothesis, untested', dash: '2 5', width: 1.4 },
};

const SOLUTION = {
  screening: 'Supplier screening (corporate, sanctions and customs data)',
  passport: 'Batch passport (chain-of-custody record)',
  fingerprint: 'Origin fingerprinting (laboratory test)',
  satellite: 'Satellite monitoring of mine sites',
  grievance: 'Worker and community grievance channel',
  funding: 'Conditions on public funding',
};

function lensColour(n) {
  const key = state.lens === 'security' ? (n.supply || 'unknown') : (n.harm === 'none' ? 'unknown' : (n.harm || 'unknown'));
  return (SCALE[state.lens][key] || SCALE[state.lens].unknown).colour;
}

function visibleNodes() {
  return M.nodes.filter((n) => {
    if (n.kind === 'policy') return ui.policy;
    return laneVisible(n.lane);
  });
}

// Lay out nodes on a grid: one column per stage, one band per lane (labelled above the band).
const LABEL_H = 26;
function layout(nodes) {
  const pos = new Map();
  const totalW = LEFT * 2 + (M.stages.length - 1) * COL_W + NODE_W;
  const pol = nodes.filter((n) => n.kind === 'policy');
  const perRow = Math.max(1, Math.floor((totalW - LEFT * 2 + 16) / (NODE_W + 16)));
  const polRows = Math.ceil(pol.length / perRow);
  pol.forEach((n, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    pos.set(n.id, { x: LEFT + c * (NODE_W + 16), y: TOP + LABEL_H + r * ROW_H });
  });
  const lanes = M.lanes.filter((l) => l.id !== 'shared' && laneVisible(l.id));
  let y = TOP + (pol.length ? LABEL_H + polRows * ROW_H + LANE_GAP : 0);
  const bands = pol.length ? [{ lane: { label: 'Rules and levers' }, y: TOP, h: LABEL_H + polRows * ROW_H - 10, policy: true }] : [];
  lanes.forEach((lane) => {
    const inLane = nodes.filter((n) => n.lane === lane.id && n.kind !== 'policy');
    if (!inLane.length) return;
    const perStage = {};
    inLane.forEach((n) => { (perStage[n.stage] = perStage[n.stage] || []).push(n); });
    const rows = Math.max(...Object.values(perStage).map((a) => a.length));
    const top = y + LABEL_H;
    Object.entries(perStage).forEach(([stage, arr]) => {
      const offset = ((rows - arr.length) * ROW_H) / 2;
      arr.forEach((n, i) => pos.set(n.id, { x: LEFT + Number(stage) * COL_W, y: top + offset + i * ROW_H }));
    });
    bands.push({ lane, y, h: LABEL_H + rows * ROW_H - 10 });
    y = top + rows * ROW_H + LANE_GAP;
  });
  return { pos, bands, width: totalW, height: y };
}

function laneVisible(id) {
  if (ui.lane === 'all') return true;
  if (ui.lane === 'magnets') return id === 'hts' || id === 'lts';
  return id === ui.lane;
}

function wrapLabel(text, max = 21) {
  const words = String(text).split(/\s+/);
  const lines = [''];
  words.forEach((w) => {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w); else lines[lines.length - 1] = (cur + ' ' + w).trim();
  });
  if (lines.length > 2) { lines.length = 2; lines[1] = lines[1].replace(/.{0,2}$/, '…'); }
  return lines;
}

function renderMap() {
  const nodes = visibleNodes();
  const ids = new Set(nodes.map((n) => n.id));
  const edges = M.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  const { pos, bands, width, height } = layout(nodes);
  // When a box is selected, keep everything upstream and downstream of it lit and dim the rest.
  const sel = ui.selected && !ui.selected.startsWith('e') && M.nodes.find((n) => n.id === ui.selected)?.kind !== 'policy' ? ui.selected : null;
  const related = sel ? new Set([sel, ...reach(G, [sel], 'down').keys(), ...reach(G, [sel], 'up').keys()]) : null;
  const svg = document.getElementById('map-svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);


  const cols = M.stages.map((s, i) => `<text class="m-col" x="${LEFT + i * COL_W}" y="30">${esc(s)}</text>`).join('');
  const laneBands = bands.map((b) => `
    <rect class="m-band${b.policy ? ' m-band--policy' : ''}" x="0" y="${b.y - 4}" width="${width}" height="${b.h + 8}"/>
    <text class="m-lane" x="${LEFT}" y="${b.y + 14}">${esc(b.lane.label)}</text>`).join('');
  const polBand = '';

  const edgeSvg = edges.map((e, i) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    const st = STATUS[e.status] || STATUS.inferred;
    let d;
    const pol = M.nodes.find((n) => n.id === e.from)?.kind === 'policy';
    if (pol) {
      const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H, x2 = b.x + NODE_W / 2, y2 = b.y;
      d = `M${x1} ${y1} C${x1} ${y1 + 60} ${x2} ${y2 - 60} ${x2} ${y2}`;
    } else {
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
      const dx = Math.max(40, (x2 - x1) / 2);
      d = `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
    }
    const hotE = ui.selected && (ui.selected === `e${i}` || ui.selected === e.from || ui.selected === e.to);
    const rel = related ? (related.has(e.from) && related.has(e.to) && !pol ? ' is-reach' : ' is-dim') : '';
    return `<g class="m-edge m-edge--${esc(e.status)}${pol ? ' m-edge--policy' : ''}${hotE ? ' is-hot' : ''}${rel}" data-edge="${i}" tabindex="-1">
      <path class="m-edge__hit" d="${d}"/>
      <path class="m-edge__line" d="${d}" stroke-dasharray="${st.dash}" stroke-width="${st.width}" marker-end="url(#arrow)"/>
    </g>`;
  }).join('');

  const nodeSvg = nodes.map((n) => {
    const p = pos.get(n.id);
    const nFlags = (n.blending ? 1 : 0) + ((n.flags || []).includes('sanctioned') ? 1 : 0);
    const lines = wrapLabel(n.label, nFlags ? 18 - nFlags : 21);
    const colour = n.kind === 'policy' ? '#8B7BC9' : lensColour(n);
    const sel = ui.selected === n.id;
    const dim = related && !related.has(n.id) ? ' is-dim' : '';
    const flags = [
      n.blending ? `<g transform="translate(${NODE_W - 22} 6)" class="m-flag"><title>Blending point</title><path d="M3 9a6 6 0 0 0 6 6M3 3v12M15 15a3 3 0 1 1 0-.01M3 3a3 3 0 1 1 0-.01" transform="scale(.8)"/></g>` : '',
      (n.flags || []).includes('sanctioned') ? `<g transform="translate(${NODE_W - (n.blending ? 40 : 22)} 6)" class="m-flag m-flag--warn"><title>Sanctioned or sanctions-linked</title><path d="m10.9 13.5-4-7a1 1 0 0 0-1.8 0l-4 7A1 1 0 0 0 2 15h8a1 1 0 0 0 .9-1.5Z M6 7.5v2.5 M6 12h.01" transform="scale(1.1)"/></g>` : '',
    ].join('');
    const sol = ui.solution && (n.solution || []).length
      ? `<g class="m-sol" transform="translate(4 ${NODE_H - 4})">${n.solution.map((s, i) => `<circle cx="${8 + i * 14}" cy="0" r="5.5"><title>${esc(SOLUTION[s] || s)}</title></circle>`).join('')}</g>` : '';
    return `<g class="m-node m-node--${esc(n.kind)}${sel ? ' is-selected' : ''}${dim}" data-node="${esc(n.id)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(n.label)}${n.country ? `, ${esc(n.country)}` : ''}. Show details.">
      <rect class="m-node__box" width="${NODE_W}" height="${NODE_H}" rx="3"/>
      <rect class="m-node__bar" width="5" height="${NODE_H}" fill="${colour}"/>
      <text class="m-node__label" x="14" y="${lines.length > 1 ? 23 : 31}">${lines.map((l, i) => `<tspan x="14" dy="${i ? 16 : 0}">${esc(l)}</tspan>`).join('')}</text>
      ${n.country ? `<text class="m-node__cc" x="14" y="${NODE_H - 8}">${esc(n.country)}</text>` : ''}
      ${flags}${sol}
    </g>`;
  }).join('');

  svg.innerHTML = `
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="m-arrow"/></marker></defs>
    ${laneBands}${polBand}${cols}<g class="m-edges">${edgeSvg}</g><g class="m-nodes">${nodeSvg}</g>`;

  renderList(nodes, edges);
}

function renderList(nodes, edges) {
  const host = document.getElementById('map-list');
  const byStage = M.stages.map((label, i) => ({ label, nodes: nodes.filter((n) => n.kind !== 'policy' && Number(n.stage) === i) }));
  const pol = nodes.filter((n) => n.kind === 'policy');
  const item = (n) => {
    const outs = edges.filter((e) => e.from === n.id).map((e) => M.nodes.find((x) => x.id === e.to)?.label).filter(Boolean);
    return `<li><button type="button" class="map-list__btn" data-node="${esc(n.id)}"><span class="swatch" style="background:${n.kind === 'policy' ? '#8B7BC9' : lensColour(n)}"></span><span><strong>${esc(n.label)}</strong>${n.country ? ` · ${esc(n.country)}` : ''}${outs.length ? `<span class="map-list__to">→ ${esc(outs.join(', '))}</span>` : ''}</span></button></li>`;
  };
  host.innerHTML = (pol.length ? `<h3 class="map-list__h">Rules and levers</h3><ul>${pol.map(item).join('')}</ul>` : '')
    + byStage.filter((s) => s.nodes.length).map((s) => `<h3 class="map-list__h">${esc(s.label)}</h3><ul>${s.nodes.map(item).join('')}</ul>`).join('');
}

function nodeDetail(n) {
  const isPol = (id) => M.nodes.find((x) => x.id === id)?.kind === 'policy';
  const rules = M.edges.filter((e) => e.to === n.id && isPol(e.from));
  const ins = M.edges.filter((e) => e.to === n.id && !isPol(e.from));
  const outs = M.edges.filter((e) => e.from === n.id);
  const name = (id) => esc(M.nodes.find((x) => x.id === id)?.label || id);
  const flow = (e, dir) => `<li class="flow flow--${esc(e.status)}">
      <p class="flow__route">${dir === 'in' ? `${name(e.from)} ${icon('arrowRight', 'icon icon--sm')} here` : `here ${icon('arrowRight', 'icon icon--sm')} ${name(e.to)}`}</p>
      <p class="flow__what">${esc(e.label || '')}${e.basis ? ` · ${esc(e.basis)}` : ''}</p>
      <p class="flow__status"><span class="flow__key"></span>${esc((STATUS[e.status] || STATUS.inferred).label)}</p>
      ${sourceLinks(e.sources, D.sourceIndex)}
    </li>`;
  const harmLabel = n.kind === 'policy' ? '' : `<p class="map-detail__rating"><span class="swatch" style="background:${lensColour(n)}"></span>${esc(state.lens === 'security' ? SCALE.security[n.supply || 'unknown'].label : SCALE.people[n.harm === 'none' || !n.harm ? 'unknown' : n.harm].label)}</p>`;
  const mats = (n.materials || []).filter((m) => D.chains.materials[m]);
  const sol = (n.solution || []).length ? `<div class="map-detail__sol"><p class="map-detail__k">Where the solution acts</p><ul>${n.solution.map((s) => `<li>${esc(SOLUTION[s] || s)}</li>`).join('')}</ul><a class="btn-link" href="solution.html">See the solution${icon('arrowRight', 'icon icon--sm')}</a></div>` : '';
  return `
    <p class="map-detail__kind">${esc(KIND_LABEL[n.kind] || n.kind)}${n.country ? ` · ${esc(n.country)}` : ''}</p>
    <h2 class="map-detail__title">${esc(n.label)}</h2>
    ${harmLabel}
    ${n.harmNote ? `<p>${esc(n.harmNote)}</p>` : ''}
    ${n.supplyNote && state.lens === 'security' ? `<p class="map-detail__muted">${esc(n.supplyNote)}</p>` : ''}
    ${n.blending ? `<p class="blend">${icon('merge', 'icon icon--sm')}<span><strong>Blending point.</strong> Material from different sources is mixed here and traceability breaks.</span></p>` : ''}
    ${sourceLinks(n.sources, D.sourceIndex)}
    ${n.sayari_url ? `<p class="map-detail__sayari"><a href="${esc(n.sayari_url)}" target="_blank" rel="noopener">Open in Sayari${icon('external', 'icon icon--sm')}</a></p>` : ''}
    ${ins.length ? `<p class="map-detail__k">Comes from</p><ul class="flows">${ins.map((e) => flow(e, 'in')).join('')}</ul>` : ''}
    ${outs.length ? `<p class="map-detail__k">${n.kind === 'policy' ? 'Acts on' : 'Goes to'}</p><ul class="flows">${outs.map((e) => flow(e, 'out')).join('')}</ul>` : ''}
    ${rules.length ? `<p class="map-detail__k">Rules acting on it</p><ul class="flows">${rules.map((e) => `<li class="flow flow--rule"><p class="flow__route">${name(e.from)}</p><p class="flow__what">${esc(e.label || '')}${e.basis ? ` · ${esc(e.basis)}` : ''}</p>${sourceLinks(e.sources, D.sourceIndex)}</li>`).join('')}</ul>` : ''}
    ${n.kind === 'policy' ? '' : reachBlock(n)}
    ${sol}
    ${mats.length ? `<div class="map-detail__ctas">${mats.map((m) => `<button type="button" class="btn btn--ghost btn--sm" data-trace="${esc(m)}">Trace ${esc(D.chains.materials[m].name.toLowerCase())}</button>`).join('')}<a class="btn-link" href="cases.html#${esc(mats[0])}">Case file${icon('arrowRight', 'icon icon--sm')}</a></div>` : ''}`;
}

// Upstream and downstream reach of a box, graded by the weakest link on the strongest route.
function reachBlock(n) {
  const link = (dir) => `<a class="btn-link" href="risk.html#${dir}=${encodeURIComponent(n.id)}">Open in the risk tracer${icon('arrowRight', 'icon icon--sm')}</a>`;
  if (n.kind === 'developer') {
    const h = harmUpstream(G, n.id);
    return `<div class="reach"><p class="reach__h">Harm sites upstream</p>${h.length ? `<ul>${h.slice(0, 8).map((x) => `<li><span><span class="swatch" style="background:${SCALE.people[x.n.harm].colour}"></span>${esc(x.n.label)}</span><span class="evtag">${esc(rankLabel(x.rank).short)}</span></li>`).join('')}</ul>${h.length > 8 ? `<p class="map-detail__muted">and ${h.length - 8} more</p>` : ''}` : '<p class="map-detail__muted">None found in the records.</p>'}${link('to')}</div>`;
  }
  const devs = developersReached(G, [n.id]);
  const h = harmUpstream(G, n.id);
  return `<div class="reach"><p class="reach__h">Could reach these fusion developers</p>${devs.length ? `<ul>${devs.map((d) => `<li><span>${esc(d.label)}</span><span class="evtag">${esc(rankLabel(d.rank).short)}</span></li>`).join('')}</ul>` : '<p class="map-detail__muted">No route to a fusion developer found in the records.</p>'}
    ${h.length ? `<p class="reach__h">Harm sites upstream of it</p><p class="map-detail__muted">${esc(h.map((x) => x.n.label).join(', '))}</p>` : ''}
    <p class="map-detail__muted">Graded by the weakest link on the strongest route. Lit on the map: everything upstream and downstream.</p>${link(devs.length || n.kind === 'mine' ? 'from' : 'to')}</div>`;
}

const KIND_LABEL = {
  mine: 'Mine or source region', trader: 'Trader or export hub', separator: 'Rare earth separator', smelter: 'Smelter',
  refiner: 'Refiner', alloy: 'Metal or alloy maker', component: 'Tape, wire or part maker', magnet: 'Magnet or coil maker',
  developer: 'Fusion developer', policy: 'Rule or lever',
};

function select(id) {
  ui.selected = id;
  const detail = document.getElementById('map-detail');
  if (id && id.startsWith('e')) {
    const e = M.edges[Number(id.slice(1))];
    detail.innerHTML = nodeDetail(M.nodes.find((n) => n.id === e.from));
  } else if (id) {
    const n = M.nodes.find((x) => x.id === id);
    detail.innerHTML = nodeDetail(n);
    announce(`${n.label} selected.`);
  }
  renderMap();
  if (window.matchMedia('(max-width: 1100px)').matches && id) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLaneFilter() {
  const lanes = [{ id: 'magnets', label: 'Both magnet chains' }, ...M.lanes.filter((l) => l.id !== 'shared'), { id: 'all', label: 'Whole reactor' }];
  const host = document.getElementById('lane-filter');
  host.innerHTML = lanes.map((l) => `<button type="button" class="chip" data-lane="${esc(l.id)}" aria-pressed="${ui.lane === l.id}">${esc(l.short || l.label)}</button>`).join('');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lane]');
    if (!b) return;
    ui.lane = b.dataset.lane;
    host.querySelectorAll('[data-lane]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lane === ui.lane)));
    renderMap();
  });
}

function renderLegend() {
  document.getElementById('map-legend').innerHTML = `
    <div><p class="map-legend__h">Lines: how strong the evidence is</p><ul>
      ${Object.entries(STATUS).map(([k, s]) => `<li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" class="m-edge__line" stroke-dasharray="${s.dash}" stroke-width="${s.width}"/></svg>${esc(s.label)}</li>`).join('')}
    </ul></div>
    <div><p class="map-legend__h">Box colour: ${state.lens === 'security' ? 'supply risk' : 'documented harm'}</p><ul>
      ${(state.lens === 'security' ? ['high', 'moderate', 'low'] : ['high', 'moderate', 'unknown']).map((k) => `<li><span class="swatch" style="background:${SCALE[state.lens][k].colour}"></span>${esc(SCALE[state.lens][k].label)}</li>`).join('')}
      <li><span class="swatch" style="background:#8B7BC9"></span>Rule or lever</li>
    </ul></div>
    <div><p class="map-legend__h">Markers</p><ul>
      <li>${icon('merge', 'icon icon--sm')}Blending point: origin is lost here</li>
      <li>${icon('alert', 'icon icon--sm')}Sanctioned, or trades directly with a sanctioned party</li>
      <li><span class="legend-dot"></span>Where the solution acts (switch on above)</li>
    </ul></div>`;
}

boot('map', ['parts', 'chains', 'map'], (data) => {
  D = data; M = D.map; G = makeGraph(M);
  initTrace(D);
  renderLaneFilter();
  renderLegend();
  renderMap();
  document.getElementById('map-insights').innerHTML = (M.insights || []).map((t) => `<li>${esc(t)}</li>`).join('');
  onLensChange(() => { renderMap(); renderLegend(); if (ui.selected) select(ui.selected); });

  const canvas = document.getElementById('map-canvas');
  canvas.addEventListener('click', (e) => {
    const n = e.target.closest('[data-node]');
    const ed = e.target.closest('[data-edge]');
    if (n) select(n.dataset.node); else if (ed) select(`e${ed.dataset.edge}`);
  });
  canvas.addEventListener('keydown', (e) => {
    const n = e.target.closest('[data-node]');
    if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(n.dataset.node); }
  });
  document.getElementById('map-detail').addEventListener('click', (e) => {
    const b = e.target.closest('[data-trace]');
    if (b) openMaterial(b.dataset.trace, b);
  });
  document.getElementById('show-policy').addEventListener('change', (e) => { ui.policy = e.target.checked; renderMap(); });
  document.getElementById('show-solution').addEventListener('change', (e) => { ui.solution = e.target.checked; renderMap(); });
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    ui.view = b.dataset.view;
    document.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === ui.view)));
    document.querySelector('.map-scroll').hidden = ui.view !== 'map';
    document.querySelector('.map-hint').hidden = ui.view !== 'map';
    document.getElementById('map-list').hidden = ui.view !== 'list';
  }));

  // map.html#tin filters to that material's lane and highlights its mine.
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    const first = M.nodes.find((n) => (n.materials || []).includes(hash) && n.stage === 0) || M.nodes.find((n) => (n.materials || []).includes(hash));
    if (first) {
      if (!laneVisible(first.lane)) { ui.lane = first.lane; document.querySelectorAll('[data-lane]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lane === ui.lane))); }
      select(first.id);
    }
  }
});
