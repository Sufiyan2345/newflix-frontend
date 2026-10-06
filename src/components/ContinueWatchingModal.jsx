import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlay, IconInfo, IconClose } from './Icons';

// "20m left" — Netflix prints the remaining runtime, never a percentage.
export const fmtLeft = (seconds) => {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds / 60);
  if (total < 1) return 'under a minute left';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h > 0 ? `${h}h ${m}m` : `${m}m`} left`;
};

// "S3:E4 · Old Friends" for an episode; a plain title for a movie. A feature has
// no season/episode, and printing S1:E1 for one was the original bug. TMDB items
// arrive with a flat episode snapshot, local ones with a populated Episode whose
// season number lives one level down, so both shapes are read here.
export const resumeLine = (item) => {
  const ep = item?._episode;
  if (!ep) return item?.title || '';
  const season = ep.season?.seasonNumber ?? ep.seasonNumber;
  const code = season && ep.episodeNumber ? `S${season}:E${ep.episodeNumber}` : '';
  if (!code) return item?.title || '';
  return ep.title ? `${code} · ${ep.title}` : code;
};

const genreNames = (genres) => {
  const out = [];
  const seen = new Set();
  for (const g of (Array.isArray(genres) ? genres : [])) {
    const name = typeof g === 'string' ? g : (g && (g.name || g._id));
    if (!name || seen.has(String(name))) continue;
    seen.add(String(name));
    out.push(name);
  }
  return out.slice(0, 3);
};

// Where "Resume" must land so playback picks up at the stored position.
//
//  * TMDB history rows carry the exact `watchRoute` the server built
//    (/watch/tmdb/<id>?season=&episode= or ?type=movie).
//  * A local title opens /watch/<id>; the player reads the same WatchHistory row
//    server-side and resumes by itself, so no timestamp has to be passed here.
//  * A TMDB row with no stored route has nowhere to resume to — those fall back
//    to the detail modal, which can pick an episode first.
export const resumeRouteFor = (item) => {
  const isTmdb = String(item?._id || '').startsWith('tmdb-');
  if (isTmdb) return item.watchRoute || null;
  return item?._id ? `/watch/${item._id}` : null;
};

// Netflix's Continue Watching detail sheet.
//
// Clicking a Continue Watching tile used to jump straight into the player, which
// dropped the viewer into fullscreen video with no context and no way back to the
// row. Clicking now opens THIS sheet instead: the artwork, exactly where they
// left off ("S2:E3 · The Red Wedding", 22m left, the red progress bar) and the
// synopsis, with an explicit Resume button. Resuming is still one click — the
// sheet decides WHERE it goes, and the viewer chooses to play.
export default function ContinueWatchingModal({ item, onClose }) {
  const nav = useNavigate();
  const closeRef = useRef(null);
  const resume = item?._resume || null;
  const isTmdb = String(item?._id || '').startsWith('tmdb-');

  const art = item?.bannerUrl || item?.posterUrl || '';
  const year = item?.releaseYear || String(item?.releaseDate || '').slice(0, 4);
  const genres = genreNames(item?.genres);
  const durationSeconds = Number(resume?.durationSeconds) || 0;
  const progressSeconds = Number(resume?.progressSeconds) || 0;
  const pct = durationSeconds > 0
    ? Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100))
    : 0;
  const left = fmtLeft(durationSeconds - progressSeconds);
  const resumeRoute = resumeRouteFor(item);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    // Lock the page behind the sheet so the rails do not scroll under it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!item) return null;

  const openDetails = () => {
    onClose?.();
    if (isTmdb) { window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item })); return; }
    if (item.slug) nav(`/title/${item.slug}`);
  };

  const play = () => {
    // Nothing to resume to (a TMDB row with no stored route) — the detail sheet
    // is the only place that can pick an episode first.
    if (!resumeRoute) { openDetails(); return; }
    onClose?.();
    nav(resumeRoute);
  };

  return (
    <div
      className="cwm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Continue watching ${item.title || ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="cwm">
        <div className="cwm-art">
          {art ? (
            <img src={art} alt={item.title || ''} />
          ) : (
            <div className="cwm-art-empty">{item.title || 'Continue watching'}</div>
          )}
          <div className="cwm-shade" />
          <button type="button" className="cwm-close" onClick={onClose}
            title="Close" aria-label="Close" ref={closeRef}>
            <IconClose size={22} />
          </button>
        </div>

        <div className="cwm-body">
          <div className="cwm-episode">{resumeLine(item)}</div>
          <h2 className="cwm-title">{item.title}</h2>

          <div className="cwm-meta">
            {item.ageRating && <span className="cwm-age">{item.ageRating}</span>}
            {year && <span>{year}</span>}
            {genres.map((g) => <span key={g}>{g}</span>)}
          </div>

          {pct > 0 && (
            <div className="cwm-progress">
              <div className="cwm-progress-track"><span style={{ width: `${pct}%` }} /></div>
              {left && <span className="cwm-left">{left}</span>}
            </div>
          )}

          {item.description && <p className="cwm-desc">{item.description}</p>}

          <div className="cwm-actions">
            <button type="button" className="btn-white play-action" onClick={play}>
              <IconPlay size={22} /> {resumeRoute ? 'Resume' : 'Play'}
            </button>
            <button type="button" className="btn-gray" onClick={openDetails}>
              <IconInfo size={20} /> More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
