"""Iteration 2: merge Sayari research into data/chains.json and data/sources.json.
Run from the repo root. Rewrites the non-yttrium materials; yttrium is merged separately."""
import json

G = "https://graph.sayari.com/resource/entity/"

def S(name, country, eid, status, role, basis=None, watch=None):
    d = {"name": name, "country": country, "entity_url": G + eid, "entity_id": eid,
         "link_status": status, "role": role}
    if basis: d["basis"] = basis
    if watch: d["watchlist"] = watch
    return d

NEW_SOURCES = [
 {"id":"SY","title":"Sayari Graph: corporate, ownership and trade records (each finding links to its Sayari entity)","publisher":"Sayari","date":"2026-11","url":"https://graph.sayari.com/"},
 {"id":"S21","title":"Mineral Commodity Summaries 2026: Niobium (Columbium)","publisher":"U.S. Geological Survey","date":"2026","url":"https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-niobium.pdf"},
 {"id":"S22","title":"Mineral Commodity Summaries 2026: Tungsten","publisher":"U.S. Geological Survey","date":"2026","url":"https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-tungsten.pdf"},
 {"id":"S23","title":"Mineral Commodity Summaries 2026: Beryllium","publisher":"U.S. Geological Survey","date":"2026","url":"https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-beryllium.pdf"},
 {"id":"S24","title":"Beryllium: Health Effects","publisher":"U.S. Occupational Safety and Health Administration","date":None,"url":"https://www.osha.gov/beryllium/health-effects"},
 {"id":"S25","title":"Statistical analysis of the Nb3Sn strand production for the ITER toroidal field coils (Vostner et al.)","publisher":"Superconductor Science and Technology, via eScholarship","date":"2017","url":"https://escholarship.org/content/qt4d279223/qt4d279223.pdf"},
 {"id":"S26","title":"China completes niobium-tin strand production","publisher":"ITER Organization","date":"2015","url":"https://www.iter.org/node/20687/china-completes-niobium-tin-strand-production"},
 {"id":"S27","title":"A.L.M.T. Corp. wins a contract to supply a component of the ITER","publisher":"Sumitomo Electric Industries","date":"2021","url":"https://sumitomoelectric.com/publications/pr-news-articles/2021/09/almt-corp-wins-contract-supply-component-iter"},
 {"id":"S28","title":"Nuclear Fusion Divertor","publisher":"ATTL Advanced Materials (AT&M tungsten unit)","date":None,"url":"https://www.atm-tungsten.com/product_detils/214.html"},
 {"id":"S29","title":"Scarce raw materials: Plansee Group secures tungsten supply","publisher":"CERATIZIT (Plansee Group)","date":"2026","url":"https://ceratizit.com/int/en/news-and-media/news-and-press-releases/2026/scarce-raw-materials.html"},
 {"id":"S30","title":"Enriched lithium and advanced nuclear","publisher":"Nuclear Engineering International","date":None,"url":"https://www.neimagazine.com/analysis/enriched-lithium-and-advanced-nuclear"},
 {"id":"S31","title":"Molten Salt Solutions signs enriched lithium supply agreements with Type One Energy and Gauss Fusion","publisher":"Fusion Energy Base","date":"2026","url":"https://www.fusionenergybase.com/articles/molten-salt-solutions-signs-enriched-lithium-supply-agreements-with-type-one-energy-and-gauss-fusion"},
 {"id":"S32","title":"Fuels for Fusion: resource availability and supply","publisher":"Kyoto Fusioneering, via DOE Office of Science","date":"2022","url":"https://science.osti.gov/-/media/fes/pdf/fes-presentations/2022/Pearson_resource-availability-and-supply_presentation.pdf"},
 {"id":"S33","title":"European steel for Test Blanket Modules arrives in Korea","publisher":"Fusion for Energy (F4E)","date":None,"url":"https://fusionforenergy.europa.eu/news/test-blanket-modules-steel"},
 {"id":"S34","title":"Substrate tape","publisher":"VDM Metals","date":None,"url":"https://www.vdm-metals.com/en/substrate-tape"},
 {"id":"S35","title":"HTS Tape: C276 (UNS N10276)","publisher":"Elgiloy Specialty Metals","date":None,"url":"https://www.elgiloy.com/strip-division/markets-served/power-generation/hts-tape"},
 {"id":"S36","title":"Faraday Factory announces it has delivered over 5,000 km of high-temperature superconductor tape to fusion industry","publisher":"PR Newswire (Faraday Factory Japan)","date":None,"url":"https://www.prnewswire.com/news-releases/faraday-factory-announces-it-has-delivered-over-5-000-km-of-high-temperature-superconductor-tape-to-fusion-industry-302250067.html"},
 {"id":"S37","title":"Commonwealth Fusion Systems places largest single purchase order of HTS tape with Fujikura","publisher":"PR Newswire (Commonwealth Fusion Systems)","date":"2026","url":"https://www.prnewswire.com/news-releases/commonwealth-fusion-systems-places-largest-single-purchase-order-of-hts-tape-with-fujikura-to-accelerate-development-of-arc-power-plants-302893652.html"},
]

