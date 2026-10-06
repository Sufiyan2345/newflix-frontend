// Shared Netflix-style icon set. Every icon is drawn as an inline SVG so the UI
// renders identically on every OS (no emoji font fallbacks like ▶ / ⓘ / 🔊, which
// is what made the old chrome look different on Windows vs macOS).
const S = ({ children, size = 24, viewBox = '0 0 24 24', ...rest }) => (
  <svg viewBox={viewBox} width={size} height={size} fill="currentColor"
    aria-hidden="true" focusable="false" {...rest}>{children}</svg>
);

const Outline = ({ children, size = 20, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" {...rest}>{children}</svg>
);

export const IconHomeLine = (p) => (
  <Outline {...p}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></Outline>
);
export const IconTvLine = (p) => (
  <Outline {...p}><rect x="3" y="5" width="18" height="13" rx="2" /><path d="m8 21 4-3 4 3" /><path d="M8 2l4 3 4-3" /></Outline>
);
export const IconFilmLine = (p) => (
  <Outline {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" /></Outline>
);
export const IconSparklesLine = (p) => (
  <Outline {...p}><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15ZM5 3l.7 1.5L7 5l-1.3.5L5 7l-.7-1.5L3 5l1.3-.5L5 3Z" /></Outline>
);
export const IconBookmarkLine = (p) => (
  <Outline {...p}><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" /><path d="M9 7h6" /></Outline>
);
export const IconGlobeLine = (p) => (
  <Outline {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></Outline>
);
export const IconSmileLine = (p) => (
  <Outline {...p}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></Outline>
);
export const IconActivityLine = (p) => (
  <Outline {...p}><path d="M3 12h4l2.5-7L14 19l2.5-7H21" /></Outline>
);

// Film-strip glyph for the episode-panel toggle in the real player controls.
export const IconEpisodes = (p) => (
  <S {...p}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm5 1v10H6V7h3zm5 0v10h-3V7h3zm3.5.5 2 1.5-2 1.5v-3z" />
  </S>
);

// Speaker with sound waves — Netflix's "audio & subtitles" control.
export const IconAudio = (p) => (
  <S {...p}>
    <path d="M11 3.5 6.5 7H3v10h3.5L11 20.5v-17z" />
    <path d="M14.2 8.2a1 1 0 0 1 1.4 0 5.6 5.6 0 0 1 0 7.6 1 1 0 1 1-1.4-1.4 3.6 3.6 0 0 0 0-4.8 1 1 0 0 1 0-1.4z" />
    <path d="M16.9 5.3a1 1 0 0 1 1.4 0 9.6 9.6 0 0 1 0 13.4 1 1 0 1 1-1.4-1.4 7.6 7.6 0 0 0 0-10.6 1 1 0 0 1 0-1.4z" />
  </S>
);

// Filled play triangle used as the "currently selected" checkmark in sheets.
export const IconCheckMark = (p) => (
  <S {...p}><path d="M9.6 16.6 5 12l-1.4 1.4 6 6 12-12L20.2 6z" /></S>
);

// Globe for the footer's language selector — the real site shows this to the
// left of the chosen language. Drawn as a stroked outline (not filled) to match
// the real glyph, with the two meridian ellipses and the equator line.
export const IconGlobe = (p) => (
  <S {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.6 0 3.2 2.1 3.9 5H8.1C8.8 6.1 10.4 4 12 4zM4.3 11h3.1a17 17 0 0 0 0 2H4.3a8 8 0 0 1 0-2zm0 4h3.5c.6 2 1.4 3.6 2.3 4.6A8 8 0 0 1 4.3 15zM12 20c-1.6 0-3.2-2.1-3.9-5h7.8c-.7 2.9-2.3 5-3.9 5zm4.9-.4c.9-1 1.7-2.6 2.3-4.6h3.5a8 8 0 0 1-5.8 4.6zM16.7 13a17 17 0 0 0 0-2h3a8 8 0 0 1 0 2h-3z" />
    <path d="M12 4c-1.6 0-3.2 2.1-3.9 5h7.8C15.2 6.1 13.6 4 12 4zM8.1 11a17 17 0 0 0 0 2h7.8a17 17 0 0 0 0-2H8.1zM12 20c1.6 0 3.2-2.1 3.9-5H8.1c.7 2.9 2.3 5 3.9 5z" />
  </S>
);

export const IconLanguages = ({ size = 20, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    <path d="m12.87 15.07-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17c-.68 1.84-1.7 3.59-3.17 5.15-1.01-1.08-1.86-2.3-2.54-3.63H4.48c.81 1.82 1.92 3.47 3.33 4.93L2 18.17l1.41 1.41 6-6 3.73 3.73.73-2.24ZM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12Zm-2.63 7 1.63-4.33L19.13 17h-3.26Z" />
  </svg>
);

export const IconSearch = (p) => (
  <S {...p}><path d="M13.5 3a8.5 8.5 0 1 0 5.2 15.2l3.1 3.1 1.7-1.7-3.1-3.1A8.5 8.5 0 0 0 13.5 3zm0 2.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" /></S>
);

export const IconApps = (p) => (
  <S {...p}>
    {[3, 10.5].flatMap((y) => [3, 10.5].map((x) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.2" />
    )))}
  </S>
);

export const IconUsers = (p) => (
  <S {...p}><path d="M16 11a4 4 0 1 0-3.9-4.8A4 4 0 0 0 16 11zm-8 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 2c-2.7 0-5 1.3-5 3v2h10v-2c0-1.7-2.3-3-5-3zM8 13c-2.8 0-5 1.3-5 3v2h6v-2c0-1.2.5-2.2 1.4-3H8z" /></S>
);

export const IconBell = (p) => (
  <S {...p}><path d="M12 2a6.5 6.5 0 0 1 6.5 6.5v3.2l1.6 3.3a1 1 0 0 1-.9 1.5H17a5 5 0 0 1-10 0H4.8a1 1 0 0 1-.9-1.5l1.6-3.3V8.5A6.5 6.5 0 0 1 12 2zm0 18a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 20z" /></S>
);

export const IconCaret = (p) => (
  <S {...p}><path d="M6 9l6 6 6-6z" /></S>
);

// Small clock that sits in front of a title's running time on the hover preview
// card ("1h 41m"). Filled rather than stroked so it reads at 12px next to the
// green match text.
export const IconClock = (p) => (
  <S {...p}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3.2v5.1l4.2 2.5.8-1.4-3.3-1.9V7.2h-1.7z" /></S>
);

export const IconClose = (p) => (
  <S {...p}><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4L10.6 10.6l6.3-6.3z" /></S>
);

export const IconTrash = (p) => (
  <S {...p}><path d="M8 3h8l1 2h4v2H3V5h4l1-2zm-3 6h14l-1 12H6L5 9zm4 2v8h2v-8H9zm4 0v8h2v-8h-2z" /></S>
);

export const IconPlay = (p) => (
  <S {...p}><path d="M5 3.5v17l15-8.5z" /></S>
);

export const IconPause = (p) => (
  <S {...p}><path d="M6 3h4v18H6zM14 3h4v18h-4z" /></S>
);

export const IconInfo = (p) => (
  <S {...p}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3v2h2V7h-2zm0 4v6h2v-6h-2z" /></S>
);

export const IconPlus = (p) => (
  <S {...p}><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z" /></S>
);

export const IconCheck = (p) => (
  <S {...p}><path d="M9.6 16.6 5 12l-1.4 1.4 6 6 12-12L20.2 6z" /></S>
);

export const IconThumbUp = ({ filled = false, ...p }) => (
  <S {...p} {...(filled ? {} : { fill: 'currentColor' })}>
    <path d="M2 10h4v11H2V10zm6 .2 4.1-8.1a1.6 1.6 0 0 1 3 1.3L14 9h4.6a2.4 2.4 0 0 1 2.3 3l-1.7 7A2.5 2.5 0 0 1 16.8 21H8V10.2z" opacity={filled ? 1 : 0.95} />
  </S>
);

export const IconThumbDown = (p) => (
  <S {...p}><path d="M2 10h4v11H2V10zm6 .2 4.1-8.1a1.6 1.6 0 0 1 3 1.3L14 9h4.6a2.4 2.4 0 0 1 2.3 3l-1.7 7A2.5 2.5 0 0 1 16.8 21H8V10.2z" transform="rotate(180 12 12)" /></S>
);

export const IconVolume = (p) => (
  <S {...p}><path d="M4 9v6h4l5 4V5L8 9H4zm12.5-.6a5 5 0 0 1 0 7.2l-1.2-1.2a3.2 3.2 0 0 0 0-4.8l1.2-1.2zm2.4-2.4a8.4 8.4 0 0 1 0 12l-1.3-1.3a6.6 6.6 0 0 0 0-9.4l1.3-1.3z" /></S>
);

// Low volume — Netflix shows a distinct glyph between muted and full.
export const IconVolumeLow = (p) => (
  <S {...p}><path d="M4 9v6h4l5 4V5L8 9H4zm12.5-.6a5 5 0 0 1 0 7.2l-1.2-1.2a3.2 3.2 0 0 0 0-4.8l1.2-1.2z" /></S>
);

export const IconMuted = (p) => (
  <S {...p}><path d="M4 9v6h4l5 4V5L8 9H4zm12.6.6 1.4-1.4 1.6 1.6 1.6-1.6 1.4 1.4-1.6 1.6 1.6 1.6-1.4 1.4-1.6-1.6-1.6 1.6-1.4-1.4 1.6-1.6-1.6-1.6z" /></S>
);

export const IconBack10 = (p) => (
  <S {...p}><path d="M12.5 3a9 9 0 1 1-8.5 6.2H1.5L5 5.7l3.5 3.5H6.1A7 7 0 1 0 12.5 5V3zm-3 6.4h1.8V15h-1.7v-3.9l-1.3.8-.6-1.1 1.8-1.4zm3 0h2.2a2.3 2.3 0 0 1 0 5.6h-2.2V9.4zm1.5 1.2v3.2h.6a1.6 1.6 0 0 0 0-3.2h-.6z" /></S>
);

export const IconFwd10 = (p) => (
  <S {...p}><path d="M11.5 3v2A7 7 0 1 0 17.9 9.2h-2.4L19 5.7l3.5 3.5h-2.5A9 9 0 1 1 11.5 3zm-3 6.4h1.8V15h-1.7v-3.9l-1.3.8-.6-1.1 1.8-1.4zm3 0h2.2a2.3 2.3 0 0 1 0 5.6h-2.2V9.4zm1.5 1.2v3.2h.6a1.6 1.6 0 0 0 0-3.2h-.6z" /></S>
);

export const IconSubtitle = (p) => (
  <S {...p}><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h16V7H4zm2 6h5v2H6v-2zm7 0h5v2h-5v-2zM6 9h6v2H6V9zm8 0h4v2h-4V9z" /></S>
);

export const IconSettings = (p) => (
  <S {...p}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1.3-8h2.6l.4 2.2 2 .8 1.8-1.3 1.8 1.8-1.3 1.8.8 2 2.2.4v2.6l-2.2.4-.8 2 1.3 1.8-1.8 1.8-1.8-1.3-2 .8-.4 2.2h-2.6l-.4-2.2-2-.8-1.8 1.3-1.8-1.8 1.3-1.8-.8-2L2.9 13v-2.6l2.2-.4.8-2L4.6 6.2l1.8-1.8 1.8 1.3 2-.8.5-2.2z" /></S>
);

export const IconNextEp = (p) => (
  <S {...p}><path d="M6 5l10 7-10 7V5zm11 0h2v14h-2V5z" /></S>
);

export const IconFullscreen = (p) => (
  <S {...p}><path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z" /></S>
);

export const IconExitFullscreen = (p) => (
  <S {...p}><path d="M8 4h2v6H4V8h4V4zm6 0h2v4h4v2h-6V4zM4 14h6v6H8v-4H4v-2zm10 0h6v2h-4v4h-2v-6z" /></S>
);

export const IconChevronDown = (p) => (
  <S {...p}><path d="M12 15.5 5.5 9l1.4-1.4L12 12.7l5.1-5.1L18.5 9z" /></S>
);

export const IconChevronLeft = (p) => (
  <S {...p}><path d="M15.5 4.5 8 12l7.5 7.5 1.4-1.4L10.8 12l6.1-6.1z" /></S>
);

export const IconChevronRight = (p) => (
  <S {...p}><path d="M8.5 4.5 16 12l-7.5 7.5-1.4-1.4L13.2 12 7.1 5.9z" /></S>
);

export const IconSpeed = (p) => (
  <S {...p}><path d="M12 4a9 9 0 0 0-7.6 13.8l1.7-1.2A7 7 0 1 1 19 12a6.9 6.9 0 0 1-1.1 3.7l1.7 1.2A9 9 0 0 0 12 4zm3.9 4.3-4.6 3.4a1.7 1.7 0 1 0 2.3 2.3l3.4-4.6-1.1-1.1z" /></S>
);

export const IconStar = (p) => (
  <S {...p}><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z" /></S>
);

// Quality "signal bars" glyph used by the player settings panel (tab 1)
export const IconQuality = (p) => (
  <S {...p}>
    <rect x="3" y="14" width="3.4" height="6" rx="1" />
    <rect x="8.6" y="10" width="3.4" height="10" rx="1" />
    <rect x="14.2" y="6" width="3.4" height="14" rx="1" />
    <rect x="19.8" y="3" width="1.4" height="17" rx="0.7" />
  </S>
);

// Retry glyph for the playback error state ("Try again")
export const IconRefresh = (p) => (
  <S {...p}><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" /></S>
);

// The red "N" brand mark, drawn as a flat vector (same proportions as the trimmed
// /Netflix.png artwork: 116x209). Crisp at any size — navbar lockup and the
// hero "N SERIES" tag. Bars in the dark Netflix red, diagonal in the bright red.
export const IconNetflixN = ({ height = 22, className, ...rest }) => (
  <svg
    viewBox="0 0 116 209"
    height={height}
    width={(height * 116) / 209}
    className={className}
    aria-hidden="true" focusable="false" {...rest}
  >
    <path fill="#B1060F" d="M0 0h31v209H0z" />
    <path fill="#B1060F" d="M85 0h31v209H85z" />
    <path fill="#E50914" d="M31 0h43l54 209H85z" />
  </svg>
);

export const IconCreditCardLine = (p) => (
  <Outline {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></Outline>
);
export const IconShieldCheckLine = (p) => (
  <Outline {...p}><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></Outline>
);
export const IconDevicesLine = (p) => (
  <Outline {...p}><rect x="2.5" y="4" width="14" height="11" rx="1.5" /><path d="M6 19h7M9.5 15v4" /><rect x="17.5" y="9" width="4" height="10" rx="1" /></Outline>
);
export const IconLockLine = (p) => (
  <Outline {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" /></Outline>
);
export const IconMailLine = (p) => (
  <Outline {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></Outline>
);
export const IconPhoneLine = (p) => (
  <Outline {...p}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M10 5h4m-3 13h2" /></Outline>
);
export const IconTransferLine = (p) => (
  <Outline {...p}><circle cx="9" cy="7" r="3" /><path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4 4 0 0 1 3.3 1.7M15 8h6m-2-2 2 2-2 2m-5 6H8m2-2-2 2 2 2" /></Outline>
);
export const IconLogoutLine = (p) => (
  <Outline {...p}><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M14 16l4-4-4-4m4 4H9" /></Outline>
);
export const IconPersonAccessLine = (p) => (
  <Outline {...p}><circle cx="12" cy="8" r="3" /><path d="M5 20v-1a7 7 0 0 1 14 0v1m-2-8 2 2 3-3" /></Outline>
);
export const IconFlaskLine = (p) => (
  <Outline {...p}><path d="M9 3h6m-1 0v6l5.2 9.2A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-1.7-2.8L10 9V3m-3 12h10" /></Outline>
);
export const IconWarningTriangleLine = (p) => (
  <Outline {...p}><path d="M10.3 4.3 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></Outline>
);
