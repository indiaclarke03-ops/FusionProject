# Project Brief: The Magnet Problem
### Mapping the Human Cost of Fusion Energy Materials (Iteration 1)

> **For Claude Code:** This file is the content and functionality spec for the site. A separate **design brief** (from Dress Code) sets the visual style. Read both before writing any code. Where they conflict on *look*, follow the design brief. Where they conflict on *content, data or behaviour*, follow this file.

---

## 1. What we are building

A static, single-page website (plus a Method page) hosted on **GitHub Pages**. Plain HTML, CSS and JavaScript, no build step. D3 or similar may be loaded from a CDN if needed for the map.

The centrepiece is an **interactive reactor diagram**. The visitor clicks a part of a fusion reactor (e.g. the magnets), and the site traces that part's materials back through the supply chain to the mine, flagging documented human rights abuses at each stage.

### Course requirements this must meet
1. A **systems map** of the material supply chains
2. A first-iteration **AI-coded site** on this domain
3. A short **policy brief / tech proposal** on the site
4. **Explainability**: the author must be able to explain every claim and how the tool works. Sources and evidence levels must be visible, not hidden.

---

## 2. The narrative (this drives every section)

**Fusion's supply chain is being planned as a security problem. This site argues it must be planned as a people problem first.**

Governments and fusion companies talk about materials in terms of chokepoints, export controls and import dependence: *can we get it?* That conversation almost never asks *who paid for it?* This site makes the case that a supply chain built on human rights abuse is not acceptable however secure it is, and that fusion, still pre-commercial, is at the cheapest possible moment to build traceability in.

**Core line:** *Secure is not the same as acceptable.*

Tone: serious, evidence-led, not sensational. The argument is moral and the evidence is careful. Never overstate a link the evidence doesn't support (see Evidence Levels, section 5).

---

## 3. Page structure (single scrolling page)

### 3.1 Hero
- Title: **The Magnet Problem**
- Subtitle: *Fusion promises clean power. Follow one magnet back to the mine.*
- One-sentence framing of the security-first vs people-first argument.
- Scroll cue down to the reactor.

### 3.2 "Two ways to look at a reactor": the lens framing
Short section introducing the **lens toggle** (see 4.2) before the visitor reaches the diagram.
- **Security lens:** Where is supply concentrated? Who controls it? What can be cut off?
- **People lens:** Who mines it? Under what conditions? Who is harmed?

### 3.3 The interactive reactor (centrepiece, see section 4)

### 3.4 Case file: "From Kachin to cryostat"
A longer narrative walk through the **yttrium → REBCO tape → magnet** chain, the spine of the project. Scroll-driven if the design allows; otherwise stacked cards per stage. Every stage cites its sources.

### 3.5 Exposure Pathway scores (author's original framework)
A table or heat strip scoring each material route 1–3 on four dimensions (see section 6). The visitor should be able to see at a glance which routes are documented versus hypothesised.

### 3.6 Policy brief: "Traceability before scale"
Rendered on the page (also downloadable as PDF in a later iteration). Content in section 7.

### 3.7 Footer
Links to Method & Limits page, GitHub repo, course name. Last-updated date.

### Separate page: `method.html`, Method & Limits
See section 8.

---

## 4. The interactive reactor: functional spec

### 4.1 The diagram
- An **original SVG cutaway of a generic compact tokamak** (a doughnut-shaped reactor shown in cross-section). Draw it ourselves in SVG. **Do not** trace, copy or embed any company's renders, photos or branded diagrams (no CFS/ITER images). It should read as "a fusion reactor" without imitating a specific product.
- Five clickable **hotspot parts**, each a separate SVG group with an `id`:

| Part id | Label on diagram | What it does | Materials traced |
|---|---|---|---|
| `hts-magnets` | High-temperature superconducting magnets | Confine the plasma (compact tokamaks) | **Yttrium** (REBCO tape), nickel (tape backing alloy) |
| `lts-magnets` | Low-temperature superconducting coils | Confine the plasma (ITER-style reactors) | **Niobium**, **tin** (Nb₃Sn) |
| `divertor` | Divertor & first wall | Faces the plasma, takes the heat | **Tungsten** |
| `blanket` | Breeding blanket | Breeds tritium fuel, absorbs neutrons | **Lithium-6**, **beryllium** |
| `vacuum-vessel` | Vacuum vessel & structure | Holds everything | Specialty steels (low human-rights relevance; show as "lower risk" card for contrast) |