NR = [{"level": "not-researched"}]
def stage(tier, name, sec=None, ppl=None, ev=NR, supply="unknown", harm="unknown", **kw):
    d = {"tier": tier, "name": name, "security": sec, "people": ppl, "evidence": ev,
         "rating": {"supply": supply, "harm": harm}}
    d.update(kw)
    return d
def L(text, *src, needed=False):
    d = {"text": text, "sources": list(src)}
    if needed: d["sourceNeeded"] = True
    return d

# ---------- shared LTS stages ----------
ITER = stage("Reactor / developer", "ITER (and ITER-style tokamaks)",
    sec=L("ITER's toroidal-field coils used about 500 t of Nb₃Sn strand, made in 2008–2015 by eight suppliers across six ITER members.", "S25"),
    ev=[{"level":"documented","scope":"supplier base"}], supply="moderate")
STRAND = stage("Component maker", "Nb₃Sn strand makers",
    sec=L("ITER's strand came from Bruker EAS (Germany), Bruker OST (US), JASTEC and SH Copper (Japan), Kiswire Advanced Technology (South Korea), Luvata, Western Superconducting Technologies (China) and Chepetsky Mechanical Plant (Russia). Sayari lists Chepetsky on Ukraine's NSDC sanctions list and records Western Superconducting as owned by a Chinese state-owned enterprise.", "S25", "S26", "SY"),
    ppl=L("Sayari holds no niobium or tin shipments into any of these strand makers, so where their metal comes from cannot be traced from trade data.", "SY"),
    ev=[{"level":"documented","scope":"who makes the strand"},{"level":"not-researched","scope":"where their tin and niobium come from"}],
    supply="high",
    sayari=[
      S("AO Chepetsky Mechanical Plant","RUS","ScWgX1NKgn8TjlBOHc7JmA","confirmed","ITER strand supplier (bronze route); Rosatom fuel-company subsidiary","Registry: INN 1829008035","On Ukraine's NSDC sanctions list (sanctioned_ukr_nsdc); state-owned. Not shown as sanctioned by the US, EU or UK in this profile."),
      S("Western Superconducting Technologies","CHN","sHd3C6y1EF_j7cxUmp8p4w","confirmed","China's sole ITER strand supplier","Registry: USCC 916101327428232411. Inbound niobium or tin trade: none recorded.","Owned by a Chinese state-owned enterprise (owned_by_chinese_soe, registry shareholding)."),
      S("Bruker EAS GmbH","DEU","nASIX5gLc13_sp2y-Lp1jQ","confirmed","ITER strand supplier (bronze route)","Registry: HRB92543. Upstream supply chain: 0 suppliers recorded."),
      S("Bruker OST LLC","USA","Rbihne7MHML4jCpyjZ_few","confirmed","ITER strand supplier (internal tin), formerly Oxford Superconducting Technology","22 inbound shipment rows: copper wire and returned spools; no niobium or tin."),
      S("Japan Superconductor Technology (JASTEC)","JPN","z9WnGNHH9qPQwUjXpkZs0g","confirmed","Largest single ITER Nb₃Sn supplier","Registry: JP corporate no. 5140001022058. No supplier links recorded."),
      S("Kiswire Advanced Technology","KOR","P3SiemjrjG-A5XFNQPEg3w","confirmed","ITER strand supplier (internal tin)","No supplier links recorded."),
    ])

