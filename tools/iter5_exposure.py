"""Iteration 5: exposure estimator data, transcribed from the r5_exposure research (calculations shown)."""
import json, sys
sys.path.insert(0, "tools")
from srcreg import Registry

def build(ex, R):
    km = {s["key"]: R.add(s.get("title"), s.get("publisher"), s.get("date"), s.get("url")) for s in ex.get("new_sources", [])}
    S = lambda *ids: [km.get(i, i) for i in ids]
    tape = "Our calculation from published tape layer thicknesses, assuming 4 mm-wide tape (inferred from SPARC's 1.5 GA-m over 10,000 km)."
    devices = [
      {"id": "sparc", "label": "SPARC-class device (about 10,000 km of tape)",
       "note": "SPARC holds about 10,000 km of REBCO tape. " + tape + " Magnet copper and steel outside the tape are not included.",
       "materials": {
         "yttrium": {"kg": 82, "lo": 0, "hi": 119, "calc": "10,000 km × 8.2 g/km (5.1–11.9) if all tape were yttrium-based; close to 0 if gadolinium/europium-based tape (e.g. Fujikura) is used.", "sources": S("NEW4", "NEW7", "S41")},
         "nickel": {"kg": 10100, "lo": 8100, "hi": 20300, "calc": "10,000 km × 1.01 kg/km (0.81–2.03): 40–100 µm Hastelloy C-276 substrate, 57% nickel.", "sources": S("NEW4", "S41", "NEW7", "NEW9", "NEW9b")},
         "silver": {"kg": 1260, "lo": 840, "hi": 1680, "calc": "10,000 km × 84–168 g/km: 2–3 µm silver cap layers.", "sources": S("NEW4", "NEW7", "S41")},
         "copper-hts": {"kg": 7200, "lo": 200, "hi": 14300, "calc": "10,000 km × 0.02–1.43 kg/km: 20 µm copper plating on one or both faces, or none (tape only).", "sources": S("NEW4", "S41", "NEW8")},
       }},
      {"id": "arc", "label": "ARC-class power plant (10,000–20,000 km of tape)",
       "note": "CFS ordered more than 10,000 km of tape from Fujikura for ARC; reporting puts ARC at about twice SPARC's amp-metres, i.e. up to 20,000 km. " + tape + " Fujikura's tape is gadolinium/europium-based, so ARC's yttrium may be close to zero.",
       "materials": {
         "yttrium": {"kg": 123, "lo": 0, "hi": 238, "calc": "15,000 km (10,000–20,000) × 8.2 g/km (5.1–11.9) for yttrium-based tape; near 0 for the Fujikura order.", "sources": S("S37", "NEW5", "NEW7", "S41")},
         "nickel": {"kg": 15150, "lo": 8100, "hi": 40600, "calc": "10,000–20,000 km × 0.81–2.03 kg/km.", "sources": S("S37", "NEW5", "NEW9")},
         "silver": {"kg": 1890, "lo": 840, "hi": 3360, "calc": "10,000–20,000 km × 84–168 g/km.", "sources": S("S37", "NEW5", "NEW7", "S41")},
         "copper-hts": {"kg": 10800, "lo": 200, "hi": 28600, "calc": "10,000–20,000 km × 0.02–1.43 kg/km (tape only).", "sources": S("S37", "NEW5", "S41")},
       }},
      {"id": "iter", "label": "ITER (wire magnets, divertor and first wall)",
       "note": "ITER used about 500 t of Nb₃Sn strand (half copper by cross-section). The niobium and tin splits inside the non-copper half are assumptions, not published figures. Divertor tungsten counts only the outer vertical targets. Beryllium is the original first-wall design.",
       "materials": {
         "niobium": {"kg": 92500, "lo": 60000, "hi": 125000, "calc": "ASSUMPTION: niobium is 25–50% by weight of the non-copper half of 500 t of strand → 60–125 t.", "sources": S("S25", "S59")},
         "tin": {"kg": 40000, "lo": 25000, "hi": 55000, "calc": "ASSUMPTION: tin is 10–22% by weight of the non-copper half → 25–55 t over 2008–2015.", "sources": S("S25", "S59")},
         "tungsten": {"kg": 25000, "lo": 20000, "hi": 34700, "calc": "About 200,000 outer-target monoblocks of about 30×30×10 mm at 19.25 g/cm³, less the cooling-tube bore.", "sources": S("NEW17", "NEW16")},
         "beryllium": {"kg": 10000, "lo": 8900, "hi": 11100, "calc": "About 600 m² of first-wall panels clad in 8–10 mm beryllium tiles (upper bound).", "sources": S("NEW18", "NEW19")},
       }},
    ]
    # Shares: places with documented harm (severity from the systems map).
    shares = [
      ("yttrium", "Myanmar (Kachin and Shan)", "y-kachin", None, 20, 50, "PROXY: USGS says only that Burma produced 'a significant percentage' of world yttrium in 2025; no measured share exists.", S("S39", "NEW22")),
      ("nickel", "Indonesia", "ni-indonesia", 66.7, None, None, "Mine output 2025 (USGS): 2.6 of 3.9 million t.", S("S100")),
      ("nickel", "Russia (Norilsk)", "ni-nornickel", 5.1, None, None, "Mine output 2025 (USGS).", S("S100")),
      ("silver", "Bolivia", "ag-bolivia", 5.8, None, None, "Mine output 2025 (USGS).", S("S104")),
      ("copper-hts", "Indonesia (Grasberg)", "cu-grasberg", None, 3.1, 4.4, "Mine output 2025 (USGS): 3.1%, down from 4.4% in 2024 after the mine disaster.", S("S103", "S106")),
      ("tin", "Myanmar (Wa State)", "sn-manmaw", None, 4.1, 10, "Mine output 2025 (USGS) 4.1%; higher before the 2023 Wa mining halt.", S("NEW2", "S114")),
      ("tin", "DRC and Rwanda", "sn-greatlakes", 10.9, None, None, "Mine output 2025 (USGS).", S("NEW2")),
      ("niobium", "DRC and Rwanda", "nb-rubaya", None, 1.0, 1.1, "Mine output 2025 (USGS): 1,170 of 112,000 t.", S("S21")),
      ("niobium", "Brazil (CBMM)", "nb-cbmm", 92.9, None, None, "Mine output 2025 (USGS). Harm documented here is legacy pollution, not abuses against people.", S("S21")),
      ("tungsten", "China (southern Jiangxi and elsewhere)", "w-jiangxi", 78.8, None, None, "Mine output 2025 (USGS). Harm documented is soil and rice contamination near mines.", S("S22")),
      ("tungsten", "Vietnam (Nui Phao)", "w-nuiphao", 3.5, None, None, "Mine output 2025 (USGS).", S("S22")),
      ("beryllium", "United States (Utah)", "be-spor", 53.5, None, None, "Mine output 2025 (USGS). Harm documented is workers' chronic beryllium disease.", S("S156")),
    ]
    sh = []
    for mat, place, node, pct, lo, hi, basis, src in shares:
        d = {"material": mat, "place": place, "node": node, "basis": basis, "sources": src}
        if pct is not None: d["pct"] = pct
        else: d["lo"], d["hi"] = lo, hi
        sh.append(d)
    world = {
      "yttrium": {"t": 9850, "basis": "7,900–11,800 t of yttrium (10,000–15,000 t Y₂O₃) mined in 2025; midpoint shown", "sources": S("S39")},
      "nickel": {"t": 3900000, "sources": S("S100")}, "silver": {"t": 26000, "sources": S("S104")},
      "copper-hts": {"t": 23000000, "basis": "mine output", "sources": S("S103")}, "tin": {"t": 290000, "sources": S("NEW2")},
      "niobium": {"t": 112000, "sources": S("S21")}, "tungsten": {"t": 85000, "sources": S("S22")}, "beryllium": {"t": 430, "sources": S("S156")},
    }
    scen = [
      {"id": "low", "label": "Announced flagship machines only: 3 ARC-class plants by 2040", "device": "arc", "plants": 3,
       "note": "Counted, not modelled: CFS's ARC (early 2030s), the UK's STEP (around 2040), China's next machine after BEST.", "sources": S("NEW11", "S37", "NEW23", "NEW24")},
      {"id": "claims", "label": "Every company hits its stated date: about 35 pilot plants by 2035", "device": "arc", "plants": 35,
       "note": "35 of 45 companies told the IAEA's 2025 survey they expect a pilot plant in 2030–2035. Treating all as ARC-class overstates it, since not all use HTS magnets.", "sources": S("NEW12", "NEW11", "NEW13")},
      {"id": "high", "label": "Aspirational: 1,500 one-gigawatt plants by 2050 (20% of world power)", "device": "arc", "plants": 1500,
       "note": "Upper bound from a commentary estimate; larger plants may need more tape than ARC.", "sources": S("NEW14")},
    ]
    return {
      "intro": "Fusion uses very little of any of these metals. Even 1,500 power plants would use well under 1% of most markets, so fusion does not drive more mining. Its exposure is about where its slice comes from. Choose what is being built to see how much of each material it needs, and how much of that could come from places where harm is documented if fusion bought at the world average.",
      "method": ex["method_note"],
      "devices": devices, "shares": sh, "world": world, "scenarios": scen,
    }

if __name__ == "__main__":
    R = Registry()
    ex = json.load(open(sys.argv[1]))
    out = build(ex, R)
    json.dump(out, open(sys.argv[2], "w"), indent=2, ensure_ascii=False)
    R.save()
    print("ok")
