# Decisions for the author

Judgement calls the site can't make on its own. Each item says where the answer goes.

## Resolved (iteration 3)

- **Colour ratings (harm).** These now follow your rule, applied by `tools/rate_harm.py`:
  - **Severe:** three or more sources document harm at a stage, or the harm is extreme (forced labour, child labour, or a crime against people), even with one source.
  - **Moderate:** one or two sources.
  - Each rated stage shows the reason on the site.
- **Bottom lines.** Kept as you liked them. The only edit is "militia-controlled" → "armed-group-controlled" for Kachin, because the Kachin Independence Army has controlled the mines since late 2024.
- **Lithium-6 and beryllium.** Removed in iteration 3, then fully researched and restored in iteration 4, because no area should say "not researched". `data/parked.json` keeps the iteration 3 versions for reference.
- **S17.** The link was genuine: an Oak Ridge National Laboratory presentation (G.R. Southworth) hosted by the South River Science Team. I corrected the title and added the peer-reviewed version (Brooks & Southworth 2011, OSTI). Both are back in use on the lithium-6 chain.
- **Scores.** Filled in from my judgement, each with a one-line note and sources. They are labelled on the site as "a first judgement, pending the author's review".
- **Moscow finding.** Shown, with every figure re-verified in Sayari and a primary public source (IAEA 2021 S-Innovations/SuperOx presentation) for S-Innovations' role in fusion tape.
- **Footer repo link.** Set.

## New in iteration 4 (please review)

14. **Russian state customers of the Moscow tape plant.** Procurement records list four state customers of S-Innovations, all on Ukraine's sanctions list: the Rosatom institutes NIIEFA and NIITFA, the Kurchatov Institute and Moscow State University. Contract dates and subjects were not retrieved, so this is **not** on the site. Decide whether to publish it, and with what caveat.
15. **Shareholder names.** S-Innovations' registry lists eight individual shareholders. Sayari shows one of them sharing a name with Faraday Factory Japan's lead investor. This is **not** on the site, and it extends item 7.
16. **Prospectus links shown as "confirmed".** Two links are marked confirmed (solid lines): CBMM → Western Superconducting and CITIC Metal → Western Superconducting. They rest on audited related-party tables in stock-market prospectuses, not customs records. Downgrade them to "reported" if you want "confirmed" kept for shipment and registry records only.
17. **Bruker's smelter list covers the whole company.** The map shows Yunnan Tin and Malaysia Smelting Corp → Bruker as "reported". This is why the Supplier Check gives Bruker a "stop and escalate": the sanctioned trader Star Dragon supplies Malaysia Smelting Corp. The list covers all Bruker products, not only fusion strand. Consider whether the prototype should soften this.
18. **Actor-level harm is not counted as extreme.** I applied the same rule as Man Maw to the Myanmar border trade and the eastern Shan mines: the UN listing of an armed group for child recruitment is about the group, not the site. Grasberg's killings claim rests on one undated statement, so it is moderate, not severe. Chrome in Limpopo is severe on extreme harm (Human Rights Watch documents violence against protesters).
19. **Bolivian silver** is on the map as an example of documented child labour in silver mining. Nothing links it to fusion tape, and the map says so. Keep it or drop it.
20. **Shanghai Superconductor** says it supplied 110+ km of tape to CFS. Sayari shows no such shipment. Sayari's modelled "military end-user" flag on the company is not shown.
21. **Off-chain items dropped.** ASG's Russian boron imports (for its MgB₂ line, not ITER) are not on the map. Neither is JASTEC's 2022–23 export of magnets to a Russian firm.
22. **Copper in wire magnets** is a thin chain (one shipment record). It is shown as its own material; it could be folded into the strand stage instead.
23. **Demand figures.** A researcher estimated fusion's yttrium use at about 70 kg per 10,000 km of tape. It has no source, so it is not on the site.
24. **Solution costs.** MagnetTrace's costs are indicative: lab rates and satellite tasking prices are sourced, but passport software costs are vendor estimates. The page says so.
25. **New scored routes.** I scored five new routes: Brazilian niobium, Vietnamese tungsten, US beryllium, Grasberg copper and Limpopo chrome. The scores headline now reads "proven on only 2" (Brazilian niobium via the Western Superconducting prospectus, and US beryllium via the Materion–CFS agreement).
26. **Design.** I treated DESIGN.md as inspiration, as you said. Medium-weight text is used for emphasis, and several new colours appear: copper and silver in the tape diagram, purple for rules, and teal for solution markers.

## New in iteration 5: the human cost page (please review)

27. **Headline death toll: at least 719.** Counted once per death:
    - Rubaya 421
    - Indonesian nickel 101
    - Cerro Rico 90
    - Kachin 45
    - Grasberg 39
    - Great Lakes tin 14
    - Man Maw 9

    Each disputed toll uses the lowest credible figure (e.g. Rubaya June 2025: 21, not the 300+ in one report; January 2026: 200, not 226 or 400+). Decide whether to show the higher reported tolls alongside.
