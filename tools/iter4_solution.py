"""Iteration 4: convert the solution research into data/solution.json."""
import json, sys
sys.path.insert(0, "tools")
from srcreg import Registry

R = Registry()
d = json.load(open(sys.argv[1]))
TRIG = {
  "sanctioned": ("sanctioned", "A sanctioned party is in, or trades directly with, the chain"),
  "blending": ("blending", "A blending point upstream: origin is lost at a separator or smelter"),
  "conflict": ("conflict", "A conflict-affected source region upstream"),
  "forced": ("extreme", "Forced labour, child labour or crimes against people documented upstream"),
  "state": ("soe", "A state-owned processor in a high-risk jurisdiction"),
  "opaque": ("opaque", "Opaque: no records, or links that rest only on inference"),
  "modelled": ("modelled", "Only modelled risk flags (Sayari indicators), no documented finding"),
}
def trig(t):
    for k, v in TRIG.items():
        if k in t.lower(): return v
    raise KeyError(t)

def ids(lst): return [x for x in (R.add_dict(s) for s in lst) if x]

comps = [{"name": c["name"].split(". ", 1)[-1], "what": c["what_it_does"], "evidence": c["evidence"], "limits": c["limits"], "sources": ids(c["sources"])} for c in d["components"]]
rules = []
for r in d["prototype_rules"]:
    t, label = trig(r["trigger"])
    rules.append({"trigger": t, "label": label, "severity": r["severity"], "action": r["action"], "why": r["why"], "sources": ids(r["sources"])})
out = {
  "_note": "Iteration 4 solution design (research: Tavily + Sayari test runs). Cost figures are indicative; see limitations.",
  "name": d["name"],
  "headline": "screen, declare, test, watch",
  "tagline": d["tagline"],
  "problem": d["problem_summary"],
  "components": comps,
  "steps": [{"step": s["step"].split(". ", 1)[-1], "who": s["who"], "what": s["what"], "tech": s.get("tech")} for s in d["how_it_works_steps"]],
  "costs": d["costs_and_scale"],
  "whoPays": d["who_pays"],
  "caseForNow": d["case_for_fusion_now"],
  "limitations": d["limitations"],
  "rules": rules,
  "sayariTest": d["sayari_test"],
  "sources": ids(d["sources"]),
  "defaultSupplier": "hts-tape-faraday",
}
json.dump(out, open("data/solution.json", "w"), indent=2, ensure_ascii=False)
R.save()
print("components", len(comps), "rules", [r["trigger"] for r in rules], "sources", len(out["sources"]))
