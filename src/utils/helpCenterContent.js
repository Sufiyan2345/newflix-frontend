// The Help Center landing page data — help.netflix.com/en.
//
// The reference builds this screen from GET /en/api/categories/homepage, which
// returns its categories, their sub-categories and the articles inside each. The
// live page has since split "Watching and Playing" into two cards, so the list
// below is the five the page actually shows today, in the order it shows them.
// Every label is copied verbatim from the reference — the card headings, the
// sub-category headings and the article titles — because this list IS the page's
// navigation and any rewording is visible drift.
//
// The reference links every article to /en/node/<id>. This app has its own
// /p/<slug> articles plus real product screens, so each entry carries the local
// destination instead. Where the reference has an article this app does not,
// the row points at the closest page that does exist rather than at a URL that
// would render "Page Not Found".

// The category glyphs are the reference's own 24x24 paths, which it ships in
// its React bundle keyed by category id. Three are lifted verbatim ("person",
// "wrench", "tv"); "gamepad" and "rocket" are redrawn to the same silhouette and
// the same 24x24 box.
export const TOPIC_ICONS = {
  person:
    'M9.00011 8.5C9.00011 6.84315 10.3433 5.5 12.0001 5.5C13.657 5.5 15.0001 6.84315 15.0001 8.5C15.0001 10.1568 13.657 11.5 12.0001 11.5C10.3433 11.5 9.00011 10.1568 9.00011 8.5ZM12.0001 3.5C9.23869 3.5 7.00011 5.73858 7.00011 8.5C7.00011 11.2614 9.23869 13.5 12.0001 13.5C14.7615 13.5 17.0001 11.2614 17.0001 8.5C17.0001 5.73858 14.7615 3.5 12.0001 3.5ZM5.98069 21.6961C6.46867 19.2563 8.61095 17.5 11.0991 17.5H12.9011C15.3893 17.5 17.5316 19.2563 18.0195 21.6961L19.9807 21.3039C19.3057 17.9292 16.3426 15.5 12.9011 15.5H11.0991C7.65759 15.5 4.69447 17.9292 4.01953 21.3039L5.98069 21.6961Z',
  wrench:
    'M9.99985 7.5C9.99985 3.63401 13.1338 0.5 16.9998 0.5C17.4342 0.5 17.8601 0.539684 18.2741 0.615882C19.0388 0.756665 19.5426 1.31959 19.6888 1.96835C19.8293 2.59206 19.6413 3.27267 19.1542 3.75981L16.914 6L18.4998 7.58579L20.74 5.34559C21.2271 4.85845 21.9077 4.67052 22.5315 4.81104C23.1802 4.9572 23.7431 5.46099 23.8839 6.22573C23.9601 6.63965 23.9998 7.06563 23.9998 7.5C23.9998 11.366 20.8658 14.5 16.9998 14.5C16.2234 14.5 15.475 14.3732 14.7752 14.1388L5.41407 23.5C4.63302 24.281 3.36669 24.281 2.58564 23.5L0.999848 21.9142C0.218801 21.1332 0.218801 19.8668 0.999848 19.0858L10.361 9.72461C10.1266 9.02483 9.99985 8.27645 9.99985 7.5ZM16.9998 2.5C14.2384 2.5 11.9998 4.73858 11.9998 7.5C11.9998 8.23551 12.158 8.93138 12.4412 9.55768L12.7262 10.1878L12.2372 10.6768L2.41407 20.5L3.99985 22.0858L13.823 12.2626L14.312 11.7736L14.9421 12.0586C15.5684 12.3418 16.2643 12.5 16.9998 12.5C19.7612 12.5 21.9998 10.2614 21.9998 7.5C21.9998 7.31198 21.9895 7.12669 21.9694 6.94462L19.2069 9.70711L18.4998 10.4142L17.7927 9.70711L14.7927 6.70711L14.0856 6L14.7927 5.29289L17.5552 2.53041C17.3731 2.51033 17.1878 2.5 16.9998 2.5Z',
  tv:
    'M0 4.22727C0 3.27333 0.773326 2.5 1.72727 2.5H20.2727C21.2267 2.5 22 3.27333 22 4.22727V7.5H20V4.5H2V14.5H13V16.5H1.72727C0.773325 16.5 0 15.7267 0 14.7727V4.22727ZM13 17.8114C12.012 17.7708 11.0113 17.75 10 17.75C8.2756 17.75 6.5822 17.8104 4.92974 17.9268L5.07026 19.9218C6.67567 19.8088 8.32219 19.75 10 19.75C11.0121 19.75 12.0128 19.7714 13 19.8132V17.8114ZM22 11.5H17V20.5H22V11.5ZM17 9.5C15.8954 9.5 15 10.3954 15 11.5V20.5C15 21.6046 15.8954 22.5 17 22.5H22C23.1046 22.5 24 21.6046 24 20.5V11.5C24 10.3954 23.1046 9.5 22 9.5H17ZM19.5 19C19.9142 19 20.25 18.6642 20.25 18.25C20.25 17.8358 19.9142 17.5 19.5 17.5C19.0858 17.5 18.75 17.8358 18.75 18.25C18.75 18.6642 19.0858 19 19.5 19Z',
};