28. **Kept in the log but not added to totals:**
    - Kachin's "around 50" rainy-season estimate, which overlaps the dated landslides
    - Amnesty's 18 killings, which combine Rubaya with a gold mine
    - Rwanda's 81 mining deaths in 2018, which cover all Rwandan mining

    Confirm.
29. **Indonesian nickel: 101 deaths.** This is Trend Asia's own total for 2015 to mid-2024. It already includes the dated incidents (28 deaths), so the two are never added together. Other totals overlap and use different methods (Public Citizen 107 for 2019–2025; Ministry of Manpower 39 at IMIP), so only one is shown.
30. **Cerro Rico (Bolivian silver) contributes 90 deaths** (police data, January–October 2025), but nothing links it to fusion tape. It stays because the page counts harm at places in the traced supply chains, and the caveat says most links are unproven. You may prefer to drop sites with no fusion link from the headline.
31. **Grasberg's 2020 and 2026 shootings** were by armed groups or unknown attackers, not the company. They are counted as deaths at the mine. Decide whether conflict deaths near a mine count as supply-chain harm.
32. **The Pangwa explosives depot (Kachin)** is shown as October 2026. The exact day was inferred from a news report.
33. **Left out pending verification:**
    - the 31 May 2026 Namhkam blast (40–55 dead), whose link to rare earths or tin is unclear
    - a 6 March 2026 Rubaya landslide (about 300 dead), reported only in an unverified blog
34. **The Maba Sangaji arrests** involve a company outside the two fusion-linked nickel parks. They are logged under Indonesian nickel; decide whether that node should cover all Indonesian nickel.
35. **The exposure estimate is our calculation.** Tape is assumed to be 4 mm wide (inferred from SPARC's figures). The niobium and tin shares of ITER's strand are assumptions. Myanmar's share of yttrium is a proxy (20–50%), because USGS only says "a significant percentage". Fusion scenarios are counted company claims, not a forecast. All of this is labelled on the page.
36. **Two harm columns in the estimator.** "Severe harm" covers places rated severe; "any documented harm" adds places with environmental or occupational harm (e.g. Brazilian niobium, Chinese tungsten). Brazil and China dominate the second column for niobium and tungsten. Confirm that split.
37. **Coordinates.** Man Maw is placed only at township level, and Kachin is a representative point at Pangwa. The leaching-tank layer is USGS satellite mapping, gridded by the researcher.
38. **Growth charts.** Some values were read by eye from published bar charts (Crisis Group). Part-year 2025 figures are left off the charts and noted instead.

## Still open from earlier

1. **Scores.** Review the numbers and notes in `data/scores.json`. Fusion leverage is the most judgement-heavy column.
2. **Supply-risk colours (security lens).** These are still my judgement. Your rule covers harm only.
3. **How I read "0–2 sources = moderate".** Stages with no documented harm at all are shown as "No documented harm" (grey) rather than moderate. Otherwise every unresearched stage would turn amber. Tell me if you want them amber.
4. **Man Maw (Wa State tin) is severe on source count (3), not on the extreme-harm rule.** The UN lists the United Wa State Army for recruiting children, but that listing concerns the armed group, not the mine. Decide whether that alone should count as extreme. It doesn't change the colour today.
5. **Indonesian nickel is severe on source count (3).** Coercive land-taking with police and military involvement was judged borderline for "crime against people", so it is not used as the trigger.
6. **Course name** for the footer (`course` in `data/site.json`).
7. **S-Innovations shareholders and Faraday Factory Japan's leadership share names.** Sayari doesn't link them, so it's a name match only, and it is **not** on the site. Keep it off, or add it clearly labelled as unconfirmed.
8. **Malaysia Smelting Corp tin route.** It is now better evidenced: the sanctioned trader Star Dragon shipped 10 lots of mostly Congolese tin ore to the smelter, the last two days after the US sanctions. It is shown as a second tin route and scored. Confirm you want it as a full route.
9. **Chepetsky Mechanical Plant** is on Ukraine's sanctions list only (since October 2022), not the US, EU or UK lists. The site says exactly that. Keep or drop.
10. **Tungsten route via Global Tungsten & Powders (Plansee).** Each hop is a confirmed shipment, but nothing shows the same ore moved through, so it is a hypothesis. Plansee is described only as having made ITER test pieces (F4E 2010). Decide whether to keep the stage.
11. **Haynes International's and Materion's `owned_by_soe` flags** look like Sayari data errors. They are not shown. Keep them off unless resolved.
12. **Divertor label.** The part is still labelled "Divertor & first wall", as in the brief. ITER's first wall is not tungsten (future reactors' walls are expected to be), and the description now says so. Consider shortening the label to "Divertor".
13. **Layout width.** The page now spreads up to 1760px on large screens, overriding DESIGN.md's 1080px maximum at your request. Reading text keeps a comfortable line length.
