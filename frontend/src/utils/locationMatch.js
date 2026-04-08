/**
 * จับคู่ชื่อจาก Nominatim กับรายการประเทศ/เมืองในระบบ
 * (ไทย/อังกฤษไม่ตรงกัน, Nominatim มักใส่เขต/อำเภอใน suburb แทน city)
 */

export function normalizeLocationString(s) {
  if (s == null || typeof s !== 'string') return '';
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** ลำดับความเฉพาะ: ย่าน/อำเภอ → เทศบาล/เมือง → จังหวัด */
const NOMINATIM_LOCALITY_KEY_ORDER = [
  'neighbourhood',
  'quarter',
  'suburb',
  'city_district',
  'district',
  'borough',
  'village',
  'hamlet',
  'town',
  'municipality',
  'city',
  'county',
  'state_district',
  'state',
  'region',
];

/**
 * ดึงข้อความจาก address object ของ Nominatim เป็นลำดับ candidate (ไม่ซ้ำ)
 * @param {Record<string, unknown>} a - data.address
 * @returns {string[]}
 */
export function buildLocationCandidatesFromNominatimAddress(a) {
  if (!a || typeof a !== 'object') return [];
  const seen = new Set();
  const out = [];
  const push = (raw) => {
    if (raw == null || typeof raw !== 'string') return;
    const t = raw.trim();
    if (!t) return;
    const n = normalizeLocationString(t);
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(t);
  };
  for (const key of NOMINATIM_LOCALITY_KEY_ORDER) {
    push(a[key]);
  }
  return out;
}

/**
 * เติม candidate จาก display_name (ส่วนหน้า = ย่าน/อำเภอมักตรงกับชื่อใน DB)
 */
export function mergeDisplayNameCandidates(displayName, existing) {
  const base = Array.isArray(existing) ? [...existing] : [];
  if (!displayName || typeof displayName !== 'string') return base;
  const seen = new Set(base.map((s) => normalizeLocationString(s)));
  const parts = displayName.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(8, parts.length); i++) {
    const n = normalizeLocationString(parts[i]);
    if (n && !seen.has(n)) {
      seen.add(n);
      base.push(parts[i]);
    }
  }
  return base;
}

/** ตัดคำท้ายที่ทำให้ชื่อไม่ตรงกับ DB */
function stripAdminNoise(norm) {
  if (!norm) return '';
  let x = norm;
  x = x.replace(
    /\b(province|changwat|amphoe|district|khet|khwaeng|special administrative area|metropolitan|region|city municipality|prefecture)\b/gi,
    ' '
  );
  x = x.replace(/\s+/g, ' ').trim();
  return x;
}

function scoreNamePair(cityNorm, candNorm) {
  const cn = stripAdminNoise(cityNorm);
  const cd = stripAdminNoise(candNorm);
  if (!cn || !cd) return 0;
  if (cn === cd) return 100000 + cn.length;
  if (cd.includes(cn)) return 80000 + cn.length * 100;
  if (cn.includes(cd) && cd.length >= 2) return 60000 + cd.length * 100;

  const tokens = cd.split(/[\s,/]+/).filter((t) => t.length >= 2);
  let best = 0;
  for (const t of tokens) {
    if (t === cn) best = Math.max(best, 45000 + t.length * 50);
    else if (cn.includes(t) && t.length >= 2) best = Math.max(best, 30000 + t.length * 40);
    else if (t.includes(cn) && cn.length >= 2) best = Math.max(best, 25000 + cn.length * 35);
  }
  return best;
}

function pickBestCityForCandidate(citiesInCountry, candRaw) {
  const candNorm = normalizeLocationString(candRaw);
  if (!candNorm) return { city: null, score: 0 };
  let bestCity = null;
  let bestScore = -1;
  for (const city of citiesInCountry) {
    const cn = normalizeLocationString(city.name);
    if (!cn) continue;
    const sc = scoreNamePair(cn, candNorm);
    if (
      sc > bestScore ||
      (sc === bestScore && bestCity && cn.length > normalizeLocationString(bestCity.name).length)
    ) {
      bestScore = sc;
      bestCity = city;
    }
  }
  return { city: bestCity, score: bestScore };
}

/** รหัส ISO2 → คำค้นภาษาอังกฤษที่มักปรากฏในชื่อประเทศใน DB */
const ISO_COUNTRY_HINTS = {
  TH: ['thailand', 'thai'],
  KR: ['korea', 'republic of korea', 'south korea'],
  US: ['united states', 'usa', 'america'],
  JP: ['japan'],
  MY: ['malaysia'],
  SG: ['singapore'],
  VN: ['vietnam'],
  LA: ['lao', 'laos'],
  KH: ['cambodia'],
  MM: ['myanmar', 'burma'],
  PH: ['philippines'],
  ID: ['indonesia'],
  CN: ['china'],
  TW: ['taiwan'],
  HK: ['hong kong'],
  MO: ['macau'],
};

/**
 * @param {Array<{ country_id: number, name: string }>} countries
 * @param {{ country: string, country_code: string }} addressParts
 * @returns {string} country_id เป็นสตริง
 */
export function matchCountryId(countries, addressParts) {
  if (!countries?.length) return '';
  const nc = normalizeLocationString(addressParts.country);
  const code = (addressParts.country_code || '').toUpperCase();

  for (const c of countries) {
    const cn = normalizeLocationString(c.name);
    if (!cn) continue;
    if (cn === nc || (nc && (nc.includes(cn) || cn.includes(nc)))) {
      return String(c.country_id);
    }
  }

  const hints = code ? ISO_COUNTRY_HINTS[code] : null;
  if (hints) {
    for (const c of countries) {
      const cn = normalizeLocationString(c.name);
      if (!cn) continue;
      for (const hint of hints) {
        if (cn.includes(hint) || hint.includes(cn)) {
          return String(c.country_id);
        }
      }
    }
  }

  return String(countries[0].country_id);
}

/**
 * @param {Array<{ city_id: number, name: string, country: number }>} citiesInCountry
 * @param {{ allCandidates?: string[], city?: string, state?: string }} addressParts
 */
export function matchCityId(citiesInCountry, addressParts) {
  if (!citiesInCountry?.length) return '';

  let candidates = [];
  if (Array.isArray(addressParts.allCandidates) && addressParts.allCandidates.length) {
    candidates = [...addressParts.allCandidates];
  } else {
    candidates = [addressParts.city, addressParts.state].filter(Boolean);
  }

  const MIN_CONFIDENT = 30000;
  const MIN_WEAK = 8000;

  for (const candRaw of candidates) {
    const { city, score } = pickBestCityForCandidate(citiesInCountry, candRaw);
    if (city && score >= MIN_CONFIDENT) {
      return String(city.city_id);
    }
  }

  for (const candRaw of candidates) {
    const { city, score } = pickBestCityForCandidate(citiesInCountry, candRaw);
    if (city && score >= MIN_WEAK) {
      return String(city.city_id);
    }
  }

  let bestCity = null;
  let bestScore = 0;
  for (const city of citiesInCountry) {
    const cn = normalizeLocationString(city.name);
    if (!cn) continue;
    let maxForCity = 0;
    for (const candRaw of candidates) {
      const candNorm = normalizeLocationString(candRaw);
      maxForCity = Math.max(maxForCity, scoreNamePair(cn, candNorm));
    }
    if (maxForCity > bestScore) {
      bestScore = maxForCity;
      bestCity = city;
    }
  }

  if (bestCity && bestScore > 0) {
    return String(bestCity.city_id);
  }

  return String(citiesInCountry[0].city_id);
}
