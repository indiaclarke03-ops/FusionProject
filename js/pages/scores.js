import { boot } from '../core.js';
import { esc, evidenceBadge } from '../ui.js';

boot('scores', ['scores', 'chains'], (D) => {
  const { dimensions, routes } = D.scores;
  const levels = D.chains.evidenceLevels;
  const n = routes.length;
  const harmDoc = routes.filter((r) => r.evidence.harm === 'documented').length;
  const linkDoc = routes.filter((r) => r.evidence.link === 'documented').length;
  const linkWeak = routes.filter((r) => ['hypothesis', 'not-researched', 'no-evidence'].includes(r.evidence.link)).length;
  const harmPart = harmDoc === n ? `on all ${n} routes` : `on ${harmDoc} of ${n} routes`;
  const linkPart = linkDoc === 0 ? 'on none of them' : `on only ${linkDoc}`;
  document.getElementById('scores-title').textContent = `Harm is documented ${harmPart}. The link into fusion is proven ${linkPart}.`;

  const ramp = { 1: '#1C2B48', 2: '#2F5FC4', 3: '#5B95FF' };
  const scoreCell = (r, d) => {
    const v = r.scores[d.id];
    const note = r.notes?.[d.id];
    if (v == null) return '<td class="score score--pending"><span class="score__pending">Pending</span></td>';
    return `<td class="score score--${v}" style="--score:${ramp[v]}"><span class="score__val">${v}</span>${note ? `<span class="score__note">${esc(note)}</span>` : ''}</td>`;
  };
  document.getElementById('scores-table').innerHTML = `
    <caption class="visually-hidden">Exposure Pathway scores by material route. Evidence columns show what is documented today; score columns are 1 (low) to 3 (high).</caption>
    <thead><tr>
      <th scope="col">Route</th><th scope="col">Harm at source</th><th scope="col">Link to fusion</th>
      ${dimensions.map((d) => `<th scope="col" class="th-score">${esc(d.label)}</th>`).join('')}
    </tr></thead>
    <tbody>${routes.map((r) => `
      <tr>
        <th scope="row"><a class="route-mat" href="cases.html#${esc(r.material)}">${esc(r.label)}</a><span class="route-name">${esc(r.route)}</span></th>
        <td>${evidenceBadge({ level: r.evidence.harm }, levels)}</td>
        <td>${evidenceBadge({ level: r.evidence.link }, levels)}</td>
        ${dimensions.map((d) => scoreCell(r, d)).join('')}
      </tr>`).join('')}</tbody>`;
  document.getElementById('score-dims').innerHTML =
    dimensions.map((d) => `<div><dt>${esc(d.label)}</dt><dd>${esc(d.question)}</dd></div>`).join('') +
    `<div class="score-dims__status"><dt>Status</dt><dd>${esc(D.scores.status || '')} On ${linkWeak} of ${n} routes the link to fusion is still a hypothesis.</dd></div>`;
});