- Hover: part highlights, tooltip shows label + one-line function.
- Click (or Enter/Space via keyboard): opens the **Trace panel** for that part.
- Parts must be keyboard-focusable (`tabindex="0"`, `role="button"`, `aria-label`).
- Small legend: "Click any part to trace its materials."

### 4.2 The lens toggle
A two-state toggle visible above the diagram and inside the Trace panel: **Security lens / People lens**.
- **Security lens:** each stage node shows concentration, controlling country/company, export controls, single points of failure. Colour = supply risk.
- **People lens (default after the intro section):** the same nodes show human rights findings. Colour = harm severity + evidence level.
- The *same map* re-colours and swaps its annotations. That visual switch IS the argument: the security lens can look "fine" where the people lens shows harm.
- Optional end-state message when switching to People lens on a high-harm chain: *"Secure is not the same as acceptable."*

### 4.3 The Trace panel (opens on click)
A panel (side drawer on desktop, full-screen sheet on mobile) showing:
1. **Part name + what it does** (1–2 sentences)
2. **Material tabs** if the part has more than one material (e.g. Yttrium | Nickel)
3. **Supply chain trace**: stages laid out from the reactor back to the mine:
   `Reactor / developer → Component maker → Metal / oxide / alloy → Separation / refining → Mine / source region`
   Each stage is a node card with:
   - Name (country, region, or company)
   - Lens annotation (security facts or people facts depending on toggle)
   - **Evidence level badge** (section 5)
   - **"Blending point" marker** where ore from different sources is mixed and traceability breaks
   - Source links (always visible, never hidden behind extra clicks)
4. **Bottom line** for that material: one or two sentences in plain English.
5. Button: **"Read the full case file"** (yttrium only, scrolls to 3.4) or **"See the scores"** (scrolls to 3.5).

### 4.4 Data-driven, not hard-coded
All content lives in JSON so the author can edit facts without touching code:
```
/data/parts.json      — the five reactor parts, their labels, functions, materials
/data/chains.json     — for each material: ordered stages, both lens annotations, evidence level, source ids, blending-point flag
/data/sources.json    — every source: id, title, publisher, date, URL
/data/scores.json     — Exposure Pathway scores with evidence notes
```
The page renders entirely from these files. **Claude Code must not invent facts, figures, companies or links.** Use only what is in the data files. Where a stage is not yet researched, render it visibly as **"Not yet researched"** (greyed node) rather than filling it in.

---

## 5. Evidence levels (show on every node)

| Badge | Meaning |
|---|---|
| **Documented** | Credible public evidence (NGO, UN, government, peer-reviewed) of human rights harm at this stage |
| **Likely pathway** | Harm at the source is documented; the link from that source into fusion's supply chain is plausible by market structure but not proven |
| **Hypothesis** | A link worth testing; no direct evidence yet |
| **Not yet researched** | Placeholder for iteration 2 |

The evidence badge is the core explainability feature. A visitor must always be able to tell a proven abuse from a plausible exposure.

---

## 6. Seed content for the data files

Use the facts below to populate the JSON files. Every fact has a source id from section 9. Do not add facts that aren't listed here; mark gaps as "Not yet researched" or `TODO`.

### 6.1 Yttrium → REBCO tape → HTS magnets (THE SPINE)

**Why it matters (part card):** Compact tokamaks use high-temperature superconducting magnets made from REBCO tape ("rare-earth barium copper oxide"). The rare earth is usually yttrium. It cannot easily be substituted in this design. [S10]

| Stage | Security lens | People lens | Evidence | Sources |
|---|---|---|---|---|
| Reactor developers | Compact tokamak developers (e.g. Commonwealth Fusion Systems) depend on HTS tape | Buyers several tiers removed from the mine; no public human rights traceability for magnet materials found | Documented (absence) | S10, S11 |
| Tape makers | Small number of makers, mainly Japan, US, China, S. Korea. `TODO: confirm makers + countries with public sources and Sayari` | `TODO: Sayari upstream on tape makers` | Not yet researched | — |
| Yttrium oxide | China added yttrium to export licensing in April 2025; US-bound yttrium exports collapsed afterwards | — | Documented (security) | S6, S7 |
| **Separation (BLENDING POINT)** | Separation of heavy rare earths, including yttrium, is overwhelmingly in China | Ore from Myanmar enters Chinese separation plants and leaves as Chinese product; origin is lost here | Documented (structure) | S6, S3 |
| Mine: Kachin State, Myanmar | Myanmar is a significant yttrium source via ionic clays | 300+ mining sites in militia-controlled Kachin Special Region 1 (40%+ growth 2021–23); acidic, arsenic-contaminated streams; worker and resident health harms incl. deaths; deadly landslides; trade risks financing conflict | **Documented harm** at source; **Likely pathway** to fusion (published investigations focus on dysprosium/terbium; yttrium-specific tracing to tape not found) | S1, S2, S3, S4, S6 |
| Mine: southern China ionic clays | Main source | Severe environmental damage from heavy rare earth mining in Jiangxi (multi-billion-dollar cleanup, decades to recover) | Documented (environmental) | S3 |

