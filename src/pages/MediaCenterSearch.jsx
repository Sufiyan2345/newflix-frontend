import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { API } from '../api';
import useBranding from '../hooks/useBranding';
import {
  Masthead, MediaCenterFooter, Magnifier, NMark, NEWS,
  toPressTitle,
} from './MediaCenter';

// ============================================================================
// /p/media-center/search?term=… — the screen both search boxes on the Media
// Center open.
//
// The reference is media.netflix.com/en/search?term=weak+hero, and it reads as
// a single column with a rail:
//
//   masthead        the SAME bar the grid and title screens use, imported — so
//                   its language / country / Resources menus have one
//                   implementation across the whole press site
//   search band     "Search Results" at 40px/50px over a full-width field that
//                   already holds the term, so the term stays visible and
//                   editable without scrolling back up
//   rail            All / Titles / News, each with a glyph and a chevron; the
//                   active row carries the red left bar (#e50914)
//   result bar      `1 - 20 of N results for "term"` with ‹ page › either side
//                   of the centre — repeated under the grid, as on the reference
//   grid            256x359 tiles; titles print the boxshot, news prints the
//                   still over a caption bar (meta, headline, Read More)
//   footer          the same three-column press footer
//
// The term lives in the query string, so a result set is linkable and the back
// button walks the history of searches — that is the reference's own contract
// (/en/search?term=…), so this is a route, not a filter on the grid page.
//
// Titles come from the app's existing /tmdb/search endpoint (the same search the
// member navbar runs); news is matched against this site's own newsroom set.
// ============================================================================

// The reference paginates at 20 and prints the window in that exact shape.
const PAGE_SIZE = 20;

// The three rail rows, in the reference's order.
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'titles', label: 'Titles' },
  { id: 'news', label: 'News' },
];

