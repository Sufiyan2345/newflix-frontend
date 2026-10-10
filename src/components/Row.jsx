import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js/dist/hls.light.mjs';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { isTmdbInList, isTmdbLiked, toggleTmdbLike, toggleTmdbList } from '../utils/tmdbList';
import { fmtLeft, resumeLine } from './ContinueWatchingModal';
import { IconPlay, IconPlus, IconCheck, IconClock, IconInfo, IconThumbUp, IconChevronDown } from './Icons';
import { openMobileTitle } from '../utils/mobileTitle';
import { useSiteTranslation } from '../utils/siteTranslation';
import { cardImage, hiRes } from '../utils/imageUrl';
import useIsMobile, { MOBILE_MAX_WIDTH } from '../hooks/useIsMobile';
import { matchPercent } from '../utils/matchPercent';

const fmtDur = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}h ${min % 60}m` : `${min}m`;
};

const fmtTime = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

// Top-right corner chip: "1 Seasons" for series (real Season count from the API),
// "1h 51m" for movies — the metadata Netflix prints on the artwork itself.
// Accepts both 'series' (catalog) and 'tv' (TMDB) type names.
const isSeriesType = (t) => t === 'series' || t === 'tv';

const cornerChip = (item) => {
  if (isSeriesType(item.type)) {
    const n = item.seasonsCount ?? item.seasons?.length ?? 0;
    return n > 0 ? `${n} Season${n > 1 ? 's' : ''}` : '';
  }
  return item.durationMinutes > 0 ? fmtDur(item.durationMinutes) : '';
};

// `showElapsed: false` drops the "12:04" label for the Continue Watching tiles —
// the Netflix reference prints only the red bar there, never a timestamp.
const ProgressLine = ({ progress, className = 'progress-bar', showElapsed = true }) => {
  if (!progress || !progress.durationSeconds) return null;
  const pct = Math.min(100, (progress.progressSeconds / progress.durationSeconds) * 100);
  if (!pct) return null;
  return (
    <div className={className}>
      <span style={{ width: `${pct}%` }} />
      {showElapsed && <i className="progress-elapsed">{fmtTime(progress.progressSeconds)}</i>}
    </div>
  );
};

const Ribbon = ({ item, bottom = false, top10 = false }) => {
  if (!item.isNewRelease) return null;
  // The Top 10 rail says "New Season" (reference image), the wide rails say
  // "New Episode" — Netflix words them differently per surface.
  const label = isSeriesType(item.type) ? (top10 ? 'New Season' : 'New Episode') : 'Recently added';
  if (bottom) {
    return (
      <span className="card-ribbon bottom">
        <span className="ribbon-red">{label}</span>
        <span className="ribbon-white">Watch Now</span>
      </span>
    );
  }
  // Small centered red pill — exactly like the Netflix reference image
  return <span className={`card-ribbon-pill ${isSeriesType(item.type) ? 'episode' : ''}`}>{label}</span>;
};

// TMDB has titles with no artwork at all (obscure/older films — e.g. "Tom Stone").
// Netflix prints the title on a dark branded tile instead of a broken image — do
// the same, and swap to that tile if the image URL 404s at runtime.
export function CardArt({ src, fallbackSrc = '', alt, title, className = '', eager = false }) {
  const [failedSources, setFailedSources] = useState([]);
  useEffect(() => setFailedSources([]), [src, fallbackSrc]);
  const currentSrc = src && !failedSources.includes(src)
    ? src
    : fallbackSrc && !failedSources.includes(fallbackSrc)
      ? fallbackSrc
      : '';
  if (!currentSrc) {
    const fallbackTitle = title || alt || 'Artwork unavailable';
    return (
      <div className="card-art-placeholder" role="img" aria-label={fallbackTitle}>
        <span>{fallbackTitle}</span>
      </div>
    );
  }
  return (
    <img
      src={cardImage(currentSrc)}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding={eager ? 'sync' : 'async'}
      onError={() => setFailedSources((sources) => [...sources, currentSrc])}
    />
  );
}

const tmdbLogoCache = new Map();
const tmdbLogoRequests = new Map();

export function TmdbArtworkLogo({ item, variant = 'card', showTitleFallback = false, onLogoResult }) {
  const containerRef = useRef(null);
  const id = String(item?._id || '');
  const [, type, tmdbId] = id.split('-');
  const valid = ['movie', 'tv'].includes(type) && /^\d+$/.test(tmdbId || '');
  const [logoUrl, setLogoUrl] = useState(() => tmdbLogoCache.get(id) || '');

  useEffect(() => {
    setLogoUrl(tmdbLogoCache.get(id) || '');
    if (!valid || !containerRef.current) return undefined;
    let active = true;
    const loadLogo = () => {
      if (tmdbLogoCache.has(id)) {
        const cachedLogo = tmdbLogoCache.get(id);
        setLogoUrl(cachedLogo);
        onLogoResult?.(Boolean(cachedLogo));
        return;
      }
      if (!tmdbLogoRequests.has(id)) {
        tmdbLogoRequests.set(
          id,
          API.get(`/tmdb/title-media/${type}/${tmdbId}`, { softFail: true })
            .then(({ data }) => data?.logoUrl || '')
            .catch(() => '')
            .then((url) => {
              tmdbLogoCache.set(id, url);
              tmdbLogoRequests.delete(id);
              return url;
            }),
        );
      }
      tmdbLogoRequests.get(id).then((url) => {
        if (active) {
          setLogoUrl(url);
          onLogoResult?.(Boolean(url));
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadLogo();
    }, { rootMargin: '200px' });
    observer.observe(containerRef.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [id, type, tmdbId, valid, onLogoResult]);

  return (
    <span className={`tmdb-artwork-logo-slot${variant === 'modal' ? ' tmdb-modal-logo-slot' : ''}${variant === 'continue-watching' ? ' tmdb-cw-logo-slot' : ''}${variant === 'hover' ? ' tmdb-hover-logo-slot' : ''}${variant === 'landing' ? ' tmdb-landing-logo-slot' : ''}`} ref={containerRef} aria-hidden="true">
      {logoUrl
        ? <img
          className="tmdb-artwork-logo"
          src={variant === 'card' ? cardImage(logoUrl) : hiRes(logoUrl)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => {
            tmdbLogoCache.set(id, '');
            setLogoUrl('');
            onLogoResult?.(false);
          }}
        />
        : showTitleFallback && (
        <span className={variant === 'hover' ? 'tmdb-hover-title-fallback' : variant === 'landing' ? 'tmdb-landing-title-fallback' : 'tmdb-cw-title-fallback'}>
            {item?.title}
          </span>
        )}
    </span>
  );
}

// ---------- Top 10 rank numeral ----------
// Netflix draws the rank as a large OUTLINED numeral with the poster OVERLAPPING
// it — the card sits inside the right half of the digit, not beside it.
//
// Measured off the reference image, relative to the poster (P):
//   numeral ink   ~0.95 x P wide, and its cap top sits a hair ABOVE the artwork
//   poster left   ~0.58 x numeral width in from the digit's left edge
//   outline       thin light-grey stroke over a near-black fill
//
// The box aspect and the viewBox aspect are kept identical, and `textLength`
// pins the glyph to the full viewBox width, so the digit neither drifts with
// font loading nor stretches when Bebas Neue has not arrived yet (the
// preserveAspectRatio="none" would otherwise squash a narrow condensed digit).
// Single digit 0.615:1, double digit 0.891:1 (both digits visible at #10).
function Top10Rank({ rank }) {
  const doubleDigit = rank >= 10;
  return (
    <span className={`top10-num${doubleDigit ? ' top10-double-digit' : ''}`} aria-hidden="true">
      <svg viewBox={doubleDigit ? '0 0 252 283' : '0 0 174 283'} preserveAspectRatio="xMidYMid meet" focusable="false">
        <text
          x="0" y="246"
          fontSize={doubleDigit ? 300 : 320}
          textLength={doubleDigit ? '232' : '150'}
          lengthAdjust="spacingAndGlyphs"
          fill="#0b0b0b"
          stroke="#f5f5f5"
          strokeWidth="3.2"
          strokeLinejoin="round"
          paintOrder="stroke fill"
          fontFamily="'Arial Black','Impact','Bebas Neue','Arial Narrow',Arial,sans-serif"
          fontWeight="900"
        >{rank}</text>
      </svg>
    </span>
  );
}

// ---------- Continue Watching (Netflix-exact) ----------
// `fmtLeft` / `resumeLine` now live in ContinueWatchingModal.jsx and are imported
// above, so the row's lead caption and the modal can never drift apart.

// The lead tile (first = most recently watched) is a wide 16:9 frame ringed in
// white and is the ONLY one that prints its caption; the rest are 2:3 posters,
// exactly like the reference row.
function ContinueWatchingCard({ item, lead = false, onOpen }) {
  const resume = item._resume || null;

  // The lead is a landscape frame, the posters are 2:3 — so pick the art that
  // actually matches the box instead of reusing one order for both.
  const art = lead ? (item.bannerUrl || item.posterUrl) : (item.posterUrl || item.bannerUrl);
  const showArtworkLogo = lead && Boolean(item.bannerUrl) && item.bannerUrl !== item.posterUrl;
  const year = item.releaseYear || String(item.releaseDate || '').slice(0, 4);
  const genres = normalizeGenreList(item.genres);

  // Clicking a Continue Watching tile NEVER starts playback any more. It opens
  // the resume sheet (artwork, episode, how much is left, synopsis) and the
  // viewer presses Resume there. Landing straight in fullscreen video gave no
  // context and no way back to the row. Promoting a tile to the lead slot is
  // still reachable — the row arrows do that.
  const activate = () => onOpen(item);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      e.currentTarget.parentElement.children[
        Array.prototype.indexOf.call(e.currentTarget.parentElement.children, e.currentTarget) + direction
      ]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  return (
    <div
      className={lead ? 'cw-lead' : 'cw-card'}
      data-cw-id={item._id}
      role="button"
      tabIndex={0}
      aria-label={`${item.title}${year ? `, ${year}` : ''}`}
      onClick={activate}
      onKeyDown={onKeyDown}
    >
      <div className="cw-art">
        <CardArt src={art} alt={item.title} title={item.title} />
        {showArtworkLogo && String(item._id || '').startsWith('tmdb-') && (
          <TmdbArtworkLogo item={item} variant="continue-watching" showTitleFallback />
        )}
        {resume && <ProgressLine progress={resume} className="cw-progress" showElapsed={false} />}
      </div>
      {lead && (
        <div className="cw-meta">
          <span className="cw-line1">{resumeLine(item)}</span>
          <span className="cw-line2">{fmtLeft((resume.durationSeconds || 0) - (resume.progressSeconds || 0))}</span>
        </div>
      )}
      <div className="cw-details" aria-hidden="true">
        <div className="cw-details-meta">
          {year && <span>{year}</span>}
          {item.ageRating && <span className="cw-rating">{item.ageRating}</span>}
          {genres.map((genre) => <span key={genre}>{genre}</span>)}
        </div>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  );
}

export function TitleCard({ item, top10Index = null, progress = null, eager = false, onHover }) {
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const isTmdb = String(item._id || '').startsWith('tmdb-');
  const [usePosterArtwork, setUsePosterArtwork] = useState(
    () => isTmdb && !tmdbLogoCache.get(String(item._id || '')),
  );
  const handleLogoResult = useCallback((hasLogo) => {
    setUsePosterArtwork(!hasLogo && Boolean(item.posterUrl));
  }, [item.posterUrl]);
  const src = top10Index !== null || usePosterArtwork
    ? (item.posterUrl || item.bannerUrl)
    : (item.bannerUrl || item.posterUrl);
  const fallbackSrc = src === item.posterUrl ? item.bannerUrl : item.posterUrl;
  const chip = cornerChip(item);

  const open = () => {
    // A phone has no hover, so the desktop preview card is unreachable and a tap
    // used to throw the viewer straight onto a detail page — losing the rail they
    // were reading. Netflix answers a tap on a tile with the title SHEET, so that
    // is what happens here; the desktop path below is untouched.
    if (isMobile) { openMobileTitle(item); return; }
    // Continue-Watching/history cards carry the exact resume route. TMDB items
    // without one still open the in-page Netflix-style detail modal.
    if (isTmdb && item.watchRoute) { nav(item.watchRoute); return; }
    if (isTmdb) { window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item })); return; }
    if (progress && progress.progressSeconds > 0) nav(`/watch/${item._id}`);
    else nav(`/title/${item.slug}`);
  };

  if (top10Index !== null) {
    return (
      <div className="card-top10">
        <Top10Rank rank={top10Index + 1} />
        <div
          className="card top10-card"
          onClick={open}
          onMouseEnter={(e) => onHover?.(item, e.currentTarget)}
          onMouseMove={(e) => onHover?.(item, e.currentTarget, undefined, true)}
        >
          <div className="card-art">
            <CardArt src={src} fallbackSrc={fallbackSrc} alt={item.title} title={item.title} eager={eager} />
            <img className="card-brand-badge" src="/Netflix.png" alt="Netflix" />
            <Ribbon item={item} top10 />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      onClick={open}
      onMouseEnter={(e) => onHover?.(item, e.currentTarget)}
      onMouseMove={(e) => onHover?.(item, e.currentTarget, undefined, true)}
    >
      <div className="card-art">
        <CardArt
          src={src}
          fallbackSrc={fallbackSrc}
          alt={item.title}
          className={usePosterArtwork ? 'card-art-original-poster' : ''}
          eager={eager}
        />
        <img className="card-brand-badge" src="/Netflix.png" alt="Netflix" />
        {isTmdb && <TmdbArtworkLogo item={item} onLogoResult={handleLogoResult} />}
        {chip && <span className="card-chip">{chip}</span>}
        <Ribbon item={item} />
        {progress && progress.durationSeconds > 0 && <ProgressLine progress={progress} className="card-progress" />}
      </div>
    </div>
  );
}

// Browse / search / My List grid card — full 2:3 box art (see .grid .grid-card in
// grid.css) plus the TMDB metadata printed underneath the artwork, so a category
// page (Horror, Comedies, Korean Dramas…) reads like Netflix's genre browse grid
// instead of an unlabelled wall of images.
export function GridCard({ item, showArtworkLogo = true }) {
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const isTmdb = String(item._id || '').startsWith('tmdb-');
  const chip = cornerChip(item);
  // TMDB titles carry `type: 'movie' | 'tv'`; catalogue titles carry 'movie' | 'series'.
  const typeLabel = isSeriesType(item.type) ? 'Series' : 'Movie';
  const year = item.releaseYear || String(item.releaseDate || '').slice(0, 4);
  const match = matchPercent(item);

  const open = () => {
    // Same phone behaviour as the rail cards: a tap opens the title sheet.
    if (isMobile) { openMobileTitle(item); return; }
    if (isTmdb) {
      window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item }));
      return;
    }
    nav(`/title/${item.slug}`);
  };
  return (
    <div className="card grid-card" onClick={open}>
      <div className="card-art">
        <CardArt src={item.posterUrl || item.bannerUrl} alt={item.title} title={item.title} />
        <img className="card-brand-badge" src="/Netflix.png" alt="Netflix" />
        {isTmdb && showArtworkLogo && <TmdbArtworkLogo item={item} />}
        {chip && <span className="card-chip">{chip}</span>}
      </div>
      <div className="grid-card-caption">
        <span className="grid-card-title">{item.title}</span>
        {(typeLabel || year || match > 0) && (
          <span className="grid-card-meta">
            <em className="grid-card-type">{typeLabel}</em>
            {year ? <span>{year}</span> : null}
            {match > 0 ? <span className="grid-card-match">{match}% Match</span> : null}
          </span>
        )}
      </div>
    </div>
  );
}

const normalizeGenreList = (genres = []) => {
  const items = Array.isArray(genres) ? genres : [];
  const unique = [];
  const seen = new Set();
  for (const g of items) {
    const name = typeof g === 'string' ? g : (g && (g.name || g._id));
    if (!name || seen.has(String(name))) continue;
    seen.add(String(name));
    unique.push(name);
  }
  return unique.slice(0, 3);
};

// "More Like This" tile — the tall 3-up card inside the title modal (design
// reference screenshot 4): artwork + chip, meta row with the My List button, synopsis.
export function MoreLikeThisCard({ item }) {
  const nav = useNavigate();
  const { activeProfile } = useAuth();
  const isMobile = useIsMobile();
  const isTmdb = String(item._id || '').startsWith('tmdb-');
  const [inList, setInList] = useState(() => isTmdb ? isTmdbInList(activeProfile?._id, item._id) : false);
  const [busy, setBusy] = useState(false);
  const chip = cornerChip(item);

  // Keep the +/✓ state synced with every other card for this title
  useEffect(() => {
    if (!isTmdb) return;
    const onListChange = (e) => { if (e.detail?.itemId === item._id) setInList(e.detail.inList); };
    window.addEventListener('tmdb-list-changed', onListChange);
    return () => window.removeEventListener('tmdb-list-changed', onListChange);
  }, [isTmdb, item._id]);

  const toggleList = async (e) => {
    e.stopPropagation();
    // TMDB tiles use the local per-profile list; catalogue tiles use the server watchlist
    if (isTmdb) { setInList(toggleTmdbList(activeProfile?._id, item)); return; }
    if (busy || !activeProfile) return;
    setBusy(true);
    const nextInList = !inList;
    setInList(nextInList);
    try {
      if (!nextInList) await API.delete(`/user/watchlist/${item._id}`);
      else await API.post('/user/watchlist', { titleId: item._id });
    } catch { setInList(!nextInList); }
    finally { setBusy(false); }
  };

  return (
    <div className="mlt-card" onClick={() => {
      if (isMobile) { openMobileTitle(item); return; }
      if (item.tmdbUrl) { window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item })); return; }
      nav(`/title/${item.slug}`);
    }}>
      <div className="mlt-art">
        <CardArt src={item.bannerUrl || item.posterUrl} alt={item.title} title={item.title} />
        {isTmdb && <TmdbArtworkLogo item={item} />}
        <img className="card-brand-badge" src="/Netflix.png" alt="Netflix" />
        {chip && <span className="card-chip">{chip}</span>}
        <Ribbon item={item} bottom />
      </div>
      <div className="mlt-body">
        <div className="mlt-meta">
          {matchPercent(item) > 0 && <span className="match">{matchPercent(item)}% match</span>}
          <span className="age">{item.ageRating || '13+'}</span>
          {item.releaseYear ? <span>{item.releaseYear}</span> : null}
          <button className={`mlt-add ${inList ? 'on' : ''}`} onClick={toggleList}
            title={inList ? 'Remove from My List' : 'Add to My List'} disabled={busy}>
            {inList ? <IconCheck size={18} /> : <IconPlus size={18} />}
          </button>
        </div>
        <p className="mlt-desc">{item.description}</p>
      </div>
    </div>
  );
}

// ---------- Hover preview trailer ----------
// The reference card plays a short MUTED teaser over the artwork while the pointer
// rests on the tile. Two knobs matter for the look: it always starts from 0, and it
// only ever shows the first PREVIEW_SECONDS of the clip before rewinding — a full
// trailer would keep running long past the few seconds the card is on screen.
const PREVIEW_SECONDS = 4;

// Mirrors the .hover-card box in hover.css. The card no longer has fixed dimensions —
// it is sized from the hovered tile's expanded rect at render time (see cardW/cardH)
// — so there is no constant here that could drift out of sync with the CSS.

// How far a rail tile grows on hover (see --sf-card-scale in core.css). Read from
// CSS so the number has ONE source of truth — the popup has to be positioned
// against the tile's *expanded* box, and a hardcoded copy here would silently drift
// the moment the scale is retuned. Falls back to the CSS default.
let hoverScaleCache = null;
const cardHoverScale = () => {
  if (hoverScaleCache === null) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--sf-card-scale');
    const parsed = parseFloat(raw);
    hoverScaleCache = Number.isFinite(parsed) && parsed > 1 ? parsed : 1.12;
  }
  return hoverScaleCache;
};

// The box a tile WILL occupy once its hover transition finishes.
//
// On mouseenter the scale transition has not run yet, so getBoundingClientRect()
// still reports the small box — anchoring the popup to it would drop the popup on
// top of the tile. offsetWidth/Height are the untransformed layout box, and the
// centre of a symmetric scale never moves, so re-applying the target scale to the
// LAYOUT size around the live centre yields the exact final rect.
const expandedCardRect = (el, scale) => {
  const live = el.getBoundingClientRect();
  const width = el.offsetWidth || live.width;
  const height = el.offsetHeight || live.height;
  const cx = live.left + live.width / 2;
  const cy = live.top + live.height / 2;
  return {
    left: cx - (width * scale) / 2,
    top: cy - (height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
};

// A trailer is only previewable in a <video> when the URL points at a real media
// file. Admin-uploaded clips are mp4/webm (Cloudinary included) and HLS playlists
// are .m3u8; those play through <HoverTrailer> below.
const resolvePreviewSource = (url) => {
  const value = String(url || '').trim();
  if (!value) return null;
  if (/\.m3u8(\?.*)?$/i.test(value)) return { kind: 'hls', url: value };
  if (/\.(mp4|m4v|webm|mov|mkv|ogv)(\?.*)?$/i.test(value)) return { kind: 'file', url: value };
  return null;
};

// TMDB rails carry no trailerUrl (normalize() never asks TMDB for `videos`), so the
// card fetches the teaser itself the moment it opens. Sweeping a rail would
// otherwise fire one request per tile, so results are memoised for the session and
// in-flight requests are shared — hovering back and forth costs nothing.
const trailerUrlCache = new Map(); // tmdb id -> { url, runtime, ageRating }
const trailerPending = new Map(); // tmdb id -> Promise

const fetchTmdbTrailerUrl = (item) => {
  const id = item?._id;
  if (typeof id !== 'string' || !id.startsWith('tmdb-')) return Promise.resolve(null);
  if (trailerUrlCache.has(id)) return Promise.resolve(trailerUrlCache.get(id));
  if (trailerPending.has(id)) return trailerPending.get(id);

  const [, type, tmdbId] = id.split('-');
  // softFail: a missing teaser is not a page-level failure. The endpoint answers 502
  // for a title with no usable video, and any backend restart turns this into a plain
  // network error — either must degrade to the poster, not to the fatal error screen.
  const request = API.get(`/tmdb/trailer/${type}/${tmdbId}`, { softFail: true })
    .then(({ data }) => {
      // The same call carries runtime + the real certification, both of which TMDB
      // omits from list endpoints — this is what fills in "1h 41m" and "PG".
      const meta = {
        url: typeof data?.url === 'string' ? data.url : '',
        runtime: Number(data?.runtime) || 0,
        ageRating: typeof data?.ageRating === 'string' ? data.ageRating : '',
      };
      trailerUrlCache.set(id, meta);
      return meta;
    })
    .catch(() => {
      // Cache the failure too: a title whose trailer cannot be resolved must not
      // be re-requested every time the pointer crosses it.
      const meta = { url: '', runtime: 0, ageRating: '' };
      trailerUrlCache.set(id, meta);
      return meta;
    })
    .finally(() => { trailerPending.delete(id); });

  trailerPending.set(id, request);
  return request;
};

// Plays `source` muted and inline, looping only the first PREVIEW_SECONDS of it.
// `onFail` fires for any unrecoverable error so the caller can swap back to the
// still artwork instead of leaving a black rectangle.
function HoverTrailer({ source, onFail }) {
  const videoRef = useRef(null);
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !source) return undefined;
    let disposed = false;
    let hls = null;

    // Autoplay policies only permit a silent, inline start.
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.loop = false; // the clip window is restarted by hand so it stays ~4s
    el.currentTime = 0;

    const play = () => {
      if (disposed) return;
      const attempt = el.play();
      if (attempt?.catch) attempt.catch(() => {});
    };

    // Re-anchor the clip at 4s and keep going: the card may stay open much longer
    // than the teaser itself, and a finished <video> would freeze on its last frame.
    const onTimeUpdate = () => {
      if (disposed) return;
      if (el.currentTime >= PREVIEW_SECONDS) el.currentTime = 0;
      if (el.paused) play();
    };
    const onEnded = () => { if (!disposed) { el.currentTime = 0; play(); } };
    const onError = () => { if (!disposed) failRef.current?.(); };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    if (source.kind === 'hls') {
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false, capLevelToPlayerSize: true, startLevel: -1 });
        hls.loadSource(source.url);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, play);
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data?.fatal) onError(); });
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = source.url; // Safari plays HLS natively
        play();
      } else {
        onError();
      }
    } else {
      el.src = source.url;
      el.currentTime = 0;
      play();
    }

    return () => {
      disposed = true;
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      hls?.destroy();
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [source]);

  return (
    <video
      ref={videoRef}
      className="hover-video"
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}

// Netflix signature: hover to expand card w/ quick actions
export function HoverPreview({ item, anchorRect, onClose, onKeepAlive }) {
  const nav = useNavigate();
  const { activeProfile } = useAuth();
  const isTmdb = String(item._id || '').startsWith('tmdb-');
  // `listSaving` tracks an in-flight WRITE only — it deliberately does NOT track the
  // watchlist status READ. A read must never gate a write. This used to be seeded as
  // `useState(!isTmdb)` and fed straight into the + button's `disabled`: on a catalogue
  // title the button was therefore dead from the first frame until
  // GET /watchlist/status returned, a request that usually loses the race against the
  // pointer — and a `disabled` button makes the browser swallow the click outright, so
  // the card looked like the button simply did nothing.
  const [listSaving, setListSaving] = useState(false);
  // Short self-clearing note, so this button is never a silent no-op (signed out, or a
  // write the server rejected). Rendered inside the card, so it needs no global toast.
  const [listHint, setListHint] = useState('');
  const listHintTimer = useRef(null);
  const [inList, setInList] = useState(() => isTmdb ? isTmdbInList(activeProfile?._id, item._id) : false);
  // Thumbs-up state. This is a REAL like, not a shortcut to the detail sheet: TMDB
  // titles are liked client-side (utils/tmdbList) and catalogue titles go through the
  // same rating endpoint MobileTitleSheet uses, so the ring button, the detail sheet and
  // a later page load can never disagree about whether a title is liked.
  const [liked, setLiked] = useState(() => isTmdbLiked(activeProfile?._id, item._id));
  const [likeBusy, setLikeBusy] = useState(false);
  // A trailer that cannot be decoded (dead link, unsupported codec, HLS that never
  // opens) drops back to the artwork instead of leaving a black hole in the card.
  const [previewBroken, setPreviewBroken] = useState(false);
  // TMDB metadata is resolved on open, but its YouTube URL is never embedded here:
  // cross-origin YouTube player overlays cannot be reliably hidden.
  const [embed, setEmbed] = useState(null);
  const previewSource = useMemo(() => resolvePreviewSource(item.trailerUrl), [item.trailerUrl]);

  useEffect(() => { setPreviewBroken(false); setEmbed(null); }, [item._id]);

  useEffect(() => {
    let cancelled = false;
    fetchTmdbTrailerUrl(item).then((meta) => { if (!cancelled) setEmbed(meta); });
    return () => { cancelled = true; };
  }, [item]);

  useEffect(() => {
    if (isTmdb) { setInList(isTmdbInList(activeProfile?._id, item._id)); return undefined; }
    // No profile means there is nothing to read. Leave the button live so the click can
    // explain itself ("Sign in to use My List") instead of being dead on arrival.
    if (!activeProfile) return undefined;
    let cancelled = false;
    // No `setInList(false)` before the read: blanking the state while the request was in
    // flight made the ✓ blink off on EVERY hover, even for titles already in My List.
    API.get(`/user/watchlist/status/${item._id}`)
      .then(({ data }) => { if (!cancelled) setInList(Boolean(data?.inList)); })
      .catch(() => { /* keep what we have; a failed click reports its own outcome */ });
    return () => { cancelled = true; };
  }, [activeProfile?._id, isTmdb, item._id]);

  // Never leave a timer running against an unmounted card.
  useEffect(() => () => window.clearTimeout(listHintTimer.current), []);

  useEffect(() => {
    if (!isTmdb) return undefined;
    const onListChange = (event) => {
      if (event.detail?.itemId === item._id) setInList(event.detail.inList);
    };
    window.addEventListener('tmdb-list-changed', onListChange);
    return () => window.removeEventListener('tmdb-list-changed', onListChange);
  }, [isTmdb, item._id]);

  // A like is a shared fact, not per-card state. Whichever surface performs it — this
  // ring button, the mobile sheet, the desktop modal — the others re-render from the
  // same event, so a card can never show a filled thumb next to an unliked detail sheet.
  useEffect(() => {
    const syncLike = (event) => {
      const d = event.detail;
      if (!d || d.itemId !== item._id) return;
      setLiked(d.profileId ? d.profileId === activeProfile?._id : Boolean(d.liked));
    };
    const syncRating = (event) => {
      if (event.detail?.itemId !== item._id) return;
      setLiked(event.detail.liked);
    };
    window.addEventListener('tmdb-like-changed', syncLike);
    window.addEventListener('title-rating-changed', syncRating);
    return () => {
      window.removeEventListener('tmdb-like-changed', syncLike);
      window.removeEventListener('title-rating-changed', syncRating);
    };
  }, [item._id, activeProfile?._id]);

  // Opening a title has to work from EVERY surface, because these controls sit on cards
  // that appear in every rail. Three tiers, so none of them is ever a dead button:
  //   1. TMDB rows  → the window event every page listens for (opens the detail modal).
  //   2. Catalogue  → the real /title/:slug route.
  //   3. Anything else (no slug, no tmdbUrl) → the title sheet, which is mounted
  //      app-wide in App.jsx and so always responds. Without this tier the click
  //      silently did nothing, which is why the like button looked broken.
  const isTmdbItem = String(item._id || '').startsWith('tmdb-');
  const openItem = () => {
    if (isTmdbItem || item.tmdbUrl) {
      window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item }));
      return;
    }
    if (item.slug) { nav(`/title/${item.slug}`); return; }
    openMobileTitle(item);
  };

  // The preview must have the SAME shape as the tile it belongs to, so the aspect is
  // measured from that tile rather than hardcoded. A wide rail tile is 16:9
  // (--sf-card-h / --sf-card-w in core.css) but a Top 10 tile is portrait 2:3
  // (--t10-w / --t10-h in cards.css) — hardcoding 16:9 made the Top 10 popup a
  // landscape box sitting on a portrait poster. Anything unrecognised falls back to 16:9.
  const TILE_ASPECT_FALLBACK = 16 / 9;
  // A portrait tile is ~0.667; anything below that is a rail we have never seen.
  const PORTRAIT_ASPECT = 0.95;
  const CARD_GROW = 1.15;     // how much bigger than the popped tile the card sits
  const NAV_SAFE = 74;        // never tuck the card under the fixed navbar
  const EDGE = 10;            // breathing room against the viewport edges

  const centreX = anchorRect.left + anchorRect.width / 2;
  const centreY = anchorRect.top + anchorRect.height / 2;

  const tileAspect = anchorRect.width / anchorRect.height;
  const tileIsPortrait = tileAspect < PORTRAIT_ASPECT;
  const cardAspect = Number.isFinite(tileAspect) && tileAspect > 0
    ? tileAspect
    : TILE_ASPECT_FALLBACK;

  // Width first, then height from the aspect — clamping them in this order means a
  // short viewport squashes the card towards square instead of sliding it off screen.
  const maxW = window.innerWidth - EDGE * 2;
  const maxH = window.innerHeight - NAV_SAFE - EDGE;
  let cardW = Math.min(anchorRect.width * CARD_GROW, maxW);
  let cardH = cardW / cardAspect;
  // Portrait popups are tall, so they run out of vertical room first: shrink to fit
  // rather than overflowing past the rail above or the fold below.
  if (cardH > maxH) { cardH = maxH; cardW = Math.min(cardW, cardH * cardAspect); }

  const left = Math.max(EDGE, Math.min(centreX - cardW / 2, window.innerWidth - cardW - EDGE));
  const top = Math.max(NAV_SAFE, Math.min(centreY - cardH / 2, window.innerHeight - cardH - EDGE));
  const cardVars = {
    '--hover-card-w': `${cardW}px`,
    '--hover-card-h': `${cardH}px`,
    // Lets the stylesheet tighten the text/controls on a narrow portrait popup.
    '--hover-card-aspect': `${cardAspect}`,
  };

  // Shows `msg` in the card for a moment, then clears itself.
  const flashListHint = (msg) => {
    setListHint(msg);
    window.clearTimeout(listHintTimer.current);
    listHintTimer.current = window.setTimeout(() => setListHint(''), 2200);
  };

  const addToList = (e) => {
    e.stopPropagation();
    if (isTmdb) { setInList(toggleTmdbList(activeProfile?._id, item)); return; }
    if (listSaving) return;                     // one write at a time
    if (!activeProfile) { flashListHint('Sign in to use My List'); return; }
    const nextInList = !inList;
    setInList(nextInList);                      // optimistic: the ✓ appears on click
    setListSaving(true);
    (async () => {
      try {
        if (!nextInList) await API.delete(`/user/watchlist/${item._id}`);
        else await API.post('/user/watchlist', { titleId: item._id });
      } catch {
        setInList(!nextInList);                 // it did not stick — put the ✓ back
        flashListHint('Could not update My List');
      } finally { setListSaving(false); }
    })();
  };

  // The thumbs-up ring is a like, NOT a link to the detail sheet. It writes the like
  // through the same paths MobileTitleSheet uses, updates the ring optimistically so it
  // responds on the first click, and rolls back only if the request actually fails.
  const toggleLike = (e) => {
    e.stopPropagation();   // the card's own onClick must not open the detail sheet too
    if (likeBusy) return;
    // TMDB titles are liked locally; there is no catalogue id to rate.
    if (isTmdb) {
      setLiked(toggleTmdbLike(activeProfile?._id, item._id));
      return;
    }
    const titleId = item._id;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeBusy(true);
    (async () => {
      try {
        const { data } = nextLiked
          ? await API.post(`/titles/${titleId}/rate`, { rating: 10 })
          : await API.delete(`/titles/${titleId}/rate`);
        const savedLiked = data?.yourRating === 10;
        setLiked(savedLiked);
        window.dispatchEvent(new CustomEvent('title-rating-changed', {
          detail: { itemId: titleId, profileId: activeProfile?._id, yourRating: data?.yourRating, liked: savedLiked },
        }));
      } catch {
        setLiked(!nextLiked);   // the like did not stick — put the ring back
      } finally {
        setLikeBusy(false);
      }
    })();
  };

  const genres = normalizeGenreList(item.genres);
  // The reference prints the country/genre tags on their own line under the meta.
  const tags = [item.originCountry, ...genres].filter(Boolean).slice(0, 3);
  // The lazy trailer call also returns runtime + the real certification, which TMDB
  // never puts on a list response. Until it lands (or if it fails) we fall back to
  // whatever the rail already knew, so the line is never blank mid-hover.
  const ageRating = embed?.ageRating || item.ageRating || '13+';
  const runtimeMinutes = embed?.runtime || item.durationMinutes || 0;

  return (
    // The wrapper carries the fixed positioning; the card inside keeps its rounded
    // corners + overflow:hidden, and the chevron hangs OUTSIDE below it (a child of
    // the card would be clipped by that overflow).
    <div className="hover-wrap" style={{ left, top, ...cardVars }} onMouseEnter={onKeepAlive} onMouseLeave={onClose}>
      {/* `is-portrait` mirrors the tile's own shape so the stylesheet can tighten the
          text and controls on a narrow Top 10 popup. */}
      <div className={`hover-card${tileIsPortrait ? ' is-portrait' : ''}`} onClick={openItem}>
        {/* The artwork fills the card and the teaser plays over it — Play on the left,
            the secondary actions on the right, as in the reference. The artwork is
            ALWAYS rendered underneath: it is the poster frame seen while the embed
            loads, and the permanent fallback when a title has no playable trailer. */}
        <div className="hover-media">
          {item.posterUrl || item.bannerUrl ? (
            /* A portrait tile must show the POSTER, or a 16:9 banner gets centre-cropped
               into a meaningless letterbox. A wide tile prefers its banner. */
            <img
              className="hover-img"
              src={hiRes(tileIsPortrait ? (item.posterUrl || item.bannerUrl) : (item.bannerUrl || item.posterUrl))}
              alt={item.title}
              decoding="async"
            />
          ) : (
            <div className="hover-img card-art-placeholder"><span>{item.title}</span></div>
          )}

          {previewSource && !previewBroken ? (
            <HoverTrailer source={previewSource} onFail={() => setPreviewBroken(true)} />
          ) : null}

          {/* Scrim under the text block so the overlaid lines stay legible on any
              still, exactly as the reference's artwork darkens toward the bottom. */}
          <div className="hover-scrim" />
          {String(item._id || '').startsWith('tmdb-')
            ? <TmdbArtworkLogo item={item} variant="hover" showTitleFallback />
            : <span className="tmdb-hover-logo-slot"><span className="tmdb-hover-title-fallback">{item.title}</span></span>}

          <button
            className="hover-play"
            title="Play"
            aria-label={`Play ${item.title}`}
            onClick={(e) => { e.stopPropagation(); isTmdbItem ? openItem() : nav(`/watch/${item._id}`); }}
          >
            <IconPlay size={17} />
          </button>

          {/* Like / Info / Add — the three ring buttons down the right edge. Each stops
              propagation so the card's own onClick does not also fire and open a second
              view behind the first. */}
          <div className="hover-side">
            <button
              className={`hover-circle-btn like-action${liked ? ' on' : ''}`}
              title={liked ? 'Remove like' : 'Rate 5 stars'}
              aria-label={liked ? `Remove like for ${item.title}` : `Like ${item.title}`}
              aria-pressed={liked}
              disabled={likeBusy}
              onClick={toggleLike}
            >
              <IconThumbUp size={16} />
            </button>
            <button
              className="hover-circle-btn"
              title="More info"
              aria-label={`More info about ${item.title}`}
              onClick={(e) => { e.stopPropagation(); openItem(); }}
            >
              <IconInfo size={16} />
            </button>
            <button
              className={`hover-circle-btn ${inList ? 'on' : ''}`}
              onClick={addToList}
              disabled={listSaving}
              aria-pressed={inList}
              aria-label={inList ? 'Remove from My List' : 'Add to My List'}
              title={inList ? 'Remove from My List' : 'Add to My List'}
            >
              {inList ? <IconCheck size={16} /> : <IconPlus size={16} />}
            </button>
          </div>

          {/* Why a click did not stick (signed out, server rejected it). Without this the
              button was a dead control that gave the user no reason and no feedback. */}
          {listHint && <div className="hover-hint" role="status">{listHint}</div>}
        </div>

        <div className="hover-body">
          <div className="hover-meta">
            {matchPercent(item) > 0 && <span className="match">{matchPercent(item)}% Match</span>}
            <span className="age">{ageRating}</span>
            {isSeriesType(item.type) ? (
              <span>{cornerChip(item) || 'Series'}</span>
            ) : (
              runtimeMinutes > 0 && (
                <span className="hover-time"><IconClock size={11} />{fmtDur(runtimeMinutes)}</span>
              )
            )}
          </div>
          {tags.length > 0 && (
            <div className="hover-genres">
              {tags.map((g, idx) => <span key={`${g}-${idx}`}>{g}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* The reference hangs a small chevron under the card. It is a real control here
          rather than decoration: it opens the title, same as the info ring button. */}
      <button
        type="button"
        className="hover-chevron"
        title={`More about ${item.title}`}
        aria-label={`More about ${item.title}`}
        onClick={(e) => { e.stopPropagation(); openItem(); }}
      >
        <IconChevronDown size={22} />
      </button>
    </div>
  );
}

export default function Row({ title, items, top10 = false, cw = false, eager = false }) {
  const t = useSiteTranslation();
  const nav = useNavigate();
  const sliderRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollTargetPageRef = useRef(0);
  const closeTimer = useRef(null);
  const hoverSuppressed = useRef(false);
  const railIsScrolling = useRef(false);
  const railScrollTimer = useRef(null);
  const [hover, setHover] = useState(null); // { item, rect }
  const [arrowScrolling, setArrowScrolling] = useState(false);
  const [railPage, setRailPage] = useState({ current: 0, count: 1 });
  const [cwSelectionId, setCwSelectionId] = useState(null);
  const cwCardRects = useRef(new Map());
  const cwFlipAnimations = useRef(new Map());
  const cwFlipPending = useRef(false);

  useLayoutEffect(() => {
    if (!sliderRef.current) return;
    if (scrollAnimationRef.current !== null) cancelAnimationFrame(scrollAnimationRef.current);
    scrollAnimationRef.current = null;
    scrollTargetPageRef.current = 0;
    setArrowScrolling(false);
    sliderRef.current.scrollLeft = 0;
  }, [items]);

  useEffect(() => () => {
    if (scrollAnimationRef.current !== null) cancelAnimationFrame(scrollAnimationRef.current);
    window.clearTimeout(railScrollTimer.current);
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || cw) return undefined;
    const onRailScroll = () => {
      hoverSuppressed.current = true;
      railIsScrolling.current = true;
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(railScrollTimer.current);
      setHover(null);
      railScrollTimer.current = window.setTimeout(() => {
        railIsScrolling.current = false;
      }, 140);
    };
    slider.addEventListener('scroll', onRailScroll, { passive: true });
    return () => {
      slider.removeEventListener('scroll', onRailScroll);
      window.clearTimeout(railScrollTimer.current);
    };
  }, [cw, items]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || cw) return undefined;
    const updatePage = () => {
      const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
      const pageWidth = Math.max(1, slider.clientWidth);
      const count = maxScroll > 0 ? Math.ceil(maxScroll / pageWidth) + 1 : 1;
      const current = Array.from({ length: count }, (_, page) => Math.min(page * pageWidth, maxScroll))
        .reduce((nearest, position, page) => (
          Math.abs(position - slider.scrollLeft) < nearest.distance
            ? { page, distance: Math.abs(position - slider.scrollLeft) }
            : nearest
        ), { page: 0, distance: Infinity }).page;
      if (scrollAnimationRef.current === null) scrollTargetPageRef.current = current;
      setRailPage((previous) => previous.current === current && previous.count === count
        ? previous
        : { current, count });
    };
    updatePage();
    slider.addEventListener('scroll', updatePage, { passive: true });
    const resizeObserver = new ResizeObserver(updatePage);
    resizeObserver.observe(slider);
    return () => {
      slider.removeEventListener('scroll', updatePage);
      resizeObserver.disconnect();
    };
  }, [cw, items]);

  useLayoutEffect(() => {
    if (!cwFlipPending.current || !sliderRef.current) return;
    cwFlipPending.current = false;
    sliderRef.current.querySelectorAll('[data-cw-id]').forEach((card) => {
      const before = cwCardRects.current.get(card.dataset.cwId);
      if (!before) return;
      cwFlipAnimations.current.get(card.dataset.cwId)?.cancel();
      const after = card.getBoundingClientRect();
      const deltaX = before.left - after.left;
      const deltaY = before.top - after.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
      const animation = card.animate(
        [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 360, easing: 'cubic-bezier(.22, .75, .25, 1)' },
      );
      cwFlipAnimations.current.set(card.dataset.cwId, animation);
    });
  }, [cwSelectionId]);

  const animateRailTo = (slider, targetLeft, targetPage) => {
    if (scrollAnimationRef.current !== null) cancelAnimationFrame(scrollAnimationRef.current);
    scrollTargetPageRef.current = targetPage;
    const startLeft = slider.scrollLeft;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || Math.abs(targetLeft - startLeft) < 1) {
      slider.scrollLeft = targetLeft;
      scrollAnimationRef.current = null;
      setArrowScrolling(false);
      return;
    }

    const duration = 270;
    let startedAt = null;
    setArrowScrolling(true);
    const step = (timestamp) => {
      if (startedAt === null) startedAt = timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      slider.scrollLeft = startLeft + ((targetLeft - startLeft) * eased);
      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(step);
      } else {
        slider.scrollLeft = targetLeft;
        scrollAnimationRef.current = null;
        setArrowScrolling(false);
      }
    };
    scrollAnimationRef.current = requestAnimationFrame(step);
  };

  const scroll = (dir) => {
    const slider = sliderRef.current;
    if (!slider) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHover(null);

    if (cw) {
      const currentIndex = Math.max(0, items.findIndex((item) => item._id === cwSelectionId));
      const nextItem = items[currentIndex + dir];
      if (nextItem) selectContinueWatching(nextItem);
      return;
    }

    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
    const pageCount = maxScroll > 0
      ? Math.ceil(maxScroll / Math.max(1, slider.clientWidth)) + 1
      : 1;
    const targetPage = Math.max(0, Math.min(pageCount - 1, scrollTargetPageRef.current + dir));
    const targetLeft = Math.min(targetPage * slider.clientWidth, maxScroll);
    animateRailTo(slider, targetLeft, targetPage);
  };

  if (!items || items.length === 0) return null;

  const onHover = (item, element, index, pointerMoved = false) => {
    // No hover preview on a phone — the tap opens <MobileTitleSheet> instead, and
    // a finger firing mouseenter would pop a desktop card over the rails.
    if (window.matchMedia?.(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches) return;
    if (railIsScrolling.current) return;
    if (pointerMoved && !hoverSuppressed.current) return;
    if (hoverSuppressed.current) {
      if (!pointerMoved) return;
      hoverSuppressed.current = false;
    }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (element) setHover({ item, rect: expandedCardRect(element, cardHoverScale()), index });
    else if (hover?.item?._id === item._id) {
      // keep existing rect for top10
    } else setHover(null);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHover(null), 220);
  };

  const displayedItems = cw && items.length > 1
    ? (() => {
      const selected = items.find((item) => item._id === cwSelectionId) || items[0];
      return [selected, ...items.filter((item) => item._id !== selected._id)];
    })()
    : items;

  const selectContinueWatching = (item) => {
    if (item._id === cwSelectionId) return;
    cwCardRects.current = new Map(
      Array.from(sliderRef.current?.querySelectorAll('[data-cw-id]') || [])
        .map((card) => [card.dataset.cwId, card.getBoundingClientRect()]),
    );
    cwFlipPending.current = true;
    setCwSelectionId(item._id);
  };
  const openContinueWatching = (item) => {
    const isTmdb = String(item?._id || '').startsWith('tmdb-');
    if (isTmdb) {
      window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item }));
      return;
    }
    if (item?.slug) nav(`/title/${item.slug}`);
  };
  const selectedIndex = Math.max(0, items.findIndex((item) => item._id === cwSelectionId));

  return (
    <div className={`row${cw ? ' row-cw' : ''}${arrowScrolling ? ' row-arrow-scrolling' : ''}`} onMouseLeave={scheduleClose}>
      <div className="row-header">
        <h2 className="row-title">{t(title)}</h2>
        <div className="row-header-actions">
          {!cw && railPage.count > 1 && (
            <div className="row-page-indicators" aria-label={`Page ${railPage.current + 1} of ${railPage.count}`}>
              {Array.from({ length: railPage.count }, (_, page) => (
                <button
                  key={page}
                  type="button"
                  className={`row-page-indicator${page === railPage.current ? ' active' : ''}`}
                  aria-label={`Go to page ${page + 1}`}
                  aria-current={page === railPage.current ? 'page' : undefined}
                  onClick={() => {
                    const slider = sliderRef.current;
                    if (!slider) return;
                    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
                    const targetLeft = Math.min(page * slider.clientWidth, maxScroll);
                    animateRailTo(slider, targetLeft, page);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <button className="row-arrow left" onClick={() => scroll(-1)} aria-label={t('Previous title')}
        disabled={cw ? selectedIndex === 0 : railPage.current === 0}>‹</button>
      <div
        className="row-slider"
        ref={sliderRef}
        style={{
          '--hover-neighbor-shift': hover
            ? `${hover.rect.width * (1 - 1 / cardHoverScale()) / 2}px`
            : '0px',
        }}
      >
        {displayedItems.map((item, i) => (
          cw
            ? (
              <ContinueWatchingCard
                key={item._id}
                item={item}
                lead={i === 0}
                onOpen={openContinueWatching}
              />
            )
            : (
              // The tile itself is only scaled; sibling rail items translate
              // outward so they do not overlap. The preview is rendered once,
              // OUTSIDE the rail (see below), because `.rail-item`
              // carries a transform, and a transformed ancestor becomes the
              // containing block for `position: fixed`, which would both re-anchor
              // and scale the preview along with the tile.
              <div
                key={item._id}
                className={`rail-item${hover?.index === i ? ' is-expanded' : hover && i < hover.index ? ' shifts-left' : hover && i > hover.index ? ' shifts-right' : ''}`}
              >
                <TitleCard
                  item={item}
                  top10Index={top10 ? i : null}
                  progress={item._resume || null}
                  eager={eager && i < 6}
                  onHover={(hoveredItem, element, _cardIndex, pointerMoved) => onHover(hoveredItem, element, i, pointerMoved)}
                />
              </div>
            )
        ))}
      </div>
      <button className="row-arrow right" onClick={() => scroll(1)} aria-label="Next title"
        disabled={cw ? selectedIndex >= items.length - 1 : railPage.current >= railPage.count - 1}>›</button>
      {/* One preview for the whole rail, positioned against the hovered tile's
          EXPANDED rect. It lives here — a sibling of the scroll box, outside every
          `.rail-item` — so no transformed ancestor can capture its `position: fixed`
          containing block and scale it with the tile. Keyed on the item so switching
          tiles remounts the trailer instead of leaking the previous one. */}
      {hover && !cw && (
        <HoverPreview
          key={hover.item._id}
          item={hover.item}
          anchorRect={hover.rect}
          onKeepAlive={() => closeTimer.current && clearTimeout(closeTimer.current)}
          onClose={scheduleClose}
        />
      )}
    </div>
  );
}
