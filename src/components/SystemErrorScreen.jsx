import useBranding from '../hooks/useBranding';

export default function SystemErrorScreen({ error, onRetry }) {
  const branding = useBranding();
  // The real reason, shown so a crash is diagnosable without opening devtools. Trimmed
  // and defaulted because React errors stringify to a long "Minified React error #NNN".
  const reason = String(error?.message || '').replace(/^Minified React error #\d+:?/, '').trim();

  return (
    <main className="system-error-screen">
      <header className="system-error-header">
        <a href="/" aria-label={`${branding.siteName} home`}>
          <img src={branding.logoUrl || '/newflix.png'} alt={branding.siteName} />
        </a>
      </header>
      <section className="system-error-content" aria-labelledby="system-error-title">
        <div className="system-error-message">
          <h1 id="system-error-title">Something went wrong</h1>
          <p>Sorry, we&apos;re having trouble with your request. You&apos;ll find lots to explore on the home page.</p>
          {reason && <p className="system-error-reason">{reason}</p>}
          <div className="system-error-actions">
            {onRetry && (
              <button type="button" className="system-error-retry" onClick={onRetry}>Try again</button>
            )}
            <a className="system-error-home" href="/">{branding.siteName} Home</a>
            <a className="system-error-help" href="/p/help-center">Learn More</a>
          </div>
          <p className="system-error-code"><span>Error Code</span> NSES-500</p>
        </div>
      </section>
    </main>
  );
}