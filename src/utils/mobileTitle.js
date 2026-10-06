// The window event that opens the phone title sheet.
//
// It lives in its own module instead of inside <MobileTitleSheet> so that
// Row.jsx (which renders the cards) and MobileTitleSheet.jsx (which renders the
// sheet) can both reach it WITHOUT importing each other — a direct import would
// make a cycle: Row -> MobileTitleSheet -> Row. This is the same
// `CustomEvent` bridge the app already uses for `tmdb-open-detail`.
export const MOBILE_TITLE_EVENT = 'streamflix-mobile-title-open';

/**
 * Open the Netflix mobile title sheet for one card.
 * A no-op off the phone, so callers can fire it unconditionally.
 */
export const openMobileTitle = (item) => {
  if (typeof window === 'undefined' || !item) return;
  window.dispatchEvent(new CustomEvent(MOBILE_TITLE_EVENT, { detail: item }));
};

export default openMobileTitle;
