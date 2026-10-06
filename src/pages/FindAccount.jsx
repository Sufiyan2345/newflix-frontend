import { useState } from 'react';
import { Link } from 'react-router-dom';
import useBranding from '../hooks/useBranding';
import AuthFooter from '../components/AuthFooter';
import FieldError from '../components/FieldError';

// Netflix's "/login/help/find-account" — "Forgot email or mobile number"
// SRS scope: no payment records to search by card, so we locate the account by
// first + last name (case-insensitive) and then point the user at password reset.
// The card field is part of the reference layout (all fields required there) —
// it is validated in the UI only and never leaves the browser.
import { API } from '../api';

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

export default function FindAccount() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [error, setError] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const branding = useBranding();
  const logo = '/newflix.png';

  const find = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!first.trim()) errs.first = 'First name is required';
    if (!last.trim()) errs.last = 'Last name is required';
    if (!cardNo.trim()) errs.card = 'Last name is required';
    setError(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { data } = await API.post('/auth/find-account', { firstName: first.trim(), lastName: last.trim() });
      setResult(data);
    } catch (err) {
      setError({ form: err.response?.data?.message || 'We could not find an account with that information.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="nx-login nx-help-page">
      <header className="nx-auth-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src={logo} alt={branding.siteName} /></Link>
        <Link to="/login" className="nx-signin-red-btn">Sign In</Link>
      </header>

      <main className="nx-login-main nx-help-main">
        <div className="nx-help-card">
          <h1>Forgot email or mobile number</h1>
          {result ? (
            <>
              <p className="nx-help-desc">
                We found your account. The email on file ends with <b>{result.emailMasked}</b>.
              </p>
              <p className="nx-help-desc">You can use it to <Link to="/login/help">reset your password</Link> or <Link to="/login">sign in</Link>.</p>
            </>
          ) : (
            <>
              <p className="nx-help-desc">Please provide this information to help us find your account (all fields required):</p>
              {error.form && <div className="nx-auth-error nx-auth-error-inline" role="alert">{error.form}</div>}
              <form onSubmit={find} noValidate>
                <div className={`nx-infield nx-infield-white ${error.first ? 'nx-invalid' : ''}`}>
                  <input type="text" placeholder="First name on account" value={first} onChange={(e) => setFirst(e.target.value)} />
                </div>
                <FieldError message={error.first} />
                <div className={`nx-infield nx-infield-white ${error.last ? 'nx-invalid' : ''}`}>
                  <input type="text" placeholder="Last name on account" value={last} onChange={(e) => setLast(e.target.value)} />
                </div>
                <FieldError message={error.last} />
                <div className={`nx-infield nx-infield-white ${error.card ? 'nx-invalid' : ''}`}>
                  <input type="text" inputMode="numeric" autoComplete="cc-number" placeholder="Credit or debit card number on file" value={cardNo} onChange={(e) => setCardNo(fmtCard(e.target.value))} />
                </div>
                <FieldError message={error.card} />
                <div className="nx-find-actions">
                  <button className="nx-btn-continue nx-btn-inline" disabled={busy}>{busy ? 'Searching…' : 'Find Account'}</button>
                  <Link to="/login" className="nx-btn-cancel">Cancel</Link>
                </div>
              </form>
            </>
          )}
        </div>
        <p className="nx-captcha-note">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
      </main>
      <AuthFooter />
    </div>
  );
}

