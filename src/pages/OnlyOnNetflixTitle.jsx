import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { API } from '../api';
import useBranding from '../hooks/useBranding';
import { useAuth } from '../context/AuthContext';
import { titlePagePath } from '../utils/tmdbTitleRoute';

// ============================================================================
// /p/only-on-netflix/title/:type/:id — the screen a card on the "Only on
// Netflix" page opens.
//
// The reference is netflix.com/pk/title/<id>: the PUBLIC (signed-out) title
// page, reached from a card rather than from the member navigation. It is the
// long form of the marketing page above it, so it reads top to bottom as:
//
//   masthead          wordmark + Sign In pill            (same as the rail page)
//   pill nav          Trailers / Episodes / More to Watch / Plans, STICKY
//   hero              the title's own backdrop, title treatment, email capture,
//                     a price line and the transport strip in the corner
//   info card         title, the year/seasons/rating/genre line, the synopsis,
//                     then Starring + Creators
//   Trailers          the title's real teaser/trailer list, three across
//   Episodes          season dropdown + a horizontal rail of episode cards
//   More Details      Watch offline / Genres / This show is… / About, then
//                     Audio + Subtitles, then Cast — three glass panels
//   Join Now          the page's own mid-page call to action
//   rails             You Might Also Like, then Trending Now
//   plans             the same four tiers the rail page ends with
//   banner + Tudum + footer
//
// Everything below the rails is the SAME markup the rail page uses (`.oon-plans`,
// `.oon-banner`, `.oon-tudum`, `.oon-footer-join` and the real <Footer />), and
// the page root carries `.oon-page` on purpose: that is where the measured
// gutter / inset / h1 / h2 / card-width token set lives, so both pages sit on
// one grid instead of two that drift. Only the rows this page adds are new, and
// every one of those is scoped to `.ont-*`.
//
// Deliberately NOT wrapped in <Protected>: it is the logged-out surface of the
// reference, reached from a public marketing page. Playing an episode still
// lands on the protected player, which is exactly where Netflix sends a
// signed-out visitor too — to sign in.
// ============================================================================

// The four tiers, copied from the rail page's own plan grid (PK pricing).
const PLANS = [
  {
    tier: 'mobile', name: 'Mobile', quality: '480p', price: 'Rs 250 /mo',
    points: ['Fair video quality', 'For your phone or tablet'],
  },
  {
    tier: 'basic', name: 'Basic', quality: '720p', price: 'Rs 450 /mo',
    points: ['Good video quality', 'For your phone, tablet, laptop and TV'],
  },
  {
    tier: 'standard', name: 'Standard', quality: '1080p', price: 'Rs 800 /mo',
    points: ['Great video quality', 'For your phone, tablet, laptop and TV'],
  },
  {
    tier: 'premium', name: 'Premium', quality: '4K + HDR', price: 'Rs 1,100 /mo',
    popular: true,
    points: ['Best video quality', 'Immersive sound (spatial audio)', 'For your phone, tablet, laptop and TV'],
  },
];

// The country tag Netflix prints inside "This show is …". Only the handful the
// catalogue actually produces is mapped; anything else falls back to the raw
// country code, so the tag is never invented.
const COUNTRY_TAGS = {
  GB: 'British', US: 'American', KR: 'Korean', JP: 'Japanese', IN: 'Indian',
  ES: 'Spanish', FR: 'French', DE: 'German', IT: 'Italian', TR: 'Turkish',
  CA: 'Canadian', AU: 'Australian', MX: 'Mexican', BR: 'Brazilian', SE: 'Swedish',
};

