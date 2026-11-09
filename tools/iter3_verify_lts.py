"""Iteration 3: apply verified corrections to tin, niobium, tungsten, steel, parts and findings 3-4."""
import json
c = json.load(open("data/chains.json")); M = c["materials"]
src = json.load(open("data/sources.json")); f = json.load(open("data/findings.json")); p = json.load(open("data/parts.json"))
def L(text, *s): return {"text": text, "sources": list(s)}
def find(mat, name):
    m = M[mat]
    for st in m.get("stages", []) + [x for r in m.get("routes", []) for x in r["stages"]]:
        if st["name"].startswith(name): return st
    raise KeyError(name)
G = "https://graph.sayari.com/resource/entity/"

NEW = [
 {"id":"S46","title":"Myanmar tin mega-mine restarts operations","publisher":"AFP via Bangkok Post","date":"2026","url":"https://www.bangkokpost.com/world/3317203/myanmar-tin-megamine-restarts-operations"},
 {"id":"S47","title":"Myanmar fact sheet: parties listed for recruitment and use of children","publisher":"UN Office of the SRSG for Children and Armed Conflict","date":"2016","url":"https://childrenandarmedconflict.un.org/wp-content/uploads/2016/02/Myanmar-Fact-Sheet-September-2016.pdf"},
 {"id":"S48","title":"Myanmar explosion prompts mine safety review","publisher":"International Tin Association","date":"2022","url":"https://www.internationaltin.org/myanmar-explosion-prompts-mine-safety-review/"},
 {"id":"S49","title":"Treasury sanctions entities linked to violence and illegal mining in the Democratic Republic of the Congo","publisher":"U.S. Department of the Treasury (OFAC)","date":"2025","url":"https://home.treasury.gov/news/press-releases/sb0221"},
 {"id":"S50","title":"DRC: M23 fighters abused miners and trafficked gold and coltan to Rwanda","publisher":"Amnesty International","date":"2026","url":"https://www.amnesty.org/en/latest/news/2026/09/drc-m23-fighters-abused-miners-and-trafficked-gold-and-coltan-to-rwanda"},
 {"id":"S51","title":"Congo mine disaster: tunnels collapse in rebel-held Rubaya","publisher":"Associated Press","date":"2026","url":"https://apnews.com/article/congo-rubaya-mine-collapse-coltan-deaths-m23-b9fec43392b2b5b7de2857b4d33b8c8e"},
 {"id":"S52","title":"The first Inner Vertical Target is ready for ITER","publisher":"Fusion for Energy (F4E)","date":"2026","url":"https://fusionforenergy.europa.eu/news/the-first-inner-vertical-target-is-ready-for-iter"},
 {"id":"S53","title":"Promising results for first-ever critical heat flux testing of full tungsten divertor components","publisher":"Fusion for Energy (F4E)","date":"2010","url":"https://fusionforenergy.europa.eu/news/promising-results-for-first-ever-critical-heat-flux-testing-of-full-tungsten-divertor-components"},
 {"id":"S54","title":"Colombia's black-market coltan tied to drug traffickers, paramilitaries","publisher":"International Consortium of Investigative Journalists (ICIJ)","date":"2012","url":"https://www.icij.org/investigations/coltan/colombias-black-market-coltan-tied-drug-traffickers-paramilitaries"},
 {"id":"S55","title":"Development of EUROFER97 database and material property handbook","publisher":"UKAEA","date":None,"url":"https://scientific-publications.ukaea.uk/wp-content/uploads/UKAEA-CCFE-PR1863.PDF"},
 {"id":"S56","title":"CBMM, St. George clash over mining rights and dam safety in Brazil","publisher":"Valor International","date":"2026","url":"https://valorinternational.globo.com/business/news/2026/08/11/cbmm-st-george-clash-over-mining-rights-and-dam-safety-in-brazil.ghtml"},
 {"id":"S57","title":"Joint-Stock Company \"Chepetsky Mechanical Plant\" (Ukraine NSDC sanctions listing)","publisher":"OpenSanctions","date":None,"url":"https://www.opensanctions.org/entities/NK-5SY2TV7a4zDFgPsiBdesfs"},
]
have = {s["id"] for s in src["sources"]}
src["sources"] += [s for s in NEW if s["id"] not in have]
for s in src["sources"]:
    if s["id"] == "S14": s["date"] = "2017"
    if s["id"] == "S33": s["date"] = "2024"
    if s["id"] == "S9": s["date"] = "2025"

