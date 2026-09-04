/**
 * Helper to dynamically determine router basename and construct public URLs
 * Supports root deployments (Vercel, localhost) and subpath deployments (GitHub Pages).
 */

export const getBasename = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/securefile-transfer-platform')) {
    return '/securefile-transfer-platform';
  }
  return '';
};

export const getPublicShareUrl = (token) => {
  const origin = window.location.origin;
  const base = getBasename();
  return `${origin}${base}/share/${token}`;
};
