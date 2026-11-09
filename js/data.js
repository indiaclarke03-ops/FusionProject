// Loads the JSON data files. Every piece of content on the site comes from /data.

const FILES = {
  parts: 'data/parts.json',
  chains: 'data/chains.json',
  sources: 'data/sources.json',
  scores: 'data/scores.json',
  site: 'data/site.json',
  findings: 'data/findings.json',
};

async function loadOne(key, url) {
  let res;
  try {
    res = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new Error(`Could not reach ${url}. If you opened this file directly from disk, serve the folder over HTTP instead (for example: python3 -m http.server).`);
  }
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status}).`);
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`${url} is not valid JSON: ${err.message}`);
  }
}

export async function loadData(keys = Object.keys(FILES)) {
  const entries = await Promise.all(keys.map(async (k) => [k, await loadOne(k, FILES[k])]));
  const raw = Object.fromEntries(entries);
  const data = { ...raw };
  if (raw.sources) {
    data.sourceIndex = new Map(raw.sources.sources.map((s) => [s.id, s]));
  }
  return data;
}

export function showLoadError(err) {
  const box = document.getElementById('load-error');
  if (!box) return;
  box.hidden = false;
  box.innerHTML = '';
  const h = document.createElement('p');
  h.className = 'load-error__title';
  h.textContent = 'The evidence data did not load, so the reactor and traces cannot be shown.';
  const p = document.createElement('p');
  p.textContent = err.message;
  box.append(h, p);
  console.error(err);
}
