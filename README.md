# The Magnet Problem

**Live site: https://indiaclarke03-ops.github.io/FusionProject/**

Fusion promises clean power. Follow one magnet back to the mine.

An interactive, evidence-led site that traces the materials in a fusion reactor back through their supply chains to the mine, and shows the documented human rights harm at each stage next to the supply-security view that usually frames the debate. Its argument: *secure is not the same as acceptable.*

- **Interactive reactor:** click a part to trace its materials, and switch between the security lens and the people lens.
- **Evidence levels on every stage:** Documented, Likely pathway, Hypothesis, Not yet researched.
- **Sayari corporate and trade records:** linked from each stage and marked Confirmed or Inferred.
- **Method & Limits:** https://indiaclarke03-ops.github.io/FusionProject/method.html

## How it's built

A static site with no build step, hosted on GitHub Pages. All content lives in `/data` as JSON (`parts`, `chains`, `sources`, `scores`, `findings`), so facts can be edited without touching code. `tools/rate_harm.py` applies the harm-rating rule. Open judgement calls for the author are listed in [DECISIONS.md](DECISIONS.md).

To run it locally, serve the folder over HTTP, because the site loads its JSON with `fetch`:

```
python3 -m http.server 8765
```

Then open http://localhost:8765.
