// The Trace panel: opens a reactor part or material and shows its chain from reactor to mine.
// Shared by the reactor, records and map pages.
import {
  icon, esc, evidenceBadge, sourceLinks, SCALE, ratingKey, allStages, maxRating, sayariBlock,
} from './ui.js';
import { announce } from './core.js';

export const state = {
  lens: 'people',
  partId: null,
  materialKey: null,
  trigger: null,
  switchedToPeople: false,
};

let D;
const lensListeners = [];

export function initTrace(data) {
  D = data;
  ensurePanel();
  document.body.dataset.lens = state.lens;
  setupLensToggles();
  setupPanel();
}

export function onLensChange(fn) { lensListeners.push(fn); }

function ensurePanel() {
  if (document.getElementById('trace-panel')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="trace-backdrop" class="trace-backdrop" hidden></div>
    <section id="trace-panel" class="trace-panel" role="dialog" aria-modal="true" aria-labelledby="trace-title" hidden>
      <div class="trace-panel__head">
        <h2 id="trace-title" class="trace-panel__title" tabindex="-1"></h2>
        <button type="button" class="icon-btn" id="trace-close" aria-label="Close trace">${icon('x')}</button>
      </div>
      <div class="trace-panel__body" id="trace-body"></div>
    </section>`);
}

/* ---------- Lens ---------- */

export function setLens(lens) {
  if (lens === state.lens) return;
  state.lens = lens;
  document.body.dataset.lens = lens;
  document.querySelectorAll('[data-lens-toggle] [data-lens]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lens === lens));
  });
  lensListeners.forEach((fn) => fn(lens));
  if (state.partId || state.materialKey) {
    state.switchedToPeople = lens === 'people';
    if (!document.getElementById('trace-panel').hidden) renderTraceBody();
  }
  announce(lens === 'security'
    ? 'Security lens on. Colours show supply risk.'
    : 'People lens on. Colours show harm severity.');
}

export function setupLensToggles(root = document) {
  root.querySelectorAll('[data-lens-toggle]').forEach((group) => {
    if (group.dataset.bound) return;
    group.dataset.bound = '1';
    group.querySelectorAll('[data-lens]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lens === state.lens)));
    group.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lens]');
      if (b) setLens(b.dataset.lens);
    });
  });
}

export function lensToggleHtml() {
  const btn = (lens, name, ic) => `<button type="button" data-lens="${lens}" aria-pressed="${state.lens === lens}">${icon(ic)}${name}</button>`;
  return `<div class="lens-toggle" role="group" aria-label="Choose a lens" data-lens-toggle>${btn('security', 'Security lens', 'shield')}${btn('people', 'People lens', 'users')}</div>`;
}

/* ---------- Stage cards ---------- */

function lensBlock(stage, lens) {
  const ann = stage[lens];
  const name = lens === 'security' ? 'Security lens' : 'People lens';
  const ic = lens === 'security' ? 'shield' : 'users';
  if (!ann) return '';
  return `<div class="node__lens"><p class="node__lens-label">${icon(ic, 'icon icon--sm')}${name}</p><p>${esc(ann.text)}</p>${sourceLinks(ann.sources, D.sourceIndex, { sourceNeeded: ann.sourceNeeded })}</div>`;
}

export function nodeHtml(stage, { lenses = [state.lens], ratingLens = state.lens } = {}) {
  const r = stage.rating?.[ratingKey(ratingLens)] || 'unknown';
  const colour = SCALE[ratingLens][r].colour;
  const classes = ['node'];
  if (stage.blending) classes.push('node--blend');
  if (stage.history) classes.push('node--history');
  const blend = stage.blending
    ? `<p class="blend">${icon('merge', 'icon icon--sm')}<span><strong>Blending point.</strong> Material from different sources is mixed here and traceability breaks.</span></p>`
    : '';
  const hist = stage.history ? `<p class="history-tag">${icon('history', 'icon icon--sm')}Lessons from history</p>` : '';
  const body = lenses.map((l) => lensBlock(stage, l)).join('');
  const harmWhy = (ratingLens === 'people' && stage.harm && stage.harm.reason)
    ? `<p class="node__harm">${esc(stage.harm.reason)}</p>` : '';
  const supplyWhy = (ratingLens === 'security' && stage.supplyReason)
    ? `<p class="node__harm">${esc(stage.supplyReason)}</p>` : '';
  const note = stage.evidenceNote ? `<p class="node__note">${esc(stage.evidenceNote)}</p>` : '';
  return `<li class="${classes.join(' ')}" style="--node-colour:${colour}">
    <div class="node__head">
      <p class="node__tier">${esc(stage.tier)}</p>
      <span class="node__rating"><span class="swatch" style="background:${colour}"></span>${esc(SCALE[ratingLens][r].label)}</span>
    </div>
    <p class="node__name">${esc(stage.name)}</p>
    ${hist}${blend}
    <div class="node__lenses">${body}</div>
    ${harmWhy}${supplyWhy}
    <div class="badges">${stage.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
    ${sayariBlock(stage.sayari)}${note}
  </li>`;
}

export function traceHtml(material, opts) {
  let html = (material.stages || []).map((s) => nodeHtml(s, opts)).join('');
  const routes = material.routes || [];
  if (routes.length === 1) {
    html += routes[0].stages.map((s) => nodeHtml(s, opts)).join('');
  } else if (routes.length > 1) {
    html += `<li class="fork">${icon('fork', 'icon icon--sm')}The chain splits into ${routes.length} source routes</li>`;
    html += routes.map((r, i) => `<li class="route"><p class="route__name">Route ${String.fromCharCode(65 + i)} · ${esc(r.name)}</p><ol class="trace">${r.stages.map((s) => nodeHtml(s, opts)).join('')}</ol></li>`).join('');
  }
  return `<ol class="trace">${html}</ol>`;
}

/* ---------- Panel ---------- */

function currentPart() {
  return D.parts.parts.find((p) => p.id === state.partId)
    || D.parts.parts.find((p) => p.materials.includes(state.materialKey));
}

export function renderTraceBody() {
  const part = currentPart();
  const body = document.getElementById('trace-body');
  const material = D.chains.materials[state.materialKey];
  if (!material) return;
  const mats = (part ? part.materials : [state.materialKey]).filter((k) => D.chains.materials[k]);

  const tabs = mats.length > 1
    ? `<div class="tabs" role="tablist" aria-label="Materials">${mats.map((k) => {
        const m = D.chains.materials[k];
        const sel = k === state.materialKey;
        return `<button type="button" role="tab" id="tab-${k}" aria-selected="${sel}" aria-controls="trace-material" tabindex="${sel ? 0 : -1}" data-material="${k}">${esc(m.name)}</button>`;
      }).join('')}</div>`
    : '';
  const why = material.whyItMatters
    ? `<p>${esc(material.whyItMatters.text)}</p>${sourceLinks(material.whyItMatters.sources, D.sourceIndex)}`
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

  body.innerHTML = `
    ${part ? `<p class="trace-panel__desc">${esc(part.description)}</p>${sourceLinks(part.descriptionSources, D.sourceIndex)}` : ''}
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
      <div class="trace-ctas">
        <a class="btn btn--primary" href="cases.html#${esc(state.materialKey)}">Read the case file${icon('arrowRight')}</a>
        <a class="btn btn--ghost" href="map.html#${esc(state.materialKey)}">See it on the systems map</a>
      </div>
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
      let i = mats.indexOf(state.materialKey);
      if (e.key === 'ArrowRight') i = (i + 1) % mats.length;
      if (e.key === 'ArrowLeft') i = (i - 1 + mats.length) % mats.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = mats.length - 1;
      selectMaterial(mats[i], true);
    });
  }
}

