import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconClose } from '../components/Icons';

// The page the footer's "Investor Relations" link opens, rebuilt to match
// ir.netflix.net/ir-overview/profile (the "Company Profile" screen) band for
// band. Measurements, colours and type sizes below are taken from that site's
// own stylesheets (global.css / client.css on s22.q4cdn.com) so the clone lines
// up with the real page at the same viewport:
//
//   header      white, 1280px container, uppercase 12px nav with hover dropdowns
//   banner      #221f1f, 480px tall, photo (inner-banner.jpg) over 3/5 of the
//               width and the red stock block over 2/5
//   pane--left  white, 68px above / 85px below, two half-width cards
//               (Investor Events + Investor Kit)
//   pane--content  body-coloured #f5f5f1: Financial Releases, Quarterly
//               Earnings, Quick Links
//   footer      white, logo left, "Follow" circles + Terms/Privacy right
//
// The dropdowns are real: every item lands on a page or an anchor that exists
// in this app, and the three link lists are filtered by the header search.

// Top-level menu, copied label-for-label and child-for-child from ir.netflix.net.
const IR_NAV = [
  {
    label: 'Overview',
    to: '/p/investor-relations',
    items: [
      { label: 'Profile', to: '/p/investor-relations' },
      { label: 'Top Investor Questions', to: '/p/faq' },
      { label: 'Content Accounting Overview', to: '/p/investor-relations#investor-kit' },
      { label: 'Netflix Culture', to: '/p/jobs' },
      { label: 'About Netflix', to: '/p/corporate-information' },
    ],
  },
  {
    label: 'Financials',
    to: '/p/investor-relations#quarterly-earnings',
    items: [
      { label: 'Quarterly Earnings', to: '/p/investor-relations#quarterly-earnings' },
      { label: 'Financial Statements', to: '/p/investor-relations#quarterly-earnings' },
      { label: 'Annual Reports & Proxies', to: '/p/investor-relations#quick-links' },
      { label: 'SEC Filings', to: '/p/investor-relations#quick-links' },
      { label: 'Tax Information', to: '/p/legal-notices' },
    ],
  },
  {
    label: 'News & Events',
    to: '/p/investor-relations#releases',
    items: [
      { label: 'Financial Releases', to: '/p/investor-relations#releases' },
      { label: 'Investor Events', to: '/p/investor-relations#events' },
    ],
  },
  {
    label: 'Stock Info',
    to: '/p/investor-relations#stock',
    items: [
      { label: 'Stock Quote', to: '/p/investor-relations#stock' },
      { label: 'Stock Chart', to: '/p/investor-relations#stock' },
      { label: 'Historical Stock Quote', to: '/p/investor-relations#stock' },
      { label: 'Investment Calculator', to: '/p/investor-relations#stock' },
    ],
  },
  {
    label: 'Environmental, Social & Governance',
    to: '/p/corporate-information',
    items: [
      { label: 'ESG', to: '/p/corporate-information' },
      { label: 'Leadership & Directors', to: '/p/corporate-information' },
      { label: 'Governance Docs', to: '/p/legal-notices' },
      { label: 'Committee Membership', to: '/p/legal-notices' },
    ],
  },
  {
    label: 'Resources',
    to: '/p/media-center',
    items: [
      { label: 'Newsroom', to: '/p/media-center' },
      { label: 'Email Alerts', to: '/p/investor-relations#releases' },
      { label: 'Investor Contacts', to: '/p/contact' },
      { label: 'Social Media Disclosure', to: '/p/legal-notices' },
      { label: 'EEO-1 Reports', to: '/p/legal-notices' },
      { label: 'Political Activity Disclosures', to: '/p/legal-notices' },
    ],
  },
];

// The stock header box. The numbers are the ones printed in the reference
// screenshot of the real page.
const STOCK = {
  exchange: 'NASDAQ: NFLX',
  price: '71.14',
  direction: 'down',
  change: '0.57',
  percent: '0.80',
  volume: '152,425',
  delay: 'Pricing delayed by 20 minutes',
  updated: 'Last Updated 09/25/26 4:00 PM',
};

// The earnings-interview player the real card drops under "All Events".
const VIDEO = {
  href: 'https://www.youtube.com/watch?v=qqGCRlldcXY&t=1s',
  embed: 'https://www.youtube.com/embed/qqGCRlldcXY?start=1&rel=0',
  title: 'Netflix Q2 2026 Earnings Interview',
};

