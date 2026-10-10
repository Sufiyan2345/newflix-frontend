import { getPublicSeoPaths, SITE_ORIGIN } from './src/utils/seo.js';

export function renderSitemapXml(): string {
  const urls = getPublicSeoPaths().map((path) => {
    const location = new URL(path, SITE_ORIGIN).toString();
    return `  <url><loc>${location}</loc></url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