tin = {
 "name":"Tin","part":"lts-magnets","role":"Half of the Nb₃Sn superconductor",
 "stages":[ITER, STRAND],
 "routes":[
  {"name":"Man Maw, Wa State → Yunnan smelters","stages":[
    stage("Separation / refining","Smelters in Yunnan, China", blending=True,
      sec=L("Wa State has no smelters; ore goes to smelters in Yunnan, China. The largest, Yunnan Tin, is state-owned according to Sayari's registry data.", "S9", "SY"),
      ppl=L("Origin is lost at smelting. Sayari holds no Myanmar-to-China tin ore records, so this flow cannot be shown from trade data.", "S9", "SY"),
      ev=[{"level":"documented","scope":"market structure"}], supply="high",
      sayari=[S("Yunnan Tin Co., Ltd.","CHN","FYt9adhrTCpuo1t8v1oLZQ","confirmed","World's largest tin smelter","Registry: USCC 915300007134002589. No Myanmar ore receipts recorded.","Owned by a Chinese state-owned enterprise; regulatory_action flag.")]),
    stage("Mine / source region","Man Maw, Wa State, Myanmar",
      sec=L("Myanmar was the world's 3rd-largest tin producer, nearly all of it from Man Maw. The mine restarted in 2025–26 after a suspension.", "S8", "S9"),
      ppl=L("Controlled by the United Wa State Army, a non-state armed group under US sanctions since 2003 (narcotics trafficking). Access is tightly restricted.", "S8", "S9"),
      ev=[{"level":"documented","scope":"harm: armed-group control"},{"level":"likely","scope":"link to fusion, market level"}],
      supply="high", harm="high",
      sayari=[S("United Wa State Army","MMR","VBDYgwRIxR8tpDS_0jg4Hw","confirmed","Armed group controlling the Man Maw area","Its Sayari network holds sanctioned individuals and Hong Pang companies; no tin traders or smelters.","On the US OFAC sanctions list (SDN 7825).")]),
  ]},
  {"name":"Great Lakes traders → Malaysia Smelting Corp","stages":[
    stage("Separation / refining","Malaysia Smelting Corporation (Penang)", blending=True,
      sec=L("A second tin smelting hub. It receives tin concentrate shipped from Tanzania by international metals traders, and one recorded lot from Myeik, southern Myanmar (November 2025). Sayari links it at one hop to Star Dragon Corporation, a Hong Kong trader on the US OFAC sanctions list; the goods behind that link were not retrieved.", "SY"),
      ppl=L("Origin is lost at smelting. The Tanzania-shipped concentrate's mine of origin is not stated in the records.", "SY"),
      ev=[{"level":"documented","scope":"shipments into the smelter"},{"level":"hypothesis","scope":"link to fusion"}],
      supply="moderate", harm="moderate",
      sayari=[
        S("Malaysia Smelting Corporation Bhd","MYS","pwMtR-67xAIYzs7_EWhcVQ","confirmed","Tin smelter, Butterworth, Penang","39 rows of HS 2609 tin concentrate from Tanzania (2025–26); 1 shipment from Myeik, Myanmar (2025-11-27).","Not sanctioned. Sayari flags imports_conflict_minerals and a one-hop trade link to an OFAC-listed entity."),
        S("Star Dragon Corporation Limited","HKG","EOhsW8l7khZBEzP0r4qzVQ","confirmed","Hong Kong trader recorded as a supplier to the smelter","Trade link only; goods and dates not retrieved.","On the US OFAC sanctions list (SDN 55049)."),
      ]),
    stage("Export hub","Metals traders buying Great Lakes ore",
      ppl=L("Four traders shipping tin concentrate to the smelter (Traxys Europe, GM Trading, Halcyon and Sizer Metals) also buy coltan from Rwandan exporters that Global Witness says bought conflict coltan from Rubaya. The records do not show that conflict-linked ore reached the smelter.", "S15", "SY"),
      ev=[{"level":"documented","scope":"same traders on both routes"},{"level":"hypothesis","scope":"conflict ore in this tin"}],
      harm="moderate",
      sayari=[
        S("Traxys Europe S.A.","LUX","49gLiIsaRq1p3s8vhLc4cw","confirmed","Trader","17 HS 2615 coltan shipments from Rwanda; HS 2609 tin concentrate to Malaysia Smelting Corp (2025-11).","Flag: exports_conflict_minerals."),
        S("GM Trading Co., Ltd.","JPN","MTmsF9fB3qY9k4ghxYeg-w","confirmed","Trader","7 coltan shipments from Rwanda (to 2026-01); 3 tin concentrate shipments to the smelter (2025-11)."),
        S("Halcyon Inc","ARE","8eW5KQNdwT7LoG9R3s75kA","confirmed","Trader","Buys from African Panther and Boss Mining (Rwanda); tin concentrate to the smelter (2025-11, 2026-02).","Flag: exports_conflict_minerals."),
        S("Sizer Metals Pte Ltd","SGP","LctCfYswD8vhzrt_I271zg","confirmed","Trader","Buys from African Panther (Rwanda); tin concentrate to the smelter (2025-11)."),
      ]),
  ]},
 ],
 "context":[{"label":"Sector-wide","text":"Tin is rated the highest-risk of the conflict minerals for labour abuses. Child labour is rated \"extreme risk\" in Myanmar, Indonesia and Bolivia.","sources":["S14"],"evidence":[{"level":"documented","scope":"sector"}]}],
 "bottomLine":"Fusion's Nb₃Sn strand makers are known, but Sayari shows no tin going into any of them. Upstream, Myanmar tin from a mine run by a US-sanctioned armed group disappears into Chinese smelters, and a second smelter in Malaysia buys from traders who also handle Rwanda's conflict-linked coltan. The harm is documented; the route into fusion is not traced."
}

