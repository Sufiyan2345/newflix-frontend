import { useEffect, useState } from 'react';
import splashVideo from '../../netflix.mp4';

export default function SplashScreen() {
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(() => !reducedMotion);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(
      () => setExiting(true),
      reducedMotion ? 350 : 8000
    );
    return () => window.clearTimeout(fallbackTimer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!exiting) return undefined;
    const removeTimer = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(removeTimer);
  }, [exiting]);

  if (!visible) return null;

  return (
    <div className={`brand-splash${exiting ? ' is-exiting' : ''}`} aria-hidden="true">
      <video
        className="brand-splash-video"
        src={splashVideo}
        autoPlay={!reducedMotion}
        muted
        playsInline
        preload="auto"
        onEnded={() => setExiting(true)}
        onError={() => setExiting(true)}
      />
    </div>
  );
}