import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCenterHeader, HelpCenterHomeFooter } from '../components/HelpCenterChrome';
import {
  ALL_HELP_ARTICLES,
  ARTICLE_ICON_PATH,
  HELP_CENTER_TOPICS,
  POPULAR_TOPICS,
  QUICK_LINKS,
  TOPIC_ICONS,
} from '../utils/helpCenterContent';

// The Help Center landing page — help.netflix.com/en.
//
// This is the one Help Center screen that is NOT an article, so it is its own
// component rather than another shape inside StaticPage. It is also the one that
// runs on the light theme end to end: the reference gives the home page
// <body class="page-home-redesign"> with .global-header.light-theme and
// .global-page-footer.light-theme, while the article pages use the dark header
// and the black footer. So the masthead and footer below are variants of the
// shared chrome, not copies of it.
//
// Measured off the live page at 1280px:
//   header            66px, 1px bottom border rgba(128,128,128,.2), white
//   search column     600px, centred, title 40/50 centred
//   search box        2px gradient ring (red -> purple -> blue), 4px radius,
//                     inner field 2px radius
//   topic cards       600px wide, 8px radius, 1px rgba(128,128,128,.4)
//   card header       24px icon, 16px right gutter, 18/27 bold title
//   sub-category row  12px pad, 1px rgba(128,128,128,.2) rule, 16/24 bold
//   quick link row    12px pad, 1px rule on top, 16px glyph, 12px gutter

// How many matching articles the autosuggest shows. The reference asks its own
// service for 5 (home-redesign.js passes count:5).
const MAX_SUGGESTIONS = 5;

