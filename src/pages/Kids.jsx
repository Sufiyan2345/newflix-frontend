import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import Row, { GridCard } from '../components/Row';
import HeroBanner from '../components/HeroBanner';
import TmdbDetailModal from '../components/TmdbDetailModal';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useHeroSlides from '../hooks/useHeroSlides';

// The destination behind the navbar KIDS button.
//
// It is deliberately NOT a profile switch: any member can open it and browse
// the kid catalogue without giving up their own profile. The server
// (GET /api/tmdb/kids) does the maturity work — TMDB rails are
// certification-capped server-side and the local rail runs through the same
// withMaturity() rule a Kids profile gets — so this page only decides which
// rails to show.
//
// Every rail carries a `section` from the server, so the tab pills below can
// filter without this file hardcoding a list of row keys. `stories` is its own
// grid rather than another rail: a full grid of story cards is what makes
// "Stories" read as a destination and not just one more shelf.
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'stories', label: 'Stories' },
  { key: 'movies', label: 'Movies' },
  { key: 'shows', label: 'TV Shows' },
  { key: 'learn', label: 'Learn' },
];

export default function Kids() {
  const nav = useNavigate();
  const { activeProfile } = useAuth();
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [tmdbDetail, setTmdbDetail] = useState(null);
  const [heroPaused, setHeroPaused] = useState(false);

  // Any TMDB card on this page opens the in-page detail modal, never a new tab.
  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    document.title = 'Kids — Cartoons, Family & Stories | Newflix';
    let alive = true;
    API.get('/tmdb/kids')
      .then(({ data }) => {
        if (!alive) return;
        // A 200 with no rows is a real state (no TMDB key and no local kid
        // titles yet), so only a thrown request counts as an error.
        setFeed(data || { rows: [] });
      })
      .catch(() => { if (alive) setError('Kids content is temporarily unavailable.'); });
    return () => { alive = false; };
  }, []);

  const rows = feed?.rows || [];
  const storyRow = rows.find((r) => r.section === 'stories');
  const featuredRow = rows.find((row) => row.key === 'tmdb-kids-movies')
    || rows.find((row) => row.section === 'movies');
  const kidsTop10Row = rows.find((row) => row.top10);
  const heroRanks = Object.fromEntries((kidsTop10Row?.items || []).map((title, rank) => [String(title._id || title.id), rank + 1]));
  const { slides: heroSlides, index: heroIndex, setIndex: setHeroIndex } = useHeroSlides(
    rows.flatMap((row) => row.items || []),
    { shuffle: true, paused: heroPaused },
  );

  // Tabs are driven purely by the `section` the server sent. A section can be
  // empty on this deployment (e.g. no TMDB key → no Stories rail) and its pill
  // is then hidden rather than leading to a blank page.
  const sectionCount = useMemo(() => {
    const counts = {};
    rows.forEach((r) => { counts[r.section] = (counts[r.section] || 0) + (r.items?.length || 0); });
    return counts;
  }, [rows]);

  const visibleRows = useMemo(
    () => (tab === 'all' || tab === 'stories' ? rows : rows.filter((r) => r.section === tab)),
    [rows, tab],
  );
  const railRows = visibleRows.filter((r) => r.section !== 'stories' && r.key !== featuredRow?.key);

  return (
    <div className="kids-page">
      <Navbar />

      {heroSlides.length > 0 && (
        <HeroBanner
          item={heroSlides[heroIndex] || heroSlides[0]}
          featured={heroSlides}
          index={heroIndex}
          ranks={heroRanks}
          rankScope="Kids"
          paused={heroPaused}
          onSlideSelect={setHeroIndex}
          onHoverChange={setHeroPaused}
        />
      )}
      {featuredRow?.items?.length > 0 && (
        <div className="home-primary-rows">
          <Row
            title={featuredRow.title}
            items={featuredRow.items}
            top10={featuredRow.top10}
            exploreLink={featuredRow.explorePath}
            onExplore={(path) => nav(path)}
          />
        </div>
      )}

      <nav className="kids-tabs" aria-label="Kids categories">
        {TABS.filter((t) => t.key === 'all' || sectionCount[t.key] > 0).map((t) => (
          <button
            key={t.key}
            type="button"
            className={`kids-tab${tab === t.key ? ' active' : ''}`}
            aria-current={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="center-msg" style={{ paddingTop: 40 }}>{error}</div>}
      {!feed && !error && <PageLoadingSkeleton variant="home" rowCount={3} />}

      {feed && (
        <div className="kids-body">
          {activeProfile?.isKidsProfile && (
            <p className="kids-note">
              You are watching as <b>{activeProfile.name}</b> (Kids profile). Everything here is already filtered to kid-safe titles.
            </p>
          )}
          {feed.configured === false && (
            <p className="kids-note">
              The live kids catalogue is not configured on this server yet — showing titles added
              in the Admin Panel instead.
            </p>
          )}

          {tab === 'stories' ? (
            storyRow?.items?.length ? (
              <section className="kids-stories">
                <h2 className="kids-section-title">{storyRow.title}</h2>
                <p className="kids-section-sub">
                  Short tells a child can finish in one sitting — films under 40 minutes and
                  series with short episodes.
                </p>
                <div className="grid kids-story-grid">
                  {storyRow.items.map((item) => <GridCard key={item._id} item={item} />)}
                </div>
                {storyRow.explorePath && (
                  <button type="button" className="kids-btn ghost more" onClick={() => nav(storyRow.explorePath)}>
                    Explore All Animation &amp; Anime ›
                  </button>
                )}
              </section>
            ) : (
              <p className="center-msg">No stories available right now — check back soon.</p>
            )
          ) : (
            railRows.map((row) => (
              <Row
                key={row.key}
                title={row.title}
                items={row.items}
                top10={row.top10}
                exploreLink={row.explorePath}
                onExplore={(path) => nav(path)}
              />
            ))
          )}

          {visibleRows.length === 0 && (
            <p className="center-msg" style={{ paddingTop: 40 }}>
              No kids titles here yet. Mark a title <b>Kids content</b> in the Admin Panel, or
              configure the TMDB key to pull the live kids catalogue.
            </p>
          )}
        </div>
      )}

      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      <Footer />
    </div>
  );
}
