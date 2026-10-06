import { Link } from 'react-router-dom';
import { footerEntry } from './CookiePreferencesLink';
import { LanguagePicker } from './Footer';
import { useSiteTranslation } from '../utils/siteTranslation';

const AUTH_LINKS = [
  ['FAQ', '/p/faq'],
  ['Help Center', '/p/help-center'],
  ['Terms of Use', '/p/terms'],
  ['Privacy', '/p/privacy'],
  ['Cookie Preferences', '/p/cookie-preferences'],
  ['Corporate Information', '/p/corporate-information'],
];

export default function AuthFooter() {
  const t = useSiteTranslation();

  return (
    <footer className="nx-auth-footer">
      <div className="nx-auth-footer-inner">
        <p className="nx-auth-footer-contact">{t('Questions?')} <Link to="/p/contact">{t('Contact us.')}</Link></p>
        <div className="nx-auth-footer-language"><LanguagePicker /></div>
        <nav className="nx-auth-footer-links" aria-label="Footer links">
          {AUTH_LINKS.map(([label, to]) => footerEntry(t(label), to))}
        </nav>
      </div>
    </footer>
  );
}
