// The public title screen a TMDB card opens:
//   /p/only-on-netflix/title/:type/:id
//
// Every TMDB card in the app carries its own coordinates inside its `_id`
// (`tmdb-movie-550`, `tmdb-tv-1399`), so the route can be rebuilt from the card
// alone — which is what lets the "Only on Netflix" rail page and this title
// page's own discovery rails navigate to each other without the target passing
// anything through router state it might lose on a reload.
//
// It lives in utils/ rather than in either page because BOTH sides need it and
// the route shape must not drift: the rail page hands it to `navigate`, the title
// page uses it to filter out the title it is already showing.
//
// Returns null for anything that is not a TMDB title (a database title with a
// numeric Mongo id, a people credit, a genre row), so a caller can simply skip a
// card it cannot route rather than pushing a dead URL.
const TMDB_COORDS = /^tmdb-(movie|tv)-(\d+)$/;

export function titlePagePath(item) {
  const coords = TMDB_COORDS.exec(String(item?._id || ''));
  if (!coords) return null;
  return `/p/only-on-netflix/title/${coords[1]}/${coords[2]}`;
}

export default titlePagePath;