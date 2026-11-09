// The solution page and the Supplier Check prototype.
import { boot } from '../core.js';
import { icon, esc, sourceLinks, SCALE } from '../ui.js';

let D, M, S;
const SEV = {
  stop: { label: 'Stop and escalate', colour: '#E55F53', rank: 4 },
  high: { label: 'High risk', colour: '#DD996F', rank: 3 },
  medium: { label: 'Medium risk', colour: '#B78024', rank: 2 },
  low: { label: 'Low risk', colour: '#8E8A82', rank: 1 },
};
const node = (id) => M.nodes.find((n) => n.id === id);

// Every upstream path from a node back towards the mines (supply edges only).
function upstreamPaths(id, seen = new Set()) {
  const ins = M.edges.filter((e) => e.to === id && node(e.from)?.kind !== 'policy' && !seen.has(e.from));
  if (!ins.length) return [[{ id }]];
  const out = [];
  ins.forEach((e) => {
    const next = new Set(seen); next.add(id);
    upstreamPaths(e.from, next).forEach((p) => out.push([...p, { id, via: e }]));
  });
  return out;
}

// Which rules fire, and on which upstream nodes.
function evaluate(supplierId) {
  const paths = upstreamPaths(supplierId).filter((p) => p.length > 1);
  const ups = new Map();
  paths.forEach((p) => p.forEach((step) => { if (step.id !== supplierId) ups.set(step.id, step); }));
  const self = node(supplierId);
  const nodesUp = [...ups.keys()].map(node).filter(Boolean);
  const hits = {};
  const add = (k, n) => { (hits[k] = hits[k] || new Set()).add(n.label); };
  [self, ...nodesUp].forEach((n) => {
    const f = n.flags || [];
    if (f.includes('sanctioned')) add('sanctioned', n);
    if (n.blending) add('blending', n);
    if (f.includes('conflict')) add('conflict', n);
    if (f.includes('extreme')) add('extreme', n);
    if (f.includes('soe')) add('soe', n);
    if (f.includes('modelled')) add('modelled', n);
  });
  const incoming = M.edges.filter((e) => e.to === supplierId && node(e.from)?.kind !== 'policy');
  if (!incoming.length || incoming.every((e) => e.status === 'hypothesis')) add('opaque', self);
  const weakLinks = paths.flat().filter((s) => s.via && ['inferred', 'hypothesis'].includes(s.via.status)).length;
  if (weakLinks && !hits.opaque) add('opaque', { label: `${weakLinks} upstream link${weakLinks > 1 ? 's' : ''} rest only on inference or hypothesis` });
  const rules = S.rules.filter((r) => hits[r.trigger]).map((r) => ({ ...r, where: [...hits[r.trigger]] }))
    .sort((a, b) => SEV[b.severity].rank - SEV[a.severity].rank);
  return { paths, rules, nodesUp, self };
}

function pathHtml(p) {
  return `<li class="path">${p.map((s, i) => {
    const n = node(s.id);
    const harm = n.harm && n.harm !== 'none' ? n.harm : 'unknown';
    const sep = s.via ? `<span class="path__sep path__sep--${esc(s.via.status)}" title="${esc(s.via.status)}: ${esc(s.via.basis || s.via.label || '')}">${s.via.status === 'confirmed' ? '→' : '⇢'}</span>` : '';
    return `${i ? sep : ''}<span class="path__node"><span class="swatch" style="background:${SCALE.people[harm].colour}"></span>${esc(n.label)}</span>`;
  }).join('')}</li>`;
}

function passport(res) {
  const byKind = (kinds) => res.nodesUp.filter((n) => kinds.includes(n.kind));
  const known = (arr) => arr.length ? `<span class="known">${esc(arr.map((n) => n.label).join('; '))}</span>` : '<span class="unknown">Unknown: not in any record found</span>';
  const confirmedMine = res.paths.some((p) => node(p[0].id).kind === 'mine' && p.every((s) => !s.via || s.via.status === 'confirmed'));
  const rows = [
    ['Supplier', `<span class="known">${esc(res.self.label)}</span>`],
    ['Separator or smelter', known(byKind(['separator', 'smelter', 'refiner']))],
    ['Traders or export hubs', known(byKind(['trader']))],
    ['Mine or region of origin', known(byKind(['mine']))],
    ['Origin proven by records end to end?', confirmedMine ? '<span class="known">Yes</span>' : '<span class="unknown">No: at least one link is reported, inferred or a hypothesis</span>'],
    ['Origin verified by lab fingerprint', '<span class="unknown">Not yet: no fingerprinting programme exists for these materials</span>'],
    ['Sanctions screening', res.rules.some((r) => r.trigger === 'sanctioned') ? '<span class="unknown">Sanctioned party in or next to the chain</span>' : '<span class="known">No sanctioned party found upstream</span>'],
  ];
  return `<div class="passport"><p class="checker__h">What a magnet passport for this supplier would record today</p><table><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>`;
}