niobium = {
 "name":"Niobium","part":"lts-magnets","role":"Half of the Nb₃Sn superconductor",
 "stages":[ITER, STRAND],
 "routes":[
  {"name":"Main source: Brazil","stages":[
    stage("Mine / source region","Brazil (CBMM and others)",
      sec=L("Brazil mined about 93% of the world's niobium in 2025 (104,000 of 112,000 t, USGS estimate).", "S21"),
      ppl=L("Lower human rights risk at the main source.", needed=True),
      ev=[{"level":"documented","scope":"production share"},{"level":"not-researched","scope":"which niobium reaches strand makers"}],
      supply="high",
      sayari=[S("Companhia Brasileira de Metalurgia e Mineração (CBMM)","BRA","nVXFM_JqTsjFcOcxBTrmNA","confirmed","Dominant niobium producer","No link to any strand maker recorded.")]),
  ]},
  {"name":"Secondary: eastern DRC via Rwanda","stages":[
    stage("Separation / refining","Tantalum–niobium smelters", blending=True,
      ppl=L("Global Witness lists smelters processing Rwandan coltan, including Ningxia Orient Tantalum (China), Ulba (Kazakhstan) and Taniobis (Thailand).", "S15"),
      ev=[{"level":"documented","scope":"smelter list"},{"level":"hypothesis","scope":"supply to strand makers"}],
      harm="moderate",
      sayari=[S("Ningxia Orient Tantalum Industry (OTIC)","CHN","ZpTn4A-iShM17oe5UZ0pbA","confirmed","Ta/Nb smelter named by Global Witness","Registry: USCC 916400007106545275. No supply link to any strand maker; its only path to Western Superconducting runs through a nominee shareholder.","Owned by a Chinese state-owned enterprise.")]),
    stage("Export hub","Rwanda coltan exports", blending=True,
      sec=L("Rwanda produced about 200 t and DRC about 970 t of niobium in 2025, small next to Brazil.", "S21"),
      ppl=L("Smuggled ore is laundered into \"Rwandan\" exports. Sayari confirms coltan shipments by three exporters Global Witness names as buying conflict coltan from Rubaya, sold to traders in the UAE, Luxembourg, Japan and Singapore.", "S15", "S16", "SY"),
      ev=[{"level":"documented","scope":"exporters and buyers"},{"level":"hypothesis","scope":"link to fusion"}],
      harm="high",
      sayari=[
        S("African Panther Resources Ltd","RWA","X9BAf2KZzwU7tDfYuH4qoA","confirmed","Exporter named by Global Witness","HS 2615 shipments to Traxys Europe, Sizer Metals, Halcyon, Tata International and others.","Flag: exports_conflict_minerals."),
        S("Boss Mining Solution Ltd","RWA","WKC3rFluM3Fgj6NXzGwxTA","confirmed","Exporter named by Global Witness","8 HS 2615 shipments; buyers Novacore FZE and Halcyon."),
        S("Rani Mining Ltd","RWA","KMJ_GrAwF6ZiFOQSsMEbMQ","confirmed","Exporter named by Global Witness","10 HS 2615 shipments from Rwanda."),
        S("Minterra FZC","ARE","8LLbna7zYvBdV-y8BjQumQ","confirmed","Largest buyer of Rwandan coltan in Sayari","29 HS 2615 shipments from Rwanda, latest 2026-07."),
      ]),
    stage("Mine / source region","Rubaya, eastern DRC",
      ppl=L("Coltan (which yields tantalum and niobium) from M23-occupied Rubaya is smuggled to Rwanda and mixed with Rwandan production (UN Group of Experts, 2025). Due-diligence audit schemes failed to catch it.", "S15", "S16"),
      ev=[{"level":"documented","scope":"harm at source"},{"level":"hypothesis","scope":"link to fusion"}], harm="high"),
  ]},
 ],
 "bottomLine":"About 93% of niobium comes from Brazil. A small stream from M23-occupied Rubaya is laundered through Rwanda; Sayari confirms the exporters and the traders who buy from them, but shows no niobium entering any strand maker. A fusion link remains a hypothesis."
}

