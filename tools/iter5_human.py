"""Iteration 5: build data/human.json from the human-cost research (incidents, geography, exposure).
Run: python3 tools/iter5_human.py <research dir>
"""
import json, re, sys
sys.path.insert(0, "tools")
from srcreg import Registry

RD = sys.argv[1]
R = Registry()
ALIAS = json.load(open("tools/iter4_alias.json"))
mp = json.load(open("data/map.json"))
node_ids = {n["id"] for n in mp["nodes"]}

def load(name):
    return json.load(open(f"{RD}/{name}"))

def keymap_for(d):
    km = {}
    for s in d.get("new_sources", []):
        km[s["key"]] = R.add(s.get("title"), s.get("publisher"), s.get("date"), s.get("url"))
    return km

def fix_sources(lst, km):
    out = []
    for x in lst or []:
        if isinstance(x, dict):
            sid = R.add_dict(x)
        else:
            sid = km.get(x, x)
            if isinstance(sid, str) and sid.startswith("NEW:"):
                sid = R.add(None, None, None, sid[4:])
        if sid and sid not in out:
            out.append(sid)
    return out

def node(n):
    n = ALIAS.get(n, n)
    return n if n in node_ids else None

def year_of(d):
    m = re.match(r"(\d{4})", str(d or ""))
    return int(m.group(1)) if m else None

problems = []

# ---------- incidents ----------
inc_d = load("r5_incidents.json"); km = keymap_for(inc_d)
incidents = []
for i in inc_d["incidents"]:
    nid = node(i.get("node"))
    if not nid:
        problems.append(f"incident {i.get('id')} has unknown node {i.get('node')}"); continue
    srcs = fix_sources(i.get("sources"), km)
    if not srcs:
        problems.append(f"incident {i.get('id')} has no sources"); continue
    incidents.append({
        "id": i["id"], "node": nid, "place": i.get("place"), "date": str(i.get("date")), "year": year_of(i.get("date")),
        "type": i.get("type", "harm"), "killed": i.get("killed"), "injured": i.get("injured"), "missing": i.get("missing"),
        "affected": i.get("affected"), "affected_desc": i.get("affected_desc"), "summary": i.get("summary"),
        "cause": i.get("perpetrator_or_cause"), "counts_are": i.get("counts_are"), "sources": srcs, "quote": i.get("quote"),
    })
# Counting rules (see DECISIONS.md): overlapping or out-of-scope figures stay in the log but are not summed.
NOT_COUNTED = {
  "inc-003": "Estimate for the whole 2024 rainy season; overlaps the dated Pangwa landslides, so not added.",
  "inc-016": "Combines Rubaya with the Lomera gold site, so not added to Rubaya's total.",
  "inc-044": "Covers all mining in Rwanda, not only tin and coltan, so not added.",
}
DATE_FIX = {"inc-009": "2026-10"}
TOTAL_TEXT = {
  "y-kachin": "At least 45 people were killed in dated incidents: landslides on 4 June 2024 (20+) and 19 June 2024 (15, with 14 more missing), two miners who died after chemical exposure (2024), a worker buried in 2025, and an explosives-depot blast in October 2026 (7). Myanmar Witness puts the toll for the 2024 rainy season alone at around 50.",
}
for i in incidents:
    if i["id"] in NOT_COUNTED:
        i["counted"] = False; i["notCounted"] = NOT_COUNTED[i["id"]]
    if i["id"] in DATE_FIX:
        i["date"] = DATE_FIX[i["id"]]; i["year"] = year_of(i["date"])
site_totals = []
for t in inc_d.get("site_totals", []):
    nid = node(t.get("node"))
    if nid:
        site_totals.append({"node": nid, "period": t.get("period"), "killed_min": t.get("killed_min"), "text": TOTAL_TEXT.get(nid, t.get("text")), "basis": t.get("basis"),
                            "aggregate": "source aggregate" in (t.get("basis") or ""), "sources": fix_sources(t.get("sources"), km)})

