import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import useBranding from '../hooks/useBranding';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, getLanguage, setLanguage } from '../utils/footerLinks';
import { useSiteTranslation } from '../utils/siteTranslation';
import { footerEntry } from '../components/CookiePreferencesLink';
import { matchPercent } from '../utils/matchPercent';
import { TmdbArtworkLogo } from '../components/Row';

const FAQS = [
  ['What is Newflix?', 'Newflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices.\n\nYou can watch as much as you want, whenever you want without a single commercial – all for one low monthly price. There\'s always something new to discover and new TV shows and movies are added every week!'],
  ['How much does Newflix cost?', 'Watch Newflix on your smartphone, tablet, smart TV, laptop or streaming device, all for one fixed monthly fee.\n\nPlans range from Rs 250 to Rs 1,100 a month. No extra costs, no contracts.'],
  ['Where can I watch?', 'Watch anywhere, anytime. Sign in with your Newflix account to watch instantly on the web from your personal computer or on any internet-connected device that offers the Newflix app, including smart TVs, smartphones, tablets, streaming media players and game consoles.\n\nYou can also download your favorite shows with the iOS or Android app. Use downloads to watch while you\'re on the go and without an internet connection. Take Newflix with you anywhere.'],
  ['How do I cancel?', 'Newflix is flexible. There are no annoying contracts and no commitments.\n\nYou can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account at any time.'],
  ['What can I watch on Newflix?', 'Newflix has an extensive library of feature films, documentaries, TV programmes, anime, award-winning Newflix originals and more.\n\nWatch as much as you want, any time you want.'],
  ['Is Newflix good for kids?', 'The Newflix Kids experience is included in your membership to give parents control whilst kids enjoy family-friendly TV programmes and films in their own space.\n\nKids profiles come with PIN-protected parental controls that let you restrict the maturity rating of content kids can watch and block specific titles you don\'t want kids to see.'],
];

const REASONS = [
  {
    title: 'Enjoy on your TV',
    body: 'Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.',
    icon: '/Picture1.png',
  },
  {
    title: 'Download your shows to watch offline',
    body: 'Save your favorites easily and always have something to watch.',
    icon: '/Picture2.png',
  },
  {
    title: 'Watch everywhere',
    body: 'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.',
    icon: '/Picture3.png',
  },
  {
    title: 'Create profiles for kids',
    body: 'Send kids on adventures with their favorite characters in a space made just for them — free with your membership.',
    icon: '/Picture4.png',
  },
];

// netflix.com/pk footer links in the reference's own DOM order: the real page
// fills its 4-column grid row-major, so this order also reproduces the
// reference's one-per-row stack on phones (measured at 599 and 1920: 15 links,
// none of them "Sign In").
const FOOTER_LINKS = [
  ['FAQ', '/p/faq'], ['Help Center', '/p/help-center'], ['Account', '/account'], ['Media Center', '/p/media-center'],
  ['Investor Relations', '/p/investor-relations'], ['Jobs', '/p/jobs'], ['Ways to Watch', '/p/ways-to-watch'], ['Terms of Use', '/p/terms'],
  ['Privacy', '/p/privacy'], ['Cookie Preferences', '/p/cookie-preferences'], ['Corporate Information', '/p/corporate-information'], ['Contact Us', '/p/contact'],
  ['Speed Test', '/p/speed-test'], ['Legal Notices', '/p/legal-notices'], ['Only on Netflix', '/p/only-on-netflix'],
];

const chevron = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Hero / FAQ email capture — the border turns green the moment the address is
// valid; an invalid submit shows Netflix's orange error state with a message.
//
// "Get Started" hands the address to Netflix's own sign-up step, exactly like
// netflix.com: the next page is "Finish setting up your account", where "Send
// Link" mails the real "Let's create your account" message over Gmail SMTP to
// that inbox. Nothing here opens gmail.com or an in-app mailbox by itself.
function EmailCaptureForm() {
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const value = email.trim();
  const valid = EMAIL_RE.test(value);
  const showError = attempted && !valid;
  const nav = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!valid) return;
    nav(`/signup?email=${encodeURIComponent(value.toLowerCase())}`);
  };
  return (
    <div className="nx-email-wrap">
      <form className="nx-email-form" onSubmit={submit} noValidate>
        <p className="nx-hero-cta">Ready to watch? Enter your email to create or restart your membership.</p>
        <div className="nx-email-row">
          <div className={`nx-email-field${value || showError ? ' has-value' : ''}`}>
          <input
            id="landing-email"
            type="email"
            placeholder=" "
            value={email}
            maxLength={254}
            autoComplete="email"
            spellCheck="false"
            className={valid ? 'is-valid' : showError ? 'is-error' : ''}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={showError || undefined}
            aria-describedby={showError ? 'nx-email-error' : undefined}
          />
          <label htmlFor="landing-email">Email address</label>
        </div>
        <button className="nx-btn-getstarted" type="submit">
          Get Started{chevron}
        </button>
        </div>
      </form>
      {showError && (
        <p className="nx-email-error" id="nx-email-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#e50914" strokeWidth="2" /><path d="m8.5 8.5 7 7m0-7-7 7" stroke="#e50914" strokeWidth="2" strokeLinecap="round" /></svg>
          {value ? 'Please enter a valid email address.' : 'Email is required.'}
        </p>
      )}
    </div>
  );
}