**Secondary material: nickel (tape backing alloy)**
REBCO tape is deposited on a nickel-based alloy backing (Hastelloy). Indonesia's nickel hubs have documented harms: Indonesia's human rights commission (2026) found the state failed to protect rights around Morowali, with rising respiratory illness; fatal smelter accidents; land grabs affecting Indigenous communities at Weda Bay. **Evidence: Hypothesis.** No public evidence yet links tape makers' alloy supply to Indonesian nickel. `TODO: Sayari upstream on alloy suppliers.` [S12, S13]

### 6.2 Niobium + tin → Nb₃Sn → LTS magnets

**Tin (Nb₃Sn)**
| Stage | Security lens | People lens | Evidence | Sources |
|---|---|---|---|---|
| Mine: Man Maw, Wa State, Myanmar | Myanmar was the world's 3rd-largest tin producer; nearly all from Man Maw; mine restarted 2025–26 after suspension | Controlled by the United Wa State Army, a non-state armed group under US sanctions since 2003 (narcotics trafficking); access tightly restricted | Documented harm (armed-group control); Likely pathway to fusion (market level) | S8, S9 |
| **Smelting (BLENDING POINT)** | Wa has no smelters; ore goes to smelters in Yunnan, China | Origin lost at smelting | Documented (structure) | S9 |
| Sector-wide | — | Tin rated highest-risk of the conflict minerals for labour abuses; child labour "extreme risk" in Myanmar, Indonesia, Bolivia | Documented | S14 |

**Niobium**
| Stage | Security lens | People lens | Evidence | Sources |
|---|---|---|---|---|
| Main source | Highly concentrated in Brazil. `TODO: public source for share (USGS)` | Lower human rights risk at main source | `TODO` | — |
| Secondary: Rubaya, eastern DRC | — | Coltan (yields tantalum + niobium) from M23-occupied Rubaya smuggled to Rwanda and mixed with Rwandan production (UN Group of Experts 2025); due-diligence audit schemes failed to catch it | Documented harm; Hypothesis for fusion link | S15, S16 |
| **Rwanda export (BLENDING POINT)** | — | Smuggled ore laundered into "Rwandan" exports | Documented | S15, S16 |

### 6.3 Tungsten → divertor / first wall
| Stage | Security lens | People lens | Evidence | Sources |
|---|---|---|---|---|
| Mining | China dominates mining. `TODO: USGS share` | Tungsten is one of the 3TG "conflict minerals"; armed groups control some tungsten mining in Colombia | Documented (sector); Not yet researched (fusion link) | S14 |
| Fusion-grade processors | Very few qualified suppliers. `TODO: public source` | `TODO` | Not yet researched | — |

### 6.4 Blanket: lithium-6 and beryllium
**Lithium-6:** Tritium breeding needs enriched lithium-6. US enrichment at Oak Ridge in the 1950s–60s used mercury: about 1.1 million kg was lost on site, ~10% into East Fork Poplar Creek, and ~15 miles of the creek still exceed mercury water-quality criteria. Frame as **"Lessons from history"**: fusion's fuel chain has caused harm before. Evidence: Documented (historical). [S17, S18]

**Beryllium:** Neutron multiplier; CFS has a supply agreement with Materion for beryllium fluoride. Supply is concentrated (Materion in Utah/Ohio; Ulba in Kazakhstan, state-owned; China). Main people risk is **worker health** (chronic beryllium disease), not conflict. Evidence: Documented (sector), `TODO: OSHA source on chronic beryllium disease`. [S19, S20]

