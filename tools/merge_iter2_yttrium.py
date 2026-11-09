# HISTORICAL (iteration 2). Do not re-run: data has since been edited by later steps (see tools/README.md).
"""Iteration 2: merge Sayari yttrium/REBCO findings and correct the CFS<->Moscow wording."""
import json, sys
sys.path.insert(0, "tools")
from merge_iter2 import S, stage, L  # reuses helpers (re-running merge_iter2 is idempotent)

chains = json.load(open("data/chains.json"))
M = chains["materials"]
y = M["yttrium"]
old_routes = y["routes"]
kachin = old_routes[0]["stages"][0]
kachin["evidenceNote"] = ("Published investigations focus on dysprosium and terbium; yttrium-specific tracing to tape was not found. "
                          "Sayari holds no Myanmar-to-China rare earth trade records, so this stage rests on NGO and press sources.")

y["whyItMatters"] = L("Compact tokamaks use high-temperature superconducting magnets made from REBCO tape (\"rare-earth barium copper oxide\"). The rare earth is usually yttrium and cannot easily be substituted. Some makers use gadolinium instead, with yttrium oxide in the buffer layers beneath it.", "S10", "SY")

CFS = S("Commonwealth Fusion Systems LLC","USA","pvo3Wv7gZb9K0hiji7-Nag","confirmed","Fusion developer; tape buyer",
        "Russian customs: 9 export records of coated Hastelloy C276 tape from S-Innovations to CFS, Jan–Apr 2022.","Not sanctioned; no watchlist hits.")
SINN = S("OOO S-Innovatsii (S-Innovations LLC)","RUS","ZhPhawms5E3chJhzhiai8Q","confirmed","Moscow tape maker in the SuperOx group (per public reporting)",
        "Exported coated tape to CFS (2022) and to Faraday Factory Japan (2023–25). INN 5032242530.","Not sanctioned. Flags: imports_bis_high_priority_items, sanctioned_adjacent (trade adjacency only).")

