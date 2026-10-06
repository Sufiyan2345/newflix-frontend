// Placement maths for the first-login coach marks.
//
// This is the one part of the tour that has to be right at every viewport size
// and that cannot be checked by reading it: the card has to stay fully on
// screen on a 375px phone as well as on a desktop, the arrow has to keep
// pointing at the control after the card has been nudged sideways to stay on
// screen, and it has to flip above the control when there is no room underneath.
// All of that is arithmetic, so it lives here as a pure function and is
// exercised directly by backend/_tour_verify.mjs — no browser, no DOM.
//
// gap/edge are passed in rather than baked in so the caller owns the design
// tokens and the tests state their own expectations.

export function placeCard(rect, w, h, vw, vh, gap, edge) {
  const below = rect.bottom + gap;
  const place = below + h <= vh - edge ? 'below'
    : (rect.top - gap - h >= edge ? 'above' : 'below');

  // Vertical: prefer the side with room, then clamp so the card is never half
  // off the bottom — the "neither side fits" case still has to be on screen.
  const preferred = place === 'below' ? below : rect.top - gap - h;
  const top = Math.min(Math.max(preferred, edge), Math.max(edge, vh - h - edge));

  // Horizontal: centre the card on the control, then keep it fully on screen.
  const rawLeft = rect.left + rect.width / 2 - w / 2;
  const left = Math.min(Math.max(rawLeft, edge), Math.max(edge, vw - w - edge));

  // The arrow still points at the control after the card has been nudged, and
  // never sits so close to a corner that it reads as pointing at the edge.
  const centre = rect.left + rect.width / 2;
  const arrowLeft = Math.min(Math.max(centre - left, 18), Math.max(18, w - 18));

  return { left, top, arrowLeft, place };
}