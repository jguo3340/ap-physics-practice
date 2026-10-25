// Site-wide settings. Change the name here and it updates everywhere.
export const site = {
  name: 'Physics 1 Practice',
  description:
    'AP-style multiple-choice practice for AP Physics 1, organized by unit, with explanations, cheat sheets, and key equations.',
};

/**
 * Builds a link that still works when the site is served from a sub-folder
 * (for example GitHub Pages). Use it for every internal link: url('/units').
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
