import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { placeCard } from '../utils/tourPlacement';

// First-login walkthrough — the coach-mark Netflix shows a new member, matching
// the design reference: the page dims, ONE navbar control is picked out in a
// cut-out, and a white card with a pointer arrow explains it.
//
// How it works
// ------------
// The scrim is four rectangles (top / right / bottom / left) laid around the
// target's measured rect rather than one overlay with a hole punched in it. That
// gives a real cut-out for free, and means the highlighted control keeps its own
// pixels — every OTHER control sits under a dimmed rectangle, which is what
// produces the reference's "Home / TV Shows grey, Movies lit" look.
//
// Two things here are not obvious and are very easy to get wrong again:
//
// 1. The ring around the lit control is an element of this overlay, not a
//    box-shadow on the control. `.navbar` is `position: fixed; z-index: 100`,
//    which is a stacking context — nothing inside it can ever paint above the
//    scrim, so a shadow added to a navbar child is invisible.
// 2. The card is mounted the moment a rect exists (hidden until it has been
//    placed) rather than once it has a position. Gating the render on the
//    position state deadlocks against the layout effect that produces it: no
//    card, so no node to measure, so no position, so no card — and the member
//    is left staring at a dimmed page with no Next and no Skip.
//
// The card is placed with JS rather than CSS because the arrow has to point at
// the target's centre while the card itself stays inside the viewport, so both
// are clamped and the arrow offset is re-derived from the measured card width.

// Bump the version to re-show the tour for everyone after changing the copy.
const TOUR_VERSION = 'v1';

const STEPS = [
  {
    tour: 'home',
    title: 'Welcome to StreamFlix',
    body: 'This is your home page. Everything you watch shapes the rows you see here.',
  },
  {
    tour: 'movies',
    title: 'How to find what you like to watch',
    body: 'Select "TV Shows" or "Movies" to find the kind of entertainment you’re in the mood for.',
  },
  {
    tour: 'new',
    title: 'New & Popular',
    body: 'See what just arrived, what everyone is watching this week, and today’s Top 10.',
  },
  {
    tour: 'search',
    title: 'Search for anything',
    body: 'Type a title, a genre or an actor’s name. Results appear as you type.',
  },
  {
    tour: 'kids',
    title: 'A space just for kids',
    body: 'The Kids page is filled with family and animated titles rated for young viewers.',
  },
  {
    tour: 'profile',
    title: 'Your profiles & settings',
    body: 'Switch profile, manage account, check notifications — it all lives under this avatar.',
  },
];

const isLast = (i) => i === STEPS.length - 1;

// The card has to fit on a phone even though the reference is the desktop
// layout; 340px is comfortably inside a 360px viewport minus the gutters.
const TIP_MAX_W = 340;
const TIP_GAP = 14;
const EDGE = 16;