y["stages"] = [
  stage("Reactor / developer","Compact tokamak developers (e.g. Commonwealth Fusion Systems)",
    sec=L("Compact tokamak developers depend on HTS tape. CFS buys from Fujikura (an order for over 10,000 km in 2026) and Faraday Factory Japan. Russian customs records also show coated Hastelloy tape (oxide, silver and copper layers) exported from Moscow to CFS in January–April 2022.", "S10", "S11", "S37", "S36", "SY"),
    ppl=L("Buyers sit several tiers removed from the mine. No public human rights traceability for magnet materials was found.", "S10", "S11"),
    ev=[{"level":"documented","scope":"absence of traceability"},{"level":"documented","scope":"tape purchases and shipment records"}],
    supply="moderate", sayari=[CFS]),
  stage("Component maker","REBCO tape makers",
    sec=L("A small number of makers supply fusion: Fujikura and Faraday Factory Japan (CFS), and Faraday Factory (Proxima Fusion). Sayari shows Faraday Factory Japan importing coated Hastelloy tape from Moscow until January 2025, some described with yttrium-containing oxide layers.", "S36", "S37", "S38", "SY"),
    ppl=L("Sayari shows no yttrium oxide or yttrium targets reaching any tape maker. Japan publishes no shipment-level import data, so the step into Japanese tape makers cannot be seen.", "SY"),
    ev=[{"level":"documented","scope":"who makes the tape"},{"level":"not-researched","scope":"where their yttrium comes from"}],
    supply="high",
    sayari=[
      S("Fujikura Ltd.","JPN","U7SEXp0vAeOhQOSFYm0SMw","confirmed","Tape maker; CFS's main supplier for ARC","No HTS tape or yttrium shipments recorded.","Not sanctioned. Group-level modelled flags come from its wider cable trade, not HTS tape."),
      S("Faraday Factory Japan LLC","JPN","C13ZLDlfTD93f5CM_BpokA","confirmed","Tape maker; supplies CFS and Proxima Fusion","369 shipments received from Russia, Feb 2023 – Jan 2025, e.g. 'Hastelloy C276 alloy tape with Mg, Cu, Ba, Y oxide layers'.","Not sanctioned; no watchlist hits."),
      SINN,
    ]),
  stage("Metal / oxide / alloy","Yttrium oxide",
    sec=L("China added yttrium to export licensing in April 2025; US-bound yttrium exports collapsed afterwards.", "S6", "S7"),
    ev=[{"level":"documented","scope":"security fact"}], supply="high"),
  stage("Separation / refining","Heavy rare earth separation, China (and Lynas, Malaysia)", blending=True,
    sec=L("Separation of heavy rare earths, including yttrium, is overwhelmingly in China. Sayari records Jiangxi and Fujian separators shipping yttrium oxide to Japanese trading houses in 2022, and Lynas (Malaysia), a non-Chinese separator, shipping rare earth compounds to Korea in 2025–26. None is recorded selling to a tape maker.", "S6", "S3", "SY"),
    ppl=L("Ore from Myanmar enters Chinese separation plants and leaves as Chinese product. Origin is lost here.", "S6", "S3"),
    ev=[{"level":"documented","scope":"market structure"},{"level":"hypothesis","scope":"these separators supplying tape makers"}],
    supply="high",
    sayari=[
      S("Ganzhou Chenguang Rare Earths New Material","CHN","pwT07K1hiAqggNIqqsSC3g","confirmed","Jiangxi separator","1 shipment HS 284690 'yttrium oxide' to Shinwa Bussan (Japan), 2022-04.","Flag psa_owned_by_chinese_soe (inferred). No watchlist hits."),
      S("Quannan Advanced Resource Rare Earths","CHN","7SZfLoSaTKfksyadM6GLhw","confirmed","Jiangxi separator","1 shipment HS 284690 'yttrium oxide' to Shinwa Bussan (Japan), 2022-04."),
      S("Fujian Changting Golden Dragon Rare Earth","CHN","1GJdbc2dwpmkOWMaK4bahQ","confirmed","Fujian separator","1 shipment HS 284690 'yttrium oxide' to Mitsubishi International, 2022-10.","No watchlist hits."),
      S("Lynas Malaysia Sdn Bhd","MYS","VfV46hV0zGnfCbA1Io_EOw","confirmed","Non-Chinese separator","12 shipments HS 284690 to Korean buyers, 2025-06 to 2026-01; none a known tape maker.","Not sanctioned. Its forced-labour and SOE flags are modelled sub-tier indicators, not findings about its operations."),
    ]),
]
y["routes"] = old_routes
y["bottomLine"] = ("The magnets at the heart of compact fusion depend on yttrium separated overwhelmingly in China, where ore from militia-controlled Kachin State is mixed in and its origin lost. "
                   "Sayari confirms who makes the tape and that part of it ran through Moscow until 2025, but no record shows where any tape maker's yttrium comes from. Harm at Kachin is documented; the link into fusion magnets is likely, not proven.")

# Correct CFS -> Moscow wording on the nickel chain with the verified records.
n = M["nickel"]
n["stages"][0]["security"] = L("CFS buys tape from Faraday Factory Japan and Fujikura. Russian customs records in Sayari show two flows with Moscow's S-Innovations group: coated Hastelloy tape exported to CFS in January–April 2022 (9 records), and uncoated Hastelloy C-276 tape exported by CFS to Moscow from May 2022 to December 2024 (15 records), declared 'for own use for research purposes'.", "S36", "S37", "SY")
n["stages"][0]["evidence"] = [{"level":"documented","scope":"shipment records"}]
n["stages"][0]["sayari"][0]["basis"] = "Russian customs: 11 HS 750620 imports from CFS by S-Innovations (2022-05 to 2024-12) and 4 by SuperOx-Innovations (2023-04 to 2023-10); 9 exports of coated tape from S-Innovations to CFS (2022-01 to 2022-04)."

json.dump(chains, open("data/chains.json","w"), indent=2, ensure_ascii=False)

src = json.load(open("data/sources.json"))
if not any(s["id"]=="S38" for s in src["sources"]):
    src["sources"].append({"id":"S38","title":"Faraday Factory Japan signed an agreement to deliver superconductor tape for the demo stellarator magnet of Proxima Fusion","publisher":"PR Newswire via Yahoo Finance","date":"2025","url":"https://finance.yahoo.com/news/faraday-factory-japan-signed-agreement-071500430.html"})
json.dump(src, open("data/sources.json","w"), indent=2, ensure_ascii=False)
print("ok")
