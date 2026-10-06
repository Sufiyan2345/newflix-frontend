// The footer link grid, copied from the real netflix.com footer.
//
// The order matters and is row-major: the CSS lays these out in 4 columns, so
// this exact sequence reproduces Netflix's column-by-column appearance:
//
//   FAQ                Help Center          Account              Media Center
//   Investor Relations Jobs                Ways to Watch        Terms of Use
//   Privacy            Cookie Preferences   Corporate Info       Contact Us
//   Speed Test         Legal Notices        Only on Netflix
//
// Before this file the footer printed 8 links and three of them ("About Us",
// "Careers", "Media Center") all pointed at /p/about — so clicking "Media
// Center" showed the about page. Every entry below is a real destination.
export const FOOTER_ROWS = [
  [
    { label: 'FAQ', to: '/p/faq' },
    { label: 'Help Center', to: '/p/help-center' },
    // The real site sends "Account" to the member's account page, not a static
    // one — this app already has a real /account screen, so use it.
    { label: 'Account', to: '/account' },
    { label: 'Media Center', to: '/p/media-center' },
  ],
  [
    { label: 'Investor Relations', to: '/p/investor-relations' },
    { label: 'Jobs', to: '/p/jobs' },
    { label: 'Ways to Watch', to: '/p/ways-to-watch' },
    { label: 'Terms of Use', to: '/p/terms' },
  ],
  [
    { label: 'Privacy', to: '/p/privacy' },
    { label: 'Cookie Preferences', to: '/p/cookie-preferences' },
    { label: 'Corporate Information', to: '/p/corporate-information' },
    { label: 'Contact Us', to: '/p/contact' },
  ],
  [
    { label: 'Speed Test', to: '/p/speed-test' },
    { label: 'Legal Notices', to: '/p/legal-notices' },
    { label: 'Only on Netflix', to: '/p/only-on-netflix' },
  ],
];

// Every footer link flattened — the help pages use it to render a "Related
// Articles" strip so a reader who lands on a dead end always has a way onward.
export const FOOTER_LINKS = FOOTER_ROWS.flat();

// The language list the real Netflix footer offers, in the same order.
// This is the full Help Center switcher (35 entries, alphabetical after the
// disabled "Select a language" placeholder), not the short netflix.com footer
// list - the legal pages render the long one inside a 247px select.
export const LANGUAGES = [
  'Arabic',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'Filipino',
  'Finnish',
  'French',
  'French (Canada)',
  'German',
  'Greek',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Norwegian',
  'Polish',
  'Portuguese (Brazil)',
  'Portuguese (Portugal)',
  'Romanian',
  'Russian',
  'Spanish (Latin America)',
  'Spanish (Spain)',
  'Swedish',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Vietnamese',
];

// HTML lang code for each label, so choosing a language also sets
// document.documentElement.lang the way the real site does. The value is the
// option's own `value` attribute on the live page.
export const LANG_CODES = {
  Arabic: 'ar',
  'Chinese (Simplified)': 'zh-cn',
  'Chinese (Traditional)': 'zh-tw',
  Croatian: 'hr',
  Czech: 'cs',
  Danish: 'da',
  Dutch: 'nl',
  English: 'en',
  Filipino: 'fil',
  Finnish: 'fi',
  French: 'fr',
  'French (Canada)': 'fr-ca',
  German: 'de',
  Greek: 'el',
  Hebrew: 'he',
  Hindi: 'hi',
  Hungarian: 'hu',
  Indonesian: 'id',
  Italian: 'it',
  Japanese: 'ja',
  Korean: 'ko',
  Malay: 'ms',
  Norwegian: 'no',
  Polish: 'pl',
  'Portuguese (Brazil)': 'pt-br',
  'Portuguese (Portugal)': 'pt-pt',
  Romanian: 'ro',
  Russian: 'ru',
  'Spanish (Latin America)': 'es-la',
  'Spanish (Spain)': 'es',
  Swedish: 'sv',
  Thai: 'th',
  Turkish: 'tr',
  Ukrainian: 'uk',
  Vietnamese: 'vi',
};

export const DEFAULT_LANGUAGE = 'English';

const LANG_KEY = 'sf_language';

export const getLanguage = () => {
  try { return localStorage.getItem(LANG_KEY) || DEFAULT_LANGUAGE; } catch { return DEFAULT_LANGUAGE; }
};

export const applyLanguageToDocument = (label) => {
  const language = LANGUAGES.includes(label) ? label : DEFAULT_LANGUAGE;
  document.documentElement.lang = LANG_CODES[language] || 'en';
  document.documentElement.dir = ['Arabic', 'Hebrew'].includes(language) ? 'rtl' : 'ltr';
};

export const setLanguage = (label) => {
  const language = LANGUAGES.includes(label) ? label : DEFAULT_LANGUAGE;
  try { localStorage.setItem(LANG_KEY, language); } catch { /* private mode */ }
  applyLanguageToDocument(language);
  // Let the whole page re-read the choice (the selector label, any localized
  // heading) without a reload.
  window.dispatchEvent(new CustomEvent('sf-language-changed', { detail: language }));
};
