# Decisions for the author

Judgement calls the site can't make on its own. Each item says where the answer goes.

## Resolved (iteration 3)

- **Colour ratings (harm).** These now follow your rule, applied by `tools/rate_harm.py`:
  - **Severe:** three or more sources document harm at a stage, or the harm is extreme (forced labour, child labour, or a crime against people), even with one source.
  - **Moderate:** one or two sources.
  - Each rated stage shows the reason on the site.
- **Bottom lines.** Kept as you liked them. The only edit is "militia-controlled" → "armed-group-controlled" for Kachin, because the Kachin Independence Army has controlled the mines since late 2024.
- **Lithium-6 and beryllium.** Removed from the site. Their data is in `data/parked.json` for a later iteration. The breeding blanket shows as "Not traced in this iteration".
- **S17.** The link was genuine: an Oak Ridge National Laboratory presentation (G.R. Southworth) hosted by the South River Science Team. I corrected the title, added the peer-reviewed version (Brooks & Southworth 2011, OSTI), and parked both with lithium-6.
- **Scores.** Filled in from my judgement, each with a one-line note and sources. They are labelled on the site as "a first judgement, pending the author's review".
- **Moscow finding.** Shown, with every figure re-verified in Sayari and a primary public source (IAEA 2021 S-Innovations/SuperOx presentation) for S-Innovations' role in fusion tape.
- **Footer repo link.** Set.

## Still open (please review)

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
