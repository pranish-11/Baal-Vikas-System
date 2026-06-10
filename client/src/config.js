// Central config — driven by .env so you only change one place for different environments.
// When deploying, set VITE_API_BASE and VITE_SOCKET_URL in your .env file.

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8011/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8011';
