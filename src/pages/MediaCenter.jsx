import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import { openCookiePreferences } from '../utils/cookiePreferences';
import { LANGUAGES as SITE_LANGUAGES, getLanguage, setLanguage } from '../utils/footerLinks';
import { useSiteTranslation } from '../utils/siteTranslation';

// ============================================================================
// MEDIA CENTER — the page the footer's "Media Center" button opens.
//
// The reference is https://media.netflix.com/en/ : a PUBLIC press site, not a
// member screen. It has its own masthead (wordmark + "Media Center", a language
// and a country menu, Newsroom, a Resources menu, Apply, "Press Log In" and a
// magnifier), a photographic hero with a search field, a month selector over
// five format chips, a poster grid, a "Latest news" band, a company-assets band
// and its own three-column footer.
//
// It is reached from the footer, which the landing page prints for anonymous
// visitors too, so this route is deliberately NOT wrapped in <Protected>.
//
// The layout is assembled from the tokens transcribed in
// styles/mediaCenter.css, which were read off the live page's computed styles
// at 1440px and 1920px (see the header comment there for the full table).
//
// The poster grid does NOT hardcode Netflix's press boxshots: it prints THIS
// app's own TMDB posters — the same artwork every other page ships, pulled from
// /tmdb/browse/{movie,tv} by usePressTitles() below — and only falls back to the
// reference's own schedule (TITLES) when TMDB is unreachable or unconfigured.
// ============================================================================

// ---------------------------------------------------------------------------
// The reference's own artwork host. Its poster grid serves 256x359 crops from
// dnm.nflximg.net, so the tiles pull the exact same files the reference does —
// these are the reference's own URLs, captured from its rendered DOM.
// ---------------------------------------------------------------------------
const ART_BASE = 'https://dnm.nflximg.net/api/v6/mAcAr9TxZIVbINe88xb3Teg5_OA/';
const art = (file, rev) => `${ART_BASE}${file}.jpg?r=${rev}`;

// The reference ships two kinds of tile: a "boxshot" (the photograph) and a
// "key art" — a black plate with the N mark and the name set in it, used when a
// title has no approved still. `art: null` produces the second kind, exactly as
// MATCH_ART doesn't exist for those rows on the live page.
const BOXSHOTS = {
  fastOrEden: art('AAAABWQjxsMJpw27D_IW1PIeZ1SLH9bUMZjntJTV3B2kSO80bcheSRM7c-TXnN7J8G4DJ8qwhzl_VFjyFyw9d9QkYr9xdbJw6RgvskQ4', 'd52'),
  ramparts: art('AAAABXWl20xLTs0KeNZVB5vyLF9XlSKpklwacVbFj7iNurv67ZdBm15_u02Ofjn3vlOLvW1-V7wVmzuSZbhGKg9upxdQi_B1wfJm83lB', '5aa'),
  doingLife: art('AAAABQTDp6PDnP1oWMOfzj5Z5PbG89eOyDOBnEMUUxj7UzYjE14_GmAkZ9QKYx3slY_N2tMae_-Oc54RrjLrSiEQAcewkJhoxHZwDXh9', 'b41'),
  blueBox: art('AAAABbiCOLLr8lmcCPeUpsYclr_q6SwPbDEC8ocLdGWx2j7oWJtPZUVnQphRKECsXyHVwfdKiozMj5O9MFfCfJjHoC-OEPJL0cEptKOG', '11c'),
  loveVillage: art('AAAABSdFBRPfobERey06QLKi0FeSykLoKh9Xt0r2BfvL-YD-XavXH9DuaGX_126SHmkQSdUK5BjZMIEptLycvJq5wNidaqXWTJyVfACP', 'b7c'),
  oct8: art('AAAABVRx8_0XgLGreLD_H-dD1N-WiZRl-C5Rik7MNDk5q13OXcu481-ChjFLSza6ENMc_keZ5eA8Q7bSAKDFosI_TYL4knbM5kVRNZhb', 'e87'),
  oct9a: art('AAAABRtvIvgW-cI25SbZbS0vAYrVFzrQs7Gyau7Eh2OhQJ9-6i9HBvGRIMOVs9RPRvz-1lhXMRs8VA-5ZTy72XIq_gnXktmDO3-OtwDK', '162'),
  oct9b: art('AAAABaxcI0MZmKV7j0W0ex6hEM9LnUfe6Crm4na2fiAKGKAkoUoscK9a35PU5amc6olv2kUuxk8O2O7-UJ-kbbu9hGupwL3CnZBIXaNc', '670'),
  oct9c: art('AAAABS1_ttzn8-fwu1WdXBFdwVi79oAJ3zcNB2UZ1BGqlFhJ45cT2-6ULdV7iEtNYeQk5xn0hL_QRmesCtGXIOajG68EsHxG8zmRdGNH', '77e'),
  oct13a: art('AAAABUNsXovDpXb_NIwdxgVDNUbOD25yNCJK8tv7TeCNYZ21w5r387qY0lPVn0wKrFScrefH-IuSihEqFzziS-URoZm4-wshtzBJ6aXb', '644'),
  oct13b: art('AAAABTyozMLSvVedPgbZTn8pN1vPqgx2D-f7Gy19P6nmUA69AWd4UiBYDP3s6qwDb9O2eFhOwZRAzFOR2E8hVCrfLbV1i4Brp98sD-l9', '4cf'),
};

