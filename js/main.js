import { loadData, showLoadError } from './data.js';
import {
  icon, esc, evidenceBadge, sourceLinks, fillCitations,
  SCALE, ratingKey, allStages, maxRating, renderFooter, sayariBlock,
} from './ui.js';

const state = {
  lens: 'people',
  partId: null,
  materialKey: null,
  trigger: null,
  switchedToPeople: false,
};

let D; // loaded data

/* ---------- Reactor diagram ---------- */

function partMaterials(part) {
  return part.materials.map((k) => D.chains.materials[k]).filter(Boolean);
}

function partRating(part, lens) {
  const stages = partMaterials(part).flatMap(allStages);
  return maxRating(stages, lens);
}

function colourParts() {
  D.parts.parts.forEach((part) => {
    const r = partRating(part, state.lens);
    const colour = SCALE[state.lens][r].colour;
    const g = document.getElementById(part.id);
    if (g) {
      g.style.setProperty('--part-fill', colour);
      g.dataset.rating = r;
    }
    const sw = document.querySelector(`[data-swatch="${part.id}"]`);
    if (sw) sw.style.background = colour;
    const rl = document.querySelector(`[data-rating-label="${part.id}"]`);
    if (rl) rl.textContent = part.materials.length ? SCALE[state.lens][r].label : 'Not traced in this iteration';
  });
}

function renderColourKey() {
  const key = document.getElementById('colour-key');
  const scale = SCALE[state.lens];
  const title = state.lens === 'security' ? 'Colour shows supply risk' : 'Colour shows harm severity';
  const order = state.lens === 'people' ? ['high', 'moderate', 'unknown'] : ['high', 'moderate', 'low', 'unknown'];
  key.innerHTML = `<p class="colour-key__title">${title}</p><ul>` +
    order.map((k) => `<li><span class="swatch" style="background:${scale[k].colour}"></span>${esc(scale[k].label)}</li>`).join('') +
    '</ul>' + (state.lens === 'people'
      ? '<p class="colour-key__note">Severe: harm documented by three or more sources, or any forced labour, child labour or crime against people. Moderate: one or two sources.</p>'
      : '') + '<p class="colour-key__note">A part takes the highest rating of any stage in its materials’ chains.</p>';
}

function renderPartList() {
  const list = document.getElementById('part-list');
  list.innerHTML = D.parts.parts.map((p, i) => `
    <li>
      <button type="button" class="part-btn" data-open-part="${esc(p.id)}">
        <span class="part-btn__num">${i + 1}</span>
        <span class="part-btn__text">
          <span class="part-btn__label">${esc(p.label)}</span>
          <span class="part-btn__meta"><span class="swatch" data-swatch="${esc(p.id)}"></span><span data-rating-label="${esc(p.id)}"></span></span>
        </span>
        ${icon('arrowRight', 'icon part-btn__arrow')}
      </button>
    </li>`).join('');
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-part]');
    if (btn) openTrace(btn.dataset.openPart, btn);
  });
}

function setupHotspots() {
  const tooltip = document.getElementById('reactor-tooltip');
  const figure = document.querySelector('.reactor-figure');

  const showTip = (part, x, y) => {
    tooltip.innerHTML = `<span class="tooltip__label">${esc(part.label)}</span><span class="tooltip__fn">${esc(part.short)}</span>`;
    tooltip.hidden = false;
    const fr = figure.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    let left = x - fr.left + 16;
    if (left + tw > fr.width) left = x - fr.left - tw - 16;
    tooltip.style.left = `${Math.max(0, left)}px`;
    tooltip.style.top = `${Math.max(0, y - fr.top + 16)}px`;
  };
  const hideTip = () => { tooltip.hidden = true; };

  D.parts.parts.forEach((part) => {
    const g = document.getElementById(part.id);
    if (!g) return;
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `${part.label}: ${part.short}. Open trace.`);
    g.addEventListener('mousemove', (e) => showTip(part, e.clientX, e.clientY));
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('focus', () => {
      const r = g.querySelector('.marker circle').getBoundingClientRect();
      showTip(part, r.right, r.top);
    });
    g.addEventListener('blur', hideTip);
    g.addEventListener('click', () => { hideTip(); openTrace(part.id, g); });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hideTip();
        openTrace(part.id, g);
      }
    });
  });
}

/* ---------- Lens toggle ---------- */

