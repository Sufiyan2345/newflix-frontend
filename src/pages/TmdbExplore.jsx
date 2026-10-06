import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { GridCard } from '../components/Row';
import TmdbDetailModal from '../components/TmdbDetailModal';
import { API } from '../api';

// "Explore All" pages for the home-rail buttons (/browse/tmdb-*). Every rail key
// opens the same filterable TMDB catalogue with a preset — like Netflix's genre
// browse pages: a grid of posters plus Type / Genre / Year / Language / Sort filters.
const PRESETS = {
  'tmdb-top10': { type: 'all', heading: 'Top 10 Movies in Netflix Today', sort: 'views' },
  'tmdb-trending': { type: 'all', heading: 'Trending This Week', sort: 'views' },
  'tmdb-popular-movies': { type: 'movie', heading: 'Popular Movies', sort: 'views' },
  'tmdb-popular-tv': { type: 'tv', heading: 'Popular TV Series', sort: 'views' },
  'tmdb-top-rated-movies': { type: 'movie', heading: 'Top Rated Movies', sort: 'rating' },
  'tmdb-top-rated-tv': { type: 'tv', heading: 'Top Rated Series', sort: 'rating' },
  'tmdb-now-playing': { type: 'movie', heading: 'Now Playing in Theaters', sort: 'newest' },
  'tmdb-airing-today': { type: 'tv', heading: 'Airing Today', sort: 'newest' },
  'tmdb-trending-movies': { type: 'movie', heading: 'Trending Movies', sort: 'views' },
  'tmdb-trending-tv': { type: 'tv', heading: 'Trending Series', sort: 'views' },
  'tmdb-languages': { type: 'all', heading: 'Browse by Languages', sort: 'views' },
};

const FALLBACK = { type: 'all', heading: 'Browse All', sort: 'views' };
const GENRE_ALIASES = {
  'korean-dramas': { genre: 'drama', lang: 'ko', label: 'Korean Dramas' },
  anime: { genre: 'animation', label: 'Anime' },
  mystery: { genre: 'thriller', label: 'Mystery' },
  fantasy: { genre: 'scifi', label: 'Fantasy' },
  adventure: { genre: 'action', label: 'Adventure' },
  'sci-fi': { genre: 'scifi', label: 'Sci-Fi' },
};

const getPreset = (presetKey) => {
  if (PRESETS[presetKey]) return PRESETS[presetKey];
  if (presetKey.startsWith('tmdb-genre-')) {
    const genre = presetKey.replace('tmdb-genre-', '');
    const alias = GENRE_ALIASES[genre];
    return {
      type: 'all',
      genre: alias?.genre || genre,
      lang: alias?.lang || '',
      heading: `${(alias?.label || genre.replace(/-/g, ' ')).replace(/\b\w/g, (c) => c.toUpperCase())} Movies & TV`,
      sort: 'views',
    };
  }
  return FALLBACK;
};

const YEARS = ['2026', '2025', '2024', '2023'];
const yearLabel = (year) => year;

const SORTS = [
  ['views', 'Most Watched'],
  ['rating', 'Top Rated'],
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['az', 'A-Z'],
  ['za', 'Z-A'],
];

