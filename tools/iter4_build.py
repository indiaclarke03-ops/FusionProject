"""Iteration 4: build chains.json, map.json, cases.json and parts.json from the merged research.
Run after tools/iter4_merge.py:  python3 tools/iter4_build.py <research dir>
"""
import json, sys, copy, re
RD = sys.argv[1]
raw = json.load(open(f"{RD}/merged_raw.json"))
chains = json.load(open("data/chains.json"))
old = chains["materials"]
parked = json.load(open("data/parked.json"))["materials"]

# ---------- judgement calls (documented in DECISIONS.md) ----------
# Actor-level listings (UN child-recruitment listing of an armed group) are not site-level extreme harm;
# consistent with iteration 3 (Man Maw). Single undated statement (Grasberg) not used as extreme trigger.
NOT_EXTREME = ["Eastern Shan State", "Myanmar–China border crossings", "Grasberg mine"]

# How each material's stages split into shared stages and source routes (reactor -> mine order).
ROUTES = {
  "yttrium": (5, [("Myanmar: Kachin and Shan", ["Myanmar–China border", "Kachin State", "Eastern Shan"]),
                  ("Southern China ionic clays", ["Southern China"])]),
  "nickel": (3, [("Indonesia, via Chinese refining", ["Chinese nickel refining", "Indonesian nickel"]),
                 ("Russia", ["Russian nickel"])]),
  "tin": (3, [("Man Maw, Wa State → Yunnan smelters", ["Yunnan Tin", "Man Maw"]),
              ("Great Lakes ore → Malaysia Smelting Corp", ["Malaysia Smelting", "Metals traders"])]),
  "niobium": (2, [("Brazil, via CITIC Metal", ["CITIC Metal", "Brazil"]),
                  ("Eastern DRC, via Rwanda", ["Tantalum-niobium smelters", "Rwanda coltan", "Rubaya"])]),
  "tungsten": (2, [("Vietnam: Nui Phao (A.L.M.T.)", ["Masan Tungsten", "Nui Phao"]),
                   ("Plansee group: Rwanda and Colombia", ["Global Tungsten", "Rwanda (Nyakabingo)"]),
                   ("China: southern Jiangxi (AT&M)", ["Southern Jiangxi"])]),
  "steel": (1, [("ITER stainless steel (316L(N)-IG)", ["ITER-grade stainless", "Chromium"]),
                ("EUROFER97 low-activation steel", ["EUROFER97", "Vanadium"])]),
  "lithium6": (1, [("New enrichers (US)", ["Molten Salt Solutions", "Natural lithium"]),
                   ("Russia and China", ["Novosibirsk"]),
                   ("History: Oak Ridge", ["Oak Ridge"])]),
  "beryllium": (1, [("US: Materion", ["Materion", "Spor Mountain"]),
                    ("Kazakhstan and China (EU DEMO)", ["Karlsruhe", "Ulba"])]),
}

META = {
  "yttrium": ("Yttrium", "hts-magnets", "The rare earth in REBCO tape and its buffer layers"),
  "nickel": ("Nickel", "hts-magnets", "The Hastelloy alloy strip that REBCO tape is built on"),
  "copper-hts": ("Copper", "hts-magnets", "Stabiliser plated on the tape, and conductor in the coils"),
  "silver": ("Silver", "hts-magnets", "Protective cap layer on REBCO tape"),
  "tin": ("Tin", "lts-magnets", "Half of the Nb₃Sn superconductor"),
  "niobium": ("Niobium", "lts-magnets", "Half of the Nb₃Sn superconductor"),
  "copper-lts": ("Copper (wire magnets)", "lts-magnets", "The copper matrix around the superconducting filaments"),
  "tungsten": ("Tungsten", "divertor", "Plasma-facing armour for the divertor"),
  "lithium6": ("Lithium-6", "blanket", "Enriched lithium for breeding tritium fuel"),
  "beryllium": ("Beryllium", "blanket", "Neutron multiplier in the blanket"),
  "steel": ("Specialty steels", "vacuum-vessel", "Structural steels for the vessel and blanket"),
}

