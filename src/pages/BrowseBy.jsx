import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import Row, { GridCard } from '../components/Row';
import HeroBanner from '../components/HeroBanner';
import TmdbDetailModal from '../components/TmdbDetailModal';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useHeroSlides from '../hooks/useHeroSlides';

// Genre slugs and the Movies / TV Series pages. "new" used to live here and
// rendered as a bare filter grid; it is now a real page (pages/NewPopular.jsx)
// with a hero and themed rails, registered as a static route in App.jsx.
const FILTERS = {
  movies: { type: 'movie', heading: 'Movies' },
  series: { type: 'series', heading: 'TV Series' },
};

export default function BrowseBy() {
  const nav = useNavigate();
  const { filter } = useParams();
  const { user, activeProfile } = useAuth();
  const base = FILTERS[filter];
  // Navbar "TV Series" / "Movies" pages stream the live TMDB catalogue as
  // Netflix-style rows (Top 10 + genre rails). Genre-slug routes keep the
  // filterable catalogue grid.
  const tmdbType = filter === 'movies' ? 'movie' : filter === 'series' ? 'tv' : null;

  const [heading, setHeading] = useState(base?.heading || 'Browse');
  const [genres, setGenres] = useState([]);
  const [items, setItems] = useState(null);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [lang, setLang] = useState('');
  const [sort, setSort] = useState(base?.sort || 'views');
  const [tmdbDetail, setTmdbDetail] = useState(null);
  const [browse, setBrowse] = useState(null);
  const [heroPaused, setHeroPaused] = useState(false);
  // Same shared billboard clock as the home page: the pool is that page's own Top 10
  // (TMDB Popular list) and the hook re-rolls which recent titles are shown on every
  // visit, so Movies / TV Series never show the same fixed banner twice. Dot clicks
  // are validated against the same recent slides that are rendered.
  const heroCandidates = [
    ...(browse?.top10 || []),
    ...(browse?.rows || []).flatMap((row) => row.items || []),
  ];
  const { slides: heroSlides, index: heroIndex, setIndex: setHeroIndex } = useHeroSlides(
    heroCandidates,
    { shuffle: true, paused: heroPaused },
  );
  const heroRanks = Object.fromEntries((browse?.top10 || []).map((title, rank) => [String(title._id || title.id), rank + 1]));
  const bannerRowKey = filter === 'movies' ? 'now' : 'popular';
  const bannerRow = browse?.rows?.find((row) => row.key === bannerRowKey);

  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  // Live TMDB feed for the Movies / TV Series pages (cached server-side 30 min)
  useEffect(() => {
    if (!tmdbType) { setBrowse(null); return; }
    setBrowse(null);
    let alive = true;
    API.get(`/tmdb/browse/${tmdbType}`)
      .then(({ data }) => { if (alive) { setBrowse(data); setHeroIndex(0); } })
      .catch(() => { if (alive) setBrowse({ configured: false, top10: [], rows: [] }); });
    return () => { alive = false; };
  }, [tmdbType, user?._id, activeProfile?._id]);

  // The rotation, hover pause, and slide selection are handled by useHeroSlides.

  // /browse/<genre-slug> (used by the navbar apps grid) resolves to the real genre,
  // so every link in that menu filters the catalogue instead of dumping everything.
  useEffect(() => {
    if (tmdbType) return;
    setGenre('');
    API.get('/genres').then(({ data }) => {
      setGenres(data.items || []);
      if (base) { setHeading(base.heading); return; }
      const g = (data.items || []).find((x) => x.slug === filter);
      if (g) { setGenre(g._id); setHeading(g.name); }
      else setHeading('Browse');
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, tmdbType]);

  useEffect(() => {
    if (tmdbType) return;
    setItems(null);
    const q = new URLSearchParams();
    if (base?.type) q.set('type', base.type);
    if (genre) q.set('genre', genre);
    if (year) q.set('year', year);
    if (lang) q.set('language', lang);
    q.set('sort', sort);
    q.set('limit', '60');
    API.get(`/titles?${q}`).then(({ data }) => setItems(data.items)).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, genre, year, lang, sort, tmdbType]);

  // ===== Netflix rows layout: Movies / TV Series pages =====
  if (tmdbType) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        {heroSlides.length > 0 && (
          <HeroBanner
            item={heroSlides[heroIndex] || heroSlides[0]}
            featured={heroSlides}
            index={heroIndex}
            ranks={heroRanks}
            paused={heroPaused}
            onSlideSelect={setHeroIndex}
            onHoverChange={setHeroPaused}
          />
        )}
        {bannerRow?.items?.length > 0 && (
          <div className="home-primary-rows">
            <Row
              title={bannerRow.title}
              items={bannerRow.items}
              eager
              exploreLink={bannerRow.key}
              onExplore={(key) => nav(`/browse/${key}`)}
            />
          </div>
        )}
        <div className={`browse-page${heroSlides.length ? ' browse-page-with-hero' : ''}`}>
          <h2 className="browse-heading">{browse?.heading || heading}</h2>
          {!browse && <PageLoadingSkeleton variant="rows" rowCount={4} />}
          {browse && browse.rows?.length > 0 && (
            <>
              {browse.top10?.length > 0 && (
                <Row title={browse.top10Title || 'Top 10 in Netflix Today'} items={browse.top10} top10 />
              )}
              {browse.rows
                .filter((row) => row.key !== bannerRowKey && !(tmdbType === 'tv' && row.key === 'new-series-recent'))
                .map((row) => (
                <Row key={row.key} title={row.title} items={row.items} />
              ))}
            </>
          )}
          {browse && !browse.configured && (
            <p className="no-results">TMDB is not configured on the server yet.</p>
          )}
        </div>
        {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
        <Footer />
      </div>
    );
  }

  // ===== Filterable catalogue grid (genre slugs / New & Popular) =====
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="grid-page">
        <h2>{heading}</h2>
        <div className="filters-bar">
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All Genres</option>
            {genres.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {[2026, 2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="">All Languages</option>
            {['English', 'Urdu', 'Hindi', 'Korean', 'Turkish', 'Arabic', 'Spanish'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="views">Most Watched</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
            <option value="year">Release Year</option>
          </select>
        </div>
        {items === null && <PageLoadingSkeleton variant="grid" cardCount={6} />}
        {items && items.length === 0 && <p className="no-results">No titles match these filters yet.</p>}
        {items && items.length > 0 && (
          <div className="grid">
            {items.map((t) => <GridCard key={t._id} item={t} />)}
          </div>
        )}
      </div>
      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      <Footer />
    </div>
  );
}