export default function Landing({ resume = false }) {
  const t = useSiteTranslation();
  const [language, setCurrentLanguage] = useState(getLanguage);
  const [openFaq, setOpenFaq] = useState(-1);
  const [trend, setTrend] = useState([]);
  const [posters, setPosters] = useState([]);
  const [trendModal, setTrendModal] = useState(null);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const trendRef = useRef(null);
  const lastScrollY = useRef(0);
  const branding = useBranding();
  const nav = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const updateVisibility = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastScrollY.current;
      if (currentY < 180) setShowMobileCta(false);
      else if (delta > 5) setShowMobileCta(true);
      else if (delta < -5) setShowMobileCta(false);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  useEffect(() => {
    if (!trendModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [trendModal]);

  const signOut = async () => {
    await logout().catch(() => {});
    nav('/logout', { replace: true });
  };

  useEffect(() => {
    // Real movies for the hero collage + Trending row — straight from TMDB
    // (same cached feed the browse pages use), local titles as fallback.
    let alive = true;
    API.get('/tmdb/home')
      .then(({ data }) => {
        if (!alive) return;
        const items = (data.rows || [])
          .flatMap((r) => (r.items || []).concat(r.top10 || []))
          .filter((t) => t.posterUrl || t.bannerUrl);
        setTrend(items);
      })
      .catch(() => {});
    API.get('/titles?limit=24&sort=views')
      .then(({ data }) => {
        if (!alive) return;
        setPosters((data.items || []).filter((t) => t.posterUrl || t.bannerUrl));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const pool = trend.length ? trend : posters;

  const scrollTrend = (direction) => {
    trendRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };
  return (
    <div className="nx-landing">
      <header className={`nx-hero${resume ? ' nx-resume-hero' : ''}`}>
        {/* netflix.com's Underglow (.1i8lfih > .10ll711 + .bg95xu): the red edge
            glow painted BEHIND the billboard — only ever visible in the side
            gutters above 120rem, exactly like the source. See .nx-underglow-clip. */}
        <div className="nx-underglow-clip" aria-hidden="true">
          <div className="nx-underglow-glow" />
          <div className="nx-underglow-band" />
        </div>
        <div className="nx-hero-box">
          <div className="nx-hero-bg" aria-hidden="true">
            <div className="nx-collage-fallback" />
            <div className="nx-hero-shade" />
          </div>

          <nav className="nx-hero-nav">
            <Link to="/" className="nx-brand" aria-label={branding.siteName}>
              <img
                className="nx-logo"
                src="/newflix.png"
                alt={branding.siteName}
                width="150"
                height="40"
                style={{ width: 150, height: 40, maxWidth: 'none' }}
              />
            </Link>
            <div className="nx-hero-nav-actions">
              {resume ? <button className="nx-btn-signin" onClick={signOut}>Sign Out</button> : <Link to="/login"><button className="nx-btn-signin">Sign In</button></Link>}
            </div>
          </nav>

          <div className="nx-hero-copy-layer">
            <div className="nx-hero-copy">
              <div className="nx-hero-headline-group">
                <h1 className="nx-hero-title">{resume ? 'Watch it before someone spoils it' : 'Unlimited movies, TV shows, and more'}</h1>
                <p className="nx-hero-price">Starts at {resume ? 'PKR 250' : 'Rs 250'}. Cancel anytime.</p>
              </div>
              {resume ? (
                <button type="button" className="nx-btn-finish-cta" onClick={() => nav('/signup?resume=plan-intro')}>
                  Finish Sign-Up
                  {chevron}
                </button>
              ) : <div className="nx-hero-cta-group">
                <div className="nx-hero-cta-inner">
                  <EmailCaptureForm />
                </div>
              </div>}
            </div>
          </div>

          <div className="nx-curve-band">
            <div className="nx-curve-container">
              <div className="nx-curve" />
            </div>
            <div className="nx-curve-portal" />
          </div>
        </div>
      </header>

      {pool.length > 0 && (
        <section className="nx-trend-wrap">
          <div className="nx-trend-inner">
          <h2 className="nx-section-title">Trending Now</h2>
          <div className="nx-trend-row">
          <div className="nx-trend-shell">
            <button className="nx-trend-arrow nx-trend-arrow-left" type="button" aria-label="Show previous titles" onClick={() => scrollTrend(-1)}>{'‹'}</button>
            <div className="nx-trend" ref={trendRef}>
            {pool.slice(0, 10).map((t, i) => (
              <div className="nx-trend-item" key={t._id || i}>
                <button
                  type="button"
                  className="nx-trend-card"
                  aria-label={t.title}
                  onClick={(e) => { e.stopPropagation(); setTrendModal(t); }}
                >
                  <span className="nx-trend-art" style={{ backgroundImage: `url(${t.posterUrl || t.bannerUrl})` }} />
                  <span className="nx-trend-rank">
                    <span className="nx-visually-hidden">{i + 1}</span>
                    <span className="nx-trend-glyph" aria-hidden="true" data-content={i + 1}>{i + 1}</span>
                  </span>
                </button>
              </div>
            ))}
            </div>
            <button className="nx-trend-arrow nx-trend-arrow-right" type="button" aria-label="Show more titles" onClick={() => scrollTrend(1)}>{'›'}</button>
          </div>
          </div>
          </div>
        </section>
      )}

      {trendModal && createPortal(
        <div className="nx-trend-preview-layer is-modal" role="presentation" onClick={() => setTrendModal(null)}>
          <article className="nx-trend-preview" onClick={(e) => e.stopPropagation()}>
            <button className="nx-preview-close" type="button" aria-label="Close preview" onClick={() => setTrendModal(null)}>×</button>
            <div className="nx-trend-preview-art">
              <img src={trendModal.bannerUrl || trendModal.posterUrl} alt="" />
              <span className="nx-trend-preview-shade" aria-hidden="true" />
              <TmdbArtworkLogo
                key={trendModal._id}
                item={trendModal}
                variant="landing"
                showTitleFallback
              />
            </div>
            <div className="nx-trend-preview-body">
              <div className="nx-trend-preview-meta">
                {matchPercent(trendModal) > 0 && <span>{matchPercent(trendModal)}% match</span>}
                <b>{trendModal.releaseDate?.slice(0, 4) || trendModal.year || '2026'}</b>
                <b>{trendModal.ageRating || '16+'}</b>
                <b>{trendModal.type === 'series' ? 'Series' : 'Movie'}</b>
              </div>
              <p>{trendModal.description || trendModal.overview || 'Discover your next favorite movie on Netflix.'}</p>
              <button className="nx-preview-start" type="button" onClick={() => nav('/login')}>Get Started{chevron}</button>
            </div>
          </article>
        </div>,
        document.body,
      )}

      <section className="nx-reasons-wrap">
        <h2 className="nx-section-title">More Reasons to Join</h2>
        <div className="nx-reasons">
          {REASONS.map((r) => (
            <div className="nx-reason-card" key={r.title}>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
              <div className="nx-reason-icon"><img src={r.icon} alt="" /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="nx-faq-wrap">
        <h2 className="nx-section-title">Frequently Asked Questions</h2>
        <div className="nx-faq-list">
          {FAQS.map(([q, a], i) => (
            <div className={`nx-faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                {q}
                <svg className="nx-faq-plus" width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <div className={`nx-faq-body${openFaq === i ? ' is-open' : ''}`} aria-hidden={openFaq !== i}>
                <div className="nx-faq-body-inner">{a}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="nx-faq-cta">
          {resume ? (
            <button type="button" className="nx-btn-finish-cta nx-resume-bottom-cta" onClick={() => nav('/signup?resume=plan-intro')}>
              Finish Sign-Up
              {chevron}
            </button>
          ) : <EmailCaptureForm />}
        </div>
      </section>

      <footer className="nx-footer">
        <div className="nx-footer-inner">
          <p className="nx-footer-contact">{t('Questions?')} <Link to="/p/contact">{t('Contact us.')}</Link></p>
          <div className="nx-footer-grid">
            <ul>
              {FOOTER_LINKS.map(([label, to]) => (
                <li key={label}>{footerEntry(t(label), to)}</li>
              ))}
            </ul>
          </div>
          <div className="nx-footer-language">
            <span className="nx-language-icon" aria-hidden="true">文A</span>
            <select className="lang-select nx-footer-lang" value={language} aria-label={t('Select Language')} onChange={(event) => {
              setCurrentLanguage(event.target.value);
              setLanguage(event.target.value);
            }}>
              {LANGUAGES.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
          </div>
          <p className="nx-footer-country">Newflix Pakistan</p>
          <p className="nx-footer-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
        </div>
      </footer>
    </div>
  );
}