// The five format chips, in the reference's order, each with the glyph it draws.
export const FORMATS = ['Film', 'Series', 'Documentary', 'Kids', 'Reality'];

// The reference shows the previous month first, then the current month and ten
// upcoming months. Keeping the year with each option lets the cards filter to
// the correct October/January when the list crosses a calendar year.
const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const currentMonth = new Date();
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + index - 1, 1);
  const month = CALENDAR_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return { month, year, key: `${year}-${String(date.getMonth() + 1).padStart(2, '0')}` };
});
export const MONTHS = MONTH_OPTIONS.map(({ month }) => month);
// ---------------------------------------------------------------------------
// The catalogue behind the grid.
//
// `formats` drives the five chips: a title tagged Film + Documentary appears
// under both, which is how the reference behaves (its chips are a filter over
// one flat list, not five separate lists).
//
// `art: null` renders the reference's key-art tile instead of a photograph.
// ---------------------------------------------------------------------------
export const TITLES = [
  { title: 'Fast or Eden', date: 'October 1, 2026', formats: ['Film'], art: BOXSHOTS.fastOrEden },
  { title: 'The Ramparts of Ice', date: 'October 1, 2026', formats: ['Series'], art: BOXSHOTS.ramparts },
  { title: "Tyler Perry's Doing Life", date: 'October 2, 2026', formats: ['Film'], art: BOXSHOTS.doingLife },
  { title: 'Blue Box', date: 'October 4, 2026', formats: ['Series', 'Kids'], art: BOXSHOTS.blueBox },
  { title: 'Love Village', date: 'October 6, 2026', formats: ['Reality', 'Series'], art: BOXSHOTS.loveVillage },
  { title: 'El Círculo', date: 'October 7, 2026', formats: ['Series'], art: null },
  { title: 'The Perfect Couple', date: 'October 8, 2026', formats: ['Series'], art: BOXSHOTS.oct8 },
  { title: 'Untamed', date: 'October 9, 2026', formats: ['Series'], art: BOXSHOTS.oct9a },
  { title: 'The Waterfront', date: 'October 9, 2026', formats: ['Series'], art: BOXSHOTS.oct9b },
  { title: 'Monsters', date: 'October 9, 2026', formats: ['Documentary'], art: BOXSHOTS.oct9c },
  { title: 'Nobody Wants This', date: 'October 13, 2026', formats: ['Series'], art: BOXSHOTS.oct13a },
  { title: 'Running Point', date: 'October 13, 2026', formats: ['Series'], art: BOXSHOTS.oct13b },
  { title: 'Hunting Gary Glitter', date: 'October 14, 2026', formats: ['Documentary'], art: null },
  { title: 'Love Is Blind', date: 'October 14, 2026', formats: ['Reality'], art: null },
  { title: 'The Storm', date: 'October 15, 2026', formats: ['Series'], art: null },
  { title: 'Hollywood Arts', date: 'October 15, 2026', formats: ['Series', 'Kids'], art: null },
  { title: 'The Diplomat', date: 'October 15, 2026', formats: ['Series'], art: null },
  { title: 'The Disciple', date: 'October 16, 2026', formats: ['Film'], art: null },
  { title: 'Money Trap', date: 'October 16, 2026', formats: ['Film'], art: null },
  { title: 'The New Stanford Prison Experiment', date: 'October 21, 2026', formats: ['Documentary'], art: null },
  // The eleven the "Show 11 more in October" button reveals — the reference
  // prints 19 tiles and holds the rest back behind that control.
  { title: 'Woman of the Hour', date: 'October 21, 2026', formats: ['Film'], art: null },
  { title: 'His & Hers', date: 'October 22, 2026', formats: ['Series'], art: null },
  { title: 'The Ballad of a Small Player', date: 'October 23, 2026', formats: ['Film'], art: null },
  { title: 'Sirens', date: 'October 23, 2026', formats: ['Series'], art: null },
  { title: 'Black Rabbit', date: 'October 24, 2026', formats: ['Series'], art: null },
  { title: 'The Twister: Caught in the Storm', date: 'October 25, 2026', formats: ['Documentary'], art: null },
  { title: 'Ransom Canyon', date: 'October 26, 2026', formats: ['Series'], art: null },
  { title: 'Zero Day', date: 'October 27, 2026', formats: ['Series'], art: null },
  { title: 'American Primeval', date: 'October 28, 2026', formats: ['Series'], art: null },
  { title: 'Cassandra', date: 'October 29, 2026', formats: ['Series', 'Film'], art: null },
  { title: 'Bet', date: 'October 30, 2026', formats: ['Film'], art: null },
];

// How many tiles stand before the "Show 11 more" control — the reference's own
// first-page count.
export const FIRST_PAGE = 19;

