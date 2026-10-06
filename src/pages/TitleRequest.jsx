import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCenterHeader, HelpCenterFooter } from '../components/HelpCenterChrome';

// The Help Center's title request form -
// help.netflix.com/en/titlerequest?ui_action=title-suggestion-quicklinks.
//
// The Contact Us page's "Request TV shows or movies" quick link lands here. It is
// a form, not a markdown article, so it is its own component; what it borrows
// from the article pages is the masthead, the "Back to Help Home" crumb and the
// "Need more help?" footer.
//
// Unlike the Contact Us page this one uses the WIDE 1248px container (the
// reference's .page-block), and its footer DOES carry the contact bar.

// The three boxes. Each label is a real <label for>, floating over the field and
// shrinking to 12px/18 at the top once the box is focused or filled, exactly as
// .form-group.edited / .form-group.focused do on the reference.
const TITLE_FIELDS = [
  { id: 'title-0', name: 'titles[0]', label: 'Title Suggestion 1:', required: true },
  { id: 'title-1', name: 'titles[1]', label: 'Title Suggestion 2:', required: false },
  { id: 'title-2', name: 'titles[2]', label: 'Title Suggestion 3:', required: false },
];

// Google's PUBLIC reCAPTCHA v2 test site key.
//
// The reference embeds Google's real third-party iframe, and no hand-drawn
// replica can be pixel-accurate: the 28px checkbox, the Roboto face, the green
// tick, the logo and the two-line fine print are all Google's own assets. This
// is the documented public test key - it renders the genuine widget on any
// domain including localhost, always verifies, and posts nowhere near Netflix.
// It is a key, not a secret, and it is published in Google's own reCAPTCHA
// documentation for exactly this purpose.
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

// The script is a module-level singleton promise, so a second visit to the page
// (or React 18 StrictMode's double-invoke in dev) reuses the first load instead
// of injecting a second <script> tag.
let recaptchaLoader = null;

function loadRecaptcha() {
  if (recaptchaLoader) return recaptchaLoader;
  recaptchaLoader = new Promise((resolve, reject) => {
    if (window.grecaptcha?.render) {
      resolve(window.grecaptcha);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => (window.grecaptcha
      ? resolve(window.grecaptcha)
      : reject(new Error('grecaptcha did not initialise')));
    script.onerror = () => reject(new Error('grecaptcha script blocked'));
    document.head.appendChild(script);
  });
  return recaptchaLoader;
}

// The real widget. It reports success exactly the way the reference's does - on
// verification, not on a click - and it hands back a token, which is what a
// real submission would post. If the script cannot be reached (offline, or a
// network that blocks Google) the local replica below stands in, so the form
// still works and still looks the part instead of leaving a hole in the page.
function RecaptchaCheck({ checked, onChange }) {
  const hostRef = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRecaptcha()
      .then((grecaptcha) => {
        if (cancelled || !hostRef.current) return;
        // Render into a FRESH child every time. reCAPTCHA refuses to render
        // twice into the same element, and StrictMode mounts effects twice.
        const mount = document.createElement('div');
        hostRef.current.replaceChildren(mount);
        grecaptcha.render(mount, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: 'light',
          size: 'normal',
          callback: (token) => onChange(Boolean(token)),
          'expired-callback': () => onChange(false),
          'error-callback': () => onChange(false),
        });
      })
      .catch(() => { if (!cancelled) setUnavailable(true); });
    return () => { cancelled = true; };
  }, []);

  if (unavailable) {
    return <LocalRecaptcha checked={checked} onChange={onChange} />;
  }

  return (
    // .g-recaptcha carries the reference's 40px of margin above and below, and
    // .ci-recaptcha-mount holds exactly the 304x78 the iframe occupies, so the
    // form's vertical rhythm is right whether or not Google's script arrives.
    <div className="g-recaptcha">
      <div className="ci-recaptcha-mount" ref={hostRef} />
    </div>
  );
}

// The offline fallback: the same 304x78 control drawn locally - checkbox,
// label, mark, wordmark and fine print. Only reached when the real widget
// cannot load.
function LocalRecaptcha({ checked, onChange }) {
  return (
    <div className="g-recaptcha">
      <div className="ci-recaptcha" role="group" aria-label="reCAPTCHA">
        <button
          type="button"
          className={`ci-recaptcha-box${checked ? ' is-checked' : ''}`}
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
        >
          {checked && (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24 12.313C24 6.387 19.203 1.5 13.333 1.5S2.667 6.387 2.667 12.313c0 5.293 4.077 9.587 9.333 9.587 1.858 0 3.592-.547 5.035-1.507L12.96 16.07A6.958 6.958 0 0113.333 16c-3.993 0-7.333-3.24-7.333-7.333 0-3.993 3.06-7.333 6.997-7.333 3.933 0 7.333 3.34 7.333 7.333 0 1.96-.8 3.733-2.093 5.027l4.573 4.573A11.86 11.86 0 0024 12.313zM10.687 16.2L7.573 13.08l-1.44 1.44 4.553 4.56L20.4 9.347l-1.44-1.44-8.273 8.293z"
                fill="#1a1a1a"
              />
            </svg>
          )}
        </button>
        <span className="ci-recaptcha-label">I&rsquo;m not a robot</span>
        <svg className="ci-recaptcha-mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
          <path d="M16 3.5c-6.9 0-12.5 5.6-12.5 12.5h4.2C7.7 10.3 11.4 6.6 16 6.6s8.3 3.7 8.3 8.3c0 2.5-1.1 4.8-2.8 6.3l3 3c2.5-2.2 4.3-5.5 4.3-9.3C28.5 9.1 22.9 3.5 16 3.5z" fill="#4d90fe" />
          <path d="M16 28.5c6.9 0 12.5-5.6 12.5-12.5h-4.2c0 5.7-3.7 9.4-8.3 9.4s-8.3-3.7-8.3-8.3c0-2.5 1.1-4.8 2.8-6.3l-3-3C5 9.6 3.5 12.9 3.5 16.7 3.5 22.9 9.1 28.5 16 28.5z" fill="#9aa0a6" />
        </svg>
        <span className="ci-recaptcha-wordmark">reCAPTCHA</span>
        <span className="ci-recaptcha-fine">
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
          and{' '}
          <a href="https://www.google.com/policies/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
        </span>
      </div>
    </div>
  );
}

