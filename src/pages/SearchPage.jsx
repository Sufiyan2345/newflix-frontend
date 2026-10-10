import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const titleName = (item) => item?.title || item?.name || '';

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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const dq = useDebounced(q);
  const [items, setItems] = useState(null);
  const [source, setSource] = useState('tmdb'); // where results came from
  const [suggestions, setSuggestions] = useState([]);
  const [suggestSource, setSuggestSource] = useState('catalogue');
  const [relatedTitle, setRelatedTitle] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [exploreTitles, setExploreTitles] = useState([]);
  const [tmdbDetail, setTmdbDetail] = useState(null);

  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  useEffect(() => {
    if (!dq) {
      setItems([]);
      setRelatedTitle(null);
      setRelatedItems([]);
      setExploreTitles([]);
      return undefined;
    }
    setItems(null);
    setRelatedTitle(null);
    setRelatedItems([]);
    setExploreTitles([]);
    let cancelled = false;

    const normalizeTitle = (title) => String(title || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();

    Promise.all([
      API.get(`/tmdb/search?q=${encodeURIComponent(dq)}`).catch(() => ({ data: { items: [] } })),
      API.get(`/titles/search?q=${encodeURIComponent(dq)}`).catch(() => ({ data: { items: [] } })),
    ]).then(([tmdbResponse, catalogueResponse]) => {
      if (cancelled) return;
      const tmdbItems = tmdbResponse.data.items || [];
      const catalogueItems = catalogueResponse.data.items || [];
      if (tmdbItems.length) {
        setItems(tmdbItems);
        setSource('tmdb');
      } else {
        setItems(catalogueItems);
        setSource('catalogue');
      }

      const exactMatch = tmdbItems.find((item) => normalizeTitle(titleName(item)) === normalizeTitle(dq));
      if (!exactMatch) return;

      const [, type, id] = String(exactMatch._id || '').split('-');
      if (!['movie', 'tv'].includes(type) || !/^\d+$/.test(id || '')) return;

      setRelatedTitle({
        item: exactMatch,
        available: catalogueItems.some((item) => normalizeTitle(titleName(item)) === normalizeTitle(titleName(exactMatch))),
      });

      API.get(`/tmdb/detail/${type}/${id}`)
        .then(({ data }) => {
          if (cancelled) return;
          const recommendations = data.item?.recommendations || [];
          setRelatedItems(recommendations);
          const alternatives = tmdbItems.filter((item) => item._id !== exactMatch._id);
          const titleSuggestions = [...alternatives, ...recommendations]
            .filter((item, index, all) => item._id !== exactMatch._id
              && all.findIndex((candidate) => candidate._id === item._id) === index)
            .slice(0, 10);
          setExploreTitles(titleSuggestions);
        })
        .catch(() => {
          if (cancelled) return;
          const alternatives = tmdbItems.filter((item) => item._id !== exactMatch._id).slice(0, 10);
          setExploreTitles(alternatives);
        });
    }).catch(() => {
      if (!cancelled) setItems([]);
    });
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="grid-page search-page">
        {!q && <h2>{t('Search Newflix')}</h2>}
        {items === null && <PageLoadingSkeleton variant="grid" cardCount={6} />}
        {items && items.length > 0 && (
          <>
            {relatedTitle && (relatedItems.length > 0 || exploreTitles.length > 0) && (
              <section className="search-related" aria-label="Related titles">
                {exploreTitles.length > 0 && (
                  <div className="search-more-explore">
                    <span className="search-more-label">More to explore:</span>
                    {exploreTitles.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className="search-more-link"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(titleName(item))}`)}
                      >
                        {titleName(item)}
                      </button>
                    ))}
                  </div>
                )}
                {relatedItems.length > 0 && (
                  <>
                    <h2 className="search-related-heading">
                      {relatedTitle.available
                        ? `More like “${titleName(relatedTitle.item)}”`
                        : `We don't have “${titleName(relatedTitle.item)}” but you might like:`}
                    </h2>
                    <Row title="" items={relatedItems} />
                  </>
                )}
              </section>
            )}
            <SearchResultGrid items={items} />
          </>
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
