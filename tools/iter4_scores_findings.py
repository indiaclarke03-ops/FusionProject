"""Iteration 4: new scored routes and findings from the deeper Sayari research."""
import json
sc = json.load(open("data/scores.json")); f = json.load(open("data/findings.json"))
def R(id_, label, route, material, harm_ev, link_ev, s, n, sources):
    return {"id": id_, "label": label, "route": route, "material": material, "evidence": {"harm": harm_ev, "link": link_ev},
            "scores": dict(zip(["harm", "evidence", "traceability", "leverage"], s)),
            "notes": dict(zip(["harm", "evidence", "traceability", "leverage"], n)), "sources": sources}
routes = {r["id"]: r for r in sc["routes"]}
routes["yttrium-kachin"]["notes"]["evidence"] = "Chinese customs data show 28,000+ t of rare earths from Myanmar in Jan–Sep 2025, but no record traces any of it into tape."
routes["yttrium-kachin"]["sources"] = sorted(set(routes["yttrium-kachin"]["sources"] + ["S88"]))
routes["tin-wa"]["notes"]["evidence"] = "Yunnan Tin told Reuters some of its tin came from the Wa mine, and Bruker's group smelter list names Yunnan Tin; the link into strand is likely, not proven."
routes["tin-wa"]["sources"] = sorted(set(routes["tin-wa"]["sources"] + ["S113", "S108"]))
new = [
 R("niobium-brazil", "Niobium", "CBMM, Brazil → Western Superconducting (ITER)", "niobium", "documented", "documented", [1, 3, 1, 3],
   ["Legacy barium contamination under a prosecutors' agreement; no reports of conflict, forced or child labour.",
    "Western Superconducting's prospectus records niobium bought from CBMM to meet ITER's requirements.",
    "One industrial mine and a named distributor (CITIC Metal): the route is visible end to end.",
    "Superconductor niobium is a sliver of a market dominated by steelmaking."], ["S110", "S111", "S21", "S56"]),
 R("tungsten-vietnam", "Tungsten", "Nui Phao, Vietnam → A.L.M.T. (ITER divertor)", "tungsten", "documented", "likely", [2, 2, 2, 2],
   ["Residents' pollution complaints led to a 2016 government inspection; no documented abuses against workers.",
    "Sayari shows A.L.M.T. taking tungsten APT only from Masan at Nui Phao (2023–26); which batches went to ITER is not recorded.",
    "One mine-to-processor complex feeds one maker, so origin survives further than in most chains.",
    "A.L.M.T. is one of very few fusion-grade suppliers; ITER and F4E are significant customers of its fusion line."], ["S27", "S127", "S128", "SY"]),
 R("beryllium-us", "Beryllium", "Spor Mountain, Utah → Materion → CFS", "beryllium", "documented", "documented", [2, 3, 1, 2],
   ["Chronic beryllium disease among workers is documented (settlements; a 2023 federal claim from the Utah mill).",
    "Materion has a public supply agreement with Commonwealth Fusion Systems.",
    "A single US mine and mill: origin is clear.",
    "Fusion is a new but visible customer of a small specialist supplier."], ["S154", "S142", "S143", "S144", "S155"]),
 R("copper-grasberg", "Copper", "Grasberg, Papua → Luvata → CFS coils", "copper-hts", "documented", "likely", [2, 2, 2, 3],
   ["Tailings damage to rivers and killings linked to security forces reported; seven workers died in a 2025 mine disaster.",
    "CFS's copper conductor came from Luvata Pori, which buys Indonesian cathode; the cathode-to-conductor link is not batch-traced.",
    "Cathode carries its smelter of origin, but mixes with other supply at the conductor maker.",
    "Fusion is a negligible share of world copper demand."], ["S105", "S106", "SY"]),
 R("chromium-limpopo", "Chromium (steel)", "Limpopo chrome mines → stainless steel", "steel", "documented", "hypothesis", [3, 1, 3, 3],
   ["Human Rights Watch documents police and company violence against protesters at a Limpopo chrome mine.",
    "No record links this chrome to the mills that made ITER's or EUROFER97 steel.",
    "Chrome is alloyed into steel at the mill; origin is not tracked.",
    "Fusion's steel demand is tiny next to the stainless steel industry."], ["S136", "S134"]),
]
order = ["yttrium-kachin", "yttrium-south-china", "tin-wa", "tin-malaysia", "niobium-rubaya", "niobium-brazil", "nickel-indonesia", "copper-grasberg", "tungsten", "tungsten-vietnam", "beryllium-us", "chromium-limpopo"]
for r in new: routes[r["id"]] = r
sc["routes"] = [routes[i] for i in order if i in routes]
json.dump(sc, open("data/scores.json", "w"), indent=2, ensure_ascii=False)

F = f["findings"]
F[0]["body"] = ("Sayari identifies the tape makers, and Chinese customs data show more than 28,000 tonnes of rare earths entering China from Myanmar in January–September 2025. "
                "But the Moscow tape plant bought its yttrium as finished targets from Korea, the Czech Republic, Japan and China, and none of those target makers has any recorded supplier. "
                "Japanese import records show no yttrium compounds reaching Fujikura or Faraday Factory Japan. The step where Kachin ore would enter a fusion magnet is invisible to trade data.")
F[0]["sources"] = ["SY", "S88"]
F[0]["sayari"] = [{"name": "S-Innovations LLC", "url": "https://graph.sayari.com/resource/entity/ZhPhawms5E3chJhzhiai8Q"},
                  {"name": "Faraday Factory Japan", "url": "https://graph.sayari.com/resource/entity/C13ZLDlfTD93f5CM_BpokA"}]
extra = [
 {"lead": "Western Superconducting bought Brazilian niobium for ITER through a state channel.",
  "body": "China's ITER strand maker, Western Superconducting, records in its stock-market prospectus that it bought niobium ingots from Brazil's CBMM to meet ITER's requirements, through CITIC Metal, CBMM's sole China distributor and a Western Superconducting shareholder. It is one of the few places where a fusion material can be followed from a named mine to a fusion project. The mine has no documented abuses beyond legacy pollution.",
  "evidence": [{"level": "documented", "scope": "company disclosures"}],
  "sayari": [{"name": "Western Superconducting Technologies", "url": "https://graph.sayari.com/resource/entity/sHd3C6y1EF_j7cxUmp8p4w"}],
  "sources": ["S110", "S111", "S21"], "material": "niobium"},
 {"lead": "ITER's divertor tungsten traces back to a single Vietnamese mine.",
  "body": "Customs records in Sayari show A.L.M.T., the Sumitomo company making tungsten monoblocks for ITER's divertor, importing its tungsten (as ammonium paratungstate) only from Masan's plant at the Nui Phao mine in Vietnam, in 12 shipments from 2023 to 2026. In 2016, residents' pollution complaints there led to a government inspection that considered relocating two hamlets.",
  "evidence": [{"level": "documented", "scope": "customs records"}, {"level": "likely", "scope": "link to ITER parts"}],
  "sayari": [{"name": "A.L.M.T. Corp.", "url": "https://graph.sayari.com/resource/entity/zU77O-fwc2mLS7abnqZAWQ"}],
  "sources": ["SY", "S27", "S127", "S128"], "material": "tungsten"},
]
have = {x["lead"] for x in F}
F += [x for x in extra if x["lead"] not in have]
json.dump(f, open("data/findings.json", "w"), indent=2, ensure_ascii=False)
print("routes", len(sc["routes"]), "findings", len(F))