// The rail's three glyphs, drawn flat and single-colour to match the chips.
function RailGlyph({ id }) {
  const common = {
    viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none',
    'aria-hidden': 'true', focusable: 'false',
  };
  if (id === 'titles') {
    return (
      <svg {...common}>
        <rect x="2.5" y="4.5" width="19" height="15" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 9h19" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6.8h.01M10 6.8h.01M13 6.8h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'news') {
    return (
      <svg {...common}>
        <path d="M5 3.5h9.5L19 8v12.5H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3.5V8h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 12h8M8 15.5h8M8 19h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="8.5" y="3.5" width="12" height="12" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 18.5v1a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V9.5A1.5 1.5 0 0 1 5 8h1"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Chevron pointing right, for the rail rows.
function RailChevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9 6l6 6-6 6V6z" />
    </svg>
  );
}

// The two pager arrows, stroked like the reference's chevrons.
function PageArrow({ dir, disabled, onClick, label }) {
  return (
    <button
      type="button"
      className="mcsr-arrow"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"
        style={dir === 'next' ? { transform: 'rotate(180deg)' } : undefined}>
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// The live title hits. `/tmdb/search` is the endpoint the member navbar already
// calls, so this adds no new API — it reshapes the same rows through
// toPressTitle, which is what puts a boxshot and a release date on each tile.
//
// Returns { status, items }. `status` is 'idle' before a term is typed,
// 'loading' while a request is in flight, then 'ready' either way — a TMDB
// outage lands on 'ready' with an empty list and the page says so, rather than
// spinning forever.
// ---------------------------------------------------------------------------
function usePressSearch(term) {
  const [state, setState] = useState({ status: 'idle', items: [] });

  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setState({ status: 'idle', items: [] });
      return undefined;
    }

    let alive = true;
    setState({ status: 'loading', items: [] });
    API.get('/tmdb/search', { params: { q }, softFail: true })
      .then(({ data }) => {
        if (!alive) return;
        const items = (data?.items || []).map(toPressTitle).filter((item) => item.art);
        setState({ status: 'ready', items });
      })
      .catch(() => {
        if (alive) setState({ status: 'error', items: [] });
      });
    return () => { alive = false; };
  }, [term]);

  return state;
}
// The newsroom hits. NEWS is this site's own newsroom set, so a term is matched
// against the headline and the region line — the two fields the card prints.
// The region is what stands in for the reference's dateline, because this set
// genuinely carries regions and no dates.
function matchNews(term) {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return NEWS
    .filter((story) => `${story.headline} ${story.region}`.toLowerCase().includes(q))
    .map((story, i) => ({ ...story, date: story.region, key: `news-${i}` }));
}

// ---------------------------------------------------------------------------
// The result bar: `1 - 20 of N results for "term"` with ‹ page ›. It prints the
// same window the reference does and appears both above and below the grid,
// which is where the reference puts it.
// ---------------------------------------------------------------------------
function ResultBar({ from, to, total, term, page, pageCount, onPage }) {
  return (
    <div className="mcsr-bar">
      <p className="mcsr-count">
        {total > 0 ? (
          <>
            {from} - {to} of {total} results for <strong>&quot;{term}&quot;</strong>
          </>
        ) : (
          <>0 results for <strong>&quot;{term}&quot;</strong></>
        )}
      </p>
      <div className="mcsr-pager">
        <PageArrow
          dir="prev"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          label="Previous page"
        />
        <span className="mcsr-page" aria-current="page">{page}</span>
        <PageArrow
          dir="next"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          label="Next page"
        />
      </div>
    </div>
  );
}

// A title hit: the same 256x359 boxshot tile the Media Center grid prints, with
// the release date in the caption bar underneath.
function TitleHit({ item, onOpen }) {
  return (
    <div className="mcsr-card">
      <button
        type="button"
        className="mcsr-card-link"
        onClick={() => onOpen(item)}
        aria-label={`${item.title}, ${item.formats.join(' and ')}, releasing ${item.date}`}
      >
        <span className={`mcsr-card-art${item.art ? '' : ' is-keyart'}`}>
          {item.art
            ? <img src={item.art} alt="" loading="lazy" draggable="false" />
            : <span className="mcsr-keyart"><NMark /><span className="mcsr-keyart-name">{item.title}</span></span>}
        </span>
      </button>
      <p className="mcsr-card-meta">{item.date}</p>
    </div>
  );
}

// A newsroom hit: the still on top, then the caption bar the reference prints —
// a glyph, the dateline, the headline and "Read More".
function NewsHit({ story }) {
  return (
    <div className="mcsr-card is-news">
      <a
        className="mcsr-news-art"
        href={story.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img src={story.image} alt="" loading="lazy" draggable="false" />
      </a>
      <div className="mcsr-news-body">
        <span className="mcsr-news-glyph">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <rect x="2.5" y="5" width="19" height="14" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6.5 9.5h11M6.5 12.5h11M6.5 15.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <p className="mcsr-news-date">{story.date}</p>
        <h3 className="mcsr-news-headline">{story.headline}</h3>
        <a className="mcsr-news-more" href={story.href} target="_blank" rel="noopener noreferrer">
          Read More
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The page.
//
// The URL owns the term: typing writes it into the query string and submitting
// the field pushes a new entry, so Back walks the searches and a result set is
// shareable. The field is kept as local state so a half-typed term does not
// re-query on every keystroke — the request only fires on submit, and again
// whenever the URL's term actually changes.
// ---------------------------------------------------------------------------
export default function MediaCenterSearch() {
  const branding = useBranding();
  const siteName = branding?.siteName || 'Newflix';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const term = params.get('term') || '';
  const [draft, setDraft] = useState(term);
  const category = params.get('category');
  const filter = category === 'titles' ? 'titles' : category === 'news' ? 'news' : 'all';
  const [page, setPage] = useState(1);

  const { status, items: titleHits } = usePressSearch(term);
  const newsHits = useMemo(() => matchNews(term), [term]);

  // The field follows the URL whenever the URL changes underneath it — a Back
  // step, or a term arriving from the masthead on another screen.
  useEffect(() => { setDraft(term); }, [term]);

  // A new term, or a new rail filter, always restarts at page one; otherwise
  // page 3 of the old result set would be showing the new set's page 3.
  useEffect(() => { setPage(1); }, [term, filter]);

  const runSearch = (event) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set('term', next);
    nextParams.set('countryCode', 'PK');
    nextParams.delete('newsType');
    nextParams.append('newsType', 'blogs');
    nextParams.append('newsType', 'pressRelease');
    if (filter === 'all') nextParams.delete('category');
    else nextParams.set('category', filter);
    navigate(`/p/media-center/search?${nextParams.toString()}`);
  };

  // The masthead's magnifier searches from here too — same term, same screen.
  const searchFromNav = (next) => {
    if (!next) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set('term', next.trim());
    nextParams.set('countryCode', 'PK');
    nextParams.delete('newsType');
    nextParams.append('newsType', 'blogs');
    nextParams.append('newsType', 'pressRelease');
    navigate(`/p/media-center/search?${nextParams.toString()}`);
  };

  const selectFilter = (nextFilter) => {
    const nextParams = new URLSearchParams(params);
    if (nextFilter === 'all') nextParams.delete('category');
    else nextParams.set('category', nextFilter);
    if (!nextParams.has('countryCode')) nextParams.set('countryCode', 'PK');
    if (!nextParams.has('newsType')) {
      nextParams.append('newsType', 'blogs');
      nextParams.append('newsType', 'pressRelease');
    }
    setParams(nextParams);
  };

  const openTitle = (item) => navigate(
    `/p/media-center/title/${encodeURIComponent(item.key)}`,
    { state: { pressTitle: item } },
  );

  // "All" interleaves the two kinds so neither type is buried under the other,
  // which is what the reference's mixed grid does.
  const results = useMemo(() => {
    if (filter === 'titles') return titleHits.map((item) => ({ kind: 'title', item }));
    if (filter === 'news') return newsHits.map((story) => ({ kind: 'news', story }));
    return [
      ...titleHits.map((item) => ({ kind: 'title', item })),
      ...newsHits.map((story) => ({ kind: 'news', story })),
    ];
  }, [filter, titleHits, newsHits]);

  const total = results.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, total);
  const visible = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const loading = status === 'loading';

  return (
    <div className="mc-page mcsr-search-page">
      <Masthead siteName={siteName} onSearch={searchFromNav} />

      <header className="mcsr-band">
        <div className="mcsr-band-inner">
          <h1 className="mcsr-heading">Search Results</h1>
          <form className="mcsr-field" role="search" onSubmit={runSearch}>
            <Magnifier size={20} />
            <input
              type="search"
              value={draft}
              placeholder="Search for Netflix titles and news"
              aria-label="Search for Netflix titles and news"
              onChange={(event) => setDraft(event.target.value)}
            />
          </form>
        </div>
      </header>

      <div className="mcsr-body">
        <nav className="mcsr-rail" aria-label="Filter results">
          <ul className="mcsr-rail-list">
            {FILTERS.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={`mcsr-rail-row${filter === f.id ? ' is-on' : ''}`}
                  aria-current={filter === f.id ? 'true' : undefined}
                  onClick={() => selectFilter(f.id)}
                >
                  <RailGlyph id={f.id} />
                  <span className="mcsr-rail-label">{f.label}</span>
                  <RailChevron />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="mcsr-main">
          {status === 'idle' ? (
            <p className="mcsr-empty">
              Search the Media Center for a title, a series or a newsroom story.
            </p>
          ) : status === 'error' ? (
            <p className="mcsr-empty" role="alert">
              Search is temporarily unavailable. Please try again.
            </p>
          ) : (
            <>
              <ResultBar
                from={from} to={to} total={total} term={term}
                page={safePage} pageCount={pageCount} onPage={setPage}
              />

              {loading ? (
                <div className="mcsr-grid">
                  <PageLoadingSkeleton variant="grid" cardCount={5} />
                </div>
              ) : total === 0 ? (
                <p className="mcsr-empty" role="status">
                  No results for &quot;{term}&quot;. Try a different title or a broader term.
                </p>
              ) : (
                <div className="mcsr-grid">
                  {visible.map((row) => (row.kind === 'news'
                    ? <NewsHit key={row.story.key} story={row.story} />
                    : <TitleHit key={row.item.key} item={row.item} onOpen={openTitle} />
                  ))}
                </div>
              )}

              {!loading && total > 0 && (
                <ResultBar
                  from={from} to={to} total={total} term={term}
                  page={safePage} pageCount={pageCount} onPage={setPage}
                />
              )}
            </>
          )}
        </main>
      </div>

      <MediaCenterFooter />
    </div>
  );
}
