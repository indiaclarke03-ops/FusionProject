"""Iteration 3: apply verified corrections to the yttrium and nickel chains (Tavily + Sayari re-check)."""
import json

c = json.load(open("data/chains.json")); M = c["materials"]
src = json.load(open("data/sources.json"))
f = json.load(open("data/findings.json"))

def L(text, *s): return {"text": text, "sources": list(s)}
def find(mat, name):
    m = M[mat]
    for st in m.get("stages", []) + [x for r in m.get("routes", []) for x in r["stages"]]:
        if st["name"].startswith(name): return st
    raise KeyError(name)

NEW = [
 {"id":"S39","title":"Mineral Commodity Summaries 2026: Yttrium","publisher":"U.S. Geological Survey","date":"2026","url":"https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-yttrium.pdf"},
 {"id":"S40","title":"The Consequences of China's New Rare Earths Export Restrictions","publisher":"CSIS","date":"2025","url":"https://www.csis.org/analysis/consequences-chinas-new-rare-earths-export-restrictions"},
 {"id":"S41","title":"Fujikura high-temperature superconducting wire (product data)","publisher":"Fujikura","date":None,"url":"https://www.fujikura.co.jp/products/superconductors/documents/files/Fujikura_superconductor_EN.pdf"},
 {"id":"S42","title":"S-Innovations / SuperOx: HTS tape for fusion (IAEA technical meeting presentation)","publisher":"IAEA conference archive","date":"2021","url":"https://conferences.iaea.org/event/214/contributions/17053/attachments/10304/14918/2021-05_IAEA_S-Innovations_SuperOx_presentation.pdf"},
 {"id":"S43","title":"Rare Earth Mining in Myanmar's War-Torn Regions","publisher":"ISP-Myanmar","date":"2025","url":"https://ispmyanmar.com/wp-content/uploads/2025/06/Rare-Earth-Mining-in-Myanmars-War-Torn-Regions.pdf"},
 {"id":"S44","title":"Myanmar's rare earth mining boom","publisher":"Yale Environment 360","date":None,"url":"https://e360.yale.edu/features/myanmar-rare-earth-mining"},
 {"id":"S45","title":"Indonesia: Furnace fire at Chinese-owned nickel smelter in Morowali kills 20 workers","publisher":"Business & Human Rights Resource Centre","date":"2023","url":"https://www.business-humanrights.org/en/latest-news/indonesia-furnace-fire-at-chinese-owned-nickel-smelter-in-morowali-kills-20-workers-and-injures-over-40-workers-protest-for-safer-working-conditions"},
]
have = {s["id"] for s in src["sources"]}
src["sources"] += [s for s in NEW if s["id"] not in have]
for s in src["sources"]:
    if s["id"] == "S36": s["date"] = "2024"
    if s["id"] == "S7": s["date"] = "2026"
# S6 is a weak aggregator page: dropped everywhere, replaced by USGS (S39) / CSIS (S7, S40).
src["sources"] = [s for s in src["sources"] if s["id"] != "S6"]

y = M["yttrium"]
y["whyItMatters"] = L("Compact tokamaks use high-temperature superconducting magnets made from REBCO tape (\"rare-earth barium copper oxide\"). Faraday Factory's tape uses yttrium as the rare earth; Fujikura's uses gadolinium or europium. Both put a yttrium-oxide buffer layer under the superconductor, so yttrium is in the tape either way.", "S10", "S41", "S42")

st = find("yttrium", "Compact tokamak developers")
st["people"] = L("Buyers sit several tiers removed from the mine. We found no public human rights traceability for magnet materials from fusion developers or tape makers; industry supply-chain reports (DOE, FIA) do not address it.", "S10", "S11")

st = find("yttrium", "REBCO tape makers")
st["security"] = L("A small number of makers supply fusion: Fujikura and Faraday Factory Japan (CFS), and Faraday Factory (Proxima Fusion). Sayari shows Faraday Factory Japan importing coated Hastelloy tape from Moscow until January 2025. Some is described with a yttrium-oxide buffer and some with barium-copper-yttrium oxide and silver layers, which is the superconducting layer itself.", "S36", "S37", "S38", "SY")
st["people"] = L("Sayari shows no yttrium oxide or yttrium targets reaching any tape maker. Its Japanese import records (from 2023) show Faraday Factory Japan receiving tape from Moscow, but no rare earth shipments to Fujikura or Faraday Factory. Coverage is partial, so the absence is not proof.", "SY")
for e in st["sayari"]:
    if e["name"].startswith("Faraday"):
        e["basis"] = "369 shipments received from Russia, Feb 2023 – Jan 2025 (Russian export and Japanese import records): 261 from S-Innovations, 106 from a same-address duplicate record. Descriptions include 'Hastelloy C276 alloy tape with Mg, Cu, Ba, Y oxide layers and a silver surface layer'."
    if e["name"].startswith("OOO S-Innov"):
        e["role"] = "Moscow tape maker in the SuperOx group"
        e["watchlist"] = "Not sanctioned. Flags: imports_bis_high_priority_items, meu_list_contractors, sanctioned_adjacent (modelled adjacency)."

