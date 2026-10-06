import { Link } from 'react-router-dom';
import { COOKIE_PREFERENCES_PATH, openCookiePreferences } from '../utils/cookiePreferences';

// A footer link that raises the preference center instead of navigating.
//
// The reference never has a "/cookie-preferences" page — the label opens a
// dialog over the page you are already on. Keeping `to` set means the anchor is
// still a real href (middle-click, "open in new tab" and screen readers all
// behave), and only the plain left-click is intercepted.
export default function CookiePreferencesLink({ to = COOKIE_PREFERENCES_PATH, className, children }) {
  return (
    <Link to={to} className={className} onClick={openCookiePreferences}>
      {children}
    </Link>
  );
}

// Renders a footer entry, routing the cookie label to the dialog and everything
// else to a normal page. Footers pass their existing [label, to] rows through
// this so no footer has to special-case the modal itself.
export function footerEntry(label, to, className) {
  if (to === COOKIE_PREFERENCES_PATH) {
    return <CookiePreferencesLink key={label} className={className}>{label}</CookiePreferencesLink>;
  }
  return <Link key={label} to={to} className={className}>{label}</Link>;
}
