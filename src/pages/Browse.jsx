import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import GamesRow from '../components/GamesRow';
import Row from '../components/Row';
import TmdbDetailModal from '../components/TmdbDetailModal';
import OnboardingTour from '../components/OnboardingTour';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useHeroSlides, { MAX_HERO_SLIDES, pickRandomSlides, recentTmdbHeroPool } from '../hooks/useHeroSlides';

// Netflix-style "Find Shows by Genre" cards. Each tile shows a REAL TMDB backdrop
// of a popular title in that exact genre (served by /tmdb/genre-cards), so Horror
// looks like horror and Comedy like comedy — and every tile opens the Explore page
// pre-filtered to that category.
// `pullUp` rides the block onto the bottom of the billboard (see .hero-follow in
// cards.css) when nothing else already claimed that overlap — the cards then sit
// ON the artwork instead of on a black band.
function GenreShowcase({ pullUp = false }) {
  const nav = useNavigate();
  const [cards, setCards] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const railRef = useRef(null);

  useEffect(() => {
    let alive = true;
    API.get('/tmdb/genre-cards')
      .then(({ data }) => { if (alive) setCards(data.items || []); })
      .catch(() => { if (alive) setCards([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const updateArrows = () => {
      setCanScrollLeft(rail.scrollLeft > 1);
      setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
    };
    updateArrows();
    rail.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      rail.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [cards]);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!cards?.length) return null; // stays hidden until TMDB responds (or if not configured)

  return (
    <section className={`genre-showcase${pullUp ? ' hero-follow' : ''}`}>
      <div className="genre-showcase-head">
        <h2>Find Shows by Genre</h2>
        <button type="button" onClick={() => nav('/browse/tmdb-genre')}>View All <span>›</span></button>
      </div>
      <div className="genre-showcase-rail">
        <button type="button" className="genre-showcase-arrow left" aria-label="Previous genres"
          disabled={!canScrollLeft} onClick={() => scrollRail(-1)}>‹</button>
        <div className="genre-showcase-grid" ref={railRef}>
          {cards.map((c) => (
            <button
              className="genre-showcase-card"
              key={c.slug}
              title={`${c.name} — see all`}
              onClick={() => nav(`/browse/tmdb-genre-${c.slug}`)}
            >
              <img src={c.imageUrl} alt={c.name} loading="lazy" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className="genre-showcase-arrow right" aria-label="Next genres"
          disabled={!canScrollRight} onClick={() => scrollRail(1)}>›</button>
      </div>
    </section>
  );
}

// The browse page. `children` renders the title modal on top of it, so opening a
// title keeps the rails behind it exactly like Netflix does.
export default function Browse({ children }) {
  const nav = useNavigate();
  const { user, activeProfile } = useAuth();
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [heroPaused, setHeroPaused] = useState(false); // pause auto-rotation while the user hovers the banner
  const [tmdbDetail, setTmdbDetail] = useState(null); // TMDB title shown in the in-page modal
  // True when the active profile is a Kids profile — drives the banner strip and
  // confirms the server is serving the kid-safe feed.
  const isKids = Boolean(activeProfile?.isKidsProfile);

  // Any TMDB card (rails, top10, hover preview, search grid) opens the
  // Netflix-style detail modal right here — never a new tab.
  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    let alive = true;
    setFeed(null);
    setError('');
    document.title = 'Newflix Pakistan - Watch TV Shows Online, Watch Movies Online';
    Promise.allSettled([API.get('/titles/home'), API.get('/tmdb/home')])
      .then(([localResult, tmdbResult]) => {
        if (localResult.status !== 'fulfilled') throw localResult.reason;
        const localFeed = localResult.value.data;
        const tmdbRows = tmdbResult.status === 'fulfilled' ? (tmdbResult.value.data?.rows || []) : [];
        if (!alive) return;
        setFeed({
          ...localFeed,
          rows: [...(localFeed.rows || []), ...tmdbRows].filter((row) => row.key !== 'cw'),
        });
      })
      .catch(() => { if (alive) setError('Failed to load content. Is the backend running?'); });
    return () => { alive = false; };
    // Re-runs on profile change on purpose: the feed is viewer-specific (each
    // profile gets its own rails) and a Kids profile gets a different, filtered
    // catalogue, so a previously-loaded adult feed must never be shown to it.
  }, [user?._id, activeProfile?._id]);

  // Continue Watching: runs once per loaded feed + profile. It must NOT depend on
  // the `feed` object itself — setFeed always produces a new object, so a [feed]
  // dependency re-fetches and re-sets in an endless loop, and every pass re-rolled
  // the random hero pool (that loop was the billboard's "fast glitch").
  const rowsReady = Boolean(feed);
  const latestTitlesById = new Map([
    ...(feed?.featured || []),
    ...(feed?.rows || []).filter((row) => row.key !== 'cw').flatMap((row) => row.items || []),
  ].filter((title) => title?._id).map((title) => [String(title._id), title]));
  useEffect(() => {
    if (!rowsReady || !activeProfile) return;
    let alive = true;
    API.get('/user/continue-watching')
      .then(({ data }) => {
        if (!alive) return;
        const items = (data.items || [])
          .filter((i) => i.title && i.progressSeconds > 0)
          .map((i) => ({
            ...i.title,
            ...(latestTitlesById.get(String(i.title._id)) || {}),
            ...(i.watchRoute ? { watchRoute: i.watchRoute } : {}),
            // Kept so the lead tile can print Netflix's "S3:E4 · Old Friends".
            // Dropping it here is why the caption had nothing to show before.
            ...(i.episode ? { _episode: i.episode } : {}),
            _resume: { progressSeconds: i.progressSeconds, durationSeconds: i.durationSeconds },
          }));

        setFeed((f) => {
          const base = f || { rows: [] };
          const rows = (base.rows || []).filter((row) => row.key !== 'cw');
          return {
            ...base,
            rows: items.length ? [{ key: 'cw', title: 'Continue Watching', items, cw: true }, ...rows] : rows,
          };
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [rowsReady, activeProfile]);

  // The home billboard uses TMDB trending titles only, so its artwork is always
  // a TMDB backdrop rather than an uploaded local banner.
  const tmdbHeroCandidates = (feed?.rows || []).flatMap((row) => row.items || []);
  const poolKey = tmdbHeroCandidates.map((title) => String(title?._id)).join('|');
  const heroPool = useMemo(() => {
    return pickRandomSlides(recentTmdbHeroPool(tmdbHeroCandidates), MAX_HERO_SLIDES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);
  // One clock for the whole billboard: the hook clamps, auto-rotates and accepts
  // dot clicks for the exact array the banner renders. `shuffle: false` because the
  // pick above already rolled this visit's slides.
  const { slides: heroSlides, index: heroIndex, setIndex: setHeroIndex } = useHeroSlides(heroPool, { shuffle: false, paused: heroPaused });
  const hero = heroSlides[heroIndex] || heroSlides[0] || feed?.rows?.[0]?.items?.[0];
  const continueWatchingRow = feed?.rows?.find((row) => row.key === 'cw');
  const trendingRow = feed?.rows?.find((row) => row.key === 'tmdb-trending');

  // Real Top 10 ranks for the hero billboard badge (from the feed's Top 10 row)
  const ranks = {};
  feed?.rows?.find((r) => r.top10)?.items?.forEach((t, i) => { ranks[t._id] = i + 1; });

  return (
    <div>
      <Navbar />
      {error && <div className="center-msg" style={{ paddingTop: 140 }}>{error}</div>}
      {!feed && !error && <PageLoadingSkeleton variant="home" />}
      {feed && (
        <>
          {/* Makes the active content mode obvious — a kids profile really is
              seeing a different, filtered catalogue, not the adult one. */}
          {isKids && (
            <div className="browse-kids-banner">
              <span className="browse-kids-badge">Kids</span>
              <span>Family, animated and kids-safe titles only. Switch profiles to watch grown-up content.</span>
            </div>
          )}
          <HeroBanner
            item={hero}
            featured={heroSlides}
            index={heroIndex}
            ranks={ranks}
            rankScope={isKids ? 'Kids' : ''}
            paused={heroPaused}
            onSlideSelect={setHeroIndex}
            onHoverChange={setHeroPaused}
          />
          {(continueWatchingRow || trendingRow?.items?.length > 0) && (
            <div className="home-primary-rows">
              {continueWatchingRow && (
                <Row
                  title={continueWatchingRow.title}
                  items={continueWatchingRow.items}
                  cw
                  exploreLink={continueWatchingRow.key}
                  onExplore={() => nav('/history')}
                />
              )}
              {trendingRow?.items?.length > 0 && (
                <Row
                  title={trendingRow.title || 'Trending This Week'}
                  items={trendingRow.items}
                  top10={trendingRow.top10}
                  exploreLink={trendingRow.key}
                  onExplore={(key) => nav(`/browse/${key}`)}
                />
              )}
            </div>
          )}
          <GamesRow />
          <GenreShowcase pullUp={!trendingRow && !isKids} />
          <div className="rows">
            {feed.rows.filter((row) => row.key !== 'cw' && row.key !== 'tmdb-trending').map((row) => (
              <Row
                key={row.key}
                title={row.title}
                items={row.items}
                top10={row.top10}
                exploreLink={row.key}
                onExplore={(key) => nav(`/browse/${key}`)}
              />
            ))}
            {feed.rows.length === 0 && (
              <div className="center-msg" style={{ paddingTop: 60 }}>
                No published titles yet — add some in the Admin Panel and mark them Published.
              </div>
            )}
          </div>
        </>
      )}
      {children}
      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      {/* First-login walkthrough of the navbar controls. It renders nothing at
          all once the member has finished it, so this costs one null after
          the first visit. Mounted here because the home page is where a new
          member lands and every step points at the navbar above it. */}
      <OnboardingTour />
      <Footer />
    </div>
  );
}
