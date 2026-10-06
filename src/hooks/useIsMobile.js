import { useEffect, useState } from 'react';

// The single source of truth for "are we on a phone".
//
// It has to agree with the CSS: the bottom tab bar, the title sheet and the rail
// tap targets are all decided in JavaScript, while the layout is decided in
// `@media (max-width: 768px)` (styles/mobile.css). When the two disagree a phone
// gets desktop hover cards with no way to open them, or a desktop navbar with no
// tab bar underneath — so both sides read this number.
//
// `matchMedia` (not a resize listener on window.innerWidth) so an orientation
// flip re-renders the tree instead of leaving it in the desktop layout until the
// next unrelated state change.
export const MOBILE_MAX_WIDTH = 768;

const mobileQuery = () => (
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    : null
);

const readIsMobile = () => {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
  }
  return window.innerWidth <= MOBILE_MAX_WIDTH;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readIsMobile);

  useEffect(() => {
    const mq = mobileQuery();
    const onChange = () => setIsMobile(readIsMobile());

    // No matchMedia at all (very old Safari): fall back to raw resize events.
    if (!mq) {
      window.addEventListener('resize', onChange);
      window.addEventListener('orientationchange', onChange);
      onChange();
      return () => {
        window.removeEventListener('resize', onChange);
        window.removeEventListener('orientationchange', onChange);
      };
    }

    setIsMobile(mq.matches);
    // Safari < 14 only ships the deprecated addListener/removeListener pair.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return isMobile;
}

export default useIsMobile;
