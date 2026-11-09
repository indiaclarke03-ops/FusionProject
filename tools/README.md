# tools/

Scripts that build or check the site data in `/data`. Run from the repo root.

- `rate_harm.py`: applies the harm-rating rule (see its docstring) to every stage in `data/chains.json`. Re-run after editing any stage's `harm` block.
- `merge_iter2.py`, `merge_iter2_yttrium.py`: **historical**. These merged the iteration 2 Sayari research. Do not re-run them; the data has been edited since (iteration 3 verification, lithium-6 and beryllium parked in `data/parked.json`).
- `iter3_verify_hts.py`, `iter3_verify_lts.py`, `iter3_scores.py`: **historical**. They applied the iteration 3 verification corrections and the first scores. Edit `data/*.json` directly from now on, then re-run `rate_harm.py`.