BOTTOM = {
  "yttrium": "The magnets at the heart of compact fusion depend on yttrium separated overwhelmingly in China, where ore from armed-group-controlled Kachin State is mixed in and its origin lost. The records show yttrium reaching the Moscow tape plant as finished targets from Korea, the Czech Republic, Japan and China, but no record shows which mine any of it came from. Harm at Kachin is documented; the link into fusion magnets is likely, not proven.",
  "nickel": "Sayari did not confirm the Indonesia hypothesis: no path links tape substrate to Morowali or Weda Bay. It found a different route instead. Hastelloy strip from the US, China and Japan-based traders went to a Moscow plant that coated it for a Japanese maker supplying fusion developers.",
  "tin": "Fusion's Nb₃Sn strand makers are known, and one of them lists Yunnan Tin among its group's smelters; Yunnan Tin has said some of its tin came from the Wa State mine run by a US-sanctioned armed group. A second smelter in Malaysia buys from traders who also handle Rwanda's conflict-linked coltan. The harm is documented; the route into fusion strand is likely, not proven.",
  "niobium": "About 93% of niobium comes from Brazil, and Western Superconducting's prospectus shows it bought Brazilian niobium from CBMM to meet ITER's requirements. A small stream from M23-occupied Rubaya, where forced labour and killings are documented, is laundered through Rwanda; whether any of it reaches fusion strand remains a hypothesis.",
  "tungsten": "Only a handful of firms make fusion-grade tungsten, and China mines about four-fifths of the world's supply. ITER's Japanese divertor maker buys its tungsten from a Vietnamese mine where residents' pollution complaints led to a government inspection. Nothing ties conflict-linked ore to a fusion part.",
  "steel": "Fusion's structural steels come from a few European mills with no human rights hotspot found. Their alloying metals do not stop there: chromium comes partly from South African mines where protesters have faced violence, though no record links that chrome to fusion steel.",
  "lithium6": "Fusion's fuel chain has caused harm before: lithium-6 enrichment at Oak Ridge left mercury in a creek that still exceeds water-quality criteria. Today the only producers are in Russia and China, one of them on Ukraine's sanctions list, and new enrichers are only now signing deals with fusion developers.",
  "beryllium": "Beryllium for fusion comes from very few places: a US mine and mill, and a Kazakh state plant that has shipped beryllium for the EU's DEMO blanket. The documented harm is to workers' lungs, not conflict.",
  "copper-hts": "The copper in a fusion magnet can be traced further than most of its metals: CFS's copper conductor came from a Finnish maker that buys cathode refined from Indonesia's Grasberg mine, where security-force killings and tailings damage have been reported.",
  "silver": "The silver cap on REBCO tape leaves almost no paper trail. Where it was mined is not recorded for any fusion tape.",
  "copper-lts": "The copper in fusion wire comes from European refiners with no documented harm, but their mine sources were not traced.",
}

def match(stages, key):
    for s in stages:
        if s["name"].startswith(key) or key.lower() in s["name"].lower():
            return s
    raise KeyError(key)

def to_chain_stage(s):
    st = {k: s[k] for k in ("tier", "name", "security", "people", "evidence") if k in s}
    st["blending"] = bool(s.get("blending"))
    if s.get("sayari"): st["sayari"] = s["sayari"]
    if s.get("harm"):
        h = copy.deepcopy(s["harm"])
        if any(s["name"].startswith(x) for x in NOT_EXTREME):
            h["extreme"] = False
            h["note"] = "Actor-level or single undated evidence: not used as the extreme-harm trigger."
        st["harm"] = h
    st["rating"] = {"supply": s.get("supply") or "unknown", "harm": "unknown"}
    if s.get("supplyReason"): st["supplyReason"] = s["supplyReason"]
    if "Oak Ridge" in s["name"]: st["history"] = True; st["tier"] = "Lessons from history"
    return st

by_mat = {}
for s in raw["stages"]:
    by_mat.setdefault(s["material"], []).append(s)

