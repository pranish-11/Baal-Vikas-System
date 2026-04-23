import axios from 'axios';

const instance = axios.create({
  baseURL: '',
});

instance.interceptors.request.use((config) => {
  const raw = localStorage.getItem('axion_user');
  if (raw) {
    try {
      const u = JSON.parse(raw);
      if (u?.token) {
        config.headers.Authorization = `Bearer ${u.token}`;
      }
    } catch {
      /* ignore */
    }
  }
  return config;
});

export default instance;