st = find("yttrium", "Yttrium oxide")
st["security"] = L("China added yttrium to export licensing on 4 April 2025. Chinese customs data show yttrium exports to the US fell to 17 tonnes in April–December 2025, from 333 tonnes in the eight months before.", "S7", "S39", "S40")

st = find("yttrium", "Heavy rare earth separation")
st["security"] = L("Separation of heavy rare earths, including yttrium, is overwhelmingly in China: about 99% until 2023. Sayari records Fujian separators shipping consignments described as yttrium oxide to Japanese importers in 2022–23. Lynas (Malaysia), the main non-Chinese separator, ships mostly light rare earths, largely to Japan. None is recorded selling to a tape maker.", "S40", "S39", "SY")
st["people"] = L("Ore from Myanmar enters Chinese separation plants and leaves as Chinese product. Origin is lost here.", "S3", "S1")
st["sayari"] = [
  {"name":"Fujian Changting Golden Dragon Rare Earth","country":"CHN","entity_url":"https://graph.sayari.com/resource/entity/1GJdbc2dwpmkOWMaK4bahQ","entity_id":"1GJdbc2dwpmkOWMaK4bahQ","link_status":"confirmed","role":"Fujian separator","basis":"Shipments described as 'yttrium oxide' to Japanese importers (Tokuyo International Logistics, Daiichi Kigenso Kagaku Kogyo), 2022–23.","watchlist":"No watchlist hits."},
  {"name":"Ganzhou Chenguang Rare Earths New Material","country":"CHN","entity_url":"https://graph.sayari.com/resource/entity/pwT07K1hiAqggNIqqsSC3g","entity_id":"pwT07K1hiAqggNIqqsSC3g","link_status":"confirmed","role":"Jiangxi separator","basis":"Rare earth compounds (HS 284690) to Shinwa Bussan, Japan, 2022-04; product not specified beyond the HS heading.","watchlist":"Flag psa_owned_by_chinese_soe (inferred)."},
  {"name":"Lynas Malaysia Sdn Bhd","country":"MYS","entity_url":"https://graph.sayari.com/resource/entity/VfV46hV0zGnfCbA1Io_EOw","entity_id":"VfV46hV0zGnfCbA1Io_EOw","link_status":"confirmed","role":"Main non-Chinese separator","basis":"934 HS 284690 shipments 2019–2026, 445 to Japan (mostly Sojitz); products recorded are light rare earths (cerium, NdPr).","watchlist":"Not sanctioned. Its forced-labour and SOE flags are modelled sub-tier indicators, not findings about its operations."},
]

k = find("yttrium", "Kachin State")
k["security"] = L("Myanmar produced a significant share of world yttrium supply in 2025, according to USGS, from ionic-clay heavy rare earth mines in Kachin State.", "S39", "S1", "S3")
k["people"] = L("300+ mining sites in Kachin Special Region 1 (40%+ growth 2021–23), run until late 2024 by a junta-aligned militia and since then under the Kachin Independence Army. Streams are acidic and arsenic-contaminated. Workers, including children, have died after chemical exposure, and landslides killed at least 35 miners in June 2024. Workers report physical violence and sexual exploitation, and opponents of mining face arrests and threats. The trade risks financing conflict.", "S1", "S2", "S3", "S4", "S43", "S44")
k["harm"] = {"documented":["S1","S2","S3","S4","S43"],"types":["deaths","child labour","violence against workers","sexual exploitation","armed-group control","environmental contamination"],"extreme":True,"extremeTypes":["child labour","violence against workers","sexual exploitation"],"extremeBasis":"S1: a 15-year-old boy among miners who died; S3: deaths of mine workers including children; workers report physical violence and sexual exploitation."}

j = find("yttrium", "Southern China")
j["security"] = L("China produced most of the world's yttrium in 2025 (USGS), largely from ionic clays in southern provinces such as Jiangxi and Fujian.", "S39")
j["people"] = L("Severe environmental damage from heavy rare earth mining in Jiangxi: Chinese authorities put the cleanup at about US$5.6 billion, with 50–100 years to recover.", "S3")
j["harm"] = {"documented":["S3"],"types":["environmental contamination"],"extreme":False}