new = {}
for mat, (name, part, role) in META.items():
    stages = by_mat.get(mat, [])
    if not stages:
        continue
    m = {"name": name, "part": part, "role": role}
    prev = old.get(mat) or parked.get(mat) or {}
    if prev.get("whyItMatters"): m["whyItMatters"] = prev["whyItMatters"]
    if mat in ROUTES:
        n_common, routes = ROUTES[mat]
        used = set()
        routes_out = []
        for rname, keys in routes:
            rs = [match(stages, k) for k in keys]
            used |= {id(x) for x in rs}
            routes_out.append({"name": rname, "stages": [to_chain_stage(x) for x in rs]})
        common = [x for x in stages if id(x) not in used]
        m["stages"] = [to_chain_stage(x) for x in common]
        m["routes"] = routes_out
    else:
        m["stages"] = [to_chain_stage(x) for x in stages]
    if prev.get("context"): m["context"] = prev["context"]
    m["bottomLine"] = BOTTOM[mat]
    new[mat] = m

# Who builds the magnets: system researcher's magnet-maker stages become context cards.
mag = [s for s in raw["stages"] if s["material"] in ("hts-magnets", "lts-magnets")]
for s in mag:
    card = {"label": f"{s['tier']}: {s['name']}", "text": " ".join(x for x in [(s.get("security") or {}).get("text"), (s.get("people") or {}).get("text")] if x),
            "sources": sorted(set((s.get("security") or {}).get("sources", []) + (s.get("people") or {}).get("sources", []))),
            "evidence": s.get("evidence") or [{"level": "no-evidence"}]}
    target = "yttrium" if s["material"] == "hts-magnets" else "tin"
    new[target].setdefault("context", []).append(card)

chains["materials"] = new
json.dump(chains, open("data/chains.json", "w"), indent=2, ensure_ascii=False)

# ---------- parts ----------
parts = json.load(open("data/parts.json"))
PART_MATS = {"hts-magnets": ["yttrium", "nickel", "copper-hts", "silver"], "lts-magnets": ["tin", "niobium", "copper-lts"],
             "divertor": ["tungsten"], "blanket": ["lithium6", "beryllium"], "vacuum-vessel": ["steel"]}
for p in parts["parts"]:
    p["materials"] = [m for m in PART_MATS[p["id"]] if m in new]
    p.pop("notTraced", None)
    if p["id"] == "blanket":
        p["description"] = "The breeding blanket surrounds the plasma, breeds tritium fuel from lithium-6 and absorbs neutrons. Beryllium multiplies neutrons so the blanket breeds enough fuel."
json.dump(parts, open("data/parts.json", "w"), indent=2, ensure_ascii=False)

# ---------- map ----------
DROP = {"ru-aviabor"}
FLAGS = {
  "sanctioned": ["sn-manmaw", "sn-ore-traders", "sn-msc", "lts-chmp", "li-nccp", "be-ulba"],
  "conflict": ["y-kachin", "y-shan", "y-border", "sn-manmaw", "nb-rubaya", "nb-rwanda", "sn-greatlakes", "w-colombia"],
  "extreme": ["y-kachin", "nb-rubaya", "s-chrome-za", "ag-bolivia"],
  "soe": ["y-cn-sep", "sn-yunnan", "nb-otic", "lts-wst", "w-atm", "be-ulba", "lts-chmp", "li-nccp", "nb-citic"],
  "modelled": ["w-masan", "cu-kme", "mag-qst-japan", "hts-sst"],
}
HARM_FIX = {"y-shan": "moderate", "cu-grasberg": "moderate"}
SOL = {
  "mine": ["satellite", "fingerprint", "grievance"], "trader": ["screening", "passport"],
  "separator": ["screening", "passport", "fingerprint"], "smelter": ["screening", "passport", "fingerprint"],
  "refiner": ["screening", "passport"], "alloy": ["screening", "passport"], "component": ["screening", "passport"],
  "magnet": ["passport"], "developer": ["passport", "funding"],
}
nodes = []
for n in raw["nodes"]:
    if n["id"] in DROP: continue
    if n["kind"] == "policy":
        n["stage"] = -1; n["lane"] = "shared"; n["harm"] = None; n["supply"] = None
    n["harm"] = HARM_FIX.get(n["id"], n.get("harm"))
    n["flags"] = [f for f, ids in FLAGS.items() if n["id"] in ids]
    if n["kind"] == "policy":
        n["solution"] = []
    elif n["kind"] == "mine":
        n["solution"] = ["satellite", "fingerprint", "grievance"] if n.get("harm") in ("high", "moderate") else ["satellite"]
    else:
        n["solution"] = SOL.get(n["kind"], [])
    nodes.append(n)
