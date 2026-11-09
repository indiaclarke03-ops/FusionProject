# Decisions for the author

Judgement calls the site can't make on its own. Review these once the Sayari data is in and the full site is live. Each item says where the answer goes.

## From iteration 1

1. **Colour ratings.** Every stage has a provisional `rating` (`supply` and `harm`: high / moderate / low / unknown) in `data/chains.json`. These drive the reactor colours. They are Claude's reading of the evidence; confirm or change them. Example: Jiangxi environmental damage is rated `harm: high`.
2. **Bottom lines.** The one-to-two sentence "Bottom line" for each material (`bottomLine` in `data/chains.json`) was drafted from the seed facts. Check the wording.
3. **Lithium-6 and beryllium "link to fusion: documented".** In `data/scores.json` both are marked as having a documented link. This produces the scores headline "the link to fusion is proven on only 2". Lithium-6 rests on Oak Ridge history, which was arguably weapons-programme enrichment rather than fusion, so you may want to downgrade it.
4. **Source S17.** It is listed as Oak Ridge National Laboratory, but the URL is hosted on southriverwatershed.org. Confirm the document and publisher in `data/sources.json`.
5. **Exposure Pathway scores.** Fill in `scores` and `notes` in `data/scores.json` (1–3 per dimension, plus a one-line note and sources). Until then they show as "Pending".
6. **Footer details.** Add `course` in `data/site.json` (the repo link is now set).

## From iteration 2 (Sayari research)

7. **How prominently to show the Moscow tape finding.** Russian customs records in Sayari show coated Hastelloy tape exported from S-Innovations (Moscow, SuperOx group) to Commonwealth Fusion Systems in Jan–Apr 2022 (9 records). They also show CFS exporting uncoated Hastelloy tape to S-Innovations and SuperOx-Innovations from May 2022 to Dec 2024 (15 records, declared "for own use for research purposes"). And they show S-Innovations sending 369 shipments of coated tape to Faraday Factory Japan until Jan 2025. None of these companies is sanctioned. The site states only what the records show. It appears on the nickel and yttrium chains and as finding 02. Decide whether it should be that prominent, and whether to ask CFS or Faraday for comment before publishing.
8. **The name match between S-Innovations' shareholders and Faraday Factory Japan's leadership.** Two S-Innovations shareholders share names with Faraday Factory Japan's CEO and Director of Strategy. Sayari does not link these people, so it is a same-name match only. It is **not** on the site. Keep it off, or add it clearly labelled as unconfirmed.
9. **"The rare earth is usually yttrium."** The SuperOx-line tape imported a gadolinium target and uses yttrium oxide in its buffer layers. I changed the wording to "usually yttrium… some makers use gadolinium". Confirm you're happy, since the site's spine is yttrium.
10. **The Malaysia Smelting Corp tin route.** I added it as a second tin route ("Great Lakes traders → Malaysia Smelting Corp"). It rests on four traders who buy Rwandan coltan and also ship tin concentrate to the smelter. Decide whether it stays a full route, becomes context only, or gets its own row in the scores table.
11. **Sanctions adjacency wording.** Star Dragon Corporation (US OFAC list) is recorded as a supplier to Malaysia Smelting Corp and to Ulba (Kazakhstan). The goods behind those links were not retrieved. The site says "recorded as a supplier… goods not retrieved". Decide whether to keep these one-hop links visible.
12. **Chepetsky Mechanical Plant on Ukraine's sanctions list.** It is on Ukraine's NSDC list, not the US, EU or UK lists. The site says exactly that on the strand-maker stage. Decide whether to keep it.
13. **Tungsten: Rwanda → Traxys → Global Tungsten & Powders (Plansee).** Each hop is a confirmed shipment, but nothing shows the same ore moved through, so the site marks the fusion link as a hypothesis. Plansee's fusion role has no primary source, so it is named only as "also cited". Decide whether to keep the GTP stage, and whether the 2012–13 Colombian ore purchases are too old to show.
14. **Ulba "flagged" wording.** Sayari flags Ulba for regulatory action and imports from an OFAC-listed trader. The site says "Sayari flags…", not "sanctions-exposed". Confirm the tone.
15. **Ratings for the new stages.** New Sayari-based stages carry provisional `rating` values. For example, Malaysia Smelting Corp is `harm: moderate` and the Moscow coating step is `supply: high`. Review them with item 1.
16. **Niobium "lower human rights risk" in Brazil** still has no source and shows a "Source needed" flag. Find a source or remove the claim.
17. **Scores table routes.** The Sayari research suggests extra routes: tin via Malaysia, and HTS tape via Moscow (a security route rather than a people route). Decide whether to add them before scoring.
18. **Haynes International's and Materion's `owned_by_soe` flags.** These look like Sayari data artefacts for US-listed companies and were not resolved. They are not shown on the site. Keep them off unless resolved.
