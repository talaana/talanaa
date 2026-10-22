/**
 * Path routing for the cinematic experience, isolated from the host app's
 * hash/query routing. Only detects /experience and /experience/:slug.
 */

export type ExperienceRoute =
  | { kind: 'landing' }
  | { kind: 'campaign'; slug: string }
  | null;

export function detectExperienceRoute(): ExperienceRoute {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path === '/experience' || path === '/experience/') return { kind: 'landing' };
  const match = path.match(/^\/experience\/([^/]+)/);
  if (match) return { kind: 'campaign', slug: decodeURIComponent(match[1]) };
  return null;
}
