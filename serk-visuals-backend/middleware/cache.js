/**
 * publicCache(maxAge, swr)
 * Sets Cache-Control for public, unauthenticated GET endpoints.
 * maxAge  — seconds the CDN/browser may serve from cache (default 30s)
 * swr     — stale-while-revalidate window in seconds (default 60s)
 *
 * Why these defaults?
 *  - 30s is short enough that content changes are visible quickly.
 *  - swr=60 lets Vercel Edge / CDN serve a stale response while refreshing
 *    in the background, so the user never waits on the origin.
 */
function publicCache(maxAge = 30, swr = 60) {
  return (_req, res, next) => {
    res.set(
      "Cache-Control",
      `public, max-age=${maxAge}, stale-while-revalidate=${swr}`
    );
    next();
  };
}

module.exports = { publicCache };