export default function OnboardingTour() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [tip, setTip] = useState(null); // { left, top, arrowLeft, place }
  const tipRef = useRef(null);
  const [seen, setSeen] = useState(true); // start hidden so it never flashes
  const [probe, setProbe] = useState(0); // nudges the target lookup to re-run

  const storageKey = useCallback(
    () => `sf_tour_${TOUR_VERSION}_${user?._id || 'guest'}`,
    [user],
  );

  // Only a member who has not finished this version of the tour sees it.
  useEffect(() => {
    if (!user) return;
    let done = true;
    try { done = localStorage.getItem(storageKey()) === '1'; } catch { done = true; }
    if (!done) setSeen(false);
  }, [user, storageKey]);

  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey(), '1'); } catch { /* private mode */ }
    setSeen(true);
  }, [storageKey]);

  // Resolve which control this step points at, then keep it measured.
  //
  // Two things make this more than a querySelector:
  //
  // 1. A step whose target is hidden cannot get a card. The nav pills are
  //    display:none under 768px, and a resize can hide the current one
  //    mid-tour. Putting up a bare scrim in that state is a hard lock — no
  //    Next, no Skip — so the step jumps forward to the next VISIBLE one and
  //    the tour closes if none is left.
  // 2. getBoundingClientRect hands back a fresh DOMRect every call, so equal
  //    values are compared away instead of re-rendering on every scroll frame.
  //
  // This runs as a layout effect so the cut-out and the card are re-aimed in
  // the same paint as the step change instead of a frame behind it.
  useLayoutEffect(() => {
    if (seen) return undefined;

    const findTarget = (from) => {
      for (let i = from; i < STEPS.length; i += 1) {
        const el = document.querySelector(`[data-tour="${STEPS[i].tour}"]`);
        if (el && el.getClientRects().length > 0) return { el, index: i };
      }
      return null;
    };

    const hit = findTarget(step);
    if (!hit) {
      // Nothing to point at. Drop the stale cut-out so no card is left aimed at
      // a control that has gone, then look again once: the navbar can land a
      // tick after the tour mounts, and a silent finish() here would mark the
      // tour as seen so it never came back.
      setRect(null);
      const t = setTimeout(() => {
        if (findTarget(step)) setProbe((n) => n + 1);
        else finish();
      }, 600);
      return () => clearTimeout(t);
    }
    if (hit.index !== step) { setStep(hit.index); return undefined; }

    const measure = () => {
      const r = hit.el.getBoundingClientRect();
      // A zero-sized rect means the control is hidden after all.
      if (r.width <= 0 || r.height <= 0) { setRect(null); return; }
      setRect((prev) => (prev
        && prev.top === r.top && prev.left === r.left
        && prev.width === r.width && prev.height === r.height ? prev : r));
    };
    // A control that has just been hidden re-opens this effect, which then
    // skips forward rather than leaving a card aimed at nothing.
    const onResize = () => {
      if (hit.el.getClientRects().length === 0) setProbe((n) => n + 1);
      else measure();
    };

    measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, seen, probe, finish]);

  // Take the highlighted control's pointer events back, so a stray click
  // mid-tour cannot navigate the member away from a tour they have not
  // finished. Next / Skip are the only ways through.
  useLayoutEffect(() => {
    if (seen || !rect) return undefined;
    const el = document.querySelector(`[data-tour="${STEPS[step].tour}"]`);
    if (!el) return undefined;
    el.classList.add('tour-hot');
    return () => el.classList.remove('tour-hot');
  }, [step, seen, rect]);

  // Modal: stop the page scrolling behind the scrim.
  useEffect(() => {
    if (seen) return undefined;
    const block = (e) => e.preventDefault();
    document.addEventListener('wheel', block, { passive: false });
    document.addEventListener('touchmove', block, { passive: false });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('wheel', block);
      document.removeEventListener('touchmove', block);
      document.body.style.overflow = prev;
    };
  }, [seen]);

  // Place the card once it has been measured. useLayoutEffect runs before paint,
  // so the correction is never seen.
  //
  // The card is mounted as soon as a RECT exists — hidden with `visibility`
  // until it has been placed — precisely so there is something here to measure.
  // Mounting it only once `tip` was already set would deadlock: the state that
  // mounts the card is set by the effect that measures it, so the first pass
  // would find no ref, bail, and never run again. That failure is invisible in
  // review and shows up as a dimmed page with no card and no way forward.
  useLayoutEffect(() => {
    if (seen || !rect) return;
    const card = tipRef.current;
    if (!card) return;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // All of the clamping and the arrow offset live in placeCard() so it can be
    // tested without a browser — see frontend/src/utils/tourPlacement.js.
    setTip(placeCard(rect, w, h, vw, vh, TIP_GAP, EDGE));
  }, [rect, seen, step]);

  // Escape skips the tour, like the real one.
  useEffect(() => {
    if (seen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [seen, finish]);

  if (seen) return null;

  const next = () => (isLast(step) ? finish() : setStep((i) => i + 1));
  const s = STEPS[step];
  const shade = (style) => <div className="tour-shade" style={style} />;

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Getting started">
      {/* Until the first measurement lands, shade everything — a card pointing
          at a rectangle that does not exist yet would appear in the wrong place. */}
      {rect ? (
        <>
          {shade({ top: 0, left: 0, right: 0, height: rect.top })}
          {shade({ top: rect.bottom, left: 0, right: 0, bottom: 0 })}
          {shade({ top: rect.top, left: 0, width: rect.left, height: rect.height })}
          {shade({ top: rect.top, left: rect.right, right: 0, height: rect.height })}
        </>
      ) : shade({ inset: 0 })}

      {/* The highlight ring is drawn here rather than on the control itself:
          .navbar is `position: fixed; z-index: 100`, which is a stacking
          context, so a box-shadow on anything inside it is painted under the
          scrim and never shows. */}
      {rect && (
        <div
          className="tour-ring"
          aria-hidden="true"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}

      {/* Mounted as soon as a rect exists, and held at `visibility: hidden`
          until the layout effect has placed it — it has to be in the DOM to be
          measured, but it must never be painted at a stale position. `key`
          remounts it per step so a shorter or longer line re-measures. */}
      {rect && (
        <div
          key={step}
          ref={tipRef}
          className={`tour-tip ${tip ? `${tip.place} placed` : ''}`}
          style={{
            left: tip ? tip.left : 0,
            top: tip ? tip.top : 0,
            maxWidth: TIP_MAX_W,
            visibility: tip ? 'visible' : 'hidden',
          }}
        >
          <span className="tour-arrow" style={{ left: tip ? tip.arrowLeft : 0 }} aria-hidden="true" />
          <div className="tour-tip-head">
            <h3 className="tour-title">{s.title}</h3>
            <p className="tour-body">{s.body}</p>
          </div>
          <div className="tour-foot">
            <div className="tour-dots" role="tablist" aria-label="Tour progress">
              {STEPS.map((d, i) => (
                <button
                  key={d.tour}
                  type="button"
                  role="tab"
                  aria-label={`Step ${i + 1} of ${STEPS.length}`}
                  aria-selected={i === step}
                  className={`tour-dot${i === step ? ' on' : ''}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
            <button type="button" className="tour-next" onClick={next}>
              {isLast(step) ? 'Let’s Go' : 'Next'}
            </button>
          </div>
          <button type="button" className="tour-skip" onClick={finish}>Skip</button>
        </div>
      )}
    </div>
  );
}

