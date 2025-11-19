/**
 * Google Maps Loader Utility
 * สำหรับโหลด Google Maps JavaScript API แบบ shared เพื่อป้องกันการโหลดซ้ำ
 */

let isLoading = false;
let isLoaded = false;
let loadPromise = null;

/**
 * โหลด Google Maps JavaScript API
 * @param {string} apiKey - Google Maps API Key
 * @param {Array<string>} libraries - Libraries ที่ต้องการ (default: ['places'])
 * @returns {Promise} - Promise ที่ resolve เมื่อโหลดเสร็จ
 */
export const loadGoogleMaps = (apiKey, libraries = ['places']) => {
  // ถ้าโหลดเสร็จแล้ว return resolved promise
  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // ถ้ากำลังโหลดอยู่ return promise เดิม
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // เริ่มโหลด
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      // ถ้ามี script อยู่แล้ว รอให้โหลดเสร็จ
      if (window.google && window.google.maps) {
        isLoading = false;
        isLoaded = true;
        resolve();
        return;
      }

      // รอให้ script โหลดเสร็จ
      existingScript.addEventListener('load', () => {
        isLoading = false;
        isLoaded = true;
        resolve();
      });

      existingScript.addEventListener('error', () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps'));
      });

      return;
    }

    // สร้าง script ใหม่
    if (!apiKey) {
      isLoading = false;
      reject(new Error('Google Maps API Key is required'));
      return;
    }

    const script = document.createElement('script');
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&language=th`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoading = false;
      isLoaded = true;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps JavaScript API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * ตรวจสอบว่า Google Maps โหลดเสร็จแล้วหรือยัง
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};

/**
 * รีเซ็ตสถานะ (สำหรับ testing)
 */
export const resetLoader = () => {
  isLoading = false;
  isLoaded = false;
  loadPromise = null;
};

