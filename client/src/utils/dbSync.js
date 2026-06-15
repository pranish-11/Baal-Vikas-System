import { API_BASE } from '../config';

function getToken() {
  return localStorage.getItem('axion_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function syncBlobToDB(key, data) {
  return apiFetch(`/data/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function loadBlobFromDB(key) {
  const result = await apiFetch(`/data/${encodeURIComponent(key)}`);
  return result?.data ?? null;
}

export async function syncAllFromDB() {
  const keys = [
    'axion_behaviour_entries',
    'axion_attendance',
    'axion_deleted_conversations',
    'axion_teacher_tags',
    'axion_class_list',
    'axion_teacher_classrooms',
    'axion_announcements',
    'axion_awarded_rewards',
    'axion_camera_order',
    'axion_student_avatars',
    'axion_file_data',
    'axion_saved_profiles',
    'axion_daily_logs',
    'axion_read_notifs',
    'axion_messages',
    'axion_students_cache',
    'axion_complaints',
    'axion_activities',
  ];
  let restored = 0;
  for (const key of keys) {
    const data = await loadBlobFromDB(key);
    if (data !== null) {
      try {
        localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
        restored++;
      } catch {}
    }
  }
  return restored;
}

export async function syncAllToDB() {
  const keys = [
    'axion_behaviour_entries',
    'axion_attendance',
    'axion_deleted_conversations',
    'axion_teacher_tags',
    'axion_class_list',
    'axion_teacher_classrooms',
    'axion_announcements',
    'axion_awarded_rewards',
    'axion_camera_order',
    'axion_student_avatars',
    'axion_file_data',
    'axion_saved_profiles',
    'axion_daily_logs',
    'axion_read_notifs',
    'axion_messages',
    'axion_students_cache',
    'axion_complaints',
    'axion_activities',
  ];
  let synced = 0;
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const data = JSON.parse(raw);
        await syncBlobToDB(key, data);
        synced++;
      }
    } catch {}
  }
  return synced;
}

let syncQueue = {};
let syncTimer = null;

export function queueSyncToDB(key, data) {
  syncQueue[key] = data;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const batch = { ...syncQueue };
    syncQueue = {};
    syncTimer = null;
    for (const [k, v] of Object.entries(batch)) {
      await syncBlobToDB(k, v).catch(() => {});
    }
  }, 2000);
}