function setLens(lens) {
  if (lens === state.lens) return;
  state.lens = lens;
  document.body.dataset.lens = lens;
  document.querySelectorAll('[data-lens-toggle] [data-lens]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lens === lens));
  });
  colourParts();
  renderColourKey();
  if (state.partId) {
    state.switchedToPeople = lens === 'people';
    renderTraceBody();
  }
  announce(lens === 'security'
    ? 'Security lens on. Colours show supply risk.'
    : 'People lens on. Colours show harm severity.');
}

function setupLensToggles(root = document) {
  root.querySelectorAll('[data-lens-toggle]').forEach((group) => {
    if (group.dataset.bound) return;
    group.dataset.bound = '1';
    group.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lens]');
      if (b) setLens(b.dataset.lens);
    });
  });
}

function lensToggleHtml() {
  const btn = (lens, name, ic) => `<button type="button" data-lens="${lens}" aria-pressed="${state.lens === lens}">${icon(ic)}${name}</button>`;
  return `<div class="lens-toggle" role="group" aria-label="Choose a lens" data-lens-toggle>${btn('security', 'Security lens', 'shield')}${btn('people', 'People lens', 'users')}</div>`;
}

/* ---------- Trace panel ---------- */

function isUnresearched(stage) {
  return !stage.security && !stage.people && !(stage.sayari || []).length && stage.evidence.every((e) => e.level === 'not-researched');
}

function lensBlock(stage, lens) {
  const ann = stage[lens];
  const name = lens === 'security' ? 'Security lens' : 'People lens';
  const ic = lens === 'security' ? 'shield' : 'users';
  if (!ann) {
    return `<div class="node__lens node__lens--empty"><p class="node__lens-label">${icon(ic, 'icon icon--sm')}${name}</p><p>Not yet researched for this lens.</p></div>`;
  }
  return `<div class="node__lens"><p class="node__lens-label">${icon(ic, 'icon icon--sm')}${name}</p><p>${esc(ann.text)}</p>${sourceLinks(ann.sources, D.sourceIndex, { sourceNeeded: ann.sourceNeeded })}</div>`;
}

function nodeHtml(stage, { lenses = [state.lens], ratingLens = state.lens } = {}) {
  const r = stage.rating?.[ratingKey(ratingLens)] || 'unknown';
  const colour = SCALE[ratingLens][r].colour;
  const nyr = isUnresearched(stage);
  const classes = ['node'];
  if (nyr) classes.push('node--nyr');
  if (stage.blending) classes.push('node--blend');
  if (stage.history) classes.push('node--history');

  const blend = stage.blending
    ? `<p class="blend">${icon('merge', 'icon icon--sm')}<span><strong>Blending point.</strong> Ore from different sources is mixed here and traceability breaks.</span></p>`
    : '';
  const hist = stage.history ? `<p class="history-tag">${icon('history', 'icon icon--sm')}Lessons from history</p>` : '';
  const body = nyr
    ? '<p class="node__empty">Not yet researched. This stage is a visible gap for iteration 2.</p>'
    : lenses.map((l) => lensBlock(stage, l)).join('');
  const sayari = sayariBlock(stage.sayari);
  const harmWhy = (ratingLens === 'people' && stage.harm && stage.harm.reason)
    ? `<p class="node__harm">${esc(stage.harm.reason)}</p>` : '';
  const note = stage.evidenceNote ? `<p class="node__note">${esc(stage.evidenceNote)}</p>` : '';
  const todo = stage.todo ? `<p class="node__todo">To research: ${esc(stage.todo)}</p>` : '';
  const ratingText = nyr ? '' : `<span class="node__rating"><span class="swatch" style="background:${colour}"></span>${esc(SCALE[ratingLens][r].label)}</span>`;

  return `<li class="${classes.join(' ')}" style="--node-colour:${colour}">
    <div class="node__head">
      <p class="node__tier">${esc(stage.tier)}</p>
      ${ratingText}
    </div>
    <p class="node__name">${esc(stage.name)}</p>
    ${hist}${blend}
    <div class="node__lenses">${body}</div>
    ${harmWhy}
    <div class="badges">${stage.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
    ${sayari}${note}${todo}
  </li>`;
}

function traceHtml(material) {
  let html = (material.stages || []).map((s) => nodeHtml(s)).join('');
  const routes = material.routes || [];
  if (routes.length === 1) {
    html += routes[0].stages.map((s) => nodeHtml(s)).join('');
  } else if (routes.length > 1) {
    html += `<li class="fork">${icon('fork', 'icon icon--sm')}The chain splits into ${routes.length} source routes</li>`;
    html += routes.map((r, i) => `<li class="route"><p class="route__name">Route ${String.fromCharCode(65 + i)} · ${esc(r.name)}</p><ol class="trace">${r.stages.map((s) => nodeHtml(s)).join('')}</ol></li>`).join('');
  }
  return `<ol class="trace">${html}</ol>`;
}