tungsten = {
 "name":"Tungsten","part":"divertor","role":"Plasma-facing armour for the divertor and first wall",
 "stages":[
  stage("Component maker","Fusion-grade tungsten makers",
    sec=L("Very few firms make fusion-grade tungsten. A.L.M.T. (Sumitomo, Japan) holds an ITER divertor monoblock contract; state-owned AT&M (China) made divertor parts for France's WEST and China's EAST. Plansee (Austria) is also cited as a supplier, but no primary source was found.", "S27", "S28", "SY"),
    ev=[{"level":"documented","scope":"A.L.M.T. and AT&M"},{"level":"not-researched","scope":"their ore sources"}],
    supply="high",
    sayari=[
      S("A.L.M.T. Corp.","JPN","zU77O-fwc2mLS7abnqZAWQ","confirmed","ITER divertor monoblock supplier","Upstream supply chain: 0 suppliers recorded.","Watchlist (1 hop): no hits."),
      S("Advanced Technology & Materials Co. (AT&M)","CHN","RJjq6Ru7Me8L0pe7UHByBg","confirmed","Divertor parts for WEST and EAST","Registry: USCC 911100006337153487.","State-owned (chinese_core_soe). Watchlist (1 hop): no hits."),
    ]),
  stage("Separation / refining","Global Tungsten & Powders (Plansee Group, US)", blending=True,
    sec=L("Plansee says it sources tungsten from scrap recycling and long-term mine off-take deals, including the Sangdong mine in South Korea.", "S29"),
    ppl=L("Shipment records show this powder plant buying tungsten concentrate from Colombian exporters (2012–13) and from the trader Traxys (2026). Traxys also buys Rwandan tungsten ore. Nothing shows that Rwandan lots reached this plant, or that its tungsten went into a fusion part.", "SY"),
    ev=[{"level":"documented","scope":"ore purchases"},{"level":"hypothesis","scope":"link to fusion"}],
    harm="moderate",
    sayari=[
      S("Global Tungsten & Powders Corp","USA","j9FJxh3diwrl4U_GxmQ8lA","confirmed","Tungsten powder and APT producer, Towanda PA","HS 2611 concentrate from Traxys Europe (2026-10), Bolivia via Panama (2026-10), Geo Copper and Minerak (Colombia, 2012–13).","Watchlist (1 hop): no hits."),
      S("Traxys Europe S.A.","LUX","49gLiIsaRq1p3s8vhLc4cw","confirmed","Trader supplying the plant","Buys HS 2611 ore from Trinity Nyakabingo Mine, Rwanda (4 rows, 2026-07).","Flag: exports_conflict_minerals."),
    ]),
  stage("Mine / source region","Tungsten mining",
    sec=L("China mined about 79% of the world's tungsten in 2025 (67,000 of 85,000 t, USGS estimate) and tightened export controls in February 2025.", "S22"),
    ppl=L("Tungsten is one of the 3TG \"conflict minerals\". Armed groups control some tungsten mining in Colombia. Sayari records Rwandan and Colombian ore exports to traders and powder makers, but not conditions at those mines.", "S14", "SY"),
    ev=[{"level":"documented","scope":"sector"},{"level":"not-researched","scope":"link to fusion"}],
    supply="high", harm="high",
    sayari=[
      S("Trinity Nyakabingo Mine Ltd","RWA","i8S1NHEFxPnL94FD6JUM-Q","confirmed","Rwandan tungsten miner and exporter","4 HS 2611 shipments to Traxys Europe (2026-07)."),
      S("Geo Copper S.A.S.","COL","LqcH3h3wxIWrQcFmQLUi6g","confirmed","Colombian tungsten ore exporter","8 HS 2611 shipments to Global Tungsten & Powders (2012–13). No Sayari evidence of armed-group links."),
    ]),
 ],
 "bottomLine":"Only a handful of firms make fusion-grade tungsten, and China mines about four-fifths of the world's supply. Sayari shows a Western powder maker buying ore through a trader that also handles Rwandan tungsten, but nothing ties conflict-linked ore to a fusion part."
}

