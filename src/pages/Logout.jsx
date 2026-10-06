import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFooter from '../components/AuthFooter';

export default function Logout() {
  const nav = useNavigate();
  const [seconds, setSeconds] = useState(30);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!seconds) {
      nav('/login', { replace: true });
      return undefined;
    }
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds, nav]);

  const goNow = () => {
    setBusy(true);
    nav('/login', { replace: true });
  };

  return (
    <div className="nx-logout-page">
      <div className="nx-logout-art" aria-hidden="true" />
      <header className="nx-logout-nav">
        <Link to="/" className="nx-logout-home" aria-label="Netflix home">
          <img className="nx-logout-logo" src="/newflix.png" alt="Netflix" />
        </Link>
        <Link to="/login" className="nx-signin-red-btn">Sign In</Link>
      </header>

      <main className="nx-logout-main">
        <section className="nx-logout-card" aria-labelledby="logout-title">
          <h1 id="logout-title">Leaving So Soon?</h1>
          <p>Just so you know, you don’t always need to sign out of Netflix. It’s only necessary if you’re on a shared or public computer.</p>
          <p>You’ll be redirected to Netflix.com in {seconds} seconds.</p>
          <button type="button" className="nx-logout-go" onClick={goNow} disabled={busy}>
            {busy ? <span className="nx-btn-spinner" aria-label="Loading" /> : 'Go Now'}
          </button>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