function runCheck(id) {
  const res = evaluate(id);
  const top = res.rules[0];
  const sev = top ? SEV[top.severity] : SEV.low;
  const verdictText = top
    ? `${res.rules.length} risk${res.rules.length > 1 ? 's' : ''} found upstream. Highest: ${esc(top.label)}.`
    : 'No rule fired on the evidence available. That is not proof of a clean chain.';
  document.getElementById('checker-out').innerHTML = `
    <div class="verdict" style="--v-colour:${sev.colour}">
      <div><p class="verdict__level">${esc(top ? sev.label : 'No flags')}</p><p>${verdictText}</p></div>
    </div>
    <div class="checker__cols">
      <div>
        <p class="checker__h">What to do</p>
        <ol class="actions">${res.rules.map((r) => `<li class="action" style="--a-colour:${SEV[r.severity].colour}">
          <p class="action__sev">${esc(SEV[r.severity].label)}</p>
          <p class="action__trigger">${esc(r.label)}</p>
          <p class="action__why">Found at: ${esc(r.where.join('; '))}</p>
          <p class="action__do">${esc(r.action)}</p>
          <p class="action__why">${esc(r.why)}</p>
          ${sourceLinks(r.sources, D.sourceIndex)}
        </li>`).join('') || '<li class="action"><p class="action__do">Request the supplier\'s smelter or separator list and origin declarations anyway: absence of flags here reflects data gaps as much as low risk.</p></li>'}</ol>
      </div>
      <div>
        <p class="checker__h">Upstream paths found (${res.paths.length})</p>
        <ul class="paths">${res.paths.slice(0, 12).map(pathHtml).join('') || '<li class="path">No upstream supplier recorded.</li>'}</ul>
        <p class="action__why">→ confirmed record · ⇢ reported, inferred or hypothesis. Colours show documented harm.</p>
      </div>
    </div>
    ${passport(res)}
    <p class="action__why">Built on this site's evidence (as of the last update). A live version would query Sayari directly. <a href="map.html">See the full systems map</a>.</p>`;
}

function renderPage() {
  document.getElementById('sol-title').textContent = S.name + ': ' + S.headline;
  document.getElementById('sol-tagline').textContent = S.tagline;
  document.getElementById('sol-problem').textContent = S.problem;
  document.getElementById('sol-components').innerHTML = S.components.map((c, i) => `
    <li class="sol-comp">
      <p class="sol-comp__n">${String(i + 1).padStart(2, '0')}</p>
      <p class="sol-comp__name">${esc(c.name)}</p>
      <p>${esc(c.what)}</p>
      <dl>
        <div><dt>Evidence it works</dt><dd>${esc(c.evidence)}</dd></div>
        <div><dt>Limits</dt><dd>${esc(c.limits)}</dd></div>
      </dl>
      ${sourceLinks(c.sources, D.sourceIndex)}
    </li>`).join('');
  const flow = document.getElementById('sol-flow');
  flow.style.setProperty('--n', S.steps.length);
  flow.innerHTML = S.steps.map((s) => `<li><p class="sol-flow__step">${esc(s.step)}</p><p>${esc(s.what)}</p><p class="sol-flow__who">${esc(s.who)}</p>${s.tech ? `<p class="sol-flow__tech">${esc(s.tech)}</p>` : ''}</li>`).join('');
  document.getElementById('sol-test').textContent = S.sayariTest;
  document.getElementById('sol-costs').textContent = S.costs;
  document.getElementById('sol-pays').textContent = S.whoPays;
  document.getElementById('sol-now').textContent = S.caseForNow;
  document.getElementById('sol-limits').innerHTML = S.limitations.map((l) => `<li>${esc(l)}</li>`).join('');
  document.getElementById('sol-sources').innerHTML = sourceLinks(S.sources, D.sourceIndex);

  const options = M.nodes.filter((n) => ['component', 'magnet', 'developer', 'smelter', 'separator', 'alloy', 'refiner', 'trader'].includes(n.kind))
    .sort((a, b) => b.stage - a.stage || a.label.localeCompare(b.label));
  const groups = {};
  options.forEach((n) => { (groups[n.stage] = groups[n.stage] || []).push(n); });
  const sel = document.getElementById('checker-select');
  sel.innerHTML = Object.keys(groups).sort((a, b) => b - a).map((st) => `<optgroup label="${esc(M.stages[st])}">${groups[st].map((n) => `<option value="${esc(n.id)}">${esc(n.label)}${n.country ? ` (${esc(n.country)})` : ''}</option>`).join('')}</optgroup>`).join('');
  const preset = S.defaultSupplier && node(S.defaultSupplier) ? S.defaultSupplier : options[0]?.id;
  sel.value = preset;
  document.getElementById('checker-form').addEventListener('submit', (e) => { e.preventDefault(); runCheck(sel.value); });
  runCheck(preset);
}

boot('solution', ['map', 'solution', 'chains'], (data) => {
  D = data; M = D.map; S = D.solution;
  renderPage();
});