export function selectMaterial(key, focusTab = false) {
  state.materialKey = key;
  state.switchedToPeople = false;
  renderTraceBody();
  announce(`Showing ${D.chains.materials[key].name}.`);
  if (focusTab) document.getElementById(`tab-${key}`)?.focus();
}

function showPanel(title) {
  document.getElementById('trace-title').textContent = title;
  const panel = document.getElementById('trace-panel');
  const backdrop = document.getElementById('trace-backdrop');
  panel.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => { panel.classList.add('is-open'); backdrop.classList.add('is-open'); });
  document.body.classList.add('panel-open');
  document.getElementById('trace-body').scrollTop = 0;
  document.getElementById('trace-title').focus();
}

export function openTrace(partId, trigger, materialKey) {
  const part = D.parts.parts.find((p) => p.id === partId);
  if (!part) return;
  state.partId = partId;
  state.materialKey = materialKey || part.materials[0];
  state.trigger = trigger || document.activeElement;
  state.switchedToPeople = false;
  document.querySelectorAll('.hotspot').forEach((g) => g.classList.toggle('is-active', g.id === partId));
  renderTraceBody();
  showPanel(part.label);
  announce(`Trace open: ${part.label}. Showing ${D.chains.materials[state.materialKey].name}.`);
}

export function openMaterial(materialKey, trigger) {
  const part = D.parts.parts.find((p) => p.materials.includes(materialKey));
  if (part) return openTrace(part.id, trigger, materialKey);
  state.partId = null;
  state.materialKey = materialKey;
  state.trigger = trigger || document.activeElement;
  renderTraceBody();
  showPanel(D.chains.materials[materialKey].name);
}

export function closeTrace({ returnFocus = true } = {}) {
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
    if (panel.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeTrace(); return; }
    if (e.key === 'Tab') {
      const title = document.getElementById('trace-title');
      const f = [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')]
        .filter((el) => el.offsetParent !== null);
      f.unshift(title);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
}
