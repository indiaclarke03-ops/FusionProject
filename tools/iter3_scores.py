"""Iteration 3: Exposure Pathway scores (Claude's judgement from the verified evidence; author to review)."""
import json
sc = json.load(open("data/scores.json"))
sc["_note"] = "Exposure Pathway scores, 1 (low) to 3 (high). Iteration 3 scores are Claude's judgement from the verified evidence, for the author to review. Each score has a one-line note; 'sources' lists the evidence behind the row."
sc["status"] = "Scores are a first judgement from the evidence on this site, pending the author's review."

def R(id_, label, route, material, harm_ev, link_ev, s, n, sources):
    return {"id":id_,"label":label,"route":route,"material":material,
            "evidence":{"harm":harm_ev,"link":link_ev},
            "scores":dict(zip(["harm","evidence","traceability","leverage"], s)),
            "notes":dict(zip(["harm","evidence","traceability","leverage"], n)),"sources":sources}

sc["routes"] = [
 R("yttrium-kachin","Yttrium","Kachin State, Myanmar","yttrium","documented","likely",[3,2,3,2],
   ["Child miners' deaths, violence and sexual exploitation of workers, deadly landslides, armed-group control.",
    "Myanmar supplies a significant share of world yttrium, but no record traces it into tape.",
    "Ore is mixed into Chinese separation plants and leaves as Chinese product.",
    "Fusion is now a main customer of HTS tape makers, but has no leverage over separators or mines alone."],
   ["S1","S3","S39","S43","SY"]),
 R("yttrium-south-china","Yttrium","Southern China ionic clays","yttrium","documented","likely",[2,2,2,2],
   ["Severe environmental damage (US$5.6bn cleanup, 50–100 years to recover); no documented abuses against people.",
    "China produces most of the world's yttrium, so fusion yttrium likely includes it; no record shows it.",
    "Country of origin survives, but specific mines are lost at separation.",
    "Same as Kachin: leverage over tape makers, not over Chinese separators."],
   ["S3","S39"]),
 R("tin-wa","Tin","Man Maw, Wa State, Myanmar","tin","documented","likely",[3,2,3,3],
   ["Controlled by a US-sanctioned armed group listed by the UN for child recruitment; 2022 explosion killed nine.",
    "Man Maw is a major share of world tin supply; the link is market-level, not traced.",
    "No smelters in Wa; ore is smelted in Yunnan and no trade records show the flow.",
    "Fusion's tin demand is tiny next to electronics solder; only a cross-sector pool could move it."],
   ["S8","S47","S48","S46"]),
 R("tin-malaysia","Tin","Great Lakes traders → Malaysia Smelting Corp","tin","documented","hypothesis",[2,1,3,3],
   ["Smelter bought ore from an OFAC-sanctioned trader tied to Rubaya; harm is at the source, the link is indirect.",
    "Nothing shows this smelter's tin reaching a fusion strand maker.",
    "Records name countries, not mines; Rwandan exports mix in smuggled Congolese ore.",
    "Same as Wa State: fusion is a negligible tin buyer."],
   ["S49","S16","SY"]),
 R("niobium-rubaya","Niobium","Rubaya, eastern DRC","niobium","documented","hypothesis",[3,1,3,3],
   ["Forced labour, torture and killings of miners by M23; mass deaths in tunnel collapses.",
    "Brazil supplies about 93% of niobium; no record links Rubaya coltan to a strand maker.",
    "Laundered as 'Rwandan' exports and processed by smelters that passed audits.",
    "Superconductor niobium is a sliver of a market dominated by steelmaking."],
   ["S50","S49","S51","S15","S16","S21"]),
 R("nickel-indonesia","Nickel","Indonesia (Morowali, Weda Bay)","nickel","documented","hypothesis",[3,1,3,3],
   ["21 workers killed in a 2023 smelter blast; coercive land-taking with police and military; rising respiratory illness.",
    "Sayari shows no path from Hastelloy substrate to Indonesian nickel.",
    "Nickel from many origins is melted together in alloy mills; Chinese mills have no upstream data.",
    "Hastelloy mills serve the chemical industry; tape substrate is a tiny share."],
   ["S12","S13","S45","SY"]),
 R("tungsten","Tungsten","Rwanda, Colombia → powder makers","tungsten","documented","hypothesis",[2,1,3,2],
   ["Armed-group control and extortion at some Colombian mines (2 sources); no documented forced labour or killings at these mines.",
    "A Western powder maker buys through a trader that also handles Rwandan ore; no shipment shows conflict ore reaching it.",
    "Concentrate from many origins is converted to APT and powder.",
    "Fusion buys from a handful of qualified makers (e.g. A.L.M.T.), which could pass sourcing conditions upstream."],
   ["S14","S54","S22","SY"]),
]
json.dump(sc, open("data/scores.json","w"), indent=2, ensure_ascii=False)
print("ok", len(sc["routes"]))