const VIDEO_INTERVIEW = VIDEO.href;

// The two "latest events" rows the real events widget renders (limit: 2). The
// date is split the way the Q4 template splits it - a <span class=date-text>
// with 5px of right padding, then the time and the zone - and each row also
// carries the ICS start/end used by "Add to Calendar".
//
// `upcoming` rows get a calendar entry, past rows get the documents that came
// out of them; `video` is the webcast link and sits in its own block, ahead of
// the document list, exactly like .module_webcast in the real markup.
const EVENTS = [
  {
    title: 'Netflix Third Quarter 2026 Earnings Interview',
    date: 'Oct 20, 2026',
    time: '01:45',
    zone: 'PST',
    start: '20261020T204500Z',
    end: '20261020T214500Z',
    upcoming: true,
    video: null,
    docs: [],
  },
  {
    title: 'Netflix Second Quarter 2026 Earnings Interview',
    date: 'Jul 16, 2026',
    time: '01:45',
    zone: 'PST',
    start: '20260716T204500Z',
    end: '20260716T214500Z',
    upcoming: false,
    video: VIDEO_INTERVIEW,
    docs: [
      { label: 'Letter to Shareholders', icon: 'pdf' },
      { label: 'Financial Statements', icon: 'xls' },
      { label: 'Transcript', icon: 'pdf' },
    ],
  },
];

const KIT_LINKS = [
  { label: 'Top Investor Questions', to: '/p/faq' },
  { label: 'Content Accounting Overview', to: '/p/investor-relations#investor-kit' },
  { label: 'Netflix Culture', to: '/p/jobs' },
  { label: 'Netflix Approach to Corporate Governance', to: '/p/corporate-information' },
];

const RELEASES = [
  { title: 'Netflix to Announce Third Quarter 2026 Financial Results', date: 'Sep 14, 2026' },
  { title: 'Netflix to Announce Second Quarter 2026 Financial Results', date: 'Jun 15, 2026' },
  { title: 'Netflix to Announce First Quarter 2026 Financial Results', date: 'Mar 13, 2026' },
];

// The four links under Quarterly Earnings. `icon` is one of the SVGs the real
// site loads from its own design folder.
const QUARTER_LINKS = [
  { label: 'Video Interview', icon: '/ir/webcast.svg', to: VIDEO.href, external: true },
  { label: 'Letter to Shareholders', icon: '/ir/pdf.svg', to: '/p/investor-relations#quarterly-earnings' },
  { label: 'Financial Statements', icon: '/ir/xls.svg', to: '/p/investor-relations#quarterly-earnings' },
  { label: 'Transcript', icon: '/ir/pdf.svg', to: '/p/investor-relations#quarterly-earnings' },
];

const QUICK_LINKS = [
  { label: ['Annual Reports', '& Proxies'], icon: '/ir/txt-rtf-doc.svg', to: '/p/investor-relations#quick-links' },
  { label: ['SEC', 'Filings'], icon: '/ir/SEC-filings.svg', to: '/p/investor-relations#quick-links' },
  { label: ['Stock', 'Information'], icon: '/ir/graph.svg', to: '/p/investor-relations#stock' },
  { label: ['IR Contacts'], icon: '/ir/contact.svg', to: '/p/contact' },
];

// Footer circles. The real sheet draws these from its own q4-icons webfont at
// 12x12; here they are plain SVG so they render identically on every OS. The
// Facebook, Twitter and LinkedIn marks are single filled outlines; Instagram is
// built from a stroked ring + circle + dot, because the usual one-path glyph
// punches its holes with winding order and fills solid under the default
// nonzero rule.
const SOCIALS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/netflix',
    d: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.63A22 22 0 0 0 14.3 3.5c-2.4 0-4 1.46-4 4.15V9.9H7.6V13h2.7v8z',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/netflix',
    d: 'M23.95 4.57a10 10 0 0 1-2.83.78 4.96 4.96 0 0 0 2.17-2.73c-.95.56-2.01.96-3.13 1.19a4.92 4.92 0 0 0-8.39 4.48C7.69 8.1 4.07 6.13 1.64 3.16a4.82 4.82 0 0 0-.67 2.48c0 1.71.87 3.21 2.19 4.1a4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.99 4.99 0 0 1-2.21.08 4.94 4.94 0 0 0 4.6 3.42 9.87 9.87 0 0 1-6.1 2.1c-.39 0-.78-.02-1.17-.06a13.99 13.99 0 0 0 7.56 2.21c9.05 0 14-7.5 14-13.99 0-.21 0-.42-.01-.63A9.93 9.93 0 0 0 24 4.59z',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/netflix/?hl=en',
    stroke: true,
  },
  {
    name: 'LinkedIn',
    href: 'https://ca.linkedin.com/company/netflix',
    d: 'M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0zM3.2 8.45h3.6V21H3.2zM9.1 8.45h3.45v1.72h.05c.48-.9 1.66-1.85 3.42-1.85 3.66 0 4.33 2.4 4.33 5.53V21h-3.6v-6.32c0-1.51-.03-3.45-2.1-3.45-2.1 0-2.43 1.64-2.43 3.34V21H9.1z',
  },
];

