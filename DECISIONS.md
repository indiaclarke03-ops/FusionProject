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
