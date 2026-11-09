import { boot } from '../core.js';
import { icon, esc, evidenceBadge, sourceLinks } from '../ui.js';
import { initTrace, openMaterial } from '../trace.js';

boot('records', ['parts', 'chains', 'findings'], (D) => {
  initTrace(D);
  const ol = document.getElementById('findings-list');
  ol.innerHTML = D.findings.findings.map((f) => {
    const m = D.chains.materials[f.material];
    const ents = (f.sayari || []).map((e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.name)}${icon('external', 'icon icon--sm')}<span class="visually-hidden"> (Sayari, opens in a new tab)</span></a></li>`).join('');
    return `<li class="finding">
      <p class="finding__lead">${esc(f.lead)}</p>
      <p>${esc(f.body)}</p>
      <div class="badges">${f.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>
      ${ents ? `<div class="finding__sayari"><span class="sayari__label">Sayari records</span><ul>${ents}</ul></div>` : ''}
      ${sourceLinks(f.sources, D.sourceIndex)}
      ${m ? `<div class="finding__links"><button type="button" class="btn-link" data-material="${esc(f.material)}">Trace ${esc(m.name.toLowerCase())}${icon('arrowRight', 'icon icon--sm')}</button><a class="btn-link" href="cases.html#${esc(f.material)}">Case file${icon('arrowRight', 'icon icon--sm')}</a></div>` : ''}
    </li>`;
  }).join('');
  ol.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-material]');
    if (b) openMaterial(b.dataset.material, b);
  });
});
