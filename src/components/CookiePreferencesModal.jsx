import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import useBranding from '../hooks/useBranding';
import {
  COOKIE_PREFERENCES_EVENT, COOKIE_HOSTS, COOKIE_SECTIONS,
  openCookiePreferences, readConsent, writeConsent,
} from '../utils/cookiePreferences';

// ---------------------------------------------------------------------------
// The Netflix "Privacy Preference Center".
//
// The reference footer's "Cookie Preferences" link does NOT navigate to a page —
// it raises a 730x610 OneTrust dialog over whatever you were reading. Geometry
// below is measured off the live modal at 1280px: a 61px header, a 437px body
// split into a 224px category rail and a 477px copy column, and a 112px footer.
//
// It is mounted once for the whole app (App.jsx) and raised through the
// `streamflix-cookie-preferences-open` window event, so every footer on every
// page opens the same single dialog instead of each page owning a copy.
// ---------------------------------------------------------------------------

// Only the two switchable categories carry a toggle; the other three are fixed,
// exactly as in the reference.
const TOGGLE_KEYS = COOKIE_SECTIONS.filter((s) => s.toggle).map((s) => s.toggle);

const defaultConsent = () => {
  const saved = readConsent();
  // ON until the visitor actively switches a category off, as on the real site.
  const next = {};
  TOGGLE_KEYS.forEach((k) => { next[k] = saved?.[k] !== false; });
  return next;
};

const Paragraph = ({ runs }) => (
  <p>
    {runs.map((run, i) => (run.to
      ? <Link key={i} to={run.to}>{run.text}</Link>
      : <span key={i}>{run.text}</span>))}
  </p>
);

// The 45x25 pill: green when on, grey when off, with an 18px white knob that
// slides between left and right.
const Switch = ({ id, label, on, onChange }) => (
  <button
    type="button"
    role="switch"
    id={`ppc-switch-${id}`}
    aria-checked={on}
    aria-label={label}
    className="ppc-switch"
    onClick={() => onChange(id, !on)}
  >
    <span className="ppc-switch-nob" />
  </button>
);

// The "Cookies Details" sub-view — the reference replaces the whole body with a
// back link, a "Cookie List" heading and one expandable row per host.
function CookieList({ onBack }) {
  const [openHost, setOpenHost] = useState(null);
  return (
    <div className="ppc-list">
      <div className="ppc-list-head">
        <button type="button" className="ppc-back" onClick={onBack}>
          <span aria-hidden="true">‹</span> Back to preference center
        </button>
        <h3 className="ppc-list-title">Cookie List</h3>
      </div>
      <ul className="ppc-hosts">
        {COOKIE_HOSTS.map(({ host, cookies }) => {
          const open = openHost === host;
          return (
            <li key={host} className="ppc-host">
              <button
                type="button"
                className="ppc-host-box"
                aria-expanded={open}
                onClick={() => setOpenHost(open ? null : host)}
              >
                <span className="ppc-host-name">{host}</span>
                <span className="ppc-host-expand">{open ? 'Hide Cookies' : 'View Cookies'}</span>
              </button>
              {open && (
                <ul className="ppc-cookies">
                  {cookies.map((c) => (
                    <li key={c.name} className="ppc-cookie">
                      <b>{c.name}</b>
                      <span>{c.domain}</span>
                      <span>{c.life}</span>
                      <span>{c.purpose}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CookiePreferencesModal() {
  const branding = useBranding();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(COOKIE_SECTIONS[0].id);
  const [showList, setShowList] = useState(false);
  const [consent, setConsent] = useState(defaultConsent);

  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  // Any footer on any page raises the dialog through the window event.
  useEffect(() => {
    const onOpen = () => {
      setConsent(defaultConsent());
      setActive(COOKIE_SECTIONS[0].id);
      setShowList(false);
      setOpen(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Escape closes, the page behind is locked, and focus returns to whatever
  // opened the dialog.
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, close]);

  // Arrow keys walk the category rail, as a tablist should.
  const onRailKeyDown = (e) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = COOKIE_SECTIONS.findIndex((s) => s.id === active);
    const next = (i + step + COOKIE_SECTIONS.length) % COOKIE_SECTIONS.length;
    setActive(COOKIE_SECTIONS[next].id);
    setShowList(false);
  };

  const save = () => { writeConsent(consent); close(); };
  const toggle = (id, value) => setConsent((c) => ({ ...c, [id]: value }));

  const section = COOKIE_SECTIONS.find((s) => s.id === active) || COOKIE_SECTIONS[0];

  if (!open) return null;

  return createPortal(
    <div
      className="ppc-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="ppc-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy Preference Center"
      >
        <div className="ppc-header">
          <div className="ppc-logo">
            <img src="/newflix.png" alt={branding.siteName} draggable="false" />
          </div>
          <div className="ppc-title">
            <h2>Privacy Preference Center</h2>
          </div>
          <button
            type="button"
            className="ppc-close"
            aria-label="Close"
            onClick={close}
            ref={closeRef}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>



        <div className="ppc-body">
          {showList ? (
            <CookieList onBack={() => setShowList(false)} />
          ) : (
            <>
              <ul
                className="ppc-rail"
                role="tablist"
                aria-label="Cookie categories"
                aria-orientation="vertical"
                onKeyDown={onRailKeyDown}
              >
                {COOKIE_SECTIONS.map((s) => (
                  <li key={s.id} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      id={`ppc-tab-${s.id}`}
                      aria-selected={s.id === active}
                      aria-controls="ppc-panel"
                      tabIndex={s.id === active ? 0 : -1}
                      className={`ppc-rail-item${s.id === active ? ' on' : ''}`}
                      onClick={() => { setActive(s.id); setShowList(false); }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>

              <div
                className="ppc-copy"
                id="ppc-panel"
                role="tabpanel"
                aria-labelledby={`ppc-tab-${active}`}
                tabIndex={-1}
              >
                <div className="ppc-desc">
                  <div className="ppc-desc-head">
                    <h4>{section.name}</h4>
                    {section.toggle && (
                      <Switch
                        id={section.toggle}
                        label={section.name}
                        on={consent[section.toggle]}
                        onChange={toggle}
                      />
                    )}
                  </div>
                  {section.paragraphs.map((runs, i) => (
                    <Paragraph key={i} runs={runs} />
                  ))}
                  {section.details && (
                    <button
                      type="button"
                      className="ppc-details"
                      onClick={() => setShowList(true)}
                    >
                      Cookies Details
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ppc-footer">
          <div className="ppc-actions">
            <button type="button" className="ppc-save" onClick={save}>
              Save settings
            </button>
          </div>
          <div className="ppc-ot">
            <a
              href="https://www.onetrust.com/solutions/consent-and-preferences/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/powered_by_logo.svg" alt="Powered by OneTrust" className="ppc-ot-mark" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
