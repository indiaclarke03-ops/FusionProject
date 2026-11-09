// Upstream / downstream reach over the systems-map graph.
// A route is only as strong as its weakest link, so a route's evidence is the weakest edge on it,
// and the best route between two places is the one whose weakest link is strongest (a max-min path).

export const EVIDENCE = {
  confirmed: { rank: 3, label: 'Confirmed record', short: 'Confirmed', dash: '', width: 2.4 },
  reported: { rank: 2, label: 'Reported by a credible source', short: 'Reported', dash: '', width: 1.4 },
  inferred: { rank: 1, label: 'Inferred from market structure or a model', short: 'Inferred', dash: '6 5', width: 1.4 },
  hypothesis: { rank: 0, label: 'Hypothesis, untested', short: 'Hypothesis', dash: '2 5', width: 1.4 },
};
export const BY_RANK = ['hypothesis', 'inferred', 'reported', 'confirmed'];
const rankOf = (e) => EVIDENCE[e.status]?.rank ?? 0;

export const KIND_LABEL = {
  mine: 'Mine or source region', trader: 'Trader or export hub', separator: 'Rare earth separator', smelter: 'Smelter',
  refiner: 'Refiner', alloy: 'Metal or alloy maker', component: 'Tape, wire or part maker', magnet: 'Magnet or coil maker',
  developer: 'Fusion developer', policy: 'Rule or lever',
};
export const UPSTREAM_KINDS = ['mine', 'trader', 'separator', 'smelter', 'refiner'];

export function makeGraph(M) {
  const byId = new Map(M.nodes.map((n) => [n.id, n]));
  const supply = M.edges.filter((e) => byId.get(e.from)?.kind !== 'policy' && byId.get(e.to)?.kind !== 'policy');
  const out = new Map(), inn = new Map();
  supply.forEach((e) => {
    if (!out.has(e.from)) out.set(e.from, []);
    if (!inn.has(e.to)) inn.set(e.to, []);
    out.get(e.from).push(e); inn.get(e.to).push(e);
  });
  return { M, node: (id) => byId.get(id), out: (id) => out.get(id) || [], in: (id) => inn.get(id) || [], edges: supply };
}

// Best (max-min) evidence rank from the start set to every reachable node. dir: 'down' or 'up'.
export function reach(G, starts, dir = 'down') {
  const best = new Map();
  const stack = starts.map((s) => [s, 9]);
  starts.forEach((s) => best.set(s, 9));
  while (stack.length) {
    const [u, w] = stack.pop();
    const next = dir === 'down' ? G.out(u) : G.in(u);
    next.forEach((e) => {
      const v = dir === 'down' ? e.to : e.from;
      const ww = Math.min(w, rankOf(e));
      if ((best.get(v) ?? -1) < ww) { best.set(v, ww); stack.push([v, ww]); }
    });
  }
  starts.forEach((s) => best.delete(s));
  return best;
}

// Every route from the start set to an end point (no further hop), strongest first.
export function routes(G, starts, dir = 'down', limit = 400) {
  const found = [];
  const walk = (id, nodes, edges, seen) => {
    if (found.length >= limit) return;
    const next = (dir === 'down' ? G.out(id) : G.in(id)).filter((e) => !seen.has(dir === 'down' ? e.to : e.from));
    if (!next.length) {
      if (edges.length) found.push(finish(nodes, edges));
      return;
    }
    next.forEach((e) => {
      const v = dir === 'down' ? e.to : e.from;
      const s = new Set(seen); s.add(v);
      walk(v, [...nodes, v], [...edges, e], s);
    });
  };
  const finish = (nodes, edges) => {
    // Always store routes in flow order: upstream first.
    const n = dir === 'down' ? nodes : [...nodes].reverse();
    const e = dir === 'down' ? edges : [...edges].reverse();
    const strength = Math.min(...e.map(rankOf));
    const weakest = e.filter((x) => rankOf(x) === strength);
    return { nodes: n, edges: e, strength, weakest };
  };
  starts.forEach((s) => walk(s, [s], [], new Set([s])));
  return found.sort((a, b) => b.strength - a.strength || a.edges.length - b.edges.length);
}

// Developers reached downstream, merged by name (one company can appear in two lanes).
export function developersReached(G, starts) {
  const r = reach(G, starts, 'down');
  const out = new Map();
  r.forEach((rank, id) => {
    const n = G.node(id);
    if (n?.kind !== 'developer') return;
    const cur = out.get(n.label);
    if (!cur || cur.rank < rank) out.set(n.label, { id, label: n.label, rank });
  });
  return [...out.values()].sort((a, b) => b.rank - a.rank || a.label.localeCompare(b.label));
}

// Upstream places with documented harm behind a node.
export function harmUpstream(G, id) {
  const r = reach(G, [id], 'up');
  return [...r.entries()].map(([nid, rank]) => ({ n: G.node(nid), rank }))
    .filter((x) => x.n && ['high', 'moderate'].includes(x.n.harm) && UPSTREAM_KINDS.includes(x.n.kind))
    .sort((a, b) => (b.n.harm === 'high') - (a.n.harm === 'high') || b.rank - a.rank);
}

export const rankLabel = (rank) => EVIDENCE[BY_RANK[Math.max(0, Math.min(3, rank))]];
