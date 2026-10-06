import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

/* ============================================================================
   /finish-signup — where the red "Create Your Account" button in the REAL
   sign-up email lands.

   The email itself is never re-drawn in the app: it is sitting in the member's
   own Gmail inbox, exactly like netflix.com. This page only finishes what the
   mailed link started — it redeems the code that rode along in the link, creates
   the passwordless account (the mail's own promise: "No password needed — use
   this email address to securely sign in anywhere") and signs the member in, so
   the next screens are the site hero and then Netflix's "Choose the plan".

   Query params (built by backend/controllers/authController.js#buildSignupLinkUrl)
     email=<address>  the address the mail was sent to
     otp=<code>       the one-time code embedded in the mailed link
   ========================================================================== */

const DEVICES_ICON = '/AAAAQIL3Poat96BIA7iKG_OciW0moFDNCGgZjfNTYH91d1RH5UzL8KA4358scHfhBA.png';

export default function MailPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { login, loadMe } = useAuth();
  const [error, setError] = useState('');

  const email = (params.get('email') || '').trim().toLowerCase();
  const otp = (params.get('otp') || '').trim();
  const redeemed = useRef(false);

  useEffect(() => { document.title = 'Newflix'; }, []);

  // Strict mode mounts this effect twice — the one-time link is redeemed once.
  useEffect(() => {
    if (redeemed.current) return;
    redeemed.current = true;
    if (!email || !otp) {
      setError('This sign-up link is incomplete. Send yourself a new one and tap the button in that email.');
      return;
    }
    (async () => {
      try {
        const { data } = await API.post('/auth/signup-link', { email, otp });
        login(data.accessToken, data.user);
        await loadMe().catch(() => {});
        // Signed in, not a member yet → the site hero, then "Choose the plan".
        nav('/', { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'We could not finish signing you up. Send yourself a new link.');
      }
    })();
  }, [email, otp, login, loadMe, nav]);

  const backToSignup = (step) => nav(
    email ? `/signup?email=${encodeURIComponent(email)}${step ? `&step=${step}` : ''}` : '/signup'
  );

  return (
    <div className="nx-signup">
      <header className="nx-signup-nav">
        <Link to="/"><img className="nx-logo nx-logo-sm" src="/newflix.png" alt="Netflix" /></Link>
        <Link to="/login" className="nx-signup-nav-link">Sign In</Link>
      </header>

      <main className="nx-signup-main">
        {error ? (
          <>
            <img className="nx-devices-ico" src={DEVICES_ICON} alt="" />
            <h1>That link didn&apos;t work</h1>
            <p className="nx-signup-sub">{error}</p>
            <button type="button" className="nx-btn-continue" onClick={() => backToSignup()}>
              Send a new link
            </button>
            {email && (
              <button type="button" className="nx-btn-gray-full" onClick={() => backToSignup('password')}>
                Create Password Instead
              </button>
            )}
            <p className="nx-otp-help">Already a member? <Link to="/login">Sign In</Link></p>
          </>
        ) : (
          <>
            <div className="sf-spinner" style={{ margin: '76px auto 10px' }} role="status" aria-label="Setting up your account" />
            <h1>Setting up your account</h1>
            <p className="nx-signup-sub">Just a moment while we check the link we sent to <b>{email}</b>&hellip;</p>
          </>
        )}
      </main>
    </div>
  );
}
