import { CONTENT } from './legalContent.js';

export const SITE_ORIGIN = 'https://newflix-app.vercel.app';
const EXCLUDED_CONTENT_SLUGS = new Set(['cookie-preferences']);
const CUSTOM_PAGES = {
  '/': {
    title: 'Newflix Pakistan | Watch Movies, TV Shows & Dramas Online',
    description: 'Explore Newflix, an independent streaming platform project for movies, TV shows, dramas and entertainment in Pakistan.',
  },
  '/p/contact': {
    title: 'Contact Newflix | Customer Support',
    description: 'Contact Newflix for help with your account, membership, streaming experience or other questions.',
  },
  '/p/title-request': {
    title: 'Request Movies and TV Shows | Newflix',
    description: 'Tell Newflix which movies or TV shows you would like to see in the catalogue.',
  },
  '/p/faq': {
    title: 'Newflix FAQ | Streaming, Membership and Account Help',
    description: 'Find answers to common questions about Newflix, streaming, membership plans, supported devices and account help.',
  },
  '/p/only-on-netflix': {
    title: 'Explore Movies and TV Shows | Newflix',
    description: 'Explore movies, TV series, dramas and entertainment featured on the Newflix streaming platform.',
  },
  '/p/media-center': {
    title: 'Newflix Media Center | News and Title Information',
    description: 'Browse Newflix media updates, title information, release details and press resources.',
  },
  '/p/investor-relations': {
    title: 'Newflix Company Information',
    description: 'Read company information, announcements and resources about Newflix.',
  },
};

const xmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const textSummary = (entry) => {
  const source = entry?.body
    || entry?.index?.flatMap((section) => [section.title, ...(section.items || []).map((item) => item.label)]).join('. ')
    || entry?.title
    || '';
  return source
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
};

export function getPublicSeoPaths() {
  const staticContentPaths = Object.keys(CONTENT)
    .filter((slug) => !EXCLUDED_CONTENT_SLUGS.has(slug))
    .map((slug) => `/p/${slug}`);

  return [...new Set(['/', ...staticContentPaths, ...Object.keys(CUSTOM_PAGES)])];
}

export function getPageSeo(pathname) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const custom = CUSTOM_PAGES[normalizedPath];
  if (custom) return { ...custom, canonical: new URL(normalizedPath, SITE_ORIGIN).toString(), indexable: true };

  const staticMatch = /^\/p\/([^/]+)$/.exec(normalizedPath);
  if (staticMatch) {
    const slug = decodeURIComponent(staticMatch[1]);
    const entry = CONTENT[slug];
    if (entry && !EXCLUDED_CONTENT_SLUGS.has(slug)) {
      const title = slug === 'faq' ? CONTENT['what-is-netflix']?.title : entry.title;
      return {
        title: `${title || slug} | Newflix`,
        description: textSummary(entry),
        canonical: new URL(normalizedPath, SITE_ORIGIN).toString(),
        indexable: true,
      };
    }
  }

  const onNetflixTitleMatch = /^\/p\/only-on-netflix\/title\/(movie|tv)\/(\d+)$/.exec(normalizedPath);
  if (onNetflixTitleMatch) {
    const type = onNetflixTitleMatch[1] === 'tv' ? 'TV series' : 'movie';
    return {
      title: `Explore ${type} details | Newflix`,
      description: `Explore ${type} details, related entertainment and availability information on Newflix.`,
      canonical: new URL(normalizedPath, SITE_ORIGIN).toString(),
      indexable: true,
    };
  }

  const pressTitleMatch = /^\/p\/media-center\/title\/([^/]+)$/.exec(normalizedPath);
  if (pressTitleMatch) {
    const title = decodeURIComponent(pressTitleMatch[1]).replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    return {
      title: `${title} | Newflix Media Center`,
      description: `Read release information, synopsis and press details for ${title} from the Newflix Media Center.`,
      canonical: new URL(normalizedPath, SITE_ORIGIN).toString(),
      indexable: true,
    };
  }

  return {
    title: 'Newflix Pakistan | Movies, TV Shows and Dramas',
    description: 'Explore movies, TV shows, dramas and entertainment from Newflix.',
    indexable: false,
  };
}

export function renderSeoHead(pathname) {
  const seo = getPageSeo(pathname);
  const robots = seo.indexable ? 'index,follow' : 'noindex,nofollow';
  const pageUrl = seo.canonical || new URL(pathname, SITE_ORIGIN).toString();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'Newflix',
        url: `${SITE_ORIGIN}/`,
        description: 'An independent streaming platform project for movies, TV shows, dramas and entertainment.',
        inLanguage: 'en-PK',
      },
      ...(seo.indexable ? [{
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: seo.title,
        description: seo.description,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        inLanguage: 'en-PK',
      }] : []),
    ],
  };
  const safeJson = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
  const tags = [
    `<title data-newflix-seo>${xmlEscape(seo.title)}</title>`,
    `<meta data-newflix-seo name="description" content="${xmlEscape(seo.description)}">`,
    `<meta data-newflix-seo name="robots" content="${robots}">`,
    ...(seo.canonical ? [`<link data-newflix-seo rel="canonical" href="${xmlEscape(seo.canonical)}">`] : []),
    `<meta data-newflix-seo property="og:type" content="website">`,
    `<meta data-newflix-seo property="og:site_name" content="Newflix">`,
    `<meta data-newflix-seo property="og:title" content="${xmlEscape(seo.title)}">`,
    `<meta data-newflix-seo property="og:description" content="${xmlEscape(seo.description)}">`,
    `<meta data-newflix-seo property="og:url" content="${xmlEscape(pageUrl)}">`,
    `<meta data-newflix-seo name="twitter:card" content="summary">`,
    `<meta data-newflix-seo name="twitter:title" content="${xmlEscape(seo.title)}">`,
    `<meta data-newflix-seo name="twitter:description" content="${xmlEscape(seo.description)}">`,
    `<script data-newflix-seo type="application/ld+json">${safeJson}</script>`,
  ];
  return tags.join('\n    ');
}

export function applySeoToDocument(pathname) {
  const previousTitle = document.title;
  const seo = getPageSeo(pathname);
  document.head.querySelectorAll('[data-newflix-seo]').forEach((node) => node.remove());
  document.head.insertAdjacentHTML('beforeend', renderSeoHead(pathname));
  if (!seo.indexable) document.title = previousTitle;
}
