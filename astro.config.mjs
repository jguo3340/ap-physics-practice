// @ts-check
import { defineConfig } from 'astro/config';

// BASE_PATH lets the same code run at the root of a domain (Vercel, a custom
// domain) or under a sub-folder (GitHub Pages serves at /<repo-name>/).
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
});
