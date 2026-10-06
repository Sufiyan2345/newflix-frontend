import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useBranding from '../hooks/useBranding';
import { IconLanguages, IconChevronDown } from './Icons';
import {
  LANGUAGES, getLanguage, setLanguage, applyLanguageToDocument,
} from '../utils/footerLinks';
import { useSiteTranslation } from '../utils/siteTranslation';
import { footerEntry } from './CookiePreferencesLink';

// The member-site footer uses its own brand and link groups. Help Center and
// Media Center footers are separate components with their own reference layouts.

// The language picker. The real site keeps the chosen language across pages;
// this does the same via localStorage, and sets document.documentElement.lang
// so screen readers and the browser pick up the right locale.
export function LanguagePicker() {
  const t = useSiteTranslation();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(getLanguage);
  const wrapRef = useRef(null);

  useEffect(() => {
    // Re-read when the choice changes from anywhere on the page.
    const onChange = (e) => setLang(e.detail);
    window.addEventListener('sf-language-changed', onChange);
    // Apply the stored choice on mount so a returning visitor keeps it.
    applyLanguageToDocument(getLanguage());
    return () => window.removeEventListener('sf-language-changed', onChange);
  }, []);

  // Click-away + Escape close the list, matching the real dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (label) => { setLanguage(label); setOpen(false); };

  return (
    <div className="footer-lang" ref={wrapRef}>
      <button
        type="button"
        className="footer-lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconLanguages size={20} />
        <span>{lang}</span>
        <IconChevronDown size={20} className={open ? 'flip' : ''} />
      </button>
      {open && (
        <ul className="footer-lang-list" role="listbox" aria-label={t('Select Language')}>
          {LANGUAGES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === lang}
                className={l === lang ? 'on' : ''}
                onClick={() => choose(l)}
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const HELP_CENTER_FOOTER_LINKS = [
  ['Terms of Use', '/p/terms'],
  ['Privacy', '/p/privacy'],
  ['Cookie Preferences', '/p/cookie-preferences'],
  ['Corporate Information', '/p/corporate-information'],
];

const FOOTER_GROUPS = [
  {
    title: 'Menu',
    links: [
      ['Home', '/browse'],
      ['TV Shows', '/browse/series'],
      ['Movies', '/browse/movies'],
      ['My List', '/my-list'],
    ],
  },
  {
    title: 'Navigation',
    links: [
      ['New & Popular', '/browse/new'],
      ['Browse by Languages', '/browse/tmdb-languages'],
      ['FAQ', '/p/faq'],
      ['Help Center', '/p/help-center'],
    ],
  },
  {
    title: 'Info',
    links: [
      ['Account', '/account'],
      ['Media Center', '/p/media-center'],
      ['Terms of Use', '/p/terms'],
      ['Privacy', '/p/privacy'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['Cookie Preferences', '/p/cookie-preferences'],
      ['Contact Us', '/p/contact'],
      ['Ways to Watch', '/p/ways-to-watch'],
      ['Legal Notices', '/p/legal-notices'],
    ],
  },
];

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', fallback: 'https://www.facebook.com/sharer/sharer.php', icon: 'facebook' },
  { key: 'instagram', label: 'Instagram', fallback: 'https://www.instagram.com/', icon: 'instagram' },
  { key: 'twitter', label: 'X', fallback: 'https://twitter.com/intent/tweet', icon: 'x' },
];

const getSocialUrl = (value, fallback) => {
  if (!value) return fallback;
  try {
    const url = new URL(value.startsWith('www.') ? `https://${value}` : value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
};

function SocialIcon({ name }) {
  if (name === 'facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8h3.4Z" /></svg>;
  if (name === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="sf-social-dot" cx="17.6" cy="6.8" r="1" /></svg>;
  if (name === 'x') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3h2.9l-6.4 7.3L23 21h-6.1l-4.8-6.3L6.6 21H3.7l6.8-7.8L3 3h6.2l4.3 5.8L18.9 3Zm-1 16h1.6L8.2 4.9H6.5L17.9 19Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
}

function StoreBadge({ store }) {
  const isApple = store === 'apple';
  const href = isApple
    ? 'https://apps.apple.com/search?term=Newflix'
    : 'https://play.google.com/store/search?q=Newflix&c=apps';
  return (
    <a className="sf-store-badge" href={href} target="_blank" rel="noreferrer"
      aria-label={`Search ${isApple ? 'the App Store' : 'Google Play'} for Newflix`}>
      {isApple
        ? <svg className="sf-store-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.8c0-2.2 1.8-3.2 1.9-3.3a4.1 4.1 0 0 0-3.2-1.7c-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8a4.5 4.5 0 0 0-3.8 2.3c-1.6 2.8-.4 7 1.1 9.2.7 1.1 1.5 2.3 2.6 2.2 1-.1 1.4-.7 2.7-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.2a10 10 0 0 0 1.2-2.5 3.8 3.8 0 0 1-1.5-3.1ZM14.2 6.4a4 4 0 0 0 .9-2.9 4.1 4.1 0 0 0-2.7 1.4 3.8 3.8 0 0 0-.9 2.8 3.4 3.4 0 0 0 2.7-1.3Z" /></svg>
        : <img className="sf-store-icon sf-google-play-icon" src="/playstore.png" alt="" />}
      <span className="sf-store-copy"><small>GET IT ON</small><strong>{isApple ? 'App Store' : 'Google Play'}</strong></span>
    </a>
  );
}

// The language box at the foot of every Help Center page, measured off
// .global-page-footer: a 247x48 wrapper outlined in 1px #656565 with a 2px
// radius, holding a transparent <select> and the sheet's own filled triangle at
// right:12px top:10px. It is shared with the legal footer so the two can never
// drift apart - the clone's netflix.com footer keeps its own globe control.
export function HelpCenterLanguageSelect() {
  const [lang, setLang] = useState(getLanguage);

  useEffect(() => {
    // Re-read when the choice changes from anywhere on the page.
    const onChange = (e) => setLang(e.detail);
    window.addEventListener('sf-language-changed', onChange);
    // Apply the stored choice on mount so a returning visitor keeps it.
    applyLanguageToDocument(getLanguage());
    return () => window.removeEventListener('sf-language-changed', onChange);
  }, []);

  const handleChange = (value) => {
    setLang(value);
    setLanguage(value);
  };

  return (
    <div className="hc-lang-select">
      <label className="sr-only" htmlFor="hc-lang">Select your preferred language</label>
      <select id="hc-lang" value={lang} onChange={(event) => handleChange(event.target.value)}>
        {/* The live switcher leads with a disabled placeholder, then the 34
            languages in the order the reference lists them. */}
        <option value="" disabled>Select a language</option>
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      {/* The live footer's own triangle glyph, not a stroked chevron: it is a
          filled path flipped on the Y axis and offset into the 24x24 box. */}
      <svg className="hc-lang-caret" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12.9416531,7.71264972 L17.9520258,15.2282087 C18.4421897,15.9634546 18.2435115,16.9568456 17.5082656,17.4470095 C17.2454376,17.6222282 16.9366253,17.715729 16.6207453,17.715729 L6.6,17.715729 C5.7163444,17.715729 5,16.9993846 5,16.115729 C5,15.799849 5.09350084,15.4910367 5.26871953,15.2282087 L10.2790922,7.71264972 C10.7692561,6.97740382 11.7626471,6.77872563 12.497893,7.26888957 C12.6736566,7.38606534 12.8244774,7.53688606 12.9416531,7.71264972 Z"
          transform="translate(11.610458, 12.357865) scale(1, -1) translate(-11.610458, -12.357865)"
        />
      </svg>
    </div>
  );
}

// The Help Center footer, which closes every article page. The live page runs
// .global-page-footer -> .global-page-contactbar -> .select-wrapper ->
// ul.footer-links, and the three rows together are what make it 389px tall:
// 24/24 + 1px rule for the contact bar, 32 + 48 for the language box, and
// 40 + 4x(21 + 16) - 16 for the link list. The legal footer is the same markup
// minus the contact bar, so both reuse .hc-legal-footer.
export function HelpCenterFooter() {
  return (
    <footer className="hc-legal-footer">
      <div className="hc-legal-footer-inner">
        <div className="hc-contactbar">
          <h3 className="hc-contactbar-title">Need more help?</h3>
          <Link to="/p/contact" className="hc-contactbar-btn">Contact Us</Link>
        </div>
        <HelpCenterLanguageSelect />
        <ul className="hc-legal-footer-links">
          {HELP_CENTER_FOOTER_LINKS.map(([label, to]) => (
            <li key={label}>{footerEntry(label, to)}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export default function Footer() {
  const t = useSiteTranslation();
  const branding = useBranding();
  const year = new Date().getFullYear();
  const siteUrl = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <footer className="footer sf-user-footer">
      <div className="sf-footer-main">
        <div className="sf-footer-brand">
          <Link to="/browse" className="sf-footer-logo" aria-label={`${branding.siteName} home`}>
            <img src={branding.logoUrl || '/newflix.png'} alt={branding.siteName} />
          </Link>
          <p>Movies, series, and stories worth watching.</p>
          <div className="sf-footer-socials" aria-label="Social media">
            {SOCIALS.map((social) => {
              const configured = branding.socialLinks?.[social.key];
              const fallbackUrl = social.key === 'facebook'
                ? `${social.fallback}?u=${encodeURIComponent(siteUrl)}`
                : social.key === 'twitter'
                  ? `${social.fallback}?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(`Watch on ${branding.siteName}`)}`
                  : social.fallback;
              const href = getSocialUrl(configured, fallbackUrl);
              return (
                <a key={social.key} className="sf-footer-social" href={href}
                  target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>
                  <SocialIcon name={social.icon} />
                </a>
              );
            })}
          </div>
          <div className="sf-footer-language"><LanguagePicker /></div>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} className="sf-footer-group" aria-label={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, to]) => footerEntry(t(label), to, 'sf-footer-link'))}
          </nav>
        ))}
      </div>

      <div className="sf-footer-bottom">
        <div className="sf-footer-legal">
          <span>© {year} {branding.siteName}. All rights reserved. · {branding.siteName} Pakistan</span>
        </div>
        <div className="sf-footer-stores">
          <StoreBadge store="google" />
          <StoreBadge store="apple" />
        </div>
      </div>
      <p className="sf-footer-disclaimer">
        This is a personal project and is not affiliated with Netflix, Inc. All artwork and titles belong to their respective owners.
      </p>
    </footer>
  );
}
