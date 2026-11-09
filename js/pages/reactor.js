import { boot } from '../core.js';
import { icon, esc, SCALE, allStages, maxRating } from '../ui.js';
import { initTrace, onLensChange, openTrace, openMaterial, state } from '../trace.js';

let D;

function partRating(part, lens) {
  const stages = part.materials.map((k) => D.chains.materials[k]).filter(Boolean).flatMap(allStages);
  return maxRating(stages, lens);
}

function colourParts() {
  D.parts.parts.forEach((part) => {
    const r = partRating(part, state.lens);
    const colour = SCALE[state.lens][r].colour;
    const g = document.getElementById(part.id);
    if (g) { g.style.setProperty('--part-fill', colour); g.dataset.rating = r; }
    const sw = document.querySelector(`[data-swatch="${part.id}"]`);
    if (sw) sw.style.background = colour;
    const rl = document.querySelector(`[data-rating-label="${part.id}"]`);
    if (rl) rl.textContent = SCALE[state.lens][r].label;
  });
}

function renderColourKey() {
  const key = document.getElementById('colour-key');
  const scale = SCALE[state.lens];
  const title = state.lens === 'security' ? 'Colour shows supply risk' : 'Colour shows harm severity';
  const order = state.lens === 'people' ? ['high', 'moderate', 'unknown'] : ['high', 'moderate', 'low'];
  key.innerHTML = `<p class="colour-key__title">${title}</p><ul>` +
    order.map((k) => `<li><span class="swatch" style="background:${scale[k].colour}"></span>${esc(scale[k].label)}</li>`).join('') +
    '</ul>' + (state.lens === 'people'
      ? '<p class="colour-key__note">Severe: harm documented by three or more sources, or any forced labour, child labour or crime against people. Moderate: one or two sources.</p>'
      : '<p class="colour-key__note">Supply risk reflects concentration, state control, export controls and sanctions exposure at each stage.</p>')
    + '<p class="colour-key__note">A part takes the highest rating of any stage in its materials’ chains.</p>';
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
    g.addEventListener('focus', () => { const r = g.querySelector('.marker circle').getBoundingClientRect(); showTip(part, r.right, r.top); });
    g.addEventListener('blur', hideTip);
    g.addEventListener('click', () => { hideTip(); openTrace(part.id, g); });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hideTip(); openTrace(part.id, g); }
    });
  });
}

boot('reactor', ['parts', 'chains'], (data) => {
  D = data;
  initTrace(D);
  renderPartList();
  setupHotspots();
  colourParts();
  renderColourKey();
  onLensChange(() => { colourParts(); renderColourKey(); });
  // reactor.html#nickel opens that material's trace (links from other pages).
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && D.chains.materials[hash]) openMaterial(hash);
});
