import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import Row from '../components/Row';
import { TitleCard, HoverPreview } from '../components/Row';
import TmdbDetailModal from '../components/TmdbDetailModal';
import { API } from '../api';
import { useSiteTranslation } from '../utils/siteTranslation';

// Debounce helper — don't hammer TMDB on every keystroke.
function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function SearchResultGrid({ items }) {
  const [hover, setHover] = useState(null);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleHover = (item, element) => {
    clearTimeout(closeTimer.current);
    setHover({ item, rect: element.getBoundingClientRect() });
  };

  return (
    <div className="search-result-grid-wrap" onMouseLeave={() => {
      closeTimer.current = setTimeout(() => setHover(null), 220);
    }}>
      <div className="grid search-result-grid">
        {items.map((item) => (
          <TitleCard key={item._id} item={item} onHover={handleHover} />
        ))}
      </div>
      {hover && (
        <HoverPreview
          item={hover.item}
          anchorRect={hover.rect}
          onKeepAlive={() => clearTimeout(closeTimer.current)}
          onClose={() => { closeTimer.current = setTimeout(() => setHover(null), 220); }}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  const t = useSiteTranslation();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const dq = useDebounced(q);
  const [items, setItems] = useState(null);
  const [source, setSource] = useState('tmdb'); // where results came from
  const [suggestions, setSuggestions] = useState([]);
  const [suggestSource, setSuggestSource] = useState('catalogue');
  const [tmdbDetail, setTmdbDetail] = useState(null);

  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    if (!dq) { setItems([]); return; }
    setItems(null);
    let cancelled = false;
    // Search TMDB first (all movies + series, exact names), fall back to the local catalogue.
    API.get(`/tmdb/search?q=${encodeURIComponent(dq)}`)
      .then(({ data }) => {
        if (cancelled) return;
        if (data.items?.length) { setItems(data.items); setSource('tmdb'); }
        else return API.get(`/titles/search?q=${encodeURIComponent(dq)}`);
      })
      .then((res) => {
        if (cancelled || !res) return;
        setItems(res.data.items || []);
        setSource('catalogue');
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [dq]);

  useEffect(() => {
    if (items === null || items.length > 0) return;
    API.get('/titles?limit=12&sort=views')
      .then(({ data }) => {
        if (data.items?.length) { setSuggestSource('catalogue'); return data.items; }
        // Local catalogue is empty → fall back to the live TMDB catalogue
        return API.get('/tmdb/explore/all').then(({ data: d }) => {
          setSuggestSource('tmdb');
          return d.items || [];
        });
      })
      .then((list) => { if (list) setSuggestions(list); })
      .catch(() => {});
  }, [items]);

  const heading = t(q ? 'Movies & TV' : 'Search Newflix');

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="grid-page search-page">
        <h2>{heading}</h2>
        {items === null && <PageLoadingSkeleton variant="grid" cardCount={6} />}
        {items && items.length > 0 && (
          <SearchResultGrid items={items} />
        )}
        {items && items.length === 0 && dq && (
          <>
            <p className="no-results">
              Your search for “{q}” did not have any matches.<br />Suggestions: Try different keywords, or a title / genre / actor name.
            </p>
            {suggestions.length > 0 && (
              <Row title={suggestSource === 'tmdb' ? 'Popular Movies & TV' : 'Popular on Newflix'} items={suggestions} />
            )}
          </>
        )}
        {items && items.length === 0 && !dq && (
          <Row title={suggestSource === 'tmdb' ? 'Popular Movies & TV' : 'Popular on Newflix'} items={suggestions} />
        )}
      </div>
      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
    </div>
  );
}
