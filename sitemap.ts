const SITE_ORIGIN = 'https://newflix-app.vercel.app';

const PUBLIC_PATHS = [
  '/',
  '/p/faq',
  '/p/help-center',
  '/p/contact',
  '/p/title-request',
  '/p/only-on-netflix',
  '/p/media-center',
  '/p/investor-relations',
  '/p/terms',
  '/p/privacy',
  '/p/ways-to-watch',
  '/p/legal-notices',
  '/p/corporate-information',
  '/p/jobs',
  '/p/speed-test',
] as const;

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export function renderSitemapXml(): string {
  const urls = PUBLIC_PATHS.map((path) => {
    const location = new URL(path, SITE_ORIGIN).toString();
    return `  <url><loc>${escapeXml(location)}</loc></url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
