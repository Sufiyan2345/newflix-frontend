import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import HeroBanner from '../components/HeroBanner';
import Row from '../components/Row';
import TmdbDetailModal from '../components/TmdbDetailModal';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useHeroSlides, { MAX_HERO_SLIDES, pickRandomSlides, recentTmdbHeroPool } from '../hooks/useHeroSlides';

// The navbar "New & Popular" page.
//
// It is deliberately built from the same pieces as the home page (HeroBanner +
// `.rows` rails + Footer) so it reads as part of the site rather than the bare
// filter grid it used to fall back to. All the maturity and catalogue work
// happens server-side (GET /tmdb/new-popular): this file only decides which
// rails to draw and hands "Explore All ›" to the row's own path.
export default function NewPopular() {
  const nav = useNavigate();
  const { user, activeProfile } = useAuth();
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [heroPaused, setHeroPaused] = useState(false); // pause rotation while hovering
  const [tmdbDetail, setTmdbDetail] = useState(null);

  // Any TMDB card opens the in-page detail modal, never a new tab — same as
  // Browse and BrowseBy.
  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    let alive = true;
    document.title = 'New & Popular — Trending This Week | Newflix';
    setFeed(null);
    setError('');
    API.get('/tmdb/new-popular')
      .then(({ data }) => { if (alive) setFeed(data || { rows: [], top10: [] }); })
      .catch(() => { if (alive) setError('New & Popular content is temporarily unavailable.'); });
    return () => { alive = false; };
  }, [user?._id, activeProfile?._id]);

  const top10 = feed?.top10 || [];
  const rows = (feed?.rows || []).filter((row) => row.items?.length > 0);
  const bannerRow = rows.find((row) => row.key === 'np-airing-today');

  // Re-roll the billboard only when the POOL changes. Keying on the ids rather
  // than the array identity is what stops the banner re-shuffling mid-view.
  const heroCandidates = [
    ...(feed?.top10 || []),
    ...(feed?.featured || []),
    ...rows.flatMap((row) => row.items || []),
  ];
  const poolKey = heroCandidates.map((title) => String(title?._id)).join('|');
  const heroPool = useMemo(
    () => pickRandomSlides(recentTmdbHeroPool(heroCandidates), MAX_HERO_SLIDES),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poolKey],
  );
  // One shared clock for the whole billboard, exactly like the home page.
  // `shuffle: false` because the pick above already rolled this visit's slides.
  const { slides: heroSlides, index: heroIndex, setIndex: setHeroIndex } = useHeroSlides(heroPool, { shuffle: false, paused: heroPaused });
  const hero = heroSlides[heroIndex] || heroSlides[0];

  // Real Top 10 ranks for the hero billboard badge, taken from the day's
  // trending list rather than invented.
  const ranks = {};
  top10.forEach((t, i) => { ranks[t._id] = i + 1; });

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Navbar />
      {error && <div className="center-msg" style={{ paddingTop: 140 }}>{error}</div>}
      {!feed && !error && <PageLoadingSkeleton variant="home" rowCount={3} />}

      {feed && (
        <>
          {/* No hero to hang the rails off (TMDB down and nothing published
              locally) — the rows alone still read fine, so the page never
              renders a half-built screen. */}
          {hero && (
            <HeroBanner
              item={hero}
              featured={heroSlides}
              index={heroIndex}
              ranks={ranks}
              paused={heroPaused}
              onSlideSelect={setHeroIndex}
              onHoverChange={setHeroPaused}
            />
          )}
          {bannerRow && (
            <div className="home-primary-rows">
              <Row
                title={bannerRow.title}
                items={bannerRow.items}
                exploreLink={bannerRow.explorePath}
                onExplore={(path) => nav(path)}
              />
            </div>
          )}

          <div className="rows new-popular-rows">
            {top10.length > 0 && (
              <Row title={feed.top10Title || 'Top 10 Today'} items={top10} top10 />
            )}
            {rows.filter((row) => row.key !== bannerRow?.key).map((row) => (
              <Row
                key={row.key}
                title={row.title}
                items={row.items}
                exploreLink={row.explorePath}
                onExplore={(path) => nav(path)}
              />
            ))}

            {rows.length === 0 && top10.length === 0 && (
              <p className="no-results" style={{ paddingTop: 40 }}>
                {feed.configured === false
                  ? 'The live catalogue is not configured on this server yet — publish a title in the Admin Panel with the New Release flag and it will show up here.'
                  : 'Nothing new and popular right now — check back soon.'}
              </p>
            )}
          </div>
        </>
      )}

      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      <Footer />
    </div>
  );
}
