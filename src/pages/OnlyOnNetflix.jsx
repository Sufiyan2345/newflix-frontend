import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { API } from '../api';
import useBranding from '../hooks/useBranding';
import { useAuth } from '../context/AuthContext';
import { titlePagePath } from '../utils/tmdbTitleRoute';

// ============================================================================
// "Only on Netflix" — the page the footer's third-column button opens.
//
// The reference is netflix.com/pk/browse/genre/839338, a PUBLIC marketing page
// (no membership gate), so this route is deliberately not wrapped in
// <Protected>: the footer prints the link on the landing page too, where nobody
// is signed in yet.
//
// The page is assembled from the two catalogue feeds the rest of the site
// already uses — /tmdb/browse/movie and /tmdb/browse/tv. Both are cached
// server-side for 30 minutes, so opening this page costs the same two requests
// the "Movies" and "TV Series" navbar pages already make, and it can never
// show a stale or hand-written list.
// ============================================================================

// The rails themselves — their order, their titles and each one's "Explore more"
// destination — come from GET /tmdb/only-on-netflix (see ONLY_ON_NETFLIX_ROWS in
// backend/controllers/tmdbController.js). Netflix hand-curates that list, so
// rebuilding it here out of the /tmdb/browse feed could only ever approximate the
// reference's headings; the server declares it once and the page just prints it.

// The four tiers, copied from the reference's own plan grid. Prices are the PK
// tiers; `points` is the reference's own two-line bullet run per tier.
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

// The reference's own chevron glyphs, so the arrows and the "Explore more" chip
// are pixel-identical rather than a generic caret.
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
const Checkmark = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
    <path
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
      d="M9.55 17.6 4.4 12.44l1.42-1.41 3.73 3.73 8.73-8.73 1.41 1.42z"
    />
  </svg>
);
// Tudum's own 16x16 mark, straight off the reference strip.
const TudumMark = () => (
  <svg viewBox="0 0 16 16" width="28" height="28" fill="none" aria-hidden="true" focusable="false" className="oon-tudum-mark">
    <path fill="currentColor" d="M15 2v4.68h-4.2v7.55H5.2V6.7H1V2z" />
  </svg>
);

