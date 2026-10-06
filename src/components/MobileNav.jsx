import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useIsMobile from '../hooks/useIsMobile';
import { useSiteTranslation } from '../utils/siteTranslation';

// The Netflix phone tab bar — the four destinations the real app puts along the
// bottom edge: Home, New & Hot, My List, Search.
//
// It exists because the desktop navbar cannot survive a phone. Those pills need
// a 16px font and a row of hover states, and under 768px they were hidden behind
// a hamburger — one extra tap to reach anything at all. Netflix's answer is a
// persistent bottom bar carrying the four things a viewer actually opens the app
// for, each one a single thumb tap from anywhere.
const Icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3z" />
    </svg>
  ),
  hot: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2S14.8 6.5 14.8 9c0-1.7 1.3-4.4 3.4-5.6-.4 2.3.3 4.6 1.6 6.7A9.7 9.7 0 0 1 22 15a10 10 0 1 1-20 0c0-3.7 2-6.9 5-8.6-.2 1.8.3 3.6 1.5 5C8.9 8 10.5 4.4 13.5 2z" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.9 15.5a7 7 0 1 1 1.4-1.4l4.3 4.3-1.4 1.4-4.3-4.3zM15.5 10a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0z" />
    </svg>
  ),
};

const TABS = [
  { to: '/browse', label: 'Home', icon: Icons.home },
  { to: '/browse/new', label: 'New & Hot', icon: Icons.hot },
  { to: '/my-list', label: 'My List', icon: Icons.list },
  { to: '/search', label: 'Search', icon: Icons.search },
];

// /browse/new is a static route that outranks /browse/:filter, so it has to be
// excluded from the plain /browse prefix — otherwise "New & Hot" lights up on the
// home page as well and two tabs are active at once. Everything else is
// prefix-matched so a deep category page (/browse/series) still lights Home.
const isActive = (pathname, to) => {
  if (to === '/browse') {
    return pathname === '/browse'
      || (pathname.startsWith('/browse/') && !pathname.startsWith('/browse/new'));
  }
  return pathname.startsWith(to);
};

export default function MobileNav() {
  const t = useSiteTranslation();
  const loc = useLocation();
  const { activeProfile } = useAuth();
  const isMobile = useIsMobile();

  // Off the phone there is no bar; with no profile there is nothing to browse
  // (that gate is what sends a new member to /profiles).
  if (!isMobile || !activeProfile) return null;

  // The player is fullscreen video — Netflix hides the bar while it is open.
  if (loc.pathname.startsWith('/watch/')) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {TABS.map((tab) => {
        const active = isActive(loc.pathname, tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon}
            <span>{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
