// apiUrl is the API base (WITH /api) — services append /endpoint directly.
// e.g. gallery.service.ts: `${environment.apiUrl}/gallery`
// → https://serkvisuals.com/api/gallery  (Nginx proxies /api/* to localhost:5000)
export const environment = {
  production: true,
  apiUrl: 'https://serkvisuals.com/api',
};