ids = {n["id"] for n in nodes}
edges = [e for e in raw["edges"] if e["from"] in ids and e["to"] in ids]
mp = {
  "_note": "Systems map of the fusion magnet supply chain (iteration 4). Built by tools/iter4_build.py from Sayari and public-source research. Stage 0 = mine ... 6 = fusion developer; policy nodes act on the chain.",
  "stages": ["Mines", "Traders & export", "Separation & smelting", "Metals, alloys & targets", "Tape, wire & parts", "Magnets & coils", "Fusion developers"],
  "lanes": [
    {"id": "hts", "label": "Tape magnets (HTS: yttrium, nickel, copper, silver)", "short": "Tape magnets"},
    {"id": "lts", "label": "Wire magnets (LTS: tin, niobium, copper)", "short": "Wire magnets"},
    {"id": "plasma", "label": "Divertor (tungsten)", "short": "Divertor"},
    {"id": "blanket", "label": "Breeding blanket (lithium-6, beryllium)", "short": "Blanket"},
    {"id": "structure", "label": "Structure (steels)", "short": "Structure"},
    {"id": "shared", "label": "Shared"},
  ],
  "insights": [
    "The chains narrow to a few chokepoints: Chinese rare earth separators, Yunnan and Malaysian tin smelters, and a handful of tape and strand makers. Origin is lost at every one of them.",
    "Harm sits at the left edge of the map, in mines run or taxed by armed groups (Kachin, Wa State, Rubaya), while fusion buyers sit at the right edge with no record linking the two ends.",
    "The strongest evidence runs between companies (customs records, prospectuses, contracts). The weakest runs between mines and processors, which is exactly where the harm is.",
    "Rules act unevenly: conflict-minerals laws cover tin and tungsten but not niobium or rare earths, sanctions hit named traders but not the plants that blend their ore, and public fusion funding carries no sourcing conditions at all.",
    "Fusion has real leverage at one point: it buys most of the world's HTS tape, so tape makers can be asked to name their separators and target suppliers. Further upstream, fusion is too small to act alone.",
  ],
  "demand": raw.get("extra", {}).get("demand"),
  "nodes": nodes,
  "edges": edges,
}
json.dump(mp, open("data/map.json", "w"), indent=2, ensure_ascii=False)

# ---------- cases ----------
ORDER = ["yttrium", "nickel", "copper-hts", "silver", "tin", "niobium", "copper-lts", "tungsten", "steel", "lithium6", "beryllium"]
have = {c["material"]: c for c in raw["cases"]}
def auto_case(mat):
    m = new[mat]
    all_st = list(reversed([*m.get("stages", []), *[s for r in m.get("routes", []) for s in r["stages"]]]))
    return {"material": mat, "title": f"Tracing {m['name'].lower()}", "standfirst": m["bottomLine"].split(". ")[0] + ".",
            "plainIntro": f"{m['name']}: {m['role'].lower()}.",
            "steps": [{"heading": s["name"], "stageName": s["name"],
                       "body": " ".join(x["text"] for x in (s.get("people"), s.get("security")) if x),
                       "sources": sorted(set((s.get("people") or {}).get("sources", []) + (s.get("security") or {}).get("sources", [])))} for s in all_st],
            "coldTrail": "See the full trace for where each link rests on records, reports or inference."}
cases = []
for mat in ORDER:
    if mat not in new: continue
    if mat == "beryllium" and "lithium6" in have:  # combined blanket case covers beryllium
        continue
    cases.append(have.get(mat) or auto_case(mat))
json.dump({"_note": "Plain-language case files (iteration 4).", "aliases": {"beryllium": "lithium6"}, "cases": cases},
          open("data/cases.json", "w"), indent=2, ensure_ascii=False)
print("materials", list(new), "| nodes", len(nodes), "edges", len(edges), "| cases", [c["material"] for c in cases])