### 6.5 Vacuum vessel & structure
Show as a contrast card: specialty low-activation steels are a manufacturing/security bottleneck but no major human rights hotspot was identified at this stage of research. Evidence: Not yet researched.

---

## 7. Exposure Pathway framework (author's own)

Score each material route 1 (low) to 3 (high). Every score needs a one-line evidence note and source ids.

| Dimension | Question |
|---|---|
| **Harm severity** | How serious are documented abuses at the source? |
| **Evidence strength** | Is the link to fusion proven (3), likely (2), or hypothetical (1)? |
| **Traceability break** | Is there a blending point where origin is lost? |
| **Fusion leverage** (inverted: 3 = least leverage) | Can fusion buyers alone change anything, or only by pooling with other sectors? |

Routes to score: Yttrium (Kachin), Yttrium (S. China), Tin (Wa State), Niobium (Rubaya), Nickel (Indonesia), Tungsten, Lithium-6 (historical), Beryllium.
`TODO: author fills scores in scores.json. Render placeholders until then.`

---

## 8. Policy brief: "Traceability before scale"

**Problem:** Fusion materials policy is framed around supply security. Human rights do not appear in the main industry and government supply chain discussions [S10, S11]. Fusion's demand for these materials is tiny (a few tonnes of yttrium), so fusion buyers have little leverage alone.

**Principle:** People first. A material sourced through documented abuse fails the test regardless of how secure it makes supply.

**Proposals:**
1. **Conditions on public fusion money.** Public grants, milestone payments and offtake agreements for fusion require suppliers to trace magnet and plasma-facing materials back to at least the separation/smelting stage, and disclose origin.
2. **Cross-sector due diligence pool.** Fusion developers buy rare earths, tin and niobium through verified channels shared with larger buyers that face the same chokepoints, to gain leverage none has alone.
3. **Tech proposal: Fusion Supplier Check.** A tool where a buyer enters a supplier and sees its upstream exposure (via Sayari corporate and trade data), scored on the Exposure Pathway framework. *Iteration 1: describe it and show a mock-up card. Iteration 2: build it.*

**Why now:** fusion is pre-commercial. Building traceability in before scale costs far less than retrofitting it, as batteries showed.

Keep the brief to roughly one screen of reading plus the three proposals.

---

## 9. Sources (seed `sources.json` from this list)

| id | Source | URL |
|---|---|---|
| S1 | Global Witness, *Fuelling the future, poisoning the present: Myanmar's rare earth boom* (2024) | https://globalwitness.org/en/campaigns/transition-minerals/fuelling-the-future-poisoning-the-present-myanmars-rare-earth-boom |
| S2 | Global Witness press release on Kachin heavy rare earth expansion (2024) | https://globalwitness.org/en/press-releases/new-investigation-reveals-the-alarming-expansion-of-heavy-rare-earth-mining-in-myanmar-and-the-devastating-cost-for-communities-and-the-environment |
| S3 | EarthRights International, *Kachin: A Sacrifice Zone for the Green Transition* (2025) | https://earthrights.org/wp-content/uploads/2025/05/Rare-Earth-Report-April-2025.pdf |
| S4 | Global Witness reaction to deadly landslide at Myanmar rare earth mine | https://globalwitness.org/en/press-releases/deadly-landslide-at-rare-earth-mine-in-myanmar-global-witness-reaction |
| S6 | Rare Earth Mining, *Top 10 Yttrium Producers in 2026* | https://rare-earth-mining.com/yttrium-producers |
| S7 | CSIS, *Rare Earth Export Restrictions One Year Later* | https://www.csis.org/analysis/rare-earth-export-restrictions-one-year-later |
| S8 | Crisis Group, *Tin: The Mine That Moves the Market* | https://www.crisisgroup.org/visual-explainers/critical-minerals-myanmar/tin |
| S9 | Reuters via Mining.com, *Tin bulls in retreat as Myanmar flags return of key mine* (2025) | https://www.mining.com/web/column-tin-bulls-in-retreat-as-myanmar-flags-return-of-key-mine |
| S10 | US DOE, Fusion Supply Chain overview (2024) | https://science.osti.gov/-/media/sbir/pdf/Application_Resources/2024/CPE---FES-Fusion-Supply-Chain-Public-April-2024.pdf |
| S11 | Fusion Industry Association, *Fusion Industry Supply Chain 2026* | https://www.fusionindustryassociation.org/fia-launches-2026-fusion-industry-supply-chain-report |
| S12 | Mongabay via Reccessary, Komnas HAM nickel findings (2026) | https://www.reccessary.com/en/news/indonesia-nickel-boom-rising-illness |
| S13 | Climate Rights International, *Indonesia: Nickel Industry Harming Human Rights* | https://cri.org/indonesia-nickel-industry-harming-human-rights-and-the-environment |
| S14 | Verisk Maplecroft via ReliefWeb, 3TG risks beyond conflict-minerals hotspots | https://reliefweb.int/report/democratic-republic-congo/tech-supply-chains-risk-links-human-rights-abuses-outside-conflict |
| S15 | Global Witness, *Who buys Rwanda's smuggled coltan?* | https://globalwitness.org/en/campaigns/transition-minerals/who-buys-rwandas-smuggled-coltan-the-global-journey-of-conflict-coltan-from-drc-to-the-worlds-electronics |
| S16 | AP, UN experts on Rwanda, M23 and mineral smuggling (2025) | https://apnews.com/article/rwanda-congo-coltan-rubaya-smuggling-m23-trump-minerals-12d3bc8c8c8144c38c7e497c9928b0bc |
| S17 | Oak Ridge National Laboratory, mercury in East Fork Poplar Creek | https://southriverwatershed.org/wp-content/uploads/2018/08/south-river-science-team-final.pdf |
| S18 | DOE Oak Ridge Site Specific Advisory Board, *Advocate* Issue 75 (2019) | https://www.energy.gov/orem/articles/advocate-issue-75-july-2019 |
| S19 | True Source Metals, Beryllium profile | https://hub.truesourcemetals.com/metals/beryllium |
| S20 | Materion–Commonwealth Fusion Systems beryllium fluoride agreement | https://finance.yahoo.com/news/materion-signs-supply-agreement-commonwealth-104700784.html |

