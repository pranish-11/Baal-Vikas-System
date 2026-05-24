const API_BASE = 'http://127.0.0.1:8011/api';

export async function requestJSON(url, options = {}) {
  const token = localStorage.getItem('axion_token');
  if (token) {
    options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
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

export async function fetchAllData() {
  const results = await Promise.allSettled([
    safeFetch(`${API_BASE}/messages`),
    safeFetch(`${API_BASE}/complaints`),
    safeFetch(`${API_BASE}/students`),
    safeFetch(`${API_BASE}/schools`),
    safeFetch(`${API_BASE}/activities`),
    safeFetch(`${API_BASE}/fees`),
  ]);
  const [msgs, comps, studs, schs, acts, fees] = results.map(r => r.value);
  const allNull = results.every(r => r.value === null);
  if (allNull) throw new Error('Backend unreachable or auth failed');
  return {
    messages: msgs,
    complaints: comps,
    students: studs,
    schools: schs,
    activities: acts,
    fees,
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
