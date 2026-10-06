import axios from 'axios';

// Kept as a named constant so a plain fetch() can reach the same mount point as
// the axios instance. The speed test needs fetch, not axios: it measures a
// STREAMING response, and axios would buffer the whole body before resolving —
// which would time the buffer, not the transfer.
const apiOrigin = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
export const API_BASE = apiOrigin ? `${apiOrigin}/api` : '/api';

export const API = axios.create({ baseURL: API_BASE, withCredentials: true });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const pid = localStorage.getItem('sf_profile');
  if (pid) config.headers['x-profile-id'] = pid;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    // A request marked `softFail: true` is an ENHANCEMENT, not part of the page's
    // contract. The hover card's trailer lookup is the canonical case: it fires on
    // every hover, the endpoint answers 502 whenever a title has no usable teaser, and
    // a dropped connection or a restarting backend fails it too. None of that should
    // blank the whole app, so those calls opt out of the fatal screen and simply fall
    // back to the artwork.
    const soft = Boolean(original?.softFail);
    if (typeof window !== 'undefined' && !soft && (!err.response || err.response.status >= 500)) {
      window.dispatchEvent(new CustomEvent('app-fatal-error', {
        detail: { message: err.response?.data?.message || 'The service is temporarily unavailable' },
      }));
    }
    // Access token expired → try silent refresh, then replay request
    if (err.response?.status === 401 && original && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        const { data } = await API.post('/auth/refresh');
        localStorage.setItem('sf_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch {
        localStorage.removeItem('sf_token');
      }
    }
    return Promise.reject(err);
  }
);