beryllium = {
 "name":"Beryllium","part":"blanket","role":"Neutron multiplier",
 "stages":[
  stage("Reactor / developer","Commonwealth Fusion Systems",
    sec=L("Has a supply agreement with Materion for beryllium fluoride. Sayari does not show it, which is expected for a domestic US sale.", "S20", "SY"),
    ev=[{"level":"documented","scope":"supply agreement"}], supply="moderate",
    sayari=[S("Commonwealth Fusion Systems LLC","USA","pvo3Wv7gZb9K0hiji7-Nag","confirmed","Fusion developer","SEC CIK 0001744079. No beryllium suppliers among its recorded imports.")]),
  stage("Metal / oxide / alloy","Materion (US) · Ulba Metallurgical Plant (Kazakhstan)", blending=True,
    sec=L("Supply is concentrated among a few producers. Ulba is owned by the Kazakh state through Kazatomprom and Samruk-Kazyna (Sayari registry data); Sayari flags it for regulatory action and for imports from a US-sanctioned trader. Kazakhstan supplied 31% of US beryllium imports in 2021–24.", "S19", "S23", "SY"),
    ppl=L("The main people risk is worker health. Chronic beryllium disease is a lung disease caused by breathing beryllium dust or fumes, and OSHA calls it the primary health risk for beryllium workers.", "S24"),
    ev=[{"level":"documented","scope":"ownership and occupational harm"}],
    supply="high", harm="moderate",
    sayari=[
      S("Materion Corp","USA","EwrvHuTaV4IXqRX9roWh9Q","confirmed","Leading US beryllium producer; CFS supplier","SEC CIK 0001104657. No ore suppliers recorded (consistent with its own US mine).","Watchlist (1 hop): no hits."),
      S("Ulba Metallurgical Plant JSC","KAZ","yd4WCfTHQsYYVO6SEoutWA","confirmed","Beryllium, tantalum and niobium processor, Oskemen","Owned via Kazatomprom → Samruk-Kazyna → Republic of Kazakhstan.","State-owned; regulatory_action; one-hop trade link to Star Dragon Corporation (OFAC SDN 55049), goods not retrieved."),
    ]),
  stage("Mine / source region","Beryllium ore: US (Utah), Brazil, China, Nigeria",
    sec=L("The US mined 230 of the world's roughly 430 t of beryllium in 2025; about 60% of identified resources are at Spor Mountain, Utah.", "S23"),
    ev=[{"level":"documented","scope":"production"},{"level":"not-researched","scope":"conditions at mines"}], supply="high"),
 ],
 "bottomLine":"Beryllium supply is concentrated in the US and in a Kazakh state-owned processor that Sayari flags for regulatory action. The main people risk is to workers' lungs, not conflict."
}

