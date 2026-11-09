"""Iteration 4: merge the research files (r4_hts, r4_lts, r4_other, r4_system) into the site data.

- Sources: every NEWn key is registered once by URL (tools/srcreg.py) and rewritten to a site id.
- Chains: stages replace each material's chain; ROUTES below groups them into shared stages + source routes.
- Map: nodes and edges are unioned; ALIAS fixes ids that different researchers named differently.
- Cases: written to data/cases.json.
Run: python3 tools/iter4_merge.py <research dir>
"""
import json, re, sys, copy
sys.path.insert(0, "tools")
from srcreg import Registry

RD = sys.argv[1]
FILES = ["r4_hts.json", "r4_lts.json", "r4_other.json", "r4_system.json"]
R = Registry()
chains = json.load(open("data/chains.json"))
parked = json.load(open("data/parked.json"))

# Ids the system researcher assumed for nodes defined by the material researchers.
ALIAS = json.load(open("tools/iter4_alias.json"))

def load(f):
    try:
        return json.load(open(f"{RD}/{f}"))
    except FileNotFoundError:
        print("missing", f); return None

def remap_sources(obj, keymap):
    """Rewrite NEWn keys to site ids anywhere in a structure."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("sources", "documented") and isinstance(v, list):
                obj[k] = [keymap.get(x, x) for x in v if keymap.get(x, x)]
            elif k == "source" and isinstance(v, str):
                obj[k] = keymap.get(v, v)
            else:
                remap_sources(v, keymap)
    elif isinstance(obj, list):
        for v in obj: remap_sources(v, keymap)

# Parked sources (lithium-6, beryllium history) come back into the registry if cited.
parked_by_id = {s["id"]: s for s in parked.get("sources", [])}

all_stages, nodes, edges, cases, decisions, negatives, extra = [], {}, [], [], [], [], {}
for f in FILES:
    d = load(f)
    if not d: continue
    keymap = {}
    for s in d.get("new_sources", []):
        keymap[s["key"]] = R.add(s.get("title"), s.get("publisher"), s.get("date"), s.get("url"))
    # Re-register parked ids (S17, S18, S19, S20, S23, S24, S30...) that the researchers reused.
    def readd(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ("sources", "documented") and isinstance(v, list):
                    for x in v:
                        if x in parked_by_id and x not in keymap:
                            p = parked_by_id[x]
                            keymap[x] = R.add(p["title"], p["publisher"], p.get("date"), p["url"])
                else: readd(v)
        elif isinstance(o, list):
            for v in o: readd(v)
    readd(d)
    remap_sources(d, keymap)
    all_stages += d.get("stages", [])
    for n in d.get("map", {}).get("nodes", []):
        n["id"] = ALIAS.get(n["id"], n["id"])
        if n["id"] in nodes:  # keep the richer record, merge materials
            old = nodes[n["id"]]
            old["materials"] = sorted(set(old.get("materials", [])) | set(n.get("materials", [])))
            for k, v in n.items():
                if not old.get(k) and v: old[k] = v
        else:
            nodes[n["id"]] = n
    for e in d.get("map", {}).get("edges", []):
        e["from"] = ALIAS.get(e["from"], e["from"]); e["to"] = ALIAS.get(e["to"], e["to"])
        edges.append(e)
    cases += d.get("cases", [])
    decisions += [f"[{f}] {x}" for x in d.get("decisions_for_author", [])]
    negatives += d.get("negative_results", [])
    if "demand_context" in d: extra["demand"] = d["demand_context"]

json.dump({"stages": all_stages, "nodes": list(nodes.values()), "edges": edges, "cases": cases,
           "decisions": decisions, "negatives": negatives, "extra": extra},
          open(f"{RD}/merged_raw.json", "w"), indent=2, ensure_ascii=False)
R.save()
ids = set(nodes)
dangling = [(e["from"], e["to"]) for e in edges if e["from"] not in ids or e["to"] not in ids]
print("stages", len(all_stages), "nodes", len(nodes), "edges", len(edges), "cases", len(cases))
print("dangling edges:", dangling)
print("materials:", sorted({s["material"] for s in all_stages}))