function renderTraceBody() {
  const part = D.parts.parts.find((p) => p.id === state.partId);
  const body = document.getElementById('trace-body');
  const material = D.chains.materials[state.materialKey];
  if (!material) {
    body.innerHTML = `
      <p class="trace-panel__desc">${esc(part.description)}</p>
      <ol class="trace"><li class="node node--nyr" style="--node-colour:${SCALE[state.lens].unknown.colour}">
        <div class="node__head"><p class="node__tier">Not traced in this iteration</p></div>
        <p class="node__empty">This part's supply chain will be added once the evidence is complete enough to show the full chain.</p>
        <div class="badges">${evidenceBadge({ level: 'not-researched' }, D.chains.evidenceLevels)}</div>
      </li></ol>`;
    return;
  }

  const tabs = part.materials.length > 1
    ? `<div class="tabs" role="tablist" aria-label="Materials">${part.materials.map((k) => {
        const m = D.chains.materials[k];
        const sel = k === state.materialKey;
        return `<button type="button" role="tab" id="tab-${k}" aria-selected="${sel}" aria-controls="trace-material" tabindex="${sel ? 0 : -1}" data-material="${k}">${esc(m.name)}</button>`;
      }).join('')}</div>`
    : '';

  const why = material.whyItMatters
    ? `<p>${esc(material.whyItMatters.text)}</p>${sourceLinks(material.whyItMatters.sources, D.sourceIndex, { sourceNeeded: material.whyItMatters.sourceNeeded })}`
    : '';

  const highHarm = maxRating(allStages(material), 'people') === 'high';
  const callout = state.lens === 'people' && state.switchedToPeople && highHarm
    ? `<p class="callout" role="status">${icon('alert')}<span><strong>Secure is not the same as acceptable.</strong> Under the security lens this chain is a supply question. Under the people lens it carries documented harm.</span></p>`
    : '';

  const context = (material.context || []).map((c) => `
    <div class="context-card">
      <p class="node__tier">${esc(c.label)}</p>
      <p>${esc(c.text)}</p>
      <div class="badges">${c.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
      ${sourceLinks(c.sources, D.sourceIndex)}
    </div>`).join('');

  const isCase = part.caseFile === state.materialKey;
  const cta = isCase
    ? `<a class="btn btn--primary" href="#case-file" data-close-to="case-file">Read the full case file${icon('arrowRight')}</a>`
    : `<a class="btn btn--primary" href="#scores" data-close-to="scores">See the scores${icon('arrowRight')}</a>`;

  body.innerHTML = `
    <p class="trace-panel__desc">${esc(part.description)}</p>
    ${sourceLinks(part.descriptionSources, D.sourceIndex)}
    ${lensToggleHtml()}
    ${tabs}
    <div id="trace-material" ${tabs ? `role="tabpanel" aria-labelledby="tab-${state.materialKey}"` : ''}>
      <p class="material-role"><span class="material-role__name">${esc(material.name)}</span> ${esc(material.role || '')}</p>
      ${why}
      ${callout}
      <p class="trace-direction">From the reactor back to the mine</p>
      ${traceHtml(material)}
      ${context}
      <div class="bottom-line">
        <p class="bottom-line__label">Bottom line</p>
        <p>${esc(material.bottomLine)}</p>
      </div>
      ${cta}
    </div>`;

  setupLensToggles(body);
  const tablist = body.querySelector('[role="tablist"]');
  if (tablist) {
    tablist.addEventListener('click', (e) => {
      const t = e.target.closest('[data-material]');
      if (t) selectMaterial(t.dataset.material, true);
    });
    tablist.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const keys = part.materials;
      let i = keys.indexOf(state.materialKey);
      if (e.key === 'ArrowRight') i = (i + 1) % keys.length;
      if (e.key === 'ArrowLeft') i = (i - 1 + keys.length) % keys.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = keys.length - 1;
      selectMaterial(keys[i], true);
    });
  }
  body.querySelectorAll('[data-close-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = a.dataset.closeTo;
      closeTrace({ returnFocus: false });
      const el = document.getElementById(target);
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      const h = el.querySelector('h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
  });
}

