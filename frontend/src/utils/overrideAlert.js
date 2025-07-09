// Override default browser alert with toast popup
// ใช้ toast จาก useNotification เพื่อแสดง popup สวยงาม

/* eslint-disable no-alert */

if (typeof window !== 'undefined') {
  window.alert = (message = '') => {
    // ลบ modal เดิมถ้ามี
    const existing = document.getElementById('global-alert-modal');
    if (existing) existing.remove();

    // สร้าง overlay
    const overlay = document.createElement('div');
    overlay.id = 'global-alert-modal';
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]';

    // สร้างกล่องข้อความ
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center';

    const textEl = document.createElement('p');
    textEl.className = 'text-secondary-700 mb-6 break-words';
    textEl.textContent = String(message);

    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 bg-primary-600 text-white rounded-lg w-full hover:bg-primary-700 transition-colors';
    btn.textContent = 'OK';

    btn.addEventListener('click', () => {
      overlay.remove();
    });

    modal.appendChild(textEl);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  };
} 