// Redrawn to the same silhouette as the reference's gamepad and rocket marks.
TOPIC_ICONS.gamepad =
  'M6.5 5.5H17.5C20.5376 5.5 23 7.96243 23 11C23 14.0376 20.5376 16.5 17.5 16.5H16.1L14.5 14.4C13.9431 13.8431 12.8569 13.8431 12.3 14.4L10.7 16.5H6.5C3.46243 16.5 1 14.0376 1 11C1 7.96243 3.46243 5.5 6.5 5.5ZM7.2 8.2C6.64 8.2 6.18 8.66 6.18 9.22V10.2H5.2C4.64 10.2 4.18 10.66 4.18 11.22C4.18 11.78 4.64 12.24 5.2 12.24H6.18V13.22C6.18 13.78 6.64 14.24 7.2 14.24C7.76 14.24 8.22 13.78 8.22 13.22V12.24H9.2C9.76 12.24 10.22 11.78 10.22 11.22C10.22 10.66 9.76 10.2 9.2 10.2H8.22V9.22C8.22 8.66 7.76 8.2 7.2 8.2ZM17.3 9.1C16.736 9.1 16.26 9.576 16.26 10.14C16.26 10.704 16.736 11.18 17.3 11.18C17.864 11.18 18.34 10.704 18.34 10.14C18.34 9.576 17.864 9.1 17.3 9.1ZM19.5 11.5C18.936 11.5 18.46 11.976 18.46 12.54C18.46 13.104 18.936 13.58 19.5 13.58C20.064 13.58 20.54 13.104 20.54 12.54C20.54 11.976 20.064 11.5 19.5 11.5Z';
TOPIC_ICONS.rocket =
  'M21.35 1.9C22.25 1.6 23.25 2.5 22.95 3.5C21.85 7.5 19.05 11.1 15.25 12.9L13.35 14.8L9.95 11.4L11.85 9.5C13.65 5.7 17.25 2.9 21.35 1.9ZM16.9 5.6C16.336 5.6 15.86 6.076 15.86 6.64C15.86 7.204 16.336 7.68 16.9 7.68C17.464 7.68 17.94 7.204 17.94 6.64C17.94 6.076 17.464 5.6 16.9 5.6ZM9.6 12.3L11.7 14.4L8.6 17.5C8.2 17.9 7.6 17.9 7.2 17.5L6.5 16.8C6.1 16.4 6.1 15.8 6.5 15.4L9.6 12.3ZM12.4 15.1L14.5 17.2L12.5 19.2C12.1 19.6 11.5 19.6 11.1 19.2L10.4 18.5C10 18.1 10 17.5 10.4 17.1L12.4 15.1Z';

