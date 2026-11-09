import { boot } from '../core.js';
import { icon, esc, evidenceBadge, sourceLinks, SCALE } from '../ui.js';
import { initTrace, openMaterial, traceHtml } from '../trace.js';

const STATUS_LABEL = {
  confirmed: 'Confirmed record', reported: 'Reported', inferred: 'Inferred', hypothesis: 'Hypothesis',
};

let ALL = [];
function findStage(material, name) {
  if (!name) return null;
  const own = material ? [...(material.stages || []), ...(material.routes || []).flatMap((r) => r.stages)] : [];
  const pick = (arr) => arr.find((s) => s.name === name) || arr.find((s) => s.name.toLowerCase().startsWith(name.toLowerCase().slice(0, 18)));
  return pick(own) || pick(ALL);
}

function trailHtml(trail, D) {
  if (!trail || !trail.length) return '';
  return `<ul class="trail">${trail.map((t) => {
    const src = t.source && D.sourceIndex.get(t.source);
    const href = t.url || src?.url;
    return `<li class="trail__item trail__item--${esc(t.status)}">
      <span class="trail__from">${esc(t.from)}</span>
      <span class="trail__arrow" aria-hidden="true">${icon('arrowRight', 'icon icon--sm')}</span>
      <span class="trail__to">${esc(t.to)}</span>
      <span class="trail__what">${esc(t.what || '')}</span>
      <span class="trail__meta"><span class="trail__status">${esc(STATUS_LABEL[t.status] || t.status)}</span>${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">${esc(src ? `${src.publisher}${src.date ? `, ${src.date}` : ''}` : 'Sayari record')}${icon('external', 'icon icon--sm')}</a>` : ''}</span>
    </li>`;
  }).join('')}</ul>`;
}

function caseHtml(c, D) {
  const m = D.chains.materials[c.material];
  const steps = c.steps.map((s, i) => {
    const st = m && findStage(m, s.stageName);
    const harm = st?.rating?.harm || 'unknown';
    const rating = st ? `<span class="step__rating"><span class="swatch" style="background:${SCALE.people[harm].colour}"></span>${esc(SCALE.people[harm].label)}</span>` : '';
    const badges = st ? `<div class="badges">${st.evidence.map((e) => evidenceBadge(e, D.chains.evidenceLevels)).join('')}</div>` : '';
    return `<li class="step${st?.blending ? ' step--blend' : ''}" style="--step-colour:${SCALE.people[harm].colour}">
      <div class="step__marker" aria-hidden="true">${i + 1}</div>
      <div class="step__body">
        <div class="step__head"><h3 class="step__title">${esc(s.heading)}</h3>${rating}</div>
        ${st?.blending ? `<p class="blend">${icon('merge', 'icon icon--sm')}<span><strong>Blending point.</strong> Origin is lost here.</span></p>` : ''}
        <p>${esc(s.body)}</p>
        ${trailHtml(s.trail, D)}
        ${badges}
        ${st?.harm?.reason ? `<p class="node__harm">${esc(st.harm.reason)}</p>` : ''}
        ${sourceLinks(s.sources || [], D.sourceIndex)}
      </div>
    </li>`;
  }).join('');
  const gloss = (c.glossary || []).length ? `<dl class="case__gloss">${c.glossary.map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.def)}</dd></div>`).join('')}</dl>` : '';
  return `<article class="case" id="${esc(c.material)}" aria-labelledby="case-${esc(c.material)}-t">
    <header class="case__head">
      <p class="eyebrow">${esc(m ? m.name : c.material)}${m?.role ? ` · ${esc(m.role)}` : ''}</p>
      <h2 class="case__title" id="case-${esc(c.material)}-t">${esc(c.title)}</h2>
      <p class="case__standfirst">${esc(c.standfirst)}</p>
    </header>
    <div class="case__grid">
      <div class="case__intro"><p class="case__k">What it is and why the magnet needs it</p><p>${esc(c.plainIntro)}</p>${gloss}</div>
      <ol class="steps">${steps}</ol>
    </div>
    <div class="case__cold">${icon('search')}<div><p class="case__k">Where the trail goes cold</p><p>${esc(c.coldTrail)}</p></div></div>
    ${m ? `<blockquote class="pull-quote pull-quote--case"><p>${esc(m.bottomLine)}</p><cite>Bottom line · ${esc(m.name)}</cite></blockquote>` : ''}
    <div class="case__ctas">
      ${m ? `<button type="button" class="btn btn--primary" data-trace="${esc(c.material)}">Open the full trace${icon('arrowRight')}</button>` : ''}
      <a class="btn btn--ghost" href="map.html#${esc(c.material)}">See it on the systems map</a>
    </div>
    <details class="case__detail">
      <summary>Show every stage with both lenses and all Sayari records</summary>
      ${m ? traceHtml(m, { lenses: ['security', 'people'], ratingLens: 'people' }) : ''}
    </details>
  </article>`;
}

boot('cases', ['parts', 'chains', 'cases'], (D) => {
  initTrace(D);
  ALL = Object.values(D.chains.materials).flatMap((m) => [...(m.stages || []), ...(m.routes || []).flatMap((r) => r.stages)]);
  const cases = D.cases.cases;
  const aliases = D.cases.aliases || {};
  const navName = (mat) => [D.chains.materials[mat]?.name || mat, ...Object.entries(aliases).filter(([, v]) => v === mat).map(([k]) => D.chains.materials[k]?.name || k)].join(' & ');
  document.getElementById('case-nav').innerHTML = `<ul>${cases.map((c) => `<li><a href="#${esc(c.material)}">${esc(navName(c.material))}</a></li>`).join('')}</ul>`;
  document.getElementById('case-list').innerHTML = cases.map((c) => caseHtml(c, D)).join('');
  document.getElementById('case-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-trace]');
    if (b) openMaterial(b.dataset.trace, b);
  });
  const raw = decodeURIComponent(location.hash.slice(1));
  const hash = aliases[raw] || raw;
  if (hash) document.getElementById(hash)?.scrollIntoView();
});
