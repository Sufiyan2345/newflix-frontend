// Honest "match %" for title cards.
//
// The UI used to hard-code a fallback of 96 for any title that had no
// `matchPercentage`, which displayed a fabricated number on the real catalogue.
// This helper only returns a value when there is an actual signal:
//   - TMDB items carry `matchPercentage` (their vote_average * 10), or
//   - local titles derive it from their community rating (`avgRating`).
// With no data it returns 0, and callers hide the badge entirely.
export function matchPercent(item) {
  if (!item) return 0;
  const explicit = Number(item.matchPercentage);
  const derived = Math.round((Number(item.avgRating) || Number(item.voteAverage) || 0) * 10);
  const value = Math.round(explicit > 0 ? explicit : derived);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, 99);
}