function selectMaterial(key, focusTab = false) {
  state.materialKey = key;
  state.switchedToPeople = false;
  renderTraceBody();
  const m = D.chains.materials[key];
  announce(`Showing ${m.name}.`);
  if (focusTab) document.getElementById(`tab-${key}`)?.focus();
}

function openTrace(partId, trigger) {
  const part = D.parts.parts.find((p) => p.id === partId);
  if (!part) return;
  state.partId = partId;
  state.materialKey = part.materials[0];
  state.trigger = trigger || document.activeElement;
  state.switchedToPeople = false;

  document.querySelectorAll('.hotspot').forEach((g) => g.classList.toggle('is-active', g.id === partId));
  document.getElementById('trace-title').textContent = part.label;
  renderTraceBody();

  const panel = document.getElementById('trace-panel');
  const backdrop = document.getElementById('trace-backdrop');
  panel.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => { panel.classList.add('is-open'); backdrop.classList.add('is-open'); });
  document.body.classList.add('panel-open');
  panel.scrollTop = 0;
  document.getElementById('trace-body').scrollTop = 0;
  document.getElementById('trace-title').focus();
  const m0 = D.chains.materials[state.materialKey];
  announce(`Trace open: ${part.label}.${m0 ? ` Showing ${m0.name}.` : ' Not traced in this iteration.'}`);
}

function closeTrace({ returnFocus = true } = {}) {
  const panel = document.getElementById('trace-panel');
  const backdrop = document.getElementById('trace-backdrop');
  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  panel.hidden = true;
  backdrop.hidden = true;
  document.body.classList.remove('panel-open');
  document.querySelectorAll('.hotspot').forEach((g) => g.classList.remove('is-active'));
  state.partId = null;
  announce('Trace closed.');
  if (returnFocus && state.trigger) state.trigger.focus();
}