// The 24x24 document glyph in front of every article row — two filled rules
// inside a stroked page outline, straight from the reference's article item.
export const ARTICLE_ICON_PATH = 'M18 4H6V20H18V4ZM4 2V22H20V2H4Z';

export const HELP_CENTER_TOPICS = [
  {
    id: 'account_and_billing',
    title: 'Account and Billing',
    icon: 'person',
    subcategories: [
      {
        id: 'account_settings',
        title: 'Account Settings',
        articles: [
          { title: 'How to change your plan', to: '/p/change-plan' },
          { title: 'How to cancel Netflix', to: '/p/cancel-membership' },
          { title: 'How to change or reset your password', to: '/forgot-password' },
          { title: 'How to update Netflix account information', to: '/account' },
          { title: 'Sharing your Netflix account', to: '/p/faq' },
          { title: 'How to keep your account secure', to: '/account' },
        ],
      },
      {
        id: 'paying_for_netflix',
        title: 'Paying for Netflix',
        articles: [
          { title: 'Billing and Payments', to: '/p/billing-and-payments' },
          { title: 'Netflix Gift Cards', to: '/p/billing-and-payments' },
          { title: 'How to remove payment methods from your account', to: '/p/billing-and-payments' },
          { title: 'How to find your billing date', to: '/p/billing-and-payments' },
        ],
      },
    ],
  },
  {
    id: 'fix_a_problem',
    title: 'Fix a Problem',
    icon: 'wrench',
    subcategories: [
      {
        id: 'account_issues',
        title: 'Account Issues',
        articles: [
          { title: "Can't sign in to Netflix", to: '/p/sign-in-help' },
          { title: 'Netflix says to sign up when trying to sign in', to: '/p/sign-in-help' },
          { title: 'Netflix says account is already in use', to: '/p/sign-in-help' },
        ],
      },
      {
        id: 'billing_issues',
        title: 'Billing Issues',
        articles: [
          {
            title: "Netflix says 'Your account is on hold because of a problem with your last payment.'",
            to: '/p/billing-and-payments',
          },
          { title: 'Unrecognized or unauthorized charges from Netflix', to: '/p/billing-and-payments' },
          { title: 'Charged twice by Netflix', to: '/p/billing-and-payments' },
        ],
      },
      {
        id: 'error_codes',
        title: 'Error Codes',
        articles: [
          { title: "Netflix isn't working", to: '/p/speed-test' },
          { title: 'Netflix Error NW-2-5', to: '/p/speed-test' },
          { title: 'Netflix Error ui-800-3', to: '/p/speed-test' },
          { title: 'Netflix Error tvq-pb-101', to: '/p/speed-test' },
          { title: 'Netflix Error 113', to: '/p/speed-test' },
        ],
      },
      {
        id: 'problems_watching',
        title: 'Problems Watching',
        articles: [
          { title: 'Fix a problem on your Android phone or tablet', to: '/p/ways-to-watch' },
          { title: 'Fix a problem on your TV or streaming media player', to: '/p/ways-to-watch' },
          { title: "Netflix says, 'This app is not compatible with your device.'", to: '/p/ways-to-watch' },
          { title: "Browser isn't supported", to: '/p/ways-to-watch' },
          { title: 'Black screen with sound', to: '/p/speed-test' },
        ],
      },
    ],
  },
{
    id: 'watching',
    title: 'Watching',
    icon: 'tv',
    subcategories: [
      {
        id: 'profiles',
        title: 'Profiles',
        articles: [
          { title: 'How to create, edit, or delete profiles', to: '/profiles' },
          { title: 'How to change the language on Netflix', to: '/account' },
          { title: 'Profile transfers', to: '/account' },
        ],
      },
      {
        id: 'features_and_settings',
        title: 'Features and Settings',
        articles: [
          { title: 'Using Netflix outside of your home', to: '/p/ways-to-watch' },
          { title: 'How to get the best video quality', to: '/p/speed-test' },
          { title: 'How to use subtitles, captions, or choose audio language', to: '/p/ways-to-watch' },
          { title: "How to use 'My List'", to: '/my-list' },
          { title: 'Accessibility on Netflix', to: '/p/ways-to-watch' },
        ],
      },
      {
        id: 'tv_shows_and_movies',
        title: 'TV Shows and Movies',
        articles: [
          { title: 'How to download titles to watch offline', to: '/p/ways-to-watch' },
          { title: 'How to search and browse Netflix', to: '/search' },
          { title: 'How to hide titles from viewing history', to: '/history' },
          { title: "How to remove titles from the 'Continue Watching' row", to: '/history' },
        ],
      },
      {
        id: 'parental_controls',
        title: 'Parental Controls',
        articles: [
          { title: 'Parental controls on Netflix', to: '/profiles' },
          { title: 'How to add, edit, or remove a profile PIN', to: '/profiles' },
          { title: 'How to set profile maturity ratings or block titles', to: '/profiles' },
          { title: 'How to create a profile for kids', to: '/kids' },
        ],
      },
    ],
  },
  {
    id: 'playing',
    title: 'Playing',
    icon: 'gamepad',
    subcategories: [
      {
        id: 'games_on_netflix',
        title: 'Games on Netflix',
        articles: [
          { title: 'Play games on mobile devices', to: '/kids' },
          { title: 'How to find and install Netflix Games', to: '/kids' },
        ],
      },
      {
        id: 'parental_controls_player_safety',
        title: 'Parental Controls & Player Safety',
        articles: [
          { title: 'Parental Controls & Player Safety', to: '/profiles' },
          { title: 'How to set profile maturity ratings or block titles', to: '/profiles' },
        ],
      },
      {
        id: 'browse_games',
        title: 'Browse Games',
        articles: [{ title: 'Browse Games', to: '/kids' }],
      },
    ],
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    icon: 'rocket',
    subcategories: [
      {
        id: 'joining_netflix',
        title: 'Joining Netflix',
        articles: [
          { title: 'What is Netflix?', to: '/p/what-is-netflix' },
          { title: 'How to pay for Netflix', to: '/p/billing-and-payments' },
          { title: 'Getting started with Netflix', to: '/p/getting-started' },
          { title: 'Plans and Pricing', to: '/signup' },
          { title: 'Extra Members', to: '/signup' },
        ],
      },
      {
        id: 'device_setup',
        title: 'Device Setup',
        articles: [
          { title: 'Netflix supported browsers and system requirements', to: '/p/ways-to-watch' },
          { title: 'How to download the Netflix app', to: '/p/ways-to-watch' },
          { title: 'How to use Netflix on your Android phone or tablet', to: '/p/ways-to-watch' },
          { title: 'How to watch Netflix on your TV', to: '/p/ways-to-watch' },
          { title: 'How to use Netflix on your iPhone or iPad', to: '/p/ways-to-watch' },
        ],
      },
    ],
  },
];

