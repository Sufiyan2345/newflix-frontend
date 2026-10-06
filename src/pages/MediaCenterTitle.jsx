import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import {
  Masthead, MediaCenterFooter, usePressTitles, pressSlug, COUNTRIES, useMenu, Caret,
} from './MediaCenter';

// ============================================================================
// /p/media-center/title/:id — the screen a card on the Media Center opens.
//
// The reference is media.netflix.com/en/only-on-netflix/<id>: the press site's
// own title page, reached from a boxshot. It reads top to bottom as:
//
//   masthead          wordmark + language / country / Newsroom / Resources /
//                     Apply / Press Log In / magnifier — the SAME bar the grid
//                     page uses, imported rather than copied, so its dropdowns
//                     have exactly one implementation
//   login CTA         "Log in for full access", the red press button
//   title + release   the name, then "<Season|Film> releasing in <country> on <date>"
//   logline panel     the Logline paragraph, then the Synopsis tag pills
//   poster            the boxshot, on the right
//   Related Articles   five TUDUM cards
//   footer            the same three-column press footer
//
// Every tile already carries its own fields (see toPressTitle in MediaCenter.jsx),
// so this screen resolves the id straight from the same live list the grid
// fetched — no second endpoint, no spinner. Deliberately NOT wrapped in
// <Protected>: it is a public press surface, like the page above it.
// ============================================================================

// The five TUDUM pieces the reference prints under every title. These are the
// reference's own category / headline / byline / date, and each links out to
// TUDUM exactly as the live page does.
const TUDUM_HOME = 'https://www.netflix.com/tudum';
const RELATED_ARTICLES = [
  { category: 'Deep Dive', headline: 'Inside the Ending of East of Eden', author: 'John DiLillo', date: 'October 2, 2026' },
  { category: "Who's Who", headline: 'East of Eden Cast Guide: Who Plays Cathy, Adam, Cal, and Aron in the New Series?', author: 'John DiLillo', date: 'October 2, 2026' },
  { category: 'Cover Story', headline: 'Florence Pugh Found Herself', author: 'Krista Smith', date: 'October 1, 2026' },
  { category: 'What to Watch', headline: 'Travel Back in Time with These 16 Historical Fiction Adaptations', author: 'Ashley Lee', date: 'October 1, 2026' },
  { category: 'New on Netflix', headline: 'New on Netflix in October 2026', author: 'Ashley Lee', date: 'September 30, 2026' },
];

