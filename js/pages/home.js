import { boot } from '../core.js';
import { esc } from '../ui.js';

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

boot('home', ['background', 'scores'], (D) => {
  drawFilaments();
  const proven = D.scores.routes.filter((r) => r.evidence.link === 'documented').length;
  const el = document.getElementById('stat-proven');
  if (el) el.textContent = `${proven} of ${D.scores.routes.length}`;
  document.getElementById('glossary-list').innerHTML = D.background.glossary
    .map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.def)}</dd></div>`).join('');
});
