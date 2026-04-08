"""Find translate('key') in frontend not present in translations_en_insert.sql."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
from diff_translations import parse_sql

en = parse_sql(ROOT / "translations_en_insert.sql")
en_keys = set(en)

pat = re.compile(r"translate\s*\(\s*['\"]([a-zA-Z0-9_.]+)['\"]")

found = set()
for ext in ("*.jsx", "*.js", "*.tsx", "*.ts"):
    for p in (ROOT / "frontend" / "src").rglob(ext):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for m in pat.finditer(text):
            found.add(m.group(1))

missing = sorted(found - en_keys)
print("translate() keys in frontend:", len(found))
print("Missing from EN SQL:", len(missing))
for k in missing:
    print(" ", k)