ITER_TXT = L("ITER's toroidal-field coils used more than 500 t of Nb₃Sn strand, made in 2008–2015 by eight suppliers working for six ITER members.", "S25")
for mat in ("tin", "niobium"):
    M[mat]["stages"][0]["security"] = ITER_TXT
    s = M[mat]["stages"][1]
    s["security"]["text"] = s["security"]["text"].replace("Sayari lists Chepetsky on Ukraine's NSDC sanctions list", "Chepetsky has been on Ukraine's NSDC sanctions list since October 2022 (not the US, EU or UK lists)")
    if "S57" not in s["security"]["sources"]: s["security"]["sources"].append("S57")

# ---- Tin
st = find("tin", "Man Maw")
st["security"] = L("At its peak Myanmar was the world's 3rd-largest tin producer, nearly all of it from Man Maw. The mine was suspended in 2023 and began a slow restart in 2025–26, with output still well below earlier levels.", "S8", "S9", "S46")
st["people"] = L("Controlled by the United Wa State Army, an armed group under US sanctions since 2003 for narcotics trafficking and listed by the UN Secretary-General for recruiting and using children. A 2022 explosion at the mine killed nine workers.", "S8", "S47", "S48")
st["harm"] = {"documented":["S8","S47","S48"],"types":["armed-group control","child recruitment by the controlling armed group","deaths (2022 explosion)"],"extreme":False,
              "note":"The UN child-recruitment listing concerns the armed group, not the mine itself, so it is not used as the extreme-harm trigger; the stage is severe on source count."}
st = find("tin", "Smelters in Yunnan")
st["harm"] = None
st = find("tin", "Malaysia Smelting")
st["security"] = L("A second tin smelting hub. It buys tin concentrate shipped from Tanzania, Rwanda, the DRC and Burundi by international traders, plus one lot from Myeik, southern Myanmar (November 2025). Its suppliers include Star Dragon Corporation, a Hong Kong trader the US sanctioned in August 2025 for buying minerals from a Rubaya mining company linked to an armed group. Star Dragon shipped 10 lots of tin ore to the smelter between September 2024 and August 2025, mostly from the DRC.", "S49", "SY")
st["people"] = L("Origin is lost at smelting. Shipping records name countries, not mines. Some lots are declared as Congolese-origin tin, and others leave from Rwanda, where the UN says smuggled Congolese minerals are mixed into exports.", "S16", "SY")
st["harm"] = {"documented":["S49"],"types":["conflict financing via a sanctioned supplier"],"extreme":False}
for e in st["sayari"]:
    if e["name"].startswith("Malaysia"):
        e["basis"] = "38 rows of HS 2609 tin concentrate from Tanzania (2025–26), 28 from Rwanda, 12 from the DRC, 1 from Myeik, Myanmar (2025-11-27)."
        e["watchlist"] = "Not sanctioned. Directly supplied by an OFAC-listed trader (Star Dragon)."
    if e["name"].startswith("Star Dragon"):
        e["role"] = "Hong Kong trader; direct supplier of tin ore to the smelter"
        e["basis"] = "10 HS 2609 tin ore and concentrate shipments to Malaysia Smelting Corp, Sep 2024 – 14 Aug 2025, mostly departing the DRC."
        e["watchlist"] = "On the US OFAC sanctions list (SDN 55049) since 12 Aug 2025, for supporting a company selling Rubaya minerals from armed-group-controlled areas."
st = find("tin", "Metals traders")
st["harm"] = {"documented":["S15"],"types":["conflict financing (trade link)"],"extreme":False}
M["tin"]["context"][0]["text"] = "Verisk Maplecroft (2017) rated tin the highest-risk of the 3TG minerals for labour rights violations, and rated child labour an \"extreme risk\" in Bolivia, Myanmar and Indonesia."
M["tin"]["context"][0]["evidence"] = [{"level":"documented","scope":"sector risk rating, 2017"}]

# ---- Niobium
st = find("niobium", "Brazil")
st["people"] = L("Mined at one large industrial site (CBMM, Araxá). No reports of conflict, forced or child labour at the mine were found. CBMM must monitor and clean up past barium contamination under an agreement with state prosecutors.", "S56")
st["harm"] = {"documented":["S56"],"types":["environmental contamination (legacy)"],"extreme":False}
st = find("niobium", "Rubaya")
st["people"] = L("Coltan (which yields tantalum and niobium) from M23-occupied Rubaya is smuggled to Rwanda and mixed with Rwandan production (UN Group of Experts, 2025). Smelters that processed it still passed industry audits. Amnesty International documented M23 forcing miners to work, torturing them, and killing at least 18 miners at Rubaya and a nearby gold mine. The armed group that held Rubaya before M23 also used forced labour and executed civilians, according to the US Treasury. Tunnel collapses in 2026 killed hundreds of miners.", "S15", "S16", "S50", "S49", "S51")
st["harm"] = {"documented":["S15","S16","S50","S49","S51"],"types":["forced labour","killings","torture","armed-group control","mine deaths"],"extreme":True,"extremeTypes":["forced labour","killings","torture"],
              "extremeBasis":"Amnesty International (2026): M23 forced miners to dig, tortured them and killed at least 18 miners; US Treasury: PARECO-FF used forced labour and executed civilians."}
