import { useEffect, useState } from 'react';
import useBranding from '../hooks/useBranding';

export default function SplashScreen() {
  const branding = useBranding();
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exitDelay = reducedMotion ? 350 : 2350;
    const removeDelay = reducedMotion ? 700 : 2850;
    const exitTimer = window.setTimeout(() => setExiting(true), exitDelay);
    const removeTimer = window.setTimeout(() => setVisible(false), removeDelay);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`brand-splash${exiting ? ' is-exiting' : ''}`} aria-hidden="true">
      <div className="brand-splash-mark">
        {Array.from(branding.siteName || 'Newflix').map((letter, index) => (
          <span className="brand-splash-letter" key={`${letter}-${index}`} style={{ '--letter-index': index }}>
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        ))}
      </div>
      <span className="brand-splash-light" />
    </div>
  );
}