// The "Popular topics:" line under the search field. The reference renders it
// from its own recommendation service; these are the four it shows, and each
// points at the same article the matching topic row uses.
export const POPULAR_TOPICS = [
  { title: 'How to sign up for Netflix', to: '/signup' },
  { title: 'Plans and Pricing', to: '/signup' },
  { title: "Can't sign in to Netflix", to: '/p/sign-in-help' },
  { title: 'Parental controls on Netflix', to: '/profiles' },
];

// The five Quick Links, with the reference's own 16x16 glyphs. These are the
// same five rows the Contact Us page lists, so they live here once.
//
// Each glyph is a `viewBox` plus a list of plain ATTRIBUTE OBJECTS rather than a
// JSX element, because this module is plain .js and cannot hold JSX. The page
// spreads each object onto a real <path>; rendering the objects directly is what
// threw React error #31 ("objects are not valid as a React child") and took the
// whole page down to the error screen.
export const QUICK_LINKS = [
  {
    label: 'Reset password',
    to: '/forgot-password',
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M17 10V7A5 5 0 007 7v3H5v12h14V10zM9 7a3 3 0 016 0v3H9zm8 13H7v-8h10z' },
      { d: 'M11 14h2v4h-2z' },
    ],
  },
  {
    label: 'Update email',
    to: '/account',
    // This one mark is authored on a 16x16 grid, not the 24x24 the others use,
    // so it carries its own viewBox rather than inheriting a shared default.
    viewBox: '0 0 16 16',
    paths: [{
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M0.75 2C0.335786 2 0 2.33579 0 2.75V12.25C0 13.2165 0.783501 14 1.75 14H14.25C15.2165 14 16 13.2165 16 12.25V2.75C16 2.33579 15.6642 2 15.25 2H0.75ZM8 8.00978L2.76865 3.5H13.2313L8 8.00978ZM8.4897 9.56806L14.5 4.38677V12.25C14.5 12.3881 14.3881 12.5 14.25 12.5H1.75C1.61193 12.5 1.5 12.3881 1.5 12.25V4.38677L7.5103 9.56806L8 9.99022L8.4897 9.56806Z',
    }],
  },
  {
    label: 'Get help signing in',
    to: '/p/sign-in-help',
    viewBox: '0 0 24 24',
    paths: [
      { fill: 'none', d: 'M0 0h24v24H0z' },
      { d: 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' },
      { d: 'M11.89 14.72a1.47 1.47 0 101 .43 1.39 1.39 0 00-1-.43zM14.09 7a4.58 4.58 0 00-1.91-.38 4.6 4.6 0 00-2 .42 3.52 3.52 0 00-2 2.73h2.31A1.21 1.21 0 0111 9a1.81 1.81 0 011-.25 1.69 1.69 0 011 .28.82.82 0 01.38.67 1 1 0 01-.24.62 4.36 4.36 0 01-1 .73A3.27 3.27 0 0011 12.16a2.94 2.94 0 00-.31 1.43v.31h2.27v-.19a1.25 1.25 0 01.22-.68 2.83 2.83 0 01.92-.75 4.36 4.36 0 001.35-1.14 2.31 2.31 0 00.46-1.45 2.83 2.83 0 00-.47-1.62A3.19 3.19 0 0014.09 7z' },
    ],
  },
  {
    label: 'Update payment method',
    to: '/p/billing-and-payments',
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM4 6h16v2H4zm0 12v-8h16v8z' },
      { d: 'M15 14h3v2h-3z' },
    ],
  },
  {
    label: 'Request TV shows or movies',
    to: '/p/title-request',
    viewBox: '0 0 24 24',
    paths: [{ d: 'M20 3.5v1.197L4 8.254V7.5H2v8h2v-.754l1 .223V18.5c0 .459.313.858.757.971l4 1a1 1 0 001.042-.371l2.471-3.293L20 18.301V19.5h2v-16h-2zM9.598 18.369L7 17.719v-2.307l4.127.918-1.529 2.039zM4 12.697v-2.394l16-3.557v9.508L4 12.697z' }],
  },
];

// Every article in the page, flattened. The search field filters this list, so a
// reader who types "refund" gets every row whose title mentions it — which is
// what the reference's autosuggest does against its own article index.
export const ALL_HELP_ARTICLES = HELP_CENTER_TOPICS.flatMap((topic) =>
  topic.subcategories.flatMap((sub) => sub.articles.map((a) => ({ ...a, topic: topic.title }))),
);

export const HELP_CENTER_FOOTER_LINKS = [
  { label: 'Terms of Use', to: '/p/terms' },
  { label: 'Privacy', to: '/p/privacy' },
  { label: 'Cookie Preferences', to: '/p/cookie-preferences' },
  { label: 'Corporate Information', to: '/p/corporate-information' },
];
