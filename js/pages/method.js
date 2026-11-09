import { boot } from '../core.js';
import { esc, evidenceBadge, icon } from '../ui.js';

boot('method', ['chains'], (D) => {
  const levels = D.chains.evidenceLevels;
  document.getElementById('evidence-table').innerHTML = Object.entries(levels)
    .filter(([k]) => k !== 'not-researched')
    .map(([k, v]) => `<div>${evidenceBadge({ level: k }, levels)}<p>${esc(v.meaning)}</p></div>`).join('');

  document.getElementById('source-table').innerHTML = D.sources.sources.map((s) => `
    <li id="src-${esc(s.id)}">
      <span class="src__id">${esc(s.id)}</span>
      <span>
        <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}${icon('external', 'icon icon--sm')}<span class="visually-hidden"> (opens in a new tab)</span></a>
        <span class="src-meta">${esc(s.publisher)}${s.date ? ` · ${esc(s.date)}` : ''}</span>
        ${s.checkNote ? `<span class="src-check">${esc(s.checkNote)}</span>` : ''}
      </span>
    </li>`).join('');
});
