import { boot, prefersReducedMotion } from '../core.js';
import { esc, icon } from '../ui.js';
import { makeGraph, developersReached, UPSTREAM_KINDS } from '../reach.js';

// Draw the niobium filaments in the strand cross-section (decorative, deterministic).
function drawFilaments() {
  const g = document.getElementById('filaments');
  if (!g) return;
  const out = [];
  for (let ring = 1; ring <= 4; ring++) {
    const r = ring * 19;
    const n = ring * 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.3;
      out.push(`<circle cx="${(120 + r * Math.cos(a)).toFixed(1)}" cy="${(130 + r * Math.sin(a)).toFixed(1)}" r="5"/>`);
    }
  }
  out.push('<circle cx="120" cy="130" r="9" class="s-sn"/>');
  g.innerHTML = out.join('');
}

/* ---------- Hero: harm sites wired to the fusion developers they could reach ---------- */

function killedAt(H, node) {
  const logged = H.incidents.filter((i) => i.node === node && i.counted !== false).reduce((a, i) => a + (i.killed || 0), 0);
  const agg = H.siteTotals.find((t) => t.node === node && t.aggregate);
  return Math.max(logged, agg ? agg.killed_min || 0 : 0);
}

async function heroMap(D, G) {
  const H = D.human, M = D.map;
  const svg = d3.select('#hero-map');
  const W = 1000, Hh = 500;
  let world = { type: 'FeatureCollection', features: [] };
  try {
    const topo = await d3.json('vendor/countries-110m.json');
    world = topojson.feature(topo, topo.objects.countries);
    world.features = world.features.filter((f) => f.properties.name !== 'Antarctica');
  } catch (e) { /* map still draws routes without land */ }
  const proj = d3.geoNaturalEarth1().fitExtent([[10, 10], [W - 10, Hh + 50]], world.features.length ? world : { type: 'Sphere' });
  const path = d3.geoPath(proj);
  const at = new Map(H.coords.map((c) => [c.node, proj([c.lon, c.lat])]));
  const node = (id) => G.node(id);
  const devAt = (d) => at.get(d.id) || [...at.entries()].find(([id]) => node(id)?.kind === 'developer' && node(id).label === d.label)?.[1];

  const sites = H.coords.map((c) => node(c.node)).filter((n) => n && UPSTREAM_KINDS.includes(n.kind) && ['high', 'moderate'].includes(n.harm));
  const arcs = [];
  sites.forEach((n) => developersReached(G, [n.id]).forEach((d) => {
    const a = at.get(n.id), b = devAt(d);
    if (a && b) arcs.push({ a, b, rank: d.rank, from: n.label, to: d.label });
  }));
  const killed = new Map(sites.map((n) => [n.id, killedAt(H, n.id)]));
  const r = d3.scaleSqrt().domain([0, d3.max([...killed.values()]) || 1]).range([4, 20]);
  const devIds = new Set(M.nodes.filter((n) => n.kind === 'developer').map((n) => n.id));

  svg.append('path').attr('class', 'hm-grat').attr('d', path(d3.geoGraticule10()));
  svg.append('g').attr('class', 'hm-land').selectAll('path').data(world.features).join('path').attr('d', path);
  const curve = ({ a, b }) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.28;
    return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  };
  const ga = svg.append('g').attr('class', 'hm-arcs');
  ga.selectAll('path.hm-arc').data(arcs).join('path')
    .attr('class', (d) => `hm-arc${d.rank >= 2 ? ' hm-arc--strong' : ''}`).attr('d', curve)
    .append('title').text((d) => `${d.from} → ${d.to}`);
  if (!prefersReducedMotion()) {
    ga.selectAll('path.hm-pulse').data(arcs).join('path').attr('class', 'hm-pulse').attr('d', curve)
      .style('animation-delay', (d, i) => `${(i * 0.37) % 4}s`);
  }
  // Developers: blue squares.
  const devs = [...devIds].map((id) => ({ id, xy: at.get(id), n: node(id) })).filter((d) => d.xy);
  svg.append('g').selectAll('rect').data(devs).join('rect').attr('class', 'hm-dev')
    .attr('x', (d) => d.xy[0] - 5).attr('y', (d) => d.xy[1] - 5).attr('width', 10).attr('height', 10)
    .append('title').text((d) => `${d.n.label} (fusion developer)`);
  // Harm sites: solid = severe, ring = moderate, sized by people killed.
  const gs = svg.append('g').selectAll('g').data(sites.filter((n) => at.get(n.id)).sort((a, b) => killed.get(b.id) - killed.get(a.id))).join('g')
    .attr('transform', (n) => `translate(${at.get(n.id)})`).attr('class', (n) => `hm-site hm-site--${n.harm}`);
  gs.filter((n) => n.harm === 'high' && !prefersReducedMotion()).append('circle').attr('class', 'hm-ping').attr('r', (n) => r(killed.get(n.id)));
  gs.append('circle').attr('class', 'hm-dot').attr('r', (n) => r(killed.get(n.id)));
  gs.append('title').text((n) => `${n.label}: ${killed.get(n.id) ? `at least ${killed.get(n.id)} killed` : 'documented harm'}`);
  // Label the three deadliest sites, plus the main fusion hubs.
  const lab = sites.filter((n) => at.get(n.id)).sort((a, b) => killed.get(b.id) - killed.get(a.id)).slice(0, 3);
  svg.append('g').selectAll('text').data(lab).join('text').attr('class', 'hm-label')
    .attr('x', (n) => at.get(n.id)[0] + r(killed.get(n.id)) + 6).attr('y', (n) => at.get(n.id)[1] + 4)
    .text((n) => `${n.label.replace(/ \(.*\)/, '')} · ${killed.get(n.id)} killed`);
  // Count every harm site in the graph (not only those with map coordinates), matching the risk tracer's matrix.
  const all = M.nodes.filter((n) => UPSTREAM_KINDS.includes(n.kind) && ['high', 'moderate'].includes(n.harm)).map((n) => developersReached(G, [n.id]).length).filter(Boolean);
  return { arcs: all.reduce((x, y) => x + y, 0), sites: all.length };
}

