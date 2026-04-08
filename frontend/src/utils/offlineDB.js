/**
 * offlineDB.js
 * IndexedDB wrapper สำหรับ offline storage
 * ใช้ library `idb` เพื่อ API แบบ Promise
 */
import { openDB } from 'idb';

const DB_NAME = 'asean-mall-offline';
const DB_VERSION = 1;

const STORES = {
  META: 'meta',
  VENUES: 'venues',
  RESTAURANTS: 'restaurants',
  CATEGORIES: 'venue_categories',
  COUNTRIES: 'countries',
  CITIES: 'cities',
};

let _db = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
      if (!db.objectStoreNames.contains(STORES.VENUES)) {
        const s = db.createObjectStore(STORES.VENUES, { keyPath: 'venue_id' });
        s.createIndex('by_country', 'country');
        s.createIndex('by_city', 'city');
      }
      if (!db.objectStoreNames.contains(STORES.RESTAURANTS)) {
        const s = db.createObjectStore(STORES.RESTAURANTS, { keyPath: 'restaurant_id' });
        s.createIndex('by_country', 'country');
        s.createIndex('by_city', 'city');
      }
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'category_id' });
      }
      if (!db.objectStoreNames.contains(STORES.COUNTRIES)) {
        db.createObjectStore(STORES.COUNTRIES, { keyPath: 'country_id' });
      }
      if (!db.objectStoreNames.contains(STORES.CITIES)) {
        const s = db.createObjectStore(STORES.CITIES, { keyPath: 'city_id' });
        s.createIndex('by_country', 'country');
      }
    },
  });
  return _db;
}

// ---------- Meta (version & sync timestamp) ----------

export async function getSyncMeta() {
  const db = await getDB();
  return db.get(STORES.META, 'sync') || null;
}

export async function setSyncMeta(meta) {
  const db = await getDB();
  return db.put(STORES.META, meta, 'sync');
}

// ---------- Bulk write ----------

export async function bulkPutVenues(items) {
  const db = await getDB();
  const tx = db.transaction(STORES.VENUES, 'readwrite');
  await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
}

export async function bulkPutRestaurants(items) {
  const db = await getDB();
  const tx = db.transaction(STORES.RESTAURANTS, 'readwrite');
  await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
}

export async function bulkPutCategories(items) {
  const db = await getDB();
  const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
  await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
}

export async function bulkPutCountries(items) {
  const db = await getDB();
  const tx = db.transaction(STORES.COUNTRIES, 'readwrite');
  await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
}

export async function bulkPutCities(items) {
  const db = await getDB();
  const tx = db.transaction(STORES.CITIES, 'readwrite');
  await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
}

// ---------- Reads ----------

export async function getAllVenues() {
  const db = await getDB();
  return db.getAll(STORES.VENUES);
}

export async function getAllRestaurants() {
  const db = await getDB();
  return db.getAll(STORES.RESTAURANTS);
}

export async function getAllCategories() {
  const db = await getDB();
  return db.getAll(STORES.CATEGORIES);
}

export async function getAllCountries() {
  const db = await getDB();
  return db.getAll(STORES.COUNTRIES);
}

export async function getAllCities() {
  const db = await getDB();
  return db.getAll(STORES.CITIES);
}

// ---------- Clear all (reset) ----------

export async function clearAllStores() {
  const db = await getDB();
  const tx = db.transaction(
    [STORES.VENUES, STORES.RESTAURANTS, STORES.CATEGORIES, STORES.COUNTRIES, STORES.CITIES, STORES.META],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore(STORES.VENUES).clear(),
    tx.objectStore(STORES.RESTAURANTS).clear(),
    tx.objectStore(STORES.CATEGORIES).clear(),
    tx.objectStore(STORES.COUNTRIES).clear(),
    tx.objectStore(STORES.CITIES).clear(),
    tx.objectStore(STORES.META).clear(),
    tx.done,
  ]);
}