function setupPanel() {
  const panel = document.getElementById('trace-panel');
  document.getElementById('trace-close').addEventListener('click', () => closeTrace());
  document.getElementById('trace-backdrop').addEventListener('click', () => closeTrace());
  document.addEventListener('keydown', (e) => {
    if (!state.partId) return;
    if (e.key === 'Escape') { e.preventDefault(); closeTrace(); return; }
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"], [tabindex="-1"]#trace-title')]
        .filter((el) => el.offsetParent !== null || el === document.getElementById('trace-title'));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ---------- Case file (yttrium spine) ---------- */

function renderCaseFile() {
  const part = D.parts.parts.find((p) => p.caseFile);
  const key = part?.caseFile;
  const m = D.chains.materials[key];
  if (!m) return;
  const [mainRoute, ...otherRoutes] = m.routes || [];
  // From the mine up to the reactor.
  const stages = [...(mainRoute?.stages || []).slice().reverse(), ...(m.stages || []).slice().reverse()];
  const ol = document.getElementById('case-stages');
  ol.innerHTML = stages.map((s, i) => {
    const html = nodeHtml(s, { lenses: ['security', 'people'], ratingLens: 'people' });
    return html.replace('<li class="node', `<li data-step="${i + 1} of ${stages.length}" class="case-node node`);
  }).join('');

  if (otherRoutes.length) {
    const aside = otherRoutes.map((r) => {
      const s = r.stages[r.stages.length - 1];
      return `<li class="case-aside">
        <p class="node__tier">Also feeding the same separation plants</p>
        <p class="node__name">${esc(r.name)}</p>
        ${s.people ? `<p>${esc(s.people.text)}</p>${sourceLinks(s.people.sources, D.sourceIndex)}` : ''}
        <div class="badges">${s.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
      </li>`;
    }).join('');
    // Insert after the first (mine) stage.
    const first = ol.querySelector('li');
    first.insertAdjacentHTML('afterend', aside);
  }

  document.getElementById('case-bottom').innerHTML =
    `<p>${esc(m.bottomLine)}</p><cite>Bottom line · ${esc(m.name)}</cite>`;
}

/* ---------- Sayari findings ---------- */

function renderFindings() {
  const ol = document.getElementById('findings-list');
  if (!ol || !D.findings) return;
  ol.innerHTML = D.findings.findings.map((f) => {
    const part = D.parts.parts.find((p) => p.materials.includes(f.material));
    const ents = (f.sayari || []).map((e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.name)}${icon('external', 'icon icon--sm')}<span class="visually-hidden"> (Sayari, opens in a new tab)</span></a></li>`).join('');
    return `<li class="finding">
      <p class="finding__lead">${esc(f.lead)}</p>
      <p>${esc(f.body)}</p>
      <div class="badges">${f.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
      ${ents ? `<div class="finding__sayari"><span class="sayari__label">Sayari records</span><ul>${ents}</ul></div>` : ''}
      ${sourceLinks(f.sources, D.sourceIndex)}
      ${part ? `<button type="button" class="btn-link" data-open-part="${esc(part.id)}" data-material="${esc(f.material)}">Trace ${esc(D.chains.materials[f.material].name.toLowerCase())}${icon('arrowRight', 'icon icon--sm')}</button>` : ''}
    </li>`;
  }).join('');
  ol.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-part]');
    if (!b) return;
    openTrace(b.dataset.openPart, b);
    if (b.dataset.material && b.dataset.material !== state.materialKey) selectMaterial(b.dataset.material);
  });
}

/* ---------- Scores ---------- */

function renderScores() {
  const { dimensions, routes } = D.scores;
  const levels = D.chains.evidenceLevels;
  const n = routes.length;
  const harmDoc = routes.filter((r) => r.evidence.harm === 'documented').length;
  const linkDoc = routes.filter((r) => r.evidence.link === 'documented').length;
  const linkWeak = routes.filter((r) => ['hypothesis', 'not-researched'].includes(r.evidence.link)).length;
  const harmPart = harmDoc === n ? `on all ${n} routes` : `on ${harmDoc} of ${n} routes`;
  const linkPart = linkDoc === 0 ? 'on none of them' : `on only ${linkDoc}`;
  document.getElementById('scores-title').textContent =
    `Harm is documented ${harmPart}. The link into fusion is proven ${linkPart}.`;

  const scoreCell = (r, d) => {
    const v = r.scores[d.id];
    const note = r.notes?.[d.id];
    if (v == null) return `<td class="score score--pending"><span class="score__pending">Pending</span></td>`;
    const ramp = { 1: '#233350', 2: '#16489E', 3: '#085CEC' }[v] || '#3A3731';
    return `<td class="score" style="--score:${ramp}"><span class="score__val">${v}</span>${note ? `<span class="score__note">${esc(note)}</span>` : ''}</td>`;
  };

  const table = document.getElementById('scores-table');
  table.innerHTML = `
    <caption class="visually-hidden">Exposure Pathway scores by material route. Evidence columns show what is documented today; score columns are 1 (low) to 3 (high).</caption>
    <thead>
      <tr>
        <th scope="col">Route</th>
        <th scope="col">Harm at source</th>
        <th scope="col">Link to fusion</th>
        ${dimensions.map((d) => `<th scope="col" class="th-score">${esc(d.label)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${routes.map((r) => `
        <tr>
          <th scope="row"><span class="route-mat">${esc(r.label)}</span><span class="route-name">${esc(r.route)}</span></th>
          <td>${evidenceBadge({ level: r.evidence.harm }, levels)}</td>
          <td>${evidenceBadge({ level: r.evidence.link }, levels)}</td>
          ${dimensions.map((d) => scoreCell(r, d)).join('')}
        </tr>`).join('')}
    </tbody>`;

  const pending = routes.every((r) => Object.values(r.scores).every((v) => v == null));
  document.getElementById('score-dims').innerHTML =
    dimensions.map((d) => `<div><dt>${esc(d.label)}</dt><dd>${esc(d.question)}</dd></div>`).join('') +
    `<div class="score-dims__status"><dt>Status</dt><dd>${pending ? "Scores are pending the author's review." : esc(D.scores.status || '')} On ${linkWeak} of ${n} routes the link to fusion is still a hypothesis or not yet researched.</dd></div>`;

  document.getElementById('mockup-scores').innerHTML = dimensions.map((d) =>
    `<li><span>${esc(d.label)}</span><span class="mockup__bar" aria-hidden="true"><span></span><span></span><span></span></span></li>`).join('');
}

/* ---------- Footer & misc ---------- */

function announce(msg) {
  const live = document.getElementById('live');
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 50);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- Boot ---------- */

async function init() {
  document.body.dataset.lens = state.lens;
  setupLensToggles();
  try {
    D = await loadData();
  } catch (err) {
    showLoadError(err);
    document.querySelectorAll('.reactor-layout, #case-stages, .scores-wrap').forEach((el) => { el.hidden = true; });
    return;
  }
  renderPartList();
  setupHotspots();
  colourParts();
  renderColourKey();
  setupPanel();
  renderCaseFile();
  renderFindings();
  renderScores();
  fillCitations(document, D.sourceIndex);
  renderFooter(D.site);
}

init();
