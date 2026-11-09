# The Magnet Problem

**Live site: https://indiaclarke03-ops.github.io/FusionProject/**

Fusion's superconducting magnets are made from metals that are also mined amid armed conflict, forced labour and poisoned rivers. The industry is still small enough to fix that before it scales.

An interactive, evidence-led site that traces the materials in a fusion reactor back through their supply chains to the mine, and shows the documented human rights harm at each stage next to the supply-security view that usually frames the debate. Its argument: *secure is not the same as acceptable.*

- **Overview:** what fusion is, why it needs magnets and what the magnets are made of, for readers new to the topic.
- **Interactive reactor:** click a part to trace its materials, and switch between the security lens and the people lens.
- **Systems map:** the whole magnet supply chain, from mines to fusion developers, with human rights risks and the rules that act on it.
- **Human cost:** a dated log of people killed and harmed at the mines and plants, mapped, plus an estimate of how much of a fusion magnet could come from those places.
- **Case files:** plain-language walk-throughs of each material, following company and customs records step by step.
- **The solution:** MagnetTrace, a tech-enabled traceability system, with a working Supplier Check.
- **Evidence levels on every stage:** Documented, Likely pathway, Hypothesis, No evidence found.
- **Sayari corporate and trade records:** linked from each stage and marked Confirmed or Inferred.
- **Method & Limits:** https://indiaclarke03-ops.github.io/FusionProject/method.html

## How it's built

A static site hosted on GitHub Pages. All content lives in `/data` as JSON (`parts`, `chains`, `map`, `human`, `cases`, `solution`, `sources`, `scores`, `findings`), so facts can be edited without touching code. The HTML pages are assembled from `src/` by `python3 tools/build_pages.py`, and the output is committed, so hosting needs no build step. `tools/rate_harm.py` applies the harm-rating rule. Open judgement calls for the author are listed in [DECISIONS.md](DECISIONS.md).

To run it locally, serve the folder over HTTP, because the site loads its JSON with `fetch`:

```
python3 -m http.server 8765
```

Then open http://localhost:8765.