// ---------------------------------------------------------------------------
// The LIVE press catalogue.
//
// The reference fills its grid from Netflix's own CMS, which is why its tiles
// are press boxshots. This app already owns a better source — the TMDB
// integration the rest of the site runs on — so the grid prints the SAME posters
// every other page ships and reshapes them into a press tile.
//
// TITLES above stays the OFFLINE FALLBACK: if TMDB is down or unconfigured the
// band still renders the reference's own schedule instead of an empty grid.
// ---------------------------------------------------------------------------

// "2026-10-01" -> "October 1, 2026". A title with no usable date says so rather
// than leaving a blank caption bar.
const prettyDate = (item) => {
  const raw = item.releaseDate;
  if (raw) {
    const d = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return `${CALENDAR_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  }
  return item.releaseYear ? String(item.releaseYear) : 'Coming soon';
};

const releaseDateSortKey = (item) => {
  const raw = item.releaseDate || item.date || '';
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const displayDate = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(raw);
  if (!displayDate) return null;
  const monthIndex = CALENDAR_MONTHS.indexOf(displayDate[1]);
  if (monthIndex < 0) return null;
  return `${displayDate[3]}-${String(monthIndex + 1).padStart(2, '0')}-${displayDate[2].padStart(2, '0')}`;
};
const releaseMonthKey = (item) => releaseDateSortKey(item)?.slice(0, 7) || null;

// The five chips are a filter over ONE flat list, so a live title is tagged with
// every format it qualifies for: its media type plus the genres TMDB returned.
// The server caps `genres` at three, so the test is "does it list the genre",
// never "is that genre first".
const formatsFor = (item) => {
  const genres = item.genres || [];
  const out = [];
  if (item.type === 'movie') out.push('Film');
  if (item.type === 'tv') out.push('Series');
  if (genres.includes('Documentary')) out.push('Documentary');
  if (genres.includes('Kids') || genres.includes('Family') || genres.includes('Animation')) out.push('Kids');
  if (genres.includes('Reality')) out.push('Reality');
  // Never leave a tile untagged, or a chip could hide a title entirely.
  return out.length ? out : [item.type === 'tv' ? 'Series' : 'Film'];
};

// URL-safe id for a tile. Live tiles carry the catalogue `_id` as `key`; the
// offline fallback list has none, so its title is slugified instead. The detail
// page resolves a route id against both.
export const pressSlug = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Where a search term goes. The reference keeps the term in the query string
// (`/en/search?term=weak+hero`), so the results page is linkable and the back
// button walks the history of searches. An empty term keeps the bare path.
export const pressSearchHref = (term) => {
  const q = String(term || '').trim();
  return q ? `/p/media-center/search?term=${encodeURIComponent(q)}` : '/p/media-center/search';
};

export const toPressTitle = (item) => ({
  key: item._id,
  title: item.title,
  // Everything below is what the tile's own detail screen needs, so that screen
  // never has to re-fetch or re-shape anything the grid already holds.
  type: item.type,
  mediaType: item.mediaType || item.type,
  date: prettyDate(item),
  releaseDate: item.releaseDate || '',
  releaseYear: item.releaseYear || '',
  genres: item.genres || [],
  overview: item.description || item.overview || '',
  formats: formatsFor(item),
  // A poster is the tile's photograph; a title TMDB returned without one gets
  // `null` and renders the reference's key-art plate instead of a broken image.
  art: item.posterUrl || item.bannerUrl || null,
});

// One flat, de-duplicated list assembled from the two browse feeds the site
// already caches (30 minutes, server-side), so the Media Center adds no endpoint
// and no cache of its own. Returns null while the first response is in flight —
// the caller keeps printing the static schedule until the live list arrives.
export function usePressTitles() {
  const [titles, setTitles] = useState(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      API.get('/tmdb/browse/movie', { softFail: true }),
      API.get('/tmdb/browse/tv', { softFail: true }),
    ])
      .then(([movies, shows]) => {
        if (!alive) return;
        const seen = new Set();
        const out = [];
        for (const { data } of [movies, shows]) {
          for (const row of data?.rows || []) {
            for (const item of row.items || []) {
              if (!item.posterUrl || seen.has(item._id)) continue;
              seen.add(item._id);
              out.push(toPressTitle(item));
            }
          }
        }
        setTitles(out.length ? out : TITLES);
      })
      .catch(() => { if (alive) setTitles(TITLES); });
    return () => { alive = false; };
  }, []);
  return titles;
}
// ---------------------------------------------------------------------------
// The three stories in the "Latest news" band. The reference links every card
// to about.netflix.com, so these do the same and open in a new tab.
// ---------------------------------------------------------------------------
export const NEWS = [
  {
    region: 'Global, Spain',
    headline: "Netflix Unveils Our New Competitive Reality Show, 'Plex: Última Partida'",
    href: 'https://about.netflix.com/en/news/netflix-unveils-its-new-competitive-reality-show-plex-ultima-partida',
    image: 'https://images.ctfassets.net/4cd45et68cgf/4uu6OPAKkOiqSWo29GqJP1/0c1b8d3042dfaac84e18382d2be355d4/PLEX_ULTIMA_PARTIDA_NETFLIX_01.jpg?w=552&h=367',
  },
  {
    region: 'Sweden, Norway, Global',
    headline: "Netflix Unveils the Trailer for Swedish Psychological Thriller 'A Couple of Lies'",
    href: 'https://about.netflix.com/en/news/netflix-unveils-the-trailer-for-swedish-psychological-thriller-a-couple-of-lies',
    image: 'https://images.ctfassets.net/4cd45et68cgf/2VirlQxkF8cd3mrUDqyyrZ/47d428f0b38ce89b915137a4c99eda44/Netflix_Entertainment_Evergreen_4__2_.jpg?w=552&h=367',
  },
  {
    region: 'Spain, Global',
    headline: 'Netflix Announces a Collaboration With Filmin, With a Monthly Collection of Films and Documentaries',
    href: 'https://about.netflix.com/en/news/netflix-announces-a-collaboration-with-filmin-with-a-monthly-collection-of-films-and-documentaries',
    image: 'https://images.ctfassets.net/4cd45et68cgf/76OtBTqHABzVme89Qxqeck/b2d3420cc7bb0c71d20dc5d95ce8b467/Row_Mockups_FILMINc.jpg?w=552&h=367',
  },
];

const COUNTRY_CODES = `AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB UM US UY UZ VU VE VN VG VI WF EH YE ZM ZW XK`.split(' ');
const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

// The reference lists every coverage region, not just a few hand-picked countries.
export const COUNTRIES = COUNTRY_CODES
  .map((code) => ({ code, name: REGION_NAMES.of(code) }))
  .filter((country) => country.name && country.name !== country.code)
  .sort((a, b) => a.name.localeCompare(b.name));

// The "Resources" menu. Every entry lands on a page this app already has, so
// the menu never dead-ends the way a copied href would.
export const RESOURCES = [
  { label: 'About Netflix', to: '/p/corporate-information' },
  { label: 'Investor Relations', to: '/p/investor-relations' },
  { label: 'Jobs', to: '/p/jobs' },
  { label: 'Newsroom', href: 'https://about.netflix.com/en/newsroom' },
  { label: 'Company Assets', href: 'https://about.netflix.com/en/company-assets' },
  { label: 'Help Center', to: '/p/help-center' },
];

// The reference's own social row, in its order.
export const SOCIALS = [
  { name: 'Twitter', href: 'https://twitter.com/netflix' },
  { name: 'Instagram', href: 'https://www.instagram.com/netflix' },
  { name: 'Facebook', href: 'https://www.facebook.com/netflix' },
];

// The reference's footer nav: three titled columns plus the social row.
export const FOOTER_COLUMNS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Netflix', href: 'https://about.netflix.com/en/' },
      { label: 'Newsroom', href: 'https://about.netflix.com/en/newsroom' },
      { label: 'Company Assets', href: 'https://about.netflix.com/en/company-assets' },
      { label: 'Start watching', href: 'https://www.netflix.com' },
    ],
  },
  {
    heading: 'Connect',
    links: [{ label: 'Contact Us', to: '/p/contact' }],
    social: true,
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms and Conditions', href: 'https://help.netflix.com/en/legal/media-terms-and-conditions' },
      { label: 'Privacy', href: 'https://help.netflix.com/en/legal/corporateprivacy' },
      { label: 'Cookie Preferences', cookie: true },
    ],
  },
];
// ---------------------------------------------------------------------------
// Glyphs. These are the reference's own 24x24 Hawkins icons, traced from the
// hydrated DOM (the caret, the magnifier and the "open in new tab" arrow are
// the exact path data the live page ships).
// ---------------------------------------------------------------------------

export function Caret({ cls = 'mc-nav-caret' }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M18 9l-6 6-6-6h12z" />
    </svg>
  );
}

export function Magnifier({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path fill="none" d="M0 0h24v24H0z" />
      <path fill="currentColor" fillRule="evenodd" d="M11 18a7 7 0 10-7-7 7 7 0 007 7zm7-1.38l3.68 3.67-1.42 1.42L16.62 18A9 9 0 1118 16.62z" />
    </svg>
  );
}

function ExternalArrow() {
  return (
    <svg className="mc-nav-caret" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="none" d="M0 0h24v24H0z" />
      <path fill="currentColor" fillRule="evenodd" d="M18 20H4V6h10V4H2v18h18V10h-2v10z" />
      <path fill="currentColor" fillRule="evenodd" d="M16 0v2h4.59L9.29 13.29l1.42 1.42L22 3.41V8h2V0h-8z" />
    </svg>
  );
}

// The Netflix "N" logomark, printed on every key-art tile. The reference uses a
// 13x22 PNG (/static/images/n-logo.png); this is the same mark as a path so the
// page carries no extra binary.
export function NMark() {
  return (
    <svg viewBox="0 0 13 22" width="13" height="22" aria-hidden="true" focusable="false">
      <path fill="#e50914" d="M0 0h3.7l5.3 8.9V0h4v22H9.3L4 13.1V22H0z" />
    </svg>
  );
}

// The five chip glyphs, drawn in the reference's flat single-colour style.
function ChipGlyph({ format }) {
  const common = { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', 'aria-hidden': 'true', focusable: 'false' };
  if (format === 'Film') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="7.4" r="1.5" fill="currentColor" />
        <circle cx="16.6" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="16.6" r="1.5" fill="currentColor" />
        <circle cx="7.4" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (format === 'Series') {
    return (
      <svg {...common}>
        <rect x="2.2" y="4.5" width="12.6" height="9.4" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
        <rect x="16.2" y="7.2" width="5.6" height="3.6" rx="0.9" fill="currentColor" />
        <path d="M6.5 17.6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (format === 'Documentary') {
    return (
      <svg {...common}>
        <rect x="2.5" y="4.5" width="19" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="10.4" r="1.9" fill="currentColor" />
        <path d="M7.6 16.6c.9-1.9 2.6-2.9 4.4-2.9s3.5 1 4.4 2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (format === 'Kids') {
    return (
      <svg {...common}>
        <path d="M3 14.6c2.6-1.1 4.4-3 5.3-5.6 1.1 2.6 2.7 4.4 4.6 5.2 1.5.6 3.1.3 4.4-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4.4 18.1c2.2-.9 3.7-2.4 4.5-4.5.9 2.1 2.2 3.6 3.9 4.2 1.2.5 2.5.2 3.6-.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2.6" y="6" width="18.8" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.4 11.2c1.6 1.2 3.6 1.9 5.6 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11 13.1c2.2 0 4.3-.9 5.9-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// A single dropdown's open/close behaviour: click-away and Escape both close
// it, which is what the reference's MUI menus do.
// ---------------------------------------------------------------------------
function isScrollbarInteraction(event) {
  return event.clientX >= document.documentElement.clientWidth
    || event.clientY >= document.documentElement.clientHeight;
}

export function useMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!isScrollbarInteraction(e) && !wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, wrapRef };
}

function CountryPicker({ country, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pickerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const onPointerDown = (event) => {
      if (!isScrollbarInteraction(event) && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const matchingCountries = COUNTRIES
    .filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (a.code === country.code) return -1;
      if (b.code === country.code) return 1;
      return a.name.localeCompare(b.name);
    });

  const chooseCountry = (item) => {
    onChange(item);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="mc-country-select-wrap" ref={pickerRef}>
      <button
        type="button"
        className="mc-country-select"
        role="combobox"
        aria-label="Select coverage country"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{country.code}</span>
        <span className="mc-country-selected-name">{country.name}</span>
        <Caret cls={`mc-country-caret${open ? ' is-open' : ''}`} />
      </button>
      {open && (
        <div className="mc-country-options-panel">
          <label className="mc-country-search">
            <Magnifier size={16} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search"
              aria-label="Search countries"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ul className="mc-country-options" role="listbox" aria-label="Countries">
            {matchingCountries.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.code === country.code}
                  className={item.code === country.code ? 'is-selected' : ''}
                  onClick={() => chooseCountry(item)}
                >
                  <span className="mc-country-option-check" aria-hidden="true">
                    {item.code === country.code ? '✓' : ''}
                  </span>
                  <span className="mc-country-option-code">{item.code}</span>
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
            {matchingCountries.length === 0 && (
              <li className="mc-country-no-results">No countries found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The masthead.
//
// Left: the wordmark lockup ("NETFLIX | Media Center"). Right, in order:
// English, the country, Newsroom (an external link), Resources, Apply,
// "Press Log In" and the magnifier. The bar is fixed and 80px tall; the hero
// pulls itself up underneath it.
//
// "Press Log In" and "Apply" are member-facing on the reference (they post to
// media.netflix.com/en/signin and /en/apply). Here they reach the screens this
// app actually has: a signed-in visitor gets their account, everyone else gets
// the sign-up / sign-in page — so neither button is ever a dead end.
// ---------------------------------------------------------------------------
export function Masthead({ siteName, onSearch = null, onTermChange = () => {} }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useSiteTranslation();
  const [lang, setLang] = useState(getLanguage);
  const [country, setCountry] = useState(() => COUNTRIES.find((item) => item.code === 'PK') || COUNTRIES[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const langMenu = useMenu();
  const countryMenu = useMenu();
  const resMenu = useMenu();
  const navSearchRef = useRef(null);

  // The magnifier reveals the in-bar field and puts the caret in it, the way the
  // reference expands its own search rather than opening a new page.
  useEffect(() => {
    if (searchOpen) navSearchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onLanguageChange = (event) => setLang(event.detail);
    window.addEventListener('sf-language-changed', onLanguageChange);
    return () => window.removeEventListener('sf-language-changed', onLanguageChange);
  }, []);

  // Typing here previews the term on the page's own field, so the hero box and
  // the bar box always hold the same text; submitting runs the search.
  const typeTerm = (value) => {
    setNavQuery(value);
    onTermChange(value);
  };

  const submit = (event) => {
    event.preventDefault();
    const term = navQuery.trim();
    if (!term) return;
    // Every press screen shares this one bar, so the magnifier searches from all
    // of them: a screen that passes `onSearch` handles the term itself, and
    // everything else falls through to the results screen.
    if (onSearch) onSearch(term);
    else navigate(pressSearchHref(term));
    setSearchOpen(false);
  };

  return (
    <nav
      className={`mc-nav${langMenu.open || countryMenu.open ? ' has-preference-open' : ''}`}
      aria-label="Media Center"
    >
      <Link to="/p/media-center" className="mc-brand" aria-label={`${siteName} Media Center`}>
        <img className="mc-brand-wordmark" src="/newflix.png" alt={siteName} draggable="false" />
        <span className="mc-brand-label">Media Center</span>
      </Link>

      <div className="mc-nav-right">
        {/* Language */}
        <div className="mc-menu mc-language-menu" ref={langMenu.wrapRef}>
          <button
            type="button"
            className="mc-nav-btn"
            aria-haspopup="dialog"
            aria-expanded={langMenu.open}
            onClick={() => {
              countryMenu.setOpen(false);
              resMenu.setOpen(false);
              langMenu.setOpen((v) => !v);
            }}
          >
            <span>{lang}</span>
            <Caret cls={`mc-nav-caret${langMenu.open ? ' is-open' : ''}`} />
          </button>
          {langMenu.open && (
            <section className="mc-language-panel" role="dialog" aria-label="Select language">
              <div className="mc-preference-heading">
                <h2>{t('What language do you speak?')}</h2>
                  <button type="button" className="mc-preference-close" aria-label={t('Close language selection')} onClick={() => langMenu.setOpen(false)}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="mc-language-options" role="listbox" aria-label={t('Languages')}>
                {SITE_LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="option"
                    aria-selected={l === lang}
                    className={l === lang ? 'is-on' : ''}
                    onClick={() => {
                      setLanguage(l);
                      langMenu.setOpen(false);
                    }}
                  >
                    <span className="mc-language-check" aria-hidden="true">
                      {l === lang ? '✓' : ''}
                    </span>
                    <span>{l}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Country */}
        <div className="mc-menu mc-country-menu" ref={countryMenu.wrapRef}>
          <button
            type="button"
            className="mc-nav-btn"
            aria-haspopup="dialog"
            aria-expanded={countryMenu.open}
            title={country.name}
            onClick={() => {
              langMenu.setOpen(false);
              resMenu.setOpen(false);
              countryMenu.setOpen((v) => !v);
            }}
          >
            <span className="mc-nav-flag" aria-hidden="true">{country.code}</span>
            <span>{country.name}</span>
            <Caret cls={`mc-nav-caret${countryMenu.open ? ' is-open' : ''}`} />
          </button>
          {countryMenu.open && (
            <section className="mc-country-panel" role="dialog" aria-label="Select coverage country">
              <div className="mc-preference-heading">
                <h2>What country do you cover?</h2>
                <button type="button" className="mc-preference-close" aria-label="Close country selection" onClick={() => countryMenu.setOpen(false)}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="mc-country-content">
                <div className="mc-country-map-window" aria-hidden="true" />
                <div className="mc-country-picker">
                  <p>Select a country to see information specific to your coverage region.</p>
                  <CountryPicker
                    country={country}
                    onChange={(item) => {
                      setCountry(item);
                      countryMenu.setOpen(false);
                    }}
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Newsroom — external on the reference, so it opens in a new tab. */}
        <a
          className="mc-nav-btn"
          href="https://about.netflix.com/en/newsroom"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Newsroom</span>
          <ExternalArrow />
        </a>

        {/* Resources */}
        <div className="mc-menu" ref={resMenu.wrapRef}>
          <button
            type="button"
            className="mc-nav-btn"
            aria-haspopup="menu"
            aria-expanded={resMenu.open}
            onClick={() => resMenu.setOpen((v) => !v)}
          >
            <span>Resources</span>
            <Caret />
          </button>
          {resMenu.open && (
            <ul className="mc-menu-list" role="menu">
              {RESOURCES.map((r) => (
                <li key={r.label} role="none">
                  {r.to
                    ? <Link role="menuitem" to={r.to} onClick={() => resMenu.setOpen(false)}>{r.label}</Link>
                    : <a role="menuitem" href={r.href} target="_blank" rel="noopener noreferrer" onClick={() => resMenu.setOpen(false)}>{r.label}</a>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link className="mc-nav-apply" to={user ? '/account' : '/signup'}>Apply</Link>
        <Link className="mc-nav-login" to={user ? '/account' : '/login'}>Press Log In</Link>

        {/* The magnifier. While open it takes the bar's remaining width; a submit
            hands the term straight to the hero field. */}
        <button
          type="button"
          className="mc-nav-search"
          aria-label="Open Search"
          title="Open Search"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen(true)}
        >
          <Magnifier />
        </button>
      </div>

      {searchOpen && (
        <form className="mc-search-overlay" role="search" onSubmit={submit}>
          <Magnifier size={20} />
          <input
            ref={navSearchRef}
            type="search"
            value={navQuery}
            placeholder="Search"
            aria-label="Search the Media Center"
            onChange={(event) => typeTerm(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); }}
          />
          <button
            type="button"
            className="mc-search-close"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </form>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// The hero band: the streams artwork, a centred 40px headline and the 540x40
// search field. `query` / `onQuery` are owned by the page so the nav search and
// this field hold the same term; submitting either one runs the search.
// ---------------------------------------------------------------------------
function Hero({ siteName, query, onQuery, onSearch }) {
  const submit = (event) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <header className="mc-hero">
      <h1 className="mc-hero-title">
        Discover stories and experiences to share with {siteName}.
      </h1>
      <form className="mc-hero-search" role="search" onSubmit={submit}>
        <Magnifier size={16} />
        <input
          type="search"
          value={query}
          placeholder="Search for Netflix titles and news"
          aria-label="Search for Netflix titles and news"
          onChange={(event) => onQuery(event.target.value)}
        />
      </form>
    </header>
  );
}

// ---------------------------------------------------------------------------
// One tile. The reference has two shapes and this renders both:
//   • boxshot  — the 256x359 photograph, with the release date in a 24px bar
//   • key art  — a black plate carrying the N mark and the title at 28px/35px
// `art: null` selects the second, which is exactly what the live page does for
// a title whose still has not been cleared for press use.
// ---------------------------------------------------------------------------
function TitleCard({ item, onOpen }) {
  const keyArt = !item.art;
  return (
    <div className="mc-card">
      <button
        type="button"
        className="mc-card-link"
        onClick={() => onOpen(item)}
        aria-label={`${item.title}, ${item.formats.join(' and ')}, releasing ${item.date}`}
      >
        <span className={`mc-card-art${keyArt ? ' is-keyart' : ''}`}>
          {keyArt ? <NMark /> : (
            <img src={item.art} alt="" loading="lazy" draggable="false" />
          )}
        </span>
        {keyArt && <span className="mc-card-name">{item.title}</span>}
      </button>
      <p className="mc-card-date">{item.date}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The catalogue block: the month sentence with its inline dropdown, the five
// format chips, a hairline rule and then the grid.
//
// The chips FILTER one flat list rather than switching between five lists —
// "Film" and "Documentary" both show a title tagged with both, and clicking the
// active chip clears it, which is how the reference's toggles behave.
// ---------------------------------------------------------------------------
function Catalogue({ onOpen, titles }) {
  const selectedMonth = MONTH_OPTIONS[1] || MONTH_OPTIONS[0];
  const [monthKey, setMonthKey] = useState(selectedMonth.key);
  const [format, setFormat] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const monthMenu = useMenu();

  // The live TMDB feed while it loads — and forever, if TMDB is down — is the
  // static press schedule declared at the top of this file.
  const list = titles || TITLES;

  const month = MONTH_OPTIONS.find((option) => option.key === monthKey) || selectedMonth;
  const filtered = list
    .filter((item) => releaseMonthKey(item) === month.key)
    .filter((item) => !format || item.formats.includes(format))
    .sort((a, b) => releaseDateSortKey(a).localeCompare(releaseDateSortKey(b)));
  const visible = showAll ? filtered : filtered.slice(0, FIRST_PAGE);
  const hidden = Math.max(0, filtered.length - FIRST_PAGE);

  // Changing the month or the chip re-collapses the grid, so the "Show N more"
  // control is always honest about what it is holding back.
  const pickMonth = (option) => {
    setMonthKey(option.key);
    setShowAll(false);
    monthMenu.setOpen(false);
  };
  const pickFormat = (f) => { setFormat((cur) => (cur === f ? null : f)); setShowAll(false); };

  return (
    <div className="mc-block">
      <h2 className="mc-block-head">
        <span>I&apos;m interested in covering titles releasing in</span>
        <span className="mc-menu" ref={monthMenu.wrapRef}>
          <button
            type="button"
            className="mc-month"
            aria-haspopup="listbox"
            aria-expanded={monthMenu.open}
            onClick={() => monthMenu.setOpen((v) => !v)}
          >
            <span>{month.month}</span>
            <Caret cls={`mc-month-caret${monthMenu.open ? ' is-open' : ''}`} />
          </button>
          {monthMenu.open && (
            <ul className="mc-menu-list mc-month-list" role="listbox" aria-label="Select month">
              {MONTH_OPTIONS.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.key === month.key}
                    className={option.key === month.key ? 'is-on' : ''}
                    onClick={() => pickMonth(option)}
                  >
                    <span className="mc-month-check" aria-hidden="true">
                      {option.key === month.key && (
                        <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                          <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </span>
                    <span>{option.month}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>
      </h2>

      <div className="mc-chips" role="group" aria-label="Filter by format">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            className={`mc-chip${format === f ? ' is-on' : ''}`}
            aria-pressed={format === f}
            onClick={() => pickFormat(f)}
          >
            <ChipGlyph format={f} />
            <span>{f}</span>
          </button>
        ))}
      </div>

      <hr className="mc-divider" />

      <div className="mc-grid">
        {titles === null
          ? <PageLoadingSkeleton variant="grid" cardCount={4} />
          : visible.map((item) => (
            <TitleCard key={item.key || `${item.title}-${item.date}`} item={item} onOpen={onOpen} />
          ))}
      </div>

      {filtered.length === 0 && (
        <p className="mc-month-empty" role="status">
          No titles announced for {month.month} {month.year} yet.
        </p>
      )}

      {hidden > 0 && (
        <div className="mc-more">
          <button type="button" className="mc-btn-outline" onClick={() => setShowAll(true)}>
            Show {hidden} more in {month.month}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Latest news": the #232323 band holding three 578x312 story panels separated
// by hairline rules, then the centred "Read more news in the Newsroom" button.
// The track scrolls horizontally once the three panels no longer fit.
// ---------------------------------------------------------------------------
function LatestNews() {
  return (
    <section className="mc-news" aria-labelledby="mc-news-title">
      <h2 className="mc-news-title" id="mc-news-title">Latest news</h2>
      <div className="mc-news-scroll">
        <div className="mc-news-track">
          {NEWS.map((story, i) => (
            <div className="mc-news-cell" key={story.headline}>
              {i > 0 && <span className="mc-news-rule" aria-hidden="true" />}
              <article className="mc-news-card" style={{ '--mc-news-art': `url("${story.image}")` }}>
                <div className="mc-news-body">
                  <p className="mc-news-region">{story.region}</p>
                  <h3 className="mc-news-headline">{story.headline}</h3>
                  <a className="mc-btn-outline" href={story.href} target="_blank" rel="noopener noreferrer">
                    Read more
                  </a>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
      <div className="mc-news-cta">
        <a className="mc-btn-outline" href="https://about.netflix.com/en/newsroom" target="_blank" rel="noopener noreferrer">
          Read more news in the Newsroom
        </a>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The company-assets band: the red-curtain photograph with the copy set hard
// right over a 270deg scrim (darkest at the right edge), and one outlined CTA.
// ---------------------------------------------------------------------------
function CompanyAssets() {
  return (
    <section className="mc-assets">
      <div className="mc-assets-inner">
        <h1 className="mc-assets-title">Looking for company assets?</h1>
        <p className="mc-assets-copy">
          Get more images and information about Netflix on our company site.
        </p>
        <a className="mc-btn-outline" href="https://about.netflix.com/en/company-assets" target="_blank" rel="noopener noreferrer">
          Go to About Netflix
        </a>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The Media Center's own footer — three 616px columns (Company / Connect /
// Legal) on #161616, with the social row under Connect and the cookie label
// wired to this app's preference dialog rather than a dead page.
// ---------------------------------------------------------------------------
export function MediaCenterFooter() {
  return (
    <footer className="mc-footer">
      {FOOTER_COLUMNS.map((col) => (
        <ul className="mc-footer-col" key={col.heading}>
          <li><p className="mc-footer-head">{col.heading}</p></li>
          {col.links.map((link) => (
            <li key={link.label}>
              {link.cookie ? (
                <button type="button" className="mc-footer-link" onClick={openCookiePreferences}>
                  {link.label}
                </button>
              ) : link.to ? (
                <Link className="mc-footer-link" to={link.to}>{link.label}</Link>
              ) : (
                <a className="mc-footer-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
              )}
            </li>
          ))}
          {col.social && (
            <li>
              <div className="mc-footer-social">
                {SOCIALS.map((s) => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                    {s.name === 'Twitter' ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                        <path fill="currentColor" d="M23.953 4.57a10 10 0 0 1-2.825.775 4.932 4.932 0 0 0 2.163-2.723 9.99 9.99 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.384 4.482A13.94 13.94 0 0 1 1.64 3.162a4.916 4.916 0 0 0 1.523 6.557 4.9 4.9 0 0 1-2.228-.616v.062a4.918 4.918 0 0 0 3.946 4.817 4.936 4.936 0 0 1-2.224.084 4.93 4.93 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 19.54a13.94 13.94 0 0 0 7.548 2.212c9.057 0 14.01-7.503 14.01-14.01 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.46-2.548z" />
                      </svg>
                    ) : s.name === 'Instagram' ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                        <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="18" cy="6.25" r="1.25" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="20" aria-hidden="true" focusable="false">
                        <path fill="currentColor" d="M13.6 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.3z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </li>
          )}
        </ul>
      ))}
    </footer>
  );
}

// ---------------------------------------------------------------------------
// The page. It owns the one term the two search boxes share — both the hero
// field and the masthead's magnifier write into it, and submitting either one
// opens the results screen (see pressSearchHref).
// ---------------------------------------------------------------------------
export default function MediaCenter() {
  const branding = useBranding();
  const siteName = branding?.siteName || 'Newflix';
  const [query, setQuery] = useState('');
  // The grid's artwork: this app's TMDB posters, live from /tmdb/browse.
  const titles = usePressTitles();

  // A tile is a press asset, not a member title. The reference sends every
  // boxshot to its own press detail page; this app now does the same — a click
  // opens the tile's own Media Center screen at /p/media-center/title/<id>.
  const navigate = useNavigate();
  const openTitle = (item) => navigate(`/p/media-center/title/${encodeURIComponent(item.key || pressSlug(item.title))}`);

  // A search leaves this page for the results screen, exactly as the reference
  // does — it is a separate URL with the term in the query string, not a filter
  // applied to this grid.
  const runSearch = (term) => {
    if (!term) return;
    navigate(pressSearchHref(term));
  };

  return (
    <div className="mc-page">
      <Masthead siteName={siteName} onSearch={runSearch} onTermChange={setQuery} />
      <Hero
        siteName={siteName}
        query={query}
        onQuery={setQuery}
        onSearch={runSearch}
      />
      <div className="mc-body">
        <Catalogue onOpen={openTitle} titles={titles} />
        <LatestNews />
        <CompanyAssets />
      </div>
      <MediaCenterFooter />
    </div>
  );
}
