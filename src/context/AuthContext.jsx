import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API } from '../api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_profile_obj')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const selectProfile = useCallback((p) => {
    if (!p) { localStorage.removeItem('sf_profile'); localStorage.removeItem('sf_profile_obj'); }
    else { localStorage.setItem('sf_profile', p._id); localStorage.setItem('sf_profile_obj', JSON.stringify(p)); }
    setActiveProfile(p);
  }, []);

  const loadMe = useCallback(async () => {
    if (!localStorage.getItem('sf_token')) { setLoading(false); return; }
    try {
      const { data } = await API.get('/auth/me');
      setUser(data.user);
      setProfiles(data.profiles);
      // keep active profile in sync with server data
      if (activeProfile) {
        const fresh = data.profiles.find((p) => p._id === activeProfile._id);
        if (fresh) selectProfile(fresh);
        else selectProfile(null);
      }
    } catch {
      localStorage.removeItem('sf_token');
      setUser(null);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback((token, userData) => {
    localStorage.setItem('sf_token', token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await API.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_profile');
    localStorage.removeItem('sf_profile_obj');
    setUser(null); setProfiles([]); setActiveProfile(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, profiles, activeProfile, selectProfile, loading, login, logout, loadMe }}>
      {children}
    </AuthCtx.Provider>
  );
}
