import { useEffect, useState } from 'react';
import { API } from '../api';

// Site branding (name, logo, accent colour) is managed in Admin → Settings.
// Fetched once per session and shared by the navbar, landing page and footer, so
// changing the brand in the admin panel shows up everywhere without a code change.
const DEFAULT_BRANDING = {
  siteName: 'Newflix',
  logoUrl: '',
  faviconUrl: '',
  accentColor: '#E50914',
  socialLinks: {},
};

let cache = null;
let inflight = null;

const load = () => {
  if (!inflight) {
    inflight = API.get('/settings')
      .then(({ data }) => {
        const s = data?.settings || {};
        const configuredName = String(s.siteName || DEFAULT_BRANDING.siteName).trim();
        cache = {
          siteName: /^streamflix$/i.test(configuredName) ? 'Newflix' : configuredName,
          logoUrl: s.logoUrl || '',
          faviconUrl: s.faviconUrl || '',
          accentColor: s.accentColor || DEFAULT_BRANDING.accentColor,
          socialLinks: s.socialLinks || {},
        };
        return cache;
      })
      .catch(() => DEFAULT_BRANDING);
  }
  return inflight;
};

export default function useBranding() {
  const [branding, setBranding] = useState(cache || DEFAULT_BRANDING);
  useEffect(() => {
    let alive = true;
    load().then((b) => { if (alive) setBranding(b); });
    return () => { alive = false; };
  }, []);
  return branding;
}