lithium6 = {
 "name":"Lithium-6","part":"blanket","role":"Enriched lithium for breeding tritium fuel",
 "stages":[
  stage("Metal / oxide / alloy","Lithium-6 enrichment today",
    sec=L("There is effectively no commercial supply. Only Russia and China are known to produce enriched lithium, and it is export-controlled because of its weapons use. In March 2026 US start-up Molten Salt Solutions signed supply agreements with Type One Energy and Gauss Fusion.", "S30", "S32", "S31"),
    ppl=L("The legacy enrichment process uses mercury. That is the process behind the Oak Ridge contamination below.", "S30"),
    ev=[{"level":"documented","scope":"supply situation"},{"level":"not-researched","scope":"conditions in Russia and China"}],
    supply="high"),
  stage("Lessons from history","Oak Ridge, Tennessee, 1950s–60s", history=True,
    ppl=L("US lithium enrichment at Oak Ridge used mercury. About 1.1 million kg was lost on site, around 10% of it into East Fork Poplar Creek. About 15 miles of the creek still exceed mercury water-quality criteria.", "S17", "S18"),
    ev=[{"level":"documented","scope":"historical"}], harm="high"),
  stage("Mine / source region","Lithium source"),
 ],
 "bottomLine":"Fusion's fuel chain has caused harm before: lithium-6 enrichment at Oak Ridge left mercury in a creek that still exceeds water-quality criteria. Today there is no commercial supply outside Russia and China, and new enrichers are only now signing deals with fusion developers."
}

steel = {
 "name":"Specialty steels","part":"vacuum-vessel","role":"Low-activation structural steels","contrast":True,
 "stages":[
  stage("Metal / oxide / alloy","EUROFER97 low-activation steel: Saarschmiede (Germany), Böhler (Austria)",
    sec=L("The EU's reference fusion steel is made by very few qualified producers; F4E's 2015 order was forged by Saarschmiede with Böhler as subcontractor.", "S33"),
    ppl=L("No human rights hotspot identified at this stage. Alloying inputs, including about 1% tungsten, were not traced.", "S33"),
    ev=[{"level":"documented","scope":"named producers"},{"level":"not-researched","scope":"alloying inputs"}],
    supply="moderate", harm="low",
    sayari=[S("Saarschmiede GmbH Freiformschmiede","DEU","XXI51kLWM2wpkhZbxDQ9WA","confirmed","EUROFER97 forger","Registry: HRB 75004.")]),
 ],
 "bottomLine":"Shown for contrast: a real bottleneck for building reactors, but not a human rights hotspot on current research. Its tungsten content links it back to the tungsten chain."
}