(S5 intentionally unused.)

---

## 10. Method & Limits page (`method.html`)

Sections:
1. **What this site does**: one paragraph.
2. **How the trace works**: stages, lens toggle, evidence levels, blending points.
3. **Data sources**: Sayari (corporate ownership, trade and shipment data), Tavily (web research on NGO, UN, government and news sources), public reports listed in sources.json.
4. **What the data cannot show**: Sayari shows recorded relationships and trade flows, not the conditions inside a mine; trade data loses origin at blending points; absence of a link is not proof of no link; data dates.
5. **Evidence rules**: no claim without a public source; harm at a source is kept separate from proof of a link to fusion.
6. **How AI was used**: research assisted by Claude with Tavily and the Sayari MCP; site built with Claude Code in VS Code; design brief generated with the author's tool Dress Code; all claims reviewed by the author.
7. **Iteration log**: what changed in each iteration.

---

## 11. Sayari research tasks (if the Sayari MCP is available in this environment)

Run these and add results to `chains.json` with Sayari entity/record IDs stored in the source entry:
1. Search shipments of yttrium compounds (HS 2846) into Japan, US, South Korea; identify exporters and importers.
2. Upstream supply chain for the REBCO tape makers identified in step 1 or in public sources.
3. Upstream supply chain for nickel alloy (Hastelloy) suppliers to those tape makers (tests the nickel hypothesis).
4. Watchlist / risk-factor checks on every entity surfaced.
Mark Sayari-derived relationships as **inferred** vs **confirmed** per Sayari's own labelling, and show that distinction on the node.

---

## 12. Technical requirements
- Static site, GitHub Pages, no build step. `index.html`, `method.html`, `/css`, `/js`, `/data`.
- Fully responsive; the reactor diagram must be usable on a phone (tap targets ≥ 44px; trace panel becomes a full-screen sheet).
- Accessible: keyboard navigation for hotspots and toggle, visible focus states, sufficient contrast, `aria-live` region announcing which part is open, reduced-motion support.
- No tracking, no external images of real reactors or companies.
- Fails gracefully: if a JSON file fails to load, show a readable message.

## 13. Build order
1. Set up repo structure and data files with the seed content above.
2. Build the SVG reactor with the five hotspots + hover/click/keyboard.
3. Build the Trace panel rendering from `chains.json`, with evidence badges and sources.
4. Add the lens toggle (security ↔ people).
5. Hero, lens intro, case file, scores, policy brief.
6. Method page.
7. Apply the Dress Code design brief across everything.
8. Check: every node has a source or a visible "Not yet researched"; no invented facts; mobile + keyboard test.