# ---------- geography ----------
geo_d = load("r5_geo.json"); km = keymap_for(geo_d)
coords = []
for c in geo_d["coords"]:
    nid = node(c.get("node"))
    if not nid or c.get("lat") is None:
        problems.append(f"coord for unknown node {c.get('node')}"); continue
    coords.append({"node": nid, "lat": float(c["lat"]), "lon": float(c["lon"]), "precision": c.get("precision"), "place": c.get("place"), "note": c.get("note"), "sources": fix_sources(c.get("sources"), km)})
series = []
for s in geo_d.get("series", []):
    pts = [p for p in s.get("points", []) if p.get("y") is not None]
    if len(pts) < 2: continue
    series.append({"id": s["id"], "node": node(s.get("node")), "title": s["title"], "unit": s.get("unit", ""), "points": pts, "sources": fix_sources(s.get("sources"), km), "caveat": s.get("caveat")})

# ---------- exposure ----------
# Series fixes: two-line series, and partial years removed from charts (kept in notes).
for srs in series:
    if srs["id"] == "rw-drc-tantalum-mine-usgs":
        drc = [740, 740, 780, 700, 890, 980, 1270, 1300]
        srs["label1"], srs["label2"] = "Rwanda", "DR Congo"
        srs["points2"] = [{"x": p["x"], "y": v} for p, v in zip(sorted(srs["points"], key=lambda q: q["x"]), drc)]
        srs["title"] = "Tantalum mine production: Rwanda vs DR Congo (USGS)"
    if srs["id"] == "rw-coltan-exports":
        srs["points"] = [p for p in srs["points"] if p["x"] != 2025]
        srs["points2"] = [{"x": 2023, "y": 1900, "note": "calculation from '>2,900 t' / 1.52"}, {"x": 2024, "y": 2900, "note": "'exceeds 2,900 tonnes'"}]
        srs["label1"], srs["label2"] = "Exports recorded by ITSCI", "Imports from Rwanda reported by trade partners"
        srs["caveat"] = (srs.get("caveat") or "") + " 2025 is a part year (Jan–Jun: 1,078 t recorded vs 3,839 t reported by partners), so it is left off the chart."
    if srs["id"] == "mm-hreo-exports-china-tonnes":
        srs["points"] = [p for p in srs["points"] if p["x"] != 2025]
        srs["caveat"] = (srs.get("caveat") or "") + " 2025 (Jan–Sep only, 'over 28,000 tonnes') is left off the chart because it is a part year."
series = [x for x in series if len([p for p in x["points"] if p.get("y") is not None]) >= 2]

tanks = None
for o in geo_d.get("outlines", []):
    if o.get("id") == "mm-ree-tank-grid":
        tanks = {"title": o["title"], "method": o.get("method"), "caveat": o.get("caveat"), "sources": fix_sources(o.get("sources"), km),
                 "cells": [{"node": f["properties"]["node"], "tanks": f["properties"]["tanks"], "first": f["properties"].get("first_obs_year"), "last": f["properties"].get("last_obs_year"),
                            "lon": f["geometry"]["coordinates"][0][0][0], "lat": f["geometry"]["coordinates"][0][0][1]} for f in o["geojson"]["features"]]}

from iter5_exposure import build as build_exposure
exposure = build_exposure(load("r5_exposure.json"), R)

human = {
  "_note": "Iteration 5: human cost data. Incidents and site totals from the incident research; coordinates and footprint series from the geography research; exposure estimator inputs from the exposure research. Built by tools/iter5_human.py.",
  "lead": "These are the people behind the metals: miners buried in landslides in Kachin and Rubaya, smelter workers burned in Morowali, children working in Cerro Rico. Each death below is dated and sourced, and counted once.",
  "caveat": "Every number is a minimum: most deaths at informal mines are never recorded, and some tolls are disputed. These are places in the supply chains this site traces. For most of them the link into fusion is likely or a hypothesis, not proven; each site's case file says which.",
  "incidents": incidents, "siteTotals": site_totals, "coords": coords, "series": series, "tanks": tanks, "exposure": exposure,
}
json.dump(human, open("data/human.json", "w"), indent=2, ensure_ascii=False)
R.save()
print("incidents", len(incidents), "killed", sum(i["killed"] or 0 for i in incidents), "| coords", len(coords), "| series", len(series))
print("problems:", problems[:20], len(problems))
