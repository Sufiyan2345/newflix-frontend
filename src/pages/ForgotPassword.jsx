import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import useBranding from '../hooks/useBranding';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import AuthFooter from '../components/AuthFooter';
import FieldError from '../components/FieldError';

// All-countries picker (same source as the login page)
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryOptions = getCountries().map((country) => ({
  country,
  name: countryNames.of(country) || country,
  code: `+${getCountryCallingCode(country)}`,
})).sort((a, b) => a.name.localeCompare(b.name));
const flagFor = (country) => String.fromCodePoint(...country.split('').map((char) => 127397 + char.charCodeAt(0)));

// Netflix's "/login/help" — "Update password, email or phone"
// 1. Email/SMS radios → "Email Me" sends a real OTP via POST /auth/forgot-password
// 2. "Email Sent" confirmation screen (masked email, like Netflix)
// 3. Enter the emailed code + new password → POST /auth/reset-password
export default function ForgotPassword() {
  const [params] = useSearchParams();
  // Deep link from the "Reset Your Password" email button: /login/help?reset=<email>&code=<otp>
  const linkedEmail = params.get('reset') || '';
  const linkedCode = params.get('code') || '';
  const [step, setStep] = useState(linkedEmail && linkedCode ? 'reset' : 'choose'); // choose → sent → reset
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState(linkedEmail);
  const [otp, setOtp] = useState(linkedCode);
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  // SMS reset state
  const [phoneCountry, setPhoneCountry] = useState('PK');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const branding = useBranding();
  const nav = useNavigate();
  const logo = '/newflix.png';

  const maskEmail = (v) => {
    const [user, domain] = v.split('@');
    return `${user.slice(0, 2)}******@${domain}`;
  };

  // +923001234567 → +9230••••4567 (only the ends stay readable)
  const maskPhone = (v) => {
    const value = String(v || '');
    if (value.length < 8) return value;
    return `${value.slice(0, 5)}${'•'.repeat(value.length - 8)}${value.slice(-3)}`;
  };

  const emailMe = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setFieldError({ email: 'Email is required' });
      return;
    }
    setFieldError({}); setBusy(true);
    try {
      await API.post('/auth/forgot-password', { email: email.trim() });
      setStep('sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send the email. Please try again.');
    } finally { setBusy(false); }
  };

  // E.164 normalisation for the entered mobile number (any country)
  const fullPhone = (() => {
    const digits = phone.replace(/\D/g, '').replace(/^0/, '');
    if (!digits) return '';
    const candidate = `+${getCountryCallingCode(phoneCountry)}${digits}`;
    const parsed = parsePhoneNumberFromString(candidate);
    return parsed?.number || candidate;
  })();
  const phoneValid = Boolean(fullPhone && parsePhoneNumberFromString(fullPhone)?.isValid());

  // Shared by "Text Me" and the "Send a new code" link on the code screen
  const sendSmsCode = async () => {
    setFieldError({});
    if (!phoneValid) {
      setFieldError({ phone: 'Mobile number is required' });
      return;
    }
    setError(''); setBusy(true);
    try {
      await API.post('/auth/send-phone-reset-otp', { phone: fullPhone });
      setSmsCode('');
      setStep('sms-sent');
    } catch (err) {
      setError(err.response?.data?.message || 'SMS password reset is not available right now. Please use email.');
    } finally { setBusy(false); }
  };

  // "Text Me" — send the reset code through the configured SMS provider.
  const textMe = async (e) => {
    e.preventDefault();
    await sendSmsCode();
  };

  // Verify the SMS code and reset the password via the backend.
  const resetSms = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    if (!smsCode.trim()) errors.smsCode = 'Code is required';
    if (!newPassword) errors.newPassword = 'Password is required';
    if (Object.keys(errors).length) { setFieldError(errors); return; }
    setFieldError({}); setBusy(true);
    try {
      const { data } = await API.post('/auth/reset-password-sms', { phone: fullPhone, otp: smsCode, newPassword });
      const loginUrl = data?.email ? `/login?email=${encodeURIComponent(data.email)}` : '/login';
      nav(loginUrl, { state: { resetOk: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please check the code and try again.');
    } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    if (!otp.trim()) errors.otp = 'Code is required';
    if (!newPassword) errors.newPassword = 'Password is required';
    if (Object.keys(errors).length) { setFieldError(errors); return; }
    setFieldError({}); setBusy(true);
    try {
      await API.post('/auth/reset-password', { email: email.trim(), otp, newPassword });
      nav('/login', { state: { resetOk: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please check the code and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="nx-login nx-help-page">
      <header className="nx-auth-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
        <Link to="/login" className="nx-signin-red-btn">Sign In</Link>
      </header>

      <main className="nx-login-main nx-help-main">
        {step === 'choose' && (
          <div className="nx-help-card">
            <h1>Update password, email or phone</h1>
            {error && <div className="nx-auth-error nx-auth-error-inline" role="alert">{error}</div>}
            <p className="nx-help-sub">How would you like to reset your password?</p>
            <div className="nx-radio-row" onClick={() => setMethod('email')}>
              <input type="radio" id="m-email" name="method" checked={method === 'email'} onChange={() => setMethod('email')} />
              <label htmlFor="m-email">Email</label>
            </div>
            <div className="nx-radio-row" onClick={() => setMethod('sms')}>
              <input type="radio" id="m-sms" name="method" checked={method === 'sms'} onChange={() => setMethod('sms')} />
              <label htmlFor="m-sms">Text Message (SMS)</label>
            </div>
            {method === 'email' ? (
              <>
                <p className="nx-help-desc">We will send you an email with instructions on how to reset your password.</p>
                <form onSubmit={emailMe} noValidate>
                  <div className={`nx-infield nx-infield-white ${fieldError.email ? 'nx-invalid' : ''}`}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError({}); }} />
                  </div>
                  <FieldError message={fieldError.email} />
                  <button className="nx-btn-continue" disabled={busy}>{busy ? 'Sending…' : 'Email Me'}</button>
                </form>
              </>
            ) : (
              <>
                <p className="nx-help-desc">We will text you a verification code to reset your password. Message and data rates may apply.</p>
                <form onSubmit={textMe} noValidate>
                  <div className="nx-signup-phone-row">
                    <select
                      className="nx-phone-country nx-phone-country-light"
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      aria-label="Country"
                    >
                      {countryOptions.map(({ country: code, name, code: callingCode }) => (
                        <option key={code} value={code}>{flagFor(code)} {name} ({callingCode})</option>
                      ))}
                    </select>
                    <div className={`nx-infield nx-infield-white ${fieldError.phone ? 'nx-invalid' : ''}`}>
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setFieldError({}); }}
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>
                  <FieldError message={fieldError.phone} />
                  <button className="nx-btn-continue" disabled={busy || !phoneValid}>{busy ? 'Sending…' : 'Text Me'}</button>
                </form>
              </>
            )}
            <Link to="/login/help/find-account" className="nx-help-plain-link">I don't remember my email or phone.</Link>
          </div>
        )}

        {step === 'sent' && (
          <div className="nx-help-card nx-help-card-sent">
            <h1>Check your email</h1>
            <p className="nx-help-sub">We sent a 6-digit password reset code to the email below. It expires in 10 minutes.</p>

            <div className="nx-help-email-row">
              <span className="nx-help-identity">{maskEmail(email)}</span>
              <button type="button" className="nx-help-change" onClick={() => setStep('choose')}>Change</button>
            </div>

            <button type="button" className="nx-btn-continue" onClick={() => setStep('reset')}>Enter reset code</button>

            <p className="nx-help-prompt">
              Didn't get an email? Check your spam or <button type="button" className="nx-help-inline-link" onClick={emailMe}>resend it.</button>
            </p>

            <div className="nx-help-card-actions">
              <button type="button" className="nx-help-inline-toggle" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen}>Get Help <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: helpOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              {helpOpen && <p className="nx-help-inline-copy">Open the latest Newflix email and enter the 6-digit code on the "Enter reset code" screen, then choose a new password.</p>}
            </div>
          </div>
        )}
        {step === 'sms-sent' && (
          <div className="nx-help-card">
            <h1>Reset your password</h1>
            {error && <div className="nx-auth-error nx-auth-error-inline" role="alert">{error}</div>}
            <p className="nx-help-desc">
              Enter the 6-digit code we texted to <b>{maskPhone(fullPhone)}</b> and choose a new password.{' '}
              <button type="button" className="nx-help-inline-link" onClick={() => { setError(''); setStep('choose'); }}>Wrong number?</button>
            </p>
            <form onSubmit={resetSms} noValidate>
              <div className={`nx-infield nx-infield-white ${fieldError.smsCode ? 'nx-invalid' : ''}`}>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={smsCode}
                  onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldError({}); }}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </div>
              <FieldError message={fieldError.smsCode} />
              <div className={`nx-infield nx-infield-white ${fieldError.newPassword ? 'nx-invalid' : ''}`}>
                <input type={showPass ? 'text' : 'password'} placeholder="New password (min 8 characters)" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFieldError({}); }} minLength={8} />
                <button type="button" className="nx-show-pass" onClick={() => setShowPass(!showPass)}>{showPass ? 'Hide' : 'Show'}</button>
              </div>
              <FieldError message={fieldError.newPassword} />
              <button className="nx-btn-continue" disabled={busy || smsCode.length !== 6}>{busy ? 'Resetting…' : 'Reset Password'}</button>
            </form>
            <p className="nx-help-prompt">
              Didn't get a text? <button type="button" className="nx-help-inline-link" onClick={sendSmsCode} disabled={busy}>Send a new code.</button>
            </p>
          </div>
        )}



        {step === 'reset' && (
          <div className="nx-help-card">
            <h1>Reset your password</h1>
            {error && <div className="nx-auth-error nx-auth-error-inline" role="alert">{error}</div>}
            <p className="nx-help-desc">Enter the 6-digit code we emailed to <b>{maskEmail(email)}</b> and choose a new password. <button type="button" className="nx-help-inline-link" onClick={() => setStep('sent')}>Wrong email?</button></p>
            <form onSubmit={reset} noValidate>
              <div className={`nx-infield nx-infield-white ${fieldError.otp ? 'nx-invalid' : ''}`}>
                <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setFieldError({}); }} maxLength={6} inputMode="numeric" />
              </div>
              <FieldError message={fieldError.otp} />
              <div className={`nx-infield nx-infield-white ${fieldError.newPassword ? 'nx-invalid' : ''}`}>
                <input type={showPass ? 'text' : 'password'} placeholder="New password (min 8 characters)" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFieldError({}); }} minLength={8} />
                <button type="button" className="nx-show-pass" onClick={() => setShowPass(!showPass)}>{showPass ? 'Hide' : 'Show'}</button>
              </div>
              <FieldError message={fieldError.newPassword} />
              <button className="nx-btn-continue" disabled={busy}>{busy ? 'Resetting…' : 'Reset Password'}</button>
            </form>
          </div>
        )}

        <p className="nx-captcha-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
      </main>
      <AuthFooter />
    </div>
  );
}