st = find("niobium", "Rwanda coltan")
st["harm"] = {"documented":["S15","S16"],"types":["laundering of conflict ore"],"extreme":False}
st = find("niobium", "Tantalum")
st["harm"] = {"documented":["S15"],"types":["processing conflict-linked ore"],"extreme":False}

# ---- Tungsten
st = find("tungsten", "Fusion-grade")
st["security"] = L("Only a few firms make fusion-grade tungsten parts. A.L.M.T. (Sumitomo, Japan) holds an ITER contract for tungsten monoblocks and also supplies Europe's ITER divertor targets. State-owned AT&M (China) says it made divertor parts for France's WEST and China's EAST. Plansee (Austria) made test divertor pieces for Europe's ITER agency, but no production contract was found.", "S27", "S52", "S28", "S53", "SY")
st = find("tungsten", "Global Tungsten")
st["harm"] = None
st = find("tungsten", "Tungsten mining")
st["people"] = L("Tungsten is one of the 3TG \"conflict minerals\". Armed groups such as the ELN have controlled some tungsten mining in Colombia (Verisk Maplecroft, 2017; ICIJ). Sayari records Rwandan and Colombian ore exports to traders and powder makers, but not conditions at those mines.", "S14", "S54", "SY")
st["harm"] = {"documented":["S14","S54"],"types":["armed-group control and extortion"],"extreme":False}

# ---- Steel
st = M["steel"]["stages"][0]
st["security"] = L("Europe's reference fusion steel, EUROFER97, has so far been made industrially by two firms. F4E's 2015 order of 27 t was forged by Saarschmiede (Germany) with Böhler (Austria) as subcontractor.", "S33", "S55")
st["people"] = L("No human rights hotspot identified at this stage. Alloying inputs, including about 1% tungsten, were not traced.", "S55")
st["name"] = "EUROFER97 low-activation steel (blanket structures): Saarschmiede, Böhler"

# ---- Parts
for part in p["parts"]:
    if part["id"] == "divertor":
        part["short"] = "Faces the plasma, takes the most heat"
        part["description"] = "The divertor faces the plasma directly and takes the most heat. Its plasma-facing surface is made of tungsten, which is also the leading choice for future reactor walls."
        part["descriptionSources"] = ["S27", "S52"]
    if part["id"] == "vacuum-vessel":
        part["description"] = "The vacuum vessel, blanket and support structure hold everything together. They are built from specialty steels, including the low-activation steel EUROFER97 used for blanket structures. These matter for supply, but this research found no major human rights hotspot at this stage."
        part["descriptionSources"] = ["S33"]

# ---- Findings
f["findings"][2]["body"] = "Four metals traders buy coltan from Rwandan exporters that Global Witness ties to M23-occupied Rubaya, and also ship tin concentrate to Malaysia Smelting Corporation, which buys ore from Tanzania, Rwanda and the DRC. Shipping records name countries, not mines, so whether conflict ore is in that tin cannot be seen."
f["findings"][3]["lead"] = "Sanctioned parties sit close to fusion's supply chains."
f["findings"][3]["body"] = "One of ITER's Nb₃Sn strand makers, Russia's Chepetsky Mechanical Plant, is on Ukraine's sanctions list. Separately, Malaysia Smelting Corporation, a major tin smelter, bought tin ore from Star Dragon, a Hong Kong trader the US sanctioned in August 2025 for buying minerals linked to an armed group at Rubaya. Star Dragon shipped 10 lots between September 2024 and August 2025, mostly from the DRC; the last arrived two days after the sanctions. Nothing shows this tin reached a fusion part."
f["findings"][3]["sources"] = ["SY", "S49", "S57"]

json.dump(c, open("data/chains.json","w"), indent=2, ensure_ascii=False)
json.dump(src, open("data/sources.json","w"), indent=2, ensure_ascii=False)
json.dump(f, open("data/findings.json","w"), indent=2, ensure_ascii=False)
json.dump(p, open("data/parts.json","w"), indent=2, ensure_ascii=False)
print("ok")
