"""One-off: diff translation SQL key sets."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _parse_sql_tuple(line: str):
    """Parse (id, 'key', 'value', 'group') with SQL '' escape in strings."""
    line = line.strip().rstrip(",").rstrip(";")
    if not (line.startswith("(") and line.endswith(")")):
        return None
    inner = line[1:-1]
    parts = []
    i = 0
    n = len(inner)
    while i < n:
        while i < n and inner[i] in " \t":
            i += 1
        if i >= n:
            break
        if inner[i] == "'":
            i += 1
            buf = []
            while i < n:
                if inner[i] == "'":
                    if i + 1 < n and inner[i + 1] == "'":
                        buf.append("'")
                        i += 2
                        continue
                    i += 1
                    break
                if inner[i] == "\\" and i + 1 < n:
                    buf.append(inner[i + 1])
                    i += 2
                    continue
                buf.append(inner[i])
                i += 1
            parts.append("".join(buf))
        else:
            j = i
            while j < n and inner[j] != ",":
                j += 1
            parts.append(inner[i:j].strip())
            i = j
        while i < n and inner[i] in " ,":
            i += 1
    if len(parts) != 4:
        return None
    try:
        lid = int(parts[0])
    except ValueError:
        return None
    return lid, parts[1], parts[2], parts[3]


def parse_sql(path: Path):
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip().startswith("("):
            continue
        parsed = _parse_sql_tuple(line)
        if parsed:
            rows.append(parsed)
    return {r[1]: r for r in rows}


def main():
    en = parse_sql(ROOT / "translations_en_insert.sql")
    th = parse_sql(ROOT / "translations_th_insert.sql")
    ko = parse_sql(ROOT / "translations_ko_insert.sql")
    en_keys, th_keys, ko_keys = set(en), set(th), set(ko)
    print("EN", len(en_keys), "TH", len(th_keys), "KO", len(ko_keys))
    print("EN not TH", len(en_keys - th_keys))
    for k in sorted(en_keys - th_keys):
        print(" ", k)
    print("EN not KO", len(en_keys - ko_keys))
    for k in sorted(en_keys - ko_keys):
        print(" ", k)
    print("TH not EN", len(th_keys - en_keys))
    for k in sorted(th_keys - en_keys)[:40]:
        print(" ", k)
    print("KO not EN", len(ko_keys - en_keys))
    for k in sorted(ko_keys - en_keys)[:40]:
        print(" ", k)


if __name__ == "__main__":
    main()