// ---------------------------------------------------------------------------
// The masthead. The reference header is 72px and holds exactly two things: the
// wordmark and a white "Sign In" pill. A signed-in member gets the same pill
// turned into an account link rather than a second navigation bar, because
// this page is the marketing page — it is reached from the footer, not the nav.
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
// The hero. The reference panel is a pre-rendered collage of title art, tilted
// and packed edge to edge behind the copy block. That artwork ships as a single
// JPEG (/large.jpg) with the tilt and the tile packing already baked in, so the
// panel is one <img> plus a shaped scrim - see `.oon-hero-scrim` in the stylesheet,
// where the scrim must stay transparent or it hides the collage entirely.
// ---------------------------------------------------------------------------
function Hero({ siteName }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [filled, setFilled] = useState(false);
  const value = email.trim();
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value);

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    // The address is handed to the sign-up step, exactly like the landing page's
    // own email capture does, so the member never types it twice.
    nav(`/signup?email=${encodeURIComponent(value.toLowerCase())}`);
  };

  return (
    /* Three nested boxes, mirroring the reference's own nesting exactly. The
       OUTER one exists only to own the drop shadow: live applies
       `filter: drop-shadow(...)` one level above the masked frame, so the shadow
       is cast by the frame's masked silhouette. Putting the filter on the frame
       itself is not equivalent - it filters the masked element instead - so the
       extra level is reproduced rather than collapsed. */
    <div className="oon-hero-outer">
      <div className="oon-hero-frame">
        {/* The artwork is a SIBLING of the copy panel on the reference, not a
            child of it, so that the panel paints over the collage. */}
        <div className="oon-hero-art" aria-hidden="true">
          <img className="oon-hero-background" src="/large.jpg" alt="" draggable="false" />
          <div className="oon-hero-scrim" />
        </div>

        <section className="oon-hero" aria-labelledby="oon-hero-title">
        <div className="oon-hero-copy">
        <h1 id="oon-hero-title">Only on {siteName}</h1>
        <p>
          {siteName} is the home of amazing original programming that you can&rsquo;t find anywhere
          else. Movies, TV shows, specials and more, all tailored specifically to you.
        </p>
        <form className="oon-hero-form" onSubmit={submit} noValidate>
          <div className={`oon-field${filled ? ' filled' : ''}`}>
            <input
              id="oon-email" type="email" value={email} maxLength={254}
              autoComplete="email" spellCheck="false"
              onChange={(e) => { setEmail(e.target.value); setFilled(true); }}
            />
            <label htmlFor="oon-email">Email address</label>
          </div>
          <button className="oon-join" type="submit">Join Now</button>
        </form>
        <p className="oon-hero-price">Endless entertainment starting at Rs 250</p>
        </div>
        </section>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// One title rail. The reference rail is a horizontal scroller of 5:7 posters
// with the title printed UNDER each one, centred and clamped to three lines —
// not Netflix's usual 16:9 landscape tile. The arrows live outside the scroller
// in the page gutter, which is why the scroller's own container is padded in.
// ---------------------------------------------------------------------------
// The four marks the reference prints on a rail's artwork, and the only ones it
// prints:
//
//   N          top-left, every card            -> the brand mark
//   TOP 10     top-right, the rail's first 3   -> that title is in this
//                                                 category's chart (the server
//                                                 flags them with `inTop10`)
//   Recently   bottom, films released in the   -> `isNewRelease` from TMDB's
//   Added      last ~45 days                      release date
//   New        bottom, a show whose first run  -> the rail's own "New Season"
//   Season     landed in the last ~45 days
//   New        bottom, two stacked chips, a
//   Episode +  show that is MID-season (more
//   Watch Now  than one season out)
//
// Films never get "Watch Now" and shows never get "Recently Added" — Netflix
// words the two surfaces differently, exactly as `Ribbon` does for the member
// rails in Row.jsx.
function TileBadges({ item }) {
  const series = item.type === 'tv';
  const returning = series && (item.seasonsCount || 0) > 1;
  return (
    <>
      <img className="oon-tile-brand" src="/Netflix.png" alt="" aria-hidden="true" draggable="false" />
      {item.inTop10 && (
        <span className="oon-tile-top" aria-hidden="true"><b>TOP</b><i>10</i></span>
      )}
      {item.isNewRelease && (returning ? (
        <span className="oon-tile-chips">
          <span className="oon-chip red">New Episode</span>
          <span className="oon-chip white">Watch Now</span>
        </span>
      ) : (
        <span className="oon-tile-chip">{series ? 'New Season' : 'Recently Added'}</span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Artwork fallback. `normalize` yields posterUrl: '' for any title TMDB returns
// without a poster_path, and bannerUrl: '' for one without a backdrop_path, so a
// title missing BOTH renders a broken <img> in the rail. Falling back in the DOM
// covers the whole chain in order (poster -> backdrop -> nothing) without needing
// a backend change, and the final step clears the <img> so the tile keeps its
// 5:7 box and its caption instead of collapsing or showing the broken glyph.
// ---------------------------------------------------------------------------
function RailArt({ item }) {
  const [src, setSrc] = useState(item.posterUrl || item.bannerUrl || '');
  const [dead, setDead] = useState(false);

  // Re-arm whenever the card actually changes (rails are keyed, but the modal
  // re-renders this list), so a failed image is not cached across cards.
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
      className="oon-tile-art"
      src={src}
      alt={item.title}
      loading="lazy"
      draggable="false"
      // Try the other artwork source once, then give up and show the placeholder.
      onError={() => {
        const alt2 = src === item.posterUrl ? item.bannerUrl : item.posterUrl;
        if (alt2 && alt2 !== src) setSrc(alt2);
        else setDead(true);
      }}
    />
  );
}

function TitleRail({ rail, isLast }) {
  const nav = useNavigate();
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
  }, [rail.items, sync]);

  const page = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  // EVERY card opens the title's own screen — the full public title page at
  // /p/only-on-netflix/title/:type/:id (hero, info card, Trailers, Episodes,
  // More Details, the discovery rails, the plan grid and the footer). The card
  // already carries the only two things that route needs inside its own
  // `tmdb-<type>-<id>` key, and the card itself rides along in router state so
  // the new screen can paint its hero before the detail call answers — the same
  // reason the hover cards hand their item to the modal.
  const open = (item) => {
    const route = titlePagePath(item);
    if (route) nav(route, { state: { item } });
  };

  return (
    <section className={`oon-rail${isLast ? ' is-last' : ''}`} aria-labelledby={`oon-rail-${rail.key}`}>
      <div className="oon-rail-head">
        <h2 id={`oon-rail-${rail.key}`}>{rail.title}</h2>
        {rail.explore && (
          <Link to={rail.explore} className="oon-explore" aria-label={`Explore more ${rail.title}`}>
            <ChevronRight size={24} height={16} />
          </Link>
        )}
      </div>
      <div className="oon-rail-viewport">
        <button
          type="button" className="oon-arrow prev" aria-label={`Scroll ${rail.title} left`}
          disabled={edges.start} onClick={() => page(-1)}
        >
          <ChevronLeft />
        </button>
        <div className="oon-rail-track" ref={trackRef}>
          {rail.items.map((item) => (
            <div className="oon-tile" key={item._id}>
              <button
                type="button" className="oon-tile-link"
                onClick={() => open(item)}
                aria-label={`More about ${item.title}`}
              >
                {/* The art sits in its own box so the four badges can be anchored
                    to the POSTER's corners rather than the whole tile (which also
                    contains the caption below it). */}
                <span className="oon-tile-art-box">
                  <RailArt item={item} />
                  <TileBadges item={item} />
                </span>
                <span className="oon-tile-name">{item.title}</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button" className="oon-arrow next" aria-label={`Scroll ${rail.title} right`}
          disabled={edges.end} onClick={() => page(1)}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The four plan cards, then the closing banner + Tudum strip.
// ---------------------------------------------------------------------------
function Plans() {
  return (
    <section className="oon-plans" aria-labelledby="oon-plans-title">
      <h2 className="oon-plans-title" id="oon-plans-title">A Plan To Suit Your Needs</h2>
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

// The closing banner and the Tudum strip, which sit between the plan grid and
// the footer on the reference, plus its sticky Join Now CTA.
//
// The banner carries a POSTER COLLAGE on the reference, not flat black, so the
// same poster list that fills the hero is laid along the strip here.
function Closing({ siteName, posters, showFloatingCta }) {
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
      <div className={`oon-float${showFloatingCta ? ' is-visible' : ''}`} data-uia="floating-cta">
        <div className="oon-float-inner">
          <Link to="/signup" className="oon-join">Join Now</Link>
        </div>
      </div>
    </>
  );
}

export default function OnlyOnNetflix() {
  const branding = useBranding();
  const [rails, setRails] = useState(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.oon-hero-frame');
    const footer = document.querySelector('.oon-page .footer');
    if (!hero || !footer) return undefined;

    const visibility = { hero: true, footer: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) visibility.hero = entry.isIntersecting;
        if (entry.target === footer) visibility.footer = entry.isIntersecting;
      }
      setShowFloatingCta(!visibility.hero && !visibility.footer);
    });
    observer.observe(hero);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // ONE feed, not two. /tmdb/only-on-netflix already returns the reference's 17
  // rails in the reference's order, under the reference's own titles, each with
  // its "Explore more" target and its cards' badge flags — so there is nothing
  // left to assemble on the client.
  //
  // Both this and /tmdb/browse are cached 30 minutes server-side, so the page
  // still costs one request. `softFail` keeps the page's own chrome — hero,
  // plans, banner, footer — intact if TMDB is down or unconfigured, instead of
  // blanking the screen.
  useEffect(() => {
    let alive = true;
    API.get('/tmdb/only-on-netflix', { softFail: true })
      .then(({ data }) => { if (alive) setRails(data?.rows || []); })
      .catch(() => { if (alive) setRails([]); });
    return () => { alive = false; };
  }, []);

  // The collage artwork. A 7x2 grid fills the desktop panel; on a phone the
  // panel is a TALL one, so the grid goes 4x4 and needs more tiles — hence 28
  // here. The container clips whatever the current grid does not use, so the
  // same list serves both without a media query in JavaScript.
  const posters = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const rail of (rails || []).slice(0, 3)) {
      for (const item of rail.items) {
        const src = item.posterUrl || item.bannerUrl;
        if (!src || seen.has(src)) continue;
        seen.add(src);
        out.push(src);
        if (out.length === 28) return out;
      }
    }
    return out;
  }, [rails]);

  return (
    <div className="oon-page">
      <Masthead siteName={branding.siteName} />
      <Hero siteName={branding.siteName} />

      <div className="oon-column">
        {rails === null && <PageLoadingSkeleton variant="rows" rowCount={4} />}
        {rails && rails.length > 1 && rails.map((rail, i) => (
          <TitleRail key={rail.key} rail={rail} isLast={i === rails.length - 1} />
        ))}
        {rails && rails.length <= 1 && (
          <p className="oon-empty">
            The catalogue is taking a moment to load. Browse everything in the meantime.
          </p>
        )}

        <Plans />
        <Closing siteName={branding.siteName} posters={posters} showFloatingCta={showFloatingCta} />
      </div>

      <Footer />
    </div>
  );
}