function FilterDropdown({ id, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    optionRefs.current[selectedIndex]?.focus();
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open, selectedIndex]);

  const handleOptionKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = Math.min(index + 1, options.length - 1);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(index - 1, 0);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    } else return;
    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="language-filter-select" ref={rootRef} onBlur={(event) => {
      if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        type="button"
        className="language-filter-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`language-filter-options-${id}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selectedOption?.label}</span>
        <svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg>
      </button>
      {open && (
        <div id={`language-filter-options-${id}`} className="language-filter-menu" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              key={option.value || 'all'}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              className="language-filter-option"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === selectedIndex ? 0 : -1}
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest' })}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TmdbExplore({ presetKey = '' }) {
  const preset = getPreset(presetKey);
  const [type, setType] = useState(preset.type);
  const [genre, setGenre] = useState(preset.genre || '');
  const [year, setYear] = useState('');
  const [lang, setLang] = useState(preset.lang || '');
  const [sort, setSort] = useState(preset.sort);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [tmdbDetail, setTmdbDetail] = useState(null);

  // Opening a different rail resets the filters to that rail's preset.
  useEffect(() => {
    const p = getPreset(presetKey);
    setType(p.type);
    setGenre(p.genre || '');
    setYear('');
    setLang(p.lang || '');
    setSort(p.sort);
  }, [presetKey]);

  // Any TMDB card in the grid opens the in-page detail modal (never a new tab).
  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    document.title = `${preset.heading} — Newflix`;
  }, [preset.heading]);

  // Page 1 for the current filter combination (the server caches each combo 30 min).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    API.get(`/tmdb/explore/${type}`, { params: { genre, year, lang, sort, page: 1 } })
      .then(({ data: d }) => { if (alive) setData(d); })
      .catch(() => { if (alive) setError('Could not load the catalogue. Is the backend running?'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [type, genre, year, lang, sort]);

  const loadMore = () => {
    if (!data || loadingMore || data.page >= data.totalPages) return;
    setLoadingMore(true);
    API.get(`/tmdb/explore/${type}`, { params: { genre, year, lang, sort, page: data.page + 1 } })
      .then(({ data: d }) => setData((prev) => (prev ? { ...d, items: [...(prev.items || []), ...(d.items || [])] } : d)))
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const genres = data?.genres || [];
  const languages = Object.entries(data?.languages || {});
  const items = data?.items || [];

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Navbar />
      <div className="grid-page tmdb-explore-page">
        <div className="tmdb-explore-toolbar">
          <h2 className="browse-heading">{preset.heading}</h2>
          <div className="language-filter-groups">
            <div className="language-filter-group">
              <span className="language-filter-label">Select Your Preferences</span>
              <div className="language-filter-controls">
                <FilterDropdown id="type" label="Type" value={type} onChange={setType} options={[
                  { value: 'all', label: 'All Titles' },
                  { value: 'movie', label: 'Movies' },
                  { value: 'tv', label: 'TV Series' },
                ]} />
                <FilterDropdown id="genre" label="Genre" value={genre} onChange={setGenre} options={[
                  { value: '', label: 'All Genres' },
                  ...genres.map((g) => ({ value: g.slug, label: g.name })),
                ]} />
                <FilterDropdown id="year" label="Year" value={year} onChange={setYear} options={[
                  { value: '', label: 'All Years' },
                  ...YEARS.map((y) => ({ value: y, label: yearLabel(y) })),
                ]} />
                <FilterDropdown id="language" label="Language" value={lang} onChange={setLang} options={[
                  { value: '', label: 'All Languages' },
                  ...languages.map(([code, name]) => ({ value: code, label: name })),
                ]} />
              </div>
            </div>
            <div className="language-filter-group language-sort-group">
              <span className="language-filter-label">Sort by</span>
              <FilterDropdown id="sort" label="Sort by" value={sort} onChange={setSort} options={
                SORTS.map(([value, label]) => ({ value, label }))
              } />
            </div>
          </div>
        </div>

        {loading && <PageLoadingSkeleton variant="grid" cardCount={6} />}
        {error && <p className="no-results">{error}</p>}
        {!loading && !error && data && !data.configured && (
          <p className="no-results">TMDB is not configured on the server yet.</p>
        )}
        {!loading && !error && data?.configured && items.length === 0 && (
          <p className="no-results">No titles match these filters yet.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid">
              {items.map((t) => <GridCard key={t._id} item={t} />)}
            </div>
            <p className="grid-count">{items.length} of {data.totalResults} titles</p>
            {data.page < data.totalPages && (
              <div style={{ textAlign: 'center', margin: '30px 0 10px' }}>
                <button
                  type="button"
                  className="load-more"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadMore();
                  }}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load More Titles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      <Footer />
    </div>
  );
}