// The footer's second link row. "Netflix.com" is the first item on the real
// site and is deliberately hidden there by CSS, so it is skipped here too.
const FOOTER_LEGAL = [
  { label: 'Terms of Use', to: '/p/terms' },
  { label: 'Privacy Policy', to: '/p/privacy' },
];

// ---- small inline glyphs -------------------------------------------------

// The orange RSS badge the two list headings use.
const RssIcon = ({ size = 23 }) => (
  <svg className="ir-rss-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="5.2" cy="18.8" r="2.6" fill="currentColor" />
    <path d="M2.6 10.4v3.1c4.4 0 7.9 3.5 7.9 7.9h3.1c0-6.1-4.9-11-11-11z" fill="currentColor" />
    <path d="M2.6 3.2v3.1c8.4 0 15.1 6.7 15.1 15.1h3.1C20.8 11.5 12.7 3.2 2.6 3.2z" fill="currentColor" />
  </svg>
);

// Right-pointing arrow used by "All Events" and the red pill buttons.
const ArrowGlyph = ({ size = 20 }) => (
  <svg className="ir-arrow" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M13.4 5.6 12 7l4.6 4.6H4v2h12.6L12 18.2l1.4 1.4 6.8-7z" fill="currentColor" />
  </svg>
);

// The calendar badge in front of every "Add to Calendar".
const CalendarGlyph = () => (
  <img className="ir-ico ir-ico-calendar" src={CARD_ICONS.calendar} alt="" aria-hidden="true" />
);

// Code glyph used by the real Investor Relations "Video Interview" link.
const WebcastGlyph = () => (
  <svg className="ir-ico ir-ico-webcast" width="27" height="23" viewBox="0 0 27 23" fill="none" aria-hidden="true" focusable="false">
    <path d="M8 4.5 2 11.5 8 18.5M19 4.5l6 7-6 7" stroke="#A7272B" strokeWidth="2.6" strokeLinejoin="miter" />
    <path d="m16 3.5-5 16" stroke="#D32F30" strokeWidth="2.2" />
  </svg>
);

// File-type badge in front of each event attachment.
const DocGlyph = ({ type }) => (
  <img
    className={`ir-ico ir-ico-${type}`}
    src={CARD_ICONS[type]}
    alt=""
    aria-hidden="true"
    style={{ width: 27, height: 23, objectFit: 'contain' }}
  />
);

const CARD_ICONS = {
  calendar: '/ir/calendar.svg',
  pdf: '/ir/pdf.svg',
  xls: '/ir/xls.svg',
};

const SocialIcon = ({ d, stroke }) => (
  <svg className="ir-social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {stroke ? (
      <>
        <rect x="3.05" y="3.05" width="17.9" height="17.9" rx="5.1"
          fill="none" stroke="currentColor" strokeWidth="2.1" />
        <circle cx="12" cy="12" r="4.55" fill="none" stroke="currentColor" strokeWidth="2.1" />
        <circle cx="17.15" cy="6.85" r="1.35" fill="currentColor" />
      </>
    ) : (
      <path d={d} />
    )}
  </svg>
);

// "Add to Calendar" on the real site opens the visitor's own calendar app. The
// same thing is done here by handing the browser a real .ics file, so nothing
// has to be fetched and no calendar service sees the request.
function addToCalendar(ev) {
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Netflix Investor Relations//EN',
    'BEGIN:VEVENT',
    `UID:${ev.start}-${ev.title.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}@ir.netflix.net`,
    `DTSTART:${ev.start}`,
    `DTEND:${ev.end}`,
    `SUMMARY:${ev.title}`,
    'DESCRIPTION:Netflix Investor Relations',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.title}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Every link on this page is either an in-app route (react-router <Link>) or a
