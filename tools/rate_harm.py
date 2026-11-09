"""Apply the author's harm-rating rule to every stage in data/chains.json.

Rule (author, iteration 3):
  - Severe (rating.harm = "high") if three or more sources document harm at the stage,
    OR if the documented harm is extreme: forced labour, child labour, or any crime
    against people (killings, violence against civilians, sexual violence, trafficking,
    armed-group abuses, forced displacement). One source is enough for extreme harm.
  - Moderate if one or two sources document harm.
  - Stages with no documented harm are left as "unknown" (shown as "No documented harm").

Input per stage: stage["harm"] = {
    "documented": [source ids that DOCUMENT harm at this stage; Sayari "SY" never counts],
    "types": ["deaths", "forced labour", ...],
    "extreme": true/false,
    "extremeBasis": "which source shows the extreme harm, and how"
}
The script writes rating.harm and harm.reason (shown on the site under each stage).
Run: python3 tools/rate_harm.py
"""
import json

def label_list(items):
    items = list(items)
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + " and " + items[-1]

def rate(stage):
    h = stage.get("harm")
    if not h:
        stage["rating"]["harm"] = "unknown"
        return
    docs = sorted({s for s in h.get("documented", []) if s != "SY"})
    n = len(docs)
    plural = "source" if n == 1 else "sources"
    if h.get("extreme") and n >= 1:
        stage["rating"]["harm"] = "high"
        h["reason"] = f"Rated severe: {label_list(h.get('extremeTypes') or h.get('types', []))} documented ({n} {plural})."
    elif n >= 3:
        stage["rating"]["harm"] = "high"
        h["reason"] = f"Rated severe: harm documented by {n} sources."
    elif n >= 1:
        stage["rating"]["harm"] = "moderate"
        h["reason"] = f"Rated moderate: harm documented by {n} {plural}."
    else:
        stage["rating"]["harm"] = "unknown"
        h.pop("reason", None)

def walk(material):
    for st in material.get("stages", []):
        rate(st)
    for r in material.get("routes", []):
        for st in r["stages"]:
            rate(st)

if __name__ == "__main__":
    c = json.load(open("data/chains.json"))
    for m in c["materials"].values():
        walk(m)
    json.dump(c, open("data/chains.json", "w"), indent=2, ensure_ascii=False)
    for k, m in c["materials"].items():
        rs = [st["rating"]["harm"] for st in m.get("stages", [])] + [st["rating"]["harm"] for r in m.get("routes", []) for st in r["stages"]]
        print(k, rs)
