import { Link } from 'react-router-dom';
import Footer, { HelpCenterLanguageSelect } from './Footer';
import { COOKIE_PREFERENCES_PATH } from '../utils/cookiePreferences';
import { footerEntry } from './CookiePreferencesLink';

// The masthead, shared by every page in the Help Center: the wordmark, the "|"
// rule, the "Help Center" label and the two account buttons.
//
// It used to live inside pages/StaticPage.jsx, but the Contact Us and Request TV
// Shows or Movies pages are their own components (both are forms, not markdown
// articles) and they need the same masthead, so the two functions every Help
// Center page shares now live here rather than being imported out of a page.
//
// `light` switches to the variant the reference uses on the LANDING page only.
// help.netflix.com/en serves <div class="global-header light-theme">, which
// resolves to color #000 on background #fff with a 1px rgba(128,128,128,.2)
// bottom border — while every article page serves the plain .global-header,
// which is black. Same markup, one flag.
export function HelpCenterHeader({ light = false }) {
  return (
    <header className={`hc-header${light ? ' hc-header-light' : ''}`}>
      <div className="hc-header-inner">
        <Link to="/browse" className="hc-wordmark" aria-label="Netflix home">
          <img className="hc-logo" src="/newflix.png" alt="Netflix" />
        </Link>
        {/* Below 700px the reference swaps the wordmark for the narrow stacked
            "N" mark and moves "Help Center" onto a second row. Both live here
            and are switched by CSS, so the desktop markup is untouched. */}
        <span className="hc-nmark" aria-hidden="true">
          <svg viewBox="225 0 552 1000" focusable="false" role="presentation">
            <defs>
              <radialGradient id="hc-nmark-shade" r="75%" gradientTransform="matrix(.38 0 .5785 1 .02 0)">
                <stop offset="60%" stopOpacity=".3" />
                <stop offset="90%" stopOpacity=".05" />
                <stop offset="100%" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M225 0v1000c60-8 138-14 198-17V0H225" fill="#b1060e" />
            <path d="M579 0v983c71 3 131 9 198 17V0H579" fill="#b1060e" />
            <path d="M225 0v200l198 600V557l151 426c76 3 136 9 203 17V800L579 200v240L423 0H225" fill="url(#hc-nmark-shade)" />
            <path d="M225 0l349 983c76 3 136 9 203 17L423 0H225" fill="#e50914" />
          </svg>
        </span>
        <span className="hc-header-divider" aria-hidden="true">|</span>
        <Link to="/p/help-center" className="hc-header-title">Help Center</Link>
        <div className="hc-header-actions">
          <Link to="/signup" className="hc-join">Join Netflix</Link>
          <Link to="/login" className="hc-signin">Sign In</Link>
        </div>
      </div>
    </header>
  );
}

// The landing page's footer. The reference closes help.netflix.com/en with
// .global-page-footer.light-theme, which is a near-white band (#fafafa) with a
// WHITE contact bar stacked on top of it — the bar runs "Need more help?" over
// a full-width red "Contact Us" button rather than sitting them side by side
// the way the article footers do. The language box and the four links are the
// same controls the dark footer uses, so they are imported rather than redrawn.
export function HelpCenterHomeFooter() {
  return (
    <footer className="hc-home-footer">
      <div className="hc-home-contactbar">
        <div className="hc-home-contactbar-inner">
          <h3 className="hc-contactbar-title">Need more help?</h3>
          <Link to="/p/contact" className="hc-contactbar-btn">Contact Us</Link>
        </div>
      </div>
      <div className="hc-home-footer-inner">
        <HelpCenterLanguageSelect />
        <ul className="hc-home-footer-links">
          {LEGAL_FOOTER_LINKS.map((l) => (
            <li key={l.label}>{footerEntry(l.label, l.to)}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

// The same four links the dark footer closes on: Terms of Use, Privacy, Cookie
// Preferences (which opens the Privacy Preference Center dialog rather than a
// page, exactly as it does on the reference) and Corporate Information.
const LEGAL_FOOTER_LINKS = [
  { label: 'Terms of Use', to: '/p/terms' },
  { label: 'Privacy', to: '/p/privacy' },
  { label: 'Cookie Preferences', to: COOKIE_PREFERENCES_PATH },
  { label: 'Corporate Information', to: '/p/corporate-information' },
];

// This is the footer with NO "Need more help?" contact bar. The reference uses
// it on the legal pages and on the Contact Us page, and the one with the contact
// bar (components/Footer.jsx) on the article pages - including the title request
// form, whose footer does carry the bar.
export function LegalFooter() {
  return (
    <footer className="hc-legal-footer">
      <div className="hc-legal-footer-inner">
        <HelpCenterLanguageSelect />
        <ul className="hc-legal-footer-links">
          {LEGAL_FOOTER_LINKS.map((l) => (
            <li key={l.label}>{footerEntry(l.label, l.to)}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export { HelpCenterFooter } from './Footer';
export default Footer;