nickel = {
 "name":"Nickel","part":"hts-magnets","role":"The alloy backing (Hastelloy C-276) that REBCO tape is built on",
 "whyItMatters": L("REBCO tape is built on thin strip of Hastelloy C-276, a nickel-chromium-molybdenum alloy. Specialty mills market this strip directly to tape makers.", "S34", "S35"),
 "stages":[
  stage("Reactor / developer","Commonwealth Fusion Systems",
    sec=L("CFS buys tape from Faraday Factory Japan and Fujikura. Russian import records in Sayari also list CFS as the shipper of Hastelloy C-276 alloy tape to two related Moscow companies: 15 shipments retrieved, about 27 t, May 2022 to December 2024. The records do not state the purpose.", "S36", "S37", "SY"),
    ev=[{"level":"documented","scope":"shipment records"},{"level":"not-researched","scope":"purpose of the shipments"}],
    supply="moderate",
    sayari=[S("Commonwealth Fusion Systems LLC","USA","pvo3Wv7gZb9K0hiji7-Nag","confirmed","Recorded shipper of Hastelloy C276 tape to Moscow","15 HS 750620 shipments retrieved to S-Innovations (11) and SuperOx-Innovations (4), 2022-05-04 to 2024-12-17; 9 further search hits not reviewed.","Not sanctioned; no watchlist hits.")]),
  stage("Component maker","Faraday Factory Japan (formerly SuperOx Japan)",
    sec=L("A major REBCO tape supplier to fusion developers. Japanese import records show it received 369 shipments from Moscow in 2023–25, 327 of them Hastelloy C-276 tape already carrying oxide buffer, silver and copper layers.", "S36", "SY"),
    ev=[{"level":"documented","scope":"import records"}], supply="high",
    sayari=[S("Faraday Factory Japan LLC","JPN","C13ZLDlfTD93f5CM_BpokA","confirmed","REBCO tape maker","369 shipments received, all from Russia (2023-02 to 2025-01).","Not sanctioned; no watchlist hits.")]),
  stage("Component maker","Buffer-coating step, Moscow (S-Innovations)",
    sec=L("A Moscow company coats Hastelloy tape for Faraday Factory Japan. It buys the bare alloy tape from CFS and from at least six Chinese mills and traders. Sayari flags it for importing items on the US BIS high-priority list; it is not itself sanctioned.", "SY"),
    ev=[{"level":"documented","scope":"import and export records"}], supply="high",
    sayari=[
      S("OOO S-Innovatsii (S-Innovations LLC)","RUS","ZhPhawms5E3chJhzhiai8Q","confirmed","Coats Hastelloy tape; ships it to Faraday Factory Japan","INN 5032242530; same tax ID as SuperOx-Innovations.","Not sanctioned. Flags: imports_bis_high_priority_items, sanctioned_adjacent."),
      S("OOO SuperOx-Innovatsii","RUS","VZTsfyDWLJw_Dtmz7WSnuA","confirmed","Same operation, recorded under a second name","77 received shipments, including 4 from CFS (2023).","Flag: imports_bis_high_priority_items."),
    ]),
  stage("Metal / oxide / alloy","Hastelloy C-276 strip mills", blending=True,
    sec=L("VDM Metals (Germany) and Elgiloy (US) market C-276 strip as tape substrate. Russian import records show Chinese mills also supplying it.", "S34", "S35", "SY"),
    ppl=L("Nickel from many mines is melted together here. Sayari shows no Indonesian supplier upstream of Haynes International or VDM, and the Chinese mills have no upstream data at all.", "SY"),
    ev=[{"level":"documented","scope":"named strip makers"},{"level":"not-researched","scope":"where their nickel comes from"}],
    supply="moderate",
    sayari=[
      S("Haynes International Inc","USA","uo0xLgiopyhcNTj8j5WklQ","confirmed","Originator of Hastelloy","39 recorded trade partners; none Indonesian."),
      S("VDM Metals International GmbH","DEU","TyY6bVroBOpViFpKhx_KNA","confirmed","Markets C-276 substrate tape","Nickel-filtered upstream supply chain: 0 results."),
      S("Jiangsu Rylision Steel Co Ltd","CHN","u_sGuw4pl_wmZciqLrtsvg","confirmed","Supplied C276 tape to S-Innovations","1 shipment (2022-09), described as substrate for thin-film deposition. Upstream: 0 results."),
    ]),
  stage("Mine / source region","Indonesian nickel hubs (Morowali, Weda Bay)",
    ppl=L("Indonesia's human rights commission (Komnas HAM, 2026) found the state failed to protect rights around Morowali, with rising respiratory illness. Fatal smelter accidents. Land grabs affecting Indigenous communities at Weda Bay.", "S12", "S13"),
    ev=[{"level":"documented","scope":"harm at source"},{"level":"hypothesis","scope":"link to fusion: no Sayari path found"}],
    harm="high",
    sayari=[S("Indonesia Morowali Industrial Park","IDN","klq-RgJyVo5_-R6-yINxZA","inferred","Morowali park operator","Resolved only; no link to the substrate chain found.")]),
 ],
 "bottomLine":"Sayari did not confirm the Indonesia hypothesis: no path links tape substrate to Morowali or Weda Bay. It found a different route instead. Hastelloy tape from the US and China is coated in Moscow and shipped to a Japanese maker that supplies fusion developers."
}

chains = json.load(open("data/chains.json"))
for k, v in {"tin":tin, "niobium":niobium, "tungsten":tungsten, "beryllium":beryllium, "lithium6":lithium6, "steel":steel, "nickel":nickel}.items():
    chains["materials"][k] = v
json.dump(chains, open("data/chains.json","w"), indent=2, ensure_ascii=False)

src = json.load(open("data/sources.json"))
have = {s["id"] for s in src["sources"]}
src["sources"] += [s for s in NEW_SOURCES if s["id"] not in have]
json.dump(src, open("data/sources.json","w"), indent=2, ensure_ascii=False)
print("merged")