// known off-site destination (<a target="_blank"> with the rel that goes with
// it). Keeping the choice in one place stops a stray target="_blank" opening a
// half-app inside a new tab.
function IrLink({ to, children, className, style }) {
  if (to.startsWith('http')) {
    return (
      <a className={className} style={style} href={to} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link className={className} style={style} to={to}>{children}</Link>;
}


export default function InvestorRelations() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navRef = useRef(null);
  const searchRef = useRef(null);

  // Keep the contrast preference local to this page; the reference persists it
  // in a cookie and marks the control active.
  const [contrast, setContrast] = useState(() => {
    const saved = document.cookie.match(/(?:(?:^|.*;\s*)contrast\s*=\s*([^;]*).*$)|^.*$/);
    return !!saved && saved[1] === 'true';
  });

  useEffect(() => {
    document.cookie = 'contrast=' + contrast + '; path=/';
    document.body.classList.toggle('js--contrast', contrast);
    return () => document.body.classList.remove('js--contrast');
  }, [contrast]);

  // Document title, matching the other static pages.
  useEffect(() => {
    document.title = 'Investor Relations | StreamFlix';
  }, []);

  // The real pane--header is position:fixed and hangs a soft gradient skirt
  // under the bar once content has passed beneath it. The clone pins with
  // position:sticky, so it just needs to know whether the page has scrolled off
  // the top before it paints that skirt.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A "#anchor" in the URL has to scroll after React has painted the section.
  useEffect(() => {
    if (!window.location.hash) return;
    const el = document.querySelector(window.location.hash);
    if (el) el.scrollIntoView({ block: 'start' });
  }, []);

  // Click-away + Escape close the desktop dropdown and the search field, the
  // same way the real Q4 header behaves.
  useEffect(() => {
    const onDoc = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpenMenu(null);
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // The phone breakpoint collapses the bar into the burger sheet, so an open
  // desktop dropdown must not survive the resize.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1115px)');
    const onChange = () => { setOpenMenu(null); setMobileNav(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Typing in the header search narrows the three link lists on the page, which
  // is what the real site's search does for the profile screen's content.
  const q = query.trim().toLowerCase();
  const hit = (text) => !q || text.toLowerCase().includes(q);
  const events = EVENTS.filter((e) => hit(e.title) || hit(e.date));
  const kit = KIT_LINKS.filter((l) => hit(l.label));
  const releases = RELEASES.filter((r) => hit(r.title));
  const noHits = q && !events.length && !kit.length && !releases.length;


  return (
    <div className="ir-page">
      <a className="ir-skip" href="#ir-main">Skip to main content</a>

      <header
        className={`ir-header${searchOpen ? ' ir-header-search-open' : ''}${scrolled ? ' ir-header--scrolled' : ''}`}
        role="banner"
      >
        <div className="ir-header-inner">
          <Link className="ir-logo" to="/p/investor-relations" aria-label="Netflix Investors home">
            <img className="ir-logo-img" src="/newflix.png" alt="Netflix" />
            <span className="ir-logo-text">Investors</span>
          </Link>

          <nav className="ir-nav" ref={navRef} aria-label="Web Menu">
            <ul className="ir-nav-list">
              {IR_NAV.map((group) => (
                <li className={`ir-nav-item${group.label === 'Overview' ? ' selected' : ''}${openMenu === group.label ? ' ir-open' : ''}`} key={group.label}>
                  <Link
                    className="ir-nav-top"
                    to={group.to}
                    aria-haspopup="true"
                    aria-expanded={openMenu === group.label}
                    onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                  >
                    {group.label}
                  </Link>
                  <ul className="ir-dropdown">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          className="ir-dropdown-link"
                          to={item.to}
                          onClick={() => { setOpenMenu(null); setMobileNav(false); }}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`ir-search${searchOpen ? ' ir-search-open' : ''}`} ref={searchRef}>
            <button
              type="button"
              className="ir-search-toggle"
              aria-label="Search investor information"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <IconSearch size={21} />
            </button>
            <input
              className="ir-search-input"
              type="text"
              placeholder="Search by keyword"
              aria-label="Search investor information"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searchOpen && (
              <button
                type="button"
                className="ir-search-close"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <IconClose size={18} />
              </button>
            )}
          </div>

          {/* The light/dark switch, in the 48px slot the real header keeps for it
              (the search block is pinned 48px from the right edge to make room).
              Same module name, same icon-font glyph, same cookie. The reference
              paints no disc behind the glyph - it only recolours the icon - so
              nothing but color is set here, and .js--contrast supplies it. */}
          <button
            type="button"
            className={`module-contrast${contrast ? ' js--active' : ''}`}
            onClick={() => setContrast((v) => !v)}
            aria-pressed={contrast}
            aria-label={contrast ? 'Turn contrast mode off' : 'Turn contrast mode on'}
            title={contrast ? 'Turn contrast mode off' : 'Turn contrast mode on'}
          >
            <i className="q4-icon_accessibility module-contrast_button" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="ir-burger"
            aria-label="Menu"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Phone sheet: the same six groups, stacked, with their children open. */}
        <nav className={`ir-mobile-nav${mobileNav ? ' ir-mobile-nav-open' : ''}`} aria-label="Web Menu">
          <ul className="ir-mobile-list">
            {IR_NAV.map((group) => (
              <li className="ir-mobile-group" key={group.label}>
                <Link className="ir-mobile-top" to={group.to} onClick={() => setMobileNav(false)}>
                  {group.label}
                </Link>
                <ul className="ir-mobile-children">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} onClick={() => setMobileNav(false)}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </header>


      <main className="ir-main" id="ir-main" role="main">
        {/* Banner: photo on the left, the red stock block on the right. */}
        <div className="ir-banner">
          <div className="ir-banner-photo">
            <div className="ir-banner-copy" id="profile">
              <h1 className="ir-banner-title">Company Profile</h1>
              <p className="ir-banner-text">
                Netflix is one of the world&rsquo;s leading entertainment services offering TV
                series, films, games and live programming across a wide variety of genres and
                languages. Members can play, pause and resume watching as much as they want,
                anytime, anywhere, and can change their plans at any time.
              </p>
            </div>
          </div>

          <div className="ir-stock" id="stock">
            {/* Mirrors the original's .module_container--outer > --inner pair: the
                quote column shrinks to its widest line and sits flush with the
                50px padding, which is why it reads left of centre in the box. */}
            <div className="ir-stock-box">
              <div className="ir-stock-inner">
                <span className="ir-stock-exchange">{STOCK.exchange}</span>
                <span className="ir-stock-price">{STOCK.price}</span>
                <span className={`ir-stock-change ir-stock-${STOCK.direction}`}>
                  <span className="ir-stock-indicator" aria-hidden="true">
                    {STOCK.direction === 'down' ? '-' : '+'}
                  </span>
                  {`${STOCK.change} ( ${STOCK.direction === 'down' ? '-' : ''}${STOCK.percent}% )`}
                </span>
                <span className="ir-stock-volume">{STOCK.volume}</span>
                <span className="ir-stock-delay">{STOCK.delay}</span>
                <span className="ir-stock-updated">{STOCK.updated}</span>
              </div>
            </div>
          </div>
        </div>

        {noHits && (
          <p className="ir-no-hits">
            No investor information matches &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {/* pane--left: Investor Events + Investor Kit, side by side on white. */}
        <section className="ir-pane-left" aria-label="Investor events and investor kit">
          <div className="ir-pane-inner ir-two-col">
            <div className="ir-events" id="events">
              <h2 className="ir-title">Investor Events</h2>
              <a className="ir-rss" href="https://ir.netflix.net/rss/Event.aspx" target="_blank" rel="noopener noreferrer">
                <RssIcon />
                <span className="ir-sr-only">Event RSS Feed (opens in new window)</span>
              </a>

              <div className="ir-card">
                <div className="ir-events-list">
                  {events.map((ev) => (
                    <article className="ir-event" key={ev.title}>
                      <h3 className="ir-event-title">
                        <a href="#quarterly-earnings">{ev.title}</a>
                      </h3>
                      <p className="ir-event-date">
                        <span className="ir-event-date-text">{ev.date}</span>
                        <span className="ir-event-time-text">{ev.time} {ev.zone}</span>
                      </p>
                      {/* One inline run of links, divided by 1px rules, exactly as
                          the real .module_links does: a future event offers a
                          calendar entry, a past one the webcast and the documents
                          that came out of it. The blocks after the first each get
                          the leading rule from CSS, and the items inside the
                          document list get the trailing ones. */}
                      <div className="ir-event-links">
                        {ev.upcoming ? (
                          <div className="ir-event-calendar">
                            <button type="button" className="ir-link-btn" onClick={() => addToCalendar(ev)}>
                              <CalendarGlyph />
                              Add to Calendar
                            </button>
                          </div>
                        ) : null}
                        {ev.video ? (
                          <div className="ir-event-webcast">
                            <a className="ir-link-btn" href={ev.video} target="_blank" rel="noopener noreferrer">
                              <WebcastGlyph />
                              Video Interview
                            </a>
                          </div>
                        ) : null}
                        {ev.docs.length ? (
                          <ul className="ir-event-docs">
                            {ev.docs.map((d) => (
                              <li key={d.label}>
                                <a className="ir-link-btn" href="#quarterly-earnings">
                                  <DocGlyph type={d.icon} />
                                  {d.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  {q && !events.length && (
                    <p className="ir-empty">No events match &ldquo;{query.trim()}&rdquo;.</p>
                  )}
                </div>

                <a className="ir-all-events" href="#quarterly-earnings">
                  All Events
                  <ArrowGlyph />
                </a>

                <div className="ir-video">
                  <iframe
                    className="ir-video-frame"
                    src={VIDEO.embed}
                    title={VIDEO.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            <div className="ir-kit" id="investor-kit">
              <h2 className="ir-title">Investor Kit</h2>
              <div className="ir-card ir-kit-card">
                <ul className="ir-kit-list">
                  {kit.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                  {q && !kit.length && (
                    <li className="ir-empty">No investor kit items match &ldquo;{query.trim()}&rdquo;.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>



        {/* pane--content: the three lighter bands under the white one. */}
        <div className="ir-content">
          <section className="ir-module ir-releases" id="releases">
            <div className="ir-module-outer">
              <h2 className="ir-title">Financial Releases and Updates</h2>
              <a className="ir-rss ir-rss-grey" href="https://ir.netflix.net/rss/PressRelease.aspx" target="_blank" rel="noopener noreferrer">
                <RssIcon />
                <span className="ir-sr-only">Press Release RSS Feed (opens in new window)</span>
              </a>

              <div className="ir-release-grid">
                {releases.map((r) => (
                  <div className="ir-release-col" key={r.title}>
                    <div className="ir-release-card">
                      <h3 className="ir-release-title">
                        <a href="#releases">{r.title}</a>
                      </h3>
                      <p className="ir-release-date">{r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              {q && !releases.length && (
                <p className="ir-empty">No releases match &ldquo;{query.trim()}&rdquo;.</p>
              )}

              <a className="ir-btn" href="#releases">All Releases</a>
            </div>
          </section>

          <section className="ir-module ir-quarter" id="quarterly-earnings">
            <div className="ir-module-outer">
              <h2 className="ir-title">Quarterly Earnings</h2>
              <div className="ir-quarter-body">
                <p className="ir-quarter-year">Second-Quarter 2026 Financial Results</p>
                <div className="ir-quarter-links" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center' }}>
                  {QUARTER_LINKS.map((l) => (
                    <IrLink className="ir-quarter-link" style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', whiteSpace: 'nowrap' }} to={l.to} key={l.label}>
                      <img className="ir-quarter-icon" style={{ flex: '0 0 auto', margin: '0 18px 0 0' }} src={l.icon} alt="" aria-hidden="true" />
                      <span className="ir-quarter-link-text">{l.label}</span>
                    </IrLink>
                  ))}
                </div>
              </div>
              <a className="ir-btn" href="#quarterly-earnings">All Quarters</a>
            </div>
          </section>

          <section className="ir-module ir-quick" id="quick-links">
            <div className="ir-quick-outer">
              <h2 className="ir-quick-heading">Quick Links</h2>
              <div className="ir-quick-inner">
                <ul className="ir-quick-list">
                  {QUICK_LINKS.map((l) => (
                    <li key={l.label.join(' ')}>
                      <Link to={l.to}>
                        <img className="ir-quick-icon" src={l.icon} alt="" aria-hidden="true" />
                        <span>
                          {l.label.map((line, i) => (
                            <span className="ir-quick-line" key={line}>
                              {line}{i < l.label.length - 1 && <br />}
                            </span>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="ir-footer" role="contentinfo">
        <div className="ir-footer-inner">
          <Link className="ir-footer-logo" to="/p/investor-relations">
            <img src="/newflix.png" alt="Netflix" />
            <span>Investors</span>
          </Link>

          <div className="ir-footer-social">
            <p>Follow</p>
            <ul>
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                    <SocialIcon d={s.d} stroke={s.stroke} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="ir-footer-legal">
            {FOOTER_LEGAL.map((l) => (
              <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}

