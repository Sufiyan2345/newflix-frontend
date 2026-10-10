import { defineConfig } from 'vite';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { renderSitemapXml } from './sitemap.ts';

function sitemapPlugin() {
  let outputPath;

  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(config) {
      outputPath = resolve(config.root, config.build.outDir, 'sitemap.xml');
    },
    async closeBundle() {
      await writeFile(outputPath, renderSitemapXml(), 'utf8');
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