// The reference's own ranking: a word-start hit beats a mid-word one, and an
// earlier hit beats a later one, with the shorter title breaking ties.
function searchArticles(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_HELP_ARTICLES
    .map((article) => {
      const title = article.title.toLowerCase();
      const at = title.indexOf(q);
      if (at === -1) return null;
      const wordStart = at === 0 || /\s/.test(title[at - 1]);
      return { article, score: (wordStart ? 0 : 100) + at * 10 + article.title.length };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((r) => r.article);
}

// One topic card: the coloured glyph + heading, then a <details> per
// sub-category. The reference uses native <details>/<summary>, so the open
// state and the keyboard contract come from the platform; this mirrors that
// rather than re-implementing an accordion.
function TopicCard({ topic }) {
  return (
    <div className="hc-topic-card">
      <div className="hc-topic-header">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fillRule="evenodd" clipRule="evenodd" d={TOPIC_ICONS[topic.icon]} />
        </svg>
        <strong className="hc-topic-name">{topic.title}</strong>
      </div>
      <div className="hc-subcategories">
        {topic.subcategories.map((sub) => (
          <details className="hc-subcategory" key={sub.id}>
            <summary className="hc-subcategory-header">
              <strong className="hc-subcategory-name">{sub.title}</strong>
              {/* The reference's chevron: a filled path pointing down, rotated
                  180deg when the group is open. */}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fillRule="evenodd" d="M5.65 7.92L12 13.37l6.35-5.45 1.3 1.52L12 16 4.35 9.44l1.3-1.52z" />
              </svg>
            </summary>
            <ul className="hc-articles-list">
              {sub.articles.map((article) => (
                <li className="hc-article-item" key={`${sub.id}-${article.title}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <rect x="8" y="7" width="8" height="2" fill="#050505" />
                    <rect x="8" y="11" width="5" height="2" fill="#050505" />
                    <path fillRule="evenodd" clipRule="evenodd" d={ARTICLE_ICON_PATH} fill="#050505" />
                  </svg>
                  <Link className="hc-article-link" to={article.to}>{article.title}</Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}

// The search field. The reference is a react-autosuggest box whose container
// carries the gradient ring; the list it opens is white inside that same ring,
// which is why the panel is inset 2px on every side.
function HelpSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const matches = useMemo(() => searchArticles(query), [query]);

  // Click-away closes the list, and a click INSIDE it does not — treating the
  // whole control as one hit area is what stops a reader losing the list by
  // clicking a result's whitespace.
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (article) => {
    setOpen(false);
    setQuery('');
    navigate(article.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (matches.length ? (i + 1) % matches.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (matches.length ? (i - 1 + matches.length) % matches.length : -1));
    } else if (e.key === 'Enter') {
      // Enter takes the highlighted row when there is one. With nothing
      // highlighted it does nothing: the reference has no search results page,
      // it only filters the box in place.
      if (active >= 0 && matches[active]) { e.preventDefault(); go(matches[active]); }
    }
  };

  const showList = open && matches.length > 0;

  return (
    <div className="hc-search" ref={wrapRef}>
      <label className="sr-only" htmlFor="hc-search-input">Search</label>
      <div className={`hc-search-control${showList ? ' is-open' : ''}`}>
        <input
          id="hc-search-input"
          name="q"
          type="text"
          className="hc-search-input"
          placeholder="Type a question, topic or issue"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="hc-search-suggestions"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {/* The reference's own 24x24 magnifying glass, 16px in from the left. */}
        <svg className="hc-search-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fillRule="evenodd"
            d="M11 18a7 7 0 10-7-7 7 7 0 007 7zm7-1.38l3.68 3.67-1.42 1.42L16.62 18A9 9 0 1118 16.62z"
          />
        </svg>
      </div>
      {showList && (
        <ul className="hc-search-suggestions" id="hc-search-suggestions" role="listbox">
          {matches.map((article, i) => (
            <li key={`${article.topic}-${article.title}`} role="none">
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className={`hc-suggestion${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(article)}
              >
                {article.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const topicsRef = useRef(null);

  // "Explore Topics" is an in-page link on the reference, but a bare fragment
  // jump leaves the cards flush under the header. Its script scrolls to the
  // section minus 80px and animates, which is what is reproduced here.
  const scrollToTopics = (e) => {
    e.preventDefault();
    const section = topicsRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="static-page hc-page hc-home">
      <HelpCenterHeader light />

      <main className="hc-home-main">
        {/* The search half. On the reference this block is min-height 96svh and
            flex-centred, which is what leaves the title floating in the middle
            of the first screen rather than sitting under the header. */}
        <div className="hc-search-focus">
          <section className="hc-search-intro">
            <div className="hc-search-intro-wrapper">
              <h1 className="hc-intro-title">How can we help?</h1>
              <HelpSearch />
              <div className="hc-simplified-recommendations">
                {/* The gap after the label is a real space in the reference's
                    text, not a margin — without it the bold run and the first
                    link butt together as "Popular topics:How to sign up". */}
                <strong className="hc-popular-label">Popular topics: </strong>
                {POPULAR_TOPICS.map((t, i) => (
                  <span className="hc-popular-item" key={t.title}>
                    {i > 0 && <span className="hc-popular-sep">, </span>}
                    <Link to={t.to}>{t.title}</Link>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <a
            id="hc-explore-topics"
            className="hc-explore-topics"
            href="#hc-topics-section"
            onClick={scrollToTopics}
          >
            <span>Explore Topics</span>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path
                fillRule="evenodd"
                d="M13 17.64l5.35-4.58 1.3 1.52L12 21.13l-7.65-6.55 1.3-1.52L11 17.64V3h2v14.64z"
                fill="#000000"
              />
            </svg>
          </a>
        </div>

        {/* The topics half: the five cards, then Quick Links, both on the same
            600px column the search box uses. */}
        <section className="hc-topics-section" id="hc-topics-section" ref={topicsRef}>
          <div className="hc-categories">
            {HELP_CENTER_TOPICS.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          </div>

          <div className="hc-quick-links">
            <h3 className="hc-quick-links-title">Quick Links</h3>
            <ol className="hc-quick-links-list">
              {QUICK_LINKS.map((q) => (
                <li className="hc-quick-link" key={q.label}>
                  <svg
                    width="16"
                    height="16"
                    viewBox={q.viewBox}
                    aria-hidden="true"
                    focusable="false"
                  >
                    {q.paths.map((attrs, i) => <path key={i} {...attrs} />)}
                  </svg>
                  <Link to={q.to}>{q.label}</Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <HelpCenterHomeFooter />
    </div>
  );
}