function heroFacts(D, G, mapStats) {
  const H = D.human;
  const nodesHit = [...new Set(H.incidents.map((i) => i.node))];
  const killed = nodesHit.reduce((a, n) => a + killedAt(H, n), 0);
  const y0 = Math.min(...H.incidents.filter((i) => i.killed && i.counted !== false).map((i) => i.year).filter(Boolean));
  const proven = D.scores.routes.filter((r) => r.evidence.link === 'documented').length;
  // Largest share of world supply that the published fusion-company plans would need.
  const E = H.exposure;
  const sc = E.scenarios.find((s) => s.id === 'claims') || E.scenarios[0];
  const dev = E.devices.find((d) => d.id === sc.device);
  const share = Math.max(...Object.entries(dev.materials).filter(([m]) => E.world[m]).map(([m, v]) => (v.kg * sc.plants) / 1000 / E.world[m].t * 100));
  const facts = [
    { v: `${killed.toLocaleString('en-GB')}+`, k: `people killed at the mines and plants in these supply chains since ${y0}`, href: 'human-cost.html', cta: 'See the human cost', accent: true },
    { v: `${mapStats.sites}`, k: `places with documented harm that could feed a fusion developer, through ${mapStats.arcs} routes`, href: 'risk.html', cta: 'Trace the routes' },
    { v: `${proven} of ${D.scores.routes.length}`, k: 'supply routes where the link from a harmful mine into fusion is proven. The trail goes cold at the processors.', href: 'scores.html', cta: 'See the scores' },
    { v: share < 1 ? 'under 1%' : `${share.toPrecision(2)}%`, k: `of any metal's world supply needed even for ${sc.plants} pilot plants: small enough to fix before it scales`, href: 'solution.html', cta: 'See the fix' },
  ];
  document.getElementById('hero-facts').innerHTML = facts.map((f) => `<li><a class="hero-fact${f.accent ? ' hero-fact--accent' : ''}" href="${f.href}">
    <span class="hero-fact__v">${esc(f.v)}</span><span class="hero-fact__k">${esc(f.k)}</span><span class="hero-fact__cta">${esc(f.cta)}${icon('arrowRight', 'icon icon--sm')}</span></a></li>`).join('');
}

boot('home', ['background', 'scores', 'map', 'human'], async (D) => {
  drawFilaments();
  const G = makeGraph(D.map);
  let stats = { arcs: 0, sites: 0 };
  try {
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') throw new Error('map library did not load');
    stats = await heroMap(D, G);
  } catch (e) {
    console.warn('hero map', e);
    document.querySelector('.hero__maplink').innerHTML = '<p class="hero__mapfail">The map could not load. Refresh the page, or open the risk tracer to see every route.</p>';
  }
  heroFacts(D, G, stats);
  const proven = D.scores.routes.filter((r) => r.evidence.link === 'documented').length;
  const el = document.getElementById('stat-proven');
  if (el) el.textContent = `${proven} of ${D.scores.routes.length}`;
  document.getElementById('glossary-list').innerHTML = D.background.glossary
    .map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.def)}</dd></div>`).join('');
});