y["bottomLine"] = y["bottomLine"].replace("militia-controlled Kachin State", "armed-group-controlled Kachin State")

n = M["nickel"]
st = find("nickel", "Commonwealth Fusion Systems")
st["security"] = L("CFS buys tape from Faraday Factory Japan and Fujikura. Russian customs records in Sayari show two flows between CFS and Moscow's S-Innovations group. Coated Hastelloy tape went to CFS in January–April 2022 (9 records). Uncoated Hastelloy C-276 tape went from CFS to Moscow from May 2022 to December 2024 (15 records, about 29 tonnes; about US$5 million where values are declared). Early shipments were declared 'for own use for research purposes'; later ones carry no such statement.", "S36", "S37", "SY")
st["sayari"][0]["basis"] = "Russian customs: 15 HS 750620 imports from CFS, 2022-05-04 to 2024-12-17 (11 by S-Innovations, 4 by SuperOx-Innovations; the two December 2024 rows may be one shipment recorded twice); 9 exports of coated tape from S-Innovations to CFS, 2022-01 to 2022-04."
st = find("nickel", "Faraday Factory Japan")
st["security"] = L("A major REBCO tape supplier to fusion developers. Russian export and Japanese import records show it received 369 shipments from Moscow between February 2023 and January 2025. 327 were Hastelloy C-276 tape, ranging from bare polished strip to strip already carrying the oxide buffer, the yttrium-barium-copper oxide superconductor and a silver layer.", "S36", "SY")
st["sayari"][0]["basis"] = "369 shipments received from Russia, Feb 2023 – Jan 2025 (201 Russian export and 168 Japanese import records, so some may be counted twice)."
st = find("nickel", "Buffer-coating step")
st["name"] = "Tape-making step, Moscow (S-Innovations)"
st["security"] = L("A Moscow company in the SuperOx group, which published fusion-tape research with CFS, makes buffered and superconducting-coated Hastelloy tape and ships it to Faraday Factory Japan. It buys the bare alloy tape from CFS and from Chinese mills and traders. Sayari flags it for importing items on the US BIS high-priority list; it is not itself sanctioned.", "S42", "SY")
st["sayari"][0]["watchlist"] = "Not sanctioned. Flags: imports_bis_high_priority_items, meu_list_contractors, sanctioned_adjacent (modelled adjacency)."
st = find("nickel", "Indonesian nickel hubs")
st["people"] = L("Indonesia's human rights commission (Komnas HAM, 2026) found the state failed to protect rights around Morowali, where respiratory infections are rising. A furnace explosion at a Morowali smelter killed 21 workers in December 2023. At Weda Bay, companies working with police and military have taken land from Indigenous communities through coercion and intimidation, and rivers are polluted with hexavalent chromium.", "S12", "S13", "S45")
st["harm"] = {"documented":["S12","S13","S45"],"types":["deaths","occupational disease","land grabs with coercion","environmental contamination"],"extreme":False}

# Findings 1, 2
f["findings"][0]["body"] = "Sayari identifies the tape makers and Chinese separators shipping yttrium oxide to Japanese importers, but no shipment links the two. Japanese import records from 2023 show no yttrium compounds reaching Fujikura or Faraday Factory Japan; Faraday Factory's yttrium arrived already deposited on tape from Moscow, where its source is unrecorded. Sayari holds no Myanmar-to-China rare earth trade. The step where Kachin ore would enter a fusion magnet is invisible to trade data."
f["findings"][1]["body"] = "Russian customs and Japanese import records show S-Innovations, a Moscow tape maker in the SuperOx group that published fusion-tape research with CFS, exporting coated Hastelloy tape to Commonwealth Fusion Systems in early 2022. CFS then exported about 29 tonnes of uncoated Hastelloy tape to S-Innovations between May 2022 and December 2024; early shipments were declared for research use. Moscow sent 369 shipments to Faraday Factory Japan, a supplier to fusion developers, until January 2025. Most were Hastelloy tape carrying yttrium-bearing buffer or superconducting layers. None of the companies is sanctioned."
f["findings"][1]["sources"] = ["SY", "S42", "S36"]

# Remove any remaining S6 citations.
def strip6(o):
    if isinstance(o, dict):
        for k2, v in o.items():
            if k2 == "sources" and isinstance(v, list): o[k2] = [x for x in v if x != "S6"]
            else: strip6(v)
    elif isinstance(o, list):
        for v in o: strip6(v)
strip6(c); strip6(f)

json.dump(c, open("data/chains.json","w"), indent=2, ensure_ascii=False)
json.dump(src, open("data/sources.json","w"), indent=2, ensure_ascii=False)
json.dump(f, open("data/findings.json","w"), indent=2, ensure_ascii=False)
print("ok")
