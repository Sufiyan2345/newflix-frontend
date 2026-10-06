import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { footerEntry } from '../components/CookiePreferencesLink';
import { LanguagePicker } from '../components/Footer';
import { useSiteTranslation } from '../utils/siteTranslation';

// All-countries picker for the recovery phone (same source as the login page)
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryOptions = getCountries().map((country) => ({
  country,
  name: countryNames.of(country) || country,
  code: `+${getCountryCallingCode(country)}`,
})).sort((a, b) => a.name.localeCompare(b.name));
const flagFor = (country) => String.fromCodePoint(...country.split('').map((char) => 127397 + char.charCodeAt(0)));

// ---------------------------------------------------------------------------
// Netflix-exact post-payment flow (matches the reference diagram):
//   0 lock-icon "Verify your card" → 1 bank authorise (timer) →
//   2 "Welcome to Netflix!" + recovery phone → 3 Step 1 of 6 devices →
//   4 Step 2 of 6 who's watching → 5 Step 3 of 6 add another? →
//   6 Step 4 of 6 profile details → 7 Step 5 of 6 languages →
//   8 Step 6 of 6 pick 3 titles → 9 loading → /browse
// ---------------------------------------------------------------------------

const DEVICES = [
  { id: 'TV', label: 'TV', desc: 'Smart or Internet-connected TVs', img: '/tv.png' },
  { id: 'Phone or Tablet', label: 'Phone or Tablet', desc: 'Download the Netflix app to enjoy', img: '/tablet.png' },
  { id: 'Computer', label: 'Computer', desc: 'Desktop or laptop', img: '/laptop.png' },
  { id: 'Game Console', label: 'Game Console', desc: 'Connected to the internet', img: '/game.png' },
  { id: 'Streaming Device', label: 'Streaming Device', desc: 'Connects your TV to the internet', img: '/usb.png' },
  { id: 'TV Set-top Box', label: 'TV Set-top Box', desc: 'From your cable TV provider', img: '' },
];
const LANGUAGES = [
  'Bahasa Melayu', 'Čeština', 'Dansk', 'Deutsch', 'Español', 'Español (España)', 'Filipino',
  'Français', 'Hrvatski', 'Indonesia', 'Italiano', 'Magyar', 'Nederlands', 'Urdu', 'Suomi', 'Svenska',
  'Tiếng Việt', 'Türkçe', 'Ελληνικά', 'Русский', 'Українська', 'العربية', 'हिन्दी', 'தமிழ்', 'తెలుగు',
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Self-describe'];

/* Custom device artwork (frontend/public/*.png). Falls back to the inline SVG
   for any device without an image file (e.g. TV Set-top Box). */
function DeviceIcon({ id, on }) {
  const d = DEVICES.find((x) => x.id === id);
  if (d?.img) {
    return <img className={`nx-ob2-device-img${on ? ' is-on' : ''}`} src={d.img} alt="" draggable="false" />;
  }
  const c = on ? '#e50914' : '#8c8c8c';
  const s = { stroke: c, strokeWidth: 1.7, fill: 'none' };
  switch (id) {
    case 'TV': return (<svg width="64" height="52" viewBox="0 0 64 52"><rect x="6" y="4" width="52" height="34" rx="3" {...s} /><path d="M32 38v8M20 48h24" {...s} /></svg>);
    case 'Phone or Tablet': return (<svg width="64" height="52" viewBox="0 0 64 52"><rect x="10" y="16" width="16" height="28" rx="3" {...s} /><rect x="32" y="6" width="22" height="38" rx="3" {...s} /></svg>);
    case 'Computer': return (<svg width="64" height="52" viewBox="0 0 64 52"><rect x="12" y="8" width="40" height="26" rx="2" {...s} /><path d="M6 42h52l-4-8H10l-4 8z" {...s} /></svg>);
    case 'Game Console': return (<svg width="64" height="52" viewBox="0 0 64 52"><path d="M22 16h20c8 0 13 8 13 17 0 6-4 10-9 10-4 0-6-3-9-6H27c-3 3-5 6-9 6-5 0-9-4-9-10 0-9 5-17 13-17z" {...s} /><circle cx="21" cy="30" r="4" {...s} /><circle cx="43" cy="30" r="4" {...s} /><path d="M30 28h4M32 26v4" {...s} /></svg>);
    case 'Streaming Device': return (<svg width="64" height="52" viewBox="0 0 64 52"><rect x="12" y="32" width="18" height="12" rx="2" {...s} /><rect x="38" y="12" width="12" height="32" rx="3" {...s} /><path d="M22 24c4-6 4-10 0-16M29 26c6-8 6-14 0-22" {...s} /></svg>);
    default: return (<svg width="64" height="52" viewBox="0 0 64 52"><rect x="10" y="6" width="44" height="28" rx="2" {...s} /><rect x="22" y="38" width="20" height="8" rx="2" {...s} /><circle cx="46" cy="28" r="2" {...s} /></svg>);
  }
}

function ButtonLabel({ loading, children }) {
  return loading ? <><span className="nx-btn-spinner" aria-hidden="true" /> <span>Loading...</span></> : children;
}

export default function Onboarding() {
  const t = useSiteTranslation();
  const { user, loadMe, logout } = useAuth();
  const branding = useBranding();
  const nav = useNavigate();
  const logo = '/newflix.png';
  const firstName = (user?.name || 'there').split(' ')[0];
  const email = user?.email || '';

  const [step, setStep] = useState(0); // 0..9, see map in header comment
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('PK'); // all-countries picker
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [devices, setDevices] = useState([]);
  const [mainProfile, setMainProfile] = useState(firstName === 'there' ? '' : firstName);
  const [extraProfiles, setExtraProfiles] = useState(['', '', '', '']);
  const [kidsProfiles, setKidsProfiles] = useState([false, false, false, false]);
  const [dob, setDob] = useState({ day: '', month: '', year: '' });
  const [gender, setGender] = useState('');
  const [languages, setLanguages] = useState(['English']);
  const [picks, setPicks] = useState([]);
  const [titles, setTitles] = useState([]);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [titlesError, setTitlesError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifyDone, setVerifyDone] = useState(false);

  // bank-authorisation countdown (screen 1)
  const [secs, setSecs] = useState(4 * 60 + 57);
  const verifiedRef = useRef(false);

  // Resume exactly where the member left (server value wins)
  useEffect(() => {
    if (!user) return;
    if (user.onboardingDone) {
      nav('/browse', { replace: true });
      return;
    }
    const saved = Number(user.onboardingStep) || 0;
    const map = { 0: 0, 1: 0, 2: 3, 3: 4, 4: 6, 5: 7, 6: 7, 7: 8 };
    setStep(Math.min(map[saved] ?? 0, 8));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // Load candidate posters for the "pick 3" screen. Local titles (fast, <1s) render
  // first so the wall is never blank; the big TMDB feed merges in right after.
  useEffect(() => {
    if ((step !== 8 && step !== 7) || titlesLoading) return;
    setTitlesLoading(true);
    setTitlesError('');
    const dedupe = (list) => {
      const seen = new Set();
      return list.filter((item) => {
        const key = item._id || item.id || item.title;
        if (!key || seen.has(String(key)) || !(item.posterUrl || item.bannerUrl)) return false;
        seen.add(String(key));
        return true;
      });
    };
    // 1) instant local posters
    API.get('/titles', { params: { limit: 30, sort: 'newest' }, timeout: 12000 })
      .then(({ data }) => {
        const local = (data?.items || []).filter((i) => i.posterUrl || i.bannerUrl);
        if (local.length) setTitles((prev) => (prev.length ? prev : local));
      })
      .catch(() => {});
    // 2) full TMDB catalogue — retry, then fall back to the browse endpoints
    const tmdbAttempt = (url) => API.get(url, { timeout: 60000 })
      .then(({ data }) => {
        if (url === '/tmdb/home') {
          return (data?.rows || []).flatMap((row) => [...(row.items || []), ...(row.top10 || [])]);
        }
        return [...(data?.top10 || []), ...(data?.rows?.flatMap((r) => r.items || []) || [])];
      });
    (async () => {
      let items = [];
      for (const url of ['/tmdb/home', '/tmdb/browse/movie', '/tmdb/browse/tv']) {
        if (items.length > 60) break;
        for (let attempt = 0; attempt < 2; attempt++) {
          try { items = [...items, ...(await tmdbAttempt(url))]; break; } catch { /* retry once */ }
        }
      }
      setTitles((prev) => {
        const merged = dedupe([...items, ...prev]).slice(0, 160);
        if (!merged.length) setTitlesError('Could not load titles. Please check your connection and try again.');
        return merged;
      });
      setTitlesLoading(false);
    })();
  }, [step, titlesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen 1 — countdown + auto-advance once the bank "authorises"
  useEffect(() => {
    if (step !== 1 || verifiedRef.current) return;
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    const done = setTimeout(() => {
      verifiedRef.current = true; setVerifyDone(true); clearInterval(t);
      setTimeout(() => go(2), 900);
    }, 7000);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const payTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const planPrice = user?.planPrice || 'Rs 1,100';

  const save = async (payload, next) => {
    setError(''); setBusy(true);
    try {
      await API.put('/user/onboarding', payload);
      await loadMe();
      if (next !== undefined) setStep(next);
      window.scrollTo(0, 0);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      return false;
    } finally { setBusy(false); }
  };

  const toggleArr = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const allProfiles = () => [mainProfile.trim(), ...extraProfiles.map((p) => p.trim())].filter(Boolean);
  const hasKids = kidsProfiles.some(Boolean);
  const go = (s) => { setError(''); setStep(s); window.scrollTo(0, 0); };

  // ---- recovery-phone SMS OTP (real, stored against the account) ----
  // Country picker supports every country; the number is normalised to E.164.
  const fullPhone = (() => {
    const digits = recoveryPhone.replace(/\D/g, '').replace(/^0/, '');
    if (!digits) return '';
    const candidate = `+${getCountryCallingCode(phoneCountry)}${digits}`;
    const parsed = parsePhoneNumberFromString(candidate);
    return parsed?.number || candidate;
  })();
  const phoneValid = Boolean(fullPhone && parsePhoneNumberFromString(fullPhone)?.isValid());

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async () => {
    setError(''); setBusy(true);
    try {
      await API.post('/user/phone/send-otp', { phone: fullPhone });
      setOtpSent(true);
      setResendIn(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the code. Please try again.');
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setError(''); setBusy(true);
    try {
      await API.post('/user/phone/verify-otp', { phone: fullPhone, otp });
      await save({ step: 1, recoveryPhone: fullPhone }, 3);
    } catch (err) {
      setError(err.response?.data?.message
        || 'Verification failed. Please try again.');
    } finally { setBusy(false); }
  };

  // finish: save picks, show the "Selecting..." loading screen, then browse
  const finish = async () => {
    const saved = await save({ step: 7, picks });
    if (!saved) return;
    setStep(9);
    setTimeout(() => nav('/browse', { replace: true }), 2800);
  };

  const headerLink = step <= 1 ? 'Sign Out' : 'Help';
  const handleSignOut = async () => { await logout(); nav('/logout', { replace: true }); };
  const handleHeaderLink = () => (step <= 1 ? handleSignOut() : nav('/p/help-center'));

  // Back navigation — go to the previous setup screen to fix a mistake
  const BACK_STEP = { 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };

  // Netflix-exact signup footer (FAQ / Help Center / Terms / Privacy / Cookie / Corporate)
  const FOOTER_LINKS = [
    ['FAQ', '/p/faq'], ['Help Center', '/p/help-center'], ['Terms of Use', '/p/terms'], ['Privacy', '/p/privacy'],
    ['Cookie Preferences', '/p/cookie-preferences'], ['Corporate Information', '/p/corporate-information'],
  ];
  const Footer = ({ plain }) => (
    <footer className="nx-ob2-footer">
      <p>{t('Questions?')} Call <a href="tel:08081965391">0808 196 5391</a></p>
      <div className="nx-ob2-footer-language"><LanguagePicker /></div>
      <div className="nx-ob2-footer-links">
        {FOOTER_LINKS.map(([label, to]) => footerEntry(t(label), to))}
      </div>
      <p className="nx-ob2-footer-brand">{branding.siteName} — Pakistan</p>
      <p className="nx-captcha-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
      {!plain && null}
    </footer>
  );

  // ---------------- screen 0 — lock-icon "Verify your card" ----------------
  if (step === 0) {
    return (
      <div className="nx-signup nx-ob2">
        <header className="nx-ob2-nav">
          <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
          <button type="button" className="nx-ob2-nav-link nx-ob2-nav-btn" onClick={handleHeaderLink}>{headerLink}</button>
        </header>
        <main className="nx-ob2-verify">
          <img className="nx-ob2-lock" src="/Lock.png" alt="Secure card verification" />
          <h1>Verify your card</h1>
          <p>Your card requires a separate verification from your bank which will ensure a secure transaction.</p>
          <button className="nx-ob2-verify-btn" onClick={() => go(1)}>Verify Card</button>
        </main>
        <footer className="nx-ob2-footer">
          <p>{t('Questions?')} Call <a href="tel:08081965391">0808 196 5391</a></p>
          <div className="nx-ob2-footer-language"><LanguagePicker /></div>
        </footer>
      </div>
    );
  }

  // ---------------- screen 1 — bank authorise (timer) ----------------
  if (step === 1) {
    return (
      <div className="nx-signup nx-ob2">
        <header className="nx-ob2-nav nx-ob2-nav-noborder">
          <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
          <button type="button" className="nx-ob2-nav-link nx-ob2-nav-btn" onClick={handleHeaderLink}>{headerLink}</button>
        </header>
        <main className="nx-ob2-bankwrap">
          <h1 className="nx-ob2-banktitle">Verify your card</h1>
          <p className="nx-ob2-trouble">Having trouble? <button type="button" onClick={() => { verifiedRef.current = true; go(2); }}>Verify later</button></p>
          <div className="nx-ob2-bankcard">
            <div className="nx-ob2-bankhead"><b>Your bank</b>
              <span className="nx-ob2-visa"><i>VISA</i><em>SECURE</em></span>
            </div>
            <button type="button" className={`nx-ob2-timer ${verifyDone ? 'ok' : ''}`} onClick={() => { verifiedRef.current = true; setVerifyDone(true); setTimeout(() => go(2), 600); }}>
              {verifyDone ? '✓' : mm}
            </button>
            <p className="nx-ob2-bankmsg">Check your bank app to authorise this payment</p>
            <div className="nx-ob2-notif">
              <div className="nx-ob2-notif-row"><b>Netflix</b><span>− {planPrice}</span></div>
              <div className="nx-ob2-notif-time">Today, {payTime}</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- screen 9 — "Selecting TV programmes and films just for you." ----------------
  // Netflix onramp loader: white page, logo + Help over a hairline rule, two rows of
  // boxart pinned to the top/bottom edges and a centred headline + spinner.
  if (step === 9) {
    const boxart = (list) => list.map((t) => (
      <span key={t._id || t.id || t.title} className="nx-ob2-strip-card">
        {(t.bannerUrl || t.posterUrl) ? <img src={t.bannerUrl || t.posterUrl} alt="" draggable="false" /> : null}
      </span>
    ));
    return (
      <div className="nx-signup nx-ob2 nx-ob2-onramp">
        <header className="nx-ob2-loadhead">
          <div className="nx-ob2-loadhead-in">
            <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
            <button type="button" className="nx-ob2-nav-link nx-ob2-nav-btn" onClick={handleHeaderLink}>{headerLink}</button>
          </div>
        </header>
        <main className="nx-ob2-loading">
          <div className="nx-ob2-strip nx-ob2-strip-top">{boxart(titles.slice(0, 20))}</div>
          <p>Selecting TV programmes and films just for you.</p>
          <span className="nx-ob2-loadspin" aria-hidden="true">
            <svg viewBox="0 0 50 50" focusable="false">
              <circle cx="25" cy="25" r="21" fill="none" stroke="#e50914" strokeWidth="4"
                strokeLinecap="round" strokeDasharray="47 300" />
            </svg>
          </span>
          <div className="nx-ob2-strip nx-ob2-strip-bottom">{boxart(titles.slice(20, 40))}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="nx-signup nx-ob2">
      <header className="nx-ob2-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
        <div className="nx-ob2-nav-right">
          {BACK_STEP[step] !== undefined && (
            <button type="button" className="nx-ob2-back" onClick={() => go(BACK_STEP[step])} aria-label="Go back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
          )}
          <button type="button" className="nx-ob2-nav-link nx-ob2-nav-btn" onClick={handleHeaderLink}>{headerLink}</button>
        </div>
      </header>

      {error && <div className="nx-auth-error nx-auth-error-inline" role="alert">{error}</div>}

      {/* ===== Welcome to Netflix! + password recovery phone (real SMS OTP) ===== */}
      {step === 2 && (
        <main className="nx-ob2-col">
          <h1>Welcome to Netflix!</h1>
          <p className="nx-ob2-p">You've started your membership, and we've emailed the details to {email}.</p>
          <p className="nx-ob2-p">Remember you can cancel online at any time in the Account section.</p>
          <div className="nx-ob2-recovery">
            <p className="nx-ob2-rec-title">Set up password recovery</p>
            <p>Your phone number will be used to help you access and recover your account. Message and data rates may apply.</p>
            {!otpSent ? (
              <div className="nx-ob2-phone">
                <select
                  className="nx-ob2-phone-cc-select"
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                  aria-label="Country"
                >
                  {countryOptions.map(({ country: code, code: callingCode }) => (
                    <option key={code} value={code}>{flagFor(code)} {callingCode}</option>
                  ))}
                </select>
                <div className="nx-ob2-phone-field">
                  <label>Mobile phone number</label>
                  <input type="tel" value={recoveryPhone} onChange={(e) => setRecoveryPhone(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="tel" placeholder="Mobile number" />
                </div>
              </div>
            ) : (
              <>
                <p className="nx-ob2-otp-sent">Code sent to {fullPhone}. Enter the 6 digits below.</p>
                <input
                  className="nx-ob2-otp-input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <button type="button" className="nx-ob2-resend" disabled={resendIn > 0} onClick={sendOtp}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </button>
              </>
            )}
          </div>
          {!otpSent ? (
            <button className="nx-ob2-next nx-ob2-next-wide" disabled={busy || !phoneValid} onClick={sendOtp}>
              <ButtonLabel loading={busy}>Send verification code</ButtonLabel>
            </button>
          ) : (
            <button className="nx-ob2-next nx-ob2-next-wide" disabled={busy || otp.length !== 6} onClick={verifyOtp}>
              <ButtonLabel loading={busy}>Verify &amp; Continue</ButtonLabel>
            </button>
          )}
        </main>
      )}

      {/* ===== Step 1 of 6 — devices ===== */}
      {step === 3 && (
        <main className="nx-ob2-split">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step 1 of 6</span>
            <h1>What devices will you be watching on?</h1>
            <p className="nx-ob2-p">You can watch Netflix on any of these devices. <b>Select all that apply.</b></p>
          </div>
          <div className="nx-ob2-right">
            <div className="nx-ob2-devices">
              {DEVICES.map((d) => (
                <button key={d.id} type="button" className={`nx-ob2-device ${devices.includes(d.id) ? 'on' : ''}`} onClick={() => toggleArr(devices, setDevices, d.id)}>
                  <span className="nx-ob2-device-check">✓</span>
                  <DeviceIcon id={d.id} on={devices.includes(d.id)} />
                  <b>{d.label}</b>
                  <span className="nx-ob2-device-desc">{d.desc}</span>
                </button>
              ))}
            </div>
            <button type="button" className="nx-ob2-something">Something Else<span>Enjoy Netflix with other internet-connected devices.</span></button>
            <div className="nx-ob2-actions"><button className="nx-ob2-next" disabled={busy || !devices.length} onClick={() => save({ step: 2, devices }, 4)}><ButtonLabel loading={busy}>Next</ButtonLabel></button></div>
          </div>
        </main>
      )}

      {/* ===== Step 2 of 6 — who will be watching ===== */}
      {step === 4 && (
        <main className="nx-ob2-split">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step {hasKids ? 3 : 2} of 6</span>
            <h1>{hasKids ? 'Will there be any kids watching?' : 'Who will be watching Netflix?'}</h1>
            <p className="nx-ob2-p">
              {hasKids
                ? 'Kids can have their own space to watch kid-friendly TV shows and movies with the comfort of parental controls.'
                : 'People living in your home can enjoy recommendations tailored to their tastes and language preferences. Great for children.'}
            </p>
          </div>
          <div className="nx-ob2-right">
            <label className="nx-ob2-grouplabel">Your profile</label>
            <div className="nx-ob2-namefield">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="#333" strokeWidth="1.6" /><path d="M5 20c1.4-3.6 4-5.4 7-5.4s5.6 1.8 7 5.4" stroke="#333" strokeWidth="1.6" strokeLinecap="round" /></svg>
              <div className="nx-ob2-float"><label>Name</label><input value={mainProfile} onChange={(e) => setMainProfile(e.target.value)} maxLength={40} /></div>
            </div>
            <label className="nx-ob2-grouplabel">Add profiles?</label>
            {extraProfiles.map((val, i) => (
              <div key={i} className="nx-ob2-namefield">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="8" r="3.2" stroke="#333" strokeWidth="1.6" /><path d="M4.5 19.5c1.3-3.3 3.7-5 6.5-5s5.2 1.7 6.5 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" /><path d="M19 5v4M17 7h4" stroke="#333" strokeWidth="1.6" strokeLinecap="round" /></svg>
                <div className="nx-ob2-float nx-ob2-float-kids"><label>Name</label><input value={val} onChange={(e) => setExtraProfiles(extraProfiles.map((p, j) => (j === i ? e.target.value : p)))} maxLength={40} />
                  <label className={`nx-ob2-kids-toggle${kidsProfiles[i] ? ' on' : ''}`}>
                    <span>kids</span>
                    <input type="checkbox" checked={kidsProfiles[i]} onChange={() => setKidsProfiles(kidsProfiles.map((selected, j) => (j === i ? !selected : selected)))} aria-label={`Mark ${val || 'profile'} as a kids profile`} />
                    <span className="nx-ob2-kids-box" aria-hidden="true">✓</span>
                  </label>
                </div>
              </div>
            ))}
            <div className="nx-ob2-note">Only people who live with you may use your account. <a href="/p/help-center">Learn more</a>.</div>
            <div className="nx-ob2-actions"><button className="nx-ob2-next" disabled={busy || !mainProfile.trim()} onClick={() => go(5)}><ButtonLabel loading={busy}>Next</ButtonLabel></button></div>
          </div>
        </main>
      )}

      {/* ===== Step 3 of 6 — add another profile? ===== */}
      {step === 5 && (
        <main className="nx-ob2-split">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step 3 of 6</span>
            <h1>Add another profile?</h1>
            <p className="nx-ob2-p">You've set up {allProfiles().length} {allProfiles().length === 1 ? 'profile' : 'profiles'}. You can add more now or any time later from your account.</p>
          </div>
          <div className="nx-ob2-right nx-ob2-right-center">
            <div className="nx-ob2-choices">
              <button type="button" className="nx-ob2-choice" onClick={() => go(4)}><b>Add another profile</b><span>Go back and add someone else</span></button>
              <button type="button" className="nx-ob2-choice" onClick={() => save({ step: 3, profiles: allProfiles() }, 6)}><b>No, continue</b><span>Save these profiles and keep going</span></button>
            </div>
          </div>
        </main>
      )}

      {/* ===== Step 4 of 6 — profile details (DOB + gender) ===== */}
      {step === 6 && (
        <main className="nx-ob2-split">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step 4 of 6</span>
            <h1>{firstName}, let's add details to your profile.</h1>
            <p className="nx-ob2-p">We just need some information for advert personalisation, maturity settings and other purposes consistent with Netflix's privacy statement.</p>
          </div>
          <div className="nx-ob2-right">
            <label className="nx-ob2-grouplabel">Date of birth</label>
            <div className="nx-ob2-select nx-ob2-floatsel"><label>Day</label>
              <select value={dob.day} onChange={(e) => setDob({ ...dob, day: e.target.value })}>
                <option value="" hidden></option>{[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select><span className="nx-ob2-caret">▾</span>
            </div>
            <div className="nx-ob2-select nx-ob2-floatsel"><label>Month</label>
              <select value={dob.month} onChange={(e) => setDob({ ...dob, month: e.target.value })}>
                <option value="" hidden></option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select><span className="nx-ob2-caret">▾</span>
            </div>
            <div className="nx-ob2-select nx-ob2-floatsel"><label>Year</label>
              <select value={dob.year} onChange={(e) => setDob({ ...dob, year: e.target.value })}>
                <option value="" hidden></option>{[...Array(80)].map((_, i) => <option key={i} value={2026 - i}>{2026 - i}</option>)}
              </select><span className="nx-ob2-caret">▾</span>
            </div>
            <label className="nx-ob2-grouplabel">Gender</label>
            <div className="nx-ob2-select nx-ob2-floatsel"><label>Select</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="" hidden></option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select><span className="nx-ob2-caret">▾</span>
            </div>
            <div className="nx-ob2-actions"><button className="nx-ob2-next" disabled={busy || !dob.day || !dob.month || !dob.year || !gender} onClick={() => save({ step: 4, dob, gender, maturity: 'All' }, 7)}><ButtonLabel loading={busy}>Next</ButtonLabel></button></div>
          </div>
        </main>
      )}

      {/* ===== Step 5 of 6 — languages ===== */}
      {step === 7 && (
        <main className="nx-ob2-split nx-ob2-split-tall">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step 5 of 6</span>
            <h1>Which languages do you like to watch programmes and films in?</h1>
            <p className="nx-ob2-p">Letting us know helps set up your audio and subtitles. <b>You can always change these.</b></p>
          </div>
          <div className="nx-ob2-right">
            <div className="nx-ob2-lang-main">✓ English</div>
            <div className="nx-ob2-langs">
              {LANGUAGES.map((l) => (
                <label key={l} className="nx-ob2-lang">
                  <input type="checkbox" checked={languages.includes(l)} onChange={() => toggleArr(languages, setLanguages, l)} />
                  <span className="nx-ob2-box" />{l}
                </label>
              ))}
            </div>
            <div className="nx-ob2-actions"><button className="nx-ob2-next" disabled={busy} onClick={() => save({ step: 6, languages }, 8)}><ButtonLabel loading={busy}>Next</ButtonLabel></button></div>
          </div>
        </main>
      )}

      {/* ===== Step 6 of 6 — pick 3 titles ===== */}
      {step === 8 && (
        <main className="nx-ob2-split nx-ob2-split-tall">
          <div className="nx-ob2-left">
            <span className="nx-ob2-stepnum">Step 6 of 6</span>
            <h1>{firstName}, select 3 you like.</h1>
            <p className="nx-ob2-p">This helps us to find TV programmes and films you'll love. <b>Select the ones you like.</b></p>
          </div>
          <div className="nx-ob2-right nx-ob2-picks-right">
            {titlesLoading && !titles.length && (
              <div className="nx-ob2-picks-status"><span className="nx-ob2-spinner" /><p>Loading titles for you…</p></div>
            )}
            {!titlesLoading && titlesError && !titles.length && (
              <div className="nx-ob2-picks-status">
                <p>{titlesError}</p>
                <button type="button" className="nx-ob2-verify-btn" onClick={() => { setTitles([]); setTitlesLoading(false); setTitlesError(''); }}>Try again</button>
              </div>
            )}
            {!titlesLoading && !titlesError && !titles.length && (
              <div className="nx-ob2-picks-status"><p>No titles available right now.</p></div>
            )}
            {titles.length > 0 && (
            <div className="nx-ob2-picks-wrap">
            <div className="nx-ob2-grid">
              {titles.map((t) => (
                <button key={t._id} type="button" className={`nx-ob2-title ${picks.includes(t._id) ? 'on' : ''}`} onClick={() => toggleArr(picks, setPicks, t._id)}>
                  <span className="nx-ob2-n">N</span>
                  {(t.posterUrl || t.bannerUrl) ? <img src={t.posterUrl || t.bannerUrl} alt={t.title} loading="lazy" /> : <span className="nx-ob2-title-fallback">{t.title}</span>}
                  {picks.includes(t._id) && <span className="nx-ob2-thumb"><svg viewBox="0 0 24 24" width="34" height="34" fill="#fff"><path d="M2 20h2.5c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1H2v10zm19.4-8.2c.37.4.6.94.6 1.55 0 .24-.04.48-.12.71l-2.14 6.15A2 2 0 0 1 17.84 22H9c-.55 0-1-.45-1-1v-9.13c0-.4.16-.78.45-1.06L14 4.5l.9.9c.23.23.36.55.35.88l-.01.12L14.5 10h5.75c.98 0 1.77.8 1.77 1.78l-.02.12z"/></svg></span>}
                </button>
              ))}
            </div>
            </div>
            )}
            <div className="nx-ob2-actions">
              <button className={`nx-ob2-next ${picks.length >= 3 ? 'ready' : ''}`} disabled={busy || picks.length < 3} onClick={finish}>
                {busy ? <ButtonLabel loading={busy}>Continue</ButtonLabel> : (picks.length >= 3 ? 'Continue' : `Pick ${3 - picks.length} to Continue`)}
              </button>
            </div>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
