/**
 * syncManager.js
 * จัดการ offline sync:
 *  1. ตรวจว่า server มีข้อมูลใหม่ไหม (via /api/sync-status/)
 *  2. ถ้ามี → ดึงข้อมูลทั้งหมดและบันทึกลง IndexedDB
 *  3. Cache รูปภาพ venue/restaurant ผ่าน Cache API
 *  4. Expose ฟังก์ชัน loadOfflineData() สำหรับอ่านข้อมูลออฟไลน์
 */

import { API_CONFIG } from '../config/api.js';
import {
  getSyncMeta,
  setSyncMeta,
  bulkPutVenues,
  bulkPutRestaurants,
  bulkPutCategories,
  bulkPutCountries,
  bulkPutCities,
  getAllVenues,
  getAllRestaurants,
  getAllCategories,
  getAllCountries,
  getAllCities,
} from './offlineDB.js';

const BASE = API_CONFIG.BASE_URL;
const IMAGE_CACHE = 'asean-mall-images-v1';

// ---------- helpers ----------

function fetchJSON(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString(), { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
    return r.json();
  });
}

/** ดึง array ทั้งหมดจาก paginated endpoint */
async function fetchAll(path, extraParams = {}) {
  const results = [];
  let page = 1;
  while (true) {
    const data = await fetchJSON(path, { ...extraParams, page, page_size: 500 });
    const items = Array.isArray(data) ? data : data.results || [];
    results.push(...items);
    if (!data.next || items.length === 0) break;
    page++;
  }
  return results;
}

/** Cache รูปภาพใน Cache API */
async function cacheImages(urls) {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const uncached = [];
    for (const url of urls) {
      if (!url) continue;
      const hit = await cache.match(url);
      if (!hit) uncached.push(url);
    }
    // ดาวน์โหลดเป็น batch เพื่อไม่ overwhelm network
    const BATCH = 10;
    for (let i = 0; i < uncached.length; i += BATCH) {
      const batch = uncached.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map((url) =>
          fetch(url, { mode: 'no-cors' })
            .then((res) => cache.put(url, res))
            .catch(() => {})
        )
      );
    }
  } catch (e) {
    console.warn('syncManager: image cache failed', e);
  }
}

// ---------- Public API ----------

/**
 * checkAndSync()
 * เรียกเมื่อ app โหลดขึ้นมาและมีเน็ต
 * - ถ้า version ต่างจากที่ cache → sync ใหม่ทั้งหมด
 * - ถ้า version เดิม → ไม่ทำอะไร
 * @returns {boolean} true = sync'd, false = already up-to-date
 */
export async function checkAndSync() {
  if (!navigator.onLine) return false;

  let serverStatus;
  try {
    serverStatus = await fetchJSON('/sync-status/');
  } catch (e) {
    console.warn('syncManager: cannot reach sync-status', e);
    return false;
  }

  const meta = await getSyncMeta();
  if (meta?.version === serverStatus.version) {
    return false; // ข้อมูลเป็นปัจจุบันอยู่แล้ว
  }

  // ---- sync ข้อมูลทั้งหมดพร้อมกัน ----
  const [venues, restaurants, categories, countries, cities] = await Promise.all([
    fetchAll('/entertainment-venues/', { page_size: 500 }),
    fetchAll('/restaurants/', { page_size: 500 }),
    fetchAll('/venue-categories/', { page_size: 500 }),
    fetchAll('/countries/', { page_size: 500 }),
    fetchAll('/cities/', { page_size: 500 }),
  ]);

  await Promise.all([
    bulkPutVenues(venues),
    bulkPutRestaurants(restaurants),
    bulkPutCategories(categories),
    bulkPutCountries(countries),
    bulkPutCities(cities),
  ]);

  // ---- cache รูปภาพ ----
  const imageUrls = [
    ...venues.map((v) => v.image_display_url).filter(Boolean),
    ...restaurants.map((r) => r.image_display_url).filter(Boolean),
  ];
  // ไม่รอ image caching เพื่อไม่ block UI
  cacheImages(imageUrls).catch(() => {});

  await setSyncMeta({
    version: serverStatus.version,
    syncedAt: new Date().toISOString(),
  });

  return true;
}

/**
 * loadOfflineData()
 * โหลดข้อมูลทั้งหมดจาก IndexedDB
 * ใช้เมื่อ offline หรือเมื่อต้องการแสดง data ก่อน API response
 */
export async function loadOfflineData() {
  const [venues, restaurants, categories, countries, cities] = await Promise.all([
    getAllVenues(),
    getAllRestaurants(),
    getAllCategories(),
    getAllCountries(),
    getAllCities(),
  ]);
  return { venues, restaurants, categories, countries, cities };
}

/**
 * hasOfflineData()
 * ตรวจว่ามีข้อมูล offline อยู่ไหม
 */
export async function hasOfflineData() {
  const meta = await getSyncMeta();
  return !!meta?.version;
}

/**
 * checkHasNewVersion()
 * เปรียบเทียบ version ใน server กับที่ cache ไว้
 * @returns {boolean} true = มีข้อมูลใหม่ (ควรแสดงปุ่ม), false = ไม่มี / ไม่มีเน็ต
 */
export async function checkHasNewVersion() {
  if (!navigator.onLine) return false;
  try {
    const serverStatus = await fetchJSON('/sync-status/');
    const meta = await getSyncMeta();
    // ยังไม่เคย download → ถือว่า "มีข้อมูลใหม่" (ให้แสดงปุ่ม)
    if (!meta?.version) return true;
    return meta.version !== serverStatus.version;
  } catch {
    return false;
  }
}

/**
 * getLastSyncedAt()
 * คืนเวลาที่ sync ล่าสุด
 */
export async function getLastSyncedAt() {
  const meta = await getSyncMeta();
  return meta?.syncedAt || null;
}