const fmtDur = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}h ${min % 60}m` : `${min}m`;
};

const uniqueList = (values = []) => {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = String(value || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
};


// The reference's own chevron glyphs (identical to the rail page's), so the
// arrows, the season dropdown's caret and the "Join Now" chip all match.
const ChevronRight = ({ size = 24, height = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={height} fill="none" aria-hidden="true" focusable="false">
    <path
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
      d="m15.586 12-7.293 7.293 1.414 1.414 8-8a1 1 0 0 0 0-1.414l-8-8-1.414 1.414z"
    />
  </svg>
);
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
    <path
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
      d="M8.414 12l7.293 7.293-1.414 1.414-8-8a1 1 0 0 1 0-1.414l8-8 1.414 1.414z"
    />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" focusable="false">
    <path
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
      d="M12 15.4 4.7 8.1l1.4-1.4L12 12.6l5.9-5.9 1.4 1.4z"
    />
  </svg>
);
const Checkmark = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
    <path
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
      d="M9.55 17.6 4.4 12.44l1.42-1.41 3.73 3.73 8.73-8.73 1.41 1.42z"
    />
  </svg>
);
const TudumMark = () => (
  <svg viewBox="0 0 16 16" width="28" height="28" fill="none" aria-hidden="true" focusable="false" className="oon-tudum-mark">
    <path fill="currentColor" d="M15 2v4.68h-4.2v7.55H5.2V6.7H1V2z" />
  </svg>
);

// The hero's own transport strip — the four icons the reference prints in the
// bottom-right corner of the artwork. On a marketing hero there is no video
// behind them, so they are decorative spans rather than controls that only
// pretend to do something.
const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M7.5 4.6v14.8L19.5 12z" />
  </svg>
);
const PauseGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M6.8 4.8h3.5v14.4H6.8zM13.7 4.8h3.5v14.4h-3.5z" />
  </svg>
);
const MutedGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M3.6 9h3.1L11.5 5v14l-4.8-4H3.6z" />
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="m15.2 9.4 4.8 4.8m0-4.8-4.8 4.8" />
  </svg>
);
const UnmutedGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M3.5 9h3.2l4.8-4v14l-4.8-4H3.5z" />
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M15 9a4.5 4.5 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11" />
  </svg>
);
const ExpandGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 9.2V4h5.2M20 9.2V4h-5.2M4 14.8V20h5.2M20 14.8V20h-5.2" />
  </svg>
);
const SubtitlesGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
    <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M3 5.5h18v12H9l-4.5 3v-3H3z" />
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M6.5 10h11M6.5 13.5h7.5" />
  </svg>
);
// ---------------------------------------------------------------------------
// The masthead. Identical to the rail page's: the reference header holds exactly
// two things — the wordmark and a white "Sign In" pill — so a signed-in member
// gets the same pill turned into a link home rather than a second navigation
// bar. This is the marketing surface, reached from the footer/rail page, not
// from the member nav.
// ---------------------------------------------------------------------------
function Masthead({ siteName }) {
  const { user } = useAuth();
  return (
    <header className="oon-header">
      <Link to="/" className="oon-brand" aria-label={siteName}>
        <img src="/newflix.png" alt={siteName} className="oon-logo" draggable="false" />
      </Link>
      <div className="oon-header-actions">
        {user
          ? <Link to="/browse" className="oon-signin">{siteName} Home</Link>
          : <Link to="/login" className="oon-signin">Sign In</Link>}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// The sticky section switcher. The reference's pill rides at the top of the
// viewport from the moment it reaches it — the wordmark and Sign In pill scroll
// away above it — which is why it is `position: sticky` rather than fixed: at
// scroll zero it still sits in flow, under the masthead, exactly where the
// reference draws it.
//
// `Episodes` is the one entry that can disappear: a film has no episode rail, so
// the pill would scroll to nothing.
// ---------------------------------------------------------------------------
function PillNav({ hasTrailers, hasEpisodes }) {
  const entries = [
    { id: 'ont-trailers', label: 'Trailers', show: hasTrailers },
    { id: 'ont-episodes', label: 'Episodes', show: hasEpisodes },
    { id: 'ont-watch', label: 'More to Watch', show: true },
    { id: 'ont-plans', label: 'Plans', show: true },
  ].filter((entry) => entry.show);

  const go = (id) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="ont-pillnav" aria-label="On this page">
      <div className="ont-pillnav-inner">
        {entries.map((entry) => (
          <button key={entry.id} type="button" className="ont-pill" onClick={() => go(entry.id)}>
            {entry.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// The hero's email capture, identical to the rail page's: the address is handed
// to the sign-up step so the visitor never types it twice.
function EmailForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState('');
  const value = email.trim();
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value);

  const submit = (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Enter a valid email address to continue.');
      return;
    }
    setError('');
    nav(`/signup?email=${encodeURIComponent(value.toLowerCase())}`);
  };

  return (
    <form className="oon-hero-form" onSubmit={submit} noValidate>
      <div className={`oon-field${filled ? ' filled' : ''}`}>
        <input
          id="ont-email" type="email" value={email} maxLength={254}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'ont-email-error' : undefined}
          autoComplete="email" spellCheck="false"
          onChange={(e) => { setEmail(e.target.value); setFilled(true); setError(''); }}
        />
        <label htmlFor="ont-email">Email address</label>
      </div>
      <button className="oon-join" type="submit">Join Now</button>
      {error && <p className="ont-email-error" id="ont-email-error" role="alert">{error}</p>}
    </form>
  );
}

// ---------------------------------------------------------------------------
// The hero. Same three nested boxes as the rail page's hero — the outer one
// exists only to own the drop shadow the reference casts from the frame's masked
// silhouette — and the same copy geometry, but the artwork and the copy differ:
// this is the TITLE's own backdrop, and where the rail page prints "Only on
// <site>" this prints the title treatment Netflix lays over the picture.
//
// The treatment is a transparent PNG when TMDB (or an admin override) has one.
// When it does not, the name is set as the hero heading instead — and either
// way the heading itself is always in the DOM, so the page keeps exactly one h1
// and the artwork stays purely decorative.
// ---------------------------------------------------------------------------
function Hero({ title, art, logoUrl, trailerKey, iframeRef }) {
  const frameRef = useRef(null);
  const framePlayerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const playerOrigin = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    setPlaying(true);
    setMuted(true);
    setCaptionsOn(false);
    setPlayerError('');
  }, [trailerKey]);

  const sendPlayerCommand = (func, args = []) => {
    [iframeRef.current, framePlayerRef.current].forEach((player) => {
      player?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*',
      );
    });
  };

  const togglePlay = () => {
    sendPlayerCommand(playing ? 'pauseVideo' : 'playVideo');
    setPlaying((wasPlaying) => !wasPlaying);
  };

  const toggleMute = () => {
    sendPlayerCommand(muted ? 'unMute' : 'mute');
    setMuted((wasMuted) => !wasMuted);
  };

  const toggleCaptions = () => {
    if (captionsOn) sendPlayerCommand('unloadModule', ['captions']);
    else {
      sendPlayerCommand('loadModule', ['captions']);
      sendPlayerCommand('setOption', ['captions', 'track', { languageCode: 'en' }]);
    }
    setCaptionsOn((enabled) => !enabled);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameRef.current?.requestFullscreen();
      setPlayerError('');
    } catch (error) {
      setPlayerError(`Fullscreen unavailable: ${error.message}`);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setPlayerError('');
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="oon-hero-outer">
      <div className="oon-hero-frame" ref={frameRef}>
        {/* The artwork is a SIBLING of the copy panel, not its parent, so the
            panel paints over the backdrop. */}
        <div className={`oon-hero-art${trailerKey ? ' has-trailer' : ''}`} aria-hidden="true">
          <img className="oon-hero-background" src={art} alt="" draggable="false" />
          {trailerKey && (
            <iframe
              className="ont-hero-frame-trailer"
              ref={framePlayerRef}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(playerOrigin)}`}
              title="Title trailer"
              tabIndex="-1"
              allow="autoplay; encrypted-media; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          <div className="oon-hero-scrim" />
        </div>

        <section className="oon-hero ont-hero" aria-labelledby="ont-hero-title">
          <div className="oon-hero-copy">
            <div className="ont-hero-lockup">
              <img className="ont-hero-brand" src="/newflix.png" alt="" draggable="false" />
              {logoUrl && (
                <img className="ont-hero-logo" src={logoUrl} alt="" draggable="false" />
              )}
              <h1 id="ont-hero-title" className={logoUrl ? 'oon-sr-only' : undefined}>{title}</h1>
            </div>
            <div className="ont-signup-group">
              <EmailForm />
              <p className="oon-hero-price">Endless entertainment starting at Rs 250</p>
            </div>
          </div>

          {trailerKey && (
            <div className="ont-hero-controls" aria-label="Trailer controls">
              <button className="ont-hero-ctrl" type="button" onClick={togglePlay} aria-label={playing ? 'Pause trailer' : 'Play trailer'} title={playing ? 'Pause' : 'Play'}>
                {playing ? <PauseGlyph /> : <PlayGlyph />}
              </button>
              <button className="ont-hero-ctrl" type="button" onClick={toggleMute} aria-label={muted ? 'Unmute trailer' : 'Mute trailer'} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? <MutedGlyph /> : <UnmutedGlyph />}
              </button>
              <button className="ont-hero-ctrl" type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen">
                <ExpandGlyph />
              </button>
              <button className={`ont-hero-ctrl${captionsOn ? ' active' : ''}`} type="button" onClick={toggleCaptions} aria-label={captionsOn ? 'Turn captions off' : 'Turn captions on'} aria-pressed={captionsOn} title="Captions">
                <SubtitlesGlyph />
              </button>
            </div>
          )}
          {playerError && <p className="ont-player-error" role="status">{playerError}</p>}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The info card — the glass panel directly under the hero on the reference. It
