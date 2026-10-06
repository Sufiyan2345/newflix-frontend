import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import { API } from '../api';
import { useSiteTranslation } from '../utils/siteTranslation';
import {
  IconSearch, IconUsers, IconApps, IconBell, IconCaret, IconClose, IconAudio,
  IconHomeLine, IconTvLine, IconFilmLine, IconSparklesLine, IconBookmarkLine,
  IconGlobeLine, IconActivityLine, IconSettings, IconTransferLine, IconLogoutLine,
} from './Icons';

// Netflix-style primary navigation (design reference: pills + apps grid + bell + avatar)
// `tour` is the hook the first-login walkthrough highlights. It lives here rather
// than as a CSS selector inside the tour so the tour cannot break when a class
// name changes, and a step with no visible target (the pills are display:none
// under 768px) is skipped automatically.
const NAV = [
  { to: '/browse', label: 'Home', end: true, tour: 'home', icon: IconHomeLine },
  { to: '/browse/series', label: 'TV Shows', tour: 'tv', icon: IconTvLine },
  { to: '/browse/movies', label: 'Movies', tour: 'movies', icon: IconFilmLine },
  { to: '/browse/new', label: 'New & Popular', tour: 'new', icon: IconSparklesLine },
  { to: '/my-list', label: 'My List', tour: 'list', icon: IconBookmarkLine },
  { to: '/browse/tmdb-languages', label: 'Browse by Languages', tour: 'langs', icon: IconGlobeLine },
];