export default function TitleRequest() {
  const [titles, setTitles] = useState(['', '', '']);
  const [focused, setFocused] = useState(-1);
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const [showCaptchaError, setShowCaptchaError] = useState(false);

  const setTitle = (i, v) => {
    setTitles((t) => t.map((x, n) => (n === i ? v : x)));
    setSent(false);
  };

  // The reference POSTs to Sprinklr and re-renders the page with a confirmation.
  // Nothing is submitted here, so the form confirms locally instead.
  //
  // The button is NOT disabled - on the reference it is live from the first
  // paint and the form reports what is missing when you press it, which is what
  // a dead greyed-out button gets read as: a page that does nothing. So the
  // gate is enforced here, and the native `required` on the first field plus
  // the message below the captcha cover what the real form flags.
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(false);
    setShowCaptchaError(!verified);
    if (verified) setSent(true);
  };

  return (
    <div className="static-page hc-page hc-form-page">
      <HelpCenterHeader />
      <main className="sp-shell hc-shell hc-title-shell">
        <div className="hc-toolbar">
          <nav className="sp-crumbs hc-crumbs" aria-label="Breadcrumb">
            {/* The reference draws a 16px inline SVG arrow, not the "←" character. */}
            <Link to="/p/help-center">
              <svg className="hc-crumb-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.81 8.74697H13.9966V7.24697H4.81095L7.52932 4.52961L6.46886 3.46875L2.46959 7.46654C2.32891 7.60716 2.24985 7.79791 2.24982 7.99683C2.24978 8.19574 2.32876 8.38652 2.46939 8.5272L6.46866 12.528L7.52952 11.4675L4.81 8.74697Z" fill="currentColor" />
              </svg>
              <span>Back to Help Home</span>
            </Link>
          </nav>
        </div>

        <section className="page-block">
          <h2 className="page-title">Request TV shows or movies</h2>

          <p>Have a TV show or movie you&rsquo;d like to see on Netflix? Let us know about it below.</p>
          <p>
            Wondering why a title is no longer available? Visit{' '}
            <Link to="/p/why-titles-leave-netflix">Why do TV shows and movies leave Netflix?</Link>
          </p>
          <p>
            For help finding a title, visit{' '}
            <Link to="/p/find-tv-shows-and-movies">How do I find TV shows and movies on Netflix?</Link>
          </p>

          <form id="title-suggestion-form" className="fancy inited" onSubmit={onSubmit}>
            {TITLE_FIELDS.map((f, i) => (
              // "edited" and "focused" are the reference's own class names and
              // they are what shrink the label to 12px at the top of the box.
              <div
                className={`form-group fancy inited${titles[i] ? ' edited' : ''}${focused === i ? ' focused' : ''}`}
                key={f.id}
              >
                <input
                  value={titles[i]}
                  id={f.id}
                  name={f.name}
                  className="form-control title-input"
                  maxLength={120}
                  type="text"
                  required={f.required}
                  autoComplete="off"
                  onChange={(e) => setTitle(i, e.target.value)}
                  onFocus={() => setFocused(i)}
                  onBlur={() => setFocused(-1)}
                />
                <label htmlFor={f.id}>{f.label}</label>
              </div>
            ))}

            <RecaptchaCheck checked={verified} onChange={setVerified} />

            <button type="submit" className="h-btn btn-primary btn-large">
              Submit Suggestion
            </button>
          </form>

          {/* Pressing submit with the captcha still unticked has to SAY so. The
              reference's own message appears here; without one the press is
              indistinguishable from a broken button. */}
          {showCaptchaError && !sent && (
            <p className="ci-captcha-error" role="alert">
              Please complete the reCAPTCHA verification above.
            </p>
          )}

          {sent && (
            <p className="ci-title-reply" role="status">
              Thanks for your suggestion &mdash; we&rsquo;ve passed it on to our content team.
            </p>
          )}

          <hr />

          <h3>What if I&rsquo;ve already requested a TV show or movie?</h3>
          <p></p>
          <p>If you&rsquo;ve already submitted a request, you can sit back and relax - we&rsquo;ve received your feedback.</p>
          <p>
            We can&rsquo;t respond to individual requests, but you can keep up on new titles coming to
            Netflix by <Link to="/p/only-on-netflix">following us</Link> on social media and{' '}
            <Link to="/p/help-center">signing up</Link> for our &quot;Now on Netflix&quot; emails.
          </p>
          <p></p>
        </section>
      </main>
      <HelpCenterFooter />
    </div>
  );
}