// A deep link to an id the live list no longer holds still renders a real page
// instead of a blank one: "east-of-eden" -> "East Of Eden".
const humanizeId = (id) => String(id || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

function TitlePageSkeleton() {
  return (
    <div className="mct-loading-content" role="status" aria-label="Loading title details">
      <span className="mct-loading-sr">Loading title details…</span>
      <div className="mct-hero">
        <div className="mct-left">
          <span className="mct-skeleton mct-skeleton-title" />
          <span className="mct-skeleton mct-skeleton-release" />
          <div className="mct-skeleton mct-skeleton-panel">
            <span className="mct-skeleton mct-skeleton-label" />
            <span className="mct-skeleton mct-skeleton-copy" />
            <span className="mct-skeleton mct-skeleton-copy short" />
            <span className="mct-skeleton mct-skeleton-label second" />
            <span className="mct-skeleton mct-skeleton-tags" />
          </div>
        </div>
        <div className="mct-right">
          <span className="mct-skeleton mct-skeleton-poster" />
        </div>
      </div>
      <section className="mct-related" aria-hidden="true">
        <span className="mct-skeleton mct-skeleton-related-title" />
        <div className="mct-related-grid">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="mct-skeleton-card" key={index}>
              <span className="mct-skeleton mct-skeleton-thumb" />
              <span className="mct-skeleton mct-skeleton-caption" />
              <span className="mct-skeleton mct-skeleton-caption short" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function MediaCenterTitle() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const brand = useBranding();
  const siteName = brand?.siteName || 'Newflix';
  const list = usePressTitles();
  const [openAnimationComplete, setOpenAnimationComplete] = useState(false);
  const [country, setCountry] = useState(() => COUNTRIES.find((c) => c.code === 'PK') || COUNTRIES[0]);
  const countryMenu = useMenu();

  useEffect(() => {
    const timer = window.setTimeout(() => setOpenAnimationComplete(true), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const decoded = decodeURIComponent(id || '');
  const item = useMemo(() => {
    const searchResult = location.state?.pressTitle;
    if (searchResult?.key === decoded) return searchResult;
    if (!list) return null;
    return list.find((t) => t.key === decoded) || list.find((t) => pressSlug(t.title) === decoded) || null;
  }, [list, decoded, location.state]);

  // While the live list is still in flight, keep a neutral heading rather than a
  // raw id ("tmdb-tv-81611854"); once it resolves, the real title replaces it.
  const title = item?.title || (list ? humanizeId(decoded) : '') || 'Media Center';
  const logline = item?.overview || 'Full details for this title are on the way to the Media Center.';
  const formatWord = item?.type === 'tv' ? 'Season' : 'Film';
  const releaseDate = item?.date || 'Coming soon';
  const isLoading = !openAnimationComplete || (!item && list === null);

  // Format chips + real genres, de-duplicated — exactly what the reference
  // prints as its "Series / Dramas" pills.
  const tags = useMemo(() => {
    const out = [];
    for (const value of [...(item?.formats || []), ...(item?.genres || [])]) {
      if (value && !out.includes(value)) out.push(value);
    }
    return out;
  }, [item]);

  // Article thumbnails reuse the app's own press artwork (the reference uses
  // stills this app does not hold), cycling the other tiles so every card shows
  // a real image and none can 404.
  const others = (list || []).filter((t) => t.key !== decoded && t.art);
  const articles = RELATED_ARTICLES.map((a, i) => ({
    ...a,
    href: TUDUM_HOME,
    image: others.length ? others[i % others.length].art : null,
  }));

  return (
    <div className="mct-page">
      <div
        className="mct-backdrop"
        aria-hidden="true"
      >
        {item?.art && <img className="mct-backdrop-image" src={item.art} alt="" />}
      </div>
      <Masthead siteName={siteName} />
      <main className="mct-main" aria-busy={isLoading}>
        <div className="mct-login-row">
          <Link className="mct-login" to={user ? '/account' : '/login'}>Log in for full access</Link>
        </div>
        {isLoading ? <TitlePageSkeleton /> : <div className="mct-content-reveal">
        <div className="mct-hero">
          <div className="mct-left">
            <h1 className="mct-title">{title}</h1>
            <p className="mct-release">
              {formatWord} releasing{' '}
              <span className="mct-country" ref={countryMenu.wrapRef}>
                <button
                  type="button"
                  className="mct-country-btn"
                  aria-haspopup="listbox"
                  aria-expanded={countryMenu.open}
                  onClick={() => countryMenu.setOpen((v) => !v)}
                >
                  in {country.name}
                  <Caret cls={`mct-country-caret${countryMenu.open ? ' is-open' : ''}`} />
                </button>
                {countryMenu.open && (
                  <ul className="mct-country-list" role="listbox" aria-label="Coverage country">
                    {COUNTRIES.map((c) => (
                      <li key={c.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={c.code === country.code}
                          className={c.code === country.code ? 'is-on' : ''}
                          onClick={() => { setCountry(c); countryMenu.setOpen(false); }}
                        >
                          <span className="mct-country-code">{c.code}</span>
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>{' '}
              on {releaseDate}
            </p>

            <div className="mct-panel">
              <h2 className="mct-label">Logline</h2>
              <p className="mct-logline">{logline}</p>
              <h2 className="mct-label">Synopsis</h2>
              <ul className="mct-tags">
                {tags.map((tag) => <li className="mct-tag" key={tag}>{tag}</li>)}
              </ul>
            </div>
          </div>

          <div className="mct-right">
            {item?.art
              ? <img className="mct-poster" src={item.art} alt={title} />
              : <div className="mct-poster is-keyart"><span>{title}</span></div>}
          </div>
        </div>

        <section className="mct-related" aria-label="Related Articles">
          <h2 className="mct-related-title">Related Articles</h2>
          <div className="mct-related-grid">
            {articles.map((a) => (
              <article className="mct-art-card" key={a.headline}>
                <a
                  className="mct-art-thumb"
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={a.image ? { backgroundImage: `url("${a.image}")` } : undefined}
                >
                  {!a.image && <span className="mct-art-thumb-fallback" aria-hidden="true" />}
                </a>
                <div className="mct-art-body">
                  <div className="mct-art-brand">TUDUM</div>
                  <div className="mct-art-cat">{a.category}</div>
                  <h3 className="mct-art-head">
                    <a href={a.href} target="_blank" rel="noopener noreferrer">{a.headline}</a>
                  </h3>
                  <p className="mct-art-meta">By {a.author} &bull; {a.date}</p>
                  <a className="mct-art-more" href={a.href} target="_blank" rel="noopener noreferrer">Read More</a>
                </div>
              </article>
            ))}
          </div>
        </section>
        </div>}
      </main>
      <MediaCenterFooter />
    </div>
  );
}