export default function Navbar() {
  const t = useSiteTranslation();
  const nav = useNavigate();
  const loc = useLocation();
  const { user, profiles, activeProfile, selectProfile, logout } = useAuth();
  const branding = useBranding();
  const searchRef = useRef(null);
  const navLinksRef = useRef(null);
  const navIndicatorRef = useRef(null);
  const lastNavRef = useRef(null); // query we navigated with ourselves (skips URL→input sync)
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [genresReady, setGenresReady] = useState(false);
  const [notifs, setNotifs] = useState({ items: [], unread: 0 });
  const urlQ = new URLSearchParams(loc.search).get('q') || '';
  // The box mirrors the URL on the results page: it comes pre-filled and open
  // when the user lands on /search (Netflix keeps it open while searching).
  const [q, setQ] = useState(loc.pathname === '/search' ? urlQ : '');
  const [searchOpen, setSearchOpen] = useState(loc.pathname === '/search');

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 70); // Netflix switches at ~70px
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) API.get('/user/notifications').then(({ data }) => setNotifs(data)).catch(() => {});
  }, [user, loc.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // The apps grid lists the real genre catalogue. If the admin hasn't created any
  // local genres yet, fall back to the 16 live TMDB categories — the exact same
  // slugs the Explore page filters by — so "Horror", "Comedies", "Korean Dramas"…
  // are always one click away instead of an empty menu.
  useEffect(() => {
    if (!appsOpen || genres.length) return;
    API.get('/genres')
      .then(({ data }) => {
        const local = (data.items || []).map((g) => ({ _id: g._id, name: g.name, slug: g.slug }));
        if (local.length) { setGenres(local); setGenresReady(true); return null; }
        return API.get('/tmdb/genre-cards')
          .then(({ data: d }) => { setGenres(d.items || []); setGenresReady(true); })
          .catch(() => setGenresReady(true));
      })
      .catch(() => setGenresReady(true));
  }, [appsOpen, genres.length]);

  // Close every floating panel on route change; the search box stays open on /search.
  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    setBellOpen(false);
    setAppsOpen(false);
    setSearchOpen(loc.pathname === '/search');
  }, [loc.pathname]);

  const doSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    lastNavRef.current = term;
    nav(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  // Netflix-style live search: typing updates the results page itself — no
  // dropdown. Debounced so the page doesn't reload on every keystroke.
  useEffect(() => {
    if (!searchOpen) return undefined;
    const term = q.trim();
    if (!term && loc.pathname !== '/search') return undefined; // empty box elsewhere → nothing to do
    if (loc.pathname === '/search' && urlQ === term) return undefined; // already showing these results
    const t = setTimeout(() => {
      lastNavRef.current = term;
      nav(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, searchOpen, loc.pathname, urlQ]);

  // Back/forward navigation re-syncs the input with the URL query.
  useEffect(() => {
    if (loc.pathname !== '/search') return;
    if (lastNavRef.current === urlQ) return;
    setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ, loc.pathname]);

  // Each page mounts its own Navbar, so arriving on /search resets the input —
  // refocus and put the caret back at the end of the query.
  useEffect(() => {
    if (loc.pathname === '/search' && searchRef.current) {
      searchRef.current.focus();
      const len = searchRef.current.value.length;
      searchRef.current.setSelectionRange(len, len);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search]);

  const closeSearch = () => {
    setQ('');
    lastNavRef.current = null;
    setSearchOpen(false);
    if (loc.pathname === '/search') nav('/browse');
  };

  const isActive = (to, end) => (end ? loc.pathname === to : loc.pathname.startsWith(to));
  const getAvatarUrl = (profile) => profile?.avatarUrl || '/Netflix-avatar-1.png';
  const initials = (activeProfile?.name || user?.name || 'U').charAt(0).toUpperCase();

  useLayoutEffect(() => {
    const navLinks = navLinksRef.current;
    const indicator = navIndicatorRef.current;
    if (!navLinks || !indicator) return undefined;

    const updateIndicator = () => {
      const activeLink = navLinks.querySelector('.nav-pill.active');
      if (!activeLink) {
        indicator.style.opacity = '0';
        return;
      }
      const navRect = navLinks.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const horizontalPadding = Number.parseFloat(getComputedStyle(activeLink).paddingLeft) || 0;
      indicator.style.width = `${Math.max(0, linkRect.width - horizontalPadding * 2)}px`;
      indicator.style.transform = `translate3d(${linkRect.left - navRect.left + horizontalPadding}px, ${linkRect.bottom - navRect.top - 6}px, 0)`;
      indicator.style.opacity = '1';
    };

    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(navLinks);
    const activeLink = navLinks.querySelector('.nav-pill.active');
    if (activeLink) observer.observe(activeLink);
    return () => observer.disconnect();
  }, [loc.pathname]);

  return (
    <header className={`navbar ${solid ? 'solid' : ''}`}>
      <Link to="/browse" className="brand" aria-label={branding.siteName}>
        <img src="/newflix.png" alt={branding.siteName} className="brand-logo" draggable="false" />
      </Link>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-primary-navigation"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <IconClose size={22} /> : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <nav ref={navLinksRef} id="mobile-primary-navigation" className={`nav-links${mobileMenuOpen ? ' mobile-open' : ''}`}>
        {NAV.map((n) => {
          const NavIcon = n.icon;
          return (
            <Link key={n.to} to={n.to} data-tour={n.tour}
              className={`nav-pill ${isActive(n.to, n.end) ? 'active' : ''}`}
              aria-current={isActive(n.to, n.end) ? 'page' : undefined}>
              <NavIcon className="mobile-nav-icon" size={20} />
              <span className="mobile-nav-label">{t(n.label)}</span>
            </Link>
          );
        })}
        <span ref={navIndicatorRef} className="nav-indicator" aria-hidden="true" />
      </nav>

      <div className="nav-right">
        <div className="nav-search">
          <button type="button" data-tour="search" className="nav-icon-btn" onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            aria-label={t('Search')} aria-expanded={searchOpen} title={t('Search')}>
            {searchOpen ? <IconClose size={22} /> : <IconSearch size={22} />}
          </button>
          <form className={`search-box ${searchOpen ? 'open' : ''}`} onSubmit={doSearch}>
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t('Titles, people, genres')} aria-label={t('Search titles')} />
          </form>
        </div>

        <button type="button" className="nav-icon-btn social-toggle" aria-label={t('Friends & Activity')} title={t('Friends & Activity')}
          onClick={() => window.dispatchEvent(new CustomEvent('social-sidebar-toggle'))}>
          <IconUsers size={22} />
        </button>

        {/* KIDS opens the kid catalogue page (/kids), which is certification-gated
            on the server. It used to point at /browse/tmdb-genre-kids — that genre
            only exists for TV (movie: null), so the page silently dropped every
            kid movie and applied no certification ceiling at all. */}
        <button type="button" data-tour="kids" className={`kids-link ${isActive('/kids') ? 'active' : ''}`}
          aria-label="Kids content" aria-current={isActive('/kids') ? 'page' : undefined}
          onClick={() => nav('/kids')}>{t('Kids').toLocaleUpperCase()}</button>

        {/* nav-pop-apps is the hook styles/mobile.css uses to drop the genre
            grid from the phone header — the app reaches genres through Browse. */}
        <div className="nav-pop nav-pop-apps">
          <button type="button" className="nav-icon-btn" aria-label={t('Browse genres')} title={t('Browse genres')}
            aria-expanded={appsOpen}
            onClick={() => { setAppsOpen((s) => !s); setBellOpen(false); setMenuOpen(false); }}>
            <IconApps size={22} />
          </button>
          {appsOpen && (
            <div className="notif-panel apps-panel" onMouseLeave={() => setAppsOpen(false)}>
              <div className="panel-head">{t('Browse genres')}</div>
              <div className="apps-grid">
                <Link to="/browse/movies" className="apps-link">Movies</Link>
                <Link to="/browse/series" className="apps-link">{t('TV Series')}</Link>
                <Link to="/browse/new" className="apps-link">{t('New & Popular')}</Link>
                <Link to="/my-list" className="apps-link">{t('My List')}</Link>
                {genres.map((g) => (
                  <Link key={g._id || g.slug} to={`/browse/tmdb-genre-${g.slug}`} className="apps-link">{g.name}</Link>
                ))}
              </div>
              {genresReady && genres.length === 0 && <div className="notif-item">{t('No genres created yet.')}</div>}
            </div>
          )}
        </div>

        <div className="nav-pop">
          <button type="button" data-tour="bell" className="nav-icon-btn" aria-label={t('Notifications')} title={t('Notifications')}
            aria-expanded={bellOpen}
            onClick={() => { setBellOpen((s) => !s); setAppsOpen(false); setMenuOpen(false); }}>
            <IconBell size={22} />
            {notifs.unread > 0 && <span className="bell-badge">{notifs.unread}</span>}
          </button>
          {bellOpen && (
            <div className="notif-panel" onMouseLeave={() => setBellOpen(false)}>
              {notifs.items.length === 0 && <div className="notif-item">{t('No notifications yet.')}</div>}
              {notifs.items.map((n) => (
                <div key={n._id} className="notif-item" onClick={() => n.link && nav(n.link)}
                  style={{ cursor: n.link ? 'pointer' : 'default' }}>
                  <b>{n.title}</b>
                  <div>{n.message}</div>
                </div>
              ))}
              {notifs.items.length > 0 && (
                <div className="notif-item" style={{ textAlign: 'center', color: '#54b9c5', cursor: 'pointer' }}
                  onClick={() => { API.put('/user/notifications/read-all').catch(() => {}); setNotifs((s) => ({ ...s, unread: 0 })); }}>
                  Mark all as read
                </div>
              )}
            </div>
          )}
        </div>
        <div data-tour="profile" className="profile-menu" role="button" tabIndex={0} title={`Open ${activeProfile?.name || 'profile'} menu`} aria-label={`Open ${activeProfile?.name || 'profile'} menu`} aria-expanded={menuOpen}
          onClick={() => { setMenuOpen((s) => !s); setBellOpen(false); setAppsOpen(false); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setMenuOpen((s) => !s);
              setBellOpen(false);
              setAppsOpen(false);
            }
          }}>
          <div className="profile-avatar" style={{ background: activeProfile?.avatarColor || '#E50914' }}>
            {getAvatarUrl(activeProfile) ? <img src={getAvatarUrl(activeProfile)} alt={activeProfile?.name || 'Profile'} /> : initials}
          </div>
          <span className="profile-caret"><IconCaret size={18} /></span>
          {menuOpen && (
            <div className="profile-dropdown" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              {profiles.map((p) => (
                <button type="button" key={p._id} className="pd-item pd-profile-choice" onClick={() => { selectProfile(p); setMenuOpen(false); nav('/browse'); }}>
                  <div className="profile-avatar sm" style={{ background: p.avatarColor }}>
                    {getAvatarUrl(p) ? <img src={getAvatarUrl(p)} alt={p.name} /> : p.name.charAt(0).toUpperCase()}
                  </div>
                  {p.name}{p.isKidsProfile ? ' (Kids)' : ''}
                </button>
              ))}
              <hr />
              <button type="button" className="pd-item" onClick={() => { setMenuOpen(false); nav('/profiles'); }}><IconUsers size={17} />{t('Manage Profiles')}</button>
              <button type="button" className="pd-item" onClick={() => { setMenuOpen(false); nav('/profiles?settings=1'); }}><IconTransferLine size={17} />{t('Profile Transfer')}</button>
              <button type="button" className="pd-item" onClick={() => { setMenuOpen(false); nav('/history'); }}><IconActivityLine size={17} />{t('Viewing Activity')}</button>
              <button type="button" className="pd-item" onClick={() => { setMenuOpen(false); nav('/account'); }}><IconSettings size={17} />{t('Account')}</button>
              <button type="button" className="pd-item" onClick={() => { setMenuOpen(false); nav('/account'); }}><IconAudio size={17} />{t('Audio & Subtitles')}</button>
              {(user?.role === 'super-admin' || user?.role === 'content-manager') && (
                <button type="button" className="pd-item" onClick={() => window.open('http://localhost:5174', '_blank')}><IconSettings size={17} />Admin Panel <span aria-hidden="true">↗</span></button>
              )}
              <hr />
              <button type="button" className="pd-item" onClick={logout}><IconLogoutLine size={17} />{t('Sign out')} {branding.siteName}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
