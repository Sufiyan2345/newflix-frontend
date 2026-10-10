import { useEffect, useMemo, useState } from 'react';
import { isTmdbImage } from '../utils/imageUrl';

// Shared rotation clock for the billboard. The user site renders hero slides in
// several places (Browse, the TMDB Movies / TV pages, the genre pages), and each
// page used to keep its own `heroIndex` + interval.
//
// That is where the billboard broke: the dot click and the interval counted a
// DIFFERENT array than the one <HeroBanner> actually rendered. On Browse the
// clock read `feed.featured.length` while the rendered slides came from the
// TMDB fallback, so with no admin-featured title at all the banner sat frozen
// on slide 1 and the dots did nothing. Both pages now go through this hook, so
// the index can never point at a slide that is not on screen.
//
// The hook filters the candidate pool to recent TMDB titles with real backdrops,
// then picks up to ten slides released within the last four calendar years.
// Re-rolling per visit keeps banners fresh without admitting old titles or
// locally uploaded artwork.
export const MAX_HERO_SLIDES = 10;
export const HERO_INTERVAL_MS = 25000;
export const HERO_SLIDE_EVENT = 'streamflix-featured-slide';
export const HERO_MIN_RELEASE_YEAR = 2023;

export const isRecentTmdbHero = (slide) => {
  const releaseYear = Number(slide?.releaseYear);
  return /^tmdb-(movie|tv)-\d+$/.test(String(slide?._id || ''))
    && releaseYear >= HERO_MIN_RELEASE_YEAR
    && releaseYear <= new Date().getFullYear()
    && isTmdbImage(slide?.bannerUrl);
};

export const recentTmdbHeroPool = (pool) => {
  const seen = new Set();
  return (pool || []).filter((slide) => {
    const id = String(slide?._id || '');
    if (!isRecentTmdbHero(slide) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// Random pick of up to `max` slides out of the pool (Fisher–Yates on a copy).
// Prefer wide banner artwork so portrait posters are not stretched across the
// billboard. Fall back to poster art only when the pool has no banners.
// Nothing is remembered between visits — every page load rolls its own pick.
export const pickRandomSlides = (pool, max = MAX_HERO_SLIDES) => {
  const list = recentTmdbHeroPool(pool);
  const withBanner = list.filter((s) => s.bannerUrl || s.backdropUrl);
  const source = withBanner.length ? withBanner : list.filter((s) => s.posterUrl);
  const currentYear = new Date().getFullYear();
  const recent = source.filter((s) => Number(s.releaseYear) >= currentYear - 1);
  const olderRecent = source.filter((s) => Number(s.releaseYear) < currentYear - 1);
  const shuffleCopy = (items) => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const copy = [...shuffleCopy(recent), ...shuffleCopy(olderRecent)];
  const selected = [];
  ['KR', 'CN'].forEach((country) => {
    const title = copy.find((slide) => slide.originCountry === country);
    if (title && selected.length < max) selected.push(title);
  });
  copy.forEach((slide) => {
    if (selected.length < max && !selected.some((picked) => picked._id === slide._id)) {
      selected.push(slide);
    }
  });
  for (let i = selected.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
};

export default function useHeroSlides(pool, {
  intervalMs = HERO_INTERVAL_MS,
  maxSlides = MAX_HERO_SLIDES,
  shuffle = true,
  paused = false,
  seed = 0,
} = {}) {
  const list = (pool || []).filter(Boolean);
  // Identity of the candidate pool: the arrays handed in are rebuilt on every
  // render, so the pick keys off the slide ids instead of the array reference.
  const poolIds = list.map((slide, i) => String(slide?._id || slide?.id || i)).join('|');
  const storageKey = `newflix-hero-last:${typeof window === 'undefined' ? '' : window.location.pathname}`;

  // One pick per pool = one per page load. `useMemo` keeps it stable while the
  // viewer is watching (re-rolling mid-view would swap the slide under them) and
  // a fresh mount — login, reload, returning to Home — rolls again.
  const slides = useMemo(() => {
    const picked = shuffle ? pickRandomSlides(list, maxSlides) : list.slice(0, maxSlides);
    if (typeof window === 'undefined' || picked.length < 2) return picked;
    let lastSlideId = '';
    try {
      lastSlideId = window.localStorage.getItem(storageKey) || '';
    } catch {
      return picked;
    }
    if (String(picked[0]?._id || '') !== lastSlideId) return picked;
    const alternativeIndex = picked.findIndex((slide, index) => index > 0 && String(slide?._id || '') !== lastSlideId);
    if (alternativeIndex > 0) [picked[0], picked[alternativeIndex]] = [picked[alternativeIndex], picked[0]];
    return picked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolIds, maxSlides, shuffle, seed, storageKey]);
  const count = slides.length;
  const ids = slides.map((slide, i) => String(slide?._id || slide?.id || i)).join('|');

  const [index, setIndex] = useState(0);
  // A shorter pool (live feed finishes loading, admin un-features a title)
  // must never leave the index past the last slide — that is what blanked the
  // billboard for a slide instead of showing the first one.
  const safeIndex = count ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (index !== safeIndex) setIndex(safeIndex);
  }, [index, safeIndex]);

  useEffect(() => {
    const activeSlideId = String(slides[safeIndex]?._id || '');
    if (!activeSlideId) return;
    try {
      window.localStorage.setItem(storageKey, activeSlideId);
    } catch {
      // Rotation still works when browser storage is unavailable.
    }
  }, [safeIndex, slides, storageKey]);

  // Auto-rotate from one stable clock. Recreating the timer on every index
  // change made the Movies / TV hero feel uneven when React re-rendered it.
  // Hover pauses only the artwork drift; banner rotation keeps running.
  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1 >= count ? 0 : prev + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [count, intervalMs]);

  // Dot clicks inside <HeroBanner> land here — validated against the visible
  // slide count. (HeroBanner prefers the `onSlideSelect` prop and only falls
  // back to this event, so nothing is ever handled twice.)
  useEffect(() => {
    const onSelect = (event) => {
      const next = Number(event?.detail);
      if (Number.isInteger(next) && next >= 0 && next < count) setIndex(next);
    };
    window.addEventListener(HERO_SLIDE_EVENT, onSelect);
    return () => window.removeEventListener(HERO_SLIDE_EVENT, onSelect);
  }, [count]);

  return { slides, index: safeIndex, setIndex, count };
}
