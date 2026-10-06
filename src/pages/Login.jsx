import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import useBranding from '../hooks/useBranding';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import AuthFooter from '../components/AuthFooter';
import FieldError from '../components/FieldError';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryOptions = getCountries().map((country) => ({
  country,
  name: countryNames.of(country) || country,
  code: `+${getCountryCallingCode(country)}`,
})).sort((a, b) => a.name.localeCompare(b.name));
const flagFor = (country) => String.fromCodePoint(...country.split('').map((char) => 127397 + char.charCodeAt(0)));

function ContinueButton({ busy, disabled = false }) {
  return (
    <button className="nx-btn-continue" disabled={busy || disabled} aria-busy={busy}>
      {busy && <span className="nx-btn-spinner" aria-hidden="true" />}
      <span>Continue</span>
    </button>
  );
}

export default function Login() {
  const [params] = useSearchParams();
  const [step, setStep] = useState('email'); // 'email' | 'password' | 'phone-otp'
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [country, setCountry] = useState('PK');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [helpOpen, setHelpOpen] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  const { login, loadMe } = useAuth();
  const branding = useBranding();
  const nav = useNavigate();

  const phoneValue = () => {
    const raw = email.trim();
    const withCallingCode = raw.startsWith('+') ? raw : `${getCountryCallingCode(country)}${raw.replace(/\D/g, '')}`;
    const parsed = parsePhoneNumberFromString(withCallingCode.startsWith('+') ? withCallingCode : `+${withCallingCode}`);
    return parsed?.isValid() ? parsed.number : null;
  };
  const isPhone = (value) => Boolean(parsePhoneNumberFromString(value.trim(), country)?.isValid() || phoneValue());
  const logo = '/newflix.png';

  // Step 1 → validate identity before asking for the password (Netflix flow)
  const checkEmail = async (e) => {
    e.preventDefault();
    setError(''); setFieldError({});
    if (!email.trim()) {
      setFieldError({ email: 'Email or mobile number is required' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) && !isPhone(email)) {
      setError('Please enter a valid email address or mobile number.');
      return;
    }
    if (isPhone(email)) {
      setBusy(true);
      try {
        await API.post('/auth/send-phone-otp', { phone: phoneValue() });
        setStep('phone-otp');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to send the mobile verification code.');
      } finally { setBusy(false); }
      return;
    }
    setStep('password');
  };

  const verifyPhone = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setFieldError({ otp: 'Code is required' });
      return;
    }
    setFieldError({}); setBusy(true);
    try {
      const { data } = await API.post('/auth/verify-phone-otp', { phone: phoneValue(), otp });
      login(data.accessToken, data.user);
      await loadMe();
      nav('/profiles');
    } catch (err) {
      setError(err.response?.data?.message
        || 'Invalid or expired verification code.');
    } finally { setBusy(false); }
  };

  // Step 2 → real login against POST /api/auth/login
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setFieldError({ password: 'Password is required' });
      return;
    }
    setFieldError({}); setBusy(true);
    try {
      const { data } = await API.post('/auth/login', { email: email.trim(), password });
      login(data.accessToken, data.user);
      await loadMe();
      nav('/profiles');
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect email or password. Please try again.';
      setError(msg);
      if (err.response?.status !== 401 && err.response?.status !== 423) setStep('email');
    } finally { setBusy(false); }
  };

  const helpBlock = (
    <>
      <div className="nx-login-help">
        <button className="nx-help-toggle" onClick={() => setHelpOpen(!helpOpen)} aria-expanded={helpOpen}>
          Get Help
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: helpOpen ? 'none' : 'rotate(180deg)', transition: 'transform .2s' }}><path d="M6 15l6-6 6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {helpOpen && (
          <div className="nx-help-links">
            <Link to="/login/help">Forgot email or mobile number?</Link>
            <Link to="/p/sign-in-help">Learn more about sign-in</Link>
          </div>
        )}
      </div>
      <p className="nx-captcha-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
    </>
  );

  return (
    <div className="nx-login">
      <div className="nx-login-background" aria-hidden="true">
        <div className="nx-login-background-image is-active" style={{ backgroundImage: "url('/download.jpg')" }} />
        <div className="nx-login-background-shade" />
      </div>
      <header className="nx-auth-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
      </header>

      <main className="nx-login-main">
        {error && (
          <div className="nx-auth-error" role="alert">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8"/><path d="M12 7.5v6M12 16.5v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            <span>{error}</span>
          </div>
        )}

        {step === 'email' ? (
          <>
            <h1>Enter your info to sign in</h1>
            <p className="nx-login-sub">Or <Link to="/signup">get started with a new account</Link>.</p>
            <form onSubmit={checkEmail} noValidate>
              <div className={`nx-infield ${fieldError.email ? 'nx-invalid' : ''}`}>
                <div className="nx-login-identity">
                  {/* Country picker only appears once the field looks like a phone
                      number — the default state matches netflix.com exactly. */}
                  {/^[+\d]/.test(email.trim()) && (
                    <select className="nx-phone-country" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
                      {countryOptions.map(({ country: code, name, code: callingCode }) => <option key={code} value={code}>{flagFor(code)} {name} ({callingCode})</option>)}
                    </select>
                  )}
                  <input type="text" placeholder="Email or mobile number" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError({}); }} autoComplete="username" autoFocus />
                </div>
              </div>
              <FieldError message={fieldError.email} />
              <ContinueButton busy={busy} />
            </form>
            {helpBlock}
          </>
        ) : step === 'phone-otp' ? (
          <>
            <h1>Enter the code we sent</h1>
            <p className="nx-login-sub">We sent an SMS with a 6-digit code to your mobile number. It expires in 10 minutes.</p>
            <form onSubmit={verifyPhone}>
              <div className={`nx-infield nx-infield-combo ${fieldError.otp ? 'nx-invalid' : ''}`}>
                <span className="nx-login-email" onClick={() => { setStep('email'); setOtp(''); }} title="Change mobile number">{email}</span>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldError({}); }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </div>
              <FieldError message={fieldError.otp} />
              <ContinueButton busy={busy} disabled={otp.length !== 6} />
            </form>
            {helpBlock}
          </>
        ) : (
          <>
            <h1>Enter your password</h1>
            <form onSubmit={submit}>
              <div className={`nx-infield nx-infield-combo ${fieldError.password ? 'nx-invalid' : ''}`}>
                <span className="nx-login-email" onClick={() => setStep('email')} title="Change email">{email}</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldError({}); }}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
                <button type="button" className="nx-show-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <FieldError message={fieldError.password} />
              <div className="nx-pass-row">
                <Link to="/login/help" className="nx-forgot-link">Forgot password?</Link>
                <label className="nx-remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
              </div>
              <ContinueButton busy={busy} />
            </form>
            {helpBlock}
          </>
        )}
      </main>
      <AuthFooter />
    </div>
  );
}