// carries, in order: the title, the dot-separated meta line (year · seasons ·
// certificate · genres), the synopsis, and then Starring + Creators in a column
// of their own to its right.
//
// The item it is handed is whichever of the two sources has arrived: the card
// we clicked already carries title/description/year/rating/type/genres, so the
// panel is never an empty box while the detail call is in flight, and the detail
// call then fills in the cast and the full genre list.
// ---------------------------------------------------------------------------
function InfoCard({ item }) {
  const series = item.type === 'tv';
  const meta = [
    item.releaseYear ? String(item.releaseYear) : '',
    series && item.seasonsCount
      ? `${item.seasonsCount} Season${item.seasonsCount > 1 ? 's' : ''}`
      : '',
    !series && item.durationMinutes ? fmtDur(item.durationMinutes) : '',
    item.ageRating || '',
    ...(item.genres || []),
  ].filter(Boolean);

  return (
    <section className="ont-info" aria-labelledby="ont-info-title">
      <h2 className="ont-info-title" id="ont-info-title">{item.title}</h2>

      {meta.length > 0 && (
        <p className="ont-info-meta">
          {meta.map((bit, i) => (
            <span key={`${bit}-${i}`}>
              {i > 0 && <i aria-hidden="true">·</i>}
              {bit}
            </span>
          ))}
        </p>
      )}

      <div className="ont-info-body">
        {item.description && <p className="ont-info-desc">{item.description}</p>}
        {(item.cast?.length > 0 || item.director) && (
          <div className="ont-info-credits">
            {item.cast?.length > 0 && (
              <p className="ont-credit-row">
                <span className="ont-credit-label">Starring:</span>
                <span className="ont-credit-value">{item.cast.join(', ')}</span>
              </p>
            )}
            {item.director && (
              <p className="ont-credit-row">
                <span className="ont-credit-label">{series ? 'Creators:' : 'Director:'}</span>
                <span className="ont-credit-value">{item.director}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The Trailers rail. The reference runs three cards across the column, each a
// 16:9 still with a play badge in its corner, a small uppercase kind above the
// name and the video's own name under it. That is exactly what /tmdb/title-media
// returns, so the cards are the title's REAL teasers and trailers rather than a
// copy of one repeated three times.
//
// The still is YouTube's own public thumbnail for the video key, which is what
// makes a card recognisable before it is opened.
// ---------------------------------------------------------------------------
function Trailers({ videos, onPlay }) {
  return (
    <ScrollRail title="Trailers" id="ont-trailers" labelledBy="ont-trailers-title" items={videos} className="ont-trailers-rail">
      {videos.map((video) => (
        <button key={video.key} type="button" className="ont-tcard" onClick={() => onPlay(video)}>
          <span className="ont-tcard-art">
            <img
              src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`}
              alt="" loading="lazy" draggable="false"
            />
            <span className="ont-tcard-play"><PlayGlyph /></span>
          </span>
          {video.type && <span className="ont-tcard-kind">{video.type}</span>}
          <span className="ont-tcard-name">{video.name || video.type || 'Trailer'}</span>
        </button>
      ))}
    </ScrollRail>
  );
}

// The trailer overlay. Same dialog the member modal opens (`.trailer-ov` /
// `.trailer-box` / `.trailer-close` are global, in player.css), because a
// trailer should look the same wherever it is opened from. Locks page scroll
// while it is up and closes on Escape, like every other dialog in the app.
function TrailerOverlay({ video, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="trailer-ov" onClick={onClose} role="dialog" aria-modal="true" aria-label={video.name || 'Trailer'}>
      <div className="trailer-box" onClick={(e) => e.stopPropagation()}>
        <button className="trailer-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        <iframe
          src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={video.name || 'Trailer'}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}




// ---------------------------------------------------------------------------
// The horizontal rail every scrolling row here is built from — the episode rail
// and the two discovery rails. The paging arrows are the rail page's own
// `.oon-arrow` marks, which sit at the ends of this viewport and so overlay the
// track; only the track itself is local, because the rail page masks its edges to
// soften what the arrows cover and Netflix's rows do not.
// ---------------------------------------------------------------------------
function ScrollRail({ title, id, labelledBy, headExtra, items, children, className = '' }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 2px of slack absorbs sub-pixel scrollLeft, which would otherwise leave a
    // disabled arrow showing when the rail is already hard against its end.
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', sync); ro.disconnect(); };
  }, [items, sync]);

  const page = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  return (
    <section className={`ont-section${className ? ` ${className}` : ''}`} id={id} aria-labelledby={labelledBy}>
      <div className="ont-rail-head">
        <h2 className="ont-section-title" id={labelledBy}>{title}</h2>
        {headExtra}
      </div>
      <div className={`ont-rail-viewport${edges.start ? '' : ' can-scroll-left'}${edges.end ? '' : ' can-scroll-right'}`}>
        <button
          type="button" className="oon-arrow prev" aria-label={`Scroll ${title} left`}
          disabled={edges.start} onClick={() => page(-1)}
        >
          <ChevronLeft />
        </button>
        <div className="ont-rail-track" ref={trackRef}>{children}</div>
        <button
          type="button" className="oon-arrow next" aria-label={`Scroll ${title} right`}
          disabled={edges.end} onClick={() => page(1)}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

// Artwork for a poster card. `normalize()` leaves posterUrl empty for a title
// TMDB returns without a poster, and the trending rail is built from exactly
// those normalised cards, so the art falls back to the brand plate rather than
// rendering a broken image — the same guard the rail page uses.
function TileArt({ item }) {
  const [src, setSrc] = useState(item.posterUrl || item.bannerUrl || '');
  const [dead, setDead] = useState(false);

  useEffect(() => {
    setSrc(item.posterUrl || item.bannerUrl || '');
    setDead(false);
  }, [item.posterUrl, item.bannerUrl]);

  if (dead || !src) {
    return (
      <span className="oon-tile-art oon-tile-art-missing" aria-hidden="true">
        <img src="/Netflix.png" alt="" draggable="false" />
      </span>
    );
  }

  return (
    <img
      className="oon-tile-art" src={src} alt={item.title} loading="lazy" draggable="false"
      // Try the other artwork source once, then give up and show the placeholder.
      onError={() => {
        const alt2 = src === item.posterUrl ? item.bannerUrl : item.posterUrl;
        if (alt2 && alt2 !== src) setSrc(alt2);
        else setDead(true);
      }}
    />
  );
}

// The two discovery rails. The reference prints bare posters here — no caption
// under the art, just the brand mark in its corner — which is the rail page's
// own tile minus its name row.
function PosterRail({ title, id, items, onOpen }) {
  return (
    <ScrollRail title={title} id={id} labelledBy={`${id}-title`} items={items}>
      {items.map((item) => (
        <div className="oon-tile" key={item._id}>
          <button
            type="button" className="oon-tile-link"
            onClick={() => onOpen(item)} aria-label={`More about ${item.title}`}
          >
            <span className="oon-tile-art-box">
              <TileArt item={item} />
              <img className="oon-tile-brand" src="/Netflix.png" alt="" aria-hidden="true" draggable="false" />
            </span>
          </button>
        </div>
      ))}
    </ScrollRail>
  );
}

// One episode card: a 16:9 still with its runtime in the corner, then the number
// and name, then the synopsis clamped to four lines — the reference's own card.
function EpisodeCard({ episode, onPlay }) {
  return (
    <button type="button" className="ont-ep" onClick={() => onPlay(episode)}>
      <span className="ont-ep-art">
        {episode.thumbnailUrl
          ? <img src={episode.thumbnailUrl} alt="" loading="lazy" draggable="false" />
          : <span className="ont-ep-noart" aria-hidden="true" />}
        {episode.durationMinutes > 0 && (
          <span className="ont-ep-dur">{fmtDur(episode.durationMinutes)}</span>
        )}
      </span>
      <span className="ont-ep-body">
        <span className="ont-ep-title">{episode.episodeNumber}. {episode.title}</span>
        {episode.description && <span className="ont-ep-desc">{episode.description}</span>}
      </span>
    </button>
  );
}

// The Episodes row: the rail above, with the reference's season dropdown sitting
// beside the heading. Changing the season refetches (see the page's own effect),
// so paging through episodes and switching seasons stay independent.
function Episodes({ seasons, seasonIdx, onSeason, episodes, loading, onPlay }) {
  const season = seasons[seasonIdx];
  return (
    <ScrollRail
      title="Episodes"
      id="ont-episodes"
      labelledBy="ont-episodes-title"
      items={episodes}
      headExtra={(
        <div className="ont-season">
          <select
            value={seasonIdx}
            onChange={(e) => onSeason(Number(e.target.value))}
            aria-label="Select a season"
          >
            {seasons.map((s, i) => (
              <option key={s.seasonNumber} value={i}>{s.name || `Season ${s.seasonNumber}`}</option>
            ))}
          </select>
          <ChevronDown />
        </div>
      )}
    >
      {loading && <div className="sf-spinner" style={{ margin: '30px auto' }} />}
      {!loading && episodes.length === 0 && (
        <p className="ont-empty">No episodes are listed for {season?.name || 'this season'} yet.</p>
      )}
      {!loading && episodes.map((episode) => (
        <EpisodeCard key={episode._id} episode={episode} onPlay={onPlay} />
      ))}
    </ScrollRail>
  );
}

// ---------------------------------------------------------------------------
// "More Details" — the three glass panels under the episode rail.
//
// Netflix fills these from its own content graph (mood tags, audio tracks,
// subtitle sets); TMDB gives us genres, spoken languages and a cast, so each
// block is printed only when there is something real behind it rather than
// padded out with a guess. "Watch offline" and the Tudum pointer are the two
// lines that ARE the same for every title, and are written as such.
// ---------------------------------------------------------------------------
function Details({ item }) {
  const series = item.type === 'tv';
  const genres = uniqueList(item.genres || []);
  const audio = uniqueList(item.audioLanguages || []);
  const subtitles = audio.includes('English') ? ['English'] : audio.slice(0, 1);
  const country = COUNTRY_TAGS[item.originCountry] || item.originCountry;
  const moods = uniqueList([country, ...genres, series ? 'TV Shows' : 'Movies']);

  return (
    <section className="ont-section" id="ont-details" aria-labelledby="ont-details-title">
      <h2 className="ont-section-title" id="ont-details-title">More Details</h2>
      <div className="ont-details-grid">
        <div className="ont-detail-card">
          <div className="ont-detail-block">
            <p className="ont-detail-label">Watch offline</p>
            <p className="ont-detail-value">Available to download</p>
          </div>
          {genres.length > 0 && (
            <div className="ont-detail-block">
              <p className="ont-detail-label">Genres</p>
              <p className="ont-detail-value">{genres.join(', ')}</p>
            </div>
          )}
          {moods.length > 0 && (
            <div className="ont-detail-block">
              <p className="ont-detail-label">{series ? 'This show is …' : 'This movie is …'}</p>
              <p className="ont-detail-value">{moods.join(', ')}</p>
            </div>
          )}
          <div className="ont-detail-block">
            <p className="ont-detail-label">About {item.title}</p>
            <p className="ont-detail-value">
              Go behind the scenes and learn more on{' '}
              <a
                className="ont-detail-link"
                href="https://www.netflix.com/tudum" target="_blank" rel="noopener noreferrer"
              >
                Tudum.com
              </a>.
            </p>
          </div>
        </div>

        <div className="ont-detail-card">
          {audio.length > 0 && (
            <div className="ont-detail-block">
              <p className="ont-detail-label">Audio</p>
              <p className="ont-detail-value">{audio.join(', ')}</p>
            </div>
          )}
          {subtitles.length > 0 && (
            <div className="ont-detail-block">
              <p className="ont-detail-label">Subtitles</p>
              <p className="ont-detail-value">{subtitles.join(', ')}</p>
            </div>
          )}
        </div>

        <div className="ont-detail-card">
          {item.cast?.length > 0 && (
            <div className="ont-detail-block">
              <p className="ont-detail-label">Cast</p>
              <p className="ont-detail-value">{item.cast.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The four plan cards and the closing stack — the SAME markup and the SAME
// class names the rail page ends with (`.oon-plans*`, `.oon-banner*`,
// `.oon-tudum*`, `.oon-footer-join*`), because on the reference the two pages
// end with one shared block. Restating them here would let the two drift.
// ---------------------------------------------------------------------------
function Plans() {
  return (
    <section className="oon-plans" id="ont-plans" aria-labelledby="ont-plans-title">
      <h2 className="oon-plans-title" id="ont-plans-title">A Plan To Suit Your Needs</h2>
      <div className="oon-plans-grid">
        {PLANS.map((plan) => (
          <div className="oon-plan" data-tier={plan.tier} key={plan.tier}>
            {plan.popular && <span className="oon-plan-tag">Most Popular</span>}
            <h3 className="oon-plan-name">{plan.name}</h3>
            <p className="oon-plan-quality">{plan.quality}</p>
            <ul className="oon-plan-points">
              {plan.points.map((point) => (
                <li key={point}><Checkmark />{point}</li>
              ))}
            </ul>
            <p className="oon-plan-price">{plan.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Closing({ siteName }) {
  return (
    <>
      <section className="oon-banner">
        <div className="oon-banner-background" aria-hidden="true" />
        <div className="oon-banner-inner">
          <p><strong>Discover your next favorites, plus new releases every week</strong></p>
          <Link to="/" className="oon-banner-cta">More About {siteName}</Link>
        </div>
      </section>
      <aside className="oon-tudum">
        <TudumMark />
        <p>
          Read about {siteName} TV shows and movies and watch bonus videos on{' '}
          <a href="https://www.netflix.com/tudum" target="_blank" rel="noopener noreferrer">Tudum.com</a>.
        </p>
      </aside>
      <div className="oon-footer-join">
        <div className="oon-footer-join-inner">
          <Link to="/signup" className="oon-join">Join Now</Link>
        </div>
      </div>
    </>
  );
}

export default function OnlyOnNetflixTitle() {
  const { type, id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const branding = useBranding();
  // The card that was clicked. It already carries the title, synopsis, year,
  // rating, type and a few genres, which is what lets the hero and the info card
  // paint before the detail call answers — and what keeps the page from being
  // blank if TMDB is unreachable at all.
  const seed = location.state?.item || null;

  const [detail, setDetail] = useState(null);
  const [media, setMedia] = useState(null);
  const [trending, setTrending] = useState([]);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const heroPlayerRef = useRef(null);

  // A tile inside "You Might Also Like" is another navigation, so the new title
  // starts at the top like a fresh visit.
  useEffect(() => { window.scrollTo(0, 0); }, [type, id]);

  // The detail: overview, genres, cast, seasons, recommendations.
  useEffect(() => {
    let alive = true;
    setDetail(null); setSeasonIdx(0); setEpisodes([]); setVideo(null);
    API.get(`/tmdb/detail/${type}/${id}`)
      .then(({ data }) => { if (alive) setDetail(data?.item || null); })
      .catch(() => { if (alive) setDetail(null); });
    return () => { alive = false; };
  }, [type, id]);

  // The title treatment + the trailers rail. An enhancement, hence `softFail`:
  // if it fails the page simply omits those two rows instead of blanking.
  useEffect(() => {
    let alive = true;
    setMedia(null);
    API.get(`/tmdb/title-media/${type}/${id}`, { softFail: true })
      .then(({ data }) => { if (alive) setMedia(data || null); })
      .catch(() => { if (alive) setMedia(null); });
    return () => { alive = false; };
  }, [type, id]);

  // "Trending Now" is the Movies catalogue's own trending rail, already cached
  // 30 minutes server-side because the navbar's Movies page reads it — so this
  // row costs the page nothing new, and its heading is the reference's own.
  useEffect(() => {
    let alive = true;
    API.get('/tmdb/browse/movie', { softFail: true })
      .then(({ data }) => {
        if (!alive) return;
        const row = (data?.rows || []).find((r) => r.key === 'trending');
        setTrending((row?.items || []).filter((it) => it._id !== `tmdb-${type}-${id}`).slice(0, 20));
      })
      .catch(() => { if (alive) setTrending([]); });
    return () => { alive = false; };
  }, [type, id]);

  // The selected season's episodes. Only a series has seasons, and the list is
  // refetched per season rather than held, because TMDB serves a season's
  // episodes from their own endpoint.
  useEffect(() => {
    if (!detail || detail.type !== 'tv') return undefined;
    const season = detail.seasons?.[seasonIdx];
    if (!season) return undefined;
    let alive = true;
    setEpLoading(true);
    setEpisodes([]);
    API.get(`/tmdb/season/${id}/${season.seasonNumber}`)
      .then(({ data }) => { if (alive) setEpisodes(data?.episodes || []); })
      .catch(() => { if (alive) setEpisodes([]); })
      .finally(() => { if (alive) setEpLoading(false); });
    return () => { alive = false; };
  }, [detail, seasonIdx, id]);

  const hero = detail || seed;
  const title = hero?.title || 'This title';
  const art = detail?.bannerUrl || detail?.posterUrl || seed?.bannerUrl || seed?.posterUrl || '/large.jpg';
  // An admin override wins over TMDB's own treatment, exactly as it does for
  // every other piece of artwork the site serves.
  const logoUrl = detail?.logoUrl || media?.logoUrl || '';
  const videos = media?.videos || [];
  const heroTrailerKey = videos[0]?.key;
  const seasons = detail?.type === 'tv' ? (detail.seasons || []) : [];
  const recommendations = (detail?.recommendations || []).filter((it) => it._id !== `tmdb-${type}-${id}`);

  const openTitle = (item) => {
    const route = titlePagePath(item);
    if (route) nav(route, { state: { item } });
  };

  // Play still lands on the protected player, which bounces a signed-out visitor
  // to sign-in — the same place the reference sends them.
  const playEpisode = (episode) => {
    const season = seasons[seasonIdx];
    if (!season || !episode) return;
    nav(`/watch/tmdb/${id}?season=${season.seasonNumber}&episode=${episode.episodeNumber}`);
  };

  return (
    <div
      className={`oon-page ont-page${heroTrailerKey ? ' has-ambient-trailer' : ''}`}
      style={art ? { '--ont-ambient': `url("${art}")` } : undefined}
    >
      {heroTrailerKey && (
        <div className="ont-video-ambient" aria-hidden="true">
          <iframe
            className="ont-hero-trailer"
            ref={heroPlayerRef}
            src={`https://www.youtube-nocookie.com/embed/${heroTrailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroTrailerKey}&playsinline=1&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(typeof window === 'undefined' ? '' : window.location.origin)}`}
            title="Title trailer background"
            tabIndex="-1"
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      <Masthead siteName={branding.siteName} />
      <PillNav hasTrailers={videos.length > 0} hasEpisodes={seasons.length > 0} />
      <Hero title={title} art={art} logoUrl={logoUrl} trailerKey={heroTrailerKey} iframeRef={heroPlayerRef} />

      <div className="oon-column">
        {!hero && <PageLoadingSkeleton variant="rows" rowCount={3} />}

        {hero && <InfoCard item={detail || hero} />}

        {videos.length > 0 && <Trailers videos={videos} onPlay={setVideo} />}

        {seasons.length > 0 && (
          <Episodes
            seasons={seasons}
            seasonIdx={seasonIdx}
            onSeason={setSeasonIdx}
            episodes={episodes}
            loading={epLoading}
            onPlay={playEpisode}
          />
        )}

        {detail && <Details item={detail} />}

        <div className="ont-join-row">
          <Link to="/signup" className="oon-join">Join Now</Link>
        </div>

        {/* The pill nav's "More to Watch" target: the heading may scroll it to
            either discovery rail, so the anchor wraps both. */}
        <div id="ont-watch">
          {recommendations.length > 0 && (
            <PosterRail title="You Might Also Like" id="ont-like" items={recommendations} onOpen={openTitle} />
          )}
          {trending.length > 0 && (
            <PosterRail title="Trending Now" id="ont-trending" items={trending} onOpen={openTitle} />
          )}
        </div>

        <Plans />
        <Closing siteName={branding.siteName} />
      </div>

      <Footer />

      {video && <TrailerOverlay video={video} onClose={() => setVideo(null)} />}
    </div>
  );
}
