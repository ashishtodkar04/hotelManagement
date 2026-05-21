import axios from 'axios';

export function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return 'https://hotelmanagement-mhlu.onrender.com';
}

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

export default api;
