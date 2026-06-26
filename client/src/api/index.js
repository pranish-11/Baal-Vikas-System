import { API_BASE } from '../config';

export async function requestJSON(url, options = {}) {
  const token = localStorage.getItem('axion_token');
  if (token) {
    options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  }
  const res = await fetch(url, options);
  let data = {};
  try { data = await res.json(); } catch { data = { error: await res.text().catch(() => '') || `Request failed (${res.status})` }; }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

async function safeFetch(url) {
  try {
    const data = await requestJSON(url);
    return data.items || [];
  } catch {
    return null;
  }
}

async function safeFetchRaw(url) {
  try {
    return await requestJSON(url);
  } catch {
    return null;
  }
}

export async function fetchAllData() {
  const results = await Promise.allSettled([
    safeFetch(`${API_BASE}/messages`),
    safeFetch(`${API_BASE}/complaints`),
    safeFetch(`${API_BASE}/students`),
    safeFetch(`${API_BASE}/activities`),
    safeFetchRaw(`${API_BASE}/attendance?date=${new Date().toISOString().slice(0, 10)}`),
  ]);
  const [msgs, comps, studs, acts, att] = results.map(r => r.value);
  const allNull = results.every(r => r.value === null);
  if (allNull) throw new Error('Backend unreachable or auth failed');
  return {
    messages: msgs,
    complaints: comps,
    students: studs,
    activities: acts,
    attendance: att,
  };
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(name, email, password, role) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}
