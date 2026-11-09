"""Source registry helper: add sources by URL without duplicates, returning site ids (S61, S62, ...)."""
import json, re

class Registry:
    def __init__(self, path="data/sources.json"):
        self.path = path
        self.data = json.load(open(path))
        self.by_url = {self._norm(s["url"]): s["id"] for s in self.data["sources"]}
        nums = [int(re.sub(r"\D", "", s["id"]) or 0) for s in self.data["sources"] if s["id"].startswith("S")]
        self.next = max(nums) + 1

    @staticmethod
    def _norm(u):
        return re.sub(r"^https?://(www\.)?", "", (u or "").strip()).rstrip("/").lower()

    def add(self, title, publisher, date, url):
        if not url:
            return None
        if "graph.sayari.com" in url or "docs.sayari.com" in url:
            return "SY"
        k = self._norm(url)
        if k in self.by_url:
            return self.by_url[k]
        sid = f"S{self.next}"; self.next += 1
        self.data["sources"].append({"id": sid, "title": title or url, "publisher": publisher or "", "date": (str(date)[:4] if date else None), "url": url})
        self.by_url[k] = sid
        return sid

    def add_dict(self, d):
        if isinstance(d, str):
            return d if re.match(r"^(S\d+|SY)$", d) else self.add(d, "", None, d)
        return self.add(d.get("title"), d.get("publisher"), d.get("date"), d.get("url"))

    def save(self):
        json.dump(self.data, open(self.path, "w"), indent=2, ensure_ascii=False)
