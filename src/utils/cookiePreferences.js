// ---------------------------------------------------------------------------
// The Netflix "Privacy Preference Center" — the modal the footer's
// "Cookie Preferences" link opens.
//
// The event lives in its own module, exactly like utils/mobileTitle.js, so that
// the footers (which own the link) and the modal (which owns the UI) can reach
// each other WITHOUT importing one another. A direct import would make a cycle:
// Footer -> CookiePreferencesModal -> Footer.
// ---------------------------------------------------------------------------

export const COOKIE_PREFERENCES_EVENT = 'streamflix-cookie-preferences-open';
export const COOKIE_PREFERENCES_PATH = '/p/cookie-preferences';

/** Fired on every save so the rest of the app can react to a consent change. */
export const CONSENT_EVENT = 'sf-cookie-consent';

const STORAGE_KEY = 'sf_cookie_consent';

/**
 * Open the preference center over whatever page you are on.
 * Accepts the click event so a caller rendering a real <Link> can swallow the
 * navigation — the reference opens a dialog, it never changes the page.
 */
export const openCookiePreferences = (event) => {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT));
};

export const readConsent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch { return null; }
};

export const writeConsent = (next) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
  }
};

// A paragraph is an array of runs: a bare string, or { to } for a bold in-copy
// link. The reference bolds "Terms of Use" / "Privacy Statement" inside the body
// text and leaves them un-underlined, so the run list is what carries that.
const t = (text) => ({ text });
const link = (text, to) => ({ text, to });
const p = (...runs) => runs;

// The five categories, in the order the reference lists them. `toggle` marks the
// two the reference actually lets you switch — the other three are fixed.
export const COOKIE_SECTIONS = [
  {
    id: 'general',
    name: 'General Description',
    paragraphs: [
      p(t('This cookie tool will help you understand the use of cookies on the Netflix service, and how you can control the use of these cookies.')),
      p(t('Privacy settings in most browsers allow you to prevent your browser from accepting some or all cookies, notify you when it receives a new cookie, or disable cookies altogether. If your browser disables all cookies, then information will not be collected or stored via the cookies listed in this tool. This means that your use of the Netflix service may be impaired.')),
      p(t('Please note that when you use this cookie tool to opt out of certain cookies, your opt out preferences are recorded by placing a cookie on your device. Therefore, your browser must be configured to accept cookies in order for your preferences to take effect. Also, if you delete or clear your cookies, or change your web browser, you will need to reset your cookie preferences.')),
      p(t('For more information on our use of cookies, please visit the '),
        link('Cookies and other Technologies', '/p/privacy'),
        t(' section of our '),
        link('Privacy Statement', '/p/privacy'),
        t('.')),
    ],
  },
  {
    id: 'essential',
    name: 'Essential Cookies',
    paragraphs: [
      p(t('These cookies are strictly necessary to provide the Netflix service. For example, we and our Service Providers may use these cookies to authenticate and identify users when they use our websites so we can provide our service to them. They also help us to administer and operate our business; for safety, security and fraud prevention; and to comply with law and enforce our '),
        link('Terms of Use', '/p/terms'),
        t('. As these cookies are strictly necessary to provide our service, you cannot opt out of them.')),
      p(t('Lifespan: Most cookies are session cookies (e.g. only active until you close your browser). Some cookies are active for a longer time, ranging from 3 to 12 months. The cookies used to prevent fraud and maintain the security or our services are active for a maximum period of 24 months.')),
    ],
  },
  {
    id: 'first-party',
    name: 'First Party Performance and Functionality Cookies',
    paragraphs: [
      p(t('These cookies help us to customize and enhance your online experience with the Netflix service. For example, they help us to remember your preferences and prevent you from needing to re-enter information you previously provided (for example, during member sign up). We also use these cookies to collect information (such as popular pages, conversion rates, viewing patterns, click-through and other information) about our visitors\' use of the Netflix service so that we can provide our service and also to research, analyze and improve our services. Deletion of these types of cookies may result in limited functionality of our service.')),
      p(t('Lifespan: Most cookies are only active for one day. Some cookies are active for a longer time, ranging from 3 to 12 months.')),
    ],
  },
  {
    id: 'third-party',
    name: 'Third Party Performance and Functionality Cookies',
    toggle: 'thirdParty',
    details: true,
    paragraphs: [
      p(t('These cookies, set by third parties, help us to customize and enhance your online experience with Netflix. The cookies in this category are only set on Tudum (our official fandom site). We use these cookies to provide you experiences hosted by third parties, like displaying social media content. For further information on how these third parties use such cookies, please see the privacy information provided by the third party on their website. Deletion of these types of cookies may result in limited functionality.')),
    ],
  },
  {
    id: 'advertising',
    name: 'Advertising Cookies',
    toggle: 'advertising',
    details: true,
    paragraphs: [
      p(t('These cookies collect information via the Netflix service in connection with “Advertisements” (as defined in our '),
        link('Terms of Use', '/p/terms'),
        t('). “Advertising Companies” (as defined in our '),
        link('Privacy Statement', '/p/privacy'),
        t(') may also collect information via these cookies in connection with Advertisements. If you opt out of advertising cookies, you may still see Advertisements on the Netflix service but they will not be based on information collected from advertising cookies.')),
      p(t('“Netflix Marketing Providers” (also defined in our '),
        link('Privacy Statement', '/p/privacy'),
        t(') may also collect information via advertising cookies in connection with Netflix marketing campaigns promoting the Netflix service or Netflix content, such as our ads on third party services. If you opt out of advertising cookies, you may still see Netflix marketing campaigns promoting the Netflix service or Netflix content, but they will not be based on information collected from these advertising cookies.')),
      p(t('Finally, Netflix supports the self-regulatory Principles for Online Behavioral Advertising programs of the Digital Advertising Alliance (DAA), the Digital Advertising Alliance of Canada (DAAC), and the European Interactive Digital Advertising Alliance (EDAA).')),
    ],
  },
];

// What "Cookies Details" opens: the host-by-host list the reference shows, with
// the individual cookies each host sets.
export const COOKIE_HOSTS = [
  { host: 'tiktok.com', cookies: [
    { name: 'tt_appInfo', domain: '.tiktok.com', life: '13 months', purpose: 'Third Party Performance and Functionality' },
    { name: 'tt_csrf_token', domain: '.tiktok.com', life: '1 year', purpose: 'Third Party Performance and Functionality' },
    { name: 'msToken', domain: '.tiktok.com', life: 'Session', purpose: 'Third Party Performance and Functionality' },
  ] },
  { host: 'bitmovin.com', cookies: [
    { name: 'bm_sz', domain: '.bitmovin.com', life: 'Session', purpose: 'Third Party Performance and Functionality' },
    { name: 'bm_v', domain: '.bitmovin.com', life: '2 hours', purpose: 'Third Party Performance and Functionality' },
  ] },
  { host: 'doubleclick.net', cookies: [
    { name: 'IDE', domain: '.doubleclick.net', life: '1 year 24 days', purpose: 'Advertising' },
    { name: 'test_cookie', domain: '.doubleclick.net', life: '15 minutes', purpose: 'Advertising' },
  ] },
  { host: 'tiktokw.eu', cookies: [
    { name: 'cto_tiktok', domain: '.tiktokw.eu', life: '6 months', purpose: 'Advertising' },
  ] },
  { host: 'spotify.com', cookies: [
    { name: 'sp_t', domain: '.spotify.com', life: '1 year', purpose: 'Third Party Performance and Functionality' },
  ] },
];

export default openCookiePreferences;
