/**
 * Ensures social/profile URLs open as absolute external links (not relative to the site).
 */
export function toExternalUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("@")) {
    const handle = u.slice(1);
    return `https://www.instagram.com/${handle}/`;
  }
  return `https://${u}`;
}
