import { defineConfig } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import react from '@vitejs/plugin-react';
import { renderSitemapXml } from './sitemap.ts';
import { getPublicSeoPaths, renderSeoHead } from './src/utils/seo.js';

function sitemapPlugin() {
  let outputPath;
  let outputDir;

  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(config) {
      outputPath = resolve(config.root, config.build.outDir, 'sitemap.xml');
      outputDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await writeFile(outputPath, renderSitemapXml(), 'utf8');
      const indexPath = resolve(outputDir, 'index.html');
      const html = await readFile(indexPath, 'utf8');
      for (const pathname of getPublicSeoPaths()) {
        const destination = pathname === '/'
          ? indexPath
          : resolve(outputDir, `${pathname.slice(1).split('/').join(sep)}`, 'index.html');
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, html.replace('<!-- newflix-seo-head -->', renderSeoHead(pathname)), 'utf